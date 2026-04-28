<?php
// Database backup controller — admin only.
// Generates / lists / downloads / deletes mysqldump .sql files in api/backups/.
declare(strict_types=1);

class BackupController
{
    private const FILENAME_REGEX = '/^ksu_backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/';

    private function backupDir(): string
    {
        $dir = realpath(__DIR__ . '/../backups');
        if ($dir === false) {
            // Try to create it on first run.
            $target = __DIR__ . '/../backups';
            if (!is_dir($target)) @mkdir($target, 0775, true);
            $dir = realpath($target);
        }
        if ($dir === false) {
            Response::error('backup_dir_missing', 'Backup directory could not be created', 500);
        }
        return $dir;
    }

    /** Validate filename + ensure it resolves inside the backup dir. */
    private function safePath(string $filename): string
    {
        if (!preg_match(self::FILENAME_REGEX, $filename)) {
            Response::error('invalid_filename', 'Invalid backup filename', 400);
        }
        $dir = $this->backupDir();
        $full = $dir . DIRECTORY_SEPARATOR . $filename;
        $real = realpath($full);
        if ($real === false || strpos($real, $dir . DIRECTORY_SEPARATOR) !== 0) {
            Response::notFound('Backup file not found');
        }
        return $real;
    }

    /** POST /backup/generate */
    public function generate(Request $req): array
    {
        $cfg = require __DIR__ . '/../config/database.php';
        $dir = $this->backupDir();

        $stamp = date('Y-m-d_H-i-s');
        $filename = "ksu_backup_{$stamp}.sql";
        $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;

        $cmd = sprintf(
            'mysqldump --host=%s --port=%d --user=%s --single-transaction --routines --triggers --default-character-set=%s %s',
            escapeshellarg((string)$cfg['host']),
            (int)$cfg['port'],
            escapeshellarg((string)$cfg['username']),
            escapeshellarg((string)$cfg['charset']),
            escapeshellarg((string)$cfg['database'])
        );

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['file', $fullPath, 'w'],
            2 => ['pipe', 'w'],
        ];

        // Pass password via MYSQL_PWD env var (never on the command line).
        $env = $_ENV ?: [];
        $env['MYSQL_PWD'] = (string)$cfg['password'];

        $proc = @proc_open($cmd, $descriptors, $pipes, null, $env);
        if (!is_resource($proc)) {
            @unlink($fullPath);
            Response::error(
                'mysqldump_unavailable',
                'mysqldump could not be executed. Make sure it is installed and on the PHP exec PATH.',
                500
            );
        }

        fclose($pipes[0]);
        $stderr = stream_get_contents($pipes[2]) ?: '';
        fclose($pipes[2]);
        $exit = proc_close($proc);

        if ($exit !== 0 || !file_exists($fullPath) || filesize($fullPath) === 0) {
            @unlink($fullPath);
            Response::error(
                'backup_failed',
                'mysqldump failed (exit ' . $exit . '): ' . trim($stderr),
                500
            );
        }

        return [
            'filename'  => $filename,
            'sizeBytes' => filesize($fullPath),
            'createdAt' => date('c'),
        ];
    }

    /** GET /backup/list */
    public function index(Request $req): array
    {
        $dir = $this->backupDir();
        $items = [];
        $handle = @opendir($dir);
        if ($handle) {
            while (($entry = readdir($handle)) !== false) {
                if (!preg_match(self::FILENAME_REGEX, $entry)) continue;
                $full = $dir . DIRECTORY_SEPARATOR . $entry;
                if (!is_file($full)) continue;
                $items[] = [
                    'filename'  => $entry,
                    'sizeBytes' => filesize($full),
                    'createdAt' => date('c', filemtime($full)),
                ];
            }
            closedir($handle);
        }
        // Newest first.
        usort($items, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
        return ['items' => $items];
    }

    /** GET /backup/download/{filename} — streams the file. */
    public function download(Request $req): void
    {
        $filename = (string)($req->params['filename'] ?? '');
        $real = $this->safePath($filename);

        // Discard any prior output buffers so JSON headers don't leak in.
        while (ob_get_level() > 0) ob_end_clean();

        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($real));
        header('X-Content-Type-Options: nosniff');
        readfile($real);
        exit;
    }

    /** DELETE /backup/{filename} */
    public function destroy(Request $req): array
    {
        $filename = (string)($req->params['filename'] ?? '');
        $real = $this->safePath($filename);
        if (!@unlink($real)) {
            Response::error('delete_failed', 'Could not delete backup file', 500);
        }
        return ['ok' => true, 'filename' => $filename];
    }
}
