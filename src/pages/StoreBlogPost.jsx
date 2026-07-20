import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { FileText, ArrowLeft, Calendar } from "lucide-react";
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
        {post.created_date && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(post.created_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
          <ReactMarkdown>{post.content || ""}</ReactMarkdown>
        </div>

        {Array.isArray(post.keywords) && post.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border/30">
            {post.keywords.map((k) => (
              <span key={k} className="px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground text-xs">{k}</span>
            ))}
          </div>
        )}

        <Link to={storeHomePath} className="inline-flex items-center justify-center mt-10 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold">
          Browse {marketplace.name} →
        </Link>
      </article>
      <StoreFooter marketplace={marketplace} footerText={marketplace.pageSections?.footerText} />
    </div>
  );
}