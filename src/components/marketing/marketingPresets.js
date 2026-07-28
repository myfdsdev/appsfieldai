// Marketing Studio presets — carefully crafted directions for a promotional
// graphics / UGC video designer. The `prompt` is a design DIRECTION fed to the
// magic enhancer (which combines it with the store's content + user input) and
// is also used as a solid fallback when the enhancer isn't run.

export const IMAGE_PRESETS = [
  {
    id: "ugc_laptop",
    label: "Person Using Software on Laptop",
    emoji: "💻",
    prompt:
      "Authentic UGC-style photo of a happy real person at a bright modern desk, smiling and pointing at their open laptop that clearly shows the software's dashboard UI on screen. Candid, relatable, natural window lighting, shallow depth of field. Space for a bold headline at the top and a call-to-action button graphic at the bottom.",
  },
  {
    id: "feature_spotlight",
    label: "Feature Spotlight",
    emoji: "✨",
    prompt:
      "Clean, modern feature-highlight graphic. A large floating device mockup (laptop or phone) showing the software's key feature UI, surrounded by minimal floating icons and subtle gradient glow. Bold headline naming the feature, a one-line benefit, and a CTA. Premium SaaS look, plenty of negative space.",
  },
  {
    id: "offer_sale",
    label: "Offer / Discount Ad",
    emoji: "🔥",
    prompt:
      "High-energy promotional offer graphic. Big bold discount badge (e.g. 50% OFF / Limited Time), the product name, urgency copy and a bright CTA button. Vibrant contrasting colors, sale-poster energy, subtle confetti or spotlight, product screenshot integrated tastefully.",
  },
  {
    id: "testimonial_quote",
    label: "Customer Testimonial",
    emoji: "💬",
    prompt:
      "Social-proof testimonial graphic. A real, smiling customer headshot on one side, a short glowing quote review with 5 gold stars on the other, the product logo/name and a soft branded background. Trustworthy, warm, authentic UGC feel.",
  },
  {
    id: "before_after",
    label: "Before / After Result",
    emoji: "📈",
    prompt:
      "Split before-vs-after comparison graphic showing the pain (messy/stressful) on the left and the result after using the software (organized/successful, growth chart up) on the right. Clear divider, bold outcome headline, CTA. Persuasive and clean.",
  },
  {
    id: "phone_reaction",
    label: "Real Person Reaction (Phone)",
    emoji: "🤳",
    prompt:
      "Candid UGC selfie-style shot of an excited real person holding their phone which shows the software app screen, genuinely surprised/delighted expression, casual home or cafe background, natural lighting. Feels like a real social post. Room for a hooky headline overlay.",
  },
  {
    id: "team_hero",
    label: "Team / Hero Banner",
    emoji: "🚀",
    prompt:
      "Bold hero banner: a confident professional or small team in a modern workspace, big product logo and value-proposition headline, sleek gradient background matching a tech brand, prominent CTA button. Polished, aspirational, conversion-focused.",
  },
  {
    id: "comparison_grid",
    label: "Us vs Others",
    emoji: "⚖️",
    prompt:
      "Comparison-table style ad graphic: 'Us vs The Rest' with green checkmarks for the product and red crosses for competitors, showing the product's advantages. Confident headline, brand colors, product screenshot, CTA. Clean, data-driven, trustworthy.",
  },
];

export const VIDEO_PRESETS = [
  {
    id: "ugc_walk_talk",
    label: "UGC Walk & Talk Intro",
    emoji: "🚶",
    prompt:
      "Realistic UGC-style video from the reference image of the person. The person walks slowly and naturally toward the camera while speaking directly to the viewer with natural facial expressions, head movement and realistic lip-sync. Handheld selfie-style vertical shot, slight natural movement. Authentic TikTok/Reels style, natural lighting, casual and relatable, slight film grain, not overly polished. They enthusiastically introduce and recommend the software, ending with a clear call to action.",
  },
  {
    id: "ugc_desk_demo",
    label: "UGC Desk Demo",
    emoji: "🖥️",
    prompt:
      "Authentic UGC video: a real person sitting at their desk talking to the camera about the software, occasionally glancing at their laptop screen showing the product, natural gestures and genuine enthusiasm. Casual home-office vibe, natural light, realistic lip-sync. Conversational recommendation ending with a call to action.",
  },
  {
    id: "ugc_unboxing_reaction",
    label: "UGC First Reaction",
    emoji: "😮",
    prompt:
      "UGC-style reaction video: a real person tries the software for the first time on their phone/laptop and reacts with genuine surprise and delight, speaking naturally to the camera about how good it is. Handheld, authentic, relatable, natural expressions and lip-sync, ends with a recommendation and call to action.",
  },
  {
    id: "ugc_problem_solution",
    label: "Problem → Solution Story",
    emoji: "💡",
    prompt:
      "UGC story video: a real person starts by describing a frustrating problem they had, then reveals how the software solved it, speaking directly and conversationally to the camera with natural expressions. Selfie handheld style, authentic lighting, realistic lip-sync, ends on an upbeat call to action.",
  },
  {
    id: "ugc_testimonial",
    label: "Happy Customer Testimonial",
    emoji: "⭐",
    prompt:
      "Authentic UGC testimonial video: a satisfied real customer speaks warmly and sincerely to the camera about their great experience with the software and the results they got. Natural home setting, casual, trustworthy, realistic lip-sync and micro-expressions, ends by encouraging viewers to try it.",
  },
  {
    id: "ugc_street_vox",
    label: "Street / Vox-Pop Style",
    emoji: "🎤",
    prompt:
      "UGC vox-pop street-interview style video: a real person outdoors casually talks to the camera as if answering 'what tool changed your workflow?', enthusiastically naming and recommending the software. Handheld, natural daylight, authentic and energetic, realistic lip-sync, ends with a call to action.",
  },
  {
    id: "ugc_founder_pitch",
    label: "Founder Direct Pitch",
    emoji: "🧑‍💼",
    prompt:
      "UGC-style founder video: a confident but relatable person speaks directly to the camera like a founder personally introducing their software, explaining the core benefit in a genuine, conversational tone. Selfie handheld, natural lighting, realistic lip-sync, ends with an inviting call to action.",
  },
  {
    id: "ugc_quick_hook",
    label: "Fast Hook Promo",
    emoji: "⚡",
    prompt:
      "Punchy short UGC video: a real person delivers a fast, high-energy hook straight to camera ('You NEED to see this...'), quickly showing the software and its standout benefit, then a snappy call to action. Handheld vertical, authentic, natural lip-sync, quick pace, TikTok energy.",
  },
];