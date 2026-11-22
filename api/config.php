<?php
/**
 * Shared ICTRAX API bootstrap.
 *
 * Security controls here are intentionally centralized so every endpoint gets
 * the same session, request-integrity, disclosure, and database safeguards.
 */

const ICTRAX_SESSION_IDLE_TIMEOUT = 600;       // 10 minutes
const ICTRAX_SESSION_ABSOLUTE_TIMEOUT = 28800; // 8 hours
const ICTRAX_SESSION_REGENERATE_INTERVAL = 300;
const ICTRAX_MAX_JSON_BODY_BYTES = 1048576;    // 1 MiB

/** Return a JSON response and stop execution. */
function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        http_response_code(500);
        $json = '{"success":false,"message":"Unable to encode the response."}';
    }

    echo $json;
    exit;
}

/** Detect HTTPS without trusting client-controlled forwarding headers. */
function isHttpsRequest(): bool
{
    return (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
        || (int)($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

/** Scope the session cookie to this deployed application by default. */
function applicationCookiePath(): string
{
    $configured = trim((string)(getenv('ICTRAX_SESSION_COOKIE_PATH') ?: ''));
    if ($configured !== '') {
        if ($configured[0] !== '/' || preg_match('/[\x00-\x20;,]/', $configured)) {
            jsonResponse(['success' => false, 'message' => 'The service is not securely configured.'], 503);
        }
        return $configured === '/' ? '/' : rtrim($configured, '/') . '/';
    }

    $scriptName = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $apiMarker = '/api/';
    $apiPosition = stripos($scriptName, $apiMarker);
    if ($apiPosition === false) {
        return '/';
    }

    $path = substr($scriptName, 0, $apiPosition + 1);
    return $path === '' ? '/' : $path;
}

/**
 * Compare an Origin header with the host that received this request.
 * Requests without Origin are handled by CSRF tokens on authenticated writes.
 */
function isSameOrigin(string $origin): bool
{
    if ($origin === '' || strtolower($origin) === 'null') {
        return false;
    }

    $originParts = parse_url($origin);
    $requestHost = (string)($_SERVER['HTTP_HOST'] ?? '');
    $hostParts = parse_url((isHttpsRequest() ? 'https://' : 'http://') . $requestHost);
    if (!is_array($originParts) || !is_array($hostParts)) {
        return false;
    }

    $originScheme = strtolower((string)($originParts['scheme'] ?? ''));
    $originHost = strtolower(rtrim((string)($originParts['host'] ?? ''), '.'));
    $requestScheme = isHttpsRequest() ? 'https' : 'http';
    $requestHostName = strtolower(rtrim((string)($hostParts['host'] ?? ''), '.'));
    if ($originScheme !== $requestScheme || $originHost === '' || $originHost !== $requestHostName) {
        return false;
    }

    $originPort = (int)($originParts['port'] ?? ($originScheme === 'https' ? 443 : 80));
    $requestPort = (int)($hostParts['port'] ?? ($requestScheme === 'https' ? 443 : 80));

    return $originPort === $requestPort;
}

/** Reject browser cross-site writes before they reach endpoint logic. */
function enforceSameOriginWrite(): void
{
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return;
    }

    $fetchSite = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($fetchSite === 'cross-site') {
        jsonResponse(['success' => false, 'message' => 'Cross-site requests are not allowed.'], 403);
    }

    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '' && !isSameOrigin($origin)) {
        jsonResponse(['success' => false, 'message' => 'Request origin is not allowed.'], 403);
    }
}

/** Require one or more HTTP methods and advertise the allowed set on failure. */
function requireRequestMethod($allowedMethods): string
{
    $allowed = is_array($allowedMethods) ? $allowedMethods : [$allowedMethods];
    $allowed = array_values(array_unique(array_map(static function ($method): string {
        return strtoupper(trim((string)$method));
    }, $allowed)));
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

    if (!$allowed || !in_array($method, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed ?: ['GET']));
        jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
    }

    return $method;
}

