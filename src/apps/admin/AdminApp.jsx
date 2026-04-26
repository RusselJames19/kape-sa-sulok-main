import { useState } from "react";
import { Link } from "@tanstack/react-router";
import RouteGuard from "../../shared/auth/RouteGuard.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ConnectionPanel from "./ConnectionPanel.jsx";
import UsersPanel from "./UsersPanel.jsx";
import SettingsPanel from "./SettingsPanel.jsx";

function AdminBody() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("users");

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.015_75)] text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Kape sa Sulok
            </p>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm hidden sm:block">
              <p className="font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground">@{user?.username} · {user?.role}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Home</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await logout();
                toast.success("Signed out");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 flex gap-1 border-t overflow-x-auto">
          {[
            { key: "users", label: "Users" },
            { key: "settings", label: "Settings" },
            { key: "connection", label: "Connection" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {tab === "users" && <UsersPanel />}
        {tab === "settings" && <SettingsPanel />}
        {tab === "connection" && <ConnectionPanel />}
      </main>
    </div>
  );
}

export default function AdminApp() {
  return <RouteGuard appKey="admin"><AdminBody /></RouteGuard>;
}
