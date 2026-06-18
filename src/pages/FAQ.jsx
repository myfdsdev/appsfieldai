import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle, ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/layout/SiteFooter";

const faqs = [
  {
    category: "General",
    items: [
      { q: "What is ShareMySaaS?", a: "ShareMySaaS is a marketplace that connects buyers, investors, and sellers of SaaS (Software-as-a-Service) businesses. You can buy full ownership of a SaaS product, purchase revenue shares, or list your own SaaS for sale or investment." },
      { q: "Who can use the platform?", a: "Anyone can browse listings. To buy, sell, or invest, you'll need to create an account. We welcome individual investors, entrepreneurs, and businesses globally." },
      { q: "Is ShareMySaaS regulated?", a: "ShareMySaaS is a marketplace facilitator, not a regulated financial exchange. Please read our Risk Disclaimer before making any investment decisions. Always consult a financial advisor." },
    ],
  },
  {
    category: "Buying & Investing",
    items: [
      { q: "How do I buy shares in a SaaS?", a: "Click 'Reserve a Spot' or 'Place a Bid' on any listing. Our team will contact you to complete the transaction. Share purchases represent a revenue-share arrangement." },
      { q: "What is a full acquisition?", a: "A full acquisition means you purchase complete ownership of the SaaS business, including its code, customers, revenue, and brand. Click 'Request Acquisition' on the listing page." },
      { q: "How are returns paid?", a: "Revenue share holders receive periodic dividends based on their proportional ownership. Dividends are distributed by the admin based on reported monthly revenue." },
      { q: "How do I verify a listing's financials?", a: "Sellers must provide revenue proof documents. However, ShareMySaaS does not independently audit these figures. We strongly recommend conducting your own due diligence." },
    ],
  },
  {
    category: "Selling",
    items: [
      { q: "How do I list my SaaS?", a: "Go to 'Sell My SaaS' from the navigation menu. Fill in your software details, revenue figures, and pricing. Your listing will be reviewed by our team before going live." },
      { q: "What does it cost to list?", a: "Listing is free. ShareMySaaS charges a commission percentage on successful transactions. The exact rate depends on your plan." },
      { q: "How long does approval take?", a: "Most listings are reviewed within 24-48 hours. We may contact you for additional information or documentation." },
    ],
  },
  {
    category: "Payments & Security",
    items: [
      { q: "How are payments processed?", a: "Payments are processed securely via Stripe. We support major credit/debit cards and bank transfers depending on transaction size." },
      { q: "Is my money safe?", a: "We use industry-standard encryption and Stripe for payment processing. However, investing always carries risk. Please read our Risk Disclaimer." },
      { q: "What if something goes wrong?", a: "Contact our support team immediately via the Contact page. We investigate all disputes and may issue refunds in cases of verified fraud or misrepresentation." },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/30 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Frequently Asked Questions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Everything you need to know about ShareMySaaS</p>
          </div>
        </div>

        <div className="space-y-6">
          {faqs.map((section) => (
            <div key={section.category} className="p-6 rounded-2xl bg-card border border-border/40">
              <h2 className="text-sm font-display font-bold text-primary mb-2">{section.category}</h2>
              <div>
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center p-6 rounded-2xl bg-card border border-border/40">
          <p className="text-sm text-muted-foreground mb-3">Can't find what you're looking for?</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}