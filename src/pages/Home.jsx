import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import MarketplaceSection from "@/components/landing/MarketplaceSection";
import StatsSection from "@/components/landing/StatsSection";
import CalculatorSection from "@/components/landing/CalculatorSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import TrustSection from "@/components/landing/TrustSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <MarketplaceSection />
      <StatsSection />
      <CalculatorSection />
      <BenefitsSection />
      <TrustSection />
      <DashboardPreview />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}