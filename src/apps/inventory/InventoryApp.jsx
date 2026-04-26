import { Link } from "@tanstack/react-router";
import RouteGuard from "../../shared/auth/RouteGuard.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";
import { Button } from "@/components/ui/button";

function InventoryBody() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Kape sa Sulok</p>
      <h1 className="text-4xl font-bold mt-2">Inventory</h1>
      <p className="mt-4 text-muted-foreground text-center max-w-md">
        Coming in Phase 4 — mobile stock management.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Signed in as {user?.name} ({user?.role})</p>
      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline"><Link to="/">Home</Link></Button>
        <Button variant="ghost" onClick={() => logout()}>Sign out</Button>
      </div>
    </div>
  );
}

export default function InventoryApp() {
  return <RouteGuard appKey="inventory"><InventoryBody /></RouteGuard>;
}
