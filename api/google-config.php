<?php
define('ICTRAX_SKIP_DATABASE', true);
define('ICTRAX_SKIP_SESSION', true);
require __DIR__ . '/config.php';
require_once __DIR__ . '/google-auth-config.php';
requireRequestMethod('GET');

$configured = GOOGLE_CLIENT_ID !== '' && strpos(GOOGLE_CLIENT_ID, 'PASTE_YOUR_') !== 0;

jsonResponse([
    'success' => $configured,
    'client_id' => $configured ? GOOGLE_CLIENT_ID : null,
    'message' => $configured ? null : 'Google Client ID is not configured.'
], $configured ? 200 : 503);
