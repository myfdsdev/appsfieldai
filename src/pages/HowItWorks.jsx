import React from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardCheck, DollarSign, TrendingUp, ArrowRight, Zap, Upload, Shield } from "lucide-react";
import SiteFooter from "@/components/layout/SiteFooter";

const buyerSteps = [
  { icon: Search, step: "01", title: "Browse Listings", desc: "Explore hundreds of verified SaaS businesses filtered by category, revenue, growth rate, and risk score.", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: ClipboardCheck, step: "02", title: "Request & Due Diligence", desc: "Reserve a spot, place a bid, or request a full acquisition. Review financials, screenshots, and demo videos.", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: DollarSign, step: "03", title: "Complete Transaction", desc: "Our team facilitates the deal. Payments are processed securely via Stripe with full documentation.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: TrendingUp, step: "04", title: "Earn Returns", desc: "Share holders receive regular dividends. Full owners take complete control of their new SaaS business.", color: "text-amber-400", bg: "bg-amber-500/10" },
];

const sellerSteps = [
  { icon: Upload, step: "01", title: "Submit Your Listing", desc: "Fill out the listing form with your software details, revenue metrics, and asking price or share structure.", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: Shield, step: "02", title: "Admin Review", desc: "Our team reviews your listing for completeness and accuracy. We may request additional documentation.", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Zap, step: "03", title: "Go Live", desc: "Approved listings go live on the marketplace. You'll receive notifications when buyers express interest.", color: "text-primary", bg: "bg-primary/10" },
  { icon: DollarSign, step: "04", title: "Get Paid", desc: "Once a deal closes, funds are transferred to you securely. Our team handles all paperwork.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            How <span className="text-primary">ShareMySaaS</span> Works
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether you're buying, investing, or selling — our streamlined process makes SaaS transactions simple, transparent, and secure.
          </p>
        </div>

        {/* For Buyers/Investors */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-lg font-display font-bold text-foreground px-4">For Buyers & Investors</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {buyerSteps.map((s) => (
              <div key={s.step} className="p-6 rounded-2xl bg-card border border-border/40 flex gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">{s.step}</span>
                    <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/marketplace" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Browse Listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* For Sellers */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-lg font-display font-bold text-foreground px-4">For Sellers</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {sellerSteps.map((s) => (
              <div key={s.step} className="p-6 rounded-2xl bg-card border border-border/40 flex gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">{s.step}</span>
                    <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/sell" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-primary/50 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
              List Your SaaS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* FAQ CTA */}
        <div className="text-center p-8 rounded-2xl bg-card border border-border/40">
          <h3 className="text-base font-semibold text-foreground mb-2">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-4">Check out our FAQ or reach out to our team directly.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/faq" className="px-5 py-2 rounded-xl bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors">View FAQ</Link>
            <Link to="/contact" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}