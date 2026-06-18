import React from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/layout/SiteFooter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Terms of Service</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using ShareMySaaS ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
            <p>ShareMySaaS is a marketplace platform that facilitates the buying, selling, and investing in SaaS (Software-as-a-Service) businesses. We provide tools for listing, discovery, due diligence, and transaction facilitation.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. User Accounts</h2>
            <p>You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Listing Requirements</h2>
            <p>All SaaS listings must be accurate, complete, and not misleading. Sellers must have the legal right to sell or transfer the software. False representations may result in immediate removal and legal action.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Fees and Payments</h2>
            <p>ShareMySaaS charges a platform commission on successful transactions. All fees are disclosed prior to transaction completion. Payments are processed via Stripe and are subject to Stripe's terms of service.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Prohibited Activities</h2>
            <p>Users may not engage in fraudulent activity, manipulate listings, harass other users, violate intellectual property rights, or use the platform for any illegal purpose.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Disclaimers</h2>
            <p>The Platform is provided "as is." We do not guarantee the accuracy of any listing information, the suitability of any investment, or the completion of any transaction. Past performance does not indicate future results.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, ShareMySaaS shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Contact</h2>
            <p>For questions about these Terms, contact us at <Link to="/contact" className="text-primary hover:underline">our contact page</Link>.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}