/** Decode a size-limited JSON object and fail closed on malformed input. */
function readJsonBody(int $maxBytes = ICTRAX_MAX_JSON_BODY_BYTES): array
{
    $contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > $maxBytes) {
        jsonResponse(['success' => false, 'message' => 'Request body is too large.'], 413);
    }

    $contentType = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    $isJsonContent = $contentType === 'application/json' || substr($contentType, -5) === '+json';
    if ($contentType !== '' && !$isJsonContent) {
        jsonResponse(['success' => false, 'message' => 'Content-Type must be application/json.'], 415);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false) {
        jsonResponse(['success' => false, 'message' => 'Unable to read the request body.'], 400);
    }
    if (strlen($raw) > $maxBytes) {
        jsonResponse(['success' => false, 'message' => 'Request body is too large.'], 413);
    }
    if (trim($raw) === '') {
        return [];
    }
    if (!$isJsonContent) {
        jsonResponse(['success' => false, 'message' => 'Content-Type must be application/json.'], 415);
    }
    if (substr(ltrim($raw), 0, 1) !== '{') {
        jsonResponse(['success' => false, 'message' => 'Request body must be a JSON object.'], 400);
    }

    try {
        $decoded = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        jsonResponse(['success' => false, 'message' => 'Request body contains invalid JSON.'], 400);
    }

    if (!is_array($decoded)) {
        jsonResponse(['success' => false, 'message' => 'Request body must be a JSON object.'], 400);
    }

    return $decoded;
}

/** Expire the current session cookie using exactly the attributes it was issued with. */
function expireSessionCookie(): void
{
    if (!ini_get('session.use_cookies')) {
        return;
    }

    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'] ?: '/',
        'domain' => $params['domain'] ?? '',
        'secure' => (bool)($params['secure'] ?? false),
        'httponly' => true,
        'samesite' => $params['samesite'] ?? 'Strict',
    ]);
}

/** Fully terminate the active server-side session and its browser cookie. */
function destroyCurrentSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION = [];
        expireSessionCookie();
        session_destroy();
    }
}

/**
 * Remove authenticated state while keeping a fresh anonymous session available
 * for a subsequent login request in the same browser.
 */
function clearAuthenticationSession(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }

    $_SESSION = [];
    session_regenerate_id(true);
    $now = time();
    $_SESSION['_created_at'] = $now;
    $_SESSION['_last_activity'] = $now;
    $_SESSION['_regenerated_at'] = $now;
    $_SESSION['_user_agent_hash'] = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function currentUserId(): ?int
{
    $id = filter_var($_SESSION['user_id'] ?? null, FILTER_VALIDATE_INT);
    return $id && $id > 0 ? (int)$id : null;
}

/** Return (and lazily create) the CSRF secret bound to this session. */
function currentCsrfToken(): string
{
    $token = (string)($_SESSION['csrf_token'] ?? '');
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) {
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
    }
    return $token;
}

/** Require an authenticated user, optionally constrained to specific roles. */
function requireAuthenticatedUser(array $allowedRoles = []): int
{
    $userId = currentUserId();
    if ($userId === null) {
        jsonResponse([
            'success' => false,
            'authenticated' => false,
            'reason' => (string)($_SESSION['_authentication_end_reason'] ?? 'authentication_required'),
            'message' => 'Authentication required.',
        ], 401);
    }

    $role = (string)($_SESSION['role'] ?? '');
    if ($allowedRoles && !in_array($role, $allowedRoles, true)) {
        jsonResponse(['success' => false, 'message' => 'You do not have permission to perform this action.'], 403);
    }

    return $userId;
}

/** Validate an authenticated write against the token sent by the frontend. */
function requireCsrfToken(?array $body = null): void
{
    requireAuthenticatedUser();
    $provided = trim((string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    if ($provided === '' && is_array($body)) {
        $provided = trim((string)($body['csrf_token'] ?? ''));
    }
    if ($provided === '' && isset($_POST['csrf_token'])) {
        $provided = trim((string)$_POST['csrf_token']);
    }

    $expected = currentCsrfToken();
    if (strlen($provided) !== strlen($expected) || !hash_equals($expected, $provided)) {
        jsonResponse(['success' => false, 'message' => 'Request verification failed. Refresh the page and try again.'], 403);
    }
}

/** Create a clean authenticated session after identity verification. */
function establishAuthenticatedSession(array $user, string $email, string $googleSubject): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        throw new RuntimeException('A secure session could not be established.');
    }

    $_SESSION = [];
    if (!session_regenerate_id(true)) {
        throw new RuntimeException('A secure session could not be established.');
    }

    $now = time();
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = (string)$user['username'];
    $_SESSION['email'] = $email;
    $_SESSION['role'] = (string)$user['role'];
    $_SESSION['name'] = (string)$user['full_name'];
    $_SESSION['faculty_id'] = $user['faculty_id'] ?? null;
    $_SESSION['department'] = $user['department'] ?? null;
    $_SESSION['title'] = $user['title'] ?? null;
    $_SESSION['initials'] = $user['initials'] ?? null;
    $_SESSION['google_sub'] = $googleSubject;
    $_SESSION['_created_at'] = $now;
    $_SESSION['_last_activity'] = $now;
    $_SESSION['_regenerated_at'] = $now;
    $_SESSION['_user_agent_hash'] = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    return $_SESSION['csrf_token'];
}

