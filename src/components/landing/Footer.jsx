import React from "react";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/30 py-12 px-4 sm:px-6 lg:px-8">
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

          <div>
            <h4 className="text-sm font-display font-bold mb-4">Platform</h4>
            <div className="space-y-2.5">
              {["Marketplace", "How It Works", "Calculator", "Dashboard"].map((l) => (
                <a key={l} href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-display font-bold mb-4">Resources</h4>
            <div className="space-y-2.5">
              {["Documentation", "API", "Blog", "Support"].map((l) => (
                <a key={l} href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-display font-bold mb-4">Legal</h4>
            <div className="space-y-2.5">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"].map((l) => (
                <a key={l} href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">© 2026 ShareMySaaS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["Twitter", "LinkedIn", "Discord"].map((s) => (
              <a key={s} href="#" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}