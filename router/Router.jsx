import { App, Loading, NotFound } from "./Preserved";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Suspense, memo } from "react";

import eagerRoutes from "./EagerRoutes";
import lazyRoutes from "./LazyRoutes";

import.meta.glob("/src/styles/*.(scss|css)", { eager: true });

if (!lazyRoutes.length && !eagerRoutes.length) console.error("No routes found");

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [...eagerRoutes, ...lazyRoutes],
  },
  { path: "*", Component: NotFound },
]);

const Router = memo(() => {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
});

export default Router;
