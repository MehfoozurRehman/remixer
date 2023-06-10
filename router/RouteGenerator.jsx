import Action from "./Action";
import ErrorBoundaryLoad from "./ErrorBoundary";
import Loader from "./Loader";
import { lazy } from "react";

export function RouteGenerator(lazys, key, eagers) {
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
