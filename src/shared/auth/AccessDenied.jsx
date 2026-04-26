import { Link } from "@tanstack/react-router";
import { useAuth } from "./AuthContext";
import { Button } from "@/components/ui/button";

const APP_LABELS = {
  pos: "Point of Sale",
  inventory: "Inventory",
  dashboard: "Dashboard",
  admin: "Admin Panel",
};

export default function AccessDenied({ requiredApp }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive text-2xl">
          ⚠
        </div>
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          Your role <span className="font-mono font-semibold">{user?.role}</span> doesn’t have
          access to <span className="font-semibold">{APP_LABELS[requiredApp] || requiredApp}</span>.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="default">
            <Link to="/">Go home</Link>
          </Button>
          <Button variant="outline" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
