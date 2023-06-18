import React, {
  Fragment,
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import Helmet from "react-helmet";

const PRESERVED = import.meta.glob("/src/layouts/(App|NotFound|Loading).jsx", {
  eager: true,
});

const regexCache = {};

export const getMatchingRoute = (path) => {
  for (const route of LazyRoutes) {
    let regex = regexCache[route.path];
    if (!regex) {
      regex = new RegExp(
        `^${route.path.replace(/:[^/]+/g, "([^/]+)").replace(/\*/g, ".*")}$`
      );
      regexCache[route.path] = regex;
    }
    if (regex.test(path)) {
      return route;
    }
  }
  return null;
};

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

const App = preserved["App"] || Fragment;
const NotFound = preserved["NotFound"] || Fragment;
const Loading = preserved["Loading"] || Fragment;

const Action =
  (routes) =>
  async (...args) => {
    const { action } = await routes();
    return action ? action(...args) : null;
  };

const Loader =
  (routes) =>
  async (...args) => {
    const { loader } = await routes();
    return loader ? loader(...args) : null;
  };

const ErrorBoundaryLoad =
  (routes) =>
  async (...args) => {
    const { Error } = await routes();
    return Error ? Error(...args) : null;
  };

function SegmentsGenerator(key) {
  return key
    .replace(/\/src\/screens|\.jsx|\[\.{3}.+\]|\.lazy/g, "")
    .replace(/\[(.+)\]/g, ":$1")
    .toLowerCase()
    .split("/")
    .filter((p) => !p.includes("_") && p !== "");
}

function RouteGenerator(lazys, key, eagers) {
  const module = eagers === null ? lazys[key] : eagers[key];
  const Component = eagers ? module.default : lazy(module);
  const preload = eagers ? null : module;

  const loader = eagers ? eagers?.[key]?.loader : Loader(module);
  const action = eagers ? eagers?.[key]?.action : Action(module);
  const ErrorBoundary = eagers
    ? eagers?.[key]?.Error
    : ErrorBoundaryLoad(module);

  return {
    Component,
    loader,
    action,
    ErrorBoundary,
    preload,
  };
}

function RoutePositionGenerator(segments, routes, route) {
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
      return found || current?.[insert === "unshift" ? 0 : current.length - 1];
    }

    if (leaf) {
      parent?.children?.[insert]({ path: path.replace(/\/$/, ""), ...route });
    }

    return parent;
  };

  segments.reduce(insertRoute, {});

  return routes;
}

function RoutesReducer(eagers, lazys) {
  return Object.keys(eagers ?? lazys).reduce((routes, key) => {
    const { Component, loader, action, ErrorBoundary, preload } =
      RouteGenerator(lazys, key, eagers);

    const segments = SegmentsGenerator(key);

    return RoutePositionGenerator(segments, routes, {
      Component,
      loader,
      action,
      ErrorBoundary,
      preload,
    });
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

const Router = () => (
  <Suspense fallback={<Loading />}>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </Suspense>
);

export default Router;

export const SuspenseAfterInitialRender = memo(({ fallback, children }) => {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    setIsInitialRender(false);
  }, []);

  if (isInitialRender) return <>{children}</>;

  return <Suspense fallback={fallback}>{children}</Suspense>;
});

export const NavLink = memo(({ to, prefetch = true, ...props }) => {
  const ref = useRef(null);
  const [prefetched, setPrefetched] = useState(false);

  const route = useMemo(() => getMatchingRoute(to), [to]);
  const preload = useCallback(
    () => route?.preload() && setPrefetched(true),
    [route]
  );

  const prefetchable = useMemo(
    () => Boolean(route && !prefetched),
    [route, prefetched]
  );

  useEffect(() => {
    if (!prefetchable || !prefetch || !ref?.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preload();
          observer.unobserve(ref.current);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [prefetchable, prefetch, ref, preload]);

  const handleMouseEnter = useCallback(() => {
    if (prefetchable) preload();
  }, [prefetchable, preload]);

  return (
    <RouterNavLink
      ref={ref}
      to={to}
      onMouseEnter={handleMouseEnter}
      {...props}
    />
  );
});

export const Link = memo(({ to, prefetch = true, ...props }) => {
  const ref = useRef(null);
  const [prefetched, setPrefetched] = useState(false);

  const route = useMemo(() => getMatchingRoute(to), [to]);
  const preload = useCallback(() => {
    route?.preload();
    setPrefetched(true);
  }, [route]);

  const prefetchable = useMemo(
    () => Boolean(route && !prefetched),
    [route, prefetched]
  );

  useEffect(() => {
    if (!prefetchable || !prefetch || !ref?.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preload();
          observer.unobserve(ref.current);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [prefetchable, prefetch, ref, preload]);

  const handleMouseEnter = useCallback(() => {
    if (prefetchable) preload();
  }, [prefetchable, preload]);

  return (
    <RouterLink ref={ref} to={to} onMouseEnter={handleMouseEnter} {...props} />
  );
});

export const Head = ({ title, description, url, image, children }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <link rel="icon" href={image} />
      <link rel="apple-touch-icon" href={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta property="og:title" content={title} />
      <meta property="og:site_name" content={title} />
      <meta name="description" content={description} />
      <meta property="og:description" content={description} />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:domain" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:description" content={description} />
      <meta name="theme-color" content="#000000" />
      {children}
    </Helmet>
  );
};
