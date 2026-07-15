import React, { useEffect, useRef } from "react";

// A centered, glowing particle-ring voice visualizer (à la "Future Technology").
// Thousands of dots orbit in a circle, their radius modulated by layered sine
// waves so the ring ripples and breathes. It surges energetically while the
// agent speaks and settles to a calm idle shimmer otherwise.
export default function DealMakerVoiceWave({ speaking = false, brandColor = "#6366f1" }) {
  const canvasRef = useRef(null);
  const speakingRef = useRef(speaking);
  const ampRef = useRef(0);

  useEffect(() => { speakingRef.current = speaking; }, [speaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;

    const hexToRgb = (hex) => {
      const m = hex.replace("#", "");
      const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
      const n = parseInt(v, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const c1 = hexToRgb(brandColor);
    const c2 = hexToRgb("#22d3ee");
    const c3 = hexToRgb("#a855f7");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const DOTS = 220;
    const RINGS = 3;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.24;

      // Ease amplitude toward target so speaking/idle transitions are smooth.
      const target = speakingRef.current ? 1 : 0.12;
      ampRef.current += (target - ampRef.current) * 0.08;
      const amp = ampRef.current;

      for (let ring = 0; ring < RINGS; ring++) {
        const ringR = baseR * (1 + ring * 0.14);
        const [r, g, b] =
          ring === 0 ? c1 : ring === 1 ? c2 : c3;
        for (let i = 0; i < DOTS; i++) {
          const a = (i / DOTS) * Math.PI * 2;
          // Layered sine waves create the rippling, uneven particle ring.
          const wave =
            Math.sin(a * 6 + t * 2 + ring) * 14 * amp +
            Math.sin(a * 11 - t * 1.5) * 9 * amp +
            Math.sin(a * 3 + t) * 6;
          const rr = ringR + wave + ring * 6;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          const size = (0.6 + Math.abs(Math.sin(a * 8 + t)) * 1.6) * (0.8 + amp * 0.6);
          const alpha = 0.25 + Math.abs(Math.sin(a * 5 + t + ring)) * 0.55 * (0.5 + amp);
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      t += speakingRef.current ? 0.05 : 0.015;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [brandColor]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full max-w-[900px] max-h-[900px]" />
    </div>
  );
}