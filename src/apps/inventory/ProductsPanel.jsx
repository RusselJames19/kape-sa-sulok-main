// Products panel — list of products with availability toggle and edit button.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { productsService } from "../../shared/services/products";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

export default function ProductsPanel({ products, onEdit, onCreate, onChanged }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) ||
             (p.category_name || "").toLowerCase().includes(term)
    );
  }, [products, q]);

  const toggle = async (p, val) => {
    try {
      await productsService.setAvailability(p.id, val);
      toast.success(val ? "Now available in POS" : "Hidden from POS");
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not update");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No products.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li key={p.id}>
              <Card className="p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{p.name}</p>
                    <Badge variant="outline" className="text-[10px]">{p.category_name}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {(p.variants || []).length} variant{(p.variants || []).length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(p.is_available)}
                    onCheckedChange={(v) => toggle(p, v)}
                    aria-label="Available"
                  />
                  <Button size="icon" variant="outline" onClick={() => onEdit(p)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
