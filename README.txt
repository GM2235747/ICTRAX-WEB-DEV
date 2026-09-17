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
