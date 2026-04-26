import { useEffect, useState } from "react";
import { usersService } from "../../shared/services/users";
import { ROLES } from "../../shared/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ROLE_LIST = [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER];

export default function UserFormDialog({ open, onOpenChange, user, onSaved }) {
  const isEdit = Boolean(user);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(ROLES.CASHIER);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setName(user?.name || "");
      setUsername(user?.username || "");
      setRole(user?.role || ROLES.CASHIER);
      setPassword("");
      setErr(null);
    }
  }, [open, user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      if (isEdit) {
        await usersService.update(user.id, { name: name.trim(), role });
        toast.success("User updated");
      } else {
        await usersService.create({
          name: name.trim(),
          username: username.trim(),
          password,
          role,
        });
        toast.success("User created");
      }
      onSaved?.();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update name and role. Use “Reset password” for credentials." : "Add a new staff account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-name">Full name</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-username">Username</Label>
            <Input
              id="u-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={submitting || isEdit}
              placeholder="e.g. juan.cruz"
            />
            {isEdit && <p className="text-xs text-muted-foreground">Username can't be changed.</p>}
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="u-password">Initial password</Label>
              <Input
                id="u-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="u-role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={submitting}>
              <SelectTrigger id="u-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_LIST.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {err && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
