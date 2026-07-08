import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { User, Loader2, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

// Profile settings for the logged-in app user (store admin / customer).
// Name, phone and avatar are persisted on the User entity via auth.updateMe().
export default function UserAccountSettings({ user }) {
  const queryClient = useQueryClient();
  const { checkUserAuth } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
      toast.success("Photo uploaded — remember to save.");
    } catch {
      toast.error("Upload failed. Try again.");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName, phone, avatarUrl });
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await checkUserAuth?.();
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(e.message || "Could not save profile.");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5 max-w-xl space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary/60 border border-border/40 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium">{user?.full_name || "Your account"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" placeholder="Your name" />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="Phone number" />
        </div>
        <div>
          <Label className="text-xs">Email</Label>
          <Input value={user?.email || ""} disabled className="mt-1 opacity-70" />
          <p className="text-[10px] text-muted-foreground mt-1">Email is managed by your login and can't be changed here.</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save changes
      </Button>
    </div>
  );
}