<?php
// Central route registry. All endpoints with their role guards.
declare(strict_types=1);

function registerRoutes(Router $r): Router
{
    // ---- Public ----
    $r->get('/ping', fn(Request $q) => (new PingController())->ping($q));

    // ---- Auth ----
    $r->post('/auth/login',   fn(Request $q) => (new AuthController())->login($q));
    $r->post('/auth/refresh', fn(Request $q) => (new AuthController())->refresh($q));
    $r->post('/auth/logout',  fn(Request $q) => (new AuthController())->logout($q),
        [Auth::requireAuth()]);
    $r->get('/auth/me',       fn(Request $q) => (new AuthController())->me($q),
        [Auth::requireAuth()]);

    // ---- Users (admin only) ----
    $admin = [Auth::requireRole('admin')];
    $r->get   ('/users',                    fn(Request $q) => (new UserController())->index($q),         $admin);
    $r->post  ('/users',                    fn(Request $q) => (new UserController())->store($q),         $admin);
    $r->get   ('/users/{id}',               fn(Request $q) => (new UserController())->show($q),          $admin);
    $r->put   ('/users/{id}',               fn(Request $q) => (new UserController())->update($q),        $admin);
    $r->post  ('/users/{id}/password',      fn(Request $q) => (new UserController())->resetPassword($q), $admin);
    $r->post  ('/users/{id}/activate',      fn(Request $q) => (new UserController())->activate($q),      $admin);
    $r->post  ('/users/{id}/deactivate',    fn(Request $q) => (new UserController())->deactivate($q),    $admin);

    // ---- Categories ----
    $manage = [Auth::requireRole('admin', 'owner', 'manager')];
    $r->get   ('/categories',                 fn(Request $q) => (new CategoryController())->index($q),
        [Auth::requireAuth()]);
    $r->post  ('/categories',                 fn(Request $q) => (new CategoryController())->store($q),       $manage);
    $r->put   ('/categories/{id}',            fn(Request $q) => (new CategoryController())->update($q),      $manage);
    $r->post  ('/categories/{id}/deactivate', fn(Request $q) => (new CategoryController())->deactivate($q),  $manage);

    // ---- Products ----
    $r->get ('/products',                       fn(Request $q) => (new ProductController())->index($q),
        [Auth::requireAuth()]);
    $r->get ('/products/{id}',                  fn(Request $q) => (new ProductController())->show($q),
        [Auth::requireAuth()]);
    $r->post('/products',                       fn(Request $q) => (new ProductController())->store($q),           $manage);
    $r->put ('/products/{id}',                  fn(Request $q) => (new ProductController())->update($q),          $manage);
    $r->post('/products/{id}/availability',     fn(Request $q) => (new ProductController())->setAvailability($q), $manage);

    // ---- Variants ----
    $r->post  ('/variants',        fn(Request $q) => (new VariantController())->store($q),   $manage);
    $r->put   ('/variants/{id}',   fn(Request $q) => (new VariantController())->update($q),  $manage);
    $r->delete('/variants/{id}',   fn(Request $q) => (new VariantController())->destroy($q), $manage);

    // ---- Stock (manager only for updates) ----
    $r->post('/variants/{id}/stock', fn(Request $q) => (new StockController())->update($q),
        [Auth::requireRole('manager')]);
    $r->get ('/inventory/low-stock', fn(Request $q) => (new StockController())->lowStock($q), $manage);

    // ---- Transactions ----
    $pos = [Auth::requireRole('manager', 'cashier')];
    $r->post('/transactions',          fn(Request $q) => (new TransactionController())->store($q), $pos);
    $r->get ('/transactions',          fn(Request $q) => (new TransactionController())->index($q),
        [Auth::requireAuth()]);
    $r->get ('/transactions/{id}',     fn(Request $q) => (new TransactionController())->show($q),
        [Auth::requireAuth()]);

    // ---- Analytics ----
    $r->get('/analytics/summary',       fn(Request $q) => (new AnalyticsController())->summary($q),     $manage);
    $r->get('/analytics/sales',         fn(Request $q) => (new AnalyticsController())->sales($q),       $manage);
    $r->get('/analytics/top-products',  fn(Request $q) => (new AnalyticsController())->topProducts($q), $manage);
    $r->get('/analytics/peak-hours',    fn(Request $q) => (new AnalyticsController())->peakHours($q),   $manage);

    // ---- Settings ----
    $r->get('/settings', fn(Request $q) => (new SettingsController())->index($q),
        [Auth::requireAuth()]);
    $r->put('/settings', fn(Request $q) => (new SettingsController())->update($q),
        [Auth::requireRole('admin')]);

    // ---- Uploads (admin + manager) ----
    $upload = [Auth::requireRole('admin', 'manager')];
    $r->post('/upload/image', fn(Request $q) => (new UploadController())->image($q), $upload);

    // ---- Backups (admin only) ----
    $r->post  ('/backup/generate',            fn(Request $q) => (new BackupController())->generate($q), $admin);
    $r->get   ('/backup/list',                fn(Request $q) => (new BackupController())->index($q),    $admin);
    $r->get   ('/backup/download/{filename}', fn(Request $q) => (new BackupController())->download($q), $admin);
    $r->delete('/backup/{filename}',          fn(Request $q) => (new BackupController())->destroy($q),  $admin);

    return $r;
}
