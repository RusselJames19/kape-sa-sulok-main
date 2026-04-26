// System Settings panel — admin-only edit of branding, low-stock threshold,
// receipt footer, etc. Read-only preview for non-admins.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useSettings } from "../../shared/auth/SettingsContext.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";

export default function SettingsPanel() {
  const { settings, update, refresh } = useSettings();
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin");

  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSave = async () => {
    if (!canEdit) return;
    // Client-side guards mirror the server.
    if (!form.business_name.trim()) {
      toast.error("Business name is required");
      return;
    }
    const lst = String(form.low_stock_threshold).trim();
    if (!/^\d+$/.test(lst)) {
      toast.error("Low-stock threshold must be a non-negative integer");
      return;
    }
    if (form.logo_url && !/^https?:\/\//i.test(form.logo_url)) {
      toast.error("Logo URL must start with http(s)://");
      return;
    }
    setSaving(true);
    try {
      await update({
        business_name: form.business_name.trim(),
        business_address: form.business_address.trim(),
        logo_url: form.logo_url.trim(),
        low_stock_threshold: lst,
        currency_symbol: (form.currency_symbol || "₱").trim().slice(0, 8),
        receipt_footer: form.receipt_footer,
      });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Business identity</CardTitle>
          <CardDescription>
            Shown on receipts and across all four apps. Admin-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Business name" htmlFor="biz-name">
            <Input id="biz-name" value={form.business_name} onChange={change("business_name")}
              disabled={!canEdit} maxLength={120} />
          </Field>
          <Field label="Business address" htmlFor="biz-addr">
            <Input id="biz-addr" value={form.business_address} onChange={change("business_address")}
              disabled={!canEdit} maxLength={200} />
          </Field>
          <Field label="Logo URL" htmlFor="biz-logo" hint="Optional. Used on landing + headers.">
            <Input id="biz-logo" value={form.logo_url} onChange={change("logo_url")}
              disabled={!canEdit} placeholder="https://…" maxLength={500} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
          <CardDescription>Inventory + receipt defaults.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Default low-stock threshold" htmlFor="lst"
            hint="Used when creating new variants. Existing variants keep their own threshold.">
            <Input id="lst" inputMode="numeric" pattern="[0-9]*"
              value={form.low_stock_threshold}
              onChange={change("low_stock_threshold")} disabled={!canEdit} />
          </Field>
          <Field label="Currency symbol" htmlFor="cur">
            <Input id="cur" value={form.currency_symbol} onChange={change("currency_symbol")}
              disabled={!canEdit} maxLength={8} />
          </Field>
          <Field label="Receipt footer" htmlFor="footer">
            <Textarea id="footer" value={form.receipt_footer} onChange={change("receipt_footer")}
              disabled={!canEdit} rows={2} maxLength={500} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={refresh} disabled={saving}>Reload</Button>
        <Button onClick={onSave} disabled={!canEdit || saving}>
          {saving ? "Saving…" : canEdit ? "Save changes" : "Admin only"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
