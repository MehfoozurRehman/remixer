import { RouteGenerator } from "./RouteGenerator";
import { RoutePositionGenerator } from "./RoutePositionGenerator";
import { SegmentsGenerator } from "./SegmentsGenerator";

export default function RoutesReducer(eagers, lazys) {
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
