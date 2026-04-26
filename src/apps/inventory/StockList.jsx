// Stock list — flat list of variants grouped by product, with quick-adjust button.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "../../shared/utils/currency";
import { variantLabel } from "../../shared/utils/variants";
import { Pencil } from "lucide-react";

function stockTone(qty, thr) {
  if (qty <= 0) return "bg-destructive text-destructive-foreground";
  if (qty <= thr) return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

export default function StockList({ products, onAdjust }) {
  const [q, setQ] = useState("");

  const flat = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = [];
    for (const p of products) {
      for (const v of p.variants || []) {
        if (term && !p.name.toLowerCase().includes(term)) continue;
        rows.push({
          ...v,
          product_id: p.id,
          product_name: p.name,
          category_name: p.category_name,
          is_available: p.is_available,
        });
      }
    }
    return rows;
  }, [products, q]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search products…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {flat.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No matching items.
        </p>
      ) : (
        <ul className="space-y-2">
          {flat.map((v) => (
            <li key={v.id}>
              <Card className="p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{v.product_name}</p>
                    {!v.is_available && (
                      <Badge variant="outline" className="text-[10px]">Hidden</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {v.category_name} · {variantLabel(v)} · {formatPHP(v.price)}
                  </p>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-md text-sm font-bold ${stockTone(
                    v.stock_quantity, v.low_stock_threshold
                  )}`}
                  title={`Threshold: ${v.low_stock_threshold}`}
                >
                  {v.stock_quantity}
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
          ))}
        </ul>
      )}
    </div>
  );
}
