import { useEffect } from "react";

export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    document.title = title;
    const set = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = document.createElement(selector.startsWith("link") ? "link" : "meta");
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    };
    set('meta[name="description"]', { name: "description", content: description });
    set('meta[property="og:title"]', { property: "og:title", content: title });
    set('meta[property="og:description"]', { property: "og:description", content: description });
    set('link[rel="canonical"]', { rel: "canonical", href: `${window.location.origin}${path}` });
  }, [title, description, path]);
}
