import React, { useState } from "react";
import { Mail, User, Phone, KeyRound, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateStoreCustomerProfile } from "@/lib/storeCustomerAuth";
import StoreAvatarUpload from "@/components/store/StoreAvatarUpload";

// Full account settings: profile picture, name/phone edit, and password reset.
// Shared by the store customer dashboard and the store admin account page.
export default function StoreAccountSettings({ marketplaceId, customer, brandColor = "#f97316", onUpdated }) {
  const [fullName, setFullName] = useState(customer?.fullName || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(customer?.avatarUrl || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (nextAvatar) => {
    setSavingProfile(true);
    try {
      const updated = await updateStoreCustomerProfile({
        marketplaceId,
        fullName,
        phone,
        avatarUrl: nextAvatar !== undefined ? nextAvatar : avatarUrl,
      });
      toast.success("Profile updated");
      onUpdated?.(updated);
    } catch (e) {
      toast.error(e.message || "Couldn't save your profile.");
    }
    setSavingProfile(false);
  };

  const handleAvatarChange = (url) => {
    setAvatarUrl(url);
    saveProfile(url); // persist immediately on upload
  };

  const savePassword = async () => {
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match."); return; }
    setSavingPw(true);
    try {
      await updateStoreCustomerProfile({ marketplaceId, currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) {
      toast.error(e.message || "Couldn't change your password.");
    }
    setSavingPw(false);
  };

  const pwType = showPw ? "text" : "password";

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <StoreAvatarUpload
            value={avatarUrl}
            onChange={handleAvatarChange}
            fallbackName={fullName || customer?.email}
            brandColor={brandColor}
          />
          <div className="min-w-0">
            <p className="text-lg font-display font-bold truncate">{fullName || "Your name"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {customer?.email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Tap the camera to change your photo.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5"><User className="w-3.5 h-3.5" /> Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-secondary/40 border-border/30 rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5"><Phone className="w-3.5 h-3.5" /> Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary/40 border-border/30 rounded-xl" placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5 mt-4"><Mail className="w-3.5 h-3.5" /> Email</label>
          <Input value={customer?.email || ""} disabled className="bg-secondary/20 border-border/30 rounded-xl opacity-70" />
        </div>

        <button
          onClick={() => saveProfile()}
          disabled={savingProfile}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
          style={{ background: brandColor }}
        >
          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
        </button>
      </div>

      {/* Password card */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Reset Password</h3>
          <button onClick={() => setShowPw((s) => !s)} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Current password</label>
            <Input type={pwType} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-secondary/40 border-border/30 rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">New password</label>
            <Input type={pwType} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-secondary/40 border-border/30 rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Confirm new</label>
            <Input type={pwType} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-secondary/40 border-border/30 rounded-xl" />
          </div>
        </div>
        <button
          onClick={savePassword}
          disabled={savingPw || !currentPassword || !newPassword}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-secondary/40 disabled:opacity-50"
          style={{ borderColor: `${brandColor}55`, color: brandColor }}
        >
          {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Update password
        </button>
      </div>
    </div>
  );
}