/** Return the safe user fields stored in the authoritative server session. */
function currentSessionUser(): ?array
{
    $userId = currentUserId();
    if ($userId === null) {
        return null;
    }

    return [
        'id' => $userId,
        'username' => (string)($_SESSION['username'] ?? ''),
        'email' => (string)($_SESSION['email'] ?? ''),
        'role' => (string)($_SESSION['role'] ?? ''),
        'name' => (string)($_SESSION['name'] ?? ''),
        'faculty_id' => $_SESSION['faculty_id'] ?? null,
        'department' => $_SESSION['department'] ?? null,
        'title' => $_SESSION['title'] ?? null,
        'initials' => $_SESSION['initials'] ?? null,
    ];
}

/** Pseudonymous client key used only for abuse throttling/audit correlation. */
function authenticationClientKey(): string
{
    $address = trim((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $salt = (string)(getenv('ICTRAX_AUDIT_SALT') ?: 'ictrax-local-audit-key');
    return hash_hmac('sha256', $address, $salt);
}

/** Enforce a database-backed login-attempt ceiling without storing credentials. */
function enforceAuthenticationThrottle(PDO $pdo, int $limit = 30, int $windowMinutes = 15): void
{
    $windowMinutes = max(1, min($windowMinutes, 60));
    $now = time();
    $sessionFailures = array_values(array_filter(
        is_array($_SESSION['_auth_failures'] ?? null) ? $_SESSION['_auth_failures'] : [],
        static function ($timestamp) use ($now, $windowMinutes): bool {
            return is_int($timestamp) && $timestamp >= $now - ($windowMinutes * 60);
        }
    ));
    $_SESSION['_auth_failures'] = array_slice($sessionFailures, -5);
    if (count($sessionFailures) >= 5) {
        header('Retry-After: ' . ($windowMinutes * 60));
        jsonResponse([
            'success' => false,
            'message' => 'Too many sign-in attempts. Please wait before trying again.',
        ], 429);
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM audit_logs '
            . "WHERE action = 'login_denied' AND entity_type = 'authentication' "
            . 'AND entity_id = :client_key '
            . "AND created_at >= (CURRENT_TIMESTAMP - INTERVAL {$windowMinutes} MINUTE)"
        );
        $stmt->execute([':client_key' => authenticationClientKey()]);
        $attempts = (int)$stmt->fetchColumn();
    } catch (Throwable $e) {
        // Authentication should remain available if only audit storage is
        // temporarily unavailable; failed writes are reported to the server log.
        error_log('ICTRAX authentication throttle lookup failed.');
        return;
    }

    if ($attempts >= $limit) {
        header('Retry-After: ' . ($windowMinutes * 60));
        jsonResponse([
            'success' => false,
            'message' => 'Too many sign-in attempts. Please wait before trying again.',
        ], 429);
    }
}

/** Record a denied login without retaining the submitted token or raw email. */
function recordAuthenticationFailure(PDO $pdo, string $reason, string $principal = ''): void
{
    $failures = is_array($_SESSION['_auth_failures'] ?? null) ? $_SESSION['_auth_failures'] : [];
    $failures[] = time();
    $_SESSION['_auth_failures'] = array_slice($failures, -5);

    $details = [
        'reason' => substr(preg_replace('/[^a-z0-9_.-]/i', '', $reason) ?: 'rejected', 0, 40),
        'principal_hash' => $principal !== '' ? hash('sha256', strtolower(trim($principal))) : null,
    ];

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) "
            . "VALUES (NULL, 'login_denied', 'authentication', :client_key, :details)"
        );
        $stmt->execute([
            ':client_key' => authenticationClientKey(),
            ':details' => json_encode($details, JSON_THROW_ON_ERROR),
        ]);
    } catch (Throwable $e) {
        error_log('ICTRAX authentication audit write failed.');
    }
}

