// POS App — product grid + cart + cash payment + receipt + recent sales.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import RouteGuard from "../../shared/auth/RouteGuard.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";
import { productsService } from "../../shared/services/products";
import { categoriesService } from "../../shared/services/categories";
import { transactionsService } from "../../shared/services/transactions";

import ProductGrid from "./ProductGrid.jsx";
import CartPanel from "./CartPanel.jsx";
import PaymentDialog from "./PaymentDialog.jsx";
import ReceiptModal from "./ReceiptModal.jsx";
import RecentTransactions from "./RecentTransactions.jsx";

function PosBody() {
  const { user, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cart, setCart] = useState([]); // [{ variant_id, product_id, product_name, size, price, quantity, stock_quantity }]
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [recentRefresh, setRecentRefresh] = useState(0);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsService.list({ available_only: 1 }),
        categoriesService.list(),
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Could not load menu";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const cartTotal = useMemo(
    () => cart.reduce((s, it) => s + it.price * it.quantity, 0),
    [cart]
  );

  const addVariant = (product, variant) => {
    if ((variant.stock_quantity ?? 0) <= 0) {
      toast.error("Out of stock");
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.variant_id === variant.id);
      if (idx >= 0) {
        const it = prev[idx];
        if (it.quantity + 1 > variant.stock_quantity) {
          toast.error(`Only ${variant.stock_quantity} in stock`);
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...it, quantity: it.quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          variant_id: variant.id,
          product_id: product.id,
          product_name: product.name,
          size: variant.size,
          price: variant.price,
          quantity: 1,
          stock_quantity: variant.stock_quantity,
        },
      ];
    });
  };

  const changeQty = (variantId, qty) => {
    setCart((prev) => {
      const it = prev.find((x) => x.variant_id === variantId);
      if (!it) return prev;
      if (qty <= 0) return prev.filter((x) => x.variant_id !== variantId);
      if (it.stock_quantity != null && qty > it.stock_quantity) {
        toast.error(`Only ${it.stock_quantity} in stock`);
        return prev;
      }
      return prev.map((x) => (x.variant_id === variantId ? { ...x, quantity: qty } : x));
    });
  };

  const removeItem = (variantId) =>
    setCart((prev) => prev.filter((x) => x.variant_id !== variantId));

  const clearCart = () => setCart([]);

  const onCheckout = () => {
    if (cart.length === 0) return;
    setPaymentOpen(true);
  };

  const confirmPayment = async (amountTendered) => {
    setSubmitting(true);
    try {
      const payload = {
        amount_tendered: amountTendered,
        items: cart.map((it) => ({ variant_id: it.variant_id, quantity: it.quantity })),
      };
      const res = await transactionsService.create(payload);
      const tx = res.transaction;
      setPaymentOpen(false);
      setCart([]);
      setReceipt(tx);
      setReceiptOpen(true);
      setRecentRefresh((k) => k + 1);
      toast.success(`Sale #${tx.id} recorded`);
      // Refresh stock numbers in the grid
      loadCatalog();
    } catch (e) {
      const msg = e?.response?.data?.message || "Could not complete sale";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const viewTransaction = async (id) => {
    try {
      const res = await transactionsService.get(id);
      setReceipt(res.transaction);
      setReceiptOpen(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not load receipt");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.97_0.015_75)] text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Kape sa Sulok
            </p>
            <h1 className="text-xl font-bold">Point of Sale</h1>
          </div>
          <div className="flex items-center gap-3">
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

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-4 grid gap-4 lg:grid-cols-[1fr_380px] min-h-0">
        <section className="flex flex-col gap-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading menu…
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive font-medium">Could not load menu</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button className="mt-4" size="sm" onClick={loadCatalog}>Retry</Button>
            </div>
          ) : (
            <ProductGrid
              products={products}
              categories={categories}
              onAddVariant={addVariant}
            />
          )}
        </section>

        <aside className="flex flex-col gap-4 min-h-0 lg:h-[calc(100vh-7rem)]">
          <div className="flex-1 min-h-0">
            <CartPanel
              items={cart}
              onChangeQty={changeQty}
              onRemove={removeItem}
              onClear={clearCart}
              onCheckout={onCheckout}
            />
          </div>
          <div className="h-64 shrink-0">
            <RecentTransactions refreshKey={recentRefresh} onView={viewTransaction} />
          </div>
        </aside>
      </main>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={cartTotal}
        onConfirm={confirmPayment}
        isSubmitting={submitting}
      />
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={receipt}
      />
    </div>
  );
}

export default function PosApp() {
  return <RouteGuard appKey="pos"><PosBody /></RouteGuard>;
}
