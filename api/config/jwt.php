<?php
// JWT configuration.
// REPLACE 'jwt_secret' with a strong random string in production.
// You can generate one with: php -r "echo bin2hex(random_bytes(32));"

return [
    'secret'             => 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET_64_CHARS_MINIMUM',
    'issuer'             => 'kape-sa-sulok',
    'access_ttl_seconds' => 60 * 60,        // 1 hour
    'refresh_ttl_seconds'=> 60 * 60 * 24 * 7, // 7 days
];
