import { useRouteError } from "react-router-dom";

export default () => {
  const error = useRouteError();
  return <div>{error?.message ?? "An error occurred"}</div>;
};
