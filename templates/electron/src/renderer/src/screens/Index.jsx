import { Link } from "react-router-dom";
import { SvgReact } from "assets";

export default function Index() {
  return (
    <div>
      index
      <img src={SvgReact} />
      <Link to="/about">about</Link>
    </div>
  );
}
