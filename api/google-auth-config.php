<?php
// ICTRAX Google Identity Services configuration.
// The Web Client ID is public and is safe to use in the browser, but it must
// correspond to the OAuth 2.0 Web application configured in Google Cloud.
// Environment values are preferred outside local XAMPP development.
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string)$_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}

$googleConfigIsProduction = strtolower(trim((string)(getenv('ICTRAX_ENV') ?: 'development'))) === 'production';
$developmentClientId = $googleConfigIsProduction
    ? ''
    : '634760815959-ck0p7rtqn1agmetaf0p4fd5cit033cio.apps.googleusercontent.com';
$developmentAdminEmail = $googleConfigIsProduction ? '' : 'ictstest2026@mls.ceu.edu.ph';
$developmentFacultyDomains = $googleConfigIsProduction ? '' : 'mls.ceu.edu.ph,ceu.edu.ph';

define(
    'GOOGLE_CLIENT_ID',
    trim((string)(getenv('ICTRAX_GOOGLE_CLIENT_ID') ?: $developmentClientId))
);

// ICTRAX role policy. These checks are enforced again on the server after
// Google has verified the ID token; browser-side hints are not trusted.
define(
    'GOOGLE_ADMIN_EMAIL',
    strtolower(trim((string)(getenv('ICTRAX_GOOGLE_ADMIN_EMAIL') ?: $developmentAdminEmail)))
);

$configuredFacultyDomains = trim((string)(getenv('ICTRAX_GOOGLE_FACULTY_DOMAINS') ?: ''));
if ($configuredFacultyDomains === '') {
    // Keep the former singular setting compatible with existing deployments.
    $configuredFacultyDomains = trim((string)(getenv('ICTRAX_GOOGLE_FACULTY_DOMAIN') ?: $developmentFacultyDomains));
}
$googleFacultyDomains = [];
foreach (explode(',', $configuredFacultyDomains) as $configuredFacultyDomain) {
    $normalizedDomain = strtolower(ltrim(trim($configuredFacultyDomain), '@'));
    if (
        $normalizedDomain !== ''
        && preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/D', $normalizedDomain) === 1
    ) {
        $googleFacultyDomains[] = $normalizedDomain;
    }
}
define('GOOGLE_FACULTY_DOMAINS', array_values(array_unique($googleFacultyDomains)));

unset(
    $googleConfigIsProduction,
    $developmentClientId,
    $developmentAdminEmail,
    $developmentFacultyDomains,
    $configuredFacultyDomains,
    $configuredFacultyDomain,
    $normalizedDomain,
    $googleFacultyDomains
);

function isGoogleEmailAuthorizedForRole(string $email, string $role): bool
{
    $normalizedEmail = strtolower(trim($email));
    if (!filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL) || strlen($normalizedEmail) > 254) {
        return false;
    }

    if ($role === 'admin') {
        return GOOGLE_ADMIN_EMAIL !== '' && hash_equals(GOOGLE_ADMIN_EMAIL, $normalizedEmail);
    }

    if ($role === 'faculty') {
        foreach (GOOGLE_FACULTY_DOMAINS as $facultyDomain) {
            $suffix = '@' . $facultyDomain;
            if (
                strlen($normalizedEmail) > strlen($suffix)
                && substr($normalizedEmail, -strlen($suffix)) === $suffix
            ) {
                return true;
            }
        }
    }

    return false;
}
