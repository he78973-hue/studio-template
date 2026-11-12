/**
 * BookModal —— 2D 详细信息模态框。
 * 由 3D 「抽出动画完全就位」回调触发打开；封面直接复用高分辨率书脊纹理
 * （与 3D 焦点网格同源，不产生二次加载）。
 * 带 focus trap、Esc 关闭、上一本/下一本（与键盘导航同一套状态）。
 */
import { useEffect, useRef } from 'react';
import type { Book, Section } from '../types';
import { Icon } from '../lib/icons';

export interface BookModalProps {
  book: Book;
  section: Section | undefined;
  coverUrl: string;
  /** 关闭详情并让书本返回书架 */
  onDismiss: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function BookModal({ book, section, coverUrl, onDismiss, onPrev, onNext }: BookModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const panel = panelRef.current;
    if (!panel) return;

    const onKey = (e: KeyboardEvent) => {
      // Esc 与方向键交给 Scene 的全局处理（一键完全返回书架 / 切换书目）
      if (e.key !== 'Tab') return;
      // focus trap：Tab 在面板内循环
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };

    panel.addEventListener('keydown', onKey);
    return () => panel.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      className="modal"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
        ref={panelRef}
      >
        <div className="modal__cover">
          <img src={coverUrl} alt={`《${book.title}》高分辨率书脊`} />
          <span className="modal__cover-tag">High-Res Rescan</span>
        </div>

        <div className="modal__body">
          <p className="modal__section">{section ? `${section.name} · ${section.nameZh}` : ''}</p>
          <h2 className="modal__title" id="book-modal-title">
            《{book.title}》
          </h2>
          <p className="modal__title-en">{book.titleEn}</p>

          <dl className="modal__meta">
            <div>
              <dt>作者</dt>
              <dd>{book.author}</dd>
            </div>
            <div>
              <dt>年份</dt>
              <dd>{book.year}</dd>
            </div>
            <div>
              <dt>开本</dt>
              <dd>
                {Math.round(book.dimensions.height * 100)} × {Math.round(book.dimensions.width * 100)} ×{' '}
                {Math.round(book.dimensions.depth * 100)} cm
              </dd>
            </div>
            <div>
              <dt>编号</dt>
              <dd>{book.id.toUpperCase()}</dd>
            </div>
          </dl>

          <p className="modal__summary">{book.summary}</p>

          <div className="modal__actions">
            <button type="button" className="btn" onClick={onPrev}>
              <Icon name="arrow-left" size={15} />
              上一本
            </button>
            <button type="button" className="btn" onClick={onNext}>
              下一本
              <Icon name="arrow-right" size={15} />
            </button>
            <button type="button" className="btn btn--ghost" onClick={onDismiss} ref={closeRef}>
              <Icon name="book-open" size={15} />
              返回书架
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
