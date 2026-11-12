// Existing brand artwork, independent of the 24-unit functional icon system.
export function Brand() {
  return (
    <a className="brand" href="#home" aria-label="岩点 UPWARD 首页">
      <svg className="brand-symbol" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
        <path d="M3 36 19 7h9l14 29H31L23 18 14 36Z" fill="currentColor" />
        <path d="M8 29h18l-4 7H4Z" fill="currentColor" />
      </svg>
      <span className="brand-name">岩点<span className="brand-en">UPWARD<span className="brand-dot">®</span></span></span>
    </a>
  );
}

export function DirectionMark({ className = '' }) {
  return (
    <svg className={`direction-mark ${className}`} viewBox="0 0 80 80" aria-hidden="true" focusable="false">
      <path d="M14 66 66 14M24 14h42v42" />
    </svg>
  );
}
