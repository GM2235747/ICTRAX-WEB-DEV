ICTRAX
Web-Based Equipment Monitoring System for ICT Resources
Centro Escolar University Malolos - 2026

Overview
--------
ICTRAX is a web-based system for centralizing ICT equipment inventory,
QR-based equipment identification, incident reporting, maintenance tracking,
and operational reporting for CEU Malolos.

The system provides role-specific workflows for Administrators and
Faculty/Non-Teaching users. Equipment and incident data, catalogs, archives,
service cards, audit history, and repair verification records are stored in
MySQL through protected PHP APIs.


Pages
-----
index.html              Google sign-in
dashboard.html          Role-aware dashboard and incident analytics
inventory.html          Administrator equipment inventory
incidents.html          Administrator incident reports
completed-incidents.html Completed and archived incident workflows
archived-equipment.html Archived equipment records
audit.html              Administrator audit history
risk.html               Equipment maintenance-risk analytics
browse-equipment.html   Faculty/Non-Teaching equipment browser
report-issue.html       Faculty/Non-Teaching repair request form
my-reports.html         Faculty/Non-Teaching submitted incidents

Shared files
------------
assets/css/styles.css   Shared application styles
assets/css/ceu-theme.css CEU visual theme
assets/js/ictrax-qrcode.js
                        Local QR code generation
assets/js/xlsx.bundle.js
                        Local styled Excel export library
script.js               Shared application logic and API integration
api/                    Authentication, database, and feature PHP APIs
tests/                  Local regression and smoke-test scripts


Authentication and roles
------------------------
- Authentication uses Google Identity Services and server-verified Google ID
  tokens.
- Password login and password registration are disabled.
- Administrators are restricted to the designated ICTRAX account.
- Faculty/Non-Teaching accounts must use a verified Google account from an
  approved @mls.ceu.edu.ph or @ceu.edu.ph domain.
- Protected pages and APIs require a live PHP session.
- State-changing requests require a server-issued CSRF token and same-origin
  request validation.
- Browser storage may cache display state only and is never accepted as
  authorization.
- Sessions expire after inactivity and use server-side idle and absolute limits.
- Reloading an ICTRAX page ends the current protected session by project policy.


Equipment inventory
-------------------
- Administrators can add, edit, archive, restore, and delete equipment records.
- Equipment records include category, Tag ID/Equipment Number, serial number,
  location, status, physical condition, acquisition date, maintenance date,
  warranty, and notes.
- The master Tag ID Settings control in Manage Equipment Options switches the
  entire system between automatic and manual Tag ID modes.
- Automatic mode generates IDs from category prefix and sequence values.
- Manual mode allows existing and newly created equipment Tag IDs to be entered
  and edited. Updated IDs remain consistent with incident references and QR
  payloads.
- Equipment categories and locations can be managed by Administrators.
- Categories and locations may not be removed while linked to equipment.
- Serial numbers are allowed to repeat only in different locations.
- Table search, sorting, filters, and Excel exports are available.
- Equipment details include QR tags, service-card history, warranty information,
  status, maintenance history, and notes.
- JPG, PNG, and WebP photos can be attached to equipment notes, with a 5 MB
  limit per file.
- Photos are stored outside the public document area and viewed through an
  authenticated API. Upload and deletion require Administrator access.


Tag ID format
-------------
Automatic category tags use the configured prefix and sequence:

    PREFIX + SEQUENCE + "-" + EQUIPMENT NUMBER

Example: prefix DT and sequence 01 generate DT01-01, DT01-02, and so on.


QR codes and service cards
--------------------------
- Equipment pages support scannable, locally generated QR tags.
- The scanner uses a workstation camera and accepts an equipment tag or a QR
  URL containing an equipment, id, or code parameter.
- Administrators can open equipment details and edit CEU QPF 024 service-card
  records.
- Faculty/Non-Teaching users receive a read-only equipment and service-history
  view.
- QR and service-card workflows are available from equipment inventory,
  incident reports, and relevant equipment detail dialogs.
- Service cards support office, model, unit cost, dated service rows, printing,
  and MySQL persistence.
- Camera access requires localhost or HTTPS.


Incident reporting
------------------
- Faculty/Non-Teaching users can search and select equipment and submit a
  repair request.
- The request form stores structured repair data in MySQL.
- Faculty/Non-Teaching users can view their submitted reports and status
  changes.
- Administrators can edit reports, update status and priority, add remarks,
  record resolution data, archive reports, and access related equipment details.
- Status changes notify both roles through the notification bell and toast
  system.
- Polling refreshes new and updated notifications during a live session.
- Notification history includes unread state, report details, clear, and
  jump-to-report actions.


Incident verification workflow
------------------------------
- When an Administrator marks repair work Resolved, the incident remains in
  Awaiting Verification.
- The original Faculty/Non-Teaching submitter confirms whether the repair was
  completed.
- A confirmation records the verification result and timestamp.
- If Repair Not Accomplished is selected, feedback is required, the incident
  returns to In Progress, and its equipment returns to Under Repair.


Equipment status synchronization
--------------------------------
- In Progress incidents set linked equipment to Under Repair.
- Resolved or Rejected incidents return equipment to Operational only when no
  other open incident remains.
- Condemned equipment cannot receive new incidents and cannot return to
  Operational because of an older incident decision.
- Archive and restore operations preserve linked equipment, incident snapshots,
  and service-card data.


Dashboard analytics
-------------------
- The dashboard provides equipment totals, current status counts, and recent
  incident summaries.
- Incident charts support Last 6 Months, All Time, This Year, This Quarter,
  This Month, Last Year, and Last Quarter.
