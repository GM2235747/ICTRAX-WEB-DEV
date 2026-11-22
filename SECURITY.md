# ICTRAX ISO/IEC 25010 and CIA quality baseline

## Scope and assurance statement

This baseline follows the quality objectives named in the ICTRAX capstone:
usability, functional suitability, reliability, performance efficiency, and
security. The security implementation is organized around confidentiality,
integrity, and availability (CIA), as required by the capstone's security
methodology.

ISO/IEC 25010 is a product-quality model used to specify and evaluate quality;
it is not an information-security certification. The current edition is
[ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html). Its predecessor,
ISO/IEC 25010:2011, is withdrawn. This repository provides implementation and
regression evidence, but a passing local test does not guarantee that every
external scanner will pass or that a deployment is secure. Production
configuration, authorized penetration testing, operations, and independent
evaluation remain necessary.

## Capstone quality traceability

| Capstone criterion | Implemented evidence | Evaluation still required |
| --- | --- | --- |
| Usability / interaction capability | Role-specific navigation, clear validation and authentication messages, secure retry states, accessible labels, and a consistent shared interface. | Run the capstone's validated user questionnaire and task-based usability test. The required reload-logout behavior intentionally trades convenience for confidentiality. |
| Functional suitability | Google sign-in, equipment inventory, QR lookup, incident reporting, service cards, archive/restore, audit history, risk scoring, reports, and role-specific workflows are connected to MySQL-backed APIs. Server-side validation checks required fields and workflow values. | Execute an acceptance matrix for every administrator and faculty use case with expected results and retain signed evidence. |
| Reliability | Protected pages fail closed, active accounts are revalidated, sessions have idle/absolute timeouts, writes use transactions, errors avoid partial-update claims, and logout remains available during database degradation. | Define and test backup/restore, recovery point objective (RPO), recovery time objective (RTO), monitoring, and outage procedures. The browser application is not itself a database backup system. |
| Performance efficiency | Database indexes cover frequent status/location/date/audit queries; request bodies and connection times are bounded; initial protected-data reads run concurrently; stale browser data is not used as a fallback. | Measure response time, throughput, error rate, and resource usage with representative CEU data and concurrent users. Record the environment, workload, thresholds, and results. |
| Security | Server-side authentication and role authorization, CSRF protection, same-origin write checks, output encoding, prepared SQL, transactional writes, audit events, secure cookie attributes, anti-caching, and browser security headers. | Complete authorized authenticated/unauthenticated DAST and manual role tests on the deployment. Resolve all findings according to an approved risk threshold. |

The remaining ISO/IEC 25010:2023 characteristics are not claimed as evaluated
by this capstone baseline. They can be added to a later evaluation scope.

## CIA controls

### Confidentiality

- Google ID tokens are verified server-side. Protected APIs require a live PHP
  session and enforce administrator/faculty permissions; browser storage is not
  accepted as authorization.
- Login regenerates the session identifier. Cookies are `HttpOnly`,
  `SameSite=Strict`, and `Secure` on HTTPS. Sessions have 10-minute idle and
  8-hour absolute limits, periodic ID rotation, user-agent binding, and active
  account/role revalidation.
- State-changing requests require a cryptographically random CSRF token and
  same-origin checks. Requests and JSON bodies have method, type, and size
  limits.
- Database/configuration/backup artifacts are denied over HTTP. Responses use
  restrictive framing, referrer, permissions, MIME-sniffing, cross-origin,
  content-security, and no-store policies.
- Database-derived values are HTML-escaped before insertion into generated UI.
  CSV export neutralizes cells that spreadsheet programs could treat as
  formulas.

### Integrity

- APIs use parameterized SQL, allowlisted roles/methods/values, bounded text,
  strict dates, valid identifiers, and database uniqueness/foreign-key rules.
- Related equipment, incident, archive, restore, and service-card changes use
  transactions and rollback on failure.
- Condemned equipment cannot receive a new incident or be changed back to
  Operational by closing an older incident.
- Security-relevant logins, logouts, denials, and record changes are written to
  the audit log without storing credentials or Google tokens.
- Faculty incident queries are restricted to the authenticated reporter. Only
  administrators can manage inventory, incident decisions, catalog settings,
  archives, service cards, and audit history.
- Request-for-repair forms use a dedicated validated JSON column. Their
  user-facing category and description are derived from that canonical form,
  synchronized by an idempotent CLI-only migration, and checked again before
  archived incidents can be restored. The migration writes only summary counts
  to the audit log and never logs the submitted form contents.

### Availability

- Database connections and Google verification use bounded timeouts; request
  bodies are limited; indexed queries and transactions reduce resource use and
  inconsistent partial writes.
- The UI reports secure service failures instead of silently exposing demo or
  stale browser data. Logout destroys the server session even when the database
  is unavailable.
- The request-for-repair migration performs a validation-only dry run by
  default, validates active and archived forms before changing data, and wraps
  data updates in a transaction. The additive schema change and legacy-reader
  fallback keep the system recoverable during deployment.
- Availability also depends on controls outside this repository: database
  backups, tested restoration, monitoring, capacity planning, patching, power,
  network, and incident response. These deployment controls are mandatory.

## Required reload/session lifecycle

