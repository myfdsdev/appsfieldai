import React, { useState } from "react";
import { CreditCard, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PaymentSettings() {
  const [payProvider, setPayProvider] = useState("stripe");
  const [currency, setCurrency] = useState("usd");
  const [stripePub, setStripePub] = useState("");
  const [stripeSecret, setStripeSecret] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpaySecret, setRazorpaySecret] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [minDeposit, setMinDeposit] = useState("");
  const [minWithdrawal, setMinWithdrawal] = useState("");
  const [enableDeposits, setEnableDeposits] = useState(true);
  const [enableWithdrawals, setEnableWithdrawals] = useState(true);
  const [testMode, setTestMode] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  const Field = ({ label, children }) => (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  const ToggleRow = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground/80">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Payment Settings</h2>
          <p className="text-sm text-muted-foreground">Configure payment gateways and fees</p>
        </div>
      </div>

      {/* Provider & Currency */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Payment Provider">
          <Select value={payProvider} onValueChange={setPayProvider}>
            <SelectTrigger className="h-10 bg-secondary/40 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="razorpay">Razorpay</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Currency">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-10 bg-secondary/40 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD ($)</SelectItem>
              <SelectItem value="eur">EUR (€)</SelectItem>
              <SelectItem value="gbp">GBP (£)</SelectItem>
              <SelectItem value="inr">INR (₹)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Stripe Keys */}
      {payProvider === "stripe" && (
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <Field label="Stripe Publishable Key">
            <Input
              placeholder="pk_live_..."
              value={stripePub}
              onChange={(e) => setStripePub(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
          <Field label="Stripe Secret Key">
            <Input
              type="password"
              placeholder="sk_live_..."
              value={stripeSecret}
              onChange={(e) => setStripeSecret(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
        </div>
      )}

      {/* PayPal Keys */}
      {payProvider === "paypal" && (
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <Field label="PayPal Client ID">
            <Input
              placeholder="Ae-..."
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
          <Field label="PayPal Secret">
            <Input
              type="password"
              placeholder="E..."
              value={paypalSecret}
              onChange={(e) => setPaypalSecret(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
        </div>
      )}

      {/* Razorpay Keys */}
      {payProvider === "razorpay" && (
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <Field label="Razorpay Key ID">
            <Input
              placeholder="rzp_live_..."
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
          <Field label="Razorpay Key Secret">
            <Input
              type="password"
              placeholder="••••••••"
              value={razorpaySecret}
              onChange={(e) => setRazorpaySecret(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
        </div>
      )}

      {/* Financial Settings */}
      <div className="grid sm:grid-cols-3 gap-4 pt-2">
        <Field label="Platform Fee (%)">
          <Input
            placeholder="5"
            type="number"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
        <Field label="Minimum Deposit ($)">
          <Input
            placeholder="10"
            type="number"
            value={minDeposit}
            onChange={(e) => setMinDeposit(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
        <Field label="Minimum Withdrawal ($)">
          <Input
            placeholder="50"
            type="number"
            value={minWithdrawal}
            onChange={(e) => setMinWithdrawal(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
      </div>

      {/* Toggles */}
      <div className="pt-4 border-t border-border/30">
        <h3 className="text-sm font-semibold text-foreground mb-3">Payment Controls</h3>
        <div className="divide-y divide-border/20">
          <ToggleRow label="Enable Deposits" checked={enableDeposits} onChange={setEnableDeposits} />
          <ToggleRow label="Enable Withdrawals" checked={enableWithdrawals} onChange={setEnableWithdrawals} />
          <ToggleRow label="Test Mode" checked={testMode} onChange={setTestMode} />
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}