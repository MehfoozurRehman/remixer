import { defineExportConfig } from "vite-plugin-hot-export";

export default defineExportConfig({
  configs: [
    {
      targetDir: "./src/renderer/src/components",
    },
    {
      targetDir: "./src/renderer/src/assets",
      depth: true,
      autoPrefix: true,
    },
  ],
});
