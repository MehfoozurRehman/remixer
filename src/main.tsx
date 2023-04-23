import { createRoot, hydrateRoot } from "react-dom/client";

import Router from "@router/Router";

const rootElement = document.getElementById("root");

if (rootElement.hasChildNodes()) {
  hydrateRoot(<Router />, rootElement);
} else {
  createRoot(rootElement).render(<Router />);
}
