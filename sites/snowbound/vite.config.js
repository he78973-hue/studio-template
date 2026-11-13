import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'snowbound-source-entry',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/' || url.pathname === '/index.html') req.url = `/index.template.html${url.search}`;
        next();
      });
    },
  }],
  build: { rollupOptions: { input: 'index.template.html' } },
});
