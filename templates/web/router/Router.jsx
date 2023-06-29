import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";

import App from "@layouts/App";
import Loading from "@layouts/Loading";
import NotFound from "@layouts/NotFound";

if (!Loading) {
  console.error("No loader file found in layouts folder");
}

if (!NotFound) {
  console.error("No Not found file found in layouts folder");
}

const regexCache = new Map();

export const getMatchingRoute = (path) => {
  for (const route of LazyRoutes) {
    let regex = regexCache.get(route.path);
    if (!regex) {
      regex = new RegExp(
        `^${route.path.replace(/:[^/]+/g, "([^/]+)").replace(/\*/g, ".*")}$`
      );
      regexCache.set(route.path, regex);
    }
    if (regex.test(path)) {
      return route;
    }
  }
  return null;
};

const Action = async (routes, ...args) => {
  const { action } = await routes();
  return action ? action(...args) : null;
};

const Loader = async (routes, ...args) => {
  const { loader } = await routes();
  return loader ? loader(...args) : null;
};

const ErrorBoundaryLoad = async (routes, ...args) => {
  const { Error } = await routes();
  return Error ? Error(...args) : null;
};

function RoutesReducer(eagers, lazys) {
  return Object.keys(eagers ?? lazys).reduce((routes, key) => {
    const module = eagers === null ? lazys[key] : eagers[key];
    const Component = eagers ? module.default : lazy(module);
    const preload = eagers ? null : module;

    const loader = eagers ? eagers?.[key]?.loader : Loader(module);
    const action = eagers ? eagers?.[key]?.action : Action(module);
    const ErrorBoundary = eagers
      ? eagers?.[key]?.Error
      : ErrorBoundaryLoad(module);

    const segments = key
      .replace(/\/src\/screens|\.jsx|\[\.{3}.+\]|\.lazy/g, "")
      .replace(/\[(.+)\]/g, ":$1")
      .toLowerCase()
      .split("/")
      .filter((p) => !p.includes("_") && p !== "");

    const route = {
      Component,
      loader,
      action,
      ErrorBoundary,
      preload,
    };

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

const LAZY_ROUTES = import.meta.glob("/src/screens/**/*.lazy.jsx");

const LazyRoutes = RoutesReducer(null, LAZY_ROUTES);

const EAGER_ROUTES = import.meta.glob(
  ["/src/screens/**/*.jsx", "!/src/screens/**/*.lazy.jsx"],
  { eager: true }
);

const EagerRoutes = RoutesReducer(EAGER_ROUTES, {});

import.meta.glob("/src/styles/*.(scss|css)", { eager: true });

if (!LazyRoutes.length && !EagerRoutes.length) console.error("No routes found");

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [...EagerRoutes, ...LazyRoutes],
  },
  { path: "*", Component: NotFound },
]);

export default () => (
  <Suspense fallback={<Loading />}>
    <RouterProvider router={router} />
  </Suspense>
);
