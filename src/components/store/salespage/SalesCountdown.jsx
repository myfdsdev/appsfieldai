import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Live "deal ends in" countdown. Renders nothing once the deal end date has passed.
export default function SalesCountdown({ endDate }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(endDate).getTime() - now;
  if (!(diff > 0)) return null;
  const parts = [
    [Math.floor(diff / 86400000), "Days"],
    [Math.floor((diff / 3600000) % 24), "Hrs"],
    [Math.floor((diff / 60000) % 60), "Min"],
    [Math.floor((diff / 1000) % 60), "Sec"],
  ];
  return (
    <div className="rounded-xl bg-yellow-400 text-black px-4 py-3">
      <p className="text-[11px] font-bold uppercase flex items-center gap-1 mb-1.5"><Clock className="w-3.5 h-3.5" /> Deal ends in</p>
      <div className="flex gap-3">
        {parts.map(([v, l]) => (
          <div key={l} className="text-center">
            <p className="text-xl font-display font-bold leading-none">{String(v).padStart(2, "0")}</p>
            <p className="text-[10px] font-semibold uppercase mt-0.5">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}