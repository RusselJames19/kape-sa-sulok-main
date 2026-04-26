// Thin app-shell wrappers used by the .tsx route shells.
// Each wrapper is just <RouteGuard appKey="..."><App/></RouteGuard>.
// Keeping logic out of the .tsx route files per project rule.

import RouteGuard from "../../shared/auth/RouteGuard.jsx";
import PosApp from "./pos/PosApp.jsx";
import InventoryApp from "./inventory/InventoryApp.jsx";
import DashboardApp from "./dashboard/DashboardApp.jsx";
import AdminApp from "./admin/AdminApp.jsx";

export function PosShell() {
  return (
    <RouteGuard appKey="pos">
      <PosApp />
    </RouteGuard>
  );
}

export function InventoryShell() {
  return (
    <RouteGuard appKey="inventory">
      <InventoryApp />
    </RouteGuard>
  );
}

export function DashboardShell() {
  return (
    <RouteGuard appKey="dashboard">
      <DashboardApp />
    </RouteGuard>
  );
}

export function AdminShell() {
  return (
    <RouteGuard appKey="admin">
      <AdminApp />
    </RouteGuard>
  );
}
