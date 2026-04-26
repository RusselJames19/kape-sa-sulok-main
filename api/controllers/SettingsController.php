<?php
declare(strict_types=1);

/**
 * System settings — key/value store.
 *
 * Whitelisted keys only. We never trust raw user-supplied keys to avoid
 * pollution of the table with arbitrary data.
 */
class SettingsController
{
    /**
     * Public-shape settings (returned to any authenticated user).
     * Receipt + branding info that the POS / Inventory / Dashboard need.
     */
    private const ALLOWED_KEYS = [
        'business_name',
        'business_address',
        'logo_url',
        'low_stock_threshold',
        'currency_symbol',
        'receipt_footer',
    ];

    /** Maximum length per value (defensive — most are short). */
    private const MAX_VALUE_LEN = 500;

    public function index(Request $req): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->query('SELECT setting_key, setting_value FROM system_settings');
        $out = [];
        foreach (self::ALLOWED_KEYS as $k) {
            $out[$k] = '';
        }
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $k = (string)$row['setting_key'];
            if (in_array($k, self::ALLOWED_KEYS, true)) {
                $out[$k] = (string)($row['setting_value'] ?? '');
            }
        }
        Response::json(['settings' => $out]);
    }

    public function update(Request $req): void
    {
        $body = $req->body();
        if (!is_array($body) || empty($body)) {
            Response::error('invalid_request', 'Request body must be an object of key/value pairs.', 422);
        }

        // Filter to whitelist + validate values.
        $clean = [];
        foreach ($body as $key => $value) {
            if (!is_string($key) || !in_array($key, self::ALLOWED_KEYS, true)) {
                continue; // silently drop unknown keys
            }
            if ($value === null) $value = '';
            if (!is_scalar($value)) {
                Response::error('invalid_value', "Setting '$key' must be a scalar.", 422);
            }
            $value = (string)$value;
            if (strlen($value) > self::MAX_VALUE_LEN) {
                Response::error('invalid_value', "Setting '$key' exceeds {self::MAX_VALUE_LEN} chars.", 422);
            }

            // Per-key extra validation
            if ($key === 'low_stock_threshold') {
                if ($value === '' || !ctype_digit($value)) {
                    Response::error('invalid_value', 'low_stock_threshold must be a non-negative integer.', 422);
                }
                $n = (int)$value;
                if ($n < 0 || $n > 100000) {
                    Response::error('invalid_value', 'low_stock_threshold out of range.', 422);
                }
            }
            if ($key === 'logo_url' && $value !== '') {
                if (!preg_match('#^https?://#i', $value)) {
                    Response::error('invalid_value', 'logo_url must be an http(s) URL.', 422);
                }
            }
            if ($key === 'business_name' && trim($value) === '') {
                Response::error('invalid_value', 'business_name cannot be empty.', 422);
            }
            $clean[$key] = $value;
        }

        if (empty($clean)) {
            Response::error('no_valid_keys', 'No recognized settings provided.', 422);
        }

        $pdo = Database::pdo();
        $sql = 'INSERT INTO system_settings (setting_key, setting_value)
                VALUES (:k, :v)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)';
        $stmt = $pdo->prepare($sql);
        foreach ($clean as $k => $v) {
            $stmt->execute([':k' => $k, ':v' => $v]);
        }

        // Return current state.
        $this->index($req);
    }
}
