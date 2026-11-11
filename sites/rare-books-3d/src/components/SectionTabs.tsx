import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../lib/icons';
import type { Section, SectionId } from '../types';

export interface SectionTabsProps {
  sections: Section[];
  activeId: SectionId;
  counts: Record<string, number>;
  onChange: (id: SectionId) => void;
}

export function SectionTabs({ sections, activeId, counts, onChange }: SectionTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  /** 共享滑动指示器的位置/宽度（motion-interaction-skill §5：单一指示元素，不逐项淡变） */
  const [indicator, setIndicator] = useState({ x: 0, w: 0 });

  const focusTab = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const tabs = list.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[index]?.focus();
  };

  /** 测量激活标签 → 驱动指示器；容器尺寸变化（换行/缩放）时重测 */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!active) return;
      setIndicator({ x: active.offsetLeft, w: active.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [activeId, sections]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = sections.findIndex((s) => s.id === activeId);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % sections.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + sections.length) % sections.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = sections.length - 1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation(); // 阻止全局键盘导航重复处理
    onChange(sections[next].id);
    focusTab(next);
  };

  return (
    <div
      className="tabs"
      role="tablist"
      aria-label="书架分区"
      ref={listRef}
      onKeyDown={onKeyDown}
      data-nav-zone
      style={{ ['--tab-x' as string]: `${indicator.x}px`, ['--tab-w' as string]: `${indicator.w}px` }}
    >
      {/* 共享滑动指示器：在标签间滑动而不是逐项淡变 */}
      <span className="tabs__indicator" aria-hidden="true" />
      {sections.map((sec) => {
        const active = sec.id === activeId;
        return (
          <button
            key={sec.id}
            type="button"
            role="tab"
            id={`tab-${sec.id}`}
            aria-selected={active}
            aria-controls="shelf-panel"
            tabIndex={active ? 0 : -1}
            className={`tab${active ? ' tab--active' : ''}`}
            onClick={() => onChange(sec.id)}
          >
            <span className="tab__name">{sec.name}</span>
            <span className="tab__zh">{sec.nameZh}</span>
            <span className="tab__count">{counts[sec.id] ?? 0} 册</span>
          </button>
        );
      })}
    </div>
  );
}
