// POS product grid — groups by category, shows variant sizes inline.
// Clicking a variant adds it to the cart (or asks parent to).
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPHP } from "../../shared/utils/currency";
import { variantLabel } from "../../shared/utils/variants";

export default function ProductGrid({ products, categories, onAddVariant }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory !== "all" && Number(p.category_id) !== Number(activeCategory)) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, activeCategory, search]);

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              active={Number(activeCategory) === Number(c.id)}
              onClick={() => setActiveCategory(c.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">
            No products match.
          </p>
        )}
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onAddVariant={onAddVariant} />
        ))}
      </div>
    </div>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ProductCard({ product, onAddVariant }) {
  const variants = product.variants || [];
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{product.name}</h3>
          <Badge variant="outline" className="text-[10px]">{product.category_name}</Badge>
        </div>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {variants.length === 0 && (
          <span className="text-xs text-muted-foreground">No variants configured.</span>
        )}
        {variants.map((v) => {
          const out = (v.stock_quantity ?? 0) <= 0;
          return (
            <Button
              key={v.id}
              type="button"
              size="sm"
              variant={out ? "outline" : "secondary"}
              disabled={out}
              onClick={() => onAddVariant(product, v)}
              className="flex flex-col items-start h-auto py-1.5 px-2.5"
              title={out ? "Out of stock" : `Stock: ${v.stock_quantity}`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {variantLabel(v)}
              </span>
              <span className="text-sm font-semibold">{formatPHP(v.price)}</span>
              {out ? (
                <span className="text-[9px] text-destructive">Out</span>
              ) : (
                <span className="text-[9px] opacity-60">Stock {v.stock_quantity}</span>
              )}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
