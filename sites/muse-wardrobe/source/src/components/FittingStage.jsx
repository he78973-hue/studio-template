import Icon from "./Icon";

const phaseLabels = {
  pending: "搭配已选好…",
  queued: "正在等待试衣间…",
  generating: "正在为你生成上身效果",
  finishing: "正在整理人物与光影…",
};

export default function FittingStage({
  selected,
  view,
  setView,
  zoom,
  setZoom,
  onUpload,
  onReset,
  tryOn,
}) {
  const busy = Object.hasOwn(phaseLabels, tryOn.phase);
  return (
    <section
      className={`stage immersive-stage ${view === "flatlay" ? "flatlay-stage" : ""}`}
      aria-label="真人试衣预览"
    >
      <div className="stage-topline">
        <span className="eyebrow">MUSE · PRIVATE FITTING ROOM</span>
        <span className="live-label">
          <i />
          沉浸式试衣室
        </span>
      </div>
      <div className="stage-title">
        <h1>属于你的，每一种风格。</h1>
        <p>Your style, brought to life.</p>
      </div>
      <div className="stage-scene immersive-interaction-area">
        {view === "flatlay" && (
          <div className="flatlay-board">
            {selected.map((item) => (
              <div
                className={`flatlay-item flatlay-${item.category}`}
                key={item.id}
              >
                <img src={item.image} alt={item.name} />
                <span>{item.name}</span>
              </div>
            ))}
            {!selected.length && (
              <div className="empty-board">
                <Icon name="shirt" size={36} />
                <p>选一件喜欢的衣服，开始搭配。</p>
              </div>
            )}
          </div>
        )}
        <button
          className="stage-upload icon-button"
          onClick={onUpload}
          aria-label="更换人物照片"
        >
          <Icon name="camera" size={19} />
        </button>
        <span className="room-instruction">
          <Icon name="move" size={13} />
          拖动空白区域 · 移动镜头
        </span>
      </div>
      <div
        className={`tryon-status phase-${tryOn.phase}`}
        aria-live="polite"
        data-cache-source={tryOn.cacheSource}
      >
        {busy ? (
          <>
            <span className="tryon-progress" />
            <Icon name="sparkles" size={16} />
            <span>{phaseLabels[tryOn.phase]}</span>
            {tryOn.elapsed > 0 && (
              <small aria-hidden="true">{tryOn.elapsed}s</small>
            )}
          </>
        ) : tryOn.phase === "error" ? (
          <>
            <Icon name="info" size={16} />
            <span>{tryOn.error}</span>
            <button onClick={tryOn.request}>重试</button>
          </>
        ) : tryOn.phase === "complete" ? (
          <>
            <Icon name="check" size={16} />
            <span>
              {tryOn.staticDemo
                ? "预生成试穿示例"
                : tryOn.cached
                  ? "已切换到试穿结果"
                  : "上身效果已更新"}
            </span>
            <small>{tryOn.staticDemo ? "DEMO" : "AI TRY-ON"}</small>
          </>
        ) : (
          <>
            <Icon name="sparkles" size={16} />
            <span>
              {tryOn.staticDemo
                ? selected.length
                  ? "此组合暂无预生成示例，可查看平铺搭配"
                  : "静态演示 · 可上传和整理衣物"
                : tryOn.configured === false
                  ? "试衣服务尚未配置"
                  : "选择右侧衣服，生成你的上身效果"}
            </span>
            {selected.length > 0 && !tryOn.staticDemo && (
              <button onClick={tryOn.request}>
                试穿这套
                <Icon name="arrow" size={13} />
              </button>
            )}
          </>
        )}
      </div>
      <div className="stage-controls">
        <div className="view-switch" role="group" aria-label="预览方式">
          <button
            aria-pressed={view === "person"}
            className={view === "person" ? "active" : ""}
            onClick={() => setView("person")}
          >
            <Icon name="user" size={15} />
            真人试穿
          </button>
          <button
            aria-pressed={view === "flatlay"}
            className={view === "flatlay" ? "active" : ""}
            onClick={() => setView("flatlay")}
          >
            <Icon name="grid" size={15} />
            平铺搭配
          </button>
        </div>
        <div className="view-tools">
          <button
            className="icon-button"
            disabled={view !== "person"}
            aria-label={zoom ? "查看全身" : "放大人物细节"}
            aria-pressed={zoom}
            onClick={() => setZoom((z) => !z)}
          >
            <Icon name={zoom ? "scan" : "zoom"} size={18} />
          </button>
          <span />
          <button
            className="icon-button"
            onClick={onReset}
            aria-label="重置搭配与视图"
          >
            <Icon name="reset" size={17} />
          </button>
        </div>
      </div>
      <p className="stage-disclaimer">
        <Icon name="lock" size={11} />
        {tryOn.staticDemo
          ? "静态版展示预生成示例 · 新照片换装需运行源码并配置图像服务"
          : busy && tryOn.phase !== "pending"
            ? "可以继续选衣 · 当前画面保留上一套效果"
            : "试穿会发送照片至模型 · 新搭配约 30–90 秒，已有结果直接复用"}
      </p>
    </section>
  );
}
