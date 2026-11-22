<?php
require __DIR__ . '/config.php';
requireRequestMethod('POST');
jsonResponse([
    'success' => false,
    'message' => 'Password registration is disabled. Faculty should sign in with a verified @mls.ceu.edu.ph or @ceu.edu.ph Google account; ICTRAX creates the faculty profile on first sign-in.'
], 410);
