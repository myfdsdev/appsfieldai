import React from "react";

// Single hero for the Appsfield store style: rounded card, left text
// (badge + big headline + subtext + dark CTA) and a right feature image with
// a soft fade. Uses the owner's configured header title/subtitle/image, badge,
// CTA and Background settings so the hero always matches Page Settings.
export default function StoreAppsfieldHero({ marketplace, sections = {} }) {
  const title = sections.headerTitle || marketplace.name;
  const subtitle =
    sections.headerSubtitle ||
    "Get white label and reseller software deals designed for marketers, agencies and entrepreneurs.";
  // Right-side feature image uses the dedicated Hero Side Image field.
  const sideImage = sections.heroSideImageUrl;
  const badge = sections.heroBadgeText || "Appsfield Exclusive";
  const cta = sections.heroCtaText || "Explore Exclusive Deals";

  // Background driven by Page Settings → Background (gradient / solid / image).
  // Defaults to the store's cover image (headerImageUrl) when set, so the hero
  // shows the cover instead of a plain color.
  const opacity = (sections.heroBgOpacity ?? 100) / 100;
  let bgStyle = sections.headerImageUrl
    ? { backgroundImage: `url(${sections.headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: "#FFF7ED" };
  if (sections.heroBgType === "solid" && sections.heroSolidColor) {
    bgStyle = { backgroundColor: sections.heroSolidColor };
  } else if (sections.heroBgType === "gradient" && (sections.heroGradientStart || sections.heroGradientEnd)) {
    const start = sections.heroGradientStart || "#FFF7ED";
    const end = sections.heroGradientEnd || "#FFEDD5";
    bgStyle = { background: `linear-gradient(135deg, ${start}, ${end})` };
  } else if (sections.heroBgType === "image" && sections.headerImageUrl) {
    bgStyle = { backgroundImage: `url(${sections.headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
  }

  const scrollToDeals = () => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB]">
        {/* Full-card background */}
        <div className="absolute inset-0" style={{ ...bgStyle, opacity }} />
        {/* Light gradient scrim on the left so the dark text stays readable over a photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/50 to-transparent" />

        <div className="relative z-10 flex w-full min-h-[400px] flex-col md:flex-row items-stretch">
          <div className="w-full md:flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <span className="inline-block px-3 py-1 bg-white rounded-full text-[10px] font-bold tracking-wider mb-4 border border-orange-200 self-start uppercase" style={{ color: "#FF6B00" }}>
              {badge}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#161616] leading-tight mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {title}
            </h1>
            <p className="text-[#6B7280] text-base md:text-lg mb-8 max-w-md leading-relaxed">{subtitle}</p>
            <div>
              <button
                onClick={scrollToDeals}
                className="bg-[#161616] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[#FF6B00] transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {cta}
              </button>
            </div>
          </div>

          {/* Hero Side Image — placed at the top-right */}
          {sideImage && (
            <div className="w-full md:w-[42%] shrink-0 flex items-start justify-end p-6 md:p-8">
              <img
                src={sideImage}
                alt=""
                className="w-full h-44 md:h-64 object-cover rounded-xl shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}