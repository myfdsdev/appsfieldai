import React from "react";
import StorePlansSection from "@/components/store/StorePlansSection";
import { getStoreStyle } from "@/components/store/storeStyles";

// Storefront band that presents the store's subscription plans to visitors.
export default function StorePlansBand({ marketplace, customer, brandColor, title, subtitle, styleSlug }) {
  const style = getStoreStyle(styleSlug);
  const pal = style.palette;

  return (
    <section id="store-plans" className="max-w-7xl mx-auto px-6 py-14">
      <div className="text-center mb-8">
        <h2
          className="text-2xl md:text-3xl font-bold"
          style={{ fontFamily: style.headingFont, color: pal?.text }}
        >
          {title || "Membership Plans"}
        </h2>
        <p className="text-sm mt-2" style={{ color: pal?.text ? `${pal.text}99` : undefined }}>
          {subtitle || "Pick a plan and get access to our products."}
        </p>
      </div>
      <StorePlansSection marketplace={marketplace} customer={customer} brandColor={brandColor} pal={pal} />
    </section>
  );
}