import { Link } from "@router";

export default function Index() {
  return (
    <div>
      index
      <Link to="/about">about</Link>
    </div>
  );
}
