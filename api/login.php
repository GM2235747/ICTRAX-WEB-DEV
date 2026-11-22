<?php
require __DIR__ . '/config.php';
requireRequestMethod('POST');
jsonResponse([
    'success' => false,
    'message' => 'Password login has been replaced by Google authorization in this ICTRAX prototype.'
], 410);
