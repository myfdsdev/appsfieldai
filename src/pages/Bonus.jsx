import React from "react";
import { motion } from "framer-motion";
import { Gift, ExternalLink, Download, Mail, Sparkles } from "lucide-react";

const FRONT_END_BONUSES = [
  { title: "The Store Launch Playbook", url: "https://appsfieldai.com/bonuses/Launch-Playbook", cta: "Open" },
  { title: "The DealMaker Training Vault", url: "https://appsfieldai.com/bonuses/DealMaker-Training-Vault", cta: "Open" },
  { title: "100 Client Outreach Scripts", url: "https://appsfieldai.com/bonuses/Client-Outreach-Scripts/", cta: "Open" },
];

const BUNDLE_BONUSES = [
  { title: "WebFramer Access — free plan signup", url: "https://app.webframer.in/register/client_signup", cta: "Sign Up" },
  { title: "FlowMotion Access", url: "https://flowmotion.in/", cta: "Open" },
];

const DOWNLOAD_BONUSES = [
  { title: "JetEngine Pro", desc: "Create dynamic websites with custom post types, taxonomies, and listing layouts.", url: "https://mega.nz/file/KqYD1SZZ#nevPgr9mO7hEtJ8brbSb0CjqYZViqP4K-s3Dr5JcxXk" },
  { title: "Brizy Pro Builder", desc: "The easiest drag-and-drop builder to create stunning WordPress sites without code.", url: "https://mega.nz/file/DyxzkDID#L8HE4jF1cHlk52OEwTkpf5UkIVk9GYXcUZAdl4MSBiU" },
  { title: "Sociopro Suite", desc: "Control your social presence, protect your data, and build an engaged community.", url: "https://mega.nz/file/7mpTiB4I#LxupGdNWuHzqXNFsbBCiySUSOBmnmdCLt-wWpNALUEY" },
  { title: "Extended Widget Control", desc: "Manage WordPress widgets with advanced visibility, styling and placement.", url: "https://mega.nz/file/v6wgRZhA#xffO-5u7BdyRWYtshO29wZipuRcAR8QlKYIobWx4_gc" },
  { title: "MightyEditor Pro", desc: "A powerful online graphics editor with smart tools to create visuals effortlessly.", url: "https://mega.nz/file/OupjALAA#9GOGjdwkQYgETOYnoVRvfBuWJKJ7bQ2A9G_BA_i7HLA" },
  { title: "AI Illustration Mastery", desc: "Create eye-catching, unique illustrations and elevate your design portfolio.", url: "https://mega.nz/file/CzQTSaTb#j0ot02VhFj19MFO5S1-DaYnMIWWviYQqGq9TSmXAhls" },
  { title: "AI Avatar Agency Profits", desc: "Launch a high-income AI avatar agency and start earning $750+ weekly.", url: "https://mega.nz/file/bn42SAiA#OZ6_0qzHrz_CfzkjdkNcKCvp12xo1yhM63cIAabEOZs" },
  { title: "Passive Income for Designers", desc: "Sell graphics, fonts, and illustrations for recurring income.", url: "https://mega.nz/file/3iww2DxC#1LEbGPCFkm8RlOXv8JM9vkz6cr2Pl0qPKpqAR7QBpLc" },
  { title: "Pinterest Growth Strategies 2025", desc: "The latest Pinterest strategies to drive massive traffic and sales.", url: "https://mega.nz/file/z2wByK7C#TIqyqa32ubcX-iksERfTt0YxSIxFWg1WGQRx4uKH34I" },
  { title: "FastAI Content Creator", desc: "Generate blog posts, ads, and AI images in seconds.", url: "https://mega.nz/file/iipmxaBJ#itBpZ8l7YY-A4rae5Hilnw8NSeOki8jTMFHt4Krkjro" },
  { title: "WordPress Mastery 2025", desc: "Build fast, optimized, and high-converting websites.", url: "https://mega.nz/file/vz4iSIAL#p8l3m9ZiokEv38Ahq-q043zP0V9MpICSlyON_n9K7B4" },
  { title: "AI Newsroom JupiterMeet Suite", desc: "Whitelabel · Value $485. Host breaking news panels, interviews, and live virtual events.", url: "https://mega.nz/file/GmgkFCbR#Z7Ppj5Bt69ksq-rsLKhctMF0DYy0R9nyEw_dSZPdXcw" },
  { title: "AI RadioStation CastLab Pro", desc: "Whitelabel · Value $265. Stream live audio commentary and news coverage.", url: "https://mega.nz/file/7rwykARI#zV7og_LnsIvwy88zLM9E3449tXWnTriSN4QpziqFNAM" },
  { title: "NewsBot AutoPoster Engine", desc: "Whitelabel · Value $495. Pulls news content, videos and social posts into your site 24/7.", url: "https://mega.nz/file/m2YSjA4Y#xiOoizF63fjy4FOAdYJq2sCzu8Rg7Vx3dKKSPy_g3qY" },
  { title: "FluxNews AI Mobile App Builder", desc: "Value $397. Convert your WordPress news site into native iOS and Android apps.", url: "https://mega.nz/file/TiwlkKTC#AunSKiW8WoC6T79R0Y6qgjKEZ5_eKCI5Lbp1IfQs-gQ" },
  { title: "NewsPro AI Mobile Suite", desc: "Value $425. Turn any WordPress news site into sleek Android and iOS apps.", url: "https://mega.nz/file/XnYwwLpL#e3yzhZHkWtzK6HCWJV9Kofs__4iGixf3jO3j1zwxXEI" },
];

