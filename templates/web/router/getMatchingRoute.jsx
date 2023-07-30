import { LazyRoutes } from "./Router";

const regexCache = new Map();

const getMatchingRoute = (path) => {
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

export default getMatchingRoute;
