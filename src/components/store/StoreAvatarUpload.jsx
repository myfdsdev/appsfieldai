import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Circular avatar with an upload overlay. Uploads the picked image via the
// UploadFile integration and returns the resulting URL through onChange.
export default function StoreAvatarUpload({ value, onChange, fallbackName, brandColor = "#f97316", size = 96 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
      toast.success("Profile picture updated");
    } catch {
      toast.error("Couldn't upload the image. Please try again.");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const initials = (fallbackName || "").trim().charAt(0).toUpperCase() || null;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-2 border-border/40"
        style={{ background: value ? undefined : brandColor }}
      >
        {value ? (
          <img src={value} alt="avatar" className="w-full h-full object-cover" />
        ) : initials ? (
          <span className="text-white font-display font-bold" style={{ fontSize: size / 2.6 }}>{initials}</span>
        ) : (
          <User className="text-white" style={{ width: size / 2.4, height: size / 2.4 }} />
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-background disabled:opacity-70"
        style={{ background: brandColor }}
        title="Change photo"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
    </div>
  );
}