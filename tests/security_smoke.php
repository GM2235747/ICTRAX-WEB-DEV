<?php
declare(strict_types=1);

/**
 * ICTRAX ISO/IEC 25010 security/CIA regression smoke tests.
 *
 * Static checks always run. Set ICTRAX_TEST_BASE_URL to also verify the live
 * Apache responses, for example http://localhost/ICTRAX_WEBSITE.
 */

$root = dirname(__DIR__);
$passed = 0;
$failed = [];
$skipped = [];

function result(bool $condition, string $description): void
{
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "[PASS] {$description}\n";
        return;
    }

    $failed[] = $description;
    echo "[FAIL] {$description}\n";
}

function skipCheck(string $description): void
{
    global $skipped;
    $skipped[] = $description;
    echo "[SKIP] {$description}\n";
}

function source(string $path): string
{
    $contents = @file_get_contents($path);
    return is_string($contents) ? $contents : '';
}

function includesAll(string $haystack, array $needles): bool
{
    foreach ($needles as $needle) {
        if (strpos($haystack, $needle) === false) {
            return false;
        }
    }
    return true;
}

function headerValue(array $headers, string $name): string
{
    return (string)($headers[strtolower($name)] ?? '');
}

/** Return duplicate named parameters found in directly declared PDO prepare calls. */
function duplicatePreparedParameters(string $phpSource): array
{
    $tokens = token_get_all($phpSource);
    $duplicates = [];

    for ($index = 0, $count = count($tokens); $index < $count; $index++) {
        $token = $tokens[$index];
        if (!is_array($token) || $token[0] !== T_STRING || strtolower($token[1]) !== 'prepare') {
            continue;
        }

        $cursor = $index + 1;
        while ($cursor < $count && is_array($tokens[$cursor]) && $tokens[$cursor][0] === T_WHITESPACE) {
            $cursor++;
        }
        if (($tokens[$cursor] ?? null) !== '(') {
            continue;
        }

        $cursor++;
        $sql = '';
        $isDirectString = false;
        $validExpression = true;
        while ($cursor < $count && ($tokens[$cursor] ?? null) !== ')') {
            $part = $tokens[$cursor];
            if (is_array($part) && $part[0] === T_CONSTANT_ENCAPSED_STRING) {
                $literal = $part[1];
                $quote = $literal[0];
                $body = substr($literal, 1, -1);
                $sql .= $quote === "'"
                    ? str_replace(["\\\\", "\\'"], ["\\", "'"], $body)
                    : stripcslashes($body);
                $isDirectString = true;
            } elseif ((is_array($part) && $part[0] === T_WHITESPACE) || $part === '.') {
                // Direct SQL strings may be split over several concatenated literals.
            } else {
                $validExpression = false;
                break;
            }
            $cursor++;
        }

        if (!$isDirectString || !$validExpression) {
            continue;
        }

        preg_match_all('/(?<!:):[A-Za-z_][A-Za-z0-9_]*/', $sql, $matches);
        $counts = array_count_values($matches[0] ?? []);
        foreach ($counts as $parameter => $occurrences) {
            if ($occurrences > 1) {
                $duplicates[] = $parameter;
            }
        }
    }

    return array_values(array_unique($duplicates));
}

