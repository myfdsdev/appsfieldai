import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Auto-rotating 3-slide hero for the Appsfield store style, matching the
// reference: rounded card, left text (badge + big headline + subtext + dark
// CTA) and a right feature image with a soft fade. The first slide uses the
// owner's configured header title/subtitle/image; the other two are curated
// marketing slides so the hero always feels complete.
export default function StoreAppsfieldHero({ marketplace, sections = {} }) {
  const title = sections.headerTitle || marketplace.name;
  const subtitle =
    sections.headerSubtitle ||
    "Get white label and reseller software deals designed for marketers, agencies and entrepreneurs.";
  const heroImage = sections.headerImageUrl;

  const slides = [
    {
      badge: sections.heroBadgeText || "Appsfield Exclusive",
      badgeColor: "#FF6B00",
      badgeBorder: "border-orange-200",
      bg: "bg-orange-50",
      fade: "from-orange-50",
      title,
      subtitle,
      cta: sections.heroCtaText || "Explore Exclusive Deals",
      image: heroImage || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
    },
    {
      badge: "New AI Deals",
      badgeColor: "#2563eb",
      badgeBorder: "border-blue-200",
      bg: "bg-blue-50",
      fade: "from-blue-50",
      title: "Get Powerful AI Tools Without Monthly Fees",
      subtitle: "Discover practical AI software for content, video, marketing, automation and business growth.",
      cta: "Explore AI Tools",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80",
    },
    {
      badge: "Limited Time",
      badgeColor: "#E63946",
      badgeBorder: "border-red-200",
      bg: "bg-red-50",
      fade: "from-red-50",
      title: "Save Up to 90% on Selected Software Deals",
      subtitle: "Pay once and unlock long term software access before these deals disappear forever.",
      cta: "View Ending Deals",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
    },
  ];

  const [current, setCurrent] = useState(0);
  const timer = useRef(null);
  const total = slides.length;

  const start = () => { timer.current = setInterval(() => setCurrent((c) => (c + 1) % total), 5000); };
  useEffect(() => { start(); return () => clearInterval(timer.current); }, []);
  const pause = () => clearInterval(timer.current);
  const resume = () => { clearInterval(timer.current); start(); };
  const move = (dir) => setCurrent((c) => (c + dir + total) % total);

  const scrollToDeals = () => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] group"
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        <div className="overflow-hidden">
          <div className="flex w-full h-[450px] md:h-[400px] transition-transform duration-500" style={{ transform: `translateX(-${current * 100}%)` }}>
            {slides.map((s, i) => (
              <div key={i} className={`w-full flex-shrink-0 ${s.bg} flex flex-col md:flex-row items-center relative`}>
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center z-10">
                  <span className={`inline-block px-3 py-1 bg-white rounded-full text-[10px] font-bold tracking-wider mb-4 border ${s.badgeBorder} self-start uppercase`} style={{ color: s.badgeColor }}>
                    {s.badge}
                  </span>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#161616] leading-tight mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {s.title}
                  </h1>
                  <p className="text-[#6B7280] text-base md:text-lg mb-8 max-w-md leading-relaxed">{s.subtitle}</p>
                  <div>
                    <button
                      onClick={scrollToDeals}
                      className="bg-[#161616] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[#FF6B00] transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {s.cta}
                    </button>
                  </div>
                </div>
                <div className="w-full md:w-1/2 h-48 md:h-full relative opacity-40 md:opacity-100">
                  <div className={`absolute inset-0 bg-gradient-to-r ${s.fade} to-transparent z-10 hidden md:block`} />
                  <img src={s.image} alt="" className="w-full h-full object-cover object-left" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <button onClick={() => move(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white text-[#161616] z-20 opacity-0 group-hover:opacity-100 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => move(1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white text-[#161616] z-20 opacity-0 group-hover:opacity-100 transition">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${i === current ? "w-6 bg-[#FF6B00]" : "w-2.5 bg-gray-300"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}