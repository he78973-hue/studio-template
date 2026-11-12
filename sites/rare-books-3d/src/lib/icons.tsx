/**
 * 图标注册表 —— 全站 UI 图标的唯一出处（web-icon-system skill）
 * ─────────────────────────────────────────────────────────────
 * 规范（来自 skill 的 icon-style-spec）：
 *   - 开源优先：通用字形一律用 Lucide（ISC，24×24 / stroke 2 / 圆角端点 /
 *     currentColor 继承色），不自己重画；
 *   - 单一出处：页面里禁止手写第二套 svg，一律 `<Icon name="…" />`；
 *   - 语义英文小写命名；纯装饰图标由组件内置 `aria-hidden`。
 *
 * 新增图标只需在 ICONS 里加一行映射，调用方无需改。
 */
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronUp,
  Eye,
  Library,
  Sparkles,
  Telescope,
  X,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'book-open'
  | 'chevron-up'
  | 'eye'
  | 'library'
  | 'sparkles'
  | 'telescope'
  | 'close';

/** 语义名 → Lucide 字形 */
const ICONS: Record<IconName, ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>> = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'book-open': BookOpen,
  'chevron-up': ChevronUp,
  eye: Eye,
  library: Library,
  sparkles: Sparkles,
  telescope: Telescope,
  close: X,
};

export interface IconProps {
  name: IconName;
  /** 像素尺寸（默认 16，导航 20–24，大图标 56+） */
  size?: number;
  className?: string;
  /** 描边宽度，默认 2（与 Lucide 规格一致） */
  strokeWidth?: number;
}

export function Icon({ name, size = 16, className, strokeWidth = 2 }: IconProps) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  );
}
