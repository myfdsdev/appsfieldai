import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Newspaper, ArrowLeft } from "lucide-react";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";
import StoreFooter from "@/components/store/StoreFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { getStoreStyle, loadStyleFonts } from "@/components/store/storeStyles";

export default function StoreBlogIndex() {
  const { slug: slugParam } = useParams();
  const customDomain = getCustomDomainFromHost();
  const storeKey = getStoreKeyFromHost();
  const slug = slugParam || storeKey;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const storeHomePath = slugParam ? `/store/${slugParam}` : "/";
  const blogBase = slugParam ? `/store/${slugParam}/blog` : "/blog";

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.functions
      .invoke("getMarketplacePublic", { slug, customDomain })
      .then((res) => {
        if (!active) return;
        if (!res.data?.marketplace) setNotFound(true);
        else setData(res.data);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug, customDomain]);

  useSeoMeta(
    data?.marketplace
      ? {
          title: `Blog — ${data.marketplace.name}`,
          description: `Guides, tips and the best SaaS deals from ${data.marketplace.name}.`,
          url: typeof window !== "undefined" ? window.location.href : "",
        }
      : {}
  );

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Newspaper className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-display font-bold">Blog not found</h1>
      </div>
    );
  }

  const { marketplace, blogs = [] } = data;
  const styleSlug = marketplace.pageSections?.storeStyle;
  const style = getStoreStyle(styleSlug);
  loadStyleFonts(style);
  const pal = style.palette;
  const accent = pal?.accent || marketplace.branding?.primaryColor || "#f97316";
  const pageStyle = pal ? { background: pal.surface, color: pal.text } : undefined;
  const cardStyle = pal ? { background: pal.card, borderColor: pal.cardBorder } : undefined;
  const muted = pal ? { color: pal.text, opacity: 0.6 } : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: style.bodyFont, ...(pageStyle || {}) }}>
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <Link to={storeHomePath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors" style={muted}>
          <ArrowLeft className="w-4 h-4" /> Back to store
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ fontFamily: style.headingFont }}>{marketplace.name} Blog</h1>
        <p className="text-sm text-muted-foreground mb-10" style={muted}>Guides, tips and the best deals — updated regularly.</p>

        {blogs.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-border/40">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground" style={muted}>No articles published yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <Link
                key={post.id}
                to={`${blogBase}/${post.slug}`}
                className={`group ${style.products?.radius || "rounded-2xl"} border border-border/40 bg-card/60 overflow-hidden transition-colors flex flex-col hover:shadow-lg`}
                style={cardStyle}
              >
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} alt={post.title} className="w-full aspect-[16/9] object-cover" />
                ) : (
                  <div className="w-full aspect-[16/9] flex items-center justify-center" style={{ background: `${accent}18` }}>
                    <Newspaper className="w-8 h-8" style={{ color: accent, opacity: 0.5 }} />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-bold text-base leading-snug transition-colors" style={{ fontFamily: style.headingFont }}>{post.title}</h2>
                  {post.excerpt && <p className="text-xs text-muted-foreground mt-2 line-clamp-3" style={muted}>{post.excerpt}</p>}
                  <span className="text-xs mt-auto pt-3 font-medium" style={{ color: accent }}>Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <StoreFooter marketplace={marketplace} footerText={marketplace.pageSections?.footerText} styleSlug={styleSlug} />
    </div>
  );
}