/** Store a normal application audit event. */
function writeAudit(PDO $pdo, string $action, string $entityType, string $entityId, array $details = []): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) '
        . 'VALUES (:user_id, :action, :entity_type, :entity_id, :details)'
    );
    $stmt->execute([
        ':user_id' => currentUserId(),
        ':action' => substr($action, 0, 30),
        ':entity_type' => substr($entityType, 0, 30),
        ':entity_id' => substr($entityId, 0, 100),
        ':details' => $details ? json_encode($details, JSON_THROW_ON_ERROR) : null,
    ]);
}

// Do not expose this include as a directly browsable endpoint.
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string)$_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    jsonResponse(['success' => false, 'message' => 'Not found.'], 404);
}

header_remove('X-Powered-By');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()');

if (isHttpsRequest()) {
    header('Strict-Transport-Security: max-age=31536000');
}

// This application is same-origin. Reflect only the exact current origin for a
// legitimate same-origin OPTIONS request; never emit a wildcard CORS policy.
if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '' && !isSameOrigin($origin)) {
        jsonResponse(['success' => false, 'message' => 'Request origin is not allowed.'], 403);
    }
    if ($origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Max-Age: 600');
    http_response_code(204);
    exit;
}

enforceSameOriginWrite();

if ((!defined('ICTRAX_SKIP_SESSION') || ICTRAX_SKIP_SESSION !== true) && session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Strict');
    ini_set('session.gc_maxlifetime', (string)ICTRAX_SESSION_ABSOLUTE_TIMEOUT);
    session_name('ICTRAXSESSID');
    session_cache_limiter('');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => applicationCookiePath(),
        'domain' => '',
        'secure' => isHttpsRequest(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);

    if (!session_start()) {
        jsonResponse(['success' => false, 'message' => 'Unable to establish a secure session.'], 500);
    }
}

if (session_status() === PHP_SESSION_ACTIVE) {
    $now = time();
    $createdAt = (int)($_SESSION['_created_at'] ?? $now);
    $lastActivity = (int)($_SESSION['_last_activity'] ?? $now);
    $regeneratedAt = (int)($_SESSION['_regenerated_at'] ?? $now);
    $expectedAgentHash = (string)($_SESSION['_user_agent_hash'] ?? '');
    $currentAgentHash = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
    $passiveSessionRequest = defined('ICTRAX_PASSIVE_SESSION_REQUEST')
        && ICTRAX_PASSIVE_SESSION_REQUEST === true;

    $idleTimeoutReached = currentUserId() !== null
        && $now - $lastActivity >= ICTRAX_SESSION_IDLE_TIMEOUT;
    $absoluteTimeoutReached = currentUserId() !== null
        && $now - $createdAt > ICTRAX_SESSION_ABSOLUTE_TIMEOUT;
    $userAgentChanged = currentUserId() !== null
        && $expectedAgentHash !== ''
        && !hash_equals($expectedAgentHash, $currentAgentHash);

    if ($idleTimeoutReached || $absoluteTimeoutReached || $userAgentChanged) {
        $authenticationEndReason = $idleTimeoutReached
            ? 'idle_timeout'
            : ($absoluteTimeoutReached ? 'absolute_timeout' : 'session_invalid');
        clearAuthenticationSession();
        $_SESSION['_authentication_end_reason'] = $authenticationEndReason;
        $now = time();
        $createdAt = $now;
        $lastActivity = $now;
        $regeneratedAt = $now;
    }

    $_SESSION['_created_at'] = $createdAt;
    $_SESSION['_last_activity'] = $passiveSessionRequest ? $lastActivity : $now;
    $_SESSION['_regenerated_at'] = $regeneratedAt;
    $_SESSION['_user_agent_hash'] = $currentAgentHash;
    currentCsrfToken();

    if (currentUserId() !== null && $now - $regeneratedAt >= ICTRAX_SESSION_REGENERATE_INTERVAL) {
        session_regenerate_id(true);
        $_SESSION['_regenerated_at'] = $now;
    }
}

// Environment variables are required for non-local deployments. The defaults
// keep the existing localhost XAMPP development setup working.
$host = trim((string)(getenv('ICTRAX_DB_HOST') ?: '127.0.0.1'));
$port = (int)(getenv('ICTRAX_DB_PORT') ?: 3306);
$db = trim((string)(getenv('ICTRAX_DB_NAME') ?: 'ictrax_db'));
$user = (string)(getenv('ICTRAX_DB_USER') ?: 'root');
$pass = (string)(getenv('ICTRAX_DB_PASSWORD') ?: '');
if ($port < 1 || $port > 65535) {
    $port = 3306;
}