/** @return array{status:int,headers:array<string,string>,body:string,error:string} */
function httpRequest(string $url, string $method = 'GET', array $headers = [], ?string $body = null): array
{
    if (!function_exists('curl_init')) {
        return ['status' => 0, 'headers' => [], 'body' => '', 'error' => 'PHP cURL is unavailable'];
    }

    $handle = curl_init($url);
    curl_setopt_array($handle, [
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($body !== null) {
        curl_setopt($handle, CURLOPT_POSTFIELDS, $body);
    }

    $raw = curl_exec($handle);
    $error = curl_error($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $headerSize = (int)curl_getinfo($handle, CURLINFO_HEADER_SIZE);
    curl_close($handle);

    if (!is_string($raw)) {
        return ['status' => $status, 'headers' => [], 'body' => '', 'error' => $error ?: 'HTTP request failed'];
    }

    $headerBlock = substr($raw, 0, $headerSize);
    $responseBody = substr($raw, $headerSize);
    $parsedHeaders = [];
    foreach (preg_split('/\r?\n/', trim($headerBlock)) ?: [] as $line) {
        if (strpos($line, ':') === false) {
            continue;
        }
        [$name, $value] = explode(':', $line, 2);
        $parsedHeaders[strtolower(trim($name))] = trim($value);
    }

    return ['status' => $status, 'headers' => $parsedHeaders, 'body' => $responseBody, 'error' => $error];
}

echo "ICTRAX ISO/IEC 25010 security and CIA smoke tests\n\n";

$apiFiles = glob($root . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . '*.php') ?: [];
foreach ($apiFiles as $file) {
    $output = [];
    $status = 0;
    exec(escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($file) . ' 2>&1', $output, $status);
    result($status === 0, 'PHP syntax: api/' . basename($file));
}

$config = source($root . '/api/config.php');
$googleAuthConfig = source($root . '/api/google-auth-config.php');
$script = source($root . '/script.js');
$htaccess = source($root . '/.htaccess');
$incidents = source($root . '/api/incidents.php');
$repairFormStorage = source($root . '/api/incident-repair-form.php');
$repairFormMigration = source($root . '/api/migrate_request_repair_storage.php');
$restoreEquipment = source($root . '/api/restore_equipment.php');
$securityBaseline = source($root . '/SECURITY.md');
$apacheDeployment = source($root . '/deploy/apache-security.conf.example');
$archiveMigration = source($root . '/api/migrate_archive_integrity.sql');
$warrantyMigration = source($root . '/api/migrate_equipment_warranty.sql');
$photoMigration = source($root . '/api/migrate_equipment_photos.sql');
$repairVerificationMigration = source($root . '/api/migrate_repair_verification.sql');
$googleAuthMigration = source($root . '/api/migrate_google_auth.sql');

result(strpos($config, "Access-Control-Allow-Origin: *") === false, 'API does not emit wildcard CORS');
result(includesAll($config, ['session.use_strict_mode', 'httponly', "'samesite' => 'Strict'", 'session_regenerate_id(true)']), 'Session fixation and cookie protections are configured');
result(includesAll($config, ['function applicationCookiePath', "'path' => applicationCookiePath()"]), 'Session cookie is scoped to the ICTRAX deployment path');
result(includesAll($config, ['ICTRAX_SESSION_IDLE_TIMEOUT', 'ICTRAX_SESSION_ABSOLUTE_TIMEOUT']), 'Idle and absolute server session timeouts are configured');
result(
    includesAll($config, ['const ICTRAX_SESSION_IDLE_TIMEOUT = 600;', '$now - $lastActivity >= ICTRAX_SESSION_IDLE_TIMEOUT', "'idle_timeout'"])
    && strpos(source($root . '/api/session.php'), "'idle_timeout_seconds' => ICTRAX_SESSION_IDLE_TIMEOUT") !== false,
    'Server enforces and advertises the 10-minute inactivity timeout'
);
result(includesAll($config, ['ICTRAX_PASSIVE_SESSION_REQUEST', '$passiveSessionRequest ? $lastActivity : $now']), 'Background notification polling does not bypass the idle timeout');
result(includesAll($config, ['function requireAuthenticatedUser', 'function requireCsrfToken', 'hash_equals']), 'Central authentication and CSRF checks exist');
result(includesAll($config, ['google-auth-config.php', 'isGoogleEmailAuthorizedForRole']), 'Active sessions are rechecked against the Google role/email policy');
result(
    includesAll($googleAuthConfig, ['GOOGLE_FACULTY_DOMAINS', 'mls.ceu.edu.ph,ceu.edu.ph', 'ICTRAX_GOOGLE_FACULTY_DOMAINS']),
    'Faculty Google policy supports both CEU email domains'
);
result(
    includesAll($googleAuthMigration, ['information_schema.COLUMNS', 'information_schema.STATISTICS', 'PREPARE ictrax_migration_statement']),
    'Google-auth schema migration is safe to import repeatedly'
);
result(includesAll($config, ['PDO::ATTR_EMULATE_PREPARES => false', 'PDO::ATTR_TIMEOUT']), 'PDO uses native prepares and a bounded connection timeout');
result(strpos($config, "'error' => \$e->getMessage()") === false, 'Database exceptions are not returned to clients');

$authenticatedEndpoints = [
    'archive_equipment.php', 'archived_equipment.php', 'audit.php', 'catalog.php',
    'equipment-photo.php', 'equipment-photos.php', 'equipment.php', 'incident-notifications.php', 'incidents.php', 'list-admins.php', 'restore_equipment.php',
    'service_cards.php',
];
foreach ($authenticatedEndpoints as $endpoint) {
    $endpointSource = source($root . '/api/' . $endpoint);
    result(strpos($endpointSource, 'requireAuthenticatedUser') !== false, "Authentication enforced: api/{$endpoint}");
}

$csrfEndpoints = [
    'archive_equipment.php', 'catalog.php', 'equipment-photos.php', 'equipment.php', 'incidents.php',
    'logout.php', 'restore_equipment.php', 'service_cards.php',
];
foreach ($csrfEndpoints as $endpoint) {
    $endpointSource = source($root . '/api/' . $endpoint);
    result(strpos($endpointSource, 'requireCsrfToken') !== false, "CSRF enforced: api/{$endpoint}");
}

$nativePrepareEndpoints = [
    'equipment-photos.php', 'equipment.php', 'incidents.php', 'restore_equipment.php', 'service_cards.php',
];
foreach ($nativePrepareEndpoints as $endpoint) {
    result(
        duplicatePreparedParameters(source($root . '/api/' . $endpoint)) === [],
        "Native prepared statements use unique placeholders: api/{$endpoint}"
    );
}

result(includesAll($script, ['SESSION_ENDPOINT', 'requestServerSession', 'navigationWasReload', 'terminateSessionAndReturnToLogin']), 'Frontend uses the server session and reload logout flow');
result(
    includesAll($script, [
        'SESSION_IDLE_TIMEOUT_DEFAULT_MS = 10 * 60 * 1000',
        'SESSION_ACTIVITY_EVENTS',
        'startSessionInactivityMonitor()',
        'expireInactiveSession()',
        "payload.reason==='idle_timeout'",
        'User logged-out, the user is inactive for too long',
        '{dismissible:false}',
        'SESSION_TIMEOUT_REDIRECT_DELAY_MS',
    ]),
    'Frontend shows a locked inactivity modal, ends the session, and returns to login'
);
result(strpos($script, 'remote API not available, using local demo data') === false, 'Protected API failures do not fall back to local demo records');
result(includesAll($script, ["credentials:'same-origin'", "cache:'no-store'", "X-CSRF-Token"]), 'Frontend sends same-origin credentials and CSRF tokens without caching');
result(includesAll($script, ['pageshow', 'event.persisted', 'AUTH_LOGOUT_EVENT_KEY']), 'Back/forward cache and cross-tab logout are handled');
result(includesAll($script, ['sessionStorage.setItem(SERVICE_CARD_STORAGE_KEY', 'localStorage.removeItem(SERVICE_CARD_STORAGE_KEY)']), 'Service-card drafts are tab-scoped and legacy persistent copies are purged');
result(includesAll($script, ['function csvCell', '[=+\\-@]', "text=`'"]), 'CSV cells that resemble formulas are neutralized');
result(includesAll($script, ['generateServiceCardV12', "esc(item.name || '')", 'openFacultyReadOnlyServiceCard', "esc(equipment.name || '')"]), 'Legacy service-card renderers encode database-derived text');
result(includesAll($script, ['RISK_MODEL', "version:'2.1'", 'riskRecommendedAction', 'exportRiskCSV']), 'Risk analytics uses the documented weighted model and maintenance-priority report');
result(strpos(source($root . '/api/session.php'), "'server_time' => gmdate(DATE_ATOM)") !== false, 'Risk calculations use an authenticated server time reference');

result(includesAll($incidents, ["equipment['status'] === 'Condemned'", "previous['equipment_status'] !== 'Condemned'"]), 'Condemned equipment integrity is enforced during incident workflows');
result(includesAll($incidents, ['beginTransaction', 'rollBack', 'commit']), 'Incident writes use database transactions');
result(
    includesAll($incidents, ['incident-repair-form.php', 'repair_form_json', 'incidentRepairSummary($repairForm)'])
    && includesAll($repairFormStorage, ['incidentRepairStoredFormIsValid', 'JSON_THROW_ON_ERROR', 'incidentRepairFormFromRow']),
    'Request-for-repair submissions use validated structured database storage'
);
result(
    includesAll($repairFormMigration, ["PHP_SAPI !== 'cli'", "in_array('--apply'", 'beginTransaction', 'rollBack', "writeAudit(\$pdo, 'migrate'"])
    && includesAll($restoreEquipment, ['repair_form_json', 'incidentRepairStoredFormIsValid']),
    'Request-for-repair migration and archive restore preserve CIA integrity controls'
);
result(includesAll($securityBaseline, ['ISO/IEC 25010:2023', 'Confidentiality', 'Integrity', 'Availability', 'Performance efficiency']), 'ISO/IEC 25010 and CIA evidence is documented');
result(includesAll($apacheDeployment, ['TraceEnable Off', 'ServerTokens Prod', 'ServerSignature Off']), 'Required Apache server-scope hardening is supplied');
result(includesAll($archiveMigration, ['incidents_json', 'idx_equipment_archive_code', 'idx_equipment_archive_date']), 'Archive integrity migration is supplied');
result(includesAll($warrantyMigration, ['warranty_provider', 'warranty_expiration', 'idx_equipment_warranty_expiration']), 'Equipment warranty migration is supplied');
result(includesAll($photoMigration, ['equipment_photos', 'stored_name', 'idx_equipment_photos_equipment']), 'Equipment photo migration is supplied');
result(
    includesAll($repairVerificationMigration, ['repair_verification_status', 'Awaiting Verification', 'idx_incidents_repair_verification']),
    'Repair submitter-verification migration is supplied'
);

result(stripos($htaccess, 'Options -Indexes') !== false, 'Directory listing is disabled');
result(includesAll(strtolower($htaccess), ['content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy']), 'Browser security headers are configured');
result((bool)preg_match('/sql|backup|config/i', $htaccess), 'Sensitive deployment artifacts are denied by the web server');
result(stripos($htaccess, 'uploads') !== false, 'Uploaded equipment photos cannot bypass the authenticated photo endpoint');
result(
    !file_exists($root . '/superadmin-login.html')
    && !file_exists($root . '/api/superadmin-login.php')
    && includesAll($htaccess, ['superadmin(?:-[^/]+)?\.html', 'superadmin-login|admin-management']),
    'Legacy superadmin login is removed and its remaining surface is denied'
);

$baseUrl = rtrim((string)getenv('ICTRAX_TEST_BASE_URL'), '/');
if ($baseUrl === '') {
    skipCheck('Live HTTP checks (set ICTRAX_TEST_BASE_URL to enable)');
} elseif (!function_exists('curl_init')) {
    skipCheck('Live HTTP checks (PHP cURL extension is unavailable)');
} else {
    echo "\nLive target: {$baseUrl}\n";

    $index = httpRequest($baseUrl . '/index.html');
    result($index['status'] === 200, 'Login page is reachable');
    result(stripos(headerValue($index['headers'], 'Cache-Control'), 'no-store') !== false, 'HTML responses are not cached');
    result(strtolower(headerValue($index['headers'], 'X-Content-Type-Options')) === 'nosniff', 'X-Content-Type-Options is active');
    result(strtoupper(headerValue($index['headers'], 'X-Frame-Options')) === 'DENY', 'Clickjacking protection is active');
    $csp = headerValue($index['headers'], 'Content-Security-Policy');
    result(stripos($csp, "default-src 'self'") !== false && stripos($csp, "frame-ancestors 'none'") !== false, 'Content Security Policy is active');

    $session = httpRequest($baseUrl . '/api/session.php');
    result($session['status'] === 401, 'Anonymous session status fails closed');
    result(stripos(headerValue($session['headers'], 'Cache-Control'), 'no-store') !== false, 'API responses are not cached');
    $sessionCookie = headerValue($session['headers'], 'Set-Cookie');
    $expectedCookiePath = rtrim((string)(parse_url($baseUrl, PHP_URL_PATH) ?: ''), '/') . '/';
    if ($expectedCookiePath === '') {
        $expectedCookiePath = '/';
    }
    result(
        stripos($sessionCookie, 'ICTRAXSESSID=') !== false
        && stripos($sessionCookie, 'Path=' . $expectedCookiePath) !== false
        && stripos($sessionCookie, 'HttpOnly') !== false
        && stripos($sessionCookie, 'SameSite=Strict') !== false,
        'Session cookie is HttpOnly, SameSite=Strict, and application-scoped'
    );

    foreach (['equipment.php', 'audit.php', 'archived_equipment.php', 'incident-notifications.php'] as $endpoint) {
        $response = httpRequest($baseUrl . '/api/' . $endpoint);
        result($response['status'] === 401, "Anonymous API access denied: {$endpoint}");
    }

    $sql = httpRequest($baseUrl . '/api/schema.sql');
    result(in_array($sql['status'], [403, 404], true), 'SQL schema is not web-accessible');
    $notes = httpRequest($baseUrl . '/README.txt');
    result(in_array($notes['status'], [403, 404], true), 'Internal text documentation is not web-accessible');
    $testScript = httpRequest($baseUrl . '/tests/security_smoke.php');
    result(in_array($testScript['status'], [403, 404], true), 'Test scripts are not web-accessible');
    $deploymentConfig = httpRequest($baseUrl . '/deploy/apache-security.conf.example');
    result(in_array($deploymentConfig['status'], [403, 404], true), 'Deployment configuration is not web-accessible');
    $directConfig = httpRequest($baseUrl . '/api/config.php');
    result(in_array($directConfig['status'], [403, 404], true), 'Shared API configuration is not directly accessible');
    $repairStorageInclude = httpRequest($baseUrl . '/api/incident-repair-form.php');
    result(in_array($repairStorageInclude['status'], [403, 404], true), 'Repair-form storage include is not directly accessible');
    $repairStorageMigration = httpRequest($baseUrl . '/api/migrate_request_repair_storage.php');
    result(in_array($repairStorageMigration['status'], [403, 404], true), 'Repair-form CLI migration is not web-accessible');
    foreach ([
        '/superadmin-login.html',
        '/superadmin-dashboard.html',
        '/superadmin-users.html',
        '/api/superadmin-login.php',
        '/api/admin-management.php',
    ] as $legacySuperadminPath) {
        $legacySuperadmin = httpRequest($baseUrl . $legacySuperadminPath);
        result(
            in_array($legacySuperadmin['status'], [403, 404], true),
            "Legacy superadmin access denied: {$legacySuperadminPath}"
        );
    }
    $wrongLogoutMethod = httpRequest($baseUrl . '/api/logout.php');
    result($wrongLogoutMethod['status'] === 405, 'Logout rejects non-POST requests');

    $crossSite = httpRequest(
        $baseUrl . '/api/logout.php',
        'POST',
        ['Origin: https://attacker.invalid', 'Sec-Fetch-Site: cross-site', 'Content-Type: application/json'],
        '{}'
    );
    result($crossSite['status'] === 403, 'Cross-site state-changing request is rejected');

    $trace = httpRequest($baseUrl . '/index.html', 'TRACE');
    result(in_array($trace['status'], [403, 405], true), 'TRACE is disabled');

    $combinedBodies = $session['body'] . $sql['body'] . $crossSite['body'];
    result(!preg_match('/PDOException|Stack trace|SQLSTATE\[/i', $combinedBodies), 'Live error responses do not expose stack or SQL details');
}

echo "\n{$passed} passed, " . count($failed) . ' failed, ' . count($skipped) . " skipped.\n";
if ($failed) {
    echo "Failures:\n - " . implode("\n - ", $failed) . "\n";
    exit(1);
}

exit(0);
