import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { FileText, ArrowLeft, Calendar, ArrowRight } from "lucide-react";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";
import StoreFooter from "@/components/store/StoreFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";

export default function StoreBlogPost() {
  const { slug: slugParam, blogSlug } = useParams();
  const customDomain = getCustomDomainFromHost();
  const storeKey = getStoreKeyFromHost();
  const slug = slugParam || storeKey;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const storeHomePath = slugParam ? `/store/${slugParam}` : "/";
  const blogIndexPath = slugParam ? `/store/${slugParam}/blog` : "/blog";

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.functions
      .invoke("getMarketplacePublic", { slug, customDomain })
      .then((res) => {
        if (!active) return;
        const mp = res.data?.marketplace;
        const post = (res.data?.blogs || []).find((p) => p.slug === blogSlug);
        if (!mp || !post) setNotFound(true);
        else setData({ marketplace: mp, post });
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug, customDomain, blogSlug]);

  const post = data?.post;
  const marketplace = data?.marketplace;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const storeLogo = marketplace?.branding?.logo || marketplace?.pageSections?.headerLogoUrl;

  // Custom renderers so markdown headings/lists/bold render properly
  // (no Tailwind Typography plugin installed — style them explicitly).
  const mdComponents = {
    h1: ({ ...p }) => <h2 className="text-2xl font-display font-bold mt-10 mb-4 leading-snug" {...p} />,
    h2: ({ ...p }) => <h2 className="text-2xl font-display font-bold mt-10 mb-4 leading-snug" {...p} />,
    h3: ({ ...p }) => <h3 className="text-xl font-display font-semibold mt-8 mb-3" {...p} />,
    h4: ({ ...p }) => <h4 className="text-lg font-semibold mt-6 mb-2" {...p} />,
    p: ({ ...p }) => <p className="text-[15px] leading-7 text-foreground/85 mb-5" {...p} />,
    ul: ({ ...p }) => <ul className="list-disc pl-6 space-y-2 mb-5 text-[15px] text-foreground/85" {...p} />,
    ol: ({ ...p }) => <ol className="list-decimal pl-6 space-y-2 mb-5 text-[15px] text-foreground/85" {...p} />,
    li: ({ ...p }) => <li className="leading-7" {...p} />,
    strong: ({ ...p }) => <strong className="font-semibold text-foreground" {...p} />,
    a: ({ ...p }) => <a className="text-orange-400 underline underline-offset-2 hover:text-orange-300" target="_blank" rel="noopener noreferrer" {...p} />,
    blockquote: ({ ...p }) => <blockquote className="border-l-4 border-orange-500/40 pl-4 italic text-muted-foreground my-6" {...p} />,
    img: ({ ...p }) => <img className="rounded-xl border border-border/40 my-6 w-full" {...p} />,
    hr: () => <hr className="my-8 border-border/30" />,
  };

  useSeoMeta(
    post
      ? {
          title: post.metaTitle || post.title,
          description: post.metaDescription || post.excerpt,
          image: post.coverImageUrl,
          url: pageUrl,
          keywords: post.keywords,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription || post.excerpt || "",
            image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
            datePublished: post.created_date,
            dateModified: post.updated_date || post.created_date,
            keywords: Array.isArray(post.keywords) ? post.keywords.join(", ") : undefined,
            mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
            publisher: {
              "@type": "Organization",
              name: marketplace?.name,
              logo: marketplace?.branding?.logo
                ? { "@type": "ImageObject", url: marketplace.branding.logo }
                : undefined,
            },
          },
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
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-display font-bold">Article not found</h1>
        <Link to={blogIndexPath} className="text-sm text-orange-400 hover:underline mt-2">← Back to blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <article className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <Link to={blogIndexPath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </Link>

        {post.coverImageUrl && (
          <img src={post.coverImageUrl} alt={post.title} className="w-full aspect-[16/7] object-cover rounded-2xl mb-8 border border-border/40" />
        )}

        <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-3 leading-tight">{post.title}</h1>

        {/* Byline: store logo + name + date */}
        <Link to={storeHomePath} className="flex items-center gap-3 mb-8 group w-fit">
          {storeLogo ? (
            <img src={storeLogo} alt={marketplace.name} className="w-10 h-10 rounded-full object-cover border border-border/40" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
              {marketplace.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold group-hover:text-orange-400 transition-colors">{marketplace.name}</p>
            {post.created_date && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {new Date(post.created_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        </Link>

        <div className="max-w-none">
          <ReactMarkdown components={mdComponents}>{post.content || ""}</ReactMarkdown>
        </div>

        {Array.isArray(post.keywords) && post.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border/30">
            {post.keywords.map((k) => (
              <span key={k} className="px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground text-xs">{k}</span>
            ))}
          </div>
        )}

        {/* CTA card — visit the store / software */}
        <Link to={storeHomePath} className="flex items-center gap-4 mt-12 p-5 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/5 hover:border-orange-500/50 transition-colors group">
          {storeLogo ? (
            <img src={storeLogo} alt={marketplace.name} className="w-14 h-14 rounded-xl object-cover border border-border/40 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {marketplace.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-display font-bold">{marketplace.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{marketplace.description || `Explore products and deals from ${marketplace.name}.`}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shrink-0 group-hover:opacity-90">
            Visit Store <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </article>
      <StoreFooter marketplace={marketplace} footerText={marketplace.pageSections?.footerText} />
    </div>
  );
}