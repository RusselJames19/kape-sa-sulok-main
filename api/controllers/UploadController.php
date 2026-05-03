<?php
// Image upload controller — admin/manager only.
// Saves uploaded images to C:/xampp/htdocs/uploads/products/ and returns
// a fully-qualified URL built from $_SERVER['HTTP_HOST'].
declare(strict_types=1);

class UploadController
{
    private const MAX_BYTES = 2097152; // 2 MB
    private const ALLOWED_EXT  = ['jpg', 'jpeg', 'png', 'webp'];
    private const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

    /** POST /upload/image */
    public function image(Request $req): array
    {
        if (!isset($_FILES['image'])) {
            Response::error('no_file', 'No file uploaded. Expected field "image".', 400);
        }
        $f = $_FILES['image'];

        if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $code = is_array($f) ? (int)($f['error'] ?? 0) : 0;
            if ($code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE) {
                Response::error('file_too_large', 'File exceeds the maximum allowed size of 2MB.', 413);
            }
            Response::error('upload_failed', 'File upload failed (code ' . $code . ').', 400);
        }

        $size = (int)($f['size'] ?? 0);
        if ($size <= 0) {
            Response::error('empty_file', 'Uploaded file is empty.', 400);
        }
        if ($size > self::MAX_BYTES) {
            Response::error('file_too_large', 'File exceeds the maximum allowed size of 2MB.', 413);
        }

        $tmp = (string)($f['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            Response::error('upload_failed', 'Invalid uploaded file.', 400);
        }

        $origName = (string)($f['name'] ?? '');
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        if (!in_array($ext, self::ALLOWED_EXT, true)) {
            Response::error('invalid_type', 'Only JPG, JPEG, PNG, and WEBP images are allowed.', 415);
        }

        // Verify actual MIME via finfo (don't trust client-supplied type).
        $detectedMime = '';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $detectedMime = (string)finfo_file($finfo, $tmp);
                finfo_close($finfo);
            }
        }
        if ($detectedMime !== '' && !in_array($detectedMime, self::ALLOWED_MIME, true)) {
            Response::error('invalid_type', 'File contents are not a valid JPG, PNG, or WEBP image.', 415);
        }

        // Resolve target dir: C:/xampp/htdocs/uploads/products/
        $targetDir = 'C:/xampp/htdocs/uploads/products';
        if (!is_dir($targetDir)) {
            if (!@mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
                Response::error('mkdir_failed', 'Could not create uploads directory.', 500);
            }
        }

        // Drop a hardening .htaccess on first run.
        $ht = $targetDir . '/.htaccess';
        if (!file_exists($ht)) {
            $rules = "<FilesMatch \"\.(jpe?g|png|webp)$\">\n"
                   . "    Require all granted\n"
                   . "</FilesMatch>\n"
                   . "<FilesMatch \"^(?!.*\.(jpe?g|png|webp)$).*$\">\n"
                   . "    Require all denied\n"
                   . "</FilesMatch>\n"
                   . "Options -Indexes\n";
            @file_put_contents($ht, $rules);
        }

        $normExt = $ext === 'jpeg' ? 'jpg' : $ext;
        $filename = uniqid('', true) . '.' . $normExt;
        // uniqid with more_entropy contains a dot — strip to keep one extension.
        $filename = str_replace('.', '', uniqid()) . '.' . $normExt;

        $dest = $targetDir . '/' . $filename;
        if (!@move_uploaded_file($tmp, $dest)) {
            Response::error('save_failed', 'Could not save uploaded file.', 500);
        }

        // Build dynamic URL from HTTP_HOST.
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
              || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        $scheme = $https ? 'https' : 'http';
        $host = (string)($_SERVER['HTTP_HOST'] ?? 'localhost');
        $url = $scheme . '://' . $host . '/uploads/products/' . $filename;

        return [
            'url'      => $url,
            'filename' => $filename,
            'size'     => $size,
        ];
    }
}
