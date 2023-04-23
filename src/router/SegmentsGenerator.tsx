export function SegmentsGenerator(key: string) {
  return key
    .replace(/\/src\/screens|\.jsx|\.tsx$/g, "")
    .replace(/\[\.{3}.+\]/, "*")
    .replace(/\[(.+)\]/, ":$1")
    .replace(/\.lazy/, "")
    .toLowerCase()
    .split("/")
    .filter((p) => !p.includes("_"))
    .filter(Boolean);
}
