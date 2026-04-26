// KPI cards row — today's totals + low-stock count.
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { analyticsService } from "../../shared/services/analytics";
import { formatPHP } from "../../shared/utils/currency";
import { toast } from "sonner";
import { Receipt, Coins, Package, AlertTriangle, TrendingUp } from "lucide-react";

function Kpi({ icon: Icon, label, value, sublabel, tone = "default" }) {
  const toneClasses =
    tone === "warn"
      ? "text-amber-600"
      : tone === "danger"
      ? "text-destructive"
      : "text-foreground";
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className={`h-5 w-5 ${toneClasses}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${toneClasses}`}>{value}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
    </Card>
  );
}

export default function KpiCards({ refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    analyticsService
      .summary()
      .then((res) => { if (!cancel) setData(res); })
      .catch((e) => toast.error(e?.response?.data?.message || "Could not load summary"))
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [refreshKey]);

  if (loading || !data) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 h-[88px] animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const top = data.top_product_7d;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Kpi icon={Coins}       label="Revenue today"  value={formatPHP(data.today.revenue)} />
      <Kpi icon={Receipt}     label="Sales today"    value={data.today.tx_count} sublabel={`${data.today.items_sold} items`} />
      <Kpi
        icon={TrendingUp}
        label="Top (7d)"
        value={top ? top.name : "—"}
        sublabel={top ? `${top.qty} sold · ${formatPHP(top.revenue)}` : "No sales yet"}
      />
      <Kpi
        icon={data.low_stock_count > 0 ? AlertTriangle : Package}
        label="Low stock"
        value={data.low_stock_count}
        sublabel="variants ≤ threshold"
        tone={data.low_stock_count > 0 ? "warn" : "default"}
      />
    </div>
  );
}
