// Dashboard App — KPI cards, sales chart, top products, peak-hours heatmap.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { RefreshCw, Download } from "lucide-react";

import RouteGuard from "../../shared/auth/RouteGuard.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";
import { useSettings } from "../../shared/auth/SettingsContext.jsx";
import { presetRange } from "../../shared/utils/dateRange";
import { analyticsService } from "../../shared/services/analytics";
import { toCsv, downloadCsv } from "../../shared/utils/csvExport";

import KpiCards from "./KpiCards.jsx";
import DateRangePicker from "./DateRangePicker.jsx";
import SalesChart from "./SalesChart.jsx";
import TopProducts from "./TopProducts.jsx";
import PeakHoursHeatmap from "./PeakHoursHeatmap.jsx";

function DashboardBody() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const initial = presetRange("7d");
  const [range, setRange] = useState({ ...initial, preset: "7d" });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const DOW_NAMES = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const exportSales = async () => {
    try {
      const res = await analyticsService.sales({ from: range.from, to: range.to, granularity: "day" });
      const rows = (res.series || []).map((r) => ({
        bucket: r.bucket,
        tx_count: r.tx_count,
        revenue: Number(r.revenue).toFixed(2),
      }));
      const csv = toCsv(rows, [
        { key: "bucket", label: "Date" },
        { key: "tx_count", label: "Transactions" },
        { key: "revenue", label: "Revenue" },
      ]);
      downloadCsv(`ksu_sales_${range.from}_to_${range.to}.csv`, csv);
      toast.success("Sales CSV exported");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Export failed");
    }
  };

  const exportTopProducts = async () => {
    try {
      const res = await analyticsService.topProducts({ from: range.from, to: range.to, by: "revenue", limit: 50 });
      const rows = (res.products || []).map((p) => ({
        id: p.id,
        name: p.name,
        category_name: p.category_name,
        qty: p.qty,
        revenue: Number(p.revenue).toFixed(2),
      }));
      const csv = toCsv(rows, [
        { key: "id", label: "Product ID" },
        { key: "name", label: "Product" },
        { key: "category_name", label: "Category" },
        { key: "qty", label: "Quantity Sold" },
        { key: "revenue", label: "Revenue" },
      ]);
      downloadCsv(`ksu_top_products_${range.from}_to_${range.to}.csv`, csv);
      toast.success("Top products CSV exported");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Export failed");
    }
  };

  const exportPeakHours = async () => {
    try {
      const res = await analyticsService.peakHours({ from: range.from, to: range.to });
      const rows = (res.cells || []).map((c) => ({
        dow: c.dow,
        weekday: DOW_NAMES[c.dow] || "",
        hour: c.hour,
        tx_count: c.tx_count,
        revenue: Number(c.revenue).toFixed(2),
      }));
      const csv = toCsv(rows, [
        { key: "dow", label: "DOW (1=Sun..7=Sat)" },
        { key: "weekday", label: "Weekday" },
        { key: "hour", label: "Hour" },
        { key: "tx_count", label: "Transactions" },
        { key: "revenue", label: "Revenue" },
      ]);
      downloadCsv(`ksu_peak_hours_${range.from}_to_${range.to}.csv`, csv);
      toast.success("Peak hours CSV exported");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Export failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.97_0.015_75)] text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground truncate">
              {settings.business_name || "Kape sa Sulok"}
            </p>
            <h1 className="text-xl font-bold leading-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-sm hidden sm:block">
              <p className="font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground">@{user?.username} · {user?.role}</p>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/">Home</Link></Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => { await logout(); toast.success("Signed out"); }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 space-y-4">
        <KpiCards refreshKey={refreshKey} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <DateRangePicker value={range} onChange={setRange} />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportSales}>Sales (time series)</DropdownMenuItem>
                <DropdownMenuItem onClick={exportTopProducts}>Top products</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPeakHours}>Peak hours</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
          </div>
        </div>

        <SalesChart key={`sales-${refreshKey}`} from={range.from} to={range.to} />

        <div className="grid gap-4 lg:grid-cols-2">
          <TopProducts key={`top-${refreshKey}`} from={range.from} to={range.to} />
          <PeakHoursHeatmap key={`peak-${refreshKey}`} from={range.from} to={range.to} />
        </div>
      </main>
    </div>
  );
}

export default function DashboardApp() {
  return <RouteGuard appKey="dashboard" appLabel="Business Dashboard" appSubtitle="Owner & Manager Access"><DashboardBody /></RouteGuard>;
}
