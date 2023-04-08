import Action from "./Action";
import ErrorBoundaryLoad from "./ErrorBoundary";
import Loader from "./Loader";
import { lazy } from "react";

export default function RoutesReducer(
  eagers: Record<string, unknown>,
  lazys: Record<string, () => Promise<unknown>>
) {
  return Object.keys(eagers === null ? lazys : eagers).reduce((routes, key) => {
    const lazyModule = lazys[key];
    const eagerModule = eagers[key];

    const Component = eagers === null ? lazy(lazyModule) : eagerModule.default;
    const loader = eagers === null ? Loader(lazyModule) : eagerModule.loader;
    const action = eagers === null ? Action(lazyModule) : eagerModule.action;
    const ErrorBoundary =
      eagers === null ? ErrorBoundaryLoad(lazyModule) : eagerModule.Error;

    const preload = eagers === null ? lazyModule : null;

    const route = {
      Component,
      loader,
      action,
      ErrorBoundary,
      preload,
    };

    const segments = key
      .replace(/\/src\/screens|\.jsx|\.tsx$/g, "")
      .replace(/\[\.{3}.+\]/, "*")
      .replace(/\[(.+)\]/, ":$1")
      .replace(/\.lazy/, "")
      .toLowerCase()
      .split("/")
      .filter((p) => !p.includes("_"))
      .filter(Boolean);

    const insertRoute = (parent, segment, index) => {
      const path = segment.replace(/index|\./g, "");
      const root = index === 0;
      const leaf = index === segments.length - 1 && segments.length > 1;
      const node = !root && !leaf;
      const insert = /^\w|\//.test(path) ? "unshift" : "push";

      if (root) {
        const dynamic = path.startsWith("[") || path === "*";
        if (dynamic) return parent;
        const last = segments.length === 1;
        if (last) {
          routes.push({ path, ...route });
          return parent;
        }
      }

      if (root || node) {
        const current = root ? routes : parent.children;
        const found = current?.find(
          (route: { path: string }) => route.path === path
        );
        found
          ? (found.children ??= [])
          : current?.[insert]({ path: path, children: [] });
        return (
          found || current?.[insert === "unshift" ? 0 : current.length - 1]
        );
      }

      if (leaf) {
        parent?.children?.[insert]({ path: path.replace(/\/$/, ""), ...route });
      }

      return parent;
    };

    segments.reduce(insertRoute, {});

    return routes;
  }, []);
}
