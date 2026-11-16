import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./components/Icon";
import GarmentCard from "./components/GarmentCard";
import Modal from "./components/Modal";
import UploadDialog from "./components/UploadDialog";
import WeatherDialog from "./components/WeatherDialog";
import FittingRoom from "./components/FittingRoom";
import FittingStage from "./components/FittingStage";
import { useTryOn } from "./lib/useTryOn";
import { useInputModality } from "./lib/useInputModality";
import { STATIC_DEMO, createId } from "./lib/runtime.js";
import {
  categories,
  moods,
  occasions,
  conditions,
  demoGarments,
  initialState,
} from "./lib/data";
import { readWorkspace, writeWorkspace } from "./lib/storage";
import { recommendOutfit, toggleGarment } from "./lib/recommend";

function SectionLabel({ number, children, aside }) {
  return (
    <div className="section-label">
      <span className="section-number">{number}</span>
      <h2>{children}</h2>
      {aside && <span className="section-aside">{aside}</span>}
    </div>
  );
}

function CategoryTabs({ category, setCategory, compact = false }) {
  return (
    <div
      className={`category-tabs ${compact ? "compact" : ""}`}
      role="group"
      aria-label="衣物分类"
    >
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setCategory(c.id)}
          aria-pressed={category === c.id}
          className={category === c.id ? "active" : ""}
        >
          {!compact && <Icon name={c.icon} size={18} />}
          <span>{c.label}</span>
        </button>
      ))}
    </div>
  );
}

