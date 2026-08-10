import { base44 } from "@/api/base44Client";

export const SUPPORT_AGENT_DEFAULTS = {
  enabled: true,
  name: "AppsField Help Agent",
  tagline: "Help with your app's features & settings",
  mascotImageUrl: "https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/9f58417c6_image__3_.png",
  bubbleText: "👋 Ask me anything regarding AppsField",
  greeting: "How can I help you today?",
  knowledgeBase: "",
  quickPrompts: [
    "How do I set up a custom domain?",
    "How do I enable PayPal payments?",
    "How do I configure the Deal Maker agent?",
  ],
};

// Global (super-admin managed) support agent settings, stored on AppConfig(key: "support_agent").
export async function fetchSupportAgentSettings() {
  const rows = await base44.entities.AppConfig.filter({ key: "support_agent" });
  return { ...SUPPORT_AGENT_DEFAULTS, ...(rows[0]?.supportAgent || {}) };
}