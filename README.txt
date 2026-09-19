ICTRAX MULTI-PAGE FRONTEND

Pages
-----
index.html              Login
dashboard.html         Dashboard (admin + student)
inventory.html         Equipment Inventory (admin)
incidents.html         Incident Reports (admin)
risk.html              Risk Analytics (admin)
reports.html           Reports & Export (admin)
browse-equipment.html  Browse Equipment (student)
report-issue.html      Report an Issue (student)
my-reports.html        My Reports (student)

Shared files
------------
assets/css/styles.css   Shared design system and responsive styles
script.js               Shared application logic, page navigation, demo data, CRUD, modals

Persistence
-----------
Login session uses sessionStorage. Equipment and incident demo records use localStorage, so CRUD changes persist while you move between the separate HTML pages. The selected equipment for the student Report an Issue page uses sessionStorage.

Demo credentials
----------------
Administrator: admin.tech / admin123
Student:       jdelacruz / student123

Important
---------
The uploaded index.html and script.js are different implementations. This refactor uses the inline JavaScript from index.html as the baseline because it matches the supplied index stylesheet and therefore minimizes behavior regressions. The original uploads are kept in backup/.

CSS SYNC NOTE
-------------
The shared stylesheet at assets/css/styles.css has been synchronized with the style.css supplied for this refactor.
All HTML pages load this same stylesheet.
A backup of the previous stylesheet is stored at backup/styles-before-user-css-sync.css.

Current system capabilities
---------------------------
Authentication and roles
	- Administrator and student access levels.
	- Student self-registration without email verification for the current mockup.
	- Passwords are stored as bcrypt hashes.
	- Usernames and student IDs are unique.

Equipment tracking
	- Equipment records are stored in MySQL and loaded by the web app.
	- Admins can add, edit, and remove equipment.
	- Required fields include equipment tag, serial number, location, status,
		condition, acquisition date, and last maintenance date.
	- Serial numbers may repeat in different locations but not at the same location.
	- Built-in and administrator-created categories and locations are supported.
	- Built-in catalog options are protected; custom options cannot be removed while
		they are being used by equipment.

Incident reporting
	- Students and administrators can submit incident reports.
	- Reports are stored in MySQL and remain visible in incident history.
	- Students can view their own reports.
	- Administrators can update status, priority, remarks, and resolution date.
	- Incident workflow synchronizes equipment status:
			In Progress -> Under Repair
			Resolved -> Operational
			Rejected -> Operational
	- Decommissioned equipment remains unavailable and is excluded from available units.

Risk analytics
	- Risk is a 0-100 explainable score, not a machine-learning prediction.
	- Factors include current equipment status, incident history, recent incident trend,
		equipment age, maintenance staleness, and physical condition.
	- Recent incidents and repeated problems contribute more risk.
	- Resolved incidents lose influence over time through recency weighting.
	- Poor condition with significantly overdue maintenance has a minimum High-Risk floor.
	- Severe age, poor condition, and long maintenance delay have a minimum Critical-Risk
		floor.
	- Risk Analytics provides unit-level score details, incident history, status history,
		notes, timestamps, and audit actors.

Fleet availability
	- Fleet Availability is calculated as Operational units divided by all equipment units.
	- Any status other than Operational is unavailable, including Under Repair, Damaged,
		Missing, and Decommissioned.

Audit and history
	- Administrators have an Audit Log page at audit.html.
	- Audit entries record create, update, and delete actions, actor, entity, timestamp,
		and complete previous/current values where applicable.
	- Audit colors are green for additions, orange for changes, and red for removals.
	- Equipment and incidents use soft deletion so their history remains in MySQL.
	- Direct SQL changes made manually in phpMyAdmin cannot be attributed to a web user
		and do not automatically create application audit entries.

Validation and database protection
	- Equipment and incident dates must be valid, cannot be in the future, and must not
		precede 2000-01-01.
	- Last maintenance cannot be earlier than acquisition.
	- Status, condition, incident category, and priority values are validated server-side.
	- Foreign keys protect equipment and incident references.
	- Database indexes and created_at/updated_at timestamps support auditability and queries.

Testing and local use
	- Start Apache and MySQL in XAMPP.
	- Open http://localhost/ICTRAX-WEB-DEV/.
	- Demo administrator: admin.tech / admin123
	- Demo student: jdelacruz / student123
	- Use Ctrl + F5 after frontend changes if the browser has cached an older script.
	- The database is named ictrax_db; api/schema.sql contains the schema and seed accounts.
