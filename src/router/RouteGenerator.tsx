import Action from "./Action";
import ErrorBoundaryLoad from "./ErrorBoundary";
import Loader from "./Loader";
import { lazy } from "react";

export function RouteGenerator(lazys: any, key: string, eagers: any) {
  const module = eagers === null ? lazys[key] : eagers[key];
  const Component = eagers === null ? lazy(module) : module.default;
  const preload = eagers === null ? module : null;

  const loader = eagers === null ? Loader(module) : null;
  const action = eagers === null ? Action(module) : null;
  const ErrorBoundary = eagers === null ? ErrorBoundaryLoad(module) : null;

  const route = {
    Component,
    loader,
    action,
    ErrorBoundary,
    preload,
  };

  return route;
}
