import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 相对 base：构建产物可用任意静态路径直接打开（画廊/本地 file:// 均可）
  base: './',
  build: {
    // 入口用 index.template.html：无论根目录的 index.html 是源码版还是产物版，
    // `vite build` 都能正常工作；产物由 build.mjs 发布到模板根。
    rollupOptions: {
      input: { index: 'index.template.html' },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
