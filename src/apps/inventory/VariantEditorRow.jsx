// Variant editor row (used inside ProductEditorDialog) — edit price/threshold/size, delete.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { variantsService } from "../../shared/services/stock";
import { toast } from "sonner";
import { Trash2, Save } from "lucide-react";

const SIZES = ["none", "S", "M", "L"];

export default function VariantEditorRow({ productId, variant, onChanged, onDeleted }) {
  const isNew = !variant.id;
  const [size, setSize] = useState(variant.size ?? "none");
  const [price, setPrice] = useState(String(variant.price ?? ""));
  const [stock, setStock] = useState(String(variant.stock_quantity ?? 0));
  const [thr, setThr] = useState(String(variant.low_stock_threshold ?? 10));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const priceNum = Number(price);
    const thrNum = Number(thr);
    const stockNum = Number(stock);
    if (!Number.isFinite(priceNum) || priceNum < 0) { toast.error("Price must be ≥ 0"); return; }
    if (!Number.isFinite(thrNum) || thrNum < 0)     { toast.error("Threshold must be ≥ 0"); return; }
    if (isNew && (!Number.isFinite(stockNum) || stockNum < 0)) {
      toast.error("Initial stock must be ≥ 0"); return;
    }
    setBusy(true);
    try {
      if (isNew) {
        const res = await variantsService.create({
          product_id: productId,
          size,
          price: priceNum,
          stock_quantity: Math.floor(stockNum),
          low_stock_threshold: Math.floor(thrNum),
        });
        toast.success("Variant added");
        onChanged?.(res.variant, true);
      } else {
        const res = await variantsService.update(variant.id, {
          size,
          price: priceNum,
          low_stock_threshold: Math.floor(thrNum),
        });
        toast.success("Variant updated");
        onChanged?.(res.variant, false);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not save variant");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (isNew) { onDeleted?.(); return; }
    if (!confirm(`Delete this variant?`)) return;
    setBusy(true);
    try {
      await variantsService.remove(variant.id);
      toast.success("Variant deleted");
      onDeleted?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not delete variant");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border p-2 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Size</label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => <SelectItem key={s} value={s}>{s === "none" ? "Regular" : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price (₱)</label>
          <Input type="number" inputMode="decimal" min={0} step="0.01"
            value={price} onChange={(e) => setPrice(e.target.value)} className="h-9" />
        </div>
        {isNew && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Initial stock</label>
            <Input type="number" inputMode="numeric" min={0}
              value={stock} onChange={(e) => setStock(e.target.value)} className="h-9" />
          </div>
        )}
        <div className={isNew ? "" : "col-span-2"}>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Low-stock threshold</label>
          <Input type="number" inputMode="numeric" min={0}
            value={thr} onChange={(e) => setThr(e.target.value)} className="h-9" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        {!isNew && (
          <span className="text-[11px] text-muted-foreground">
            Stock on hand: <span className="font-semibold text-foreground">{variant.stock_quantity}</span>
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={busy}
            className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> {isNew ? "Cancel" : "Delete"}
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={busy}>
            <Save className="h-3.5 w-3.5 mr-1" /> {busy ? "…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
