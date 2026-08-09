import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Upload a TXT or PDF and append its text to the agent's knowledge base.
export default function KnowledgeFileUpload({ onExtracted }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    try {
      let text = "";
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        text = await file.text();
      } else {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: { type: "object", properties: { text: { type: "string" } } },
        });
        if (res.status !== "success") throw new Error(res.details || "Could not read that file.");
        text = res.output?.text || "";
      }
      if (!text.trim()) throw new Error("No text found in that file.");
      onExtracted(`\n\n--- ${file.name} ---\n${text.trim()}`);
      toast.success("Training data added.");
    } catch (err) {
      toast.error(err.message || "Could not read that file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".txt,.pdf,text/plain,application/pdf" onChange={handle} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/40 hover:bg-secondary/60 disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload TXT / PDF
      </button>
    </>
  );
}