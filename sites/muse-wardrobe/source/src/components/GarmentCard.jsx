import Icon from "./Icon";
import { categories } from "../lib/data";

export default function GarmentCard({ item, selected, onSelect, onEdit }) {
  return (
    <article className={`garment-card ${selected ? "is-selected" : ""}`}>
      <button
        className="garment-choice"
        onClick={() => onSelect(item)}
        aria-pressed={selected}
        aria-label={`${selected ? "移除" : "选择"}${item.name}`}
      >
        <div className="garment-image">
          <img src={item.image} alt={item.name} loading="lazy" />
          <span className="selection-mark">
            <Icon name={selected ? "check" : "plus"} size={13} />
          </span>
          {item.source === "user" && (
            <span className="user-item-label">我的</span>
          )}
        </div>
        <span className="garment-name">{item.name}</span>
        <span className="garment-meta">
          <i className={`color-dot color-${item.color}`} />
          {categories.find((c) => c.id === item.category)?.label}
          <span>{item.source === "demo" ? "示例" : "已上传"}</span>
        </span>
      </button>
      {onEdit && item.source === "user" && (
        <button
          className="edit-garment"
          onClick={() => onEdit(item)}
          aria-label={`编辑${item.name}`}
        >
          <Icon name="sliders" size={14} />
        </button>
      )}
    </article>
  );
}
