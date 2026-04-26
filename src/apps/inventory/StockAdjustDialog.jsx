// Stock adjust dialog — set or add stock for one variant.
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { stockService } from "../../shared/services/stock";
import { variantLabel } from "../../shared/utils/variants";
import { toast } from "sonner";

export default function StockAdjustDialog({ open, onOpenChange, variant, onSaved }) {
  const [mode, setMode] = useState("set");
  const [setQty, setSetQty] = useState("");
  const [delta, setDelta] = useState("");
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && variant) {
      setMode("set");
      setSetQty(String(variant.stock_quantity ?? 0));
      setDelta("");
      setThreshold(String(variant.low_stock_threshold ?? 0));
    }
  }, [open, variant]);

  if (!variant) return null;

  const submit = async () => {
    let payload;
    if (mode === "set") {
      const q = Number(setQty);
      if (!Number.isFinite(q) || q < 0) {
        toast.error("Quantity must be a non-negative number");
        return;
      }
      payload = { mode: "set", quantity: Math.floor(q) };
    } else {
      const d = Number(delta);
      if (!Number.isFinite(d) || d === 0) {
        toast.error("Enter a non-zero delta");
        return;
      }
      payload = { mode: "add", quantity: Math.floor(d) };
    }
    const thrNum = Number(threshold);
    if (
      threshold !== "" &&
      Number.isFinite(thrNum) &&
      Math.floor(thrNum) !== variant.low_stock_threshold
    ) {
      payload.low_stock_threshold = Math.floor(thrNum);
    }
    setSaving(true);
    try {
      const res = await stockService.update(variant.id, payload);
      toast.success(`Stock updated: ${res.variant.stock_quantity} on hand`);
      onSaved?.(res.variant);
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not update stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {variant.product_name} · {variantLabel(variant)} · current{" "}
            <span className="font-semibold text-foreground">{variant.stock_quantity}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="set">Set</TabsTrigger>
            <TabsTrigger value="add">Add / Subtract</TabsTrigger>
          </TabsList>

          <TabsContent value="set" className="space-y-2 mt-4">
            <Label htmlFor="setQty">New stock quantity</Label>
            <Input
              id="setQty"
              type="number"
              inputMode="numeric"
              min={0}
              value={setQty}
              onChange={(e) => setSetQty(e.target.value)}
              autoFocus
            />
          </TabsContent>

          <TabsContent value="add" className="space-y-2 mt-4">
            <Label htmlFor="delta">Change (use negative to subtract)</Label>
            <Input
              id="delta"
              type="number"
              inputMode="numeric"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. 24 or -3"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {[1, 5, 10, 25, -1].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDelta(String(n))}
                >
                  {n > 0 ? `+${n}` : n}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 pt-2">
          <Label htmlFor="thr">Low-stock threshold</Label>
          <Input
            id="thr"
            type="number"
            inputMode="numeric"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Items at or below this number show up in Low Stock.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
