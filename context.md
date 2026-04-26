# Kape sa Sulok — Business Management System

Repository: `Business-Management-System`

## Overview

A full small-business management system for the Filipino café **Kape sa Sulok**.
Architected as **four React apps** sharing one PHP/MySQL backend, designed so
that POS and Dashboard can later be wrapped in Electron and Inventory in
React Native / Expo.

| App        | Audience          | Roles                          | Future wrapper |
|------------|-------------------|--------------------------------|----------------|
| POS        | Counter terminal  | Cashier, Manager               | Electron       |
| Inventory  | Mobile floor use  | Manager                        | React Native   |
| Dashboard  | Office desktop    | Admin (view), Owner, Manager   | Electron       |
| Admin      | Browser only      | Admin                          | (none)         |

## Tech Stack

- **Frontend:** React 19 (JavaScript / `.jsx` for app code) + Tailwind CSS,
  hosted in a TanStack Start shell for routing & SSR. App-level code stays
  100% JS; only the small router shell remains TypeScript.
- **HTTP:** Axios, base URL configurable per-machine via the Settings page
  (persisted in `localStorage`).
- **Backend:** PHP 8 (XAMPP / Apache) — no framework, custom Router class.
- **Database:** MySQL (InnoDB) via XAMPP.
- **Auth:** JWT (HS256) with access + refresh tokens, bcrypt password hashing,
  DB-backed login rate limiting.

## Phases

### ✅ Phase 1 — Foundation (current)

Delivered:
- `database/schema.sql` — full schema + seed data, ready for phpMyAdmin import.
- `/api/` PHP REST API skeleton:
  - Custom Router with `{param}` support
  - PDO singleton enforcing real prepared statements
  - HS256 JWT encode/decode (no external lib)
  - `Auth::requireAuth()` and `Auth::requireRole(...)` middleware
  - `RateLimiter` for login attempts
  - All controller stubs returning `{ok:true, todo:"..."}` with role guards wired
  - Working `/api/ping` endpoint
- `/src/shared/services/api.js` — Axios layer reading base URL from
  `localStorage`, auto-attaching JWT.
- `/src/shared/services/{auth,products,transactions,users}.js` — service stubs.
- `/src/shared/constants/{roles,permissions}.js` — single source of truth
  for the permissions matrix.
- Folder scaffold for all 4 apps under `/src/apps/`.
- `/src/routes/{pos,inventory,dashboard,admin}.tsx` — route shells.
- New landing page at `/` to pick an app.

### ⏳ Upcoming

- **Phase 2 — Admin Panel:** real auth flow, user CRUD, product/category CRUD, settings UI.
- **Phase 3 — POS App:** product grid, cart, cash payment, receipt modal, stock deduction.
- **Phase 4 — Inventory App:** mobile-first stock updates, low-stock alerts, product editing.
- **Phase 5 — Dashboard App:** charts (Recharts), top products, peak hours heatmap.
- **Phase 6 — Polish & hardening:** Settings page wired everywhere, security audit, responsive polish.

## Database Schema (summary)

InnoDB, `utf8mb4_unicode_ci`. See `database/schema.sql` for full DDL.

| Table              | Purpose                                                           |
|--------------------|-------------------------------------------------------------------|
| `users`            | Login accounts. Roles: admin / owner / manager / cashier. bcrypt. |
| `categories`       | Menu categories (Coffee, Pastries, …). Soft-deactivatable.        |
| `products`         | Menu items. FK → categories. `is_available` toggle.               |
| `product_variants` | Per-size SKU (none/S/M/L). Holds price, stock, low-stock threshold. |
| `transactions`     | Sale headers. FK → cashier user.                                  |
| `transaction_items`| Sale lines. Snapshots `unit_price_at_sale`.                       |
| `system_settings`  | Key/value: business name, logo, address, default low-stock, etc.  |
| `login_attempts`   | Rate-limit log (username, IP, success).                           |
| `refresh_tokens`   | Hashed refresh tokens with expiry + revocation.                   |

Seed data: 1 admin user (`admin` / replace hash on first run), 4 default
categories, default system_settings rows.

## API Endpoints

All routes under `/api`. Protected routes require `Authorization: Bearer <jwt>`.
Roles are validated **server-side** on every protected endpoint.

