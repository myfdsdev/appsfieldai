import React from "react";

// Dramatic dark backdrop: a vertical beam of red light rising from the
// center and splaying out across a reflective floor at the base.
export default function BeamBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      {/* Deep ambient base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,#1a0606_0%,#0a0303_40%,#000000_75%)]" />

      {/* Central vertical light beam */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[3px] bg-gradient-to-b from-red-200 via-red-500/80 to-transparent blur-[2px]" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[140px] bg-gradient-to-b from-red-400/40 via-red-600/20 to-transparent blur-3xl" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[420px] bg-gradient-to-b from-red-500/15 via-red-700/10 to-transparent blur-[100px]" />

      {/* Bright red flare at the base where the beam lands */}
      <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 w-[560px] h-[320px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,60,40,0.55)_0%,rgba(200,20,20,0.25)_40%,transparent_70%)] blur-2xl" />
      <div className="absolute left-1/2 bottom-[14%] -translate-x-1/2 w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(255,170,150,0.7)_0%,transparent_70%)] blur-xl" />

      {/* Curved fiber-optic streaks splaying out at the bottom */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-[55%]" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="streakWarm" x1="720" y1="0" x2="720" y2="600" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fecaca" stopOpacity="0.9" />
            <stop offset="0.6" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="1" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 14, 28, 44, 62].map((o, i) => (
          <path
            key={`l-${i}`}
            d={`M720 0 C 720 ${380 + i * 8} ${690 - o} ${500 + i * 6} ${560 - o * 4} 600`}
            stroke="url(#streakWarm)"
            strokeWidth={1.5 - i * 0.15}
            fill="none"
          />
        ))}
        {[0, 14, 28, 44, 62].map((o, i) => (
          <path
            key={`r-${i}`}
            d={`M720 0 C 720 ${380 + i * 8} ${750 + o} ${500 + i * 6} ${880 + o * 4} 600`}
            stroke="url(#streakWarm)"
            strokeWidth={1.5 - i * 0.15}
            fill="none"
          />
        ))}
      </svg>

      {/* Reflective floor sheen */}
      <div className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-red-950/40 to-transparent" />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[70%] h-[10%] bg-gradient-to-t from-red-300/10 to-transparent blur-2xl" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}