import { useEffect, useState, useCallback } from "react";
import { usersService } from "../../shared/services/users";
import { useAuth } from "../../shared/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import UserFormDialog from "./UserFormDialog.jsx";
import PasswordResetDialog from "./PasswordResetDialog.jsx";

export default function UsersPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create
  const [pwTarget, setPwTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.list();
      setUsers(data?.users || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onToggleActive = async (u) => {
    try {
      if (u.is_active) {
        await usersService.deactivate(u.id);
        toast.success(`Deactivated ${u.username}`);
      } else {
        await usersService.activate(u.id);
        toast.success(`Activated ${u.username}`);
      }
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts and roles.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          + New user
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users yet.</TableCell></TableRow>
              )}
              {!loading && users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">@{u.username}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell>
                      {u.is_active
                        ? <Badge variant="outline" className="border-emerald-300 text-emerald-700">Active</Badge>
                        : <Badge variant="outline" className="border-muted text-muted-foreground">Disabled</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setFormOpen(true); }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPwTarget(u)}>
                        Reset password
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onToggleActive(u)}
                        disabled={isSelf}
                        title={isSelf ? "You can't deactivate your own account" : ""}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSaved={() => { setFormOpen(false); load(); }}
      />
      <PasswordResetDialog
        user={pwTarget}
        onOpenChange={(v) => !v && setPwTarget(null)}
        onDone={() => setPwTarget(null)}
      />
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    admin:   "bg-rose-100 text-rose-800 border-rose-200",
    owner:   "bg-amber-100 text-amber-800 border-amber-200",
    manager: "bg-sky-100 text-sky-800 border-sky-200",
    cashier: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[role] || "bg-muted text-foreground"}`}>
      {role}
    </span>
  );
}
