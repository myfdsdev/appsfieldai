import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Shield, Mail, Pencil, Trash2, Crown, UserCheck, UserX, Copy, Check, Package, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function UserManager() {
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState({});

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
  });

  const { data: allPlatformSubs = [] } = useQuery({
    queryKey: ["platformSubs"],
    queryFn: () => base44.entities.PlatformSubscription.list("-created_date", 50),
  });

  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const roleBadge = (role) => {
    const map = {
      super_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      admin: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      user: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      marketplace_owner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      vendor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      customer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
    const labels = { marketplace_owner: "Owner", vendor: "Vendor", customer: "Customer" };
    return (
      <Badge className={`text-[10px] border ${map[role] || "bg-secondary text-muted-foreground border-border/30"}`}>
        {labels[role] || (role || "user").replace("_", " ")}
      </Badge>
    );
  };

  const openEdit = (u) => { setEditUser(u); setEditRole(u.role || "user"); };
  const handleEditSave = async () => {
    if (!editUser) return;
    await base44.entities.User.update(editUser.id, { role: editRole });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    setEditUser(null);
    toast.success(`Role updated for ${editUser.full_name || editUser.email}`);
  };
  const handleDeleteUser = async (u) => {
    await base44.entities.User.delete(u.id);
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    toast.success(`${u.full_name || u.email} deleted`);
  };
  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (e) {
      toast.error("Failed to send invite");
    }
    setInviting(false);
  };

  const doCopy = (key, text) => { navigator.clipboard.writeText(text); setCopied(p => ({ ...p, [key]: true })); setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 1500); };

  const admins = allUsers.filter(u => u.role === "admin" || u.role === "super_admin");
  const owners = allUsers.filter(u => u.role === "marketplace_owner");
  const vendors = allUsers.filter(u => u.role === "vendor");
  const regular = allUsers.filter(u => u.role === "user" || u.role === "customer" || !u.role);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Invite */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Mail className="w-4 h-4 text-violet-400" />Invite User</CardTitle></CardHeader>
        <CardContent className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]"><label className="text-xs text-muted-foreground">Email</label><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@email.com" type="email" className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
          <div><label className="text-xs text-muted-foreground">Role</label><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger className="w-36 bg-secondary/50 border-border/30 rounded-xl mt-1 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="marketplace_owner">Owner</SelectItem><SelectItem value="vendor">Vendor</SelectItem></SelectContent></Select></div>
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl h-9">{inviting ? "Sending..." : "Send Invite"}</Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Crown, label: "Admins", count: admins.length, color: "from-violet-500 to-purple-500" },
          { icon: Users, label: "Owners", count: owners.length, color: "from-emerald-500 to-teal-500" },
          { icon: UserCheck, label: "Vendors", count: vendors.length, color: "from-amber-500 to-orange-500" },
          { icon: UserX, label: "Users", count: regular.length, color: "from-cyan-500 to-blue-500" },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4 text-white" /></div>
              <div><p className="text-lg font-display font-bold">{isLoading ? "—" : s.count}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Users */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" />All Users<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-2">{allUsers.length}</Badge></CardTitle></CardHeader>
        <CardContent className="divide-y divide-border/30">
          {isLoading ? <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p> : allUsers.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No users found</p> : allUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-bold text-muted-foreground shrink-0">{(u.full_name || u.email || "?")[0].toUpperCase()}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{u.full_name || "Unnamed"}</p>
                    {roleBadge(u.role)}
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    <button onClick={() => doCopy(`u-${u.id}`, u.email)} className="p-0.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground">{copied[`u-${u.id}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}</button>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Joined {new Date(u.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {isSuperAdmin && <Button size="sm" variant="ghost" onClick={() => openEdit(u)} className="h-7 text-[11px] text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3 mr-1" />Role</Button>}
                {isSuperAdmin && <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u)} className="h-7 text-[11px] text-red-400/60 hover:text-red-400"><Trash2 className="w-3 h-3" /></Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invited Users / Platform Subscriptions */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Mail className="w-4 h-4 text-cyan-400" />Invited Users & Plans<Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] ml-2">{allPlatformSubs.length}</Badge></CardTitle></CardHeader>
        <CardContent className="divide-y divide-border/30">
          {allPlatformSubs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No subscriptions yet</p>
          ) : allPlatformSubs.map(sub => {
            const plan = allPlans.find(p => p.id === sub.planId);
            const user = allUsers.find(u => u.id === sub.userId);
            return (
              <div key={sub.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user?.full_name || sub.userEmail || "Unknown"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email || sub.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {plan ? (
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] flex items-center gap-1">
                      <Package className="w-2.5 h-2.5" />{plan.name}
                    </Badge>
                  ) : (
                    <Badge className="bg-secondary text-muted-foreground border-border/30 text-[10px]">No Plan</Badge>
                  )}
                  <Badge className={`text-[10px] border flex items-center gap-1 ${sub.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : sub.status === "trialing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {sub.status === "active" ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                    {sub.status || "pending"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{sub.created_date ? new Date(sub.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Plans Overview */}
      {allPlans.length > 0 && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Package className="w-4 h-4 text-amber-400" />Active Plans<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{allPlans.length}</Badge></CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allPlans.map(plan => {
              const subsOnPlan = allPlatformSubs.filter(s => s.planId === plan.id).length;
              return (
                <div key={plan.id} className="bg-secondary/30 rounded-xl p-3 border border-border/20">
                  <p className="text-sm font-medium text-foreground">{plan.name}</p>
                  <p className="text-lg font-display font-bold text-amber-400 mt-1">${plan.price || 0}<span className="text-[10px] text-muted-foreground font-normal">/mo</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">{subsOnPlan} subscribers</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="bg-card border-border/40 max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Shield className="w-4 h-4 text-violet-400" />Edit User Role</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {editUser && <p className="text-sm"><span className="text-muted-foreground">User:</span> <span className="font-medium">{editUser.full_name || editUser.email}</span></p>}
            <div><label className="text-xs text-muted-foreground">Role</label><Select value={editRole} onValueChange={setEditRole}><SelectTrigger className="w-full bg-secondary/50 border-border/30 rounded-xl mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="super_admin">Super Admin</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="marketplace_owner">Marketplace Owner</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="customer">Customer</SelectItem><SelectItem value="user">User</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}