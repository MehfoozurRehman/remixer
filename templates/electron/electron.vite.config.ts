import { defineConfig, externalizeDepsPlugin } from "electron-vite";

import HotExport from "vite-plugin-hot-export";
import { VitePWA } from "vite-plugin-pwa";
import { ViteWebfontDownload } from "vite-plugin-webfont-dl";
import { chunkSplitPlugin } from "vite-plugin-chunk-split";
import { config } from "./remix.config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import viteCompression from "vite-plugin-compression";
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@components": resolve("src/renderer/src/components"),
        "@assets": resolve("src/renderer/src/assets"),
        "@router": resolve("src/renderer/src/router"),
        "@layouts": resolve("src/renderer/src/layouts"),
        "@renderer": resolve("src/renderer/src"),
        ...config.alias,
      },
    },
    plugins: [
      HotExport(),
      config.compression && chunkSplitPlugin(),
      config.fontOptimization && ViteWebfontDownload(),
      config.compression &&
        viteCompression({
          algorithm: "brotliCompress",
          threshold: 100,
        }),
      config.progressiveWebApp && VitePWA({ registerType: "autoUpdate" }),
      config.imagesOptimization &&
        viteImagemin({
          gifsicle: { optimizationLevel: 7, interlaced: false },
          optipng: { optimizationLevel: 7 },
          mozjpeg: { quality: 30 },
          pngquant: { quality: [0.7, 0.8], speed: 4 },
          webp: { quality: 70 },
          svgo: {
            multipass: true,
            plugins: [
              { name: "removeViewBox" },
              { name: "minifyStyles" },
              { name: "removeMetadata" },
              { name: "removeUselessStrokeAndFill" },
              { name: "reusePaths" },
              { name: "removeEmptyAttrs", active: true },
            ],
          },
        }),
      react(),
    ],
  },
});
