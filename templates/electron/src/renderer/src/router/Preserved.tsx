import { Fragment } from 'react';

const PRESERVED = import.meta.glob('/src/layouts/(App|NotFound|Loading).(jsx|tsx)', { eager: true });

const preserved = Object.keys(PRESERVED).reduce(
  (acc, file) => ({
    ...acc,
    [file.replace(/\/src\/layouts\/|\.jsx|\.tsx$/g, "")]:
      PRESERVED[file].default,
  }),
  {}
);

const hasNotFoundError = !Object.keys(preserved).includes("NotFound")
const hasLoadingError = !Object.keys(preserved).includes("Loading")

if (hasNotFoundError || hasLoadingError) {
  const message =
    (hasNotFoundError ? "No 404 element found; " : "") +
    (hasLoadingError ? "No loader function found" : "");

  console.error(message);
}

export const App = preserved?.["App"] || Fragment;
export const NotFound = preserved?.["NotFound"] || Fragment;
export const Loading = preserved?.["Loading"] || Fragment;