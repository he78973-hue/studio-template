import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { conditions } from "../lib/data";

export default function WeatherDialog({ weather, onClose, onSave }) {
  const [value, setValue] = useState(weather);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  function update(key, data) {
    // Manual edits supersede an in-flight lookup, including a response whose
    // body has already arrived. It must not write the previous city back.
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setValue((v) => ({
      ...v,
      [key]: data,
      source: "手动设置",
      updated: undefined,
    }));
    setError("");
  }
  async function lookup() {
    if (!value.city.trim()) {
      setError("请输入城市名称。");
      return;
    }
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const timer = setTimeout(() => request.abort(), 12000);
    setBusy(true);
    setError("");
    try {
      const names = {
        上海: "Shanghai",
        北京: "Beijing",
        杭州: "Hangzhou",
        深圳: "Shenzhen",
        广州: "Guangzhou",
        成都: "Chengdu",
      };
      const city = names[value.city.trim()] || value.city.trim();
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
        { signal: request.signal },
      );
      if (!geo.ok) throw new Error("天气服务暂时不可用，可以手动设置。");
      const place = (await geo.json()).results?.[0];
      if (!place) throw new Error("没有找到这个城市，请尝试完整名称或拼音。");
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`,
        { signal: request.signal },
      );
      if (!response.ok) throw new Error("暂时无法获取天气，请手动设置。");
      const current = (await response.json()).current;
      if (controller.current !== request || request.signal.aborted) return;
      if (!current || !Number.isFinite(current.temperature_2m))
        throw new Error("天气数据不完整，请手动设置。");
      const code = current.weather_code;
      const condition =
        (code >= 71 && code <= 77) || code === 85 || code === 86
          ? "snowy"
          : code >= 51
            ? "rainy"
            : code === 0
              ? "sunny"
              : "cloudy";
      setValue({
        city: place.name,
        temperature: Math.round(current.temperature_2m),
        condition,
        source: "Open-Meteo",
        updated: current.time,
      });
    } catch (error) {
      if (controller.current === request)
        setError(
          error.name === "AbortError"
            ? "请求超时，请重试或手动填写天气。"
            : error.message,
        );
    } finally {
      clearTimeout(timer);
      if (controller.current === request) setBusy(false);
    }
  }
  return (
    <Modal
      title="看看今天的天气。"
      eyebrow="DRESS FOR THE DAY"
      onClose={onClose}
    >
      <p className="modal-description">
        根据体感调整温度，也可以查询你所在城市的实时天气。
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...value,
            city: value.city.trim(),
            temperature: Number(value.temperature),
          });
        }}
      >
        <div className="field">
          <label htmlFor="weather-city">所在城市</label>
          <div className="input-action">
            <input
              id="weather-city"
              required
              maxLength={50}
              value={value.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="输入城市名称"
            />
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={lookup}
            >
              <Icon name="refresh" size={16} />
              {busy ? "查询中…" : "获取天气"}
            </button>
          </div>
        </div>
        <label className="field temperature-field">
          当前温度{" "}
          <div className="temperature-input">
            <input
              required
              type="number"
              min="-50"
              max="55"
              value={value.temperature}
              onChange={(e) => update("temperature", e.target.value)}
            />
            <span>°C</span>
          </div>
        </label>
        <div className="weather-options" role="group" aria-label="天气状况">
          {conditions.map((c) => (
            <button
              type="button"
              key={c.id}
              className={value.condition === c.id ? "selected" : ""}
              aria-pressed={value.condition === c.id}
              onClick={() => update("condition", c.id)}
            >
              <Icon name={c.icon} size={25} />
              {c.label}
            </button>
          ))}
        </div>
        <p className="privacy-note">
          <Icon name="info" size={14} />
          数据来源：{value.source}
          {value.updated ? ` · ${value.updated.replace("T", " ")}` : ""}
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy}>
            用这个天气搭配
            <Icon name="arrow" size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