function ContextPanel({
  state,
  patch,
  onWeather,
  onRecommend,
  onUpload,
  photo,
}) {
  const mood = moods.find((m) => m.id === state.mood);
  const weather = conditions.find((c) => c.id === state.weather.condition);
  return (
    <aside className="context-panel" aria-label="今日搭配偏好">
      <div className="personal-note">
        <span className="eyebrow">A LITTLE MOMENT FOR YOU</span>
        <p>
          美好的一天，
          <br />
          从喜欢的自己开始。
        </p>
        <span className="note-flower">
          <Icon name="flower" size={39} />
        </span>
      </div>
      <section className="mood-section">
        <SectionLabel number="01">今天的心情</SectionLabel>
        <div className="mood-grid">
          {moods.map((m) => (
            <button
              key={m.id}
              className={`mood-button ${state.mood === m.id ? "selected" : ""}`}
              onClick={() => patch({ mood: m.id })}
              aria-pressed={state.mood === m.id}
            >
              <Icon name={m.icon} size={22} />
              <span>{m.label}</span>
              {state.mood === m.id && (
                <span className="mood-check">
                  <Icon name="check" size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
      <section className="weather-section">
        <SectionLabel number="02">窗外的天气</SectionLabel>
        <button
          className="weather-card"
          onClick={onWeather}
          aria-label="编辑今天的天气"
        >
          <div className="weather-location">
            <span>
              <Icon name="pin" size={13} />
              {state.weather.city}
            </span>
            <span>
              编辑 <Icon name="arrow-up-right" size={13} />
            </span>
          </div>
          <div className="weather-main">
            <strong>
              {state.weather.temperature}
              <sup>°</sup>
            </strong>
            <div>
              <Icon name={weather.icon} size={37} />
              <span>{weather.label}</span>
            </div>
          </div>
          <p>
            {state.weather.temperature < 15
              ? "有些凉意，记得多一层温暖"
              : state.weather.temperature > 25
                ? "轻盈透气，迎接今天的阳光"
                : "微风不燥，适合轻柔的层次"}
          </p>
          <span className="weather-source">{state.weather.source}</span>
        </button>
      </section>
      <section className="occasion-section">
        <SectionLabel number="03">今天去哪里</SectionLabel>
        <div className="select-wrap">
          <Icon name="coffee" size={17} />
          <select
            aria-label="今天的场合"
            value={state.occasion}
            onChange={(e) => patch({ occasion: e.target.value })}
          >
            {occasions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <Icon name="down" size={15} />
        </div>
      </section>
      <button className="button primary recommend-button" onClick={onRecommend}>
        <Icon name="sparkles" size={18} />
        <span>为我搭配今天</span>
        <Icon name="arrow" size={17} />
      </button>
      <p className="recommend-caption">从心情出发，让衣橱更懂你</p>
      <button className="person-upload" onClick={onUpload}>
        {photo ? (
          <img src={photo.image} alt="我的照片" />
        ) : (
          <span className="upload-person-icon">
            <Icon name="user" size={23} />
          </span>
        )}
        <span>
          <strong>{photo ? "我的专属模特" : "让主角，成为你"}</strong>
          <small>{photo ? "已上传全身照 · 点击更换" : "上传我的全身照"}</small>
        </span>
        <Icon name="plus" size={17} />
      </button>
      <span className="sr-only">{mood.note}</span>
    </aside>
  );
}

function RecommendationNote({ result, onDismiss }) {
  if (!result) return null;
  return (
    <div className="recommendation-note" role="status">
      <span className="recommendation-icon">
        <Icon name="sparkles" size={19} />
      </span>
      <div>
        <strong>{result.title}</strong>
        <p>{result.reason}</p>
        {result.missing.length > 0 && (
          <p className="missing-note">
            还缺少：{result.missing.join("、")}。上传后可获得更完整的搭配。
          </p>
        )}
      </div>
      <button
        className="icon-button"
        onClick={onDismiss}
        aria-label="收起搭配说明"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export default function App() {
  useInputModality();
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState("studio");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [modal, setModal] = useState(null);
  const [view, setView] = useState("person");
  const [zoom, setZoom] = useState(false);
  const [sceneReset, setSceneReset] = useState(0);
  const [result, setResult] = useState(null);
  const [toast, setToastState] = useState(null);
  const setToast = (text) => setToastState(text ? { text } : null);
  const [storageError, setStorageError] = useState("");
  const variation = useRef(0);
  useEffect(() => {
    let live = true;
    readWorkspace()
      .then((saved) => {
        if (live && saved) setState({ ...initialState, ...saved });
      })
      .catch(() => {
        if (live)
          setStorageError("当前浏览器无法读取本地衣橱，请使用普通浏览模式。");
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(
      () =>
        writeWorkspace(state)
          .then(() => setStorageError(""))
          .catch(() =>
            setStorageError(
              "本地保存失败，可能是存储空间不足。请保留此页面并稍后重试。",
            ),
          ),
      250,
    );
    return () => clearTimeout(timer);
  }, [state, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToastState(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const garments = useMemo(
    () => [...state.garments, ...demoGarments],
    [state.garments],
  );
  const selected = useMemo(
    () =>
      state.selected
        .map((id) => garments.find((g) => g.id === id))
        .filter(Boolean),
    [state.selected, garments],
  );
  const tryOn = useTryOn(state.photo, selected, ready);
  const mood = moods.find((m) => m.id === state.mood) || moods[0];
  const visible = garments.filter(
    (g) =>
      (category === "all" || g.category === category) &&
      (source === "all" || g.source === "user"),
  );
  const patch = (data) => {
    setState((s) => ({ ...s, ...data }));
    setResult(null);
    variation.current = 0;
  };
  function choose(item) {
    setState((s) => ({
      ...s,
      selected: toggleGarment(s.selected, item, garments),
    }));
    setResult(null);
    setView("person");
    tryOn.request();
  }
  function recommend() {
    const pool = source === "user" ? state.garments : garments;
    const next = recommendOutfit(pool, state, variation.current++);
    setState((s) => ({ ...s, selected: next.ids }));
    setResult(next);
    if (page !== "studio") setPage("studio");
    setView("person");
    tryOn.request();
  }
  async function saveUpload(item) {
    const isPerson = modal.type === "person";
    const nextGarments = isPerson
      ? state.garments
      : [item, ...state.garments.filter((g) => g.id !== item.id)];
    const nextSelected =
      !isPerson && state.selected.includes(item.id)
        ? toggleGarment(
            state.selected.filter((id) => id !== item.id),
            item,
            [...nextGarments, ...demoGarments],
          )
        : state.selected;
    const next = isPerson
      ? { ...state, photo: item }
      : { ...state, garments: nextGarments, selected: nextSelected };
    await writeWorkspace(next);
    setState(next);
    setModal(null);
    setToast(
      isPerson
        ? "照片已保存，你就是衣橱的主角。"
        : "已收进衣橱，现在可以用它搭配了。",
    );
    if (!isPerson) {
      setCategory(item.category);
      setSource("all");
      setResult(null);
    }
  }
  function removeUpload() {
    if (modal.type === "person") {
      patch({ photo: null });
      setToast("照片已移除，已恢复示例人物。");
    } else {
      const id = modal.item.id;
      patch({
        garments: state.garments.filter((g) => g.id !== id),
        selected: state.selected.filter((x) => x !== id),
      });
      setToast("衣物已从本地衣橱移除。");
    }
    setModal(null);
  }
  function saveOutfit() {
    if (!selected.length) return;
    const ids = [...state.selected].sort().join(",");
    if (state.saved.some((s) => [...s.items].sort().join(",") === ids)) {
      setToast("这套搭配已经在收藏里啦。");
      return;
    }
    setModal({ type: "save" });
  }
  function confirmSave(e) {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name").trim();
    if (!name) return;
    const outfit = {
      id: createId(),
      name,
      items: state.selected,
      mood: state.mood,
      weather: state.weather,
      occasion: state.occasion,
      date: new Date().toISOString(),
    };
    setState((s) => ({ ...s, saved: [outfit, ...s.saved] }));
    setModal(null);
    setToast("搭配已收藏，下次的灵感有着落了。");
  }
  function restore(outfit) {
    const ids = outfit.items.filter((id) => garments.some((g) => g.id === id));
    patch({ selected: ids, mood: outfit.mood, occasion: outfit.occasion });
    setPage("studio");
    setView("person");
    tryOn.request();
    setToast(
      ids.length < outfit.items.length
        ? "搭配已恢复，已删除的衣物已略过。"
        : "已恢复这套搭配，今天的天气保持不变。",
    );
  }
  function reset() {
    patch({ selected: [] });
    setView("person");
    setZoom(false);
    setSceneReset((n) => n + 1);
    setToast("画板已清空，重新挑一件心动的吧。");
  }
  const go = (next) => {
    setPage(next);
    setCategory("all");
  };
  return (
    <div className={`app-shell ${page === "studio" ? "immersive-shell" : ""}`}>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => go("studio")}
          aria-label="女神衣橱首页"
        >
          <span className="brand-symbol">
            m<span>✳</span>
          </span>
          <span className="brand-copy">
            <strong>女神衣橱</strong>
            <small>MUSE WARDROBE</small>
          </span>
        </button>
        <nav className="main-nav" aria-label="主导航">
          {[
            { id: "studio", label: "搭配工作室" },
            { id: "wardrobe", label: "我的衣橱" },
            { id: "saved", label: "搭配收藏" },
          ].map((p) => (
            <button
              key={p.id}
              className={page === p.id ? "active" : ""}
              aria-current={page === p.id ? "page" : undefined}
              onClick={() => go(p.id)}
            >
              {p.label}
              {p.id === "saved" && state.saved.length > 0 && (
                <span className="nav-count">{state.saved.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className="header-motto">A wardrobe that feels like you.</span>
          <button
            className="profile-button"
            onClick={() => setModal({ type: "person" })}
            aria-label="上传或管理我的全身照"
          >
            {state.photo ? (
              <img src={state.photo.image} alt="" />
            ) : (
              <Icon name="user" size={18} />
            )}
          </button>
        </div>
      </header>
      <main id="main-content" aria-busy={!ready}>
        <div className="workspace-heading">
          <div className="breadcrumb">
            <span>我的私人衣橱</span>
            <Icon name="right" size={12} />
            <strong>
              {page === "studio"
                ? "搭配工作室"
                : page === "wardrobe"
                  ? "所有单品"
                  : "搭配收藏"}
            </strong>
          </div>
          <span className="today-label">
            <span className="tiny-star">✳</span> 每一天，都有新灵感{" "}
            <span className="date-label">
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
              })
                .format(new Date())
                .toUpperCase()}
            </span>
          </span>
        </div>
        {storageError && (
          <div className="storage-error" role="alert">
            {storageError}
            <button
              onClick={() =>
                writeWorkspace(state)
                  .then(() => setStorageError(""))
                  .catch(() => setToast("仍无法保存，请检查浏览器存储设置。"))
              }
            >
              重试保存
            </button>
          </div>
        )}
        {page === "studio" ? (
          <div className="studio-grid">
            <FittingRoom
              image={tryOn.displayImage}
              transparent={tryOn.displayTransparent}
              zoom={zoom}
              resetKey={sceneReset}
              flatlay={view === "flatlay"}
            />
            <ContextPanel
              state={state}
              patch={patch}
              onWeather={() => setModal({ type: "weather" })}
              onRecommend={recommend}
              onUpload={() => setModal({ type: "person" })}
              photo={state.photo}
            />
            <div className="stage-column">
              <FittingStage
                selected={selected}
                view={view}
                setView={setView}
                zoom={zoom}
                setZoom={setZoom}
                onUpload={() => setModal({ type: "person" })}
                onReset={reset}
                tryOn={tryOn}
              />
              <RecommendationNote
                result={result}
                onDismiss={() => setResult(null)}
              />
            </div>
            <aside className="wardrobe-panel" aria-label="衣物选择">
              <div className="wardrobe-heading">
                <div>
                  <span className="eyebrow">CURATED BY YOU</span>
                  <h2>
                    我的衣橱
                    <span>{garments.length.toString().padStart(2, "0")}</span>
                  </h2>
                </div>
                <button
                  className="icon-button add-garment"
                  onClick={() => setModal({ type: "garment" })}
                  aria-label="上传新衣物"
                >
                  <Icon name="plus" />
                </button>
              </div>
              <button
                className="upload-garment"
                onClick={() => setModal({ type: "garment" })}
              >
                <Icon name="upload" size={17} />
                <strong>添加我的衣服</strong>
                <span>上传平铺图</span>
              </button>
              <CategoryTabs
                category={category}
                setCategory={setCategory}
                compact
              />
              <div className="wardrobe-filter">
                <span>{visible.length} 件单品 · 点击搭配</span>
                <select
                  aria-label="衣物来源"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setResult(null);
                    variation.current = 0;
                  }}
                >
                  <option value="all">全部衣物</option>
                  <option value="user">我的上传</option>
                </select>
              </div>
              <div className="garment-grid">
                {visible.map((item) => (
                  <GarmentCard
                    key={item.id}
                    item={item}
                    selected={state.selected.includes(item.id)}
                    onSelect={choose}
                  />
                ))}
                {!visible.length && (
                  <div className="empty-wardrobe">
                    <Icon name="shirt" size={32} />
                    <strong>留一个位置，给喜欢的衣服</strong>
                    <p>
                      {source === "user"
                        ? "你的上传会出现在这里"
                        : "这个分类还没有衣物"}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setModal({ type: "garment" })}
                    >
                      上传第一件
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                )}
              </div>
              <div className="outfit-tray">
                <div className="outfit-tray-heading">
                  <strong>
                    今日搭配 <span>{selected.length} 件</span>
                  </strong>
                  <button
                    className="text-button"
                    onClick={() => setView("flatlay")}
                  >
                    查看画板
                    <Icon name="arrow-up-right" size={13} />
                  </button>
                </div>
                <div className="selected-items">
                  {selected.length ? (
                    selected.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => choose(item)}
                        aria-label={`从搭配中移除${item.name}`}
                      >
                        <img src={item.image} alt={item.name} />
                        <span>
                          <Icon name="close" size={10} />
                        </span>
                      </button>
                    ))
                  ) : (
                    <p>把喜欢的单品，搭在一起。</p>
                  )}
                </div>
                <button
                  className="button save-button"
                  onClick={saveOutfit}
                  disabled={!selected.length}
                >
                  <Icon name="heart" size={17} />
                  收藏这套搭配
                  <Icon name="arrow-up-right" size={17} />
                </button>
              </div>
            </aside>
          </div>
        ) : page === "wardrobe" ? (
          <section className="collection-page">
            <div className="collection-heading">
              <div>
                <span className="eyebrow">
                  LESS CLOTHES. MORE POSSIBILITIES.
                </span>
                <h1>每件衣服，都有新的可能。</h1>
                <p>
                  {state.garments.length} 件我的单品，和 {demoGarments.length}{" "}
                  件灵感示例。点击单品加入今日搭配。
                </p>
              </div>
              <button
                className="button primary"
                onClick={() => setModal({ type: "garment" })}
              >
                <Icon name="plus" size={18} />
                添加我的衣服
              </button>
            </div>
            <div className="collection-toolbar">
              <CategoryTabs category={category} setCategory={setCategory} />
              <select
                aria-label="衣物来源"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="all">全部衣物</option>
                <option value="user">我的上传</option>
              </select>
            </div>
            <div className="collection-grid">
              {visible.map((item) => (
                <GarmentCard
                  key={item.id}
                  item={item}
                  selected={state.selected.includes(item.id)}
                  onSelect={choose}
                  onEdit={(item) => setModal({ type: "garment", item })}
                />
              ))}
            </div>
            {!visible.length && (
              <div className="large-empty">
                <Icon name="shirt" size={42} />
                <h2>你的风格，从第一件开始。</h2>
                <p>上传衣服平铺图，让熟悉的衣服搭出新鲜感。</p>
                <button
                  className="button primary"
                  onClick={() => setModal({ type: "garment" })}
                >
                  上传我的衣服
                  <Icon name="plus" size={17} />
                </button>
              </div>
            )}
            <div className="collection-bottom">
              <span>已选 {selected.length} 件单品</span>
              <button
                className="button secondary"
                onClick={() => {
                  setPage("studio");
                  setView("flatlay");
                }}
              >
                回到搭配工作室
                <Icon name="arrow" size={17} />
              </button>
            </div>
          </section>
        ) : (
          <section className="collection-page">
            <div className="collection-heading">
              <div>
                <span className="eyebrow">GOOD OUTFITS, KEPT CLOSE.</span>
                <h1>把喜欢的自己，收藏起来。</h1>
                <p>留住那些「今天穿得真好看」的瞬间。</p>
              </div>
              <span className="collection-total">
                {state.saved.length.toString().padStart(2, "0")}{" "}
                <small>LOOKS</small>
              </span>
            </div>
            {state.saved.length ? (
              <div className="saved-grid">
                {state.saved.map((outfit) => (
                  <article className="saved-card" key={outfit.id}>
                    <button
                      className="saved-preview"
                      onClick={() => restore(outfit)}
                      aria-label={`恢复搭配：${outfit.name}`}
                    >
                      {outfit.items
                        .map((id) => garments.find((g) => g.id === id))
                        .filter(Boolean)
                        .map((item) => (
                          <img key={item.id} src={item.image} alt={item.name} />
                        ))}
                      <span>
                        再穿这套
                        <Icon name="arrow-up-right" size={18} />
                      </span>
                    </button>
                    <div className="saved-title">
                      <h2>{outfit.name}</h2>
                      <button
                        className="icon-button"
                        aria-label={`删除收藏：${outfit.name}`}
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            saved: s.saved.filter((x) => x.id !== outfit.id),
                          }));
                          setToast("已移除这套收藏，衣物仍在衣橱里。");
                        }}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                    <p>
                      {moods.find((m) => m.id === outfit.mood)?.label} ·{" "}
                      {outfit.occasion}
                      <span>
                        {new Date(outfit.date).toLocaleDateString("zh-CN")}
                      </span>
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="large-empty saved-empty">
                <Icon name="heart" size={45} />
                <h2>第一套心动搭配，等你收藏。</h2>
                <p>在工作室挑选喜欢的单品，点击「收藏这套搭配」。</p>
                <button className="button primary" onClick={() => go("studio")}>
                  去发现今天的自己
                  <Icon name="arrow" size={17} />
                </button>
              </div>
            )}
          </section>
        )}
      </main>
      <footer className="site-footer">
        <span>
          <Icon name="flower" size={15} /> 不止搭配衣服，更是照顾自己的方式。
        </span>
        <span>
          <Icon name="lock" size={12} />
          {STATIC_DEMO
            ? "衣橱保存在本机 · 内置预生成示例"
            : "衣橱保存在本机 · 试穿由图像模型生成"}{" "}
          <i /> MADE FOR YOUR EVERYDAY
        </span>
      </footer>
      {modal?.type === "person" && (
        <UploadDialog
          type="person"
          item={state.photo}
          onClose={() => setModal(null)}
          onSave={saveUpload}
          onRemove={state.photo ? removeUpload : undefined}
        />
      )}
      {modal?.type === "garment" && (
        <UploadDialog
          type="garment"
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={saveUpload}
          onRemove={modal.item ? removeUpload : undefined}
        />
      )}
      {modal?.type === "weather" && (
        <WeatherDialog
          weather={state.weather}
          onClose={() => setModal(null)}
          onSave={(weather) => {
            patch({ weather });
            setModal(null);
            setToast("天气已更新，试试为今天重新搭配。");
          }}
        />
      )}
      {modal?.type === "save" && (
        <Modal
          title="留住今天的灵感。"
          eyebrow="SAVE YOUR LOOK"
          onClose={() => setModal(null)}
        >
          <form onSubmit={confirmSave}>
            <div className="save-preview">
              {selected.map((item) => (
                <img key={item.id} src={item.image} alt={item.name} />
              ))}
            </div>
            <label className="field">
              给这套搭配取个名字
              <input
                name="name"
                required
                maxLength={36}
                defaultValue={`${mood.short}的${state.occasion === "通勤上班" ? "通勤日" : "一天"}`}
                autoFocus
              />
            </label>
            <p className="privacy-note">
              {selected.length} 件单品 · {mood.label} ·{" "}
              {state.weather.temperature}°C
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setModal(null)}
              >
                取消
              </button>
              <button className="button primary">
                <Icon name="heart" size={17} />
                保存搭配
              </button>
            </div>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          <span>{toast.text}</span>
          <button
            onClick={() => setToast("")}
            className="icon-button"
            aria-label="关闭提示"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
