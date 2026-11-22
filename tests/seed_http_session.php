<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli' || count($argv) < 4 || count($argv) > 5) {
    exit(1);
}

$idleSeconds = isset($argv[4]) ? filter_var($argv[4], FILTER_VALIDATE_INT) : 0;
if ($idleSeconds === false || $idleSeconds < 0 || $idleSeconds > 86400) {
    exit(1);
}

session_save_path($argv[1]);
session_name('ICTRAXSESSID');
session_id($argv[2]);
if (!session_start()) {
    exit(1);
}

$now = time();
$_SESSION = [
    'user_id' => 1,
    'username' => 'admin.tech',
    'email' => 'ictstest2026@mls.ceu.edu.ph',
    'role' => 'admin',
    'name' => 'ICTRAX Administrator',
    'faculty_id' => null,
    'department' => null,
    'title' => 'ICT Laboratory Administrator',
    'initials' => 'IA',
    'google_sub' => '107250578220204712402',
    '_created_at' => $now,
    '_last_activity' => $now - $idleSeconds,
    '_regenerated_at' => $now,
    '_user_agent_hash' => hash('sha256', $argv[3]),
    'csrf_token' => str_repeat('b', 64),
];
session_write_close();
