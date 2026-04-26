// Recent transactions list — cashier sees only own (server-enforced).
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { transactionsService } from "../../shared/services/transactions";
import { formatPHP } from "../../shared/utils/currency";
import { toast } from "sonner";

function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" });
}

export default function RecentTransactions({ refreshKey, onView }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await transactionsService.list({ limit: 20 });
      setItems(data.transactions || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  return (
    <Card className="p-4 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold">Recent Sales</h2>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          {loading ? "…" : "Refresh"}
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No sales yet.</p>
        ) : (
          <ul className="divide-y">
            {items.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onView(t.id)}
                  className="w-full text-left py-2 px-1 hover:bg-muted/50 rounded transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">#{t.id}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {fmt(t.created_at)} · {t.cashier_name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatPHP(t.total_amount)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
