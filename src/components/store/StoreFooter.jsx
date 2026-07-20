import React from "react";
import { Link } from "react-router-dom";
import { Store, Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { getStoreStyle } from "@/components/store/storeStyles";

// Simple TikTok glyph (not in lucide) so we can show a TikTok link too.
const TikTokIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.5 3c.3 2 1.6 3.6 3.5 4v2.4c-1.3 0-2.5-.3-3.5-.9v6.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.5a3.1 3.1 0 1 0 2.2 3V3h2z" />
  </svg>
);

const SOCIALS = [
  { key: "facebook", Icon: Facebook },
  { key: "instagram", Icon: Instagram },
  { key: "twitter", Icon: Twitter },
  { key: "linkedin", Icon: Linkedin },
  { key: "youtube", Icon: Youtube },
  { key: "tiktok", Icon: TikTokIcon },
];

export default function StoreFooter({ marketplace, footerText, footerLogoUrl, socialLinks = {}, customPages = [], storeBasePath = "", affiliateEnabled = false, styleSlug }) {
  const style = getStoreStyle(styleSlug);
  const pal = style.palette;
  const brandColor = pal?.accent || marketplace?.branding?.primaryColor || "#f97316";
  const year = new Date().getFullYear();
  const defaultText = `© ${year} ${marketplace?.name || "Our Store"}. All rights reserved.`;
  const footerPages = (customPages || []).filter(p => p.showInFooter);
  const logo = footerLogoUrl || marketplace?.branding?.logo;
  const socials = SOCIALS.filter(s => (socialLinks?.[s.key] || "").trim());

  return (
    <footer
      className="border-t border-border/40 bg-card/40 backdrop-blur-xl mt-8"
      style={pal ? { background: pal.card, borderColor: pal.cardBorder } : undefined}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6" style={{ fontFamily: style.bodyFont }}>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to={`${storeBasePath}/blog`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          {footerPages.map(p => (
            <Link key={p.id} to={`${storeBasePath}/page/${p.slug}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {p.title}
            </Link>
          ))}
          {affiliateEnabled && (
            <Link to={`${storeBasePath}/affiliates`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Affiliate Program
            </Link>
          )}
        </div>

        {/* Social profiles */}
        {socials.length > 0 && (
          <div className="flex items-center justify-center gap-3">
            {socials.map(({ key, Icon }) => (
              <a
                key={key}
                href={socialLinks[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className="w-9 h-9 rounded-lg border border-border/40 bg-secondary/40 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                style={{ "--hover": brandColor }}
                onMouseEnter={(e) => { e.currentTarget.style.background = brandColor; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {logo ? (
              <img src={logo} alt={marketplace?.name} className="h-8 w-auto max-w-[160px] rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: brandColor }}>
                <Store className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-display font-semibold text-sm" style={pal ? { fontFamily: style.headingFont, letterSpacing: "0.02em" } : undefined}>{marketplace?.name}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">{footerText || defaultText}</p>
          {marketplace?.supportEmail && (
            <a href={`mailto:${marketplace.supportEmail}`} className="text-xs text-muted-foreground hover:text-foreground">{marketplace.supportEmail}</a>
          )}
        </div>
      </div>
    </footer>
  );
}