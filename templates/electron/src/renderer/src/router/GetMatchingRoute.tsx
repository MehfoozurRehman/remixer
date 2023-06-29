import lazyRoutes from "./LazyRoutes";

export const getMatchingRoute = (path: string) =>
  lazyRoutes.find((route) => {
    const regex = new RegExp(route.path.replace(/:\w+|\*/g, ".*"));
    return regex.test(path);
  });