- Date filters use date-only local comparisons to avoid timezone boundary errors.
- The filter affects Incident Reports, Recent Reports, and incident-linked
  Equipment Status values.
- Chart labels adapt to the selected period to remain readable.
- Fleet availability is Operational equipment divided by all equipment.


Risk analytics
--------------
ICTRAX calculates an explainable 0-100 maintenance-priority score using:

- Current equipment status
- Incident history
- Recent 90-day incident trend
- Equipment age
- Maintenance staleness
- Physical condition

The score is a predefined weighted decision model, not a machine-learning
prediction or probability of failure. Risk Analytics provides factor details,
location averages, incident evidence, audit history, maintenance
recommendations, and CSV export.

See RISK_ANALYTICS.md for the complete formula and limitations.


Archive and audit
-----------------
- Equipment and incident records use soft deletion, preserving history.
- Archived equipment can be restored together with its service card and linked
  incident snapshots.
- The Audit Log records create, update, archive, restore, and deletion actions.
- Audit entries identify the actor, entity, timestamp, and previous/current
  values where applicable.
- Direct SQL changes in phpMyAdmin are not application-attributed and do not
  automatically create audit entries.


Validation and database protection
---------------------------------
- API endpoints enforce methods, roles, CSRF, allowed values, field lengths,
  and valid identifiers.
- SQL queries use parameterized statements.
- Equipment and incident dates must be valid, not earlier than 2000-01-01, and
  not in the future.
- Last maintenance cannot precede acquisition.
- Unique, foreign-key, status, location, and archive rules protect record
  integrity.
- Database transactions prevent partial equipment, incident, service-card,
  and archive updates.
- Database-derived values are HTML-escaped before rendering in the interface.
- Spreadsheet exports neutralize spreadsheet formula characters.


Database setup
--------------
Start Apache and MySQL in XAMPP, then open:

    http://localhost/ICTRAX_WEBSITE/

The database name is ictrax_db. For a brand-new database, import:

    api/schema.sql

For an existing database, apply all required migrations listed below:

    api/migrate_category_tag_settings.sql
    api/migrate_archive_integrity.sql
    api/migrate_equipment_warranty.sql
    api/migrate_equipment_photos.sql
    api/migrate_repair_verification.sql
    api/migrate_google_auth.sql
    api/migrate_google_access_policy.sql

The repair-form storage migration must be dry-run first and applied with PHP:

    C:\xampp\php\php.exe api\migrate_request_repair_storage.php
    C:\xampp\php\php.exe api\migrate_request_repair_storage.php --apply

Back up the database before applying migrations.


Google sign-in setup
--------------------
1. Create a Google OAuth 2.0 Web application client.
2. Add the exact XAMPP origin, normally http://localhost.
3. Open api/google-auth-config.php and set the Web Client ID.
4. Configure the approved Administrator account and faculty domains.
5. Apply api/migrate_google_auth.sql to an older database.
6. Apply api/migrate_google_access_policy.sql if changing an existing Google
   access-policy database.
7. Open the project through http://localhost/ICTRAX_WEBSITE/.

The backend verifies issuer, audience, verified email, subject, expiration,
and role policy before creating a session.

For production, configure the Google client through environment variables or
protected deployment configuration and use a maintained server-side Google
verification library instead of the development token endpoint flow.


Testing
-------
Run from the project directory:

    C:\xampp\php\php.exe tests\database_preflight.php
    C:\xampp\php\php.exe tests\security_smoke.php
    C:\xampp\php\php.exe tests\incident_notifications_smoke.php
    C:\xampp\php\php.exe tests\incident_update_smoke.php
    C:\xampp\php\php.exe tests\repair_verification_smoke.php
    C:\xampp\php\php.exe tests\warranty_smoke.php
    C:\xampp\php\php.exe tests\completed_incidents_smoke.php

Additional JavaScript/RISK checks:

    node --check script.js
    node tests/risk_engine_smoke.js

PHP syntax check for active APIs:

    Get-ChildItem api -Filter *.php | ForEach-Object {
        C:\xampp\php\php.exe -l $_.FullName
    }


Live notification testing
-------------------------
Sign in as Administrator in one browser profile and as Faculty/Non-Teaching
in another browser profile, such as a normal window and a Private/Incognito
window.

1. Submit an incident as Faculty/Non-Teaching.
2. Confirm that the Administrator receives a toast and bell entry.
3. Change the incident status as Administrator.
4. Confirm that the Faculty/Non-Teaching submitter receives a toast and bell
   entry.
5. Open, jump to, clear, and mark notifications as needed.


Production deployment
---------------------
- Serve ICTRAX through HTTPS and configure a valid Google OAuth origin.
- Enable production environment settings and dedicated database credentials.
- Use a least-privilege MySQL account instead of root.
- Keep PHP error display disabled and restrict database, upload, backup,
  configuration, and migration files from public HTTP access.
- Apply Apache security configuration and restart Apache.
- Use Secure and HttpOnly session cookies on HTTPS.
- Schedule encrypted backups and documented restore tests.
- Patch Apache, PHP, MySQL, Google integration, and frontend dependencies.
- Review Administrator and Faculty access regularly.
- Monitor failed authorization, HTTP 5xx responses, database errors, and
  storage usage.
- Run authorized vulnerability testing and role-based acceptance tests before
  launch.

See SECURITY.md for CIA, ISO/IEC 25010 traceability, deployment requirements,
limitations, and residual risk guidance.


Final project status
--------------------
ICTRAX is a completed local-development/capstone implementation. Additional
testing, institutional account configuration, HTTPS deployment, backup
procedures, authorized security evaluation, and stakeholder acceptance remain
necessary before a production environment is launched.
