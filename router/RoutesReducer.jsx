import { lazy } from "react";

const Action =
  (routes) =>
  async (...args) => {
    const { action } = await routes();
    return action ? action(...args) : null;
  };

const ErrorBoundaryLoad =
  (routes) =>
  async (...args) => {
    const { Error } = await routes();
    return Error ? Error(...args) : null;
  };

const Loader =
  (routes) =>
  async (...args) => {
    const { loader } = await routes();
    return loader ? loader(...args) : null;
  };

export default function RoutesReducer(eagers, lazys) {
  return Object.keys(eagers ?? lazys).reduce((routes, key) => {
    const module = eagers === null ? lazys[key] : eagers[key];
    const Component = eagers ? module.default : lazy(module);
    const preload = eagers ? null : module;

    const loader = eagers ? eagers?.[key]?.loader : Loader(module);
    const action = eagers ? eagers?.[key]?.action : Action(module);
    const ErrorBoundary = eagers
      ? eagers?.[key]?.Error
      : ErrorBoundaryLoad(module);

    const route = {
      Component,
      loader,
      action,
      ErrorBoundary,
      preload,
    };

    const segments = key
      .replace(/\/src\/screens|\.jsx|\[\.{3}.+\]|\.lazy/g, "")
      .replace(/\[(.+)\]/g, ":$1")
      .toLowerCase()
      .split("/")
      .filter((p) => !p.includes("_") && p !== "");

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
        const found = current?.find((route) => route.path === path);
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
