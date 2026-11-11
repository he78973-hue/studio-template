/* Deterministic page-turn state, shared by the browser and node:test. */
(function (root) {
  'use strict';
  const clamp = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const ease = (t) => t * t * (3 - 2 * t);
  class TurnModel {
    constructor(index = 0, max = 1) {
      this.max = Math.max(1, Math.floor(Number(max) || 1));
      this.progress = Number.isFinite(index) ? Math.min(this.max, Math.max(0, Math.round(index))) : 0;
      this.committed = this.target = this.progress;
      this.dragging = false;
      this.animation = null;
    }
    get moving() { return this.dragging || this.animation !== null; }
    snapshot() {
      return { progress: this.progress, committed: this.committed, target: this.target, moving: this.moving, dragging: this.dragging };
    }
    tick(now) {
      if (!this.animation) return this.snapshot();
      const a = this.animation;
      const time = clamp((now - a.start) / a.duration);
      this.progress = a.from + (a.to - a.from) * ease(time);
      if (time === 1) {
        this.progress = this.committed = a.to;
        this.animation = null;
      }
      return this.snapshot();
    }
    request(index, now, reduced = false) {
      const target = Number.isFinite(Number(index)) ? Math.min(this.max, Math.max(0, Math.round(Number(index)))) : 0;
      this.tick(now);
      if (!this.dragging && this.animation && target === this.target && !reduced) return this.snapshot();
      this.dragging = false;
      this.target = target;
      const distance = Math.abs(target - this.progress);
      if (reduced || distance < 0.0001) {
        this.animation = null;
        this.progress = this.committed = target;
      } else {
        this.animation = { from: this.progress, to: target, start: now, duration: Math.max(160, distance * 660) };
      }
      return this.snapshot();
    }
    beginDrag(now) {
      this.tick(now);
      this.animation = null;
      this.dragging = true;
      return this.snapshot();
    }
    dragTo(value) {
      if (this.dragging && Number.isFinite(value)) this.progress = Math.min(this.max, Math.max(0, value));
      return this.snapshot();
    }
    release(now, velocity = 0, reduced = false) {
      const target = Math.abs(velocity) > 0.0007
        ? this.committed + (velocity > 0 ? 1 : -1)
        : Math.round(this.progress);
      return this.request(target, now, reduced);
    }
    cancel(now, reduced = false) { return this.request(this.committed, now, reduced); }
    settle() { return this.request(this.target, 0, true); }
  }
  const api = { TurnModel, clamp, ease };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BookTurn = api;
})(typeof window !== 'undefined' ? window : globalThis);
