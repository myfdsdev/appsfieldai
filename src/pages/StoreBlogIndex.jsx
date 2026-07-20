import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Newspaper, ArrowLeft } from "lucide-react";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";
import StoreFooter from "@/components/store/StoreFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <Link to={storeHomePath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to store
        </Link>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-2">{marketplace.name} Blog</h1>
        <p className="text-sm text-muted-foreground mb-10">Guides, tips and the best deals — updated regularly.</p>

        {blogs.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-border/40">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No articles published yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <Link
                key={post.id}
                to={`${blogBase}/${post.slug}`}
                className="group rounded-2xl border border-border/40 bg-card/60 overflow-hidden hover:border-orange-500/40 transition-colors flex flex-col"
              >
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} alt={post.title} className="w-full aspect-[16/9] object-cover" />
                ) : (
                  <div className="w-full aspect-[16/9] bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center">
                    <Newspaper className="w-8 h-8 text-orange-400/50" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-display font-bold text-base leading-snug group-hover:text-orange-400 transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{post.excerpt}</p>}
                  <span className="text-xs text-orange-400 mt-auto pt-3 font-medium">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <StoreFooter marketplace={marketplace} footerText={marketplace.pageSections?.footerText} />
    </div>
  );
}