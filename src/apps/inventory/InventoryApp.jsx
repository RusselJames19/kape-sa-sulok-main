// Inventory App — mobile-first stock management, low-stock alerts, product editor.
import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import RouteGuard from "../../shared/auth/RouteGuard.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";
import { useSettings } from "../../shared/auth/SettingsContext.jsx";
import { productsService } from "../../shared/services/products";
import { categoriesService } from "../../shared/services/categories";

import StockList from "./StockList.jsx";
import LowStockList from "./LowStockList.jsx";
import ProductsPanel from "./ProductsPanel.jsx";
import StockAdjustDialog from "./StockAdjustDialog.jsx";
import ProductEditorDialog from "./ProductEditorDialog.jsx";

const TABS = [
  { key: "stock", label: "Stock" },
  { key: "low",   label: "Low Stock" },
  { key: "products", label: "Products" },
];

function InventoryBody() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const [tab, setTab] = useState("stock");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // bumps low-stock list

  const [adjustVariant, setAdjustVariant] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pr, cr] = await Promise.all([
        productsService.list(), // include unavailable for management
        categoriesService.list(),
      ]);
      setProducts(pr.products || []);
      setCategories(cr.categories || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Could not load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshAll = () => {
    load();
    setRefreshKey((k) => k + 1);
  };

  const openAdjust = (variant) => setAdjustVariant(variant);
  const onStockSaved = () => refreshAll();

  const onCreate = () => {
    setEditingProduct(null);
    setEditorOpen(true);
  };
  const onEdit = (p) => {
    setEditingProduct(p);
    setEditorOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.97_0.015_75)] text-foreground">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground truncate">
              {settings.business_name || "Kape sa Sulok"}
            </p>
            <h1 className="text-lg font-bold leading-tight">Inventory</h1>
          </div>
          <div className="flex items-center gap-2">
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
        <nav className="mx-auto max-w-3xl px-4 flex gap-1 border-t">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-none px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <p className="mx-auto max-w-3xl px-4 pb-2 text-[11px] text-muted-foreground sm:hidden">
          Signed in as {user?.name} ({user?.role})
        </p>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive font-medium">Could not load inventory</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" size="sm" onClick={load}>Retry</Button>
          </div>
        ) : (
          <>
            {tab === "stock" && (
              <StockList products={products} onAdjust={openAdjust} />
            )}
            {tab === "low" && (
              <LowStockList refreshKey={refreshKey} onAdjust={openAdjust} />
            )}
            {tab === "products" && (
              <ProductsPanel
                products={products}
                onCreate={onCreate}
                onEdit={onEdit}
                onChanged={refreshAll}
              />
            )}
          </>
        )}
      </main>

      <StockAdjustDialog
        open={Boolean(adjustVariant)}
        onOpenChange={(v) => !v && setAdjustVariant(null)}
        variant={adjustVariant}
        onSaved={onStockSaved}
      />

      <ProductEditorDialog
        open={editorOpen}
        onOpenChange={(v) => {
          setEditorOpen(v);
          if (!v) setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onSaved={(p) => {
          // After create, switch to editing the new product so user can add variants
          if (p && !editingProduct) setEditingProduct(p);
          refreshAll();
        }}
      />
    </div>
  );
}

export default function InventoryApp() {
  return <RouteGuard appKey="inventory"><InventoryBody /></RouteGuard>;
}
