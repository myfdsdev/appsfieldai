import React from "react";
import { Link } from "react-router-dom";
import { Zap, TrendingUp, Shield, Users, ArrowRight } from "lucide-react";
import SiteFooter from "@/components/layout/SiteFooter";

const stats = [
  { value: "$12M+", label: "Transaction Volume" },
  { value: "500+", label: "Active Listings" },
  { value: "2,000+", label: "Registered Investors" },
  { value: "98%", label: "Satisfaction Rate" },
];

const values = [
  { icon: Shield, title: "Transparency", desc: "Every listing undergoes our review process. We surface key metrics so you can make informed decisions.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: TrendingUp, title: "Growth Focused", desc: "We hand-pick high-potential SaaS businesses with strong fundamentals and growth trajectories.", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Users, title: "Community Driven", desc: "Our marketplace thrives on trust between buyers, sellers, and investors who share a passion for SaaS.", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Zap, title: "Fast & Simple", desc: "From discovery to deal close — our streamlined process removes friction at every step.", color: "text-amber-400", bg: "bg-amber-500/10" },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" /> About ShareMySaaS
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            The Premier Marketplace for<br />
            <span className="text-primary">SaaS Investments</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            ShareMySaaS connects ambitious buyers and investors with profitable SaaS businesses — making the buying, selling, and investing in software companies accessible to everyone.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-5 rounded-2xl bg-card border border-border/40">
              <p className="text-2xl font-display font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="p-8 rounded-2xl bg-card border border-border/40 mb-12">
          <h2 className="text-xl font-display font-bold text-foreground mb-3">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe that great SaaS businesses shouldn't be locked behind walls accessible only to institutional investors and venture capitalists. ShareMySaaS democratizes access to SaaS investment opportunities, enabling individuals to participate in the software economy — whether by acquiring a business outright, buying shares, or partnering with operators who want to grow.
          </p>
        </div>

        {/* Values */}
        <h2 className="text-xl font-display font-bold text-foreground mb-6">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {values.map((v) => (
            <div key={v.title} className="p-6 rounded-2xl bg-card border border-border/40 flex gap-4">
              <div className={`w-10 h-10 rounded-xl ${v.bg} flex items-center justify-center shrink-0`}>
                <v.icon className={`w-5 h-5 ${v.color}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Explore the Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}