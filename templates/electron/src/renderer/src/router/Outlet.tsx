import { Loading } from "./Preserved";
import { Outlet as OutletBase } from "react-router-dom";
import SuspenseAfterInitialRender from "./SuspenseAfterInitialRender";

export default function Outlet() {
  return (
    <SuspenseAfterInitialRender fallback={<Loading />}>
      <OutletBase />
    </SuspenseAfterInitialRender>
  );
}
