import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Code2, AlertTriangle } from "lucide-react";

// Editor for custom head/body code — FB/Google pixels, analytics, verification tags.
export default function CustomCodeEditor({ form, setForm }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Paste tracking pixels, analytics, or verification snippets. This code runs on your public store — only add code from sources you trust.
        </p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5" /> Head Code (e.g. Meta / Google Pixel, GA, verification)
        </label>
        <Textarea
          value={form.customCodeHead || ""}
          onChange={(e) => setForm((f) => ({ ...f, customCodeHead: e.target.value }))}
          className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-32 font-mono text-xs no-global-input-style"
          placeholder={"<!-- Meta Pixel, Google Analytics, etc. -->\n<script>...</script>"}
          spellCheck={false}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5" /> Body Code (loads at end of page — chat widgets, etc.)
        </label>
        <Textarea
          value={form.customCodeBody || ""}
          onChange={(e) => setForm((f) => ({ ...f, customCodeBody: e.target.value }))}
          className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-32 font-mono text-xs no-global-input-style"
          placeholder={"<!-- Chat widget, noscript pixel, etc. -->"}
          spellCheck={false}
        />
      </div>
    </div>
  );
}