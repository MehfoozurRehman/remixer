import { Fragment } from "react";

const PRESERVED = import.meta.glob("/src/layouts/(App|NotFound|Loading).jsx", {
  eager: true,
});
const preserved = {};

for (const file of Object.keys(PRESERVED)) {
  const key = file.replace(/\/src\/layouts\/|\.jsx$/g, "");
  preserved[key] = PRESERVED[file].default;
}

const hasNotFoundError = !("NotFound" in preserved);
const hasLoadingError = !("Loading" in preserved);

if (hasNotFoundError || hasLoadingError) {
  const message = `${hasNotFoundError ? "No 404 element found; " : ""}${
    hasLoadingError ? "No loader function found" : ""
  }`;
  console.error(message);
}

export const App = preserved["App"] || Fragment;
export const NotFound = preserved["NotFound"] || Fragment;
export const Loading = preserved["Loading"] || Fragment;
