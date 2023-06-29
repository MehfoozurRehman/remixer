import { Footer, Header } from "components";

import { Outlet } from "react-router-dom";

export const meta = {
  title: "Remixer",
  description: "Remixer",
  image: "/favicon.svg",
  url: "https://vitefilerouter.com",
};

export default function App() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
