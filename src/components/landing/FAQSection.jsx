import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is fractional SaaS ownership?",
    a: "Fractional SaaS ownership allows you to buy shares of a SaaS business instead of purchasing the entire product. You earn proportional revenue based on the number of shares you own, similar to how stocks work but for real digital businesses.",
  },
  {
    q: "How do payouts work?",
    a: "Revenue is distributed monthly to all shareholders proportionally. If a SaaS earns $1,000/month and you own 10% of shares, you receive $100/month. Payments are processed automatically through our secure payment system.",
  },
  {
    q: "Can I resell my shares?",
    a: "Yes! Our Share Resale Market allows you to list your shares for sale to other investors at any time. You set your price, and interested buyers can purchase them directly through the platform.",
  },
  {
    q: "How are SaaS businesses verified?",
    a: "Every SaaS listing undergoes a rigorous verification process including revenue verification through bank statements and analytics, code review, customer base validation, and legal compliance checks.",
  },
  {
    q: "Can I buy the entire SaaS later?",
    a: "Absolutely. If you start with fractional shares, you can purchase remaining shares over time or make a full acquisition offer. Many investors begin with shares and later acquire full ownership.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">Frequently Asked Questions</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl px-6 data-[state=open]:border-primary/20"
              >
                <AccordionTrigger className="text-sm font-display font-semibold hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}