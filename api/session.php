<?php
require __DIR__ . '/config.php';

requireRequestMethod('GET');
requireAuthenticatedUser();

jsonResponse([
    'success' => true,
    'authenticated' => true,
    'csrf_token' => currentCsrfToken(),
    'server_time' => gmdate(DATE_ATOM),
    'idle_timeout_seconds' => ICTRAX_SESSION_IDLE_TIMEOUT,
    'user' => currentSessionUser(),
]);