| Method | Path                              | Roles                                | Description                                           |
|--------|-----------------------------------|--------------------------------------|-------------------------------------------------------|
| GET    | `/ping`                           | public                               | Health/connection test                                |
| POST   | `/auth/login`                     | public (rate-limited)                | Username + password → access + refresh tokens         |
| POST   | `/auth/refresh`                   | public                               | Refresh access token                                  |
| POST   | `/auth/logout`                    | any auth                             | Revoke current refresh token                          |
| GET    | `/auth/me`                        | any auth                             | Current user info                                     |
| GET    | `/users`                          | admin                                | List users                                            |
| POST   | `/users`                          | admin                                | Create user                                           |
| GET    | `/users/{id}`                     | admin                                | Get user                                              |
| PUT    | `/users/{id}`                     | admin                                | Update name/role                                      |
| POST   | `/users/{id}/password`            | admin                                | Reset password                                        |
| POST   | `/users/{id}/activate`            | admin                                | Activate                                              |
| POST   | `/users/{id}/deactivate`          | admin                                | Deactivate                                            |
| GET    | `/categories`                     | any auth                             | List categories                                       |
| POST   | `/categories`                     | admin / owner / manager              | Create                                                |
| PUT    | `/categories/{id}`                | admin / owner / manager              | Rename                                                |
| POST   | `/categories/{id}/deactivate`     | admin / owner / manager              | Soft-disable                                          |
| GET    | `/products`                       | any auth                             | List products with variants                           |
| GET    | `/products/{id}`                  | any auth                             | Get product                                           |
| POST   | `/products`                       | admin / owner / manager              | Create                                                |
| PUT    | `/products/{id}`                  | admin / owner / manager              | Update                                                |
| POST   | `/products/{id}/availability`     | admin / owner / manager              | Toggle `is_available`                                 |
| POST   | `/variants`                       | admin / owner / manager              | Create variant                                        |
| PUT    | `/variants/{id}`                  | admin / owner / manager              | Update price/size                                     |
| DELETE | `/variants/{id}`                  | admin / owner / manager              | Remove variant                                        |
| POST   | `/variants/{id}/stock`            | manager                              | Set or add stock (`mode: set\|add`)                   |
| GET    | `/inventory/low-stock`            | admin / owner / manager              | Variants below threshold                              |
| POST   | `/transactions`                   | manager / cashier                    | Atomic: insert + items + stock deduct                 |
| GET    | `/transactions`                   | any auth                             | List (cashier should only see own — enforced Phase 3) |
| GET    | `/transactions/{id}`              | any auth                             | Get one with items                                    |
| GET    | `/analytics/summary`              | admin / owner / manager              | Today totals + top product + low-stock count          |
| GET    | `/analytics/sales`                | admin / owner / manager              | Time-series; `from`, `to`, `granularity`              |
| GET    | `/analytics/top-products`         | admin / owner / manager              | By revenue or quantity                                |
| GET    | `/analytics/peak-hours`           | admin / owner / manager              | Hour × weekday heatmap                                |
| GET    | `/settings`                       | any auth                             | All system settings                                   |
| PUT    | `/settings`                       | admin                                | Bulk update                                           |

## Folder Structure

```
/api/                                 PHP backend — drop into XAMPP htdocs
  index.php                           single entry, dispatches to Router
  .htaccess                           rewrite + CORS + Auth header passthrough
  config/
    database.php                      PDO credentials (edit for your XAMPP)
    jwt.php                           JWT secret + TTLs (REPLACE secret)
  core/
    Router.php  Request.php  Response.php
    Database.php  JWT.php  Auth.php  RateLimiter.php
  controllers/
    AuthController  UserController  CategoryController
    ProductController  VariantController  StockController
    TransactionController  AnalyticsController  SettingsController
    PingController
  routes.php                          all routes + role guards

/database/
  schema.sql                          MySQL DDL + seed data

/src/                                 React frontend
  apps/
    pos/PosApp.jsx
    inventory/InventoryApp.jsx
    dashboard/DashboardApp.jsx
    admin/AdminApp.jsx
  shared/
    services/
      api.js              centralized Axios + token storage + ping
      auth.js             login / logout / me
      products.js  transactions.js  users.js
    constants/
      roles.js  permissions.js
    utils/
      currency.js
  routes/                             TanStack route shells
    __root.tsx (existing)
    index.tsx                         landing / app picker
    pos.tsx  inventory.tsx  dashboard.tsx  admin.tsx
  router.tsx (existing)
```

## Environment & Connection Setup

### Backend (XAMPP — your local machine)

1. Install XAMPP and start **Apache** + **MySQL**.
2. Open phpMyAdmin → import `database/schema.sql`.
3. Copy the `/api` folder into `C:\xampp\htdocs\api` (or your htdocs path).
4. Edit `api/config/database.php` if your MySQL credentials differ from defaults.
5. **Edit `api/config/jwt.php`** — replace the placeholder secret with a long
   random string. Generate one with:
   ```
   php -r "echo bin2hex(random_bytes(32));"
   ```
6. **Replace the seed admin password hash.** From the command line:
   ```
   php -r "echo password_hash('YourStrongPassword', PASSWORD_BCRYPT);"
   ```
   Then `UPDATE users SET password_hash = '<hash>' WHERE username = 'admin';`
7. Visit `http://localhost/api/ping` — should return
   `{"status":"ok","service":"kape-sa-sulok-api","timestamp":"..."}`.

### Frontend (any of the 4 apps)

- Open the app in the browser.
- The Axios layer reads its base URL from `localStorage` key `ksu.apiBaseUrl`.
- Default fallback is `http://localhost/api`.
- A Settings page (Phase 6) will let users change this in-app to e.g.
  `http://192.168.1.10/api` for the LAN scenario.
- For now you can set it manually in DevTools:
  ```js
  localStorage.setItem('ksu.apiBaseUrl', 'http://localhost/api');
  ```

## Security Posture

- **Server-side role checks on every protected route** via `Auth::requireRole(...)`.
- **Bcrypt** password hashing (`password_hash` / `password_verify`).
- **Prepared statements only** — `PDO::ATTR_EMULATE_PREPARES = false`.
- **JWT with expiry**; refresh tokens stored hashed with `revoked_at` audit.
- **Rate limiting** on login: 5 fails per (username + IP) per 15 min.
- **CORS** currently `*` for dev — lock down to known origins in Phase 6.
- **Admin panel** is browser-only; never bundled into Electron/Expo apps.

## Coming Next — Phase 2 (Admin Panel)

- Replace stub auth controller with real bcrypt + JWT issuance + rate-limit check.
- Build full Admin UI: login, user list/create/edit/activate, product & category CRUD, system settings editor.
- Wire Axios refresh-on-401 interceptor.
- Update `context.md`.
- Commit message target: `[Phase 2] Admin Panel complete`.
