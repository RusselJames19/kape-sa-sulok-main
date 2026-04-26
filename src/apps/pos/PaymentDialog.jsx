// Cash payment dialog — amount tendered, change calculation, quick-cash chips.
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPHP } from "../../shared/utils/currency";

const QUICK = [50, 100, 200, 500, 1000];

function ceilToBill(amount) {
  if (amount <= 0) return 0;
  for (const b of [50, 100, 200, 500, 1000, 2000]) {
    if (amount <= b) return b;
  }
  return Math.ceil(amount / 100) * 100;
}

export default function PaymentDialog({ open, onOpenChange, total, onConfirm, isSubmitting }) {
  const [tendered, setTendered] = useState("");

  useEffect(() => {
    if (open) setTendered("");
  }, [open]);

  const tenderedNum = Number(tendered);
  const validNum = Number.isFinite(tenderedNum) && tenderedNum >= 0;
  const change = validNum ? Math.max(0, tenderedNum - total) : 0;
  const sufficient = validNum && tenderedNum + 0.0001 >= total;

  const suggestions = useMemo(() => {
    const exact = total;
    const round = ceilToBill(total);
    const set = new Set([exact, round, ...QUICK.filter((q) => q >= total)]);
    return [...set].sort((a, b) => a - b).slice(0, 5);
  }, [total]);

  const submit = () => {
    if (!sufficient || isSubmitting) return;
    onConfirm(Number(tenderedNum.toFixed(2)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cash Payment</DialogTitle>
          <DialogDescription>Enter amount tendered to compute change.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total Due</span>
            <span className="text-2xl font-bold">{formatPHP(total)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tendered">Amount Tendered (₱)</Label>
            <Input
              id="tendered"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              autoFocus
              placeholder="0.00"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setTendered(String(s))}
                >
                  {formatPHP(s)}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Change</span>
            <span className={`text-2xl font-bold ${sufficient ? "" : "text-muted-foreground"}`}>
              {formatPHP(change)}
            </span>
          </div>

          {!sufficient && validNum && (
            <p className="text-xs text-destructive">Tendered amount is less than the total.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!sufficient || isSubmitting}>
            {isSubmitting ? "Processing…" : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
