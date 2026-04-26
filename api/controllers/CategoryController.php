<?php
declare(strict_types=1);

class CategoryController
{
    /** GET /categories — list categories. ?include_inactive=1 to include disabled. */
    public function index(Request $req): array
    {
        $includeInactive = (string)$req->query('include_inactive', '0') === '1';
        $sql = 'SELECT id, name, is_active, created_at FROM categories';
        if (!$includeInactive) $sql .= ' WHERE is_active = 1';
        $sql .= ' ORDER BY name ASC';
        $rows = Database::pdo()->query($sql)->fetchAll();
        return ['ok' => true, 'categories' => $rows];
    }

    /** POST /categories  { name } */
    public function store(Request $req): array
    {
        $name = trim((string)($req->body()['name'] ?? ''));
        if ($name === '') Response::error('invalid_input', 'Name is required', 422);
        $pdo = Database::pdo();
        $check = $pdo->prepare('SELECT 1 FROM categories WHERE name = ? LIMIT 1');
        $check->execute([$name]);
        if ($check->fetchColumn()) Response::error('name_taken', 'Category name already exists', 409);
        $ins = $pdo->prepare('INSERT INTO categories (name) VALUES (?)');
        $ins->execute([$name]);
        $id = (int)$pdo->lastInsertId();
        return ['ok' => true, 'category' => $this->fetch($id)];
    }

    /** PUT /categories/{id}  { name } */
    public function update(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        if (!$this->fetch($id)) Response::notFound('Category not found');
        $name = trim((string)($req->body()['name'] ?? ''));
        if ($name === '') Response::error('invalid_input', 'Name is required', 422);
        Database::pdo()->prepare('UPDATE categories SET name = ? WHERE id = ?')->execute([$name, $id]);
        return ['ok' => true, 'category' => $this->fetch($id)];
    }

    /** POST /categories/{id}/deactivate */
    public function deactivate(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        if (!$this->fetch($id)) Response::notFound('Category not found');
        Database::pdo()->prepare('UPDATE categories SET is_active = 0 WHERE id = ?')->execute([$id]);
        return ['ok' => true];
    }

    private function fetch(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT id, name, is_active, created_at FROM categories WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
