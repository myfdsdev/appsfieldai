import React from "react";
import { Input } from "@/components/ui/input";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";

// Hero Section editor for a store's Page Settings — mirrors the admin dashboard
// hero controls (badge, headline, subtitle, CTA, cover image, background style).
export default function HeroSectionEditor({ form, setForm, marketplace }) {
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const bgType = form.heroBgType || "gradient";

  const brandColor = marketplace?.branding?.primaryColor || "#f97316";
  const accentColor = marketplace?.branding?.accentColor || brandColor;
  const previewBg = (() => {
    if (bgType === "image" && form.headerImageUrl) {
      return `linear-gradient(to bottom, rgba(10,6,3,0.7), rgba(10,6,3,0.95)), url(${form.headerImageUrl}) center/cover`;
    }
    if (bgType === "solid") return form.heroSolidColor || "#0a0603";
    const gStart = form.heroGradientStart || `${brandColor}33`;
    const gEnd = form.heroGradientEnd || "#0a0603";
    return `radial-gradient(ellipse at top, ${gStart} 0%, ${gEnd} 60%)`;
  })();
  const previewOpacity = (form.heroBgOpacity ?? 100) / 100;

  return (
    <div className="space-y-4">
      {/* Store Logo */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Store Logo</p>
        <R2ImageUpload
          value={form.headerLogoUrl}
          onChange={val => set("headerLogoUrl", val)}
          campaignId={`${marketplace?.id || "store"}_logo`}
          placeholder="https://example.com/logo.png"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Shown in your store's top navigation bar. Leave empty to use your brand logo.</p>
      </div>

      {/* Hero Side Image + position */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Hero Side Image</p>
        <R2ImageUpload
          value={form.heroSideImageUrl}
          onChange={val => set("heroSideImageUrl", val)}
          campaignId={`${marketplace?.id || "store"}_hero_side`}
          placeholder="https://example.com/hero-visual.png"
        />
        <p className="text-[10px] text-muted-foreground mt-1">A feature image shown beside your hero headline (e.g. a product shot or illustration).</p>
        <div className="flex gap-2 mt-2">
          {[
            { val: "left", label: "Left" },
            { val: "center", label: "Center" },
            { val: "right", label: "Right" },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => set("heroSideImagePosition", opt.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                (form.heroSideImagePosition || "right") === opt.val
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                  : "bg-secondary/50 text-muted-foreground border-border/30 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badge */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Badge</p>
        <Input
          value={form.heroBadgeText || ""}
          onChange={e => set("heroBadgeText", e.target.value)}
          className="bg-secondary/50 border-border/30 rounded-xl"
          placeholder="The Future of SaaS Ownership"
        />
      </div>

      {/* Headline & subtitle */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Headline & Subtitle</p>
        <div className="space-y-2">
          <Input
            value={form.headerTitle || ""}
            onChange={e => set("headerTitle", e.target.value)}
            className="bg-secondary/50 border-border/30 rounded-xl"
            placeholder="Welcome to our marketplace"
          />
          <Input
            value={form.headerSubtitle || ""}
            onChange={e => set("headerSubtitle", e.target.value)}
            className="bg-secondary/50 border-border/30 rounded-xl"
            placeholder="Discover amazing software deals"
          />
        </div>
      </div>

      {/* CTA */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">CTA Button</p>
        <Input
          value={form.heroCtaText || ""}
          onChange={e => set("heroCtaText", e.target.value)}
          className="bg-secondary/50 border-border/30 rounded-xl"
          placeholder="Browse deals"
        />
      </div>

      {/* Background */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Background</p>
        <div className="flex gap-2 mb-3">
          {[
            { val: "gradient", label: "Gradient" },
            { val: "solid", label: "Solid Color" },
            { val: "image", label: "Image" },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => set("heroBgType", opt.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                bgType === opt.val
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                  : "bg-secondary/50 text-muted-foreground border-border/30 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {bgType === "gradient" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "heroGradientStart", label: "Start Color", fallback: "#f97316" },
              { key: "heroGradientEnd", label: "End Color", fallback: "#0a0603" },
            ].map(({ key, label, fallback }) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key] || fallback}
                    onChange={e => set(key, e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border/30 cursor-pointer bg-transparent p-0.5"
                  />
                  <Input
                    value={form[key] || ""}
                    onChange={e => set(key, e.target.value)}
                    placeholder={fallback}
                    className="bg-secondary/50 border-border/30 rounded-lg text-xs h-8 font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {bgType === "solid" && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.heroSolidColor || "#0a0603"}
              onChange={e => set("heroSolidColor", e.target.value)}
              className="w-8 h-8 rounded-lg border border-border/30 cursor-pointer bg-transparent p-0.5"
            />
            <Input
              value={form.heroSolidColor || ""}
              onChange={e => set("heroSolidColor", e.target.value)}
              placeholder="#0a0603"
              className="bg-secondary/50 border-border/30 rounded-lg text-xs h-8 font-mono w-40"
            />
          </div>
        )}

        {bgType === "image" && (
          <R2ImageUpload
            value={form.headerImageUrl}
            onChange={val => set("headerImageUrl", val)}
            campaignId={`${marketplace?.id || "store"}_hero`}
            placeholder="https://example.com/image.jpg"
          />
        )}

        {/* Opacity */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Background Opacity</p>
            <span className="text-xs text-orange-400 font-mono">{form.heroBgOpacity ?? 100}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={form.heroBgOpacity ?? 100}
            onChange={e => set("heroBgOpacity", Number(e.target.value))}
            className="w-full accent-orange-500 h-1.5 rounded-full"
          />
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Live Preview</p>
        <div className="rounded-xl overflow-hidden border border-border/20 p-6" style={{ background: previewBg, opacity: previewOpacity }}>
          {(() => {
            const sideImage = form.heroSideImageUrl;
            const sidePos = form.heroSideImagePosition || "right";
            const hasSideSplit = sideImage && (sidePos === "left" || sidePos === "right");
            const textAlign = hasSideSplit ? "text-left" : "text-center";

            const Text = (
              <div className={hasSideSplit ? "" : "mx-auto"}>
                {form.heroBadgeText && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-foreground/70 text-xs mb-4">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: brandColor }} />
                    {form.heroBadgeText}
                  </span>
                )}
                <h2 className="text-2xl font-display font-extrabold leading-tight mb-3">
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, ${accentColor})` }}>
                    {form.headerTitle || marketplace?.name || "Your Store"}
                  </span>
                </h2>
                <p className={`text-muted-foreground text-xs max-w-xs mb-4 line-clamp-2 ${hasSideSplit ? "" : "mx-auto"}`}>
                  {form.headerSubtitle || "Discover amazing software deals"}
                </p>
                <span className="inline-block px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold">
                  {form.heroCtaText || "Browse deals"}
                </span>
              </div>
            );

            const Img = <img src={sideImage} alt="" className="w-full max-w-[140px] rounded-lg object-contain" />;

            if (hasSideSplit) {
              return (
                <div className={`grid grid-cols-2 gap-4 items-center ${textAlign}`}>
                  {sidePos === "left" ? (
                    <>
                      <div className="flex justify-start">{Img}</div>
                      {Text}
                    </>
                  ) : (
                    <>
                      {Text}
                      <div className="flex justify-end">{Img}</div>
                    </>
                  )}
                </div>
              );
            }
            return (
              <div className="text-center">
                {sideImage && sidePos === "center" && (
                  <div className="flex justify-center mb-4">{Img}</div>
                )}
                {Text}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}