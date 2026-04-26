export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  MANAGER: "manager",
  CASHIER: "cashier",
};

// Per-app role allow-lists (mirrors the spec's permission matrix).
export const APP_ACCESS = {
  pos:       [ROLES.MANAGER, ROLES.CASHIER],
  inventory: [ROLES.MANAGER],
  dashboard: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER],
  admin:     [ROLES.ADMIN],
};