$pdo = null;
if (!defined('ICTRAX_SKIP_DATABASE') || ICTRAX_SKIP_DATABASE !== true) {
    $applicationEnvironment = strtolower(trim((string)(getenv('ICTRAX_ENV') ?: 'development')));
    if ($applicationEnvironment === 'production') {
        $missingDatabaseSettings = [];
        foreach (['ICTRAX_DB_HOST', 'ICTRAX_DB_NAME', 'ICTRAX_DB_USER', 'ICTRAX_DB_PASSWORD', 'ICTRAX_AUDIT_SALT'] as $setting) {
            $value = getenv($setting);
            if ($value === false || $value === '') {
                $missingDatabaseSettings[] = $setting;
            }
        }
        if ($missingDatabaseSettings) {
            error_log('ICTRAX production security configuration is incomplete: ' . implode(', ', $missingDatabaseSettings));
            jsonResponse(['success' => false, 'message' => 'The service is not securely configured.'], 503);
        }
    }

    $pdoOptions = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
        PDO::ATTR_TIMEOUT => 5,
    ];

    // Production deployments can require an authenticated TLS channel by
    // setting ICTRAX_DB_SSL_CA to their database CA certificate path.
    $databaseSslCa = trim((string)(getenv('ICTRAX_DB_SSL_CA') ?: ''));
    if ($databaseSslCa !== '' && defined('PDO::MYSQL_ATTR_SSL_CA')) {
        $pdoOptions[PDO::MYSQL_ATTR_SSL_CA] = $databaseSslCa;
        if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
            $pdoOptions[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        }
    }

    try {
        $pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4",
            $user,
            $pass,
            $pdoOptions
        );
    } catch (PDOException $e) {
        $reference = bin2hex(random_bytes(6));
        error_log("ICTRAX database connection failed [{$reference}]: " . $e->getMessage());
        if (!defined('ICTRAX_ALLOW_DB_FAILURE') || ICTRAX_ALLOW_DB_FAILURE !== true) {
            jsonResponse([
                'success' => false,
                'message' => 'The service is temporarily unavailable.',
                'reference' => $reference,
            ], 503);
        }
    }
}

// Re-check the account on every authenticated request so deactivation, deletion,
// role changes, and Google-account relinking revoke existing sessions promptly.
if ($pdo instanceof PDO && ($authenticatedUserId = currentUserId()) !== null) {
    try {
        require_once __DIR__ . '/google-auth-config.php';
        $accountStmt = $pdo->prepare(
            'SELECT id, username, email, role, full_name, title, initials, faculty_id, department, google_sub '
            . 'FROM users WHERE id = :id AND active = 1 AND deleted_at IS NULL LIMIT 1'
        );
        $accountStmt->execute([':id' => $authenticatedUserId]);
        $account = $accountStmt->fetch();
        $sessionSubject = (string)($_SESSION['google_sub'] ?? '');
        $sessionRole = (string)($_SESSION['role'] ?? '');

        if (
            !$account
            || $sessionSubject === ''
            || !hash_equals((string)($account['google_sub'] ?? ''), $sessionSubject)
            || $sessionRole === ''
            || !hash_equals((string)$account['role'], $sessionRole)
            || !isGoogleEmailAuthorizedForRole((string)($account['email'] ?? ''), (string)($account['role'] ?? ''))
        ) {
            clearAuthenticationSession();
        } else {
            // Refresh authorization attributes from the database rather than
            // trusting values captured at an earlier login.
            $_SESSION['username'] = (string)$account['username'];
            $_SESSION['email'] = strtolower((string)$account['email']);
            $_SESSION['role'] = (string)$account['role'];
            $_SESSION['name'] = (string)$account['full_name'];
            $_SESSION['faculty_id'] = $account['faculty_id'];
            $_SESSION['department'] = $account['department'];
            $_SESSION['title'] = $account['title'];
            $_SESSION['initials'] = $account['initials'];
        }
    } catch (PDOException $e) {
        error_log('ICTRAX session revalidation failed: ' . $e->getMessage());
        clearAuthenticationSession();
        jsonResponse(['success' => false, 'message' => 'Unable to validate the active session.'], 503);
    }
}
