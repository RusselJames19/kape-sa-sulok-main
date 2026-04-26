// Peak hours heatmap — 7 weekday rows × 24 hour cols.
// Server returns DAYOFWEEK (1=Sun..7=Sat) — we map to a Mon..Sun row order.
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { analyticsService } from "../../shared/services/analytics";
import { formatPHP } from "../../shared/utils/currency";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Map MySQL DAYOFWEEK (1=Sun..7=Sat) → row index in DAY_LABELS (Mon..Sun)
const DOW_TO_ROW = { 1: 6, 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5 };

export default function PeakHoursHeatmap({ from, to }) {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    analyticsService
      .peakHours({ from, to })
      .then((res) => { if (!cancel) setCells(res.cells || []); })
      .catch((e) => toast.error(e?.response?.data?.message || "Could not load peak hours"))
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [from, to]);

  const { grid, max } = useMemo(() => {
    const grid = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ tx_count: 0, revenue: 0 }))
    );
    let max = 0;
    for (const c of cells) {
      const row = DOW_TO_ROW[c.dow];
      if (row == null) continue;
      grid[row][c.hour] = { tx_count: c.tx_count, revenue: c.revenue };
      if (c.tx_count > max) max = c.tx_count;
    }
    return { grid, max };
  }, [cells]);

  const tone = (count) => {
    if (count === 0 || max === 0) return "oklch(0.94 0.01 75)";
    const t = count / max;
    // Interpolate L from 0.92 → 0.45 with primary chroma/hue.
    const L = (0.92 - 0.47 * t).toFixed(3);
    return `oklch(${L} 0.13 55)`;
  };
  const textTone = (count) => (count / Math.max(max, 1) > 0.55 ? "#fff" : "oklch(0.30 0.05 50)");

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Peak Hours</h2>
          <p className="text-[11px] text-muted-foreground">Sales by hour and weekday.</p>
        </div>
        {hover && (
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {DAY_LABELS[hover.row]} {String(hover.col).padStart(2, "0")}:00
            </span>{" "}
            · {hover.tx_count} sale{hover.tx_count === 1 ? "" : "s"} · {formatPHP(hover.revenue)}
          </p>
        )}
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 z-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour header */}
            <div className="grid grid-cols-[40px_repeat(24,minmax(18px,1fr))] gap-[2px] mb-[2px]">
              <div />
              {Array.from({ length: 24 }).map((_, h) => (
                <div
                  key={h}
                  className="text-[9px] text-muted-foreground text-center"
                >
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {/* Rows */}
            {grid.map((row, r) => (
              <div
                key={r}
                className="grid grid-cols-[40px_repeat(24,minmax(18px,1fr))] gap-[2px] mb-[2px]"
              >
                <div className="text-[10px] text-muted-foreground text-right pr-1 leading-[20px]">
                  {DAY_LABELS[r]}
                </div>
                {row.map((cell, c) => (
                  <div
                    key={c}
                    onMouseEnter={() => setHover({ row: r, col: c, ...cell })}
                    onMouseLeave={() => setHover(null)}
                    className="h-[20px] rounded-sm cursor-pointer transition-transform hover:scale-110 flex items-center justify-center text-[9px] font-semibold"
                    style={{ backgroundColor: tone(cell.tx_count), color: textTone(cell.tx_count) }}
                    title={`${DAY_LABELS[r]} ${String(c).padStart(2, "0")}:00 — ${cell.tx_count} sales`}
                  >
                    {cell.tx_count > 0 ? cell.tx_count : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0.1, 0.3, 0.55, 0.8, 1].map((t) => (
            <span
              key={t}
              className="h-3 w-5 rounded-sm"
              style={{ backgroundColor: `oklch(${(0.92 - 0.47 * t).toFixed(3)} 0.13 55)` }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}
