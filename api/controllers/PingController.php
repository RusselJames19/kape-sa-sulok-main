<?php
declare(strict_types=1);

class PingController
{
    public function ping(Request $req): array
    {
        return [
            'status'    => 'ok',
            'service'   => 'kape-sa-sulok-api',
            'timestamp' => date(DATE_ATOM),
        ];
    }
}
