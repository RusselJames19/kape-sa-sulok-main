// Low stock list — variants at or below threshold, ordered by severity.
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { stockService } from "../../shared/services/stock";
import { variantLabel } from "../../shared/utils/variants";
import { formatPHP } from "../../shared/utils/currency";
import { toast } from "sonner";
import { AlertTriangle, Pencil } from "lucide-react";

export default function LowStockList({ refreshKey, onAdjust }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await stockService.lowStock();
      setRows(res.variants || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not load low stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} variant{rows.length === 1 ? "" : "s"} at or below threshold
        </p>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          {loading ? "…" : "Refresh"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          🎉 All stock above threshold.
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((v) => {
            const out = v.stock_quantity <= 0;
            return (
              <li key={v.id}>
                <Card className={`p-3 flex items-center gap-3 ${out ? "border-destructive/50" : ""}`}>
                  <AlertTriangle className={`h-5 w-5 shrink-0 ${out ? "text-destructive" : "text-amber-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{v.product_name}</p>
                      {out && <Badge variant="destructive" className="text-[10px]">Out</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {v.category_name} · {variantLabel(v)} · {formatPHP(v.price)} · threshold {v.low_stock_threshold}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold leading-none ${out ? "text-destructive" : "text-amber-600"}`}>
                      {v.stock_quantity}
                    </p>
                    <p className="text-[10px] text-muted-foreground">on hand</p>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onAdjust(v)}
                    aria-label="Adjust stock"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
