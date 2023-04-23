import { App, Loading, NotFound } from "./Preserved";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { Suspense } from "react";
import eagerRoutes from "./EagerRoutes";
import lazyRoutes from "./LazyRoutes";

import.meta.glob("/src/styles/*.(scss|css)", { eager: true });

if (!lazyRoutes.length && !eagerRoutes.length) console.error("No routes found");

export default function Router() {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider
        router={createBrowserRouter([
          {
            path: "/",
            Component: App,
            children: [...eagerRoutes, ...lazyRoutes],
          },
          { path: "*", Component: NotFound },
        ])}
      />
    </Suspense>
  );
}
