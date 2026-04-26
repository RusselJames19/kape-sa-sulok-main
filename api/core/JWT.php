<?php
// Minimal HS256 JWT implementation — no external library.
declare(strict_types=1);

class JWT
{
    public static function encode(array $payload): string
    {
        $cfg = require __DIR__ . '/../config/jwt.php';
        $header  = ['typ' => 'JWT', 'alg' => 'HS256'];
        $payload = array_merge(['iss' => $cfg['issuer'], 'iat' => time()], $payload);

        $segs = [
            self::b64UrlEncode(json_encode($header)),
            self::b64UrlEncode(json_encode($payload)),
        ];
        $signing = implode('.', $segs);
        $sig = hash_hmac('sha256', $signing, $cfg['secret'], true);
        $segs[] = self::b64UrlEncode($sig);
        return implode('.', $segs);
    }

    /** @return array Decoded payload. Throws on invalid/expired token. */
    public static function decode(string $jwt): array
    {
        $cfg = require __DIR__ . '/../config/jwt.php';
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) throw new RuntimeException('Malformed token');

        [$h, $p, $s] = $parts;

        // Reject anything but HS256 — defence against alg=none / alg-confusion attacks.
        $headerJson = self::b64UrlDecode($h);
        $header = json_decode($headerJson, true);
        if (!is_array($header) || ($header['alg'] ?? null) !== 'HS256') {
            throw new RuntimeException('Unsupported token algorithm');
        }

        $expected = self::b64UrlEncode(hash_hmac('sha256', $h . '.' . $p, $cfg['secret'], true));
        if (!hash_equals($expected, $s)) throw new RuntimeException('Invalid signature');

        $payload = json_decode(self::b64UrlDecode($p), true);
        if (!is_array($payload)) throw new RuntimeException('Invalid payload');

        if (isset($payload['exp']) && time() >= (int)$payload['exp']) {
            throw new RuntimeException('Token expired');
        }
        if (isset($payload['iss']) && isset($cfg['issuer']) && $payload['iss'] !== $cfg['issuer']) {
            throw new RuntimeException('Invalid issuer');
        }
        return $payload;
    }

    private static function b64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64UrlDecode(string $data): string
    {
        $pad = strlen($data) % 4;
        if ($pad) $data .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }
}
