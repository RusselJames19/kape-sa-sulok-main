// POS app shell — full UI lands in Phase 3.
export default function PosApp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center max-w-md px-6">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Kape sa Sulok</p>
        <h1 className="text-4xl font-bold mt-2">POS</h1>
        <p className="mt-4 text-muted-foreground">
          Coming in Phase 3 — login, product grid, cart, cash payment, receipt modal.
        </p>
      </div>
    </div>
  );
}
