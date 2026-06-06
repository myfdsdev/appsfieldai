import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Marketplace", "How It Works", "Calculator", "Dashboard"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">
              ShareMy<span className="text-primary">SaaS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Sign In</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-5">
              Get Started
            </Button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-3">
              {links.map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground py-2">
                  {l}
                </a>
              ))}
              <Button className="w-full bg-primary hover:bg-primary/90 rounded-full mt-2">Get Started</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}