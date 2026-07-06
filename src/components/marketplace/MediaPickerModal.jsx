import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, X, ImageIcon, Video, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Popup that shows the user's recent R2 uploads in Image/Video tabs, plus an
// upload button to add a new file. Selecting a file calls onSelect(url).
export default function MediaPickerModal({ open, onClose, onSelect, campaignId = "store-asset", defaultTab = "image" }) {
  const inputRef = useRef(null);
  const [tab, setTab] = useState(defaultTab);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("listR2Uploads", {});
      setFiles(res.data?.files || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      loadFiles();
    }
  }, [open, defaultTab]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Files are sent to the backend as base64 in the request body — very large
    // files exceed the payload limit and make the worker throw. Guard here with
    // a clear message (10MB images / 40MB videos).
    const isVid = file.type.startsWith("video");
    const maxBytes = isVid ? 40 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File too large. Max ${isVid ? "40MB for videos" : "10MB for images"}.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
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
        campaignId,
      });
      const url = res.data?.fileUrl;
      if (!url) throw new Error(res.data?.error || "Upload failed");
      toast.success("Uploaded");
      onSelect(url);
      onClose();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (e, f) => {
    e.stopPropagation();
    if (!confirm("Delete this file permanently?")) return;
    setDeletingKey(f.key);
    try {
      const res = await base44.functions.invoke("deleteR2Upload", { key: f.key });
      if (res.data?.error) throw new Error(res.data.error);
      setFiles((prev) => prev.filter((x) => x.key !== f.key));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeletingKey(null);
    }
  };

  if (!open) return null;

  const shown = files.filter((f) => f.type === tab);
  const accept = tab === "video" ? "video/*" : "image/*";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border border-border/40 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h3 className="text-base font-display font-bold">Media Library</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary/60 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs + Upload */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
          <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-1">
            <button
              onClick={() => setTab("image")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "image" ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Images
            </button>
            <button
              onClick={() => setTab("video")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "video" ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Video className="w-3.5 h-3.5" /> Videos
            </button>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Uploading" : "Upload New"}
          </button>
          <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : shown.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No {tab === "video" ? "videos" : "images"} yet</p>
              <p className="text-xs mt-1">Upload a new file to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {shown.map((f) => (
                <div
                  key={f.key}
                  onClick={() => { onSelect(f.url); onClose(); }}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border/30 bg-secondary/30 hover:border-orange-500/60 transition-colors cursor-pointer"
                >
                  {f.type === "video" ? (
                    <video src={f.url} className="w-full h-full object-contain" muted />
                  ) : (
                    <img src={f.url} alt="" className="w-full h-full object-contain p-1.5" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, f)}
                    disabled={deletingKey === f.key}
                    title="Delete"
                    className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/60 backdrop-blur text-white/80 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-100"
                  >
                    {deletingKey === f.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}