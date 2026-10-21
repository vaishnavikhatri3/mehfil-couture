import { useEffect } from "react";

const DEFAULT_DESC =
  "Mehfil Couture is an Indore couture studio for handcrafted bridal wear, luxury prêt and indo-western occasionwear.";

/** Per-route <title> and meta description (SPA-friendly). */
export function usePageMeta(title: string, description = DEFAULT_DESC) {
  useEffect(() => {
    document.title = title;
    const set = (sel: string, attr: string, val: string) => {
      document.querySelector<HTMLMetaElement>(sel)?.setAttribute(attr, val);
    };
    set('meta[name="description"]', "content", description);
    set('meta[property="og:title"]', "content", title);
    set('meta[property="og:description"]', "content", description);
  }, [title, description]);
}
