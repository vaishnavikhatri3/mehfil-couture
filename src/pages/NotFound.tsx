import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Page not found — Mehfil Couture");
  return (
    <main id="main" className="wrap notfound">
      <p className="label label-row">Error 404</p>
      <h1 className="display notfound__title">
        This mehfil <em>moved.</em>
      </h1>
      <p className="lede">The page you're looking for isn't here — but the celebration is.</p>
      <Link to="/" className="btn">
        Back to the homepage <ArrowRight />
      </Link>
    </main>
  );
}
