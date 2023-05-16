import RoutesReducer from "./RoutesReducer";

const EAGER_ROUTES = import.meta.glob(
  ["/src/screens/**/*.jsx", "!/src/screens/**/*.lazy.jsx"],
  { eager: true }
);

export default RoutesReducer(EAGER_ROUTES, {});
