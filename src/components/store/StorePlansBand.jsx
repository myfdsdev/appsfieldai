import React from "react";
import StorePlansSection from "@/components/store/StorePlansSection";

// Storefront band that presents the store's subscription plans to visitors.
export default function StorePlansBand({ marketplace, customer, brandColor, title, subtitle }) {
  return (
    <section id="store-plans" className="max-w-7xl mx-auto px-6 py-14">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold">{title || "Membership Plans"}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {subtitle || "Pick a plan and get access to our products."}
        </p>
      </div>
      <StorePlansSection marketplace={marketplace} customer={customer} brandColor={brandColor} />
    </section>
  );
}