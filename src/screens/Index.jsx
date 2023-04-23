import { Head, Link } from "../../modules";

export default function Index() {
  return (
    <div>
      Index
      <Head title="Index" />
      <Link to="/about">About</Link>
    </div>
  );
}
