<?php
require __DIR__ . '/config.php';
require_once __DIR__ . '/google-auth-config.php';

requireRequestMethod('POST');

if (GOOGLE_CLIENT_ID === '' || strpos(GOOGLE_CLIENT_ID, 'PASTE_YOUR_') === 0) {
    jsonResponse([
        'success' => false,
        'message' => 'Google authorization is not configured.',
    ], 503);
}

$data = readJsonBody(24576);
$credential = trim((string)($data['credential'] ?? ''));
$expectedRole = strtolower(trim((string)($data['expectedRole'] ?? '')));

if (
    strlen($credential) < 100
    || strlen($credential) > 16384
    || preg_match('/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/D', $credential) !== 1
) {
    recordAuthenticationFailure($pdo, 'malformed_credential');
    jsonResponse(['success' => false, 'message' => 'Google sign-in could not be verified.'], 401);
}

if (!in_array($expectedRole, ['admin', 'faculty'], true)) {
    recordAuthenticationFailure($pdo, 'invalid_role');
    jsonResponse(['success' => false, 'message' => 'A valid ICTRAX role is required.'], 400);
}

enforceAuthenticationThrottle($pdo);

final class GoogleLoginDenied extends RuntimeException
{
    public string $reason;
    public int $httpStatus;

    public function __construct(string $reason, int $httpStatus = 401)
    {
        parent::__construct('Google sign-in could not be verified.');
        $this->reason = $reason;
        $this->httpStatus = $httpStatus;
    }
}

final class GoogleVerificationUnavailable extends RuntimeException
{
}

/**
 * Ask Google's HTTPS tokeninfo service to validate the signature and base
 * claims. Application-specific issuer, audience, time, email, and role checks
 * are performed again below. The submitted token is never logged.
 */
function googleTokenInfo(string $idToken): array
{
    $url = 'https://oauth2.googleapis.com/tokeninfo';
    $postFields = http_build_query(['id_token' => $idToken], '', '&', PHP_QUERY_RFC3986);
    $body = false;
    $status = 0;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new GoogleVerificationUnavailable('Unable to initialize Google verification.');
        }

        $curlOptions = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postFields,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/x-www-form-urlencoded',
            ],
        ];
        if (defined('CURLOPT_PROTOCOLS') && defined('CURLPROTO_HTTPS')) {
            $curlOptions[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS;
        }
        curl_setopt_array($ch, $curlOptions);

        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            throw new GoogleVerificationUnavailable($curlError ?: 'Google verification request failed.');
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'timeout' => 10,
                'ignore_errors' => true,
                'header' => "Accept: application/json\r\nContent-Type: application/x-www-form-urlencoded\r\n",
                'content' => $postFields,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false,
            ],
        ]);
        $body = @file_get_contents($url, false, $context);
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $match)) {
            $status = (int)$match[1];
        }
        if ($body === false) {
            throw new GoogleVerificationUnavailable('Unable to contact Google verification.');
        }
    }

    if (strlen((string)$body) > 262144) {
        throw new GoogleVerificationUnavailable('Google verification response was too large.');
    }

    try {
        $payload = json_decode((string)$body, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new GoogleVerificationUnavailable('Google returned an invalid verification response.');
    }

    if (!is_array($payload)) {
        throw new GoogleVerificationUnavailable('Google returned an invalid verification response.');
    }
    if ($status >= 400 && $status < 500) {
        throw new GoogleLoginDenied('invalid_google_token');
    }
    if ($status < 200 || $status >= 300) {
        throw new GoogleVerificationUnavailable('Google verification was unavailable.');
    }
    if (isset($payload['error_description']) || isset($payload['error'])) {
        throw new GoogleLoginDenied('invalid_google_token');
    }

    return $payload;
}

/** Limit a UTF-8 profile value without requiring mbstring in local XAMPP. */
function boundedProfileValue(string $value, int $maximumLength): string
{
    $value = trim((string)preg_replace('/[\x00-\x1F\x7F]/u', '', $value));
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maximumLength, 'UTF-8');
    }
    return substr($value, 0, $maximumLength);
}

