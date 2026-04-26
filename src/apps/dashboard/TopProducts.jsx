// Top products — table + horizontal bar chart, switchable revenue/qty.
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { analyticsService } from "../../shared/services/analytics";
import { formatPHP } from "../../shared/utils/currency";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TopProducts({ from, to }) {
  const [by, setBy] = useState("revenue");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    analyticsService
      .topProducts({ from, to, by, limit: 10 })
      .then((res) => { if (!cancel) setProducts(res.products || []); })
      .catch((e) => toast.error(e?.response?.data?.message || "Could not load top products"))
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [from, to, by]);

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Top Products</h2>
        <div className="inline-flex rounded-md border bg-background p-0.5">
          {[{ v: "revenue", l: "Revenue" }, { v: "qty", l: "Quantity" }].map((o) => (
            <Button
              key={o.v}
              size="sm"
              variant={by === o.v ? "default" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setBy(o.v)}
            >
              {o.l}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 z-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {products.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No data for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={products} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.015 75)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  by === "revenue" ? `₱${Math.round(v).toLocaleString()}` : String(v)
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value, _name, props) => {
                  if (by === "revenue") return [formatPHP(value), "Revenue"];
                  return [value, "Sold"];
                }}
              />
              <Bar dataKey={by} fill="oklch(0.62 0.13 75)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {products.length > 0 && (
        <ul className="divide-y">
          {products.slice(0, 5).map((p, i) => (
            <li key={p.id} className="py-2 flex items-center gap-3">
              <span className="w-5 text-right text-xs font-bold text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <Badge variant="outline" className="text-[10px] mt-0.5">{p.category_name}</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatPHP(p.revenue)}</p>
                <p className="text-[10px] text-muted-foreground">{p.qty} sold</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
