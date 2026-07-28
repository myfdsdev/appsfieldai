import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";

// Multi-image uploader for reference images. Uploads each file to R2 and keeps
// an array of URLs in `value`, calling onChange(newUrls).
export default function MultiImageUpload({ value = [], onChange, max = 5 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${max} images.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of toUpload) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`"${file.name}" is too large (max 10MB).`);
          continue;
        }
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await base44.functions.invoke("uploadToR2", {
          fileData,
          fileName: file.name,
          contentType: file.type,
          campaignId: "marketing-studio",
        });
        const url = res.data?.fileUrl;
        if (url) uploaded.push(url);
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} added`);
      }
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (url) => onChange(value.filter((u) => u !== url));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/40 bg-secondary/30">
            <img src={url} alt="reference" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 hover:border-orange-500/60 bg-secondary/20 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-orange-400 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            <span className="text-[10px]">{uploading ? "Uploading" : "Add"}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Upload className="w-3 h-3" /> Up to {max} reference images (person, product, brand). Used to guide the generation.
      </p>
    </div>
  );
}