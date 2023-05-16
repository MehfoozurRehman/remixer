import RoutesReducer from "./RoutesReducer";

const LAZY_ROUTES = import.meta.glob("/src/screens/**/*.lazy.jsx");

export default RoutesReducer(null, LAZY_ROUTES);
