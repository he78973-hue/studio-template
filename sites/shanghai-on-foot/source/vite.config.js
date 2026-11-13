import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'normalize-bundled-shader-whitespace',
    renderChunk: {
      order: 'post',
      handler(code, chunk) {
        // Three.js embeds GLSL with blank-line indentation and trailing spaces.
        // Normalize that generated chunk before Rollup assigns its content hash.
        if (chunk.name === 'scene') return { code: code.replace(/[\t ]+$/gm, ''), map: null };
        return null;
      },
    },
  }],
});