The project policy is deliberately strict: reloading any ICTRAX page invalidates
the authenticated server session and returns the browser to `index.html`.
Normal navigation between ICTRAX pages remains usable.

On reload, the frontend conceals protected content, retrieves the current CSRF
token when needed, calls the same-origin logout API, clears temporary user and
service-card state, broadcasts logout to other ICTRAX tabs, and uses replacement
navigation so the protected page is not retained in history. Back/forward-cache
restoration revalidates the server session before revealing the page.

Ten minutes without browser interaction ends the session on both the client
and server. The browser presents a non-dismissible timeout modal, attempts the
same-origin server logout, broadcasts the logout to other ICTRAX tabs, and
returns to the log-in page automatically.

This policy improves confidentiality on shared computers but reduces usability
and availability. It is a project-specific requirement, not an ISO/IEC 25010
requirement. If it is relaxed later, keep the server-side idle/absolute limits
and require reauthentication for sensitive operations.

## Production deployment requirements

1. Serve ICTRAX only through HTTPS with a valid certificate and redirect HTTP
   to HTTPS. Enable HSTS only after every required host is HTTPS-ready.
2. Apply the directives in `deploy/apache-security.conf.example` in Apache's
   main server configuration and restart Apache. `.htaccess` cannot
   disable the Apache core `TRACE` handler or fully minimize the `Server` header.
3. Set `ICTRAX_ENV=production` and provide `ICTRAX_DB_HOST`, `ICTRAX_DB_PORT`,
   `ICTRAX_DB_NAME`, `ICTRAX_DB_USER`, `ICTRAX_DB_PASSWORD`, and a deployment-
   specific `ICTRAX_AUDIT_SALT`. Use a dedicated least-privilege account, never
   MySQL `root`. Use `ICTRAX_DB_SSL_CA` when the database is remote. If proxy or
   rewrite rules hide the `/api/` path, explicitly set `ICTRAX_SESSION_COOKIE_PATH`.
4. Configure the production Google OAuth client for the exact HTTPS origin.
   Set `ICTRAX_GOOGLE_CLIENT_ID`, `ICTRAX_GOOGLE_ADMIN_EMAIL`, and the
   comma-separated `ICTRAX_GOOGLE_FACULTY_DOMAINS` allowlist.
   Protect the client configuration and use Google's maintained server-side
   verification library when the production stack can manage dependencies.
5. Keep PHP error display disabled. Store server/audit logs in access-controlled
   storage with synchronized time and alert on repeated denials, HTTP 5xx spikes,
   database failures, and storage/capacity thresholds.
6. Take encrypted database backups at a frequency derived from the approved
   RPO. Keep a separate/offline copy and perform a documented restore test at
   least quarterly. Define the RTO, outage runbook, owners, and alternate
   communications path.
7. Patch Apache, PHP, MySQL, the operating system, Google integration, and
   frontend dependencies on a documented schedule. Review administrator/faculty
   access at least quarterly and on personnel changes.
8. Define retention for audit logs, incidents, equipment history, archives, and
   backups. Export audit evidence to separately administered or append-only
   storage if stronger non-repudiation is required.
9. Run authorized authenticated and unauthenticated vulnerability tests in a
   non-production environment. Back up before destructive tests and do not use
   real personal data in test fixtures.

## Verification

From the project directory:

```powershell
C:\xampp\php\php.exe tests\security_smoke.php
C:\xampp\php\php.exe tests\database_preflight.php
C:\xampp\php\php.exe api\migrate_request_repair_storage.php
node --check script.js
Get-ChildItem api -Filter *.php | ForEach-Object { C:\xampp\php\php.exe -l $_.FullName }
```

For live HTTP checks, start Apache and MySQL, set the local site root, and rerun:

```powershell
$env:ICTRAX_TEST_BASE_URL = 'http://localhost/ICTRAX_WEBSITE'
C:\xampp\php\php.exe tests\security_smoke.php
```

The live `TRACE` check will remain a deployment failure until `TraceEnable Off`
is applied at Apache server scope and Apache is restarted. Browser
tests must also verify both roles, reload logout, cross-tab logout, access denial,
and the main create/update/archive/restore workflows.

For an existing database, first review the migration dry-run counts, take the
deployment's approved encrypted backup, and then apply the synchronized repair
form storage once:

```powershell
C:\xampp\php\php.exe api\migrate_request_repair_storage.php --apply
C:\xampp\php\php.exe tests\database_preflight.php
```

## Known residual limitations

- The current interface still uses legacy inline event handlers and inline
  styles, so its Content Security Policy must permit inline script/style. All
  database-derived text is encoded, but a later UI refactor should replace
  inline handlers with delegated event listeners and remove this CSP allowance.
- Local HTTP development cannot provide Secure cookies or HSTS. Those controls
  become active only on an HTTPS deployment.
- Automated tests cannot complete Google account selection or authenticated
  role workflows without designated test accounts. Those cases require an
  authorized manual test or a dedicated non-production identity test setup.
- Google `tokeninfo` keeps this XAMPP build dependency-free. Production should
  use Google's maintained server-side verification library, as noted above.

## Incident reporting

Do not place suspected vulnerabilities, real tokens, session cookies, personal
data, or database exports in public issues. Notify the ICTRAX/CEU system owner
through the institution's approved private security channel with reproduction
steps, affected role, observation time, and business impact.
