import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MessageSquare, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import SiteFooter from "@/components/layout/SiteFooter";

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke("sendEmail", {
        to: import.meta.env.VITE_ADMIN_EMAIL || "admin@sharemysaas.com",
        subject: `Contact Form: ${form.subject || "General Inquiry"} — from ${form.name}`,
        body: `<p><strong>From:</strong> ${form.name} (${form.email})</p><p><strong>Subject:</strong> ${form.subject || "General Inquiry"}</p><hr/><p>${form.message.replace(/\n/g, "<br/>")}</p>`,
        type: "contact_form",
      });
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (e) {
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground">Have a question or need help? We'd love to hear from you.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-card border border-border/40 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-xs text-muted-foreground mt-0.5">support@sharemysaas.com</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/40 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Live Chat</p>
                <p className="text-xs text-muted-foreground mt-0.5">Available Mon–Fri, 9am–6pm IST</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/40 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <p className="text-xs text-muted-foreground mt-0.5">+1 (800) SAAS-MKT</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/40">
              <p className="text-xs font-medium text-foreground mb-2">Quick Links</p>
              <div className="space-y-1.5">
                {[["FAQ", "/faq"], ["How It Works", "/how-it-works"], ["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"]].map(([label, path]) => (
                  <Link key={path} to={path} className="block text-xs text-primary hover:underline">{label}</Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-6 rounded-2xl bg-card border border-border/40">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Message Sent!</h3>
                <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
                <Button variant="ghost" className="mt-4 text-xs" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground mb-1">Send a Message</h2>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Full Name <span className="text-red-400">*</span></label>
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email <span className="text-red-400">*</span></label>
                  <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                  <Input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Message <span className="text-red-400">*</span></label>
                  <Textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Write your message here..." className="bg-secondary/50 border-border/30 rounded-xl h-28 resize-none" />
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-xl">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}