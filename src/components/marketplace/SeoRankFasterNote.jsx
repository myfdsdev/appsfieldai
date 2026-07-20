import React, { useState } from "react";
import { ChevronDown, Rocket, ExternalLink } from "lucide-react";

const STEPS = [
  {
    title: "Submit your site to Google Search Console",
    body: "This is the #1 step. Add your store domain, verify it, and submit your sitemap so Google discovers and indexes your pages fast — a page that isn't indexed can never rank.",
    link: { label: "Open Google Search Console", url: "https://search.google.com/search-console" },
  },
  {
    title: "Request indexing for each new blog",
    body: "In Search Console, paste your blog URL into the top search bar and click \"Request Indexing\". This nudges Google to crawl it within hours instead of weeks.",
  },
  {
    title: "Publish consistently",
    body: "Google favors fresh, regular content. Aim for 1–3 posts a week around your keywords instead of one big batch.",
  },
  {
    title: "Add your store to Google Business & directories",
    body: "List your store on Google Business Profile, Product Hunt, relevant subreddits and directories. These early links help Google trust and rank your site sooner.",
  },
  {
    title: "Share every post on social",
    body: "Post links on LinkedIn, X, Facebook groups and your email list. Social traffic signals relevance and drives Google to crawl your pages faster.",
  },
];

export default function SeoRankFasterNote() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Rank Faster on Google</p>
            <p className="text-[11px] text-muted-foreground">
              Writing blogs is only step one — do these to actually get found & indexed.
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ol className="mt-4 space-y-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{s.body}</p>
                {s.link && (
                  <a
                    href={s.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-[12px] font-medium text-emerald-400 hover:underline"
                  >
                    {s.link.label} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}