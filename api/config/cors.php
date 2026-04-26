<?php
// Edit this list to lock down which web origins may call the API.
// Use "*" only for early development. Once deployed, list real origins:
//   'http://localhost:5173'
//   'http://192.168.1.10'
//   'https://kape.example.com'
declare(strict_types=1);

return [
    'allowed_origins' => [
        '*',
    ],
    // Browser caches the preflight response for this many seconds.
    'max_age' => 600,
];
