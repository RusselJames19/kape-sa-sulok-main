// Sales chart — bar chart with revenue or tx_count, day or hour granularity.
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { analyticsService } from "../../shared/services/analytics";
import { formatPHP } from "../../shared/utils/currency";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function formatBucket(b, granularity) {
  if (!b) return "";
  // Server returns 'YYYY-MM-DD' for day, 'YYYY-MM-DD HH:00:00' for hour.
  const d = new Date(b.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return b;
  if (granularity === "hour") {
    return d.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric" });
  }
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function SalesChart({ from, to }) {
  const [granularity, setGranularity] = useState("day");
  const [metric, setMetric] = useState("revenue");
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    analyticsService
      .sales({ from, to, granularity })
      .then((res) => { if (!cancel) setSeries(res.series || []); })
      .catch((e) => toast.error(e?.response?.data?.message || "Could not load sales"))
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [from, to, granularity]);

  const data = useMemo(
    () => series.map((s) => ({ ...s, label: formatBucket(s.bucket, granularity) })),
    [series, granularity]
  );

  const total = useMemo(() => {
    return series.reduce(
      (acc, s) => ({ revenue: acc.revenue + s.revenue, tx: acc.tx + s.tx_count }),
      { revenue: 0, tx: 0 }
    );
  }, [series]);

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Sales</h2>
          <p className="text-[11px] text-muted-foreground">
            Total {formatPHP(total.revenue)} · {total.tx} sale{total.tx === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SegSelect
            value={metric}
            onChange={setMetric}
            options={[
              { value: "revenue", label: "Revenue" },
              { value: "tx_count", label: "Sales" },
            ]}
          />
          <SegSelect
            value={granularity}
            onChange={setGranularity}
            options={[
              { value: "day", label: "Daily" },
              { value: "hour", label: "Hourly" },
            ]}
          />
        </div>
      </div>

      <div className="h-72 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 z-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {data.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No sales in this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.015 75)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  metric === "revenue" ? `₱${Math.round(v).toLocaleString()}` : String(v)
                }
                width={60}
              />
              <Tooltip
                cursor={{ fill: "oklch(0.92 0.02 75 / 0.5)" }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value, name) => {
                  if (name === "revenue") return [formatPHP(value), "Revenue"];
                  return [value, "Sales"];
                }}
              />
              <Bar
                dataKey={metric}
                fill="oklch(0.55 0.13 55)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function SegSelect({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5">
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          variant={value === o.value ? "default" : "ghost"}
          className="h-7 px-2 text-xs"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