const LinkRow = ({ title, url, cta = "Open" }) => (
  <a href={url} target="_blank" rel="noopener noreferrer"
    className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/60 hover:border-orange-500/40 hover:bg-orange-500/5 transition-colors">
    <span className="text-sm font-medium">{title}</span>
    <span className="flex items-center gap-1.5 text-xs font-medium text-orange-400 shrink-0">
      {cta} <ExternalLink className="w-3.5 h-3.5" />
    </span>
  </a>
);

const DownloadCard = ({ title, desc, url }) => (
  <a href={url} target="_blank" rel="noopener noreferrer"
    className="flex flex-col p-4 rounded-xl border border-border/40 bg-card/60 hover:border-orange-500/40 hover:bg-orange-500/5 transition-colors">
    <p className="text-sm font-semibold">{title}</p>
    {desc && <p className="text-xs text-muted-foreground mt-1 flex-1">{desc}</p>}
    <span className="flex items-center gap-1.5 text-xs font-medium text-orange-400 mt-3">
      <Download className="w-3.5 h-3.5" /> Download
    </span>
  </a>
);

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
    {children}
  </div>
);

export default function Bonus() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Your Bonuses</h1>
            <p className="text-sm text-muted-foreground">Exclusive extras included with your AppsfieldAI purchase.</p>
          </div>
        </div>
      </motion.div>

      <Section title="Front End Bonuses">
        <div className="grid gap-3">
          {FRONT_END_BONUSES.map((b) => <LinkRow key={b.title} {...b} />)}
        </div>
      </Section>

      <Section title="Bundle & Affiliate Bonuses">
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-start gap-2.5">
          <Mail className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Exclusive bonuses for magicpodsai, clipsfield and magicdesigner customers — email{" "}
            <a href="mailto:support@appsfieldai.com" className="text-orange-400 font-medium">support@appsfieldai.com</a> to claim.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUNDLE_BONUSES.map((b) => <LinkRow key={b.title} {...b} />)}
        </div>
      </Section>

      <Section title="Downloadable Bonuses">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOWNLOAD_BONUSES.map((b) => <DownloadCard key={b.title} {...b} />)}
        </div>
      </Section>

      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
        <Sparkles className="w-4 h-4 text-orange-400" /> Thanks for purchasing AppsfieldAI.
      </div>
    </div>
  );
}