export function BrandMark({ className = '' }) {
  return <svg className={className} viewBox="0 0 60 38" fill="none" aria-hidden="true"><path d="M4 31 19 10l8 11L37 5l19 26H43L37 21l-10 14-8-13-7 9Z" fill="currentColor" /></svg>;
}

export default function Brand({ large = false }) {
  return <span className={`brand-lockup ${large ? 'brand-large' : ''}`}><BrandMark /><span className="brand-name">ROAM</span>{!large && <span className="brand-chinese">山行</span>}</span>;
}
