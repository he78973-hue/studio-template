import { useRef, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { categories, colors, moods, occasions } from "../lib/data";
import { prepareImage } from "../lib/storage";
import { STATIC_DEMO, createId } from "../lib/runtime.js";

export default function UploadDialog({
  type,
  item,
  onClose,
  onSave,
  onRemove,
}) {
  const person = type === "person";
  const input = useRef(null);
  const [image, setImage] = useState(item?.image || "");
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "top");
  const [color, setColor] = useState(item?.color || "beige");
  const [warmth, setWarmth] = useState(item?.warmth || 2);
  const [mood, setMood] = useState(item?.moods?.[0] || "calm");
  const [occasion, setOccasion] = useState(item?.occasions?.[0] || "日常出门");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  async function accept(file) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setImage(await prepareImage(file));
      if (!person && !name)
        setName(file.name.replace(/\.[^.]+$/, "").slice(0, 32));
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function submit(e) {
    e.preventDefault();
    if (!image) {
      setError("先选择一张照片，再保存。");
      return;
    }
    if (!person && !name.trim()) {
      setError("给这件衣服取一个名字吧。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(
        person
          ? { image }
          : {
              id: item?.id || createId(),
              image,
              name: name.trim(),
              category,
              color,
              warmth: Number(warmth),
              moods: [mood],
              occasions: [occasion],
              source: "user",
            },
      );
    } catch (error) {
      setError("保存失败，设备存储可能已满，请重试。");
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        person
          ? "把你自己，带进衣橱。"
          : item
            ? "编辑这件衣服"
            : "把喜欢，收进衣橱。"
      }
      eyebrow={person ? "YOUR PERSONAL MUSE" : "ADD TO YOUR WARDROBE"}
      onClose={onClose}
    >
      <p className="modal-description">
        {person
          ? "上传一张清晰的正面全身照，开始建立属于你的搭配画板。"
          : "上传衣服平铺图，补充几个小标签，让推荐更懂你的衣橱。"}
      </p>
      <form onSubmit={submit}>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="photo-file"
          aria-label={person ? "选择全身照片" : "选择衣物平铺图"}
          onChange={(e) => accept(e.target.files[0])}
        />
        <button
          type="button"
          className={`dropzone ${image ? "has-image" : ""} ${dragging ? "dragging" : ""}`}
          onClick={() => input.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
          }}
        >
          {image ? (
            <>
              <img src={image} alt="待保存的照片预览" />
              <span className="replace-image">
                <Icon name="camera" size={16} /> 点击更换照片
              </span>
            </>
          ) : (
            <>
              <span className="drop-icon">
                <Icon name="image-plus" size={30} />
              </span>
              <strong>
                {busy ? "正在读取照片…" : "点击上传，或把照片拖到这里"}
              </strong>
              <span>JPG / PNG / WebP · 最大 10 MB</span>
            </>
          )}
        </button>
        {!person && (
          <div className="form-grid">
            <label className="field full-field">
              衣物名称
              <input
                required
                maxLength={32}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：我最爱的燕麦色毛衣"
              />
            </label>
            <label className="field">
              衣物分类
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories
                  .filter((c) => c.id !== "all")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              主要颜色
              <select value={color} onChange={(e) => setColor(e.target.value)}>
                {colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              适合的温度
              <select
                value={warmth}
                onChange={(e) => setWarmth(e.target.value)}
              >
                <option value="1">轻薄 · 温暖天气</option>
                <option value="2">适中 · 春秋微凉</option>
                <option value="3">保暖 · 寒冷天气</option>
              </select>
            </label>
            <label className="field">
              风格心情
              <select value={mood} onChange={(e) => setMood(e.target.value)}>
                {moods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field full-field">
              适合的场合
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              >
                {occasions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <p className="privacy-note">
          <Icon name="lock" size={14} />
          {STATIC_DEMO
            ? "静态演示中照片仅保存在本机；新照片的 AI 换装需运行源码并配置图像服务。"
            : person
              ? "照片保存在本机；点击试穿时会发送给图像模型，生成真实上身效果。"
              : "衣橱与标签保存在本机；试穿时会将衣物图发送给图像模型。"}
        </p>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {onRemove && (
            <button
              type="button"
              className="text-button danger"
              onClick={onRemove}
            >
              <Icon name="trash" size={16} />
              {person ? "移除照片" : "删除衣物"}
            </button>
          )}
          <button type="button" className="button secondary" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "正在处理…" : person ? "使用这张照片" : "收进我的衣橱"}
            <Icon name="arrow" size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
