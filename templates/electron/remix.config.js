import { resolve } from "path";

export const config = {
  compression: true,
  fontOptimization: true,
  progressiveWebApp: false,
  imagesOptimization: false,
  alias: {
    // "@somealias": resolve("src/somepath"),
  },
};
