import React from "react";

// Dramatic dark backdrop: deep black fading into a warm orange glow that
// blooms from the lower-right, with a soft bright highlight in the upper-right.
export default function BeamBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      {/* Base black */}
      <div className="absolute inset-0 bg-black" />

      {/* Warm orange bloom from the lower-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_85%,rgba(255,90,0,0.9)_0%,rgba(255,60,0,0.45)_25%,rgba(120,30,0,0.2)_45%,transparent_65%)]" />

      {/* Secondary orange glow rising from the bottom-center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(255,80,10,0.4)_0%,transparent_55%)]" />

      {/* Soft bright highlight in the upper-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_92%_18%,rgba(255,235,220,0.5)_0%,rgba(255,200,160,0.15)_20%,transparent_45%)]" />

      {/* Subtle vignette to deepen the left side */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}