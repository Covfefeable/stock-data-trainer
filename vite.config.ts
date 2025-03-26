import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import monacoEditorEsmPlugin from "vite-plugin-monaco-editor-esm";

export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    vueJsx(),
    monacoEditorEsmPlugin({
      languageWorkers: ["typescript"],
    }),
  ],
  server: {
    host: true /** 启动ip访问地址 */,
    port: 3000,
    proxy: {
      "/api/v2/": {
        target: "http://127.0.0.1:1338",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v2/, "/api"),
      },
    },
  },
});
