import Head from "@modules/Head";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <>
      <Head
        title="Remixer"
        image="/favicon.ico"
        url="https://vitefilerouter.com"
        description="Remixer"
      />
      <Outlet />
    </>
  );
}