$emailForAudit = '';

try {
    $google = googleTokenInfo($credential);
    $now = time();

    $issuer = (string)($google['iss'] ?? '');
    $audience = (string)($google['aud'] ?? '');
    $authorizedParty = (string)($google['azp'] ?? '');
    $email = strtolower(trim((string)($google['email'] ?? '')));
    $emailForAudit = $email;
    $emailVerified = filter_var($google['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $subject = trim((string)($google['sub'] ?? ''));
    $issuedAt = isset($google['iat']) ? (int)$google['iat'] : 0;
    $expiresAt = isset($google['exp']) ? (int)$google['exp'] : 0;

    if (!in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)) {
        throw new GoogleLoginDenied('issuer_mismatch');
    }
    if (!hash_equals(GOOGLE_CLIENT_ID, $audience)) {
        throw new GoogleLoginDenied('audience_mismatch');
    }
    if ($authorizedParty !== '' && !hash_equals(GOOGLE_CLIENT_ID, $authorizedParty)) {
        throw new GoogleLoginDenied('authorized_party_mismatch');
    }
    if (!$emailVerified || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        throw new GoogleLoginDenied('email_unverified');
    }
    if ($subject === '' || strlen($subject) > 255) {
        throw new GoogleLoginDenied('subject_invalid');
    }
    if ($issuedAt <= 0 || $issuedAt > $now + 300 || $issuedAt < $now - 7200) {
        throw new GoogleLoginDenied('issued_at_invalid');
    }
    if ($expiresAt <= $now - 30 || $expiresAt > $now + 7200 || $expiresAt <= $issuedAt) {
        throw new GoogleLoginDenied('expiry_invalid');
    }
    if (!isGoogleEmailAuthorizedForRole($email, $expectedRole)) {
        throw new GoogleLoginDenied('role_policy_denied', 403);
    }

    $stmt = $pdo->prepare(
        'SELECT id, username, email, google_sub, role, full_name, title, initials, faculty_id, department '
        . 'FROM users WHERE LOWER(email) = :email AND role = :role AND active = 1 AND deleted_at IS NULL LIMIT 1'
    );
    $stmt->execute([':email' => $email, ':role' => $expectedRole]);
    $user = $stmt->fetch();

    // Every verified account from an approved CEU domain is eligible for faculty access. Create
    // its local profile on first sign-in, while preserving inactive/deleted or
    // differently assigned accounts as explicit access denials.
    if (!$user && $expectedRole === 'faculty') {
        $existingStmt = $pdo->prepare('SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1');
        $existingStmt->execute([':email' => $email]);
        $existingUser = $existingStmt->fetch();

        if (!$existingUser) {
            $fullName = boundedProfileValue((string)($google['name'] ?? ''), 150);
            $emailName = boundedProfileValue((string)strtok($email, '@'), 80);
            if ($fullName === '') {
                $fullName = boundedProfileValue(ucwords(str_replace(['.', '_', '-'], ' ', $emailName)), 150);
            }

            $initialParts = preg_split('/\s+/', $fullName, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $initials = '';
            foreach (array_slice($initialParts, 0, 2) as $part) {
                $initials .= strtoupper(substr($part, 0, 1));
            }
            if ($initials === '') {
                $initials = strtoupper(substr($emailName, 0, 2));
            }
            $initials = boundedProfileValue($initials, 10);

            $username = 'faculty.google.' . substr(hash('sha256', $subject), 0, 20);
            try {
                $create = $pdo->prepare(
                    "INSERT INTO users(username, email, google_sub, password_hash, role, full_name, title, initials, faculty_id, department, active) "
                    . "VALUES(:username, :email, :google_sub, NULL, 'faculty', :full_name, 'Faculty Member', :initials, NULL, NULL, 1)"
                );
                $create->execute([
                    ':username' => $username,
                    ':email' => $email,
                    ':google_sub' => $subject,
                    ':full_name' => $fullName,
                    ':initials' => $initials,
                ]);
            } catch (PDOException $e) {
                // A concurrent first-login request may have created the same
                // profile. Re-query below and deny if no active match exists.
            }

            $stmt->execute([':email' => $email, ':role' => $expectedRole]);
            $user = $stmt->fetch();
        }
    }

    if (!$user) {
        throw new GoogleLoginDenied('account_not_authorized', 403);
    }

    // Bind the immutable Google subject once. The conditional update prevents
    // concurrent requests from silently replacing a previously linked subject.
    if (!empty($user['google_sub']) && !hash_equals((string)$user['google_sub'], $subject)) {
        throw new GoogleLoginDenied('subject_link_mismatch', 403);
    }
    if (empty($user['google_sub'])) {
        $bind = $pdo->prepare(
            "UPDATE users SET google_sub = :google_sub "
            . "WHERE id = :id AND (google_sub IS NULL OR google_sub = '')"
        );
        try {
            $bind->execute([':google_sub' => $subject, ':id' => (int)$user['id']]);
        } catch (PDOException $e) {
            throw new GoogleLoginDenied('subject_link_conflict', 403);
        }

        $linkedStmt = $pdo->prepare('SELECT google_sub FROM users WHERE id = :id LIMIT 1');
        $linkedStmt->execute([':id' => (int)$user['id']]);
        $linkedSubject = (string)$linkedStmt->fetchColumn();
        if ($linkedSubject === '' || !hash_equals($linkedSubject, $subject)) {
            throw new GoogleLoginDenied('subject_link_conflict', 403);
        }
        $user['google_sub'] = $linkedSubject;
    }

    $csrfToken = establishAuthenticatedSession($user, $email, $subject);

    // Establish the notification baseline at authentication time so an event
    // created while the protected pages are still loading cannot be skipped.
    try {
        $_SESSION['_incident_notification_cursor'] = (string)($pdo->query(
            "SELECT COALESCE(MAX(id), 0) FROM audit_logs WHERE entity_type = 'incident'"
        )->fetchColumn() ?: '0');
    } catch (Throwable $e) {
        unset($_SESSION['_incident_notification_cursor']);
        error_log('ICTRAX incident notification baseline could not be established.');
    }

    try {
        writeAudit($pdo, 'login', 'user', (string)$user['id'], [
            'method' => 'google',
            'principal_hash' => hash('sha256', $email),
            'role' => $user['role'],
        ]);
    } catch (Throwable $e) {
        // A temporary audit failure must not create an authenticated session
        // that the browser is never told about.
        error_log('ICTRAX successful-login audit write failed.');
    }

    jsonResponse([
        'success' => true,
        'authenticated' => true,
        'csrf_token' => $csrfToken,
        'user' => currentSessionUser(),
    ]);
} catch (GoogleLoginDenied $e) {
    recordAuthenticationFailure($pdo, $e->reason, $emailForAudit);
    jsonResponse([
        'success' => false,
        'message' => $e->httpStatus === 403
            ? 'This Google account is not authorized for the selected ICTRAX role.'
            : 'Google sign-in could not be verified.',
    ], $e->httpStatus);
} catch (GoogleVerificationUnavailable $e) {
    $reference = bin2hex(random_bytes(6));
    error_log("ICTRAX Google verification unavailable [{$reference}]: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Google sign-in is temporarily unavailable.',
        'reference' => $reference,
    ], 502);
} catch (Throwable $e) {
    $reference = bin2hex(random_bytes(6));
    error_log("ICTRAX Google login failed [{$reference}]: " . $e->getMessage());
    recordAuthenticationFailure($pdo, 'internal_error', $emailForAudit);
    clearAuthenticationSession();
    jsonResponse([
        'success' => false,
        'message' => 'Google sign-in could not be completed.',
        'reference' => $reference,
    ], 500);
}
