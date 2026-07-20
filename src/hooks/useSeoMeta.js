import { useEffect } from "react";

// Injects SEO meta tags + JSON-LD structured data into <head> for a store page,
// and cleans them up on unmount / change. Used by public blog pages so they
// surface rich results in Google.
function upsertMeta(attr, key, content) {
  if (!content) return null;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const created = !el;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("content");
  el.setAttribute("content", content);
  return { el, created, prev };
}

export function useSeoMeta({ title, description, image, url, keywords, jsonLd } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    const managed = [];
    const push = (r) => { if (r) managed.push(r); };

    push(upsertMeta("name", "description", description));
    push(upsertMeta("name", "keywords", Array.isArray(keywords) ? keywords.join(", ") : keywords));
    push(upsertMeta("property", "og:title", title));
    push(upsertMeta("property", "og:description", description));
    push(upsertMeta("property", "og:type", "article"));
    push(upsertMeta("property", "og:image", image));
    push(upsertMeta("property", "og:url", url));
    push(upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary"));
    push(upsertMeta("name", "twitter:title", title));
    push(upsertMeta("name", "twitter:description", description));
    push(upsertMeta("name", "twitter:image", image));

    // Canonical link
    let canonical = null, canonicalCreated = false, canonicalPrev = null;
    if (url) {
      canonical = document.head.querySelector('link[rel="canonical"]');
      canonicalCreated = !canonical;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonicalPrev = canonical.getAttribute("href");
      canonical.setAttribute("href", url);
    }

    // JSON-LD structured data (BlogPosting schema)
    let script = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      script.setAttribute("data-seo-jsonld", "1");
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      managed.forEach(({ el, created, prev }) => {
        if (created) el.parentNode?.removeChild(el);
        else if (prev != null) el.setAttribute("content", prev);
      });
      if (canonical) {
        if (canonicalCreated) canonical.parentNode?.removeChild(canonical);
        else if (canonicalPrev != null) canonical.setAttribute("href", canonicalPrev);
      }
      if (script) script.parentNode?.removeChild(script);
    };
  }, [title, description, image, url, keywords, jsonLd]);
}