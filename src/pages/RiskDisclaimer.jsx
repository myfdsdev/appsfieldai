import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/layout/SiteFooter";

export default function RiskDisclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Risk Disclaimer</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Important notice for all users</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-8">
          <p className="text-sm text-amber-300 font-medium">⚠️ Investing in SaaS businesses involves significant risk. Please read this disclaimer carefully before making any investment decisions.</p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Not Financial Advice</h2>
            <p>Nothing on ShareMySaaS constitutes financial, investment, legal, or tax advice. All content is for informational purposes only. Always consult a qualified financial advisor before making investment decisions.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Investment Risk</h2>
            <p>Investing in SaaS businesses is inherently risky. You may lose some or all of your invested capital. Past performance is not indicative of future results. Revenue figures and growth rates are based on seller-provided data and have not been independently verified.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Liquidity Risk</h2>
            <p>Shares in SaaS businesses listed on this platform may be illiquid. There is no guarantee that you will be able to sell your shares at any time or at a favorable price.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Due Diligence</h2>
            <p>Buyers are solely responsible for conducting their own due diligence on any listing. ShareMySaaS does not verify the accuracy of seller-provided financial data, user metrics, or technical claims.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Platform Risk</h2>
            <p>ShareMySaaS is a marketplace facilitator only. We are not a party to any transaction and bear no liability for the performance or failure of any listed SaaS business.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Regulatory Compliance</h2>
            <p>Investment regulations vary by jurisdiction. It is your responsibility to ensure that any investment you make complies with applicable laws in your country or region.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}