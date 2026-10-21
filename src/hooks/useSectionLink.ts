import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Smoothly scroll to a homepage section from anywhere on the site. */
export function useSectionLink() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return useCallback(
    (id: string) => (e?: React.MouseEvent) => {
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey)) return;
      e?.preventDefault();
      if (pathname !== "/") {
        navigate(`/#${id}`);
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
      // Move focus for keyboard & screen-reader users without a second scroll jump
      el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    },
    [navigate, pathname],
  );
}
