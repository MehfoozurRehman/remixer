import { defineConfig, externalizeDepsPlugin } from "electron-vite";

import { ViteWebfontDownload } from "vite-plugin-webfont-dl";
import { chunkSplitPlugin } from "vite-plugin-chunk-split";
import hotExport from "vite-plugin-hot-export";
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
      alias: [
        {
          find: "@renderer",
          replacement: resolve("src/renderer/src"),
        },
        {
          find: "components",
          replacement: resolve("src/renderer/src/components"),
        },
        {
          find: "assets",
          replacement: resolve("src/renderer/src/assets"),
        },
        {
          find: "global",
          replacement: resolve("src/renderer/src/global"),
        },
        {
          find: "router",
          replacement: resolve("src/renderer/src/router"),
        },
      ],
    },
    plugins: [
      react(),
      hotExport(),
      chunkSplitPlugin(),
      ViteWebfontDownload(),
      viteCompression({
        algorithm: "brotliCompress",
        threshold: 100,
      }),
      viteImagemin({
        gifsicle: {
          optimizationLevel: 7,
          interlaced: false,
        },
        optipng: {
          optimizationLevel: 7,
        },
        mozjpeg: {
          quality: 30,
        },
        pngquant: {
          quality: [0.7, 0.8],
          speed: 4,
        },
        webp: {
          quality: 70,
        },
        svgo: {
          multipass: true,
          plugins: [
            {
              name: "removeViewBox",
            },
            {
              name: "minifyStyles",
            },
            {
              name: "removeMetadata",
            },
            {
              name: "removeUselessStrokeAndFill",
            },
            {
              name: "reusePaths",
            },
            {
              name: "removeEmptyAttrs",
              active: true,
            },
          ],
        },
      }),
    ],
  },
});
