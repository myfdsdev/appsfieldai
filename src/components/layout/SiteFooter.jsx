import React from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const LINKS = {
  Platform: [
    { label: "Marketplace", to: "/marketplace" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "Pricing", to: "/pricing" },
    { label: "Live Auctions", to: "/auctions" },
  ],
  Company: [
    { label: "About Us", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "FAQ", to: "/faq" },
    { label: "Sell Your SaaS", to: "/sell" },
  ],
  Legal: [
    { label: "Terms of Service", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Risk Disclaimer", to: "/risk-disclaimer" },
    { label: "Refund Policy", to: "/refund-policy" },
  ],
};

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/30 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg font-display font-bold">
                ShareMy<span className="text-primary">SaaS</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The premier marketplace for buying, selling, and investing in SaaS businesses.
            </p>
          </div>

          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-sm font-display font-bold mb-4">{section}</h4>
              <div className="space-y-2.5">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">© 2026 ShareMySaaS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/risk-disclaimer" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">Risk Disclaimer</Link>
            <Link to="/privacy" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}