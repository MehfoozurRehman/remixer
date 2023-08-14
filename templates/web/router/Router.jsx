import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";

import App from "@layouts/App";
import ErrorBoundary from "@layouts/Error";
import Loading from "@layouts/Loading";
import NotFound from "@layouts/NotFound";

import.meta.glob("/src/styles/*.(scss|css)", { eager: true });

const LAZY_ROUTES = import.meta.glob("/src/screens/**/*.lazy.jsx");

const EAGER_ROUTES = import.meta.glob(
  ["/src/screens/**/*.jsx", "!/src/screens/**/*.lazy.jsx"],
  { eager: true }
);

// Define a function that returns the action for a given module
const getAction = async (module, ...args) => {
  const { action } = await module();
  return action ? action(...args) : null;
};

// Define a function that returns the loader for a given module
const getLoader = async (module, ...args) => {
  const { loader } = await module();
  return loader ? loader(...args) : null;
};

// Define a function that creates a route object from a given module
const createRoute = (module, isEager) => {
  const Component = isEager ? module.default : lazy(module);

  const element = (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
  const errorElement = <ErrorBoundary />;
  const preload = isEager ? null : module;
  const loader = isEager ? module?.loader : getLoader.bind(null, module);
  const action = isEager ? module?.action : getAction.bind(null, module);

  return { element, loader, action, preload, errorElement };
};

// Define a function that creates an array of path segments from a given key
const createPathSegments = (key) =>
  key
    .replace(/\/src\/screens|\.jsx|\[\.{3}.+\]|\.lazy/g, "")
    .replace(/\[(.+)\]/g, ":$1")
    .toLowerCase()
    .split("/")
    .filter((p) => !p.includes("_") && p !== "");

// Define a function that inserts a route object into a given routes array
const insertRoute = (routes, segments, route) => {
  const insert = /^\w|\//.test(route.path) ? "unshift" : "push";

  const insertNode = (parent, segment, index) => {
    const path = segment.replace(/index|\./g, "");
    const root = index === 0;
    const leaf = index === segments.length - 1 && segments.length > 1;
    const node = !root && !leaf;

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
      return found || current?.[insert === "unshift" ? 0 : current.length - 1];
    }

    if (leaf) {
      parent?.children?.[insert]({ path: path.replace(/\/$/, ""), ...route });
    }

    return parent;
  };

  segments.reduce(insertNode, {});
};

// Define a function that creates an array of eager routes from a given object
const createEagerRoutes = (eagers) =>
  Object.keys(eagers).reduce((routes, key) => {
    const module = eagers[key];
    const route = createRoute(module, true);
    const segments = createPathSegments(key);
    insertRoute(routes, segments, route);
    return routes;
  }, []);

// Define a function that creates an array of lazy routes from a given object
const createLazyRoutes = (lazys) =>
  Object.keys(lazys).reduce((routes, key) => {
    const module = lazys[key];
    const route = createRoute(module, false);
    const segments = createPathSegments(key);
    insertRoute(routes, segments, route);
    return routes;
  }, []);

// Create an array of eager routes from the EAGER_ROUTES object
const EagerRoutes = createEagerRoutes(EAGER_ROUTES);

// Create an array of lazy routes from the LAZY_ROUTES object
export const LazyRoutes = createLazyRoutes(LAZY_ROUTES);

// Create a router object using the createBrowserRouter function
const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    ErrorBoundary: () => <ErrorBoundary isFullPage />,
    children: [...EagerRoutes, ...LazyRoutes],
  },
  { path: "*", Component: NotFound },
]);

// Export a component that renders the router object
export default () => <RouterProvider router={router} />;
