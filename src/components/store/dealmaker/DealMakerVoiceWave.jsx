import React from "react";

// Siri-style "Apple Intelligence" glow — three spinning conic-gradient borders
// framing the immersive chat. It rests calm and dim, then brightens and spins
// faster while the agent is speaking.
export default function DealMakerVoiceWave({ speaking = false }) {
  const cls = `dm-siri-glow${speaking ? " dm-siri-speaking" : ""}`;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
      style={{ opacity: speaking ? 1 : 0.45 }}
    >
      <div className={`${cls} dm-siri-sm`} />
      <div className={`${cls} dm-siri-md`} />
      <div className={`${cls} dm-siri-lg`} />
    </div>
  );
}