// Dashboard App — KPI cards, sales chart, top products, peak-hours heatmap.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import RouteGuard from "../../shared/auth/RouteGuard.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";
import { presetRange } from "../../shared/utils/dateRange";

import KpiCards from "./KpiCards.jsx";
import DateRangePicker from "./DateRangePicker.jsx";
import SalesChart from "./SalesChart.jsx";
import TopProducts from "./TopProducts.jsx";
import PeakHoursHeatmap from "./PeakHoursHeatmap.jsx";

function DashboardBody() {
  const { user, logout } = useAuth();

  const initial = presetRange("7d");
  const [range, setRange] = useState({ ...initial, preset: "7d" });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.97_0.015_75)] text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Kape sa Sulok
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
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
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
  return <RouteGuard appKey="dashboard"><DashboardBody /></RouteGuard>;
}
