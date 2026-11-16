import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tryOnPlugin } from "./server/tryon.js";

export default defineConfig(({ mode }) => ({
  base: mode === "template" ? "./" : "/",
  // Escape multiline GLSL strings in the committed bundle without altering them.
  esbuild: { supported: { "template-literal": false } },
  define: {
    "import.meta.env.VITE_TEMPLATE_STATIC": JSON.stringify(
      mode === "template" ? "true" : "false",
    ),
  },
  plugins: [
    react(),
    ...(mode === "template"
      ? []
      : [
          tryOnPlugin(process.cwd(), {
            ...process.env,
            ...loadEnv(mode, process.cwd(), ""),
          }),
        ]),
  ],
}));
