export function SegmentsGenerator(key) {
  return key
    .replace(/\/src\/screens|\.jsx|\.tsx|\[\.{3}.+\]|\.lazy/g, "")
    .replace(/\[(.+)\]/g, ":$1")
    .toLowerCase()
    .split("/")
    .filter((p) => !p.includes("_") && p !== "");
}
