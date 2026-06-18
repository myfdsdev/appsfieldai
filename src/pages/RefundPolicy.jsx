import React from "react";
import { Link } from "react-router-dom";
import { RotateCcw, ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/layout/SiteFooter";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Refund Policy</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Platform Subscription Fees</h2>
            <p>Subscription fees paid for marketplace plans are non-refundable once a billing period has begun. If you cancel your subscription, you will retain access until the end of the current billing period.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Share Purchases</h2>
            <p>Share purchases are generally final and non-refundable once a transaction is confirmed. Exceptions may apply in cases of seller misrepresentation, which must be reported within 7 days of transaction completion.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Full Ownership Acquisitions</h2>
            <p>Full acquisition transactions are governed by the specific terms agreed upon between buyer and seller. Platform fees charged on these transactions are non-refundable.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Disputed Transactions</h2>
            <p>If you believe a transaction was fraudulent or involved misrepresentation, contact our support team immediately at <Link to="/contact" className="text-primary hover:underline">our contact page</Link>. We will investigate and may issue refunds at our sole discretion.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Chargebacks</h2>
            <p>Initiating a chargeback without first contacting ShareMySaaS support may result in account suspension. We encourage users to resolve disputes directly with us before involving their payment provider.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Processing Time</h2>
            <p>Approved refunds are processed within 5-10 business days and returned to the original payment method.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}