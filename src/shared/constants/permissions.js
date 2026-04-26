import { ROLES } from "./roles";

// Permission map — server is authoritative; this is for UI gating only.
export const PERMISSIONS = {
  manageUsers:      [ROLES.ADMIN],
  viewDashboard:    [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER],
  viewAnalytics:    [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER],
  manageProducts:   [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER],
  usePos:           [ROLES.MANAGER, ROLES.CASHIER],
  viewInventory:    [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER],
  updateStock:      [ROLES.MANAGER],
  viewTransactions: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER],
  accessAdminPanel: [ROLES.ADMIN],
};

export function can(role, permission) {
  return (PERMISSIONS[permission] || []).includes(role);
}
