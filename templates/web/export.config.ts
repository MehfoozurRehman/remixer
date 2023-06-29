import { defineExportConfig } from "vite-plugin-hot-export";

export default defineExportConfig({
  configs: [
    {
      targetDir: "./src/components",
    },
    {
      targetDir: "./src/assets",
      autoPrefix: true,
      depth: true,
    },
  ],
});
