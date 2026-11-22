/* ============================================================
   EMS APPLICATION SCRIPT
   Part 1 — icons, mock data layer, utilities, risk engine,
   charts, auth, sidebar + router
   ============================================================ */

/* ---------- tiny DOM helpers ---------- */
const $  = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));
const esc = (s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsString = (s='')=>String(s)
  .replace(/\\/g,'\\\\')
  .replace(/'/g,'\\x27')
  .replace(/"/g,'\\x22')
  .replace(/&/g,'\\x26')
  .replace(/</g,'\\x3c')
  .replace(/>/g,'\\x3e')
  .replace(/\r/g,'\\r')
  .replace(/\n/g,'\\n')
  .replace(/\u2028/g,'\\u2028')
  .replace(/\u2029/g,'\\u2029');

/* ---------- icon set (Feather-style line icons) ---------- */
const ICONS = {
grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></svg>',
activity:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 8-6-16-3 8H2"/></svg>',
file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>',
eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
qrcode:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>',
x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
printer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>',
chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
monitor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
cpu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>',
keyboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M8 13h8"/></svg>',
mouse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 2v7"/></svg>',
battery:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="7" width="18" height="10" rx="2"/><path d="M23 11v2"/><path d="M5 11v2M9 11v2"/></svg>',
video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
wifi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0114 0"/><path d="M8.5 16.5a5 5 0 017 0"/><path d="M12 20h.01"/><path d="M2 9a15 15 0 0120 0"/></svg>',
camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
headset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>',
shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
mappin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>',
};
const icon=(name,extra='')=>`<span class="ico ${extra}">${ICONS[name]||''}</span>`;

const PAGE_MAP = {
  dashboard:'dashboard.html',
  equipment:'inventory.html',
  incidents:'incidents.html',
  completed:'completed-incidents.html',
  audit:'audit.html',
  risk:'risk.html',
  archived:'dashboard.html?view=archived',
  browse:'browse-equipment.html',
  report:'report-issue.html',
  myreports:'my-reports.html'
};
const PAGE_ACCESS = {
  dashboard:['admin','faculty'],
  equipment:['admin'],
  incidents:['admin'],
  completed:['admin','faculty'],
  audit:['admin'],
  risk:['admin'],
  archived:['admin'],
  browse:['faculty'],
  report:['admin','faculty'],
  myreports:['faculty']
};
const SESSION_KEY = 'ictrax_session_user_v1';
const DB_STORAGE_KEY = 'ictrax_demo_db_v1';
const PRESET_KEY = 'ictrax_preset_equipment_v1';
const AUTH_LOGOUT_EVENT_KEY = 'ictrax_auth_logout_event_v1';
const LOGOUT_REDIRECT_GUARD_KEY = 'ictrax_logout_redirect_guard_v1';
const FORCE_LOGOUT_ON_ARRIVAL_KEY = 'ictrax_force_logout_on_arrival_v1';
const API_BASE_URL = 'api';
const NOTIFICATIONS_STORAGE_KEY = 'ictrax_notifications_v1';
const WARRANTY_NOTIFICATION_SEEN_KEY = 'ictrax_warranty_notifications_seen_v1';
const PENDING_NOTIFICATION_JUMP_KEY = 'ictrax_pending_notification_jump_v1';
const INCIDENT_NOTIFICATION_INTERVAL = 4000;
const INCIDENT_NOTIFICATION_ENDPOINT = 'incident-notifications.php';
const INCIDENT_NOTIFICATION_CURSOR_PREFIX = 'ictrax_incident_notification_cursor_v3:';
const GOOGLE_AUTH_CONFIG_ENDPOINT = 'google-config.php';
const SESSION_ENDPOINT = 'session.php';
const SESSION_ACTIVITY_STORAGE_KEY = 'ictrax_session_activity_v1';
const SESSION_IDLE_TIMEOUT_DEFAULT_MS = 10 * 60 * 1000;
const SESSION_ACTIVITY_SYNC_INTERVAL_MS = 60 * 1000;
const SESSION_ACTIVITY_SHARE_INTERVAL_MS = 5000;
const SESSION_TIMEOUT_REDIRECT_DELAY_MS = 5000;
const SESSION_ACTIVITY_EVENTS = ['pointerdown','pointermove','keydown','scroll','touchstart'];
let googleClientId = '';
let googleInitialized = false;
let csrfToken = '';
let incidentNotificationTimer = null;
let incidentNotificationInFlight = false;
let incidentNotificationGeneration = 0;
let notificationPanelOpen = false;
let accountPanelOpen = false;
let logoutOperation = null;
let lastHandledLogoutEventId = '';
let authLifecycleGeneration = 0;
let sessionIdleTimeoutMs = SESSION_IDLE_TIMEOUT_DEFAULT_MS;
let sessionLastActivityAt = 0;
let sessionLastSharedActivityAt = 0;
let sessionLastServerSyncAt = 0;
let sessionActivityUserId = '';
let sessionInactivityTimer = null;
let sessionActivityShareTimer = null;
let sessionTimeoutRedirectTimer = null;
let sessionActivityMonitoring = false;
let sessionKeepAliveInFlight = false;
let sessionInactivityLogoutStarted = false;
const SERVICE_CARD_STORAGE_KEY = 'ictrax_service_card_drafts_v1';
let qrScannerInstance = null;
let qrScannerActive = false;
let qrCameraList = [];
let qrScannerGeneration = 0;
let qrScanHandling = false;


/* ---------- category → icon / code maps ---------- */
const CATEGORY_ICON = {'Desktop Computer':'cpu','Monitor':'monitor','Keyboard':'keyboard','Mouse':'mouse','UPS':'battery','Projector':'video','Printer':'printer','Router/Switch':'wifi','Webcam':'camera','Headset':'headset'};
const CATEGORY_CODE = {'Desktop Computer':'DT','Monitor':'MN','Keyboard':'KB','Mouse':'MO','UPS':'UPS','Projector':'PRJ','Printer':'PRT','Router/Switch':'NET','Webcam':'CAM','Headset':'HS'};
const LOCATIONS = ['Computer Laboratory 1','Computer Laboratory 2','Computer Laboratory 3','Server Room'];
const LOCATION_CODE = {'Computer Laboratory 1':'CL1','Computer Laboratory 2':'CL2','Computer Laboratory 3':'CL3','Server Room':'SVR'};
const catalogState = {
  categories:[...Object.keys(CATEGORY_ICON)],
  locations:[...LOCATIONS],
  categoryRecords:Object.keys(CATEGORY_ICON).map((name,index)=>({
    id:-(index+1),name,isBuiltin:1,tagIdMode:'automatic',tagPrefix:CATEGORY_CODE[name],tagSequence:'01',
  })),
  locationRecords:[],
};

/* ============================================================
   IN-MEMORY VIEW MODEL (SERVER DATA REPLACES THIS AFTER AUTHENTICATION)
   -----------------------------------------------------------
   Seed values support the unauthenticated login illustration only. After a
   protected session is verified, MySQL-backed API responses replace equipment
   and incident records. API failures fail closed and never fall back to these
   sample records.
   ============================================================ */
const DB = {
  equipment: [
    {id:'EMS-CL1-DT-001',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-101',status:'Operational',condition:'Good',dateAcquired:'2023-06-12',lastMaintenance:'2026-07-02',notes:'Station 1.'},
    {id:'EMS-CL1-DT-002',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-102',status:'Operational',condition:'Good',dateAcquired:'2023-06-12',lastMaintenance:'2026-07-02',notes:'Station 2.'},
    {id:'EMS-CL1-DT-003',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-103',status:'Under Repair',condition:'Fair',dateAcquired:'2022-03-04',lastMaintenance:'2026-02-18',notes:'Recurring blue-screen errors, RAM re-seated.'},
    {id:'EMS-CL1-DT-004',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-104',status:'Operational',condition:'Good',dateAcquired:'2023-06-12',lastMaintenance:'2026-06-20',notes:'Station 4.'},
    {id:'EMS-CL1-DT-005',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-105',status:'Damaged',condition:'Poor',dateAcquired:'2021-08-19',lastMaintenance:'2025-11-05',notes:'Unit does not power on — suspected PSU failure.'},
    {id:'EMS-CL1-DT-006',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-106',status:'Operational',condition:'Good',dateAcquired:'2024-01-15',lastMaintenance:'2026-07-30',notes:'Station 6.'},
    {id:'EMS-CL1-MN-001',name:'Spare Monitor',category:'Monitor',location:'Computer Laboratory 1',serial:'CEU-CL1-MN-001',status:'Condemned',condition:'Poor',dateAcquired:'2019-02-10',lastMaintenance:'2024-01-10',notes:'Retired — panel discoloration beyond economical repair.'},
    {id:'EMS-CL1-PRJ-001',name:'Ceiling Projector',category:'Projector',location:'Computer Laboratory 1',serial:'CEU-CL1-PRJ-01',status:'Under Repair',condition:'Fair',dateAcquired:'2022-09-01',lastMaintenance:'2026-01-22',notes:'Dim projection — bulb replacement requested.'},
    {id:'EMS-CL1-UPS-001',name:'Rack UPS Unit',category:'UPS',location:'Computer Laboratory 1',serial:'CEU-CL1-UPS-01',status:'Operational',condition:'Good',dateAcquired:'2023-11-02',lastMaintenance:'2026-05-14',notes:''},

    {id:'EMS-CL2-DT-001',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 2',serial:'CEU-CL2-PC-101',status:'Operational',condition:'Good',dateAcquired:'2023-06-12',lastMaintenance:'2026-07-10',notes:'Station 1.'},
    {id:'EMS-CL2-DT-002',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 2',serial:'CEU-CL2-PC-102',status:'Damaged',condition:'Poor',dateAcquired:'2022-03-04',lastMaintenance:'2025-09-15',notes:'Casing cracked after accidental fall; RAM slot loose.'},
    {id:'EMS-CL2-DT-003',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 2',serial:'CEU-CL2-PC-103',status:'Operational',condition:'Good',dateAcquired:'2024-01-15',lastMaintenance:'2026-06-28',notes:'Station 3.'},
    {id:'EMS-CL2-DT-004',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 2',serial:'CEU-CL2-PC-104',status:'Operational',condition:'Fair',dateAcquired:'2022-03-04',lastMaintenance:'2026-04-02',notes:'Station 4.'},
    {id:'EMS-CL2-DT-005',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 2',serial:'CEU-CL2-PC-105',status:'Operational',condition:'Good',dateAcquired:'2024-01-15',lastMaintenance:'2026-07-18',notes:'Station 5.'},
    {id:'EMS-CL2-PRT-001',name:'Laser Printer',category:'Printer',location:'Computer Laboratory 2',serial:'CEU-CL2-PRT-01',status:'Under Repair',condition:'Fair',dateAcquired:'2021-05-20',lastMaintenance:'2026-01-05',notes:'Repeated paper jam on second page.'},
    {id:'EMS-CL2-NET-001',name:'Network Switch',category:'Router/Switch',location:'Computer Laboratory 2',serial:'CEU-CL2-NET-01',status:'Operational',condition:'Good',dateAcquired:'2023-02-11',lastMaintenance:'2026-06-01',notes:''},

    {id:'EMS-CL3-DT-001',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 3',serial:'CEU-CL3-PC-101',status:'Operational',condition:'Good',dateAcquired:'2024-08-09',lastMaintenance:'2026-07-25',notes:'Station 1.'},
    {id:'EMS-CL3-DT-002',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 3',serial:'CEU-CL3-PC-102',status:'Operational',condition:'Good',dateAcquired:'2024-08-09',lastMaintenance:'2026-07-25',notes:'Station 2.'},
    {id:'EMS-CL3-DT-003',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 3',serial:'CEU-CL3-PC-103',status:'Operational',condition:'Fair',dateAcquired:'2022-03-04',lastMaintenance:'2026-03-11',notes:'Station 3.'},
    {id:'EMS-CL3-DT-004',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 3',serial:'CEU-CL3-PC-104',status:'Missing',condition:'Poor',dateAcquired:'2021-08-19',lastMaintenance:'2025-07-30',notes:'Unaccounted for after semester-break inventory count.'},
    {id:'EMS-CL3-CAM-001',name:'USB Webcam',category:'Webcam',location:'Computer Laboratory 3',serial:'CEU-CL3-CAM-01',status:'Operational',condition:'Good',dateAcquired:'2024-08-09',lastMaintenance:'2026-07-25',notes:''},
    {id:'EMS-CL3-HS-001',name:'Headset Set',category:'Headset',location:'Computer Laboratory 3',serial:'CEU-CL3-HS-01',status:'Operational',condition:'Fair',dateAcquired:'2023-11-02',lastMaintenance:'2026-05-14',notes:''},

    {id:'EMS-SVR-NET-001',name:'Core Switch',category:'Router/Switch',location:'Server Room',serial:'CEU-SVR-NET-01',status:'Operational',condition:'Good',dateAcquired:'2023-02-11',lastMaintenance:'2026-06-01',notes:''},
    {id:'EMS-SVR-UPS-001',name:'Server Room UPS',category:'UPS',location:'Server Room',serial:'CEU-SVR-UPS-01',status:'Operational',condition:'Good',dateAcquired:'2023-11-02',lastMaintenance:'2026-05-14',notes:''},
  ],

  incidents: [
    {id:'INC-0001',equipmentId:'EMS-CL1-DT-005',reportedByUserId:'u-faculty-1',reportedByName:'Juan Dela Cruz',reportedByDepartment:'College of Information Technology',dateReported:'2026-07-28',category:'Damaged',description:'Unit does not power on; suspected PSU failure.',status:'In Progress',priority:'High',remarks:'Escalated to supplier for a PSU replacement quote.',resolvedDate:null},
    {id:'INC-0002',equipmentId:'EMS-CL1-DT-003',reportedByUserId:null,reportedByName:'Andrea Reyes',reportedByDepartment:'College of Information Technology',dateReported:'2026-06-30',category:'Malfunctioning',description:'Frequent blue-screen errors during lab exercises.',status:'In Progress',priority:'Medium',remarks:'Technician re-seated RAM modules; monitoring for recurrence.',resolvedDate:null},
    {id:'INC-0003',equipmentId:'EMS-CL1-PRJ-001',reportedByUserId:null,reportedByName:'Kevin Manalo',reportedByDepartment:'College of Information Technology',dateReported:'2026-06-02',category:'Malfunctioning',description:'Projected image is dim even at full brightness.',status:'Pending',priority:'Medium',remarks:'',resolvedDate:null},
    {id:'INC-0004',equipmentId:'EMS-CL2-DT-002',reportedByUserId:null,reportedByName:'Bea Fernandez',reportedByDepartment:'College of Information Technology',dateReported:'2026-07-20',category:'Damaged',description:'Casing cracked after accidental fall; RAM slot appears loose.',status:'Pending',priority:'High',remarks:'',resolvedDate:null},
    {id:'INC-0005',equipmentId:'EMS-CL2-PRT-001',reportedByUserId:null,reportedByName:'Paulo Ramirez',reportedByDepartment:'College of Information Technology',dateReported:'2026-06-15',category:'Malfunctioning',description:'Printer repeatedly jams on the second page of any print job.',status:'In Progress',priority:'Low',remarks:'Awaiting replacement roller kit from supplier.',resolvedDate:null},
    {id:'INC-0006',equipmentId:'EMS-CL3-DT-004',reportedByUserId:null,reportedByName:'Nicole Aquino',reportedByDepartment:'College of Information Technology',dateReported:'2026-06-05',category:'Missing',description:'Unit was not found at Station 4 during the semester-break inventory count.',status:'Pending',priority:'Critical',remarks:'',resolvedDate:null},
    {id:'INC-0007',equipmentId:'EMS-CL1-DT-001',reportedByUserId:'u-faculty-1',reportedByName:'Juan Dela Cruz',reportedByDepartment:'College of Information Technology',dateReported:'2026-03-14',category:'Malfunctioning',description:'Mouse pointer freezes intermittently during use.',status:'Resolved',priority:'Low',remarks:'Replaced faulty USB port cable.',resolvedDate:'2026-03-18'},
    {id:'INC-0008',equipmentId:'EMS-CL2-DT-004',reportedByUserId:null,reportedByName:'Trisha Domingo',reportedByDepartment:'College of Information Technology',dateReported:'2026-02-22',category:'Other',description:'Sticky spacebar key, difficult to type accurately.',status:'Resolved',priority:'Low',remarks:'Keyboard cleaned and lubricated.',resolvedDate:'2026-02-25'},
    {id:'INC-0009',equipmentId:'EMS-CL3-DT-003',reportedByUserId:null,reportedByName:'Marco Villanueva',reportedByDepartment:'College of Information Technology',dateReported:'2026-04-09',category:'Malfunctioning',description:'Monitor output flickers intermittently.',status:'Resolved',priority:'Medium',remarks:'Replaced HDMI cable.',resolvedDate:'2026-04-14'},
    {id:'INC-0010',equipmentId:'EMS-CL1-UPS-001',reportedByUserId:null,reportedByName:'Angeline Cruz',reportedByDepartment:'College of Information Technology',dateReported:'2026-05-02',category:'Other',description:'UPS emits a beeping sound during minor power fluctuations.',status:'Rejected',priority:'Low',remarks:'Confirmed normal UPS behavior during a brownout; no defect found.',resolvedDate:'2026-05-04'},
    {id:'INC-0011',equipmentId:'EMS-CL2-DT-001',reportedByUserId:'u-faculty-1',reportedByName:'Juan Dela Cruz',reportedByDepartment:'College of Information Technology',dateReported:'2026-07-01',category:'Malfunctioning',description:'System runs unusually slow when opening multiple programming IDEs.',status:'Pending',priority:'Medium',remarks:'',resolvedDate:null},
    {id:'INC-0012',equipmentId:'EMS-CL1-DT-004',reportedByUserId:null,reportedByName:'Camille Navarro',reportedByDepartment:'College of Information Technology',dateReported:'2026-01-18',category:'Malfunctioning',description:'USB ports on the front panel are unresponsive.',status:'Resolved',priority:'Low',remarks:'Reconnected front-panel USB header.',resolvedDate:'2026-01-20'},
    {id:'INC-0013',equipmentId:'EMS-CL3-CAM-001',reportedByUserId:null,reportedByName:'Ella Mercado',reportedByDepartment:'College of Information Technology',dateReported:'2026-07-15',category:'Malfunctioning',description:'Webcam image appears blurry during online class recordings.',status:'Pending',priority:'Low',remarks:'',resolvedDate:null},
    {id:'INC-0014',equipmentId:'EMS-CL2-NET-001',reportedByUserId:null,reportedByName:'Diego Salazar',reportedByDepartment:'College of Information Technology',dateReported:'2026-05-27',category:'Malfunctioning',description:'Intermittent loss of network connectivity in the last row of units.',status:'Resolved',priority:'Medium',remarks:'Replaced a faulty Ethernet switch port.',resolvedDate:'2026-06-01'},
  ],

  users: [
    {id:'u-admin-1',username:'admin.tech',email:'',role:'admin',name:'ICTRAX Administrator',title:'ICT Laboratory Administrator',initials:'IA'},
    {id:'u-faculty-1',username:'faculty.ce',email:'faculty.demo@mls.ceu.edu.ph',role:'faculty',name:'Faculty Demo',facultyId:'FAC-001',department:'College of Information Technology',initials:'FD'},
  ],
};


/* ---------- authenticated API + server-backed data ---------- */
async function apiRequest(endpoint, options = {}) {
  const {
    skipAuthFailureHandling = false,
    headers: suppliedHeaders = {},
    ...fetchOptions
  } = options;
  const method = String(fetchOptions.method || 'GET').toUpperCase();
  const headers = new Headers(suppliedHeaders);
  headers.set('Accept', 'application/json');
  if(fetchOptions.body !== undefined && !(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')){
    headers.set('Content-Type', 'application/json');
  }
  if(!['GET','HEAD','OPTIONS'].includes(method) && csrfToken){
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    credentials:'same-origin',
    cache:'no-store',
    ...fetchOptions,
    method,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.data = payload.data ?? null;
    // A 403 means the signed-in user lacks permission for this operation; it
    // must not be treated as an expired session. Only a 401 ends the session.
    if(!skipAuthFailureHandling && response.status===401 && currentPage()!=='login'){
      if(payload.reason==='idle_timeout') void expireInactiveSession();
      else void terminateSessionAndReturnToLogin({reason:'server-authorization-rejected'});
    }
    throw error;
  }

  return payload;
}

async function loadPersistedDb(){
  const [equipmentRes, incidentsRes, catalogRes] = await Promise.all([
    apiRequest('equipment.php'),
    apiRequest('incidents.php'),
    apiRequest('catalog.php'),
  ]);

  if(!equipmentRes.success || !Array.isArray(equipmentRes.data)) throw new Error(equipmentRes.message || 'Equipment data is unavailable.');
  if(!incidentsRes.success || !Array.isArray(incidentsRes.data)) throw new Error(incidentsRes.message || 'Incident data is unavailable.');
  if(!catalogRes.success || !Array.isArray(catalogRes.categories) || !Array.isArray(catalogRes.locations)){
    throw new Error(catalogRes.message || 'Equipment categories and locations are unavailable.');
  }

  DB.equipment = equipmentRes.data;
  DB.incidents = incidentsRes.data;
  catalogState.categoryRecords = catalogRes.categories;
  catalogState.categories = catalogRes.categories.map(x=>x.name);
  catalogState.locationRecords = catalogRes.locations;
  catalogState.locations = catalogRes.locations.map(x=>x.name);
  incidentSeq = DB.incidents.length;
  purgeLegacyClientData();
}

function stopIncidentNotifications(){
  incidentNotificationGeneration += 1;
  if(incidentNotificationTimer !== null){
    clearTimeout(incidentNotificationTimer);
    incidentNotificationTimer = null;
  }
  incidentNotificationInFlight = false;
}

function incidentNotificationCursorKey(user=state.user){
  return user?.id ? `${INCIDENT_NOTIFICATION_CURSOR_PREFIX}${String(user.id)}` : '';
}

function readIncidentNotificationCursor(){
  const key=incidentNotificationCursorKey();
  if(!key) return null;
  try{
    const cursor=localStorage.getItem(key);
    if(cursor && /^\d+$/.test(cursor)) return cursor;
  }catch(error){}
  try{
    // Migrate the old tab-only cursor so notifications created while the user
    // is signed in under the other role are not lost on the next login.
    const legacyCursor=sessionStorage.getItem(key);
    if(legacyCursor && /^\d+$/.test(legacyCursor)){
      try{ localStorage.setItem(key,legacyCursor); }catch(error){}
      return legacyCursor;
    }
  }catch(error){}
  return null;
}

function storeIncidentNotificationCursor(cursor){
  const key=incidentNotificationCursorKey();
  if(!key || !/^\d+$/.test(String(cursor))) return;
  try{
    localStorage.setItem(key,String(cursor));
    sessionStorage.removeItem(key);
    return;
  }catch(error){}
  try{ sessionStorage.setItem(key,String(cursor)); }catch(error){}
}

function notificationStorageKey(user=state.user){
  return `${NOTIFICATIONS_STORAGE_KEY}_${user?.role || 'guest'}_${user?.id || 'unknown'}`;
}

function getNotifications(){
  if(!state.user) return [];
  try{
    const parsed=JSON.parse(sessionStorage.getItem(notificationStorageKey()) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  }catch(error){
    return [];
  }
}

function saveNotifications(notifications){
  if(!state.user) return;
  try{
    sessionStorage.setItem(notificationStorageKey(),JSON.stringify(notifications.slice(0,50)));
  }catch(error){
    console.warn('ICTRAX: notifications could not be saved.',error);
  }
}

function warrantyNotificationSeenKey(user=state.user){
  return `${WARRANTY_NOTIFICATION_SEEN_KEY}_${user?.id || 'unknown'}`;
}

function hasSeenWarrantyNotification(id){
  try{
    const ids=JSON.parse(localStorage.getItem(warrantyNotificationSeenKey()) || '[]');
    return Array.isArray(ids) && ids.includes(id);
  }catch(error){
    return false;
  }
}

function markWarrantyNotificationSeen(id){
  try{
    const key=warrantyNotificationSeenKey();
    const stored=JSON.parse(localStorage.getItem(key) || '[]');
    const ids=Array.isArray(stored) ? stored.filter(value=>typeof value==='string') : [];
    if(!ids.includes(id)) ids.push(id);
    localStorage.setItem(key,JSON.stringify(ids.slice(-200)));
  }catch(error){}
}

function addIncidentNotification(event){
  const kind=event?.kind;
  const isWarranty=kind==='warranty_expiring';
  const isRepairVerification=kind==='repair_verified'||kind==='repair_disputed';
  const reportId=String(event?.incidentId || '');
  const equipmentId=String(event?.equipmentId || '');
  const targetId=isWarranty ? equipmentId : reportId;
  if(!targetId || !['new_report','status_change','repair_verified','repair_disputed','warranty_expiring'].includes(kind)) return false;
  const id=event?.eventId
    ? `event-${String(event.eventId)}`
    : `${kind}-${targetId}-${String(event?.status || event?.verificationStatus || event?.warrantyExpiration || '')}`;
  if(isWarranty && hasSeenWarrantyNotification(id)) return false;
  const daysRemaining=Number(event?.daysRemaining);
  const warrantyTiming=daysRemaining===0
    ? 'expires today'
    : `expires in ${Number.isFinite(daysRemaining)?daysRemaining:'30'} day${daysRemaining===1?'':'s'}`;
  const notification={
    id,
    type:kind,
    targetType:isWarranty?'equipment':'incident',
    targetId,
    reportId:isWarranty?'':reportId,
    title:kind==='new_report'
      ? 'New incident report'
      : kind==='status_change'
        ? 'Incident status updated'
        : kind==='repair_verified'
          ? 'Repair verified by submitter'
          : kind==='repair_disputed'
            ? 'Repair reported as not accomplished'
            : 'Warranty expiring soon',
    message:kind==='new_report'
      ? `${event.reporterName || 'Faculty/Non-Teaching'} submitted a new report.`
      : kind==='status_change'
        ? `${reportId} is now ${event.status || 'Updated'}.`
        : isRepairVerification
          ? `${reportId} was marked ${event.verificationStatus || 'Updated'} by its submitter.`
          : `${equipmentId}${event.equipmentName?` (${event.equipmentName})`:''} ${warrantyTiming} on ${event.warrantyExpiration || 'the recorded date'}.`,
    createdAt:event.createdAt || new Date().toISOString(),
    read:false,
  };
  const notifications=getNotifications();
  if(notifications.some(item=>item.id===notification.id)) return false;
  saveNotifications([notification,...notifications]);
  renderNotificationControl();
  return true;
}

function formatNotificationDate(value){
  const date=new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
}

function toggleNotificationPanel(){
  const willOpen=!notificationPanelOpen;
  if(willOpen) closeAccountPanel();
  notificationPanelOpen=willOpen;
  renderNotificationControl();
  $('.notification-button')?.focus();
}

function closeNotificationPanel(){
  if(!notificationPanelOpen) return;
  notificationPanelOpen=false;
  renderNotificationControl();
}

function markNotificationRead(id){
  const current=getNotifications();
  const selected=current.find(item=>item.id===id);
  if(selected?.type==='warranty_expiring') markWarrantyNotificationSeen(id);
  const notifications=current.map(item=>item.id===id?{...item,read:true}:item);
  saveNotifications(notifications);
  renderNotificationControl();
}

function clearNotifications(){
  const notifications=getNotifications();
  notifications.filter(item=>item.type==='warranty_expiring').forEach(item=>markWarrantyNotificationSeen(item.id));
  saveNotifications([]);
  notificationPanelOpen=true;
  renderNotificationControl();
}

function openNotificationIncident(reportId){
  if(!DB.incidents.some(incident=>incident.id===reportId)){
    toast('This incident report is no longer available.','bad');
    return;
  }
  openIncidentModal(reportId);
}

function openNotificationTarget(targetType,targetId){
  if(targetType==='equipment'){
    if(!DB.equipment.some(equipment=>equipment.id===targetId)){
      toast('This equipment record is no longer available.','bad');
      return;
    }
    void openEquipmentInformationModal(targetId,{showServiceCardAction:state.user?.role==='admin',source:'notification'});
    return;
  }
  openNotificationIncident(targetId);
}

function viewNotificationDetails(id){
  const notification=getNotifications().find(item=>item.id===id);
  if(!notification) return;
  markNotificationRead(id);
  closeNotificationPanel();
  openNotificationTarget(notification.targetType || 'incident',notification.targetId || notification.reportId);
}

function jumpToNotification(id){
  const notification=getNotifications().find(item=>item.id===id);
  if(!notification) return;
  markNotificationRead(id);
  closeNotificationPanel();
  const targetType=notification.targetType || 'incident';
  const targetId=notification.targetId || notification.reportId;
  const incident=targetType==='incident' ? DB.incidents.find(item=>item.id===targetId) : null;
  const destination=targetType==='equipment'
    ? 'equipment'
    : incident?.status==='Resolved'
      ? 'completed'
      : state.user?.role==='admin' ? 'incidents' : 'myreports';
  if(currentPage()===destination){
    openNotificationTarget(targetType,targetId);
    return;
  }
  try{ sessionStorage.setItem(PENDING_NOTIFICATION_JUMP_KEY,JSON.stringify({targetType,targetId})); }
  catch(error){}
  navigate(destination);
}

function handleNotificationOutsideClick(event){
  const path=typeof event.composedPath==='function' ? event.composedPath() : [];
  const originatedInsideControl=path.some(node=>node?.classList?.contains('notification-control'));
  if(!originatedInsideControl && !event.target.closest('.notification-control')) closeNotificationPanel();
}

function handleNotificationKeydown(event){
  if(event.key==='Escape') closeNotificationPanel();
}

function toggleAccountPanel(){
  const willOpen=!accountPanelOpen;
  if(willOpen) closeNotificationPanel();
  accountPanelOpen=willOpen;
  renderAccountControl();
  $('.account-button')?.focus();
}

function closeAccountPanel(){
  if(!accountPanelOpen) return;
  accountPanelOpen=false;
  renderAccountControl();
}

function handleAccountOutsideClick(event){
  const path=typeof event.composedPath==='function' ? event.composedPath() : [];
  const originatedInsideControl=path.some(node=>node?.classList?.contains('account-control'));
  if(!originatedInsideControl && !event.target.closest('.account-control')) closeAccountPanel();
}

function handleAccountKeydown(event){
  if(event.key==='Escape') closeAccountPanel();
}

function renderAccountControl(){
  const actions=$('#topbar .top-actions');
  if(!actions) return;
  let control=actions.querySelector('.account-control');
  if(!state.user){
    control?.remove();
    document.removeEventListener('click',handleAccountOutsideClick);
    document.removeEventListener('keydown',handleAccountKeydown);
    return;
  }
  if(!control){
    control=document.createElement('div');
    control.className='account-control';
    actions.appendChild(control);
  }
  const roleLabel=state.user.role==='admin' ? 'ICT Administrator' : 'Faculty/Non-Teaching';
  const accountDetail=state.user.role==='admin'
    ? state.user.title || roleLabel
    : state.user.department || roleLabel;
  control.innerHTML=`
    <button class="account-button${accountPanelOpen?' active':''}" type="button"
      aria-label="Account options for ${esc(state.user.name)}" aria-haspopup="menu"
      aria-expanded="${accountPanelOpen}" aria-controls="account-panel">
      <span class="account-avatar" aria-hidden="true">${esc(state.user.initials||'U')}</span>
      <span class="account-button-copy"><strong>${esc(state.user.name)}</strong><small>${esc(roleLabel)}</small></span>
      <span class="account-chevron" aria-hidden="true">${icon('chevron')}</span>
    </button>
    ${accountPanelOpen?`<div class="account-panel" id="account-panel" role="menu" aria-label="Account options">
      <div class="account-panel-head">
        <span class="account-avatar account-avatar-large" aria-hidden="true">${esc(state.user.initials||'U')}</span>
        <div><strong>${esc(state.user.name)}</strong><span>${esc(state.user.email||'Authorized ICTRAX account')}</span></div>
      </div>
      <div class="account-panel-details">
        <div><span>Role</span><strong>${esc(roleLabel)}</strong></div>
        <div><span>${state.user.role==='admin'?'Title':'Department'}</span><strong>${esc(accountDetail)}</strong></div>
      </div>
      <button class="account-signout" type="button" role="menuitem" onclick="logout()">${icon('logout')}<span>Sign out</span></button>
    </div>`:''}
  `;
  const button=control.querySelector('.account-button');
  button?.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    toggleAccountPanel();
  });
  document.removeEventListener('click',handleAccountOutsideClick);
  document.removeEventListener('keydown',handleAccountKeydown);
  if(accountPanelOpen){
    document.addEventListener('click',handleAccountOutsideClick);
    document.addEventListener('keydown',handleAccountKeydown);
  }
}

function renderNotificationControl(){
  const actions=$('#topbar .top-actions');
  if(!actions) return;
  let control=actions.querySelector('.notification-control');
  if(!state.user){
    control?.remove();
    return;
  }
  if(!control){
    control=document.createElement('div');
    control.className='notification-control';
    actions.appendChild(control);
  }
  const notifications=getNotifications();
  const unread=notifications.filter(item=>!item.read).length;
  const unreadLabel=unread===1 ? '1 unread notification' : `${unread} unread notifications`;
  control.innerHTML=`
    <button class="notification-button${notificationPanelOpen?' active':''}" type="button"
      aria-label="Notifications${unread?` (${unreadLabel})`:''}" aria-expanded="${notificationPanelOpen}"
      aria-controls="notification-panel">
      ${icon('bell')}${unread?`<span class="notification-count" aria-hidden="true">${unread>99?'99+':unread}</span>`:''}
    </button>
    ${notificationPanelOpen?`<div class="notification-panel" id="notification-panel" role="dialog" aria-label="Notifications">
      <div class="notification-panel-head"><strong>Notifications</strong><span>${unread?unreadLabel:'All caught up'}</span></div>
      <div class="notification-list">${notifications.length?notifications.map(item=>`
        <article class="notification-item${item.read?'':' unread'}">
          <div class="notification-item-copy"><strong>${esc(item.title)}</strong><p>${esc(item.message)}</p><time datetime="${esc(item.createdAt)}">${esc(formatNotificationDate(item.createdAt))}</time></div>
          <div class="notification-item-actions">
            <button type="button" onclick="viewNotificationDetails('${jsString(item.id)}')">View details</button>
            <button type="button" onclick="jumpToNotification('${jsString(item.id)}')">${item.targetType==='equipment'?'Jump to equipment':'Jump to report'}</button>
          </div>
        </article>`).join(''):'<div class="notification-empty">No notifications yet.</div>'}</div>
      <div class="notification-panel-foot"><button type="button" onclick="clearNotifications()" aria-label="Clear all notifications">Clear</button></div>
    </div>`:''}
  `;
  const button=control.querySelector('.notification-button');
  button?.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    toggleNotificationPanel();
  });
  document.removeEventListener('click',handleNotificationOutsideClick);
  document.removeEventListener('keydown',handleNotificationKeydown);
  if(notificationPanelOpen){
    document.addEventListener('click',handleNotificationOutsideClick);
    document.addEventListener('keydown',handleNotificationKeydown);
  }
}

async function checkForIncidentNotifications(generation=incidentNotificationGeneration){
  if(generation!==incidentNotificationGeneration || incidentNotificationInFlight || !state.user?.role) return;
  incidentNotificationInFlight=true;
  let nextDelay=INCIDENT_NOTIFICATION_INTERVAL;
  const expectedUserId=String(state.user.id);
  try{
    const cursor=readIncidentNotificationCursor();
    const endpoint=cursor===null
      ? `${INCIDENT_NOTIFICATION_ENDPOINT}?bootstrap=1`
      : `${INCIDENT_NOTIFICATION_ENDPOINT}?after=${encodeURIComponent(cursor)}`;
    const response=await apiRequest(endpoint);
    if(!response.success || !/^\d+$/.test(String(response.cursor)) || !Array.isArray(response.notifications)){
      throw new Error(response.message || 'Notifications could not be loaded.');
    }
    if(generation!==incidentNotificationGeneration || String(state.user?.id)!==expectedUserId) return;

    const incidentUpdates=response.notifications.filter(notification=>['new_report','status_change','repair_verified','repair_disputed'].includes(notification.kind));
    if(incidentUpdates.length){
      const incidentsResponse=await apiRequest('incidents.php');
      if(!incidentsResponse.success || !Array.isArray(incidentsResponse.data)){
        throw new Error(incidentsResponse.message || 'Incident reports could not be refreshed.');
      }
      if(generation!==incidentNotificationGeneration || String(state.user?.id)!==expectedUserId) return;
      DB.incidents=incidentsResponse.data;
      incidentSeq=DB.incidents.length;
    }

    storeIncidentNotificationCursor(response.cursor);
    let notificationAdded=false;
    response.notifications.forEach(notification=>{
      const wasAdded=addIncidentNotification(notification);
      if(!wasAdded) return;
      notificationAdded=true;
      if(notification.kind==='new_report'){
        toast(`New report received from ${notification.reporterName || 'Faculty/Non-Teaching'}`, 'info', 6500);
      }else if(notification.kind==='status_change'){
        toast(incidentStatusToastMessage(notification.incidentId,notification.status), 'info', 6500);
      }else if(notification.kind==='repair_verified'){
        toast(`${notification.incidentId || 'Incident'} was verified as accomplished`, 'info', 6500);
      }else if(notification.kind==='repair_disputed'){
        toast(`${notification.incidentId || 'Incident'} was reopened by the submitter`, 'info', 6500);
      }else if(notification.kind==='warranty_expiring'){
        const remaining=Number(notification.daysRemaining);
        const timing=remaining===0 ? 'expires today' : `expires in ${remaining} day${remaining===1?'':'s'}`;
        toast(`${notification.equipmentId || 'Equipment'} warranty ${timing}`, 'info', 6500);
      }
    });

    if(notificationAdded){
      renderSidebar();
    }
    if(notificationAdded
      && ['dashboard','incidents','completed','myreports'].includes(currentPage())
      && !$('#modal-root')?.classList.contains('open')){
      const renderFn = VIEWS[currentPage()];
      if(renderFn && $('#view-root')) $('#view-root').innerHTML = renderFn();
    }
    if(response.hasMore) nextDelay=0;
  }catch(error){
    console.warn('ICTRAX: incident notifications could not be refreshed.', error);
  }finally{
    if(generation===incidentNotificationGeneration && state.user?.role){
      incidentNotificationInFlight=false;
      incidentNotificationTimer=setTimeout(
        ()=>void checkForIncidentNotifications(generation),
        nextDelay
      );
    }
  }
}

function startIncidentNotifications(){
  stopIncidentNotifications();
  if(!state.user?.role) return;
  const generation=incidentNotificationGeneration;
  void checkForIncidentNotifications(generation);
}

function saveDb(){
  // Database records must not survive logout in persistent browser storage.
  // Mutations are already committed by the API before this compatibility
  // hook is called, so only remove data left by older frontend versions.
  purgeLegacyClientData();
}
function setSessionUser(user){
  state.user = user;
  try{
    const payload = {
      ...user,
      id: String(user.id),
      username: user.username || '',
      role: user.role || 'faculty'
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }catch(err){}
}
function clearSession(){
  authLifecycleGeneration += 1;
  stopSessionInactivityMonitor({clearSharedActivity:true});
  stopIncidentNotifications();
  notificationPanelOpen=false;
  document.removeEventListener('click',handleNotificationOutsideClick);
  document.removeEventListener('keydown',handleNotificationKeydown);
  // Keep each user's numeric notification cursor across role changes/logouts.
  // Without it, signing into the other role resets the feed to "now" and
  // silently skips the report/status event that just happened.
  state.user = null;
  csrfToken = '';
  try{
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PRESET_KEY);
    sessionStorage.removeItem(SERVICE_CARD_STORAGE_KEY);
  }catch(err){}
  purgeLegacyClientData();
}

function readSharedSessionActivity(){
  try{
    const parsed=JSON.parse(localStorage.getItem(SESSION_ACTIVITY_STORAGE_KEY) || 'null');
    if(!parsed || typeof parsed!=='object') return null;
    const at=Number(parsed.at);
    return parsed.userId && Number.isFinite(at) ? {userId:String(parsed.userId),at} : null;
  }catch(error){ return null; }
}

function writeSharedSessionActivity(at,force=false){
  if(!sessionActivityUserId) return;
  const remainingShareDelay=SESSION_ACTIVITY_SHARE_INTERVAL_MS-(at-sessionLastSharedActivityAt);
  if(!force && remainingShareDelay>0){
    if(sessionActivityShareTimer===null){
      sessionActivityShareTimer=setTimeout(()=>{
        sessionActivityShareTimer=null;
        writeSharedSessionActivity(sessionLastActivityAt,true);
      },remainingShareDelay);
    }
    return;
  }
  if(sessionActivityShareTimer!==null){
    clearTimeout(sessionActivityShareTimer);
    sessionActivityShareTimer=null;
  }
  sessionLastSharedActivityAt=at;
  try{
    localStorage.setItem(SESSION_ACTIVITY_STORAGE_KEY,JSON.stringify({userId:sessionActivityUserId,at}));
  }catch(error){}
}

function scheduleSessionInactivityCheck(){
  if(sessionInactivityTimer!==null) clearTimeout(sessionInactivityTimer);
  if(!sessionActivityMonitoring || sessionInactivityLogoutStarted) return;
  const remaining=Math.max(0,sessionIdleTimeoutMs-(Date.now()-sessionLastActivityAt));
  sessionInactivityTimer=setTimeout(checkSessionInactivity,remaining+25);
}

function checkSessionInactivity(){
  sessionInactivityTimer=null;
  if(!sessionActivityMonitoring || sessionInactivityLogoutStarted) return;
  const sharedActivity=readSharedSessionActivity();
  if(sharedActivity?.userId===sessionActivityUserId && sharedActivity.at>sessionLastActivityAt){
    sessionLastActivityAt=sharedActivity.at;
  }
  if(Date.now()-sessionLastActivityAt>=sessionIdleTimeoutMs){
    void expireInactiveSession();
    return;
  }
  scheduleSessionInactivityCheck();
}

async function synchronizeActiveSession(){
  if(sessionKeepAliveInFlight || sessionInactivityLogoutStarted || !state.user) return;
  sessionKeepAliveInFlight=true;
  sessionLastServerSyncAt=Date.now();
  try{
    const session=await requestServerSession();
    if(!session.authenticated){
      if(session.reason==='idle_timeout') await expireInactiveSession();
      else await terminateSessionAndReturnToLogin({reason:'session-revalidation-rejected'});
      return;
    }
    csrfToken=session.csrfToken;
  }catch(error){
    // A transient network failure must not extend or prematurely end the
    // locally measured inactivity window. The next activity will retry.
  }finally{
    sessionKeepAliveInFlight=false;
  }
}

function recordSessionUserActivity(){
  if(!sessionActivityMonitoring || sessionInactivityLogoutStarted || !state.user) return;
  const now=Date.now();
  if(now-sessionLastActivityAt>=sessionIdleTimeoutMs){
    void expireInactiveSession();
    return;
  }
  sessionLastActivityAt=now;
  writeSharedSessionActivity(now);
  if(now-sessionLastServerSyncAt>=SESSION_ACTIVITY_SYNC_INTERVAL_MS){
    void synchronizeActiveSession();
  }
}

function handleSessionVisibilityOrFocus(){
  if(document.hidden || !sessionActivityMonitoring || sessionInactivityLogoutStarted) return;
  if(Date.now()-sessionLastActivityAt>=sessionIdleTimeoutMs){
    void expireInactiveSession();
    return;
  }
  recordSessionUserActivity();
}

function startSessionInactivityMonitor(){
  stopSessionInactivityMonitor();
  if(currentPage()==='login' || !state.user?.id) return;
  sessionActivityMonitoring=true;
  sessionInactivityLogoutStarted=false;
  sessionActivityUserId=String(state.user.id);
  const now=Date.now();
  sessionLastActivityAt=now;
  sessionLastSharedActivityAt=0;
  sessionLastServerSyncAt=now;
  writeSharedSessionActivity(now);
  SESSION_ACTIVITY_EVENTS.forEach(eventName=>{
    document.addEventListener(eventName,recordSessionUserActivity,{capture:true,passive:true});
  });
  document.addEventListener('visibilitychange',handleSessionVisibilityOrFocus);
  window.addEventListener('focus',handleSessionVisibilityOrFocus);
  scheduleSessionInactivityCheck();
}

function stopSessionInactivityMonitor({clearSharedActivity=false}={}){
  if(sessionInactivityTimer!==null){
    clearTimeout(sessionInactivityTimer);
    sessionInactivityTimer=null;
  }
  if(sessionActivityShareTimer!==null){
    clearTimeout(sessionActivityShareTimer);
    sessionActivityShareTimer=null;
  }
  SESSION_ACTIVITY_EVENTS.forEach(eventName=>{
    document.removeEventListener(eventName,recordSessionUserActivity,true);
  });
  document.removeEventListener('visibilitychange',handleSessionVisibilityOrFocus);
  window.removeEventListener('focus',handleSessionVisibilityOrFocus);
  if(clearSharedActivity && sessionActivityUserId){
    const sharedActivity=readSharedSessionActivity();
    if(sharedActivity?.userId===sessionActivityUserId){
      try{ localStorage.removeItem(SESSION_ACTIVITY_STORAGE_KEY); }
      catch(error){}
    }
  }
  sessionActivityMonitoring=false;
  sessionActivityUserId='';
}

function returnToLoginAfterInactivity(){
  if(sessionTimeoutRedirectTimer!==null){
    clearTimeout(sessionTimeoutRedirectTimer);
    sessionTimeoutRedirectTimer=null;
  }
  concealProtectedPage();
  markLogoutRedirect('idle-timeout',false);
  window.location.replace('index.html');
}

async function expireInactiveSession(){
  if(sessionInactivityLogoutStarted || currentPage()==='login' || !state.user) return;
  sessionInactivityLogoutStarted=true;
  const token=csrfToken;
  stopSessionInactivityMonitor({clearSharedActivity:true});
  disableGoogleAutoSelect();
  clearSession();
  state.view=null;
  state.presetEquipId=null;
  broadcastLogout('idle-timeout');
  void stopQrScanner();
  openModal(`<div class="modal-head"><div><h3>Session timeout</h3><div class="modal-sub">Your ICTRAX session has ended.</div></div></div>
    <div class="modal-body"><div class="banner banner-amber">${icon('alert')}<div>User logged-out, the user is inactive for too long</div></div><p class="hint" style="margin-top:14px">Returning to the log-in page automatically...</p></div>
    <div class="modal-foot"><button class="btn btn-primary" type="button" onclick="returnToLoginAfterInactivity()">Return to log-in</button></div>`,{dismissible:false});
  logoutOperation=Promise.race([
    terminateServerSession(token),
    new Promise(resolve=>setTimeout(()=>resolve(false),2000)),
  ]);
  sessionTimeoutRedirectTimer=setTimeout(returnToLoginAfterInactivity,SESSION_TIMEOUT_REDIRECT_DELAY_MS);
  await logoutOperation;
}
function currentPage(){
  const page = document.body?.dataset.page || 'login';
  if(page==='dashboard'){
    const requestedView = new URLSearchParams(window.location.search).get('view');
    if(requestedView && Object.prototype.hasOwnProperty.call(PAGE_ACCESS,requestedView)) return requestedView;
  }
  return page;
}

function purgeLegacyClientData(){
  try{
    localStorage.removeItem(DB_STORAGE_KEY);
    localStorage.removeItem(SERVICE_CARD_STORAGE_KEY);
  }catch(err){}
}

function navigationWasReload(){
  try{
    const entry = performance.getEntriesByType?.('navigation')?.[0];
    if(entry?.type) return entry.type === 'reload';
    return performance.navigation?.type === 1;
  }catch(err){ return false; }
}

function concealProtectedPage(){
  if(currentPage()!=='login') document.documentElement.style.visibility='hidden';
}

function revealProtectedPage(){
  document.documentElement.style.visibility='';
}

function authEventId(){
  try{ return crypto.randomUUID(); }
  catch(err){ return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

function currentLogoutEventMarker(){
  try{ return localStorage.getItem(AUTH_LOGOUT_EVENT_KEY) || ''; }
  catch(err){ return ''; }
}

function broadcastLogout(reason){
  const payload = {id:authEventId(),reason,at:Date.now()};
  lastHandledLogoutEventId = payload.id;
  try{ localStorage.setItem(AUTH_LOGOUT_EVENT_KEY,JSON.stringify(payload)); }
  catch(err){}
}

function markLogoutRedirect(reason,pending){
  try{
    sessionStorage.setItem(LOGOUT_REDIRECT_GUARD_KEY,JSON.stringify({reason,pending:Boolean(pending),at:Date.now()}));
  }catch(err){}
}

function consumeLogoutRedirect(){
  try{
    const raw=sessionStorage.getItem(LOGOUT_REDIRECT_GUARD_KEY);
    sessionStorage.removeItem(LOGOUT_REDIRECT_GUARD_KEY);
    if(!raw) return null;
    const marker=JSON.parse(raw);
    return marker && Date.now()-Number(marker.at)<15000 ? marker : null;
  }catch(err){ return null; }
}

function consumeForcedLogoutOnArrival(){
  try{
    const timestamp=Number(sessionStorage.getItem(FORCE_LOGOUT_ON_ARRIVAL_KEY));
    sessionStorage.removeItem(FORCE_LOGOUT_ON_ARRIVAL_KEY);
    return Number.isFinite(timestamp) && Date.now()-timestamp<15000;
  }catch(err){ return false; }
}

function disableGoogleAutoSelect(){
  try{ window.google?.accounts?.id?.disableAutoSelect?.(); }
  catch(err){}
}

async function requestServerSession(){
  const response=await fetch(`${API_BASE_URL}/${SESSION_ENDPOINT}`,{
    method:'GET',
    credentials:'same-origin',
    cache:'no-store',
    headers:{'Accept':'application/json'},
  });
  const payload=await response.json().catch(()=>({}));
  if(response.status===401 || payload.authenticated===false){
    return {authenticated:false,user:null,csrfToken:'',reason:String(payload.reason || 'authentication_required')};
  }
  if(!response.ok || payload.authenticated!==true || !payload.user || !payload.csrf_token){
    const error=new Error(payload.message || 'The server could not verify this session.');
    error.status=response.status;
    throw error;
  }
  const idleTimeoutSeconds=Number(payload.idle_timeout_seconds);
  if(Number.isFinite(idleTimeoutSeconds) && idleTimeoutSeconds>=60 && idleTimeoutSeconds<=86400){
    sessionIdleTimeoutMs=idleTimeoutSeconds*1000;
  }
  setRiskReferenceTime(payload.server_time);
  return {authenticated:true,user:payload.user,csrfToken:String(payload.csrf_token),serverTime:payload.server_time||'',idleTimeoutSeconds};
}

async function terminateServerSession(existingToken=''){
  let token=existingToken;
  try{
    if(!token){
      const session=await requestServerSession();
      if(!session.authenticated) return true;
      token=session.csrfToken;
    }
    const headers={'Accept':'application/json','Content-Type':'application/json'};
    if(token) headers['X-CSRF-Token']=token;
    const response=await fetch(`${API_BASE_URL}/logout.php`,{
      method:'POST',
      credentials:'same-origin',
      cache:'no-store',
      keepalive:true,
      headers,
      body:JSON.stringify({csrf_token:token}),
    });
    const payload=await response.json().catch(()=>({}));
    return response.ok && payload.success===true;
  }catch(err){
    try{
      if(token && navigator.sendBeacon){
        const form=new URLSearchParams({csrf_token:token});
        navigator.sendBeacon(`${API_BASE_URL}/logout.php`,form);
      }
    }catch(beaconError){}
    return false;
  }
}

async function terminateSessionAndReturnToLogin({reason='logout',redirect=currentPage()!=='login',broadcast=true}={}){
  if(logoutOperation) return logoutOperation;
  const token=csrfToken;
  disableGoogleAutoSelect();
  clearSession();
  state.view=null;
  state.presetEquipId=null;
  if(broadcast) broadcastLogout(reason);
  if(redirect) concealProtectedPage();

  logoutOperation=(async()=>{
    const completed=await Promise.race([
      terminateServerSession(token),
      new Promise(resolve=>setTimeout(()=>resolve(false),2000)),
    ]);
    if(redirect){
      markLogoutRedirect(reason,!completed);
      window.location.replace('index.html');
    }else{
      logoutOperation=null;
    }
    return completed;
  })();
  return logoutOperation;
}

function redirectRemoteLogoutToLogin(reason='another-tab-logout'){
  disableGoogleAutoSelect();
  clearSession();
  state.view=null;
  state.presetEquipId=null;
  if(currentPage()!=='login'){
    concealProtectedPage();
    markLogoutRedirect(reason,false);
    window.location.replace('index.html');
  }
}

function renderStartupFailure(error){
  const root=$('#view-root');
  if(root){
    root.innerHTML=`<div class="empty-state">${icon('alert')}<h3>Secure data could not be loaded</h3><p>${esc(error?.message || 'Try again after the server connection is restored.')}</p><button class="btn btn-outline" type="button" onclick="retrySecureStartup()">Retry securely</button><button class="btn btn-ghost" type="button" onclick="logout()">Return to sign in</button></div>`;
  }
  revealProtectedPage();
}

async function retrySecureStartup(){
  concealProtectedPage();
  const root=$('#view-root');
  if(root) root.innerHTML='<div class="page-loading">Revalidating the secure session...</div>';
  try{
    const session=await requestServerSession();
    const page=currentPage();
    if(!session.authenticated || !(PAGE_ACCESS[page]||[]).includes(session.user.role)){
      await terminateSessionAndReturnToLogin({reason:'secure-retry-rejected'});
      return;
    }
    csrfToken=session.csrfToken;
    setSessionUser(session.user);
    await loadPersistedDb();
    renderAuthenticatedPage(page);
    revealProtectedPage();
  }catch(error){
    if(!logoutOperation) renderStartupFailure(error);
  }
}

const INITIAL_NAVIGATION_WAS_RELOAD=navigationWasReload();
if(currentPage()!=='login') concealProtectedPage();

window.addEventListener('storage',event=>{
  if(event.key===SESSION_ACTIVITY_STORAGE_KEY && event.newValue && sessionActivityMonitoring){
    const sharedActivity=readSharedSessionActivity();
    if(sharedActivity?.userId===sessionActivityUserId && sharedActivity.at>sessionLastActivityAt){
      sessionLastActivityAt=sharedActivity.at;
      scheduleSessionInactivityCheck();
    }
    return;
  }
  if(event.key!==AUTH_LOGOUT_EVENT_KEY || !event.newValue) return;
  try{
    const payload=JSON.parse(event.newValue);
    if(!payload?.id || payload.id===lastHandledLogoutEventId) return;
    lastHandledLogoutEventId=payload.id;
    redirectRemoteLogoutToLogin(payload.reason);
  }catch(err){}
});

window.addEventListener('pagehide',event=>{
  if(event.persisted && currentPage()!=='login') concealProtectedPage();
});

window.addEventListener('pageshow',event=>{
  if(!event.persisted || currentPage()==='login') return;
  void (async()=>{
    try{
      const session=await requestServerSession();
      const page=currentPage();
      if(!session.authenticated || !(PAGE_ACCESS[page]||[]).includes(session.user.role)){
        await terminateSessionAndReturnToLogin({reason:'back-forward-session-check'});
        return;
      }
      csrfToken=session.csrfToken;
      setSessionUser(session.user);
      await loadPersistedDb();
      navigate(page);
      if(page==='archived') loadArchivedEquipment();
      revealProtectedPage();
    }catch(error){
      await terminateSessionAndReturnToLogin({reason:'back-forward-session-check-failed'});
    }
  })();
});

/* ---------- id counters (seeded from the arrays above) ---------- */
let incidentSeq = DB.incidents.length;
function nextIncidentId(){ incidentSeq++; return 'INC-'+String(incidentSeq).padStart(4,'0'); }
function categoryTagSettings(category){
  const record=catalogState.categoryRecords.find(item=>item.name===category);
  if(record) return record;
  return {name:category,tagIdMode:'automatic',tagPrefix:CATEGORY_CODE[category]||'EQ',tagSequence:'01'};
}
function nextEquipmentId(category){
  const settings=categoryTagSettings(category);
  if(settings.tagIdMode==='manual') return '';
  const stem=`${settings.tagPrefix||'EQ'}${settings.tagSequence||'01'}-`;
  const numbers=DB.equipment.map(item=>{
    const match=String(item.id||'').match(new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(\\d+)$`));
    return match?Number(match[1]):0;
  });
  return stem+String(Math.max(0,...numbers)+1).padStart(2,'0');
}
function equipmentNumberFromTagId(tagId){
  const match=String(tagId||'').match(/-(\d+)$/);
  return match?match[1]:'';
}

/* ---------- date / format helpers ---------- */
function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function fmtDateTime(value){
  if(!value) return '—';
  const date=new Date(String(value).replace(' ','T'));
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
}
let NOW = new Date();
function setRiskReferenceTime(value){
  const serverTime = new Date(value);
  if(!Number.isNaN(serverTime.getTime())) NOW=serverTime;
}
function parseDateOnly(value){
  const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match) return null;
  const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])));
  return date.getUTCFullYear()===Number(match[1]) && date.getUTCMonth()===Number(match[2])-1 && date.getUTCDate()===Number(match[3]) ? date : null;
}
function referenceDayMs(){ return Date.UTC(NOW.getUTCFullYear(),NOW.getUTCMonth(),NOW.getUTCDate()); }
function daysSinceDate(value){
  const date=parseDateOnly(value);
  return date ? Math.max(0,Math.floor((referenceDayMs()-date.getTime())/86400000)) : 0;
}
function daysSinceMaintenance(equip){
  return daysSinceDate(equip.lastMaintenance);
}
function maintenanceAgeLabel(equip){
  const days = daysSinceMaintenance(equip);
  return days===0 ? 'Today' : `${days} day${days===1?'':'s'}`;
}
function todayISO(){ return NOW.toISOString().slice(0,10); }
function daysUntilDate(value){
  const date=parseDateOnly(value);
  return date ? Math.floor((date.getTime()-referenceDayMs())/86400000) : null;
}
function warrantySummary(equipment){
  if(!equipment?.warrantyExpiration) return 'No warranty recorded';
  const days=daysUntilDate(equipment.warrantyExpiration);
  if(days===null) return 'Warranty date unavailable';
  if(days<0) return `Expired ${Math.abs(days)} day${Math.abs(days)===1?'':'s'} ago`;
  if(days===0) return 'Expires today';
  if(days<=30) return `Expires in ${days} day${days===1?'':'s'}`;
  return `Active until ${fmtDate(equipment.warrantyExpiration)}`;
}

/* ============================================================
   RISK ENGINE
   Score 0–100 from current state, history, age, maintenance, and
   condition. Incident history decays over time so old resolved
   problems remain visible without permanently dominating the score.
   ============================================================ */
const RISK_MODEL = Object.freeze({
  version:'2.1',
  weights:Object.freeze({status:20,incidents:25,trend:15,age:10,maintenance:20,condition:10}),
  thresholds:Object.freeze({critical:75,high:50,medium:25}),
  recentWindowDays:90,
  comparisonWindowDays:180,
});
function getIncidentsFor(equipId){ return DB.incidents.filter(i=>i.equipmentId===equipId); }
function maintenanceStalenessScore(daysSinceMaint){
  const days=Math.max(0,Number(daysSinceMaint)||0);
  if(days<=30) return 0;
  if(days<=90) return ((days-30)/60)*5;
  if(days<=180) return 5+((days-90)/90)*7;
  if(days<=365) return 12+((days-180)/185)*5;
  return 17+Math.min((days-365)/365,1)*3;
}
function riskBreakdown(equip){
  const related=getIncidentsFor(equip.id);
  const statusScore={Operational:0,'Under Repair':12,Damaged:20,Missing:20,Condemned:20}[equip.status]||0;

  const scoredIncidents=related.filter(i=>i.status!=='Rejected');
  const priorityWeight={Low:1.5,Medium:3,High:5.5,Critical:8};
  const categoryWeight={Damaged:1.15,Malfunctioning:1,Missing:1.3,Other:.75};
  const categoryCounts={};
  scoredIncidents.forEach(i=>{ categoryCounts[i.category]=(categoryCounts[i.category]||0)+1; });
  const incidentBase=scoredIncidents.reduce((score,incident)=>{
    const ageDays=daysSinceDate(incident.dateReported);
    const recencyWeight=ageDays<=90 ? 1 : ageDays<=180 ? .75 : ageDays<=365 ? .45 : ageDays<=730 ? .2 : .1;
    const stateWeight=incident.status==='Pending' ? 1.25 : incident.status==='In Progress' ? 1.1 : .35;
    return score+(priorityWeight[incident.priority]||3)*(categoryWeight[incident.category]||1)*stateWeight*recencyWeight;
  },0);
  const recurrenceBonus=Object.values(categoryCounts).reduce((sum,count)=>sum+Math.max(Number(count)-1,0)*1.5,0);
  const incidentScore=Math.min(incidentBase+recurrenceBonus,RISK_MODEL.weights.incidents);

  const recentIncidents=scoredIncidents.filter(i=>daysSinceDate(i.dateReported)<=RISK_MODEL.recentWindowDays);
  const previousIncidents=scoredIncidents.filter(i=>{
    const age=daysSinceDate(i.dateReported);
    return age>RISK_MODEL.recentWindowDays && age<=RISK_MODEL.comparisonWindowDays;
  });
  const openIncidents=scoredIncidents.filter(i=>i.status==='Pending'||i.status==='In Progress');
  const recentOpenCount=recentIncidents.filter(i=>i.status==='Pending'||i.status==='In Progress').length;
  const recentCategoryCounts={};
  recentIncidents.forEach(i=>{ recentCategoryCounts[i.category]=(recentCategoryCounts[i.category]||0)+1; });
  const recentRepeatCount=Object.values(recentCategoryCounts).reduce((sum,count)=>sum+Math.max(Number(count)-1,0),0);
  const acceleration=Math.max(recentIncidents.length-previousIncidents.length,0);
  const trendScore=Math.min(
    recentIncidents.length*2.5+acceleration*2+recentOpenCount*1.5+recentRepeatCount*1.5,
    RISK_MODEL.weights.trend
  );

  const ageYears=daysSinceDate(equip.dateAcquired)/365.25;
  const ageScore=Math.min(Math.max(ageYears,0),RISK_MODEL.weights.age);

  const daysSinceMaint=daysSinceMaintenance(equip);
  const maintScore=maintenanceStalenessScore(daysSinceMaint);

  const conditionScore={New:0,Good:1,Fair:5,Poor:10}[equip.condition]||0;
  const rawTotal=Math.round(Math.min(statusScore+incidentScore+trendScore+ageScore+maintScore+conditionScore,100));
  const floorRules=[];
  if(equip.status==='Condemned') floorRules.push({minimum:100,reason:'Condemned lifecycle status'});
  if(equip.status==='Missing') floorRules.push({minimum:85,reason:'Missing asset status'});
  if(equip.status==='Damaged') floorRules.push({minimum:60,reason:'Damaged asset status'});
  if(openIncidents.some(i=>i.priority==='Critical')) floorRules.push({minimum:75,reason:'Open critical-priority incident'});
  if(ageYears>=8 && daysSinceMaint>365 && equip.condition==='Poor') floorRules.push({minimum:75,reason:'Severe age, condition, and maintenance combination'});
  else if(equip.condition==='Poor' && daysSinceMaint>365) floorRules.push({minimum:50,reason:'Poor condition with overdue maintenance'});
  const riskMinimum=floorRules.reduce((minimum,rule)=>Math.max(minimum,rule.minimum),0);
  const riskFloor=Math.max(0,riskMinimum-rawTotal);
  return {
    status:Math.round(statusScore),
    incidents:Math.round(incidentScore),
    trend:Math.round(trendScore),
    age:Math.round(ageScore),
    maintenance:Math.round(maintScore),
    condition:Math.round(conditionScore),
    riskFloor,
    floorReasons:floorRules.filter(rule=>rule.minimum===riskMinimum).map(rule=>rule.reason),
    ageYears,
    daysSinceMaintenance:daysSinceMaint,
    openIncidentCount:openIncidents.length,
    recentIncidentCount:recentIncidents.length,
    previousIncidentCount:previousIncidents.length,
    recurringCategories:Object.entries(categoryCounts).filter(([,count])=>count>1).map(([category])=>category),
    rejectedIncidentCount:related.length-scoredIncidents.length,
    total:Math.round(Math.min(rawTotal+riskFloor,100)),
  };
}
function calcRisk(equip){ return riskBreakdown(equip).total; }
function riskBand(score){
  if(score>=RISK_MODEL.thresholds.critical) return {label:'Critical',color:'red',hex:'#c62828'};
  if(score>=RISK_MODEL.thresholds.high) return {label:'High',color:'orange',hex:'#ef6c00'};
  if(score>=RISK_MODEL.thresholds.medium) return {label:'Medium',color:'yellow',hex:'#f9a825'};
  return {label:'Low',color:'green',hex:'#2e7d32'};
}
function riskBar(score){
  const safeScore=Math.max(0,Math.min(Number(score)||0,100));
  const band=riskBand(safeScore);
  return `<div style="min-width:96px" role="img" aria-label="Risk score ${safeScore} out of 100, ${band.label}"><div class="risk-track"><div class="risk-fill" style="width:${safeScore}%;background:${band.hex}"></div></div>
    <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-500);margin-top:4px">${safeScore}/100 · ${band.label}</div></div>`;
}
function riskReasons(equip,breakdown){
  const reasons=[];
  if(equip.status!=='Operational') reasons.push(`Status is ${equip.status}.`);
  if(breakdown.openIncidentCount) reasons.push(`${breakdown.openIncidentCount} incident(s) remain pending or in progress.`);
  if(breakdown.recurringCategories.length) reasons.push(`Repeated incident pattern: ${breakdown.recurringCategories.join(', ')}.`);
  if(breakdown.recentIncidentCount>breakdown.previousIncidentCount) reasons.push(`Incident activity increased from ${breakdown.previousIncidentCount} to ${breakdown.recentIncidentCount} between consecutive 90-day periods.`);
  if(breakdown.daysSinceMaintenance>90) reasons.push(`Last maintenance was ${breakdown.daysSinceMaintenance} days ago.`);
  if(equip.condition==='Poor'||equip.condition==='Fair') reasons.push(`${equip.condition} equipment condition.`);
  if(breakdown.age>=5) reasons.push(`Equipment age contributes ${breakdown.age}/${RISK_MODEL.weights.age} points.`);
  if(breakdown.riskFloor) reasons.push(`Minimum score applied: ${breakdown.floorReasons.join('; ')}.`);
  if(breakdown.rejectedIncidentCount) reasons.push(`${breakdown.rejectedIncidentCount} rejected incident(s) were excluded from scoring.`);
  return reasons.length?reasons:['No major risk triggers detected.'];
}
function riskTopDrivers(equip,breakdown){
  if(equip.status==='Condemned') return 'Condemned lifecycle status';
  const factors=[
    ['Status',breakdown.status/RISK_MODEL.weights.status],
    ['Incident history',breakdown.incidents/RISK_MODEL.weights.incidents],
    ['Recent trend',breakdown.trend/RISK_MODEL.weights.trend],
    ['Equipment age',breakdown.age/RISK_MODEL.weights.age],
    ['Maintenance',breakdown.maintenance/RISK_MODEL.weights.maintenance],
    ['Condition',breakdown.condition/RISK_MODEL.weights.condition],
  ].filter(([,ratio])=>ratio>0).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([label])=>label);
  return factors.length?factors.join(' + '):'No major drivers';
}
function riskRecommendedAction(equip,breakdown=riskBreakdown(equip)){
  if(equip.status==='Condemned') return {label:'Retire or replace',detail:'Keep unavailable; archive when disposition is complete.'};
  if(equip.status==='Missing') return {label:'Verify immediately',detail:'Start asset-location escalation and document the outcome.'};
  const band=riskBand(breakdown.total).label;
  if(band==='Critical') return {label:'Inspect within 48 hours',detail:'Take offline when continued use may be unsafe.'};
  if(band==='High') return {label:'Prioritize this week',detail:'Add to the next maintenance round and review open incidents.'};
  if(band==='Medium') return {label:'Schedule inspection',detail:'Include in the next routine preventive-maintenance visit.'};
  return {label:'Routine monitoring',detail:'Continue the normal preventive-maintenance schedule.'};
}

/* ---------- status → badge helper ---------- */
const STATUS_BADGE = {
  'Operational':'teal','Under Repair':'amber','Damaged':'red','Missing':'red','Condemned':'grey',
  'Pending':'amber','In Progress':'blue','Resolved':'teal','Rejected':'grey',
  'Awaiting Verification':'amber','Verified':'teal','Not Accomplished':'red','Not Required':'grey',
  'Low':'green','Medium':'yellow','High':'orange','Critical':'red',
};
function badge(text){
  const c = STATUS_BADGE[text]||'grey';
  return `<span class="badge badge-${c}"><i></i>${esc(text)}</span>`;
}
function tagChip(id){ return `<span class="tag-chip">${esc(id)}</span>`; }

/* ============================================================
   LIGHTWEIGHT SVG CHARTS (no external chart library)
   ============================================================ */
function donutSVG(segments,opts={}){
  const size=opts.size||164, stroke=opts.stroke||20, r=(size-stroke)/2, c=2*Math.PI*r, cx=size/2, cy=size/2;
  const displayTotal = segments.reduce((s,d)=>s+d.value,0);
  const total = displayTotal || 1;
  let offset=0, circles='';
  segments.filter(s=>s.value>0).forEach(seg=>{
    const frac = seg.value/total, len = frac*c;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.hex}" stroke-width="${stroke}" stroke-dasharray="${len.toFixed(2)} ${(c-len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ebe9e2" stroke-width="${stroke}"/>
    ${circles}
    <text x="${cx}" y="${cy-3}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="24" font-weight="700" fill="#181a1f">${displayTotal}</text>
    <text x="${cx}" y="${cy+16}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" letter-spacing="1.5" fill="#93959c">UNITS</text>
  </svg>`;
}
function barSVG(data,opts={}){
  const w=opts.width||440, h=opts.height||180, pad=26, gap=opts.gap||16;
  const max = Math.max(...data.map(d=>d.value),1);
  const bw = (w-pad*2-gap*(data.length-1))/data.length;
  let bars='',labels='';
  data.forEach((d,i)=>{
    const bh = max? (d.value/max)*(h-52) : 0;
    const x = pad+i*(bw+gap), y = h-30-bh;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(bh,2).toFixed(1)}" rx="5" fill="${d.hex}"/>
      <text x="${(x+bw/2).toFixed(1)}" y="${(y-8).toFixed(1)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#181a1f">${d.value}</text>`;
    labels += `<text x="${(x+bw/2).toFixed(1)}" y="${h-10}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="10.5" fill="#686b74">${esc(d.label)}</text>`;
  });
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    <line x1="${pad}" y1="${h-30}" x2="${w-pad}" y2="${h-30}" stroke="#dedad0" stroke-width="1"/>
    ${bars}${labels}
  </svg>`;
}

/* ---------- deterministic QR-style tag pattern (visual identifier, not scannable) ---------- */
function qrPatternSVG(seed,size=112){
  const modules=15, cell=size/modules;
  let hash=0; for(let i=0;i<seed.length;i++){ hash=(hash*31+seed.charCodeAt(i))>>>0; }
  function rnd(){ hash=(hash*1664525+1013904223)>>>0; return hash/4294967295; }
  let rects='';
  for(let y=0;y<modules;y++){
    for(let x=0;x<modules;x++){
      const inFinder=(x<7&&y<7)||(x>modules-8&&y<7)||(x<7&&y>modules-8);
      if(inFinder) continue;
      if(rnd()<0.46){ rects+=`<rect x="${(x*cell).toFixed(1)}" y="${(y*cell).toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" fill="#14181f"/>`; }
    }
  }
  function finder(ox,oy){
    return `<rect x="${ox}" y="${oy}" width="${(7*cell).toFixed(1)}" height="${(7*cell).toFixed(1)}" fill="#14181f"/>
      <rect x="${(ox+cell).toFixed(1)}" y="${(oy+cell).toFixed(1)}" width="${(5*cell).toFixed(1)}" height="${(5*cell).toFixed(1)}" fill="#fff"/>
      <rect x="${(ox+2*cell).toFixed(1)}" y="${(oy+2*cell).toFixed(1)}" width="${(3*cell).toFixed(1)}" height="${(3*cell).toFixed(1)}" fill="#14181f"/>`;
  }
  rects += finder(0,0) + finder(((modules-7)*cell),0) + finder(0,((modules-7)*cell));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
}

/* ---------- toast + modal ---------- */
function toastMessageMarkup(message){
  if(!Array.isArray(message?.parts)) return esc(message??'');
  return message.parts.map(part=>{
    const structured=part && typeof part==='object';
    const text=structured ? part.text : part;
    const safeText=esc(text??'');
    return structured && part.strong ? `<strong class="toast-emphasis">${safeText}</strong>` : safeText;
  }).join('');
}
function incidentStatusToastMessage(id,status){
  return {parts:[
    {text:'Incident '},
    {text:id||'Unknown',strong:true},
    {text:' status changed to '},
    {text:status||'Updated',strong:true},
    {text:'.'},
  ]};
}
function toast(msg,type='good',duration=null){
  const root = $('#toast-root');
  if(!root) return;
  const tone=type==='bad'
    ? {className:'bad',label:'Action needed',duration:6000}
    : type==='info'
      ? {className:'info',label:'Notice',duration:5000}
      : {className:'good',label:'Success',duration:4200};
  const t = document.createElement('div');
  t.className = `toast t-${tone.className}`;
  t.setAttribute('role',tone.className==='bad'?'alert':'status');
  t.setAttribute('aria-live',tone.className==='bad'?'assertive':'polite');
  t.innerHTML = `<i aria-hidden="true"></i><span class="toast-copy"><strong>${tone.label}</strong><span class="toast-message">${toastMessageMarkup(msg)}</span></span><button class="toast-close" type="button" aria-label="Dismiss notification">${icon('x')}</button>`;
  root.appendChild(t);
  let remaining=duration===null || duration===undefined
    ? tone.duration
    : Math.max(Number(duration)||tone.duration,0);
  let dismissTimer=null;
  let timerStartedAt=0;
  let dismissed=false;
  const dismiss=()=>{
    if(dismissed) return;
    dismissed=true;
    document.removeEventListener('visibilitychange',onVisibilityChange);
    t.style.transition='opacity .25s';
    t.style.opacity='0';
    setTimeout(()=>t.remove(),250);
  };
  const scheduleDismiss=()=>{
    if(dismissed || document.hidden) return;
    timerStartedAt=Date.now();
    dismissTimer=setTimeout(dismiss,remaining);
  };
  const onVisibilityChange=()=>{
    if(document.hidden && dismissTimer!==null){
      clearTimeout(dismissTimer);
      dismissTimer=null;
      remaining=Math.max(0,remaining-(Date.now()-timerStartedAt));
    }else if(!document.hidden && dismissTimer===null){
      scheduleDismiss();
    }
  };
  t.querySelector('.toast-close')?.addEventListener('click',dismiss);
  document.addEventListener('visibilitychange',onVisibilityChange);
  scheduleDismiss();
}
let modalReturnFocus = null;
let activeEquipmentInformationRequest = 0;
let activeConfirmationResolve = null;
function modalFocusableElements(panel){
  return $$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',panel)
    .filter(element=>element.offsetParent!==null && element.getAttribute('aria-hidden')!=='true');
}
function openModal(html,{wide=false,equipmentDetails=false,dismissible=true}={}){
  const root = $('#modal-root');
  const panel = $('#modal-panel');
  if(!root.classList.contains('open') && document.activeElement instanceof HTMLElement){
    modalReturnFocus=document.activeElement;
  }
  panel.className = ['modal-panel',wide?'modal-wide':'',equipmentDetails?'equipment-details-modal':''].filter(Boolean).join(' ');
  panel.innerHTML = html;
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('tabindex','-1');
  const heading=panel.querySelector('h1,h2,h3,h4');
  if(heading){
    if(!heading.id) heading.id=`modal-title-${Date.now()}`;
    panel.setAttribute('aria-labelledby',heading.id);
  }else{
    panel.setAttribute('aria-label','Dialog');
  }
  root.setAttribute('aria-hidden','false');
  root.dataset.dismissible=dismissible?'true':'false';
  root.classList.add('open');
  document.body.classList.add('modal-open');
  const appShell=$('#app-shell');
  if(appShell){
    appShell.setAttribute('aria-hidden','true');
    appShell.setAttribute('inert','');
    appShell.inert=true;
  }
  requestAnimationFrame(()=>{
    const first=modalFocusableElements(panel)[0];
    (first||panel).focus({preventScroll:true});
  });
}

function updateRequiredControlState(control){
  const form=control?.form;
  if(!form?.classList.contains('validation-attempted')) return;
  control.setAttribute('aria-invalid',control.checkValidity()?'false':'true');
}
document.addEventListener('invalid',event=>{
  const control=event.target;
  if(!(control instanceof HTMLElement) || !control.matches('input[required],select[required],textarea[required]')) return;
  control.form?.classList.add('validation-attempted');
  control.setAttribute('aria-invalid','true');
},true);
document.addEventListener('submit',event=>{
  if(event.target instanceof HTMLFormElement) event.target.classList.add('validation-attempted');
},true);
document.addEventListener('input',event=>{
  if(!(event.target instanceof HTMLElement)) return;
  if(event.target.getAttribute('aria-invalid')==='true') event.target.removeAttribute('aria-invalid');
  if(event.target.matches('input[required],select[required],textarea[required]')) updateRequiredControlState(event.target);
},true);
document.addEventListener('change',event=>{
  if(!(event.target instanceof HTMLElement)) return;
  if(event.target.getAttribute('aria-invalid')==='true') event.target.removeAttribute('aria-invalid');
  if(event.target.matches('input[required],select[required],textarea[required]')) updateRequiredControlState(event.target);
},true);
document.addEventListener('reset',event=>{
  if(!(event.target instanceof HTMLFormElement)) return;
  event.target.classList.remove('validation-attempted');
  event.target.querySelectorAll('[aria-invalid]').forEach(control=>control.removeAttribute('aria-invalid'));
},true);
function confirmAction(message,{title='Please confirm',confirmLabel='Confirm',danger=true}={}){
  return new Promise(resolve=>{
    let settled=false;
    const finish=value=>{
      if(settled) return;
      settled=true;
      activeConfirmationResolve=null;
      void closeModal();
      resolve(value);
    };
    activeConfirmationResolve=finish;
    openModal(`<div class="modal-head"><div><h3>${esc(title)}</h3></div><button class="modal-close" type="button" aria-label="Close" onclick="window.__ictConfirm(false)">${icon('x')}</button></div>
      <div class="modal-body"><p>${esc(message)}</p></div>
      <div class="modal-foot"><button class="btn btn-outline" type="button" onclick="window.__ictConfirm(false)">Cancel</button><button class="btn ${danger?'btn-danger':'btn-primary'}" type="button" onclick="window.__ictConfirm(true)">${esc(confirmLabel)}</button></div>`);
    window.__ictConfirm=value=>finish(value);
  });
}
async function closeModal(){
  const root=$('#modal-root');
  if(!root?.classList.contains('open')) return;
  if(activeConfirmationResolve){
    const resolveConfirmation=activeConfirmationResolve;
    activeConfirmationResolve=null;
    resolveConfirmation(false);
    return;
  }
  if(root.dataset.dismissible==='false') return;
  activeEquipmentInformationRequest+=1;
  await stopQrScanner();
  root.classList.remove('open');
  root.setAttribute('aria-hidden','true');
  delete root.dataset.dismissible;
  $('#modal-panel').innerHTML='';
  document.body.classList.remove('printing-service-card','modal-open');
  const appShell=$('#app-shell');
  if(appShell){
    appShell.removeAttribute('aria-hidden');
    appShell.removeAttribute('inert');
    appShell.inert=false;
  }
  const focusTarget=modalReturnFocus;
  modalReturnFocus=null;
  if(focusTarget?.isConnected) focusTarget.focus({preventScroll:true});
}
document.addEventListener('keydown',e=>{
  const root=$('#modal-root');
  if(!root?.classList.contains('open')) return;
  if(e.key==='Escape'){
    e.preventDefault();
    void closeModal();
    return;
  }
  if(e.key!=='Tab') return;
  const panel=$('#modal-panel');
  const focusable=modalFocusableElements(panel);
  if(!focusable.length){ e.preventDefault(); panel.focus(); return; }
  const first=focusable[0];
  const last=focusable[focusable.length-1];
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
});

/* ---------- QR scanner + Equipment Service Card ---------- */
const SERVICE_CARD_ROWS_PER_PAGE = 21;
const SERVICE_CARD_MAX_PAGES = 10;
let activeServiceCardEquipmentId = null;
let activeServiceCardInitialSnapshot = '';
let serviceCardSaveInFlight = false;

function normalizeEditableValue(value){
  if(Array.isArray(value)) return value.map(normalizeEditableValue);
  if(value && typeof value==='object'){
    return Object.keys(value).sort().reduce((normalized,key)=>{
      normalized[key]=normalizeEditableValue(value[key]);
      return normalized;
    },{});
  }
  if(value===null || value===undefined) return '';
  return typeof value==='string' ? value.trim() : value;
}
function editableSnapshot(value){
  return JSON.stringify(normalizeEditableValue(value));
}
function editableValuesMatch(left,right){
  return editableSnapshot(left)===editableSnapshot(right);
}

function serviceCardDrafts(){
  try { return JSON.parse(sessionStorage.getItem(SERVICE_CARD_STORAGE_KEY) || '{}') || {}; }
  catch(err){ return {}; }
}
function serviceCardFormData(){
  syncServiceCardPrintMarks();
  const rows = $$('.service-entry-row').map(row => ({
    date: row.querySelector('[data-field="date"]')?.value || '',
    remarks: row.querySelector('[data-field="remarks"]')?.value || '',
    preventive: row.querySelector('[data-field="preventiveYes"]')?.checked ? 'Yes' : (row.querySelector('[data-field="preventiveNo"]')?.checked ? 'No' : ''),
    cost: row.querySelector('[data-field="cost"]')?.value || '',
    servicedBy: row.querySelector('[data-field="servicedBy"]')?.value || '',
    requestIncidentId: row.dataset.requestIncidentId || '',
  }));
  const data = {
    office: $('[data-service-detail="office"]')?.value || '',
    model: $('[data-service-detail="model"]')?.value || '',
    unitCost: $('[data-service-detail="unitCost"]')?.value || '',
    pageCount: Math.max(1, $$('.service-card-page').length),
    rows,
  };
  return data;
}
async function saveServiceCardDraft(equipmentId){
  if(serviceCardSaveInFlight) return;
  const data=serviceCardFormData();
  const currentSnapshot=editableSnapshot(data);
  if(currentSnapshot===activeServiceCardInitialSnapshot){
    toast('No service card changes to save','info');
    return;
  }
  const saveButton=$('#service-card-save-button');
  try {
    if(state.user?.role!=='admin'){ toast('Service cards are available to administrators only','bad'); return; }
    serviceCardSaveInFlight=true;
    if(saveButton){
      saveButton.disabled=true;
      saveButton.setAttribute('aria-busy','true');
    }
    const drafts = serviceCardDrafts();
    drafts[equipmentId] = data;
    sessionStorage.setItem(SERVICE_CARD_STORAGE_KEY, JSON.stringify(drafts));
    const response=await apiRequest(`service_cards.php?equipment=${encodeURIComponent(equipmentId)}`,{method:'POST',body:JSON.stringify(data)});
    activeServiceCardInitialSnapshot=currentSnapshot;
    toast(response.unchanged?'No service card changes to save':'Service card saved',response.unchanged?'info':'good');
  } catch(err){
    toast('Service card kept for this tab; server save failed','bad');
  } finally {
    serviceCardSaveInFlight=false;
    if(saveButton?.isConnected){
      saveButton.disabled=false;
      saveButton.removeAttribute('aria-busy');
    }
  }
}
function clearServiceCardDraft(equipmentId){
  try {
    const drafts = serviceCardDrafts();
    delete drafts[equipmentId];
    sessionStorage.setItem(SERVICE_CARD_STORAGE_KEY, JSON.stringify(drafts));
  } catch(err){}
  openServiceCardModal(equipmentId, {forceBlank:true});
  toast('Service card draft cleared','info');
}
function syncServiceCardPrintMarks(root=document){
  root.querySelectorAll('.service-check').forEach(cell=>{
    const checkbox=cell.querySelector('input[type="checkbox"]');
    if(!checkbox) return;
    cell.classList.toggle('service-check-selected',checkbox.checked);
  });
}
function updateServiceCardPreventiveSelection(input){
  const row=input.closest('.service-entry-row');
  if(!row) return;
  if(input.checked){
    row.querySelectorAll('.service-check input[type="checkbox"]').forEach(other=>{
      if(other!==input) other.checked=false;
    });
  }
  syncServiceCardPrintMarks(row);
}
function serviceCardCheckMarkup(field,checked,label,readOnly=false){
  const behavior=readOnly ? 'disabled tabindex="-1"' : 'onchange="updateServiceCardPreventiveSelection(this)"';
  return `<td class="service-check${checked?' service-check-selected':''}"><input type="checkbox" data-field="${field}" aria-label="Preventive maintenance: ${label}" ${behavior} ${checked?'checked':''}><span class="service-check-print-mark" aria-hidden="true">&#10003;</span></td>`;
}
function serviceRowsMarkup(rows=[],start=0,{readOnly=false}={}){
  const source = Array.from({length:SERVICE_CARD_ROWS_PER_PAGE},(_,i)=>rows[start+i]||{});
  const locked=readOnly?' readonly tabindex="-1"':'';
  return source.map((r,i)=>`<tr class="service-entry-row" data-request-incident-id="${esc(r.requestIncidentId||'')}">
    <td><input type="${r.date?'date':'text'}" data-field="date" value="${esc(r.date||'')}" min="2000-01-01" max="${todayISO()}" ${readOnly?'':'onfocus="this.type=\'date\'" onblur="if(!this.value)this.type=\'text\'"'}${locked}></td>
    <td><input type="text" data-field="remarks" value="${esc(r.remarks||'')}"${locked}></td>
    ${serviceCardCheckMarkup('preventiveYes',r.preventive==='Yes','Yes',readOnly)}
    ${serviceCardCheckMarkup('preventiveNo',r.preventive==='No','No',readOnly)}
    <td><input type="number" data-field="cost" value="${esc(r.cost||'')}" min="0" step="0.01"${locked}></td>
    <td><input type="text" data-field="servicedBy" value="${esc(r.servicedBy||'')}"${locked}></td>
  </tr>`).join('');
}

function serviceCardRowsFromForm(){
  return $$('.service-entry-row').map(row => ({
    date: row.querySelector('[data-field="date"]')?.value || '',
    remarks: row.querySelector('[data-field="remarks"]')?.value || '',
    preventive: row.querySelector('[data-field="preventiveYes"]')?.checked ? 'Yes' : (row.querySelector('[data-field="preventiveNo"]')?.checked ? 'No' : ''),
    cost: row.querySelector('[data-field="cost"]')?.value || '',
    servicedBy: row.querySelector('[data-field="servicedBy"]')?.value || '',
    requestIncidentId: row.dataset.requestIncidentId || '',
  }));
}

function serviceCardDetailsFromForm(){
  return {
    office: $('[data-service-detail="office"]')?.value || '',
    model: $('[data-service-detail="model"]')?.value || '',
    unitCost: $('[data-service-detail="unitCost"]')?.value || '',
  };
}

function syncServiceCardDetail(field,value,source){
  $$(`[data-service-detail="${field}"]`).forEach(input=>{
    if(input!==source) input.value=value;
  });
}

function serviceCardTableMarkup(rows=[],start=0,options={}){
  return `<table class="service-card-table"><colgroup><col class="service-col-date"><col class="service-col-remarks"><col class="service-col-check"><col class="service-col-check"><col class="service-col-cost"><col class="service-col-person"></colgroup><thead><tr><th rowspan="2">Date</th><th rowspan="2">Remarks</th><th colspan="2">Preventive<br>Maintenance?</th><th rowspan="2">Cost of<br>Repair</th><th rowspan="2">Serviced by</th></tr><tr><th>Yes</th><th>No</th></tr></thead><tbody>${serviceRowsMarkup(rows,start,options)}</tbody></table>`;
}

function serviceCardDetailsMarkup(e,details,pageNumber,{readOnly=false}={}){
  const officeBehavior=readOnly?'readonly tabindex="-1"':'oninput="syncServiceCardDetail(\'office\',this.value,this)"';
  const modelBehavior=readOnly?'readonly tabindex="-1"':'oninput="syncServiceCardDetail(\'model\',this.value,this)"';
  const unitCostBehavior=readOnly?'readonly tabindex="-1"':'oninput="syncServiceCardDetail(\'unitCost\',this.value,this)"';
  return `<div class="service-card-brand"><strong>CENTRO ESCOLAR UNIVERSITY</strong><span>Manila * Makati * Malolos</span></div>
    <div class="service-card-office"><input id="sc-office-${pageNumber}" data-service-detail="office" value="${esc(details.office||'')}" ${officeBehavior} aria-label="Office, school, college, department, or section"><span>(Office/School/College/Department/Section)</span></div>
    <div class="service-card-details">
      <label><span>Equipment</span><input value="${esc(e.name)}" readonly></label>
      <label><span>Equipment Number</span><input value="${esc(e.id)}" readonly></label>
      <label><span>Model</span><input id="sc-model-${pageNumber}" data-service-detail="model" value="${esc(details.model||'')}" ${modelBehavior}></label>
      <label><span>Serial Number</span><input value="${esc(e.serial||'')}" readonly></label>
      <label><span>Location</span><input value="${esc(e.location||'')}" readonly></label>
      <label><span>Date Acquired</span><input value="${esc(e.dateAcquired||'')}" readonly></label>
      <label><span>Unit Cost</span><input id="sc-unit-cost-${pageNumber}" data-service-detail="unitCost" value="${esc(details.unitCost||'')}" ${unitCostBehavior} inputmode="decimal"></label>
    </div>`;
}

function serviceCardPageMarkup(e,rows,pageNumber,totalPages,details,options={}){
  const start=(pageNumber-1)*SERVICE_CARD_ROWS_PER_PAGE;
  return `<section class="service-card-page${pageNumber===1?' active':''}${options.readOnly?' service-card-readonly':''}" data-service-page="${pageNumber}">
    <div class="modal-body service-card-modal">
      ${serviceCardDetailsMarkup(e,details,pageNumber,options)}
      <div class="service-log-wrap">${serviceCardTableMarkup(rows,start,options)}</div>
      <div class="service-card-footer"><div><strong>QPF 024</strong><span>09/01/2016</span></div><strong data-service-page-number>Page ${pageNumber} of ${totalPages}</strong></div>
    </div>
  </section>`;
}

function serviceCardPagesMarkup(e,rows,pageCount,details,options={}){
  return Array.from({length:pageCount},(_,index)=>serviceCardPageMarkup(e,rows,index+1,pageCount,details,options)).join('');
}

function updateServiceCardPageControls(currentPage){
  const totalPages=$$('.service-card-page').length;
  const previous=$('#service-card-previous');
  const next=$('#service-card-next');
  const add=$('#service-card-add-page');
  const indicator=$('#service-card-page-indicator');
  if(previous) previous.disabled=currentPage<=1;
  if(next) next.disabled=currentPage>=totalPages;
  if(add){
    add.disabled=totalPages>=SERVICE_CARD_MAX_PAGES;
    add.textContent=totalPages>=SERVICE_CARD_MAX_PAGES ? '10-page limit reached' : `Add Page (${totalPages}/${SERVICE_CARD_MAX_PAGES})`;
  }
  if(indicator) indicator.textContent=`Page ${currentPage} of ${totalPages}`;
}

function showServiceCardPage(page){
  const pages=$$('.service-card-page');
  if(!pages.length) return;
  const target=Math.min(Math.max(Number(page)||1,1),pages.length);
  pages.forEach((element,index)=>element.classList.toggle('active',index===target-1));
  updateServiceCardPageControls(target);
  $('.service-card-pages')?.scrollTo({top:0,behavior:'smooth'});
}

function moveServiceCardPage(offset){
  const pages=$$('.service-card-page');
  const activeIndex=pages.findIndex(page=>page.classList.contains('active'));
  showServiceCardPage((activeIndex<0?0:activeIndex)+1+offset);
}

function addServiceCardPage(){
  const currentCount=$$('.service-card-page').length;
  if(currentCount>=SERVICE_CARD_MAX_PAGES){
    toast('A service card can contain up to 10 pages.','info');
    return;
  }

  const equipment=DB.equipment.find(item=>item.id===activeServiceCardEquipmentId);
  const pagesContainer=$('.service-card-pages');
  if(!equipment || !pagesContainer) return;

  const rows=serviceCardRowsFromForm();
  const details=serviceCardDetailsFromForm();
  const newCount=currentCount+1;
  pagesContainer.innerHTML=serviceCardPagesMarkup(equipment,rows,newCount,details);
  showServiceCardPage(newCount);
  toast(`Page ${newCount} added to the service card.`,'good');
}
function buildRealQrSvg(id,size=190){
  if(typeof window.ICTRAXQRCode !== 'function') return '';
  const qr=new window.ICTRAXQRCode(-1, 1);
  qr.addData(String(id));
  qr.make();
  const count=qr.getModuleCount();
  const quiet=8;
  const moduleSize=size/count;
  const full=size+quiet*2;
  let rects='';
  for(let row=0;row<count;row++){
    for(let col=0;col<count;col++){
      if(qr.isDark(row,col)){
        rects+=`<rect x="${(quiet+col*moduleSize).toFixed(2)}" y="${(quiet+row*moduleSize).toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" fill="#111318"/>`;
      }
    }
  }
  return `<svg width="${full}" height="${full}" viewBox="0 0 ${full} ${full}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code for ${esc(id)}"><rect width="${full}" height="${full}" fill="#fff"/>${rects}</svg>`;
}
function renderRealQrCode(id,targetId='real-qr-code',size=190){
  const el=document.getElementById(targetId);
  if(!el) return false;
  el.innerHTML='';
  const svg=buildRealQrSvg(id,size);
  if(svg){
    el.innerHTML=svg;
    if(targetId==='real-qr-code') $('#qr-library-note')?.remove();
    return true;
  }
  el.innerHTML=qrPatternSVG(id,size);
  const note=document.createElement('div');
  note.id=`qr-library-note-${targetId}`;
  note.className='hint';
  note.style.marginTop='8px';
  note.textContent='QR generator library is unavailable. The fallback pattern is not scannable.';
  el.parentElement?.appendChild(note);
  return false;
}
function downloadEquipmentQrJpg(id,targetId='real-qr-code'){
  const target=document.getElementById(targetId);
  const source=target?.querySelector('svg');
  if(!source){
    toast('QR code is not available yet.','bad');
    return;
  }

  try{
    const serializer=new XMLSerializer();
    const svgString=serializer.serializeToString(source);
    const svgBlob=new Blob([svgString],{type:'image/svg+xml;charset=utf-8'});
    const svgUrl=URL.createObjectURL(svgBlob);

    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');

      // High-resolution export for clearer printing and larger JPG output
      const qrSize=1400;
      const padding=80;
      const labelHeight=180;
      const canvasWidth=qrSize + padding * 2;
      const canvasHeight=qrSize + padding * 2 + labelHeight;

      canvas.width=canvasWidth;
      canvas.height=canvasHeight;

      const ctx=canvas.getContext('2d');

      // White background
      ctx.fillStyle='#ffffff';
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // Draw QR image centered with generous padding
      ctx.drawImage(img,padding,padding,qrSize,qrSize);

      // Optional divider line above the label for cleaner presentation
      ctx.strokeStyle='#d9d9d9';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(padding, qrSize + padding + 24);
      ctx.lineTo(canvasWidth - padding, qrSize + padding + 24);
      ctx.stroke();

      // Tag ID label below QR
      ctx.fillStyle='#000000';
      ctx.textAlign='center';

      ctx.font='700 54px Arial';
      ctx.fillText('Tag ID', canvasWidth/2, qrSize + padding + 88);

      ctx.font='700 62px Arial';
      ctx.fillText(String(id), canvasWidth/2, qrSize + padding + 148);

      const jpgDataUrl=canvas.toDataURL('image/jpeg',1.0);

      const link=document.createElement('a');
      link.href=jpgDataUrl;
      link.download=`${String(id).replace(/[^a-z0-9_-]/gi,'_')}_QR_HighRes.jpg`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(svgUrl);

      toast(`Downloaded high-resolution QR image for ${id}`,'good');
    };

    img.onerror=()=>{
      URL.revokeObjectURL(svgUrl);
      toast('Unable to prepare QR image.','bad');
    };

    img.src=svgUrl;

  }catch(err){
    console.error('ICTRAX QR JPG export failed.',err);
    toast('Unable to download the QR code as JPG.','bad');
  }
}
function findEquipmentByCode(code){
  const normalized=String(code||'').trim().toLowerCase();
  if(!normalized) return null;
  return DB.equipment.find(e=>String(e.id||'').trim().toLowerCase()===normalized)||null;
}
function parseEquipmentCodeFromQr(decodedText){
  const raw=String(decodedText||'').trim();
  if(!raw) return '';
  const direct=findEquipmentByCode(raw);
  if(direct) return direct.id;
  try{
    const url=new URL(raw,window.location.href);
    for(const key of ['equipment','equipment_id','equipmentId','id','code']){
      const value=url.searchParams.get(key);
      if(value){
        const found=findEquipmentByCode(value);
        if(found) return found.id;
      }
    }
  }catch(err){}
  const match=raw.match(/EMS-[A-Z0-9]+(?:-[A-Z0-9]+){2,}/i);
  if(match){
    const found=findEquipmentByCode(match[0]);
    if(found) return found.id;
  }
  return '';
}
async function disposeQrScanner(scanner){
  if(!scanner) return;
  try { await scanner.stop(); } catch(err) {}
  try { scanner.clear(); } catch(err) {}
}
async function stopQrScanner(){
  qrScannerGeneration+=1;
  const scanner=qrScannerInstance;
  qrScannerInstance=null;
  qrScannerActive=false;
  await disposeQrScanner(scanner);
}
async function getPreferredQrCameras(){
  if(!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') return [];
  try{
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d=>d.kind === 'videoinput');
  }catch(err){
    console.warn('ICTRAX camera enumeration failed:', err);
    return [];
  }
}

function qrErrorMessage(err){
  const name = err?.name || '';
  const message = String(err?.message || '').toLowerCase();
  if(name === 'NotAllowedError' || name === 'PermissionDeniedError'){
    return 'Camera permission was denied. Allow camera access for this site, then click Retry Camera.';
  }
  if(name === 'NotFoundError' || name === 'DevicesNotFoundError'){
    return 'No webcam was found. Connect a webcam or use the manual equipment code field.';
  }
  if(name === 'NotReadableError' || name === 'TrackStartError'){
    return 'The webcam is currently busy or unavailable. Close other apps using the camera, then click Retry Camera.';
  }
  if(name === 'OverconstrainedError'){
    return 'The selected camera could not be used with the requested settings. Try another camera.';
  }
  if(name === 'SecurityError' || message.includes('secure context') || message.includes('https')){
    return 'Camera access requires localhost or HTTPS. Open ICTRAX through XAMPP localhost, then retry.';
  }
  return 'Unable to start the webcam. Click Retry Camera or enter the equipment code manually.';
}

async function startQrScanner(cameraId=''){
  const status=$('#qr-scan-status');
  if(typeof window.Html5Qrcode !== 'function'){
    if(status){
      status.textContent='QR scanner library could not be loaded. Use the manual equipment code field below.';
      status.className='qr-scan-status bad';
    }
    return false;
  }

  const generation=++qrScannerGeneration;
  const previousScanner=qrScannerInstance;
  qrScannerInstance=null;
  qrScannerActive=false;
  await disposeQrScanner(previousScanner);
  if(generation!==qrScannerGeneration) return false;

  const reader=$('#qr-reader');
  if(!reader || !reader.isConnected) return false;
  reader.innerHTML='';

  let activeScanner = null;

  const config={
    fps:10,
    qrbox:(viewfinderWidth, viewfinderHeight)=>{
      const size=Math.max(180, Math.min(280, Math.floor(Math.min(viewfinderWidth,viewfinderHeight)*0.72)));
      return {width:size,height:size};
    },
    aspectRatio:1.0,
    rememberLastUsedCamera:false,
    formatsToSupport:[Html5QrcodeSupportedFormats.QR_CODE]
  };

  const onSuccess=async decodedText=>{
    if(generation!==qrScannerGeneration) return;
    const code=parseEquipmentCodeFromQr(decodedText);
    if(!code){
      const currentStatus=$('#qr-scan-status');
      if(currentStatus){
        currentStatus.textContent=`QR code detected (${decodedText}), but no matching equipment record was found. Keep scanning or enter a valid equipment number below.`;
        currentStatus.className='qr-scan-status bad';
      }
      return;
    }
    if(!claimQrScanResult()) return;
    const currentStatus=$('#qr-scan-status');
    if(currentStatus){
      currentStatus.textContent=`Equipment ${code} identified. Loading details…`;
      currentStatus.className='qr-scan-status good';
    }
    await stopQrScanner();
    try{
      await openScannedEquipmentDetails(code);
    }catch(err){
      console.error('ICTRAX QR result could not be opened:',err);
      qrScanHandling=false;
      toast('The equipment was identified, but its details could not be opened. Please try again.','bad');
    }
  };
  const onFailure=()=>{};

  // IMPORTANT: On desktop Chrome/Edge, requesting a camera by deviceId immediately
  // after permission is granted can fail on some webcams. Start with the browser's
  // normal/user-facing webcam first, then fall back to enumerated camera IDs.
  const candidates=[];
  if(cameraId) candidates.push(cameraId);
  candidates.push({facingMode:'user'});

  const devices = await getPreferredQrCameras();
  if(generation!==qrScannerGeneration || !reader.isConnected) return false;
  const ids = devices.map(d=>d.deviceId).filter(Boolean);
  ids.forEach(id=>{ if(!candidates.some(c=>typeof c==='string' && c===id)) candidates.push(id); });

  let lastError=null;
  for(const source of candidates){
    if(generation!==qrScannerGeneration || !reader.isConnected) return false;
    const scanner = new Html5Qrcode('qr-reader',{verbose:false});
    qrScannerInstance = scanner;
    activeScanner = scanner;
    reader.innerHTML='';

    try{
      await scanner.start(source,config,onSuccess,onFailure);
      if(generation!==qrScannerGeneration || !reader.isConnected){
        await disposeQrScanner(scanner);
        return false;
      }
      qrScannerActive=true;

      const activeId = typeof source === 'string' ? source : '';
      if(activeId){
        const select=$('#qr-camera-select');
        if(select) select.value=activeId;
      }

      const currentStatus=$('#qr-scan-status');
      if(currentStatus){
        currentStatus.textContent='Camera active. Center the equipment QR code inside the scanning box.';
        currentStatus.className='qr-scan-status good';
      }
      return true;
    }catch(err){
      lastError=err;
      try{ await scanner.stop(); }catch(stopErr){}
      try{ scanner.clear(); }catch(clearErr){}
      if(qrScannerInstance===scanner) qrScannerInstance=null;
      if(activeScanner===scanner) activeScanner=null;
      reader.innerHTML='';
    }
  }

  if(generation!==qrScannerGeneration || !reader.isConnected) return false;
  qrScannerActive=false;
  const detail=qrErrorMessage(lastError);
  const currentStatus=$('#qr-scan-status');
  if(currentStatus){
    currentStatus.innerHTML=`${esc(detail)} <button type="button" class="btn btn-outline btn-sm qr-retry-btn" onclick="retryQrCamera()">Retry Camera</button>`;
    currentStatus.className='qr-scan-status bad';
  }
  console.error('ICTRAX QR scanner start failed:',lastError);
  return false;
}

async function loadQrCameras(selectedId=''){
  const select=$('#qr-camera-select');
  if(!select) return;
  if(typeof window.Html5Qrcode !== 'function'){
    select.innerHTML='<option value="">Scanner library unavailable</option>';
    select.disabled=true;
    const status=$('#qr-scan-status');
    if(status){
      status.textContent='QR scanner library could not be loaded. Use the manual equipment code field below.';
      status.className='qr-scan-status bad';
    }
    return;
  }
  try{
    // getCameras() requests camera permission when needed, which is useful on browsers
    // that keep device labels hidden until the user grants access.
    qrCameraList=await Html5Qrcode.getCameras();
    if(!select.isConnected) return;
    select.innerHTML=qrCameraList.length
      ? qrCameraList.map((c,i)=>`<option value="${esc(c.id)}">${esc(c.label||`Camera ${i+1}`)}</option>`).join('')
      : '<option value="">No camera detected</option>';

    if(selectedId && qrCameraList.some(c=>c.id===selectedId)){
      select.value=selectedId;
    }else if(qrCameraList.length){
      select.value=qrCameraList[0].id;
    }

    // Do not rely only on getCameras() + deviceId. startQrScanner() has a webcam
    // fallback strategy that works better with desktop webcams.
    await startQrScanner(select.value || '');
  }catch(err){
    if(!select.isConnected) return;
    select.innerHTML='<option value="">Camera permission unavailable</option>';
    const status=$('#qr-scan-status');
    if(status){
      status.innerHTML=`${esc(qrErrorMessage(err))} <button type="button" class="btn btn-outline btn-sm qr-retry-btn" onclick="retryQrCamera()">Retry Camera</button>`;
      status.className='qr-scan-status bad';
    }
    console.error('ICTRAX QR camera discovery failed:',err);
  }
}

async function retryQrCamera(){
  const select=$('#qr-camera-select');
  const status=$('#qr-scan-status');
  if(!status) return;
  status.textContent='Requesting camera access…';
  status.className='qr-scan-status';
  await startQrScanner(select?.value || '');
}

async function changeQrCamera(cameraId){
  if(cameraId) await startQrScanner(cameraId);
}

function openQrScannerModal(){
  qrScanHandling=false;
  openModal(`<div class="modal-head"><div><h3>Scan Equipment QR Code</h3><div class="modal-sub">Use the PC webcam to identify an equipment record.</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body qr-scanner-modal-body">
      <div class="qr-reader-wrap"><div id="qr-reader"></div></div>
      <div id="qr-scan-status" class="qr-scan-status">Requesting camera access…</div>
      <div class="field"><label for="qr-camera-select">Camera</label><select id="qr-camera-select" onchange="changeQrCamera(this.value)"><option>Loading cameras…</option></select></div>
      <div class="qr-manual-divider"><span>or enter an equipment number</span></div>
      <div class="field-row qr-manual-row"><div class="field"><label for="qr-manual-code">Equipment Number / Tag ID</label><input id="qr-manual-code" placeholder="e.g. EMS-CL1-DT-001"></div><button type="button" class="btn btn-primary qr-manual-btn" onclick="lookupManualEquipmentCode()">Find Equipment</button></div>
      <div class="hint">The QR code must contain the equipment tag ID, such as <span class="mono">EMS-CL1-DT-001</span>. For camera scanning, use ICTRAX from <span class="mono">localhost</span> or HTTPS and allow camera access.</div>
    </div>
    <div class="modal-foot"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
  setTimeout(()=>loadQrCameras(),50);
}
function lookupManualEquipmentCode(){
  const raw=$('#qr-manual-code')?.value.trim()||'';
  const code=parseEquipmentCodeFromQr(raw);
  if(!code){
    const status=$('#qr-scan-status');
    if(status){
      status.textContent='No matching equipment record was found. Check the equipment number and try again.';
      status.className='qr-scan-status bad';
    }
    toast('No matching equipment record was found','bad');
    $('#qr-manual-code')?.focus();
    return;
  }
  if(!claimQrScanResult()) return;
  stopQrScanner()
    .then(()=>openScannedEquipmentDetails(code))
    .catch(err=>{
      console.error('ICTRAX manual QR lookup could not be opened:',err);
      qrScanHandling=false;
      toast('The equipment details could not be opened. Please try again.','bad');
    });
}

function claimQrScanResult(){
  if(qrScanHandling) return false;
  qrScanHandling=true;
  return true;
}

async function openScannedEquipmentDetails(id){
  return openEquipmentInformationModal(id,{showServiceCardAction:state.user?.role==='admin',source:'scan'});
}

function equipmentDetailsGridMarkup(e){
  const value=field=>field===null || field===undefined || String(field).trim()==='' ? '—' : String(field);
  return `<div class="equipment-details-grid">
    <div class="equipment-detail-field equipment-detail-field-wide"><span class="equipment-detail-label">Equipment Description</span><span class="equipment-detail-value">${esc(value(e.name))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Category</span><span class="equipment-detail-value">${esc(value(e.category))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Equipment Number / Tag ID</span><span class="equipment-detail-value mono">${esc(value(e.id))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Serial Number</span><span class="equipment-detail-value">${esc(value(e.serial))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Location</span><span class="equipment-detail-value">${esc(value(e.location))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Status</span><span class="equipment-detail-value">${badge(value(e.status))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Condition</span><span class="equipment-detail-value">${esc(value(e.condition))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Date Acquired</span><span class="equipment-detail-value">${esc(e.dateAcquired?fmtDate(e.dateAcquired):'—')}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Last Maintenance</span><span class="equipment-detail-value">${esc(e.lastMaintenance?fmtDate(e.lastMaintenance):'—')}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Warranty Provider</span><span class="equipment-detail-value">${esc(value(e.warrantyProvider))}</span></div>
    <div class="equipment-detail-field"><span class="equipment-detail-label">Warranty Expiration</span><span class="equipment-detail-value">${esc(e.warrantyExpiration?fmtDate(e.warrantyExpiration):'—')}</span></div>
    <div class="equipment-detail-field equipment-detail-field-wide"><span class="equipment-detail-label">Warranty Status</span><span class="equipment-detail-value">${esc(warrantySummary(e))}</span></div>
    <div class="equipment-detail-field equipment-detail-field-wide"><span class="equipment-detail-label">Inventory Notes</span><span class="equipment-detail-value">${esc(value(e.notes))}</span></div>
  </div>`;
}

function equipmentPhotosMarkup(photos,equipmentCode,isAdmin=false){
  if(!Array.isArray(photos)||!photos.length) return '<div class="equipment-details-empty">No photos attached to this equipment.</div>';
  return `<div class="equipment-photo-grid">${photos.map(photo=>`<figure class="equipment-photo-card"><a href="${esc(photo.url)}" target="_blank" rel="noopener"><img src="${esc(photo.url)}" alt="${esc(photo.name||'Equipment photo')}" loading="lazy"></a><figcaption>${esc(photo.name||'Equipment photo')}${isAdmin?`<button type="button" class="icon-btn" title="Remove photo" onclick="deleteEquipmentPhoto('${jsString(equipmentCode)}','${jsString(String(photo.id))}')">${icon('trash')}</button>`:''}</figcaption></figure>`).join('')}</div>`;
}

function readOnlyServiceHistoryMarkup(rows){
  const populated=(Array.isArray(rows)?rows:[]).filter(row=>row && (row.date || row.remarks || row.preventive || row.cost || row.servicedBy));
  if(!populated.length) return '<div class="equipment-details-empty">No service history has been recorded for this equipment.</div>';
  return `<div class="service-history-list">${populated.map(row=>`<article class="service-history-entry">
    <div class="service-history-heading"><strong>${esc(row.date?fmtDate(row.date):'Date not recorded')}</strong><span>${esc(row.preventive?`Preventive maintenance: ${row.preventive}`:'Maintenance type not recorded')}</span></div>
    <p>${esc(row.remarks||'No service remarks recorded.')}</p>
    <div class="service-history-meta"><span><b>Cost:</b> ${esc(row.cost||'—')}</span><span><b>Serviced by:</b> ${esc(row.servicedBy||'—')}</span></div>
  </article>`).join('')}</div>`;
}

function validEquipmentQrValue(value){
  const code=String(value||'').trim();
  return code.length>0 && code.length<=50 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(code);
}

function viewOnlyEquipmentQrMarkup(e,targetId='equipment-information-qr'){
  const hasQr=validEquipmentQrValue(e?.id);
  return `<section class="equipment-details-section" aria-labelledby="equipment-qr-heading">
    <div class="equipment-section-heading"><h4 id="equipment-qr-heading">Equipment QR card</h4><span class="view-only-label">${icon('eye')} View only</span></div>
    <div class="qr-tag-card view-only-qr-card">
      <div class="view-only-qr-visual">
        ${hasQr?`<div class="qr-pattern" id="${esc(targetId)}" aria-label="QR code for ${esc(e.id)}"><div class="qr-loading-state">Rendering QR code...</div></div><div class="qr-print-tag">Tag ID: ${esc(e.id)}</div>`:`<div class="qr-unavailable-state">${icon('alert')}<strong>QR unavailable</strong><span>This record does not have a valid equipment identifier.</span></div>`}
      </div>
      <div class="qr-meta">
        <div class="qm-name">${esc(e?.name||'Equipment name unavailable')}</div>
        <div class="qm-id">${hasQr?esc(e.id):'No valid Tag ID'}</div>
        <div class="kv-list">
          <div class="kv-row"><span class="k">Location</span><span class="v">${esc(e?.location||'Not recorded')}</span></div>
          <div class="kv-row"><span class="k">Serial No.</span><span class="v">${esc(e?.serial||'Not recorded')}</span></div>
          <div class="kv-row"><span class="k">Status</span><span class="v">${badge(e?.status||'Unknown')}</span></div>
        </div>
        <p class="view-only-qr-note">This card identifies the selected equipment. QR editing, replacement, regeneration, and download controls are not available in this view.</p>
      </div>
    </div>
  </section>`;
}

function renderViewOnlyEquipmentQr(id,targetId='equipment-information-qr'){
  const target=document.getElementById(targetId);
  if(!target) return false;
  if(!validEquipmentQrValue(id)){
    target.innerHTML=`<div class="qr-unavailable-state">${icon('alert')}<strong>QR unavailable</strong><span>The equipment identifier is missing or invalid.</span></div>`;
    return false;
  }
  const svg=buildRealQrSvg(id,160);
  if(!svg){
    target.innerHTML=`<div class="qr-unavailable-state">${icon('alert')}<strong>QR unavailable</strong><span>The QR renderer could not be loaded. Refresh the page and try again.</span></div>`;
    return false;
  }
  target.innerHTML=svg;
  return true;
}

function applyEquipmentApiRecord(target,equipment){
  if(!target || !equipment || !validEquipmentQrValue(equipment.equipment_code)) return false;
  Object.assign(target,{
    id:equipment.equipment_code,
    recordSequence:Number(equipment.id)||target.recordSequence||0,
    createdAt:equipment.created_at||target.createdAt||'',
    name:equipment.name,
    category:equipment.category,
    location:equipment.location,
    serial:equipment.serial_number,
    status:equipment.status,
    condition:equipment.condition_status,
    dateAcquired:equipment.date_acquired,
    lastMaintenance:equipment.last_maintenance,
    warrantyProvider:equipment.warranty_provider||'',
    warrantyExpiration:equipment.warranty_expiration||'',
    notes:equipment.notes||'',
  });
  return true;
}

function equipmentInformationErrorModal(message,{allowRetry=false}={}){
  openModal(`<div class="modal-head"><div><h3>Equipment information unavailable</h3><div class="modal-sub">The selected record could not be opened.</div></div><button class="modal-close" type="button" aria-label="Close equipment information" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body"><div class="banner banner-amber">${icon('alert')}<div>${esc(message)}</div></div></div>
    <div class="modal-foot"><button class="btn btn-outline" type="button" onclick="closeModal()">Close</button>${allowRetry?`<button class="btn btn-primary" type="button" onclick="openQrScannerModal()">${icon('camera')} Scan another code</button>`:''}</div>`,{equipmentDetails:true});
}

async function openEquipmentInformationModal(id,{showServiceCardAction=state.user?.role==='admin',source='browse'}={}){
  const equipment=findEquipmentByCode(id);
  if(!equipment){
    qrScanHandling=false;
    equipmentInformationErrorModal('No active equipment record matches this Tag ID.',{allowRetry:source==='scan'});
    return false;
  }
  if(!validEquipmentQrValue(equipment.id)){
    qrScanHandling=false;
    equipmentInformationErrorModal('The equipment record has an invalid or missing Tag ID.',{allowRetry:source==='scan'});
    return false;
  }

  const requestId=++activeEquipmentInformationRequest;
  openModal(`<div class="modal-head"><div><h3>Equipment information</h3><div class="modal-sub">${esc(equipment.id)} - Loading current details</div></div><button class="modal-close" type="button" aria-label="Close equipment information" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body"><div class="equipment-modal-loading" role="status"><span class="loading-spinner" aria-hidden="true"></span><strong>Loading equipment information...</strong><span>Checking the current record and service history.</span></div></div>`,{equipmentDetails:true});

  let rows=[];
  let serviceCard={};
  let photos=[];
  let warning='';
  try{
    const response=await apiRequest(`service_cards.php?equipment=${encodeURIComponent(equipment.id)}`,{skipAuthFailureHandling:true});
    if(!response.success || !response.equipment) throw new Error(response.message||'Equipment data is unavailable.');
    if(!applyEquipmentApiRecord(equipment,response.equipment)) throw new Error('The server returned invalid equipment data.');
    serviceCard=response.card||{};
    rows=Array.isArray(serviceCard.rows)?serviceCard.rows:[];
  }catch(err){
    if(requestId!==activeEquipmentInformationRequest) return false;
    if(err.status===404){
      qrScanHandling=false;
      equipmentInformationErrorModal('This equipment record is no longer available. It may have been archived or removed.',{allowRetry:source==='scan'});
      return false;
    }
    warning=`Current server details could not be loaded (${err.message||'network error'}). Showing the last equipment data loaded for this session.`;
    console.warn('ICTRAX: unable to refresh equipment information.',err);
  }
  try{
    const photoResponse=await apiRequest(`equipment-photos.php?equipment=${encodeURIComponent(equipment.id)}`,{skipAuthFailureHandling:true});
    if(photoResponse.success) photos=Array.isArray(photoResponse.photos)?photoResponse.photos:[];
  }catch(err){
    console.warn('ICTRAX: unable to load equipment photos.',err);
  }
  if(requestId!==activeEquipmentInformationRequest || !$('#modal-root')?.classList.contains('open')) return false;

  const isAdmin=state.user?.role==='admin';
  const qrTarget=`equipment-information-qr-${requestId}`;
  const serviceCardDetails={
    office:serviceCard.office||'',
    model:serviceCard.model||'',
    unitCost:serviceCard.unitCost??serviceCard.unit_cost??'',
  };
  const inferredServiceCardPages=Math.ceil(rows.length/SERVICE_CARD_ROWS_PER_PAGE)||1;
  const requestedServiceCardPages=Number(serviceCard.pageCount)||inferredServiceCardPages;
  const serviceCardPageCount=Math.min(Math.max(requestedServiceCardPages,1),SERVICE_CARD_MAX_PAGES);
  openModal(`<div class="modal-head">
    <div><h3>${esc(equipment.name||'Equipment information')}</h3><div class="modal-sub">${esc(equipment.id)} - Equipment and service details</div></div>
    <button class="modal-close" type="button" aria-label="Close equipment information" onclick="closeModal()">${icon('x')}</button>
  </div>
  <div class="modal-body equipment-details-body">
    ${warning?`<div class="banner banner-amber">${icon('alert')}<div>${esc(warning)}</div></div>`:''}
    ${viewOnlyEquipmentQrMarkup(equipment,qrTarget)}
    <section class="equipment-details-section" aria-labelledby="equipment-details-heading-${requestId}"><h4 id="equipment-details-heading-${requestId}">Equipment information</h4>${equipmentDetailsGridMarkup(equipment)}</section>
    <section class="equipment-details-section" aria-labelledby="equipment-photos-heading-${requestId}"><h4 id="equipment-photos-heading-${requestId}">Notes photos</h4>${equipmentPhotosMarkup(photos,equipment.id,isAdmin)}</section>
    <section class="equipment-details-section" aria-labelledby="service-history-heading-${requestId}"><h4 id="service-history-heading-${requestId}">Service history</h4>${readOnlyServiceHistoryMarkup(rows)}</section>
    ${!isAdmin?`<section class="equipment-details-section embedded-service-card-section" aria-labelledby="complete-service-card-heading-${requestId}"><h4 id="complete-service-card-heading-${requestId}">Complete Service Card</h4><div class="service-card-pages">${serviceCardPagesMarkup(equipment,rows,serviceCardPageCount,serviceCardDetails,{readOnly:true})}</div></section>`:''}
  </div>
  <div class="modal-foot${isAdmin?'':' service-card-modal-foot'}">
    ${isAdmin?`<button class="btn btn-outline" type="button" onclick="closeModal()">Close</button>${showServiceCardAction?`<button class="btn btn-primary" type="button" onclick="openServiceCardModal('${jsString(equipment.id)}')">${icon('file')} Open Service Card</button>`:''}`:`<div class="service-card-page-nav"><button id="service-card-previous" class="btn btn-outline" type="button" onclick="moveServiceCardPage(-1)">Previous Page</button><span id="service-card-page-indicator">Page 1 of ${serviceCardPageCount}</span><button id="service-card-next" class="btn btn-outline" type="button" onclick="moveServiceCardPage(1)">Next Page</button></div><div class="service-card-document-actions"><button class="btn btn-dark" type="button" onclick="printServiceCard()">${icon('printer')} Print Service Card</button><button class="btn btn-primary" type="button" onclick="closeModal()">Done</button></div>`}
  </div>`,{equipmentDetails:true});
  if(!isAdmin) showServiceCardPage(1);
  requestAnimationFrame(()=>renderViewOnlyEquipmentQr(equipment.id,qrTarget));
  qrScanHandling=false;
  return true;
}

async function deleteEquipmentPhoto(equipmentCode,photoId){
  if(!await confirmAction('Remove this attached photo?',{title:'Remove photo',confirmLabel:'Remove'})) return;
  try{
    const response=await apiRequest(`equipment-photos.php?equipment=${encodeURIComponent(equipmentCode)}&id=${encodeURIComponent(photoId)}`,{method:'DELETE'});
    if(!response.success) throw new Error(response.message||'Unable to remove photo');
    toast('Photo removed','good');
    await openEquipmentInformationModal(equipmentCode,{showServiceCardAction:true,source:'details'});
  }catch(err){ toast(err.message,'bad'); }
}

async function openReadOnlyServiceCardModal(id){
  return openEquipmentInformationModal(id,{showServiceCardAction:false,source:'browse'});
}

async function openServiceCardModal(id,{forceBlank=false}={}){
  const e=DB.equipment.find(x=>x.id===id);
  if(!e){ toast('Equipment record not found','bad'); return; }
  if(state.user?.role!=='admin'){ toast('Service cards are available to administrators only','bad'); return; }

  activeServiceCardEquipmentId=id;
  const drafts=serviceCardDrafts();
  let draft=!forceBlank ? (drafts[id]||{}) : {};
  try {
    const response=await apiRequest(`service_cards.php?equipment=${encodeURIComponent(id)}`);
    if(response.success && response.equipment){
      const equipment=response.equipment;
      Object.assign(e,{
        id:equipment.equipment_code,
        name:equipment.name,
        category:equipment.category,
        location:equipment.location,
        serial:equipment.serial_number,
        status:equipment.status,
        condition:equipment.condition_status,
        dateAcquired:equipment.date_acquired,
        lastMaintenance:equipment.last_maintenance,
        warrantyProvider:equipment.warranty_provider||'',
        warrantyExpiration:equipment.warranty_expiration||'',
        notes:equipment.notes||'',
      });
    }
    if(response.success && !forceBlank) draft=response.card||draft;
  } catch(err) {
    console.warn('ICTRAX: unable to refresh service-card equipment details.',err);
    toast('Unable to refresh equipment details; showing the last loaded inventory values','bad');
  }

  const rows=Array.isArray(draft.rows)?draft.rows:[];
  const details={
    office:draft.office||'',
    model:draft.model||'',
    unitCost:draft.unitCost??draft.unit_cost??'',
  };
  const inferredPageCount=Math.ceil(rows.length/SERVICE_CARD_ROWS_PER_PAGE)||1;
  const requestedPageCount=Number(draft.pageCount)||inferredPageCount;
  const pageCount=Math.min(Math.max(requestedPageCount,1),SERVICE_CARD_MAX_PAGES);

  openModal(`<div class="modal-head"><div><h3>Equipment Repair/Service Card</h3><div class="modal-sub">${esc(e.id)} - ${esc(e.name)} - US Letter</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="service-card-pages">${serviceCardPagesMarkup(e,rows,pageCount,details)}</div>
    <div class="modal-foot service-card-modal-foot">
      <div class="service-card-page-nav"><button id="service-card-previous" class="btn btn-outline" onclick="moveServiceCardPage(-1)">Previous Page</button><span id="service-card-page-indicator">Page 1 of ${pageCount}</span><button id="service-card-next" class="btn btn-outline" onclick="moveServiceCardPage(1)">Next Page</button></div>
      <div class="service-card-document-actions"><button class="btn btn-outline" onclick="clearServiceCardDraft('${jsString(e.id)}')">Clear Draft</button><button id="service-card-save-button" class="btn btn-outline" onclick="saveServiceCardDraft('${jsString(e.id)}')">Save</button><button id="service-card-add-page" class="btn btn-outline" onclick="addServiceCardPage()">Add Page (${pageCount}/${SERVICE_CARD_MAX_PAGES})</button><button class="btn btn-dark" onclick="printServiceCard()">${icon('printer')} Print Service Card</button><button class="btn btn-primary" onclick="closeModal()">Done</button></div>
    </div>`,{wide:true});
  showServiceCardPage(1);
  activeServiceCardInitialSnapshot=editableSnapshot(serviceCardFormData());
}

function printServiceCard(){
  if(document.activeElement instanceof HTMLElement) document.activeElement.blur();
  syncServiceCardPrintMarks();
  document.body.classList.add('printing-service-card');
  const finishPrinting=()=>document.body.classList.remove('printing-service-card');
  window.addEventListener('afterprint',finishPrinting,{once:true});
  window.print();
  setTimeout(finishPrinting,2000);
}
function openEquipmentScanResult(id){ openServiceCardModal(id); }
function openServiceCardFromQr(id){
  const equipment = DB.equipment.find(x=>x.id===id);
  if(!equipment){
    toast('Equipment record not found','bad');
    return;
  }

  closeModal();
  setTimeout(()=>{
    openServiceCardModal(equipment.id);
  },150);
}



/* ---------- CSV export ---------- */
function csvCell(value){
  let text=String(value??'');
  // Spreadsheet programs may execute cells beginning with formula control
  // characters. Prefix a quote before RFC 4180 escaping so exported database
  // text is always interpreted as text rather than a formula.
  if(/^[\u0000-\u0020]*[=+\-@]/.test(text)) text=`'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
}
function exportCSV(rows,columns,filename){
  const head = columns.map(c=>csvCell(c.label)).join(',');
  const body = rows.map(r=>columns.map(c=>csvCell(c.get(r))).join(',')).join('\n');
  const blob = new Blob([head+'\n'+body],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },200);
  toast(`Exported ${filename}`,'good');
}
function exportTimestamp(){
  const now=new Date();
  const pad=value=>String(value).padStart(2,'0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}
function timestampedExportFilename(name){
  return `ICTRAX_${name}_${exportTimestamp()}.xlsx`;
}
function exportXLSX(rows,columns,filename){
  if(typeof XLSX==='undefined'){
    toast('Excel export is unavailable. Reload the page and try again.','bad');
    return;
  }
  const values=[columns.map(column=>column.label),...rows.map(row=>columns.map(column=>column.get(row)))];
  const sheet=XLSX.utils.aoa_to_sheet(values);
  sheet['!cols']=columns.map(column=>({wch:Math.min(36,Math.max(14,String(column.label).length+2))}));
  values.forEach((row,rowIndex)=>{
    row.forEach((value,columnIndex)=>{
      const address=XLSX.utils.encode_cell({r:rowIndex,c:columnIndex});
      if(!sheet[address]) sheet[address]={v:value};
      sheet[address].s={
        alignment:{vertical:'top',wrapText:true},
        ...(rowIndex===0 ? {font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'2C296E'}}} : {}),
      };
    });
  });
  const workbook=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook,sheet,'Export');
  XLSX.writeFile(workbook,filename);
  toast(`Exported ${filename}`,'good');
}
function filteredEquipmentRows(){
  const f=state.filters;
  const rows=DB.equipment.filter(e=>{
    if(f.equipCategory!=='all' && e.category!==f.equipCategory) return false;
    if(f.equipStatus!=='all' && e.status!==f.equipStatus) return false;
    if(f.equipSearch){
      const q=f.equipSearch.toLowerCase();
      if(!(e.name.toLowerCase().includes(q)||e.id.toLowerCase().includes(q)||e.location.toLowerCase().includes(q)||e.serial.toLowerCase().includes(q))) return false;
    }
    return ['id','name','location','status','risk','dateAcquired','lastMaintenance']
      .every(key=>matchesColumnFilter(e,'equipment',key,columnFilterValue('equipment',key)));
  });
  return sortTableRows(rows,'equipment');
}
function filteredIncidentRows(table='incidents'){
  const f=state.filters;
  const completed=table==='completed';
  const myReports=table==='myreports';
  const search=completed ? f.completedSearch : (myReports ? f.myReportsSearch : f.incSearch);
  return DB.incidents.filter(i=>{
    if(completed ? i.status!=='Resolved' : i.status==='Resolved') return false;
    if((myReports || state.user?.role==='faculty') && String(i.reportedByUserId)!==String(state.user.id)) return false;
    if(search){
      const q=search.toLowerCase();
      const eqp=DB.equipment.find(e=>e.id===i.equipmentId);
      if(!(i.id.toLowerCase().includes(q)||i.reportedByName.toLowerCase().includes(q)||(eqp&&eqp.name.toLowerCase().includes(q)))) return false;
    }
    const filterKeys=completed
      ? ['id','equipment','reportedByName','dateReported','resolvedDate','category','priority','status','verificationStatus']
      : (myReports
        ? ['id','equipment','dateReported','category','status']
        : ['id','equipment','reportedByName','dateReported','category','priority','status']);
    return filterKeys
      .every(key=>matchesColumnFilter(i,table,key,columnFilterValue(table,key)));
  });
}
function filteredArchivedRows(){
  const query=state.filters.archivedSearch.toLowerCase();
  return (state.archivedRows||[]).filter(item=>{
    if(query && !['equipment_code','equipment_name','location','archive_reason','archived_date']
      .some(key=>String(item[key]||'').toLowerCase().includes(query))) return false;
    return ['equipment_code','equipment_name','location','archive_reason','archived_date']
      .every(key=>matchesColumnFilter(item,'archived',key,columnFilterValue('archived',key)));
  });
}
function exportEquipmentXLSX(){
  exportXLSX(filteredEquipmentRows(),[
    {label:'Tag ID',get:r=>r.id},{label:'Equipment',get:r=>r.name},{label:'Location',get:r=>r.location},
    {label:'Status',get:r=>r.status},{label:'Risk',get:r=>calcRisk(r)},{label:'Date Acquired',get:r=>r.dateAcquired},
    {label:'Last Maintenance',get:r=>r.lastMaintenance},
  ],timestampedExportFilename('Equipment_Inventory'));
}
function exportIncidentXLSX(table='incidents'){
  const completed=table==='completed';
  exportXLSX(filteredIncidentRows(table),[
    {label:'Report',get:r=>r.id},{label:'Equipment',get:r=>DB.equipment.find(e=>e.id===r.equipmentId)?.name||''},
    {label:'Reported By',get:r=>r.reportedByName},{label:'Date',get:r=>r.dateReported},{label:'Category',get:r=>r.category},
    {label:'Priority',get:r=>r.priority},{label:'Incident Status',get:r=>r.status},{label:'Resolved Date',get:r=>r.resolvedDate||''},
    {label:'Verification Status',get:r=>r.verificationStatus||'Not Required'},
  ],timestampedExportFilename(completed ? 'Completed_Incident_Reports' : 'Incident_Reports'));
}
function exportArchivedXLSX(){
  exportXLSX(filteredArchivedRows(),[
    {label:'Equipment Code',get:r=>r.equipment_code},{label:'Equipment Name',get:r=>r.equipment_name},
    {label:'Location',get:r=>r.location},{label:'Archive Reason',get:r=>r.archive_reason},
    {label:'Date Archived',get:r=>r.archived_date},
  ],timestampedExportFilename('Archived_Equipment'));
}

/* ============================================================
   APP STATE
   ============================================================ */
const state = {
  user:null,
  loginRole:'admin',
  view:null,
  dashboardIncidentRange:'last6months',
  presetEquipId:null,
  filters:{ equipSearch:'',equipCategory:'all',equipStatus:'all',incSearch:'',completedSearch:'',myReportsSearch:'',archivedSearch:'',columnFilters:{equipment:{},incidents:{},completed:{},myreports:{},archived:{}} },
  sorts:{ equipment:{key:'createdAt',direction:'desc'}, browse:{key:'createdAt',direction:'desc'}, incidents:{key:'dateReported',direction:'desc'}, completed:{key:'resolvedDate',direction:'desc'}, myreports:{key:'dateReported',direction:'desc'}, archived:{key:'archived_date',direction:'desc'} },
  archivedRows:[],
};

/* ============================================================
   AUTH + MULTI-PAGE NAVIGATION
   ============================================================ */
function setLoginRole(role){
  state.loginRole = role;
  $$('#role-switch button').forEach(b=>b.classList.toggle('active',b.dataset.role===role));
  $('#login-error').style.display='none';
  const status = $('#google-auth-status');
  if(status){
    status.textContent = role==='admin'
      ? 'Selected role: Administrator.'
      : 'Selected role: Faculty/Non-Teaching. Use a Google account ending in @mls.ceu.edu.ph or @ceu.edu.ph.';
  }
}

function showLoginError(message){
  const el = $('#login-error');
  if(!el) return;
  el.textContent = message || 'Google authorization could not be completed.';
  el.style.display='flex';
}

function setGoogleAuthStatus(message){
  const el = $('#google-auth-status');
  if(el) el.textContent = message;
}

async function loadGoogleClientId(){
  try{
    const response = await apiRequest(GOOGLE_AUTH_CONFIG_ENDPOINT);
    if(response.success && response.client_id){
      googleClientId = String(response.client_id);
      return googleClientId;
    }
    throw new Error(response.message || 'Google Client ID is not configured.');
  }catch(err){
    setGoogleAuthStatus('Google authorization is not configured yet. Add the Web Client ID in api/google-auth-config.php.');
    console.warn('ICTRAX Google Auth:', err.message);
    return '';
  }
}

function renderGoogleButton(){
  const container = $('#google-signin-button');
  if(!container || !window.google?.accounts?.id || !googleClientId || googleInitialized) return;

  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleGoogleCredentialResponse,
    ux_mode: 'popup',
    auto_select: false,
  });

  container.innerHTML = '';
  window.google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: Math.min(360, container.clientWidth || 360),
    locale: 'en',
  });

  googleInitialized = true;
  setGoogleAuthStatus('Choose the Google account registered for the selected ICTRAX role.');
}

async function initializeGoogleAuth(){
  if(currentPage()!=='login') return;
  setGoogleAuthStatus('Preparing Google authorization…');
  const clientId = await loadGoogleClientId();
  if(!clientId) return;

  const deadline = Date.now()+8000;
  const waitForGsi = ()=>{
    if(window.google?.accounts?.id){
      renderGoogleButton();
      return;
    }
    if(Date.now() >= deadline){
      setGoogleAuthStatus('Google Sign-In could not be loaded. Check your internet connection and try again.');
      return;
    }
    setTimeout(waitForGsi,150);
  };
  waitForGsi();
}

async function handleGoogleCredentialResponse(response){
  if(!response?.credential){
    showLoginError('Google did not return an ID token. Please try again.');
    return;
  }

  $('#login-error').style.display='none';
  setGoogleAuthStatus('Verifying your Google account with the ICTRAX database…');
  const logoutMarkerAtStart=currentLogoutEventMarker();
  const lifecycleAtStart=authLifecycleGeneration;

  try{
    const result = await apiRequest('google-login.php', {
      method:'POST',
      body:JSON.stringify({
        credential:response.credential,
        expectedRole:state.loginRole,
      })
    });

    if(!result.success || !result.user || !result.csrf_token){
      throw new Error(result.message || 'The Google account is not authorized for ICTRAX.');
    }

    csrfToken=String(result.csrf_token);
    if(authLifecycleGeneration!==lifecycleAtStart || currentLogoutEventMarker()!==logoutMarkerAtStart){
      await terminateSessionAndReturnToLogin({reason:'sign-in-cancelled-by-logout',redirect:false,broadcast:false});
      throw new Error('Sign-in was cancelled because this session was ended in another tab. Please try again.');
    }

    if(result.user.role !== state.loginRole){
      await terminateSessionAndReturnToLogin({reason:'google-role-mismatch',redirect:false,broadcast:false});
      throw new Error('The selected ICTRAX role does not match the authorized database account. Please select the correct role and sign in again.');
    }

    setSessionUser(result.user);
    setGoogleAuthStatus('Authorization successful. Opening ICTRAX…');
    window.location.replace(PAGE_MAP.dashboard);
  }catch(err){
    showLoginError(err.message || 'Google authorization failed.');
    setGoogleAuthStatus('Authorization failed. Choose an authorized Google account and try again.');
  }
}

function handleLogin(e){
  e.preventDefault();
  showLoginError('Please use the “Sign in with Google” button. Username/password login has been replaced by Google authorization.');
}

function logout(){
  void terminateSessionAndReturnToLogin({reason:'user-sign-out'});
}

const NAV = {
  admin:[
    {id:'dashboard',label:'Dashboard',icon:'grid'},
    {id:'equipment',label:'Equipment Inventory',icon:'box'},
    {id:'archived',label:'Archived Equipment',icon:'mail'},
    {id:'incidents',label:'Incident Reports',icon:'flag',badge:()=>DB.incidents.filter(i=>i.status==='Pending').length},
    {id:'completed',label:'Completed Incident Reports',icon:'check'},
    {id:'audit',label:'Audit Log',icon:'list'},
    {id:'report',label:'Request for Repair',icon:'flag'},
    {id:'risk',label:'Risk Analytics',icon:'activity'},
  ],
  faculty:[
    {id:'dashboard',label:'Dashboard',icon:'grid'},
    {id:'browse',label:'Browse Equipment',icon:'box'},
    {id:'report',label:'Request for Repair',icon:'flag'},
    {id:'myreports',label:'My Submitted Incidents',icon:'list'},
    {id:'completed',label:'Completed Incident Reports',icon:'check'},
  ],
};
const TITLES = {
  dashboard:['Overview','Dashboard'],
  equipment:['ICT Resources','Equipment Inventory'],
  incidents:['Service Desk','Incident Reports'],
  completed:['Service Desk','Completed Incident Reports'],
  audit:['Administration','Audit Log'],
  risk:['Predictive Maintenance','Risk Analytics'],
  archived:['ICT Resources','Archived Equipment'],
  browse:['ICT Resources','Browse Equipment'],
  report:['Service Desk','Request for Repair'],
  myreports:['Service Desk','My Submitted Incidents'],
};
function renderSidebar(){
  const sidebar = $('#sidebar');
  if(!sidebar || !state.user) return;
  const role = state.user.role;
  const items = NAV[role] || [];
  const activeView = currentPage();
  const navHtml = items.map(it=>{
    const count = it.badge ? it.badge() : 0;
    const href = PAGE_MAP[it.id] || '#';
    return `<a class="nav-link ${activeView===it.id?'active':''}" href="${href}">
      ${icon(it.icon)}<span class="label-text">${it.label}</span>
      ${count>0?`<span class="pill">${count}</span>`:''}
    </a>`;
  }).join('');
  sidebar.innerHTML = `
    <div class="brandmark">
      <div class="mark"><img src="assets/icons_images/web_icon2.png" alt="ICTRAX network icon"></div>
      <div><div class="name">ICTRAX</div><div class="sub">CEU MALOLOS · ICT</div></div>
    </div>
    <div class="nav-section-label">${role==='admin'?'Laboratory Control':'My Workspace'}</div>
    ${navHtml}
    <div class="side-foot">
      <div class="user-chip">
        <div class="avatar">${state.user.initials}</div>
        <div class="who"><div class="n">${esc(state.user.name)}</div><div class="r">${role==='admin'?esc(state.user.title):esc(state.user.department||'Faculty')}</div></div>
      </div>
      <button class="btn btn-outline btn-sm btn-block" onclick="logout()">${icon('logout')} <span class="label-text">Sign out</span></button>
    </div>`;
}

function auditActionStyle(action){
  return {
    create:{label:'Added',bg:'var(--teal-tint)',fg:'var(--teal-dark)',icon:'plus'},
    update:{label:'Changed',bg:'var(--amber-tint)',fg:'var(--amber-dark)',icon:'edit'},
    delete:{label:'Removed',bg:'var(--red-tint)',fg:'var(--red-dark)',icon:'trash'},
  }[action] || {label:action,bg:'var(--surface-sunk)',fg:'var(--text-700)',icon:'activity'};
}
function renderAuditDetails(row){
  const details = row.details || {};
  const action = auditActionStyle(row.action);
  const previous = details.previous || null;
  const current = details.current || null;
  if(previous && current){
    const keys = [...new Set([...Object.keys(previous),...Object.keys(current)])].filter(key=>!['id','equipment_code','equipment_id'].includes(key));
    return `<div style="display:grid;gap:6px">${keys.map(key=>{
      const before = String(previous[key] ?? '');
      const after = String(current[key] ?? '');
      const changed = before !== after;
      return `<div style="padding:7px 9px;border-radius:6px;background:${changed?'var(--amber-tint)':'var(--surface-sunk)'};color:${changed?'var(--amber-dark)':'var(--text-500)'}"><strong>${esc(key)}</strong>${changed?`<div style="margin-top:3px;color:var(--red-dark)">Before: ${esc(before||'—')}</div><div style="color:var(--teal-dark)">After: ${esc(after||'—')}</div>`:' <span>unchanged</span>'}</div>`;
    }).join('')}</div>`;
  }
  const values = current || previous || details;
  return `<div style="padding:8px 10px;border-radius:6px;background:${action.bg};color:${action.fg}"><pre style="white-space:pre-wrap;margin:0;font:12px var(--font-mono)">${esc(JSON.stringify(values,null,2))}</pre></div>`;
}
function renderAuditView(){
  setTimeout(loadAuditView,0);
  return `<div class="view">
    <div class="toolbar"><div><div class="sub">Administrative history of changes made to equipment and incident records.</div></div><button class="btn btn-outline" onclick="loadAuditView()">${icon('activity')} Refresh</button></div>
    <div class="card"><div class="card-body flush"><div id="audit-content"><div class="page-loading">Loading audit history...</div></div></div></div>
  </div>`;
}
async function loadAuditView(){
  const root = $('#audit-content');
  if(!root) return;
  root.innerHTML = '<div class="page-loading">Loading audit history...</div>';
  try {
    const response = await apiRequest('audit.php?limit=250');
    if(!response.success) throw new Error(response.message || 'Unable to load audit history');
    const rows = response.data || [];
    root.innerHTML = rows.length ? `<div class="table-wrap"><table class="dtable"><thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>${rows.map(row=>{
      const action = auditActionStyle(row.action);
      return `<tr><td>${esc(row.created_at)}</td><td>${esc(row.username || 'System')}</td><td><span style="display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:6px;background:${action.bg};color:${action.fg};font-size:12px;font-weight:600">${icon(action.icon)} ${action.label}</span></td><td>${esc(row.entity_type)} · ${esc(row.entity_id)}</td><td><details><summary>View changes</summary><div style="max-width:520px;margin-top:10px">${renderAuditDetails(row)}</div></details></td></tr>`;
    }).join('')}</tbody></table></div>` : emptyState('inbox','No audit history','Changes will appear here after an administrator creates, edits, or deletes a record.');
  } catch(err) {
    root.innerHTML = emptyState('alert','Audit history unavailable',esc(err.message));
  }
}
function navigate(viewId,opts={}){
  const target = PAGE_MAP[viewId];
  if(!target) return;
  if(opts.presetEquipId!==undefined){
    state.presetEquipId = opts.presetEquipId;
    try{ sessionStorage.setItem(PRESET_KEY, opts.presetEquipId || ''); }catch(err){}
  }
  if(currentPage() !== viewId){
    window.location.href = target;
    return;
  }
  state.view = viewId;
  const [crumb,title] = TITLES[viewId]||['',''];
  if($('#topbar-crumb')) $('#topbar-crumb').textContent = crumb;
  if($('#topbar-title')) $('#topbar-title').textContent = title;
  const renderFn = VIEWS[viewId];
  if($('#view-root')) $('#view-root').innerHTML = renderFn ? renderFn() : '';
  renderSidebar();
  window.scrollTo(0,0);
}
/* ============================================================
   Part 2 — shared UI fragments, admin views, faculty views,
   CRUD + modal logic, init
   ============================================================ */

/* ---------- shared fragments ---------- */
function statCard(iconName,label,value,sub,tone){
  const toneMap = {teal:['var(--teal-tint)','var(--teal-dark)'],amber:['var(--amber-tint)','var(--amber-dark)'],red:['var(--red-tint)','var(--red-dark)'],blue:['var(--blue-tint)','var(--blue-dark)']};
  const [bg,fg] = toneMap[tone]||toneMap.teal;
  return `<div class="stat-card">
    <div class="stat-top"><div class="icon-badge" style="background:${bg};color:${fg}">${icon(iconName)}</div></div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${esc(label)}</div>
    <div class="cell-sub" style="margin-top:6px">${esc(sub)}</div>
  </div>`;
}
function legendRow(hex,label,value){
  return `<div class="legend-row"><span class="sw" style="background:${hex}"></span>${esc(label)}<span class="lv">${value}</span></div>`;
}
function guidanceRow(color,label,text){
  return `<div style="display:flex;gap:12px;align-items:flex-start"><span class="badge badge-${color}" style="margin-top:1px;flex:none"><i></i>${label}</span><span style="font-size:13px;color:var(--text-700)">${text}</span></div>`;
}
function emptyState(iconName,title,body){
  return `<div class="empty-state"><div class="glyph">${icon(iconName)}</div><h4>${esc(title)}</h4><p>${esc(body)}</p></div>`;
}
function sortableHeader(table,key,label){
  const sort=state.sorts[table];
  const active=sort?.key===key;
  const arrow=active ? (sort.direction==='asc'?'▲':'▼') : '↕';
  return `<th><button class="table-sort-button${active?' active':''}" type="button" onclick="sortTable('${table}','${key}')" aria-label="Sort by ${esc(label)}">${esc(label)} <span aria-hidden="true">${arrow}</span></button></th>`;
}
function columnFilterHeader(table,key,label){
  const value=state.filters.columnFilters?.[table]?.[key]||'';
  const open=Boolean(state.filters.columnFilters?.[table]?.[`__open_${key}`]);
  const inputId=`column-filter-${table}-${key}`;
  return `<th><button class="table-sort-button${value?' active':''}" type="button" onclick="toggleColumnFilter('${table}','${key}')" data-filter-label="${esc(label)}" aria-label="Filter by ${esc(label)}" aria-controls="${inputId}" aria-expanded="${open}">${esc(label)} <span aria-hidden="true">${value?'●':'⌄'}</span></button><input id="${inputId}" class="column-filter-input${open?'':' hidden'}" type="text" value="${esc(value)}" placeholder="Filter..." aria-label="Filter ${esc(label)}" oninput="columnFilterInput('${table}','${key}',this.value)"></th>`;
}
function sortableFilterHeader(table,key,label){
  const value=state.filters.columnFilters?.[table]?.[key]||'';
  const open=Boolean(state.filters.columnFilters?.[table]?.[`__open_${key}`]);
  const inputId=`column-filter-${table}-${key}`;
  return `<th><span class="table-header-controls"><button class="table-sort-button" type="button" onclick="sortTable('${table}','${key}')" aria-label="Sort by ${esc(label)}">${esc(label)}</button><button class="column-filter-toggle${value?' active':''}${open?' open':''}" type="button" onclick="toggleColumnFilter('${table}','${key}')" data-filter-label="${esc(label)}" aria-label="${open?'Hide':'Show'} ${esc(label)} filter" aria-controls="${inputId}" aria-expanded="${open}"><span aria-hidden="true">⌄</span></button></span><input id="${inputId}" class="column-filter-input${open?'':' hidden'}" type="text" value="${esc(value)}" placeholder="Filter..." aria-label="Filter ${esc(label)}" oninput="columnFilterInput('${table}','${key}',this.value)"></th>`;
}
function toggleColumnFilter(table,key){
  const filters=state.filters.columnFilters[table]||{};
  filters[`__open_${key}`]=!filters[`__open_${key}`];
  state.filters.columnFilters[table]=filters;
  const input=document.getElementById(`column-filter-${table}-${key}`);
  const button=input?.closest('th')?.querySelector(`button[aria-controls="column-filter-${table}-${key}"]`);
  if(input && button){
    const open=Boolean(filters[`__open_${key}`]);
    input?.classList.toggle('hidden',!filters[`__open_${key}`]);
    button.setAttribute('aria-expanded',String(open));
    button.classList.toggle('open',open);
    if(button.classList.contains('column-filter-toggle')){
      button.setAttribute('aria-label',`${open?'Hide':'Show'} ${button.dataset.filterLabel||key} filter`);
    }
    if(open) requestAnimationFrame(()=>input.focus({preventScroll:true}));
    return;
  }
  renderFilteredTable(table);
}
function columnFilterInput(table,key,value){
  const filters=state.filters.columnFilters[table] || {};
  filters[key]=value;
  state.filters.columnFilters[table]=filters;
  const input=document.getElementById(`column-filter-${table}-${key}`);
  const button=input?.closest('th')?.querySelector(`button[aria-controls="column-filter-${table}-${key}"]`);
  if(button){
    const active=Boolean(String(value).trim());
    button?.classList.toggle('active',active);
    if(!button.classList.contains('column-filter-toggle')){
      const indicator=button.querySelector('span');
      if(indicator) indicator.textContent=active?'●':'⌄';
    }
  }
  renderFilteredTable(table,key,value);
}
function columnFilterValue(table,key){
  return state.filters.columnFilters?.[table]?.[key]?.trim().toLowerCase()||'';
}
function columnFilterDateValue(value){
  const raw=String(value ?? '');
  if(!raw) return '';
  const dateOnly=raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '';
  if(!dateOnly) return raw;
  const date=new Date(`${dateOnly}T00:00:00`);
  if(Number.isNaN(date.getTime())) return raw;
  const longDate=date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  return `${raw} ${fmtDate(dateOnly)} ${longDate}`;
}
function columnFilterDisplayValue(row,table,key){
  if(key==='status') return row.status ?? '';
  if(table==='equipment' && key==='risk'){
    const score=calcRisk(row);
    return `${score} ${riskBand(score).label}`;
  }
  if(['dateAcquired','lastMaintenance','dateReported','resolvedDate','archived_date'].includes(key)){
    return columnFilterDateValue(row[key]);
  }
  if(table==='equipment' && key==='name'){
    return [row.name,row.category,row.serial].filter(Boolean).join(' ');
  }
  if((table==='incidents' || table==='completed' || table==='myreports') && key==='equipment'){
    const equipment=DB.equipment.find(item=>item.id===row.equipmentId);
    return equipment
      ? [equipment.name,equipment.id,equipment.location].filter(Boolean).join(' ')
      : row.equipmentId ?? '';
  }
  if((table==='incidents' || table==='completed') && key==='reportedByName'){
    return [row.reportedByName,row.reportedByDepartment].filter(Boolean).join(' ');
  }
  return sortValue(row,table,key);
}
function matchesColumnFilter(row,table,key,value){
  if(!value) return true;
  const filterValue=columnFilterDisplayValue(row,table,key);
  const normalizedFilter=String(value).trim().toLowerCase();
  const normalizedValue=String(filterValue ?? '').toLowerCase();
  if(key==='status'){
    const statusWords=normalizedValue.split(/\s+/).filter(Boolean);
    const filterWords=normalizedFilter.split(/\s+/).filter(Boolean);
    return filterWords.every(term=>statusWords.some(word=>word.startsWith(term)));
  }
  return normalizedValue.includes(normalizedFilter);
}
function renderFilteredTable(table){
  if(table==='archived') renderArchivedRows();
  else if(table==='equipment') renderEquipmentResults();
  else if(table==='incidents') renderIncidentResults();
  else if(table==='completed') renderCompletedIncidentResults();
  else if(table==='myreports') renderMyReportsResults();
}
const EQUIPMENT_STATUS_ORDER = Object.freeze(['Operational','Under Repair','Damaged','Missing','Condemned']);
function equipmentStatusRank(status){
  const rank=EQUIPMENT_STATUS_ORDER.indexOf(status);
  return rank===-1 ? EQUIPMENT_STATUS_ORDER.length : rank;
}
const INCIDENT_STATUS_ORDER = Object.freeze(['Resolved','In Progress','Pending','Rejected']);
function incidentStatusRank(status){
  const rank=INCIDENT_STATUS_ORDER.indexOf(status);
  return rank===-1 ? INCIDENT_STATUS_ORDER.length : rank;
}
function equipmentCreatedRank(row){
  const recordSequence=Number(row?.recordSequence);
  if(Number.isFinite(recordSequence) && recordSequence>0) return recordSequence;
  const raw=String(row?.createdAt||'').trim();
  if(!raw) return 0;
  const timestamp=Date.parse(raw.includes(' ') ? raw.replace(' ','T') : raw);
  return Number.isFinite(timestamp) ? timestamp : 0;
}
function sortValue(row,table,key){
  if((table==='equipment' || table==='browse') && key==='status') return equipmentStatusRank(row.status);
  if((table==='equipment' || table==='browse') && key==='createdAt') return equipmentCreatedRank(row);
  if((table==='incidents' || table==='completed' || table==='myreports') && key==='status') return incidentStatusRank(row.status);
  if(table==='equipment' && key==='risk') return calcRisk(row);
  if((table==='incidents' || table==='completed' || table==='myreports') && key==='equipment'){
    return DB.equipment.find(e=>e.id===row.equipmentId)?.name || '';
  }
  return row[key] ?? '';
}
function sortTableRows(rows,table){
  const sort=state.sorts[table];
  if(!sort) return rows;
  return rows.slice().sort((a,b)=>{
    const left=sortValue(a,table,sort.key);
    const right=sortValue(b,table,sort.key);
    let comparison;
    if(typeof left==='number' && typeof right==='number'){
      comparison=left-right;
    }else{
      const leftDate=Date.parse(left);
      const rightDate=Date.parse(right);
      comparison=Number.isFinite(leftDate) && Number.isFinite(rightDate)
        ? leftDate-rightDate
        : String(left).localeCompare(String(right),undefined,{numeric:true,sensitivity:'base'});
    }
    return sort.direction==='asc' ? comparison : -comparison;
  });
}
function sortTable(table,key){
  const current=state.sorts[table];
  state.sorts[table]={
    key,
    direction:current?.key===key && current.direction==='asc' ? 'desc' : 'asc',
  };
  if(table==='archived'){
    renderArchivedRows();
  }else if(table==='equipment'){
    renderEquipmentResults();
  }else if(table==='browse'){
    renderBrowseResults();
  }else if(table==='incidents'){
    renderIncidentResults();
  }else if(table==='completed'){
    renderCompletedIncidentResults();
  }else if(table==='myreports'){
    renderMyReportsResults();
  }
}

/* ============================================================
   ADMIN — Dashboard
   ============================================================ */
const DASHBOARD_INCIDENT_RANGES = Object.freeze([
  ['last6months','Last 6 Months'],
  ['all','All Time'],
  ['thisYear','This Year'],
  ['thisQuarter','This Quarter'],
  ['thisMonth','This Month'],
  ['lastYear','Last Year'],
  ['lastQuarter','Last Quarter'],
]);
function dashboardIncidentDateRange(range){
  const today=new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate());
  const year=today.getFullYear();
  const month=today.getMonth();
  let start=new Date(year,month-5,1);
  let end=today;
  let label='Last 6 Months';
  if(range==='all'){
    const dates=DB.incidents.map(incident=>incident.dateReported).filter(Boolean).sort();
    start=dates.length?new Date(`${dates[0]}T00:00:00`):new Date(year,month,1);
    label='All Time';
  }else if(range==='thisYear'){
    start=new Date(year,0,1);
    label='This Year';
  }else if(range==='thisQuarter'){
    start=new Date(year,Math.floor(month/3)*3,1);
    label='This Quarter';
  }else if(range==='thisMonth'){
    start=new Date(year,month,1);
    label='This Month';
  }else if(range==='lastYear'){
    start=new Date(year-1,0,1);
    end=new Date(year-1,11,31);
    label='Last Year';
  }else if(range==='lastQuarter'){
    const quarterStart=Math.floor(month/3)*3-3;
    start=new Date(year,quarterStart,1);
    end=new Date(year,quarterStart+3,0);
    label='Last Quarter';
  }
  const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return {start:iso(start),end:iso(end),label};
}
function dashboardIncidentRangeOptions(selected){
  return DASHBOARD_INCIDENT_RANGES.map(([value,label])=>`<option value="${value}" ${selected===value?'selected':''}>${label}</option>`).join('');
}
function onDashboardIncidentRange(value){
  state.dashboardIncidentRange=DASHBOARD_INCIDENT_RANGES.some(([range])=>range===value)?value:'last6months';
  if(state.view==='dashboard') $('#view-root').innerHTML=renderAdminDashboard();
}
function renderAdminDashboard(){
  const eq = DB.equipment;
  const dashboardRange=dashboardIncidentDateRange(state.dashboardIncidentRange);
  const rangeIncidents=DB.incidents.filter(incident=>incident.dateReported>=dashboardRange.start&&incident.dateReported<=dashboardRange.end);
  const scopedEquipmentIds=new Set(rangeIncidents.map(incident=>String(incident.equipmentId)));
  const scopedEquipment=eq.filter(e=>scopedEquipmentIds.has(String(e.id)));
  const total = eq.length;
  const byStatus = {};
  scopedEquipment.forEach(e=>{ byStatus[e.status]=(byStatus[e.status]||0)+1; });
  const operational = eq.filter(e=>e.status==='Operational').length;
  const pending = DB.incidents.filter(i=>i.status==='Pending').length;
  const inProgress = DB.incidents.filter(i=>i.status==='In Progress').length;
  const risks = eq.map(e=>({e,score:calcRisk(e)})).sort((a,b)=>b.score-a.score);
  const elevated = risks.filter(r=>r.score>=50).length;

  const donut = donutSVG([
    {label:'Operational',value:byStatus['Operational']||0,hex:'#2f8f7f'},
    {label:'Under Repair',value:byStatus['Under Repair']||0,hex:'#df9f34'},
    {label:'Damaged',value:byStatus['Damaged']||0,hex:'#c1443c'},
    {label:'Missing',value:byStatus['Missing']||0,hex:'#9c332c'},
    {label:'Condemned',value:byStatus['Condemned']||0,hex:'#93959c'},
  ]);

  const chartStart=new Date(`${dashboardRange.start}T00:00:00`);
  const chartEnd=new Date(`${dashboardRange.end}T00:00:00`);
  const monthBuckets=[];
  const cursor=new Date(chartStart.getFullYear(),chartStart.getMonth(),1);
  const lastMonth=new Date(chartEnd.getFullYear(),chartEnd.getMonth(),1);
  const spansYears=chartStart.getFullYear()!==chartEnd.getFullYear();
  while(cursor<=lastMonth){
    const key=cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0');
    const monthLabel=cursor.toLocaleDateString('en-US',{month:'short'});
    monthBuckets.push({key,label:spansYears?`${monthLabel} '${String(cursor.getFullYear()).slice(-2)}`:monthLabel});
    cursor.setMonth(cursor.getMonth()+1);
  }
  const monthData = monthBuckets.map(mb=>({label:mb.label,value:rangeIncidents.filter(i=>i.dateReported.startsWith(mb.key)).length,hex:'#3f6fb0'}));
  const recent = [...rangeIncidents].sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported)).slice(0,5);

  return `<div class="view">
    <div class="stat-grid">
      ${statCard('monitor','Total Equipment',total,`${operational} operational`,'teal')}
      ${statCard('inbox','Pending Incidents',pending,`${inProgress} in progress`,pending>0?'amber':'teal')}
      ${statCard('alert','Elevated Risk Units',elevated,'High or Critical band','red')}
      ${statCard('check','Fleet Availability',(total?Math.round(operational/total*100):0)+'%','Currently Operational','teal')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><div><h3>Equipment Status</h3><div class="sub">Equipment with reports in ${dashboardRange.label.toLowerCase()} · ${scopedEquipment.length} tagged units</div></div></div>
        <div class="card-body" style="display:flex;gap:26px;align-items:center;flex-wrap:wrap">
          ${donut}
          <div style="flex:1;min-width:180px">
            ${legendRow('#2f8f7f','Operational',byStatus['Operational']||0)}
            ${legendRow('#df9f34','Under Repair',byStatus['Under Repair']||0)}
            ${legendRow('#c1443c','Damaged',byStatus['Damaged']||0)}
            ${legendRow('#9c332c','Missing',byStatus['Missing']||0)}
            ${legendRow('#93959c','Condemned',byStatus['Condemned']||0)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Top At-Risk Equipment</h3><div class="sub">Risk model v${RISK_MODEL.version}, highest priority first</div></div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('risk')">View all ${icon('chevron')}</button>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
          ${risks.slice(0,5).map(r=>`
            <div style="display:flex;align-items:center;gap:12px">
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.e.name)}</div>
                <div class="cell-sub">${tagChip(r.e.id)}</div>
              </div>
              ${riskBar(r.score)}
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top:18px">
      <div class="card">
        <div class="card-head"><div><h3>Incident Reports — ${dashboardRange.label}</h3><div class="sub">Submitted by faculty</div></div><select class="select-filter dashboard-range-filter" aria-label="Incident report date range" onchange="onDashboardIncidentRange(this.value)">
          ${dashboardIncidentRangeOptions(state.dashboardIncidentRange)}
        </select></div>
        <div class="card-body">${barSVG(monthData,{width:520,gap:10})}</div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Recent Reports</h3><div class="sub">Latest submissions</div></div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('incidents')">View all ${icon('chevron')}</button>
        </div>
        <div class="card-body flush">
          ${recent.length===0?emptyState('inbox','No incidents yet','Incident reports will appear here as they come in.'):
          `<div class="table-wrap"><table class="dtable"><tbody>
          ${recent.map(i=>{
            const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
            return `<tr style="cursor:pointer" onclick="openIncidentModal('${jsString(i.id)}')">
              <td><div class="cell-strong">${eqp?esc(eqp.name):'—'}</div><div class="cell-sub">${esc(i.reportedByName)} · ${fmtDate(i.dateReported)}</div></td>
              <td>${badge(i.status)}</td>
            </tr>`;
          }).join('')}
          </tbody></table></div>`}
        </div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   ADMIN — Equipment Inventory
   ============================================================ */
function equipmentTableRowsMarkup(rows){
  return rows.map(e=>{
    const score = calcRisk(e);
    return `<tr>
      <td>${tagChip(e.id)}</td>
      <td><div class="cell-strong equipment-name-cell"><span class="equipment-name-text">${esc(e.name)}</span></div><div class="cell-sub">${esc(e.category)} · ${esc(e.serial)}</div></td>
      <td>${esc(e.location)}</td>
      <td>${badge(e.status)}</td>
      <td>${riskBar(score)}</td>
      <td>${fmtDate(e.dateAcquired)}</td>
      <td><div>${fmtDate(e.lastMaintenance)}</div><div class="cell-sub">${maintenanceAgeLabel(e)} since last maintenance</div></td>
      <td><div class="row-actions">
        <button class="icon-btn" title="View equipment details" onclick="openEquipmentDetailsModal('${jsString(e.id)}')">${icon('eye')}</button>
        <button class="icon-btn" title="View QR tag" onclick="openQrModal('${jsString(e.id)}')">${icon('qrcode')}</button>
        <button class="icon-btn" title="Open service card" onclick="openServiceCardModal('${jsString(e.id)}')">${icon('file')}</button>
        <button class="icon-btn" title="Edit" onclick="openEquipmentForm('${jsString(e.id)}')">${icon('edit')}</button>
        <button class="icon-btn" title="Archive" onclick="confirmArchiveEquipment('${jsString(e.id)}')">${icon('trash')}</button>
      </div></td>
    </tr>`;
  }).join('');
}
function renderEquipmentResults(){
  const rows=filteredEquipmentRows();
  const body=$('#equipment-table-body');
  const empty=$('#equipment-empty-state');
  if(body) body.innerHTML=equipmentTableRowsMarkup(rows);
  if(empty){
    empty.classList.toggle('hidden',rows.length>0);
    empty.innerHTML=rows.length ? '' : emptyState('inbox','No equipment found','Try clearing filters, or add a new unit to the inventory.');
  }
}
function renderEquipmentView(){
  const f = state.filters;
  const rows = filteredEquipmentRows();
  const categories=[...new Set([...catalogState.categories,...DB.equipment.map(e=>e.category)])];
  const statuses=['Operational','Under Repair','Damaged','Missing','Condemned'];

  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input type="text" placeholder="Search by name, tag ID, or location…" value="${esc(f.equipSearch)}" oninput="onEquipSearch(this.value)"></div>
        <select class="select-filter" onchange="onEquipFilter('equipCategory',this.value)">
          <option value="all">All categories</option>
          ${categories.map(c=>`<option value="${esc(c)}" ${f.equipCategory===c?'selected':''}>${esc(c)}</option>`).join('')}
        </select>
        <select class="select-filter" onchange="onEquipFilter('equipStatus',this.value)">
          <option value="all">All statuses</option>
          ${statuses.map(s=>`<option value="${s}" ${f.equipStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline" onclick="exportEquipmentXLSX()">${icon('download')} Export Excel</button><button class="btn btn-outline" onclick="openQrScannerModal()">${icon('camera')} Scan QR</button><button class="btn btn-outline" onclick="openDemoQrSheet()">${icon('qrcode')} Demo QR Sheet</button><button class="btn btn-outline" onclick="openCatalogManager()">${icon('list')} Manage Options</button><button class="btn btn-primary" onclick="openEquipmentForm()">${icon('plus')} Add Equipment</button></div>
    </div>

    <div class="card"><div class="card-body flush">
      <div class="table-wrap"><table class="dtable">
        <thead><tr>${columnFilterHeader('equipment','id','Tag ID')}${columnFilterHeader('equipment','name','Equipment')}${columnFilterHeader('equipment','location','Location')}${columnFilterHeader('equipment','status','Status')}${columnFilterHeader('equipment','risk','Risk')}${columnFilterHeader('equipment','dateAcquired','Date Acquired')}${columnFilterHeader('equipment','lastMaintenance','Last Maintenance')}<th></th></tr></thead>
        <tbody id="equipment-table-body">${equipmentTableRowsMarkup(rows)}</tbody>
      </table></div>
      <div id="equipment-empty-state" class="${rows.length?'hidden':''}">${rows.length?'':emptyState('inbox','No equipment found','Try clearing filters, or add a new unit to the inventory.')}</div>
    </div></div>
  </div>`;
}
function onEquipSearch(v){ state.filters.equipSearch=v; renderEquipmentResults(); }
function onEquipFilter(key,val){ state.filters[key]=val; renderEquipmentResults(); }

function categoryTagLabel(category){
  if(category.tagIdMode==='manual') return 'Manual Tag ID';
  return `Automatic · ${category.tagPrefix||''}${category.tagSequence||''}-##`;
}
function masterTagModeEnabled(){
  return catalogState.categoryRecords.length===0 || catalogState.categoryRecords.every(category=>category.tagIdMode!=='manual');
}
function openCatalogManager(){
  const masterAutomatic=masterTagModeEnabled();
  openModal(`<div class="modal-head"><div><h3>Manage Equipment Options</h3><div class="modal-sub">Choose automatic or manual Tag IDs for each equipment category.</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body"><div class="field">
      <label for="new-category">New Category</label>
      <div class="catalog-category-create"><input id="new-category" required placeholder="e.g. Scanner" oninput="suggestNewCategoryPrefix(this.value)"><button class="btn btn-outline" type="button" onclick="addCatalogOption('category')">${icon('plus')} Add</button></div>
      <div class="catalog-tag-settings">
        <div class="catalog-tag-settings-title">New Category Tag ID Settings</div>
        <div class="field-row"><div class="field"><label>Automatic Tag ID / Equipment Number</label><label class="toggle-control"><input type="checkbox" id="new-category-automatic" ${masterAutomatic?'checked':''} onchange="onCategoryTagModeChange('new-category')"><span class="toggle-track"></span><span>Generate automatically</span></label></div><div class="field"><label for="new-category-prefix">Prefix</label><input id="new-category-prefix" maxlength="12" placeholder="e.g. SC" oninput="this.dataset.userEdited='true';updateCategoryTagPreview('new-category')" ${masterAutomatic?'':'disabled'}></div><div class="field"><label for="new-category-sequence">Sequence</label><input id="new-category-sequence" maxlength="6" inputmode="numeric" value="01" oninput="updateCategoryTagPreview('new-category')" ${masterAutomatic?'':'disabled'}></div></div>
        <div id="new-category-preview" class="hint">Tag preview: enter a prefix and numeric sequence.</div>
      </div>
    </div>
    <div class="catalog-master-control"><div><strong>Apply one mode to all categories</strong><span>Use this shortcut to change every existing category. You can still edit categories individually below.</span></div><label class="toggle-control"><input type="checkbox" id="master-tag-automatic" ${masterAutomatic?'checked':''} onchange="saveMasterTagMode(this)"><span class="toggle-track"></span><span>All automatic</span></label></div>
    <div class="field"><label>Categories</label><div class="kv-list">${catalogState.categoryRecords.map(x=>`<div class="kv-row catalog-category-row"><span class="v"><strong>${esc(x.name)}</strong><span class="cell-sub">${esc(categoryTagLabel(x))}${Number(x.isBuiltin)?' · Built-in':''}</span></span><div class="row-actions"><button class="icon-btn" title="Edit Tag ID settings" aria-label="Edit ${esc(x.name)} Tag ID settings" onclick="openCategorySettings(${Number(x.id)})">${icon('edit')}</button>${Number(x.isBuiltin)?'':`<button class="icon-btn" title="Remove" aria-label="Remove ${esc(x.name)}" onclick="removeCatalogOption('category',${Number(x.id)})">${icon('trash')}</button>`}</div></div>`).join('')}</div></div>
    <div class="field"><label>New Location</label><div class="catalog-category-create"><input id="new-location" required placeholder="e.g. Media Lab"><button class="btn btn-outline" type="button" onclick="addCatalogOption('location')">${icon('plus')} Add</button></div></div>
    <div class="field"><label>Locations</label><div class="kv-list">${catalogState.locationRecords.map(x=>`<div class="kv-row"><span class="v">${esc(x.name)}</span>${Number(x.isBuiltin)?'<span class="cell-sub">Built-in</span>':`<button class="icon-btn" title="Remove" onclick="removeCatalogOption('location',${Number(x.id)})">${icon('trash')}</button>`}</div>`).join('')}</div></div></div>
    <div class="modal-foot"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
  updateCategoryTagPreview('new-category');
}
async function saveMasterTagMode(toggle){
  const automatic=toggle.checked;
  toggle.disabled=true;
  try{
    await apiRequest('catalog.php',{method:'PUT',body:JSON.stringify({type:'tag-mode',automatic})});
    await refreshCatalogs();
    openCatalogManager();
    toast(automatic?'Automatic Tag ID generation enabled':'Manual Tag ID entry enabled','good');
  }catch(err){
    toggle.checked=!automatic;
    toggle.disabled=false;
    toast(err.message,'bad');
  }
}
function onCategoryTagModeChange(scope){
  const automatic=$(`#${scope}-automatic`)?.checked ?? $(`#${scope}-mode`)?.value!=='manual';
  const prefix=$(`#${scope}-prefix`);
  const sequence=$(`#${scope}-sequence`);
  if(prefix){ prefix.disabled=!automatic; prefix.required=automatic; }
  if(sequence){ sequence.disabled=!automatic; sequence.required=automatic; }
  updateCategoryTagPreview(scope);
}
function suggestedCategoryPrefix(name){
  const words=String(name||'').toUpperCase().match(/[A-Z0-9]+/g)||[];
  if(words.length>1) return words.map(word=>word[0]).join('').slice(0,12);
  return (words[0]||'').slice(0,2);
}
function suggestNewCategoryPrefix(name){
  const prefix=$('#new-category-prefix');
  if(prefix && prefix.dataset.userEdited!=='true') prefix.value=suggestedCategoryPrefix(name);
  updateCategoryTagPreview('new-category');
}
function updateCategoryTagPreview(scope){
  const preview=$(`#${scope}-preview`);
  if(!preview) return;
  const automatic=$(`#${scope}-automatic`)?.checked ?? $(`#${scope}-mode`)?.value!=='manual';
  if(!automatic){
    preview.textContent='Prefix and sequence are only used for automatic generation. For this category, enter the complete Tag ID on each Add Equipment form.';
    return;
  }
  const prefix=($(`#${scope}-prefix`)?.value||'').trim().toUpperCase();
  const sequence=($(`#${scope}-sequence`)?.value||'').trim();
  preview.textContent=prefix&&sequence ? `First tag in this series: ${prefix}${sequence}-01` : 'Tag preview: enter a prefix and numeric sequence.';
}
function categoryTagEditableData(category={}){
  const tagIdMode=category.tagIdMode==='manual'?'manual':'automatic';
  return {
    tagIdMode,
    tagPrefix:tagIdMode==='automatic'?String(category.tagPrefix||'').trim().toUpperCase():'',
    tagSequence:tagIdMode==='automatic'?String(category.tagSequence||'').trim():'',
  };
}
function openCategorySettings(id){
  const category=catalogState.categoryRecords.find(item=>Number(item.id)===Number(id));
  if(!category){ toast('Category not found','bad'); return; }
  openModal(`<div class="modal-head"><div><h3>Edit Category Tag Settings</h3><div class="modal-sub">${esc(category.name)} · Existing equipment tags will not be changed.</div></div><button class="modal-close" onclick="openCatalogManager()">${icon('x')}</button></div>
    <form onsubmit="saveCategorySettings(event,${Number(category.id)})"><div class="modal-body">
      <div class="field"><label>Category</label><input value="${esc(category.name)}" readonly></div>
      <div class="field"><label>Automatic Tag ID / Equipment Number</label><label class="toggle-control"><input type="checkbox" id="edit-category-automatic" ${category.tagIdMode!=='manual'?'checked':''} onchange="onCategoryTagModeChange('edit-category')"><span class="toggle-track"></span><span>Generate automatically</span></label></div>
      <div class="field-row"><div class="field"><label>Prefix (automatic mode)</label><input id="edit-category-prefix" maxlength="12" value="${esc(category.tagPrefix||'')}" oninput="updateCategoryTagPreview('edit-category')"></div><div class="field"><label>Sequence (automatic mode)</label><input id="edit-category-sequence" maxlength="6" inputmode="numeric" value="${esc(category.tagSequence||'01')}" oninput="updateCategoryTagPreview('edit-category')"></div></div>
      <div id="edit-category-preview" class="hint"></div>
      <div class="banner banner-blue" style="margin-top:14px">A new sequence starts at equipment number 01. For example, prefix SC and sequence 02 generates SC02-01.</div>
    </div><div class="modal-foot"><button type="button" class="btn btn-outline" onclick="openCatalogManager()">Cancel</button><button type="submit" class="btn btn-primary">Save Tag Settings</button></div></form>`);
  onCategoryTagModeChange('edit-category');
}
async function saveCategorySettings(event,id){
  event.preventDefault();
  const button=event.currentTarget.querySelector('button[type="submit"]');
  const data={
    type:'category',id,
    tagIdMode:$('#edit-category-automatic').checked?'automatic':'manual',
    tagPrefix:$('#edit-category-prefix').value.trim().toUpperCase(),
    tagSequence:$('#edit-category-sequence').value.trim(),
  };
  const category=catalogState.categoryRecords.find(item=>Number(item.id)===Number(id));
  if(category && editableValuesMatch(categoryTagEditableData(category),categoryTagEditableData(data))){
    toast('No category changes to save','info');
    return;
  }
  try{
    button.disabled=true;
    const response=await apiRequest('catalog.php',{method:'PUT',body:JSON.stringify(data)});
    await refreshCatalogs();
    if(response.unchanged){
      toast('No category changes to save','info');
      return;
    }
    openCatalogManager();
    toast('Category tag settings updated','good');
  }catch(err){ toast(err.message,'bad'); }
  finally{ button.disabled=false; }
}
async function refreshCatalogs(){
  const response = await apiRequest('catalog.php');
  catalogState.categoryRecords = response.categories || [];
  catalogState.locationRecords = response.locations || [];
  catalogState.categories = catalogState.categoryRecords.map(x=>x.name);
  catalogState.locations = catalogState.locationRecords.map(x=>x.name);
}
function showFieldValidationError(control,message){
  if(control){
    control.setAttribute('aria-invalid','true');
    control.focus({preventScroll:true});
  }
  toast(message,'bad');
}
async function addCatalogOption(type){
  const input = type==='category' ? $('#new-category') : $('#new-location');
  const name = input?.value.trim();
  if(!name){
    showFieldValidationError(input,type==='category'?'Enter a category name first':'Enter a location name first');
    return;
  }
  try {
    const data={type,name};
    if(type==='category'){
      data.tagIdMode=$('#new-category-automatic')?.checked?'automatic':'manual';
      data.tagPrefix=$('#new-category-prefix').value.trim().toUpperCase();
      data.tagSequence=$('#new-category-sequence').value.trim();
      if(data.tagIdMode==='automatic' && !/^[A-Z0-9]{1,12}$/.test(data.tagPrefix)){
        showFieldValidationError($('#new-category-prefix'),'Enter a prefix using 1 to 12 letters or numbers');
        return;
      }
      if(data.tagIdMode==='automatic' && !/^[0-9]{1,6}$/.test(data.tagSequence)){
        showFieldValidationError($('#new-category-sequence'),'Enter a numeric sequence, such as 01');
        return;
      }
    }
    const response = await apiRequest('catalog.php',{method:'POST',body:JSON.stringify(data)});
    if(!response.success) throw new Error(response.message || 'Unable to add option');
    await refreshCatalogs();
    openCatalogManager();
    toast(`${name} added`,'good');
  } catch(err) { toast(err.message,'bad'); }
}
async function removeCatalogOption(type,id){
  try {
    const response = await apiRequest(`catalog.php?type=${type}&id=${id}`,{method:'DELETE'});
    if(!response.success) throw new Error(response.message || 'Unable to remove option');
    await refreshCatalogs();
    openCatalogManager();
    toast('Option removed','good');
  } catch(err) { toast(err.message,'bad'); }
}

function onEquipmentCategoryChange(editing=false){
  const category=$('#f-category')?.value||'';
  if(category==='__add__'){
    $('#f-category').value='';
    openCatalogManager();
    return;
  }
  const settings=categoryTagSettings(category);
  const input=$('#f-id');
  const label=$('#f-id-label');
  const hint=$('#f-id-hint');
  if(!input) return;
  if(settings.tagIdMode==='manual'){
    if(!editing && input.readOnly) input.value='';
    input.disabled=false;
    input.readOnly=false;
    input.required=true;
    input.placeholder='Enter a unique Tag ID';
    if(label) label.textContent='Tag ID / Equipment Number';
    if(hint) hint.textContent=editing?'Manual mode: you may edit this equipment Tag ID.':'Enter the Tag ID for this equipment.';
  }else{
    if(!editing){
      const finalTagId=nextEquipmentId(category);
      input.value=equipmentNumberFromTagId(finalTagId);
    }
    input.disabled=true;
    input.readOnly=true;
    input.required=false;
    input.placeholder='Generated automatically';
    if(label) label.textContent='Equipment Number';
    if(hint) hint.textContent=editing?'Automatic mode: this existing equipment number remains unchanged.':'Generated automatically using the settings saved for this category.';
  }
}

function onWarrantyCoverageChange(){
  const covered=$('#f-warranty-covered')?.value==='covered';
  const provider=$('#f-warranty-provider');
  const expiration=$('#f-warranty-expiration');
  if(provider){
    provider.disabled=!covered;
    if(!covered) provider.value='';
  }
  if(expiration){
    expiration.disabled=!covered;
    expiration.required=covered;
    if(!covered) expiration.value='';
  }
  $('.equipment-warranty-section')?.classList.toggle('active',covered);
}

function syncWarrantyMinimumDate(){
  const acquired=$('#f-acquired')?.value||'2000-01-01';
  const expiration=$('#f-warranty-expiration');
  if(expiration) expiration.min=acquired;
}

function equipmentEditableData(equipment={}){
  return {
    id:equipment.id||'',
    name:equipment.name||'',
    category:equipment.category||'',
    location:equipment.location||'',
    serial:equipment.serial||'',
    status:equipment.status||'',
    condition:equipment.condition||'',
    dateAcquired:equipment.dateAcquired||'',
    lastMaintenance:equipment.lastMaintenance||'',
    warrantyProvider:equipment.warrantyProvider||'',
    warrantyExpiration:equipment.warrantyExpiration||'',
    notes:equipment.notes||'',
  };
}

function openEquipmentForm(id){
  const editing = !!id;
  const e = editing ? DB.equipment.find(x=>x.id===id) : null;
  const categories = [...new Set([...catalogState.categories,...(e?[e.category]:[])])];
  const initialCategory=editing?e.category:(categories[0]||'');
  const initialSettings=categoryTagSettings(initialCategory);
  const initialFinalTag=editing?e.id:(initialSettings.tagIdMode==='manual'?'':nextEquipmentId(initialCategory));
  const initialTag=editing||initialSettings.tagIdMode==='manual'?initialFinalTag:equipmentNumberFromTagId(initialFinalTag);
  const initialIdHint=editing&&initialSettings.tagIdMode==='manual'?'Manual mode: you may edit this equipment Tag ID.':editing?'Automatic mode: this existing equipment number remains unchanged.':initialSettings.tagIdMode==='manual'?'Enter the Tag ID for this equipment.':'Generated automatically using the settings saved for this category.';
  const hasWarranty=Boolean(editing&&e.warrantyExpiration);
  openModal(`
    <div class="modal-head">
      <div><h3>${editing?'Edit Equipment':'Add Equipment'}</h3><div class="modal-sub">${editing?e.id:'Equipment number is assigned from the selected category'}</div></div>
      <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
    </div>
    <form onsubmit="submitEquipmentForm(event,'${jsString(editing?id:'')}')">
      <div class="modal-body">
        <div class="field"><label>Equipment Name</label><input type="text" id="f-name" required value="${editing?esc(e.name):''}" placeholder="e.g. Desktop Computer"></div>
        <div class="field-row">
          <div class="field"><label>Category</label><select id="f-category" required onchange="${editing?"if(this.value==='__add__'){this.value='';openCatalogManager();}else{onEquipmentCategoryChange(true);}":'onEquipmentCategoryChange()'}">
            ${categories.map(c=>`<option value="${esc(c)}" ${editing&&e.category===c?'selected':''}>${esc(c)}</option>`).join('')}
            <option value="__add__">+ Add Category</option>
          </select></div>
          <div class="field"><label>Location</label><select id="f-location" required>
            ${catalogState.locations.map(l=>`<option value="${esc(l)}" ${editing&&e.location===l?'selected':''}>${esc(l)}</option>`).join('')}
          </select></div>
        </div>
        <div class="field"><label id="f-id-label">${initialSettings.tagIdMode==='manual'?'Tag ID / Equipment Number':'Equipment Number'}</label><input type="text" id="f-id" value="${esc(initialTag)}" ${initialSettings.tagIdMode!=='manual'?'disabled readonly':''} ${initialSettings.tagIdMode==='manual'?'required':''} placeholder="${initialSettings.tagIdMode==='manual'?'Enter a unique Tag ID':'Generated automatically'}"><div id="f-id-hint" class="hint">${esc(initialIdHint)}</div></div>
        <div class="field"><label>Serial Number</label><input type="text" id="f-serial" required value="${editing?esc(e.serial):''}" placeholder="e.g. CEU-CL1-PC-107"></div>
        <div class="field-row">
          <div class="field"><label>Status</label><select id="f-status" required>
            ${['Operational','Under Repair','Damaged','Missing','Condemned'].map(s=>`<option ${editing&&e.status===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
          <div class="field"><label>Condition</label><select id="f-condition" required>
            ${['New','Good','Fair','Poor'].map(s=>`<option ${editing&&e.condition===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Date Acquired</label><input type="date" id="f-acquired" min="2000-01-01" max="${todayISO()}" required value="${editing?e.dateAcquired:''}" onchange="syncWarrantyMinimumDate()"></div>
          <div class="field"><label>Last Maintenance</label><input type="date" id="f-maint" min="2000-01-01" max="${todayISO()}" required value="${editing?e.lastMaintenance:todayISO()}"></div>
        </div>
        <section class="equipment-warranty-section${hasWarranty?' active':''}" aria-labelledby="equipment-warranty-heading">
          <div class="equipment-warranty-heading"><div><h4 id="equipment-warranty-heading">Warranty</h4><p>Administrators are notified 30 days before coverage expires.</p></div><span>${icon('shield')} Warranty tracking</span></div>
          <div class="field-row">
            <div class="field"><label>Warranty Option</label><select id="f-warranty-covered" onchange="onWarrantyCoverageChange()">
              <option value="none" ${!hasWarranty?'selected':''}>No warranty / not recorded</option>
              <option value="covered" ${hasWarranty?'selected':''}>Warranty coverage recorded</option>
            </select></div>
            <div class="field"><label>Expiration Date</label><input type="date" id="f-warranty-expiration" min="${editing&&e.dateAcquired?e.dateAcquired:'2000-01-01'}" ${hasWarranty?'required':'disabled'} value="${hasWarranty?esc(e.warrantyExpiration):''}"></div>
          </div>
          <div class="field"><label>Warranty Provider <span class="optional-label">Optional</span></label><input type="text" id="f-warranty-provider" maxlength="150" placeholder="e.g. Manufacturer or supplier" ${hasWarranty?'':'disabled'} value="${hasWarranty?esc(e.warrantyProvider||''):''}"></div>
        </section>
        <div class="field"><label>Notes</label><textarea id="f-notes" rows="3" placeholder="Optional remarks…">${editing?esc(e.notes||''):''}</textarea></div>
        <div class="field"><label for="f-photos">Attach photos to Notes <span class="optional-label">Optional · JPG, PNG, or WebP · 5 MB each</span></label><input type="file" id="f-photos" accept="image/jpeg,image/png,image/webp" multiple><div class="hint">Photos are stored with this equipment record and can be viewed from Equipment Details.</div></div>
        <div id="equipment-form-error" class="banner banner-red hidden" role="alert"></div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${editing?'Save Changes':'Add Equipment'}</button>
      </div>
    </form>`);
  onEquipmentCategoryChange(editing);
}

async function uploadEquipmentPhotos(equipmentId,files){
  const selected=Array.from(files||[]);
  for(const file of selected){
    const formData=new FormData();
    formData.append('equipment',equipmentId);
    formData.append('photo',file);
    const response=await apiRequest('equipment-photos.php',{method:'POST',body:formData});
    if(!response.success) throw new Error(response.message||'Unable to attach photo');
  }
}

async function submitEquipmentForm(e,id){
  e.preventDefault();
  const form=e.currentTarget;
  const submitButton=form.querySelector('button[type="submit"]');
  const errorBox=$('#equipment-form-error');
  errorBox.classList.add('hidden');
  errorBox.textContent='';
  let savedEquipmentId=id;
  const data = {
    id:$('#f-id').value.trim(),
    name:$('#f-name').value.trim(), category:$('#f-category').value, location:$('#f-location').value,
    serial:$('#f-serial').value.trim(), status:$('#f-status').value, condition:$('#f-condition').value,
    dateAcquired:$('#f-acquired').value, lastMaintenance:$('#f-maint').value,
    warrantyProvider:$('#f-warranty-provider').disabled?'':$('#f-warranty-provider').value.trim(),
    warrantyExpiration:$('#f-warranty-expiration').disabled?'':$('#f-warranty-expiration').value,
    notes:$('#f-notes').value.trim(),
  };
  if(id){
    const existingEquipment=DB.equipment.find(x=>x.id===id);
    if(!existingEquipment){
      showEquipmentFormError(errorBox,new Error('The equipment record is no longer available.'),'Equipment was not updated in the database');
      return;
    }
    const selectedPhotos=Array.from($('#f-photos')?.files||[]);
    if(editableValuesMatch(equipmentEditableData(existingEquipment),data) && selectedPhotos.length===0){
      toast('No equipment changes to save','info');
      return;
    }
    let riskBeforeUpdate=0;
    let riskAfterUpdate=0;
    let metadataSaved=false;
    let photosAttached=false;
    try {
      submitButton.disabled=true;
      riskBeforeUpdate=calcRisk(existingEquipment);
      const response = await apiRequest('equipment.php', {
        method:'PUT',
        body:JSON.stringify({...data,originalId:id}),
      });
      if (!response.success || !response.data) throw new Error(response.message || 'Unable to update equipment');
      savedEquipmentId=response.data.id;
      metadataSaved=!response.unchanged;
      Object.assign(existingEquipment,response.data);
      DB.incidents.forEach(incident=>{
        if(String(incident.equipmentId)===String(id)) incident.equipmentId=response.data.id;
      });
      riskAfterUpdate=calcRisk(existingEquipment);
    } catch (err) {
      console.error('ICTRAX: remote equipment update failed.', err);
      showEquipmentFormError(errorBox,err,'Equipment was not updated in the database');
      return;
    } finally {
      submitButton.disabled=false;
    }
    const riskResult=riskBeforeUpdate===riskAfterUpdate
      ? `Risk remains ${riskAfterUpdate}/100`
      : `Risk ${riskBeforeUpdate}/100 → ${riskAfterUpdate}/100`;
    if(selectedPhotos.length){
      try{
        await uploadEquipmentPhotos(savedEquipmentId,selectedPhotos);
        photosAttached=true;
      }catch(err){
        toast(`${metadataSaved?'Equipment was updated, but p':'P'}hotos could not be attached: ${err.message}`,'bad');
        if(!metadataSaved) return;
      }
    }
    if(metadataSaved) toast(`${data.name} updated · ${riskResult}`,'good');
    else if(photosAttached) toast(`${selectedPhotos.length} photo${selectedPhotos.length===1?'':'s'} attached to ${data.name}`,'good');
    else{
      toast('No equipment changes to save','info');
      return;
    }
  } else {
    const equipment = {...data};
    try {
      submitButton.disabled=true;
      const response = await apiRequest('equipment.php', {
        method:'POST',
        body:JSON.stringify(equipment),
      });
      if (!response.success || !response.data) throw new Error(response.message || 'Unable to add equipment');
      DB.equipment.unshift(response.data);
      equipment.id=response.data.id;
    } catch (err) {
      console.error('ICTRAX: remote equipment save failed.', err);
      showEquipmentFormError(errorBox,err,'Equipment was not saved to the database');
      return;
    } finally {
      submitButton.disabled=false;
    }
    const photos=$('#f-photos')?.files;
    if(photos?.length){
      try{ await uploadEquipmentPhotos(equipment.id,photos); }
      catch(err){ toast(`Equipment was saved, but photos could not be attached: ${err.message}`,'bad'); }
    }
    toast(`${data.name} added as ${equipment.id}`,'good');
  }
  saveDb();
  closeModal();
  navigate('equipment');
}
function showEquipmentFormError(errorBox,error,fallbackMessage){
  const isAuthError=error.status===401 || error.status===403;
  errorBox.classList.remove('hidden');
  errorBox.innerHTML=`${icon('alert')}<div><strong>${esc(error.message || fallbackMessage)}</strong>${isAuthError?'<div>Your administrator sign-in may have expired. Sign in again to continue.</div><button type="button" class="btn btn-outline btn-sm" onclick="restartEquipmentFormLogin()">Sign in again</button>':''}</div>`;
}
function restartEquipmentFormLogin(){
  void terminateSessionAndReturnToLogin({reason:'authorization-recovery'});
}
function confirmArchiveEquipment(id){
  const e = DB.equipment.find(x=>x.id===id);
  openModal(`
    <div class="modal-head"><div><h3>Archive equipment?</h3><div class="modal-sub">This will move the equipment record to the archive database.</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body"><div class="banner banner-amber">${icon('alert')}<div>You're about to remove <strong>${esc(e.name)}</strong> (${esc(e.id)}) from the inventory. Linked incident history is kept for records.</div></div></div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="archiveEquipment('${jsString(id)}')">${icon('archive')} Archive</button>
    </div>`);
}
async function deleteEquipment(id){
  try {
    const response = await apiRequest(`equipment.php?id=${encodeURIComponent(id)}`, {method:'DELETE'});
    if (!response.success) throw new Error(response.message || 'Unable to delete equipment');
    DB.equipment = DB.equipment.filter(x=>x.id!==id);
    DB.incidents = DB.incidents.filter(x=>x.equipmentId!==id);
  } catch (err) {
    console.error('ICTRAX: remote equipment delete failed.', err);
    toast('Equipment was not deleted from the database','bad');
    return;
  }
  saveDb();
  closeModal(); toast('Equipment removed','bad'); navigate('equipment');
}
function openEquipmentDetailsModal(id,{showServiceCardAction=false}={}){
  return openEquipmentInformationModal(id,{showServiceCardAction,source:'details'});
}
function openQrModal(id){
  const e = DB.equipment.find(x=>x.id===id);
  openModal(`
    <div class="modal-head"><div><h3>Equipment QR Tag</h3><div class="modal-sub">Scannable equipment identifier</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body">
      <div class="qr-tag-card view-only-qr-card">
        <div class="view-only-qr-visual">
          <div class="qr-pattern" id="real-qr-code" aria-label="QR code for ${esc(e.id)}"></div>
          <div class="qr-print-tag">Tag ID: ${esc(e.id)}</div>
        </div>
        <div class="qr-meta">
          <div class="qm-name">${esc(e.name)}</div>
          <div class="qm-id">${esc(e.id)}</div>
          <div class="kv-list">
            <div class="kv-row"><span class="k">Location</span><span class="v">${esc(e.location)}</span></div>
            <div class="kv-row"><span class="k">Serial No.</span><span class="v">${esc(e.serial)}</span></div>
            <div class="kv-row"><span class="k">Status</span><span class="v">${badge(e.status)}</span></div>
          </div>
        </div>
      </div>
      <div class="banner banner-blue" style="margin-top:14px">${icon('qrcode')}<div>Scan this QR code with the ICTRAX scanner to identify this equipment record.</div></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-outline" onclick="closeModal();openQrScannerModal()">${icon('camera')} Scan QR</button>
      <button class="btn btn-outline" onclick="downloadEquipmentQrJpg('${jsString(e.id)}')">${icon('download')} Download JPG</button>
      <button class="btn btn-dark" onclick="window.print()">${icon('printer')} Print Tag</button>
    </div>`);
  setTimeout(()=>renderRealQrCode(e.id),30);
}

function openDemoQrSheet(){
  const preferredCodes=['CD-2312','CD-2313','PR-1045','SW-0088','LP-5566'];
  const demoItems = preferredCodes
    .map(code=>DB.equipment.find(x=>x.id===code))
    .filter(Boolean);
  const items = demoItems.length ? demoItems : DB.equipment.slice(0, Math.min(DB.equipment.length, 6));
  if(!items.length){
    toast('No equipment records found for QR generation.','bad');
    return;
  }
  openModal(`
    <div class="modal-head"><div><h3>Demo Equipment QR Sheet</h3><div class="modal-sub">Ready-to-scan QR tags for the seeded ICTRAX items.</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body">
      <div class="banner banner-blue" style="margin-bottom:14px">${icon('qrcode')}<div>Use these QR tags for scanner testing, printed demonstrations, or quick access to sample equipment records inside ICTRAX.</div></div>
      <div class="qr-sheet-grid">
        ${items.map((e,idx)=>`
          <div class="qr-sheet-card">
            <div class="qr-sheet-code">${esc(e.id)}</div>
            <div class="qr-sheet-name">${esc(e.name)}</div>
            <div class="qr-sheet-meta">${esc(e.category)} · ${esc(e.location)}</div>
            <div class="qr-pattern qr-sheet-pattern" id="demo-qr-${idx}" aria-label="QR code for ${esc(e.id)}"></div><div class="qr-print-tag">Tag ID: ${esc(e.id)}</div>
            <div class="qr-sheet-status">${badge(e.status)}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-dark" onclick="window.print()">${icon('printer')} Print Sheet</button>
    </div>`);
  setTimeout(()=>items.forEach((e,idx)=>renderRealQrCode(e.id, `demo-qr-${idx}`, 132)),30);
}

/* ============================================================
   ADMIN — Incident Reports
   ============================================================ */
function incidentTableRowsMarkup(rows){
  return rows.map(i=>{
    const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
    return `<tr>
      <td>${tagChip(i.id)}</td>
      <td><div class="cell-strong">${eqp?esc(eqp.name):'—'}</div><div class="cell-sub">${eqp?esc(eqp.id):''}</div></td>
      <td>${esc(i.reportedByName)}<div class="cell-sub">${esc(i.reportedByDepartment||'')}</div></td>
      <td>${fmtDate(i.dateReported)}</td>
      <td>${esc(i.category)}</td>
      <td>${badge(i.priority)}</td>
      <td>${badge(i.status)}</td>
      <td><div class="row-actions">
        <button class="icon-btn" title="Edit incident report" aria-label="Edit incident report ${jsString(i.id)}" onclick="openIncidentModal('${jsString(i.id)}')">${icon('edit')}</button>
        ${eqp?`<button class="icon-btn" title="View equipment details" aria-label="View equipment details for ${jsString(eqp.id)}" onclick="openEquipmentDetailsModal('${jsString(eqp.id)}')">${icon('monitor')}</button>
        <button class="icon-btn" title="View equipment QR tag" aria-label="View equipment QR tag for ${jsString(eqp.id)}" onclick="openQrModal('${jsString(eqp.id)}')">${icon('qrcode')}</button>`:''}
        ${state.user?.role==='admin'?`<button class="icon-btn" title="Archive incident report" aria-label="Archive incident report ${jsString(i.id)}" onclick="deleteIncident('${jsString(i.id)}')">${icon('trash')}</button>`:''}
      </div></td>
    </tr>`;
  }).join('');
}
function renderIncidentResults(){
  const rows=filteredIncidentRows();
  const body=$('#incidents-table-body');
  const empty=$('#incidents-empty-state');
  if(body) body.innerHTML=incidentTableRowsMarkup(rows);
  if(empty){
    empty.classList.toggle('hidden',rows.length>0);
    empty.innerHTML=rows.length ? '' : emptyState('inbox','No incident reports','Nothing matches these filters yet.');
  }
}
function renderIncidentsView(){
  const f = state.filters;
  const rows = filteredIncidentRows();

  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input type="text" placeholder="Search by reporter, equipment, or ID…" value="${esc(f.incSearch)}" oninput="onIncSearch(this.value)"></div>
      </div>
      <button class="btn btn-outline" type="button" onclick="exportIncidentXLSX()">${icon('download')} Export Excel</button>
    </div>
    <div class="card"><div class="card-body flush">
      <div class="table-wrap"><table class="dtable">
        <thead><tr>${columnFilterHeader('incidents','id','Report')}${columnFilterHeader('incidents','equipment','Equipment')}${columnFilterHeader('incidents','reportedByName','Reported By')}${columnFilterHeader('incidents','dateReported','Date')}${columnFilterHeader('incidents','category','Category')}${columnFilterHeader('incidents','priority','Priority')}${columnFilterHeader('incidents','status','Incident Status')}<th></th></tr></thead>
        <tbody id="incidents-table-body">${incidentTableRowsMarkup(rows)}</tbody>
      </table></div>
      <div id="incidents-empty-state" class="${rows.length?'hidden':''}">${rows.length?'':emptyState('inbox','No incident reports','Nothing matches these filters yet.')}</div>
    </div></div>
  </div>`;
}
function onIncSearch(v){ state.filters.incSearch=v; renderIncidentResults(); }

function completedIncidentTableRowsMarkup(rows,isAdmin=state.user?.role==='admin'){
  return rows.map(i=>{
    const eqp=DB.equipment.find(e=>e.id===i.equipmentId);
    return `<tr>
      <td>${tagChip(i.id)}</td>
      <td><div class="cell-strong">${eqp?esc(eqp.name):'&mdash;'}</div><div class="cell-sub">${eqp?esc(eqp.id):''}</div></td>
      ${isAdmin?`<td>${esc(i.reportedByName)}<div class="cell-sub">${esc(i.reportedByDepartment||'')}</div></td>`:''}
      <td>${fmtDate(i.dateReported)}</td>
      <td>${fmtDate(i.resolvedDate)}</td>
      <td>${esc(i.category)}</td>
      <td>${badge(i.priority)}</td>
      <td>${badge(i.status)}</td>
      <td>${badge(i.verificationStatus||'Not Required')}</td>
      <td><div class="row-actions">
        <button class="icon-btn" title="Edit incident report" aria-label="Edit incident report ${jsString(i.id)}" onclick="openIncidentModal('${jsString(i.id)}')">${icon('edit')}</button>
        ${eqp?`<button class="icon-btn" title="View equipment details" aria-label="View equipment details for ${jsString(eqp.id)}" onclick="openEquipmentDetailsModal('${jsString(eqp.id)}')">${icon('monitor')}</button>
        <button class="icon-btn" title="View equipment QR tag" aria-label="View equipment QR tag for ${jsString(eqp.id)}" onclick="openQrModal('${jsString(eqp.id)}')">${icon('qrcode')}</button>`:''}
        ${isAdmin?`<button class="icon-btn" title="Archive incident report" aria-label="Archive incident report ${jsString(i.id)}" onclick="deleteIncident('${jsString(i.id)}')">${icon('trash')}</button>`:''}
      </div></td>
    </tr>`;
  }).join('');
}
function renderCompletedIncidentResults(){
  const rows=sortTableRows(filteredIncidentRows('completed'),'completed');
  const body=$('#completed-incidents-table-body');
  const empty=$('#completed-incidents-empty-state');
  if(body) body.innerHTML=completedIncidentTableRowsMarkup(rows);
  if(empty){
    empty.classList.toggle('hidden',rows.length>0);
    empty.innerHTML=rows.length ? '' : emptyState('check','No completed incident reports','Resolved reports matching these filters will appear here with their verification status.');
  }
}
function renderCompletedIncidentsView(){
  const f=state.filters;
  const isAdmin=state.user.role==='admin';
  const rows=sortTableRows(filteredIncidentRows('completed'),'completed');
  const reporterHeader=isAdmin ? columnFilterHeader('completed','reportedByName','Reported By') : '';

  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input id="completed-search" type="text" placeholder="Search by reporter, equipment, or ID..." value="${esc(f.completedSearch)}" oninput="onCompletedSearch(this.value)"></div>
      </div>
      <button class="btn btn-outline" type="button" onclick="exportIncidentXLSX('completed')">${icon('download')} Export Excel</button>
    </div>
    <div class="card">
      <div class="card-head"><div><h3>Completed Incident Reports</h3><div class="sub">Incident resolution and verification status are tracked separately.</div></div></div>
      <div class="card-body flush">
        <div class="table-wrap"><table class="dtable">
          <thead><tr>${columnFilterHeader('completed','id','Report')}${columnFilterHeader('completed','equipment','Equipment')}${reporterHeader}${columnFilterHeader('completed','dateReported','Reported')}${columnFilterHeader('completed','resolvedDate','Resolved')}${columnFilterHeader('completed','category','Category')}${columnFilterHeader('completed','priority','Priority')}${columnFilterHeader('completed','status','Incident Status')}${columnFilterHeader('completed','verificationStatus','Verification Status')}<th></th></tr></thead>
          <tbody id="completed-incidents-table-body">${completedIncidentTableRowsMarkup(rows,isAdmin)}</tbody>
        </table></div>
        <div id="completed-incidents-empty-state" class="${rows.length?'hidden':''}">${rows.length?'':emptyState('check','No completed incident reports','Resolved reports matching these filters will appear here with their verification status.')}</div>
      </div>
    </div>
  </div>`;
}
function onCompletedSearch(value){
  state.filters.completedSearch=value;
  renderCompletedIncidentResults();
}

let repairVerificationInFlight=false;
let incidentUpdateInFlight=false;
function openIncidentModal(id){
  const i = DB.incidents.find(x=>x.id===id);
  if(!i){
    toast('This incident report is no longer available.','bad');
    return;
  }
  const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
  const isAdmin = state.user.role==='admin';
  const verificationStatus=i.verificationStatus||'Not Required';
  const canVerify=!isAdmin && i.status==='Resolved' && verificationStatus==='Awaiting Verification';
  openModal(`
    <div class="modal-head">
      <div><h3>${esc(i.id)}</h3><div class="modal-sub">Filed ${fmtDate(i.dateReported)} by ${esc(i.reportedByName)}</div></div>
      <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
    </div>
    <div class="modal-body">
      <div class="kv-list" style="margin-bottom:16px">
        <div class="kv-row"><span class="k">Equipment</span><span class="v">${eqp?esc(eqp.name)+' · '+eqp.id:'—'}</span></div>
        <div class="kv-row"><span class="k">Location</span><span class="v">${eqp?esc(eqp.location):'—'}</span></div>
        <div class="kv-row"><span class="k">Category</span><span class="v">${esc(i.category)}</span></div>
        <div class="kv-row"><span class="k">Incident Status</span><span class="v">${badge(i.status)}</span></div>
        <div class="kv-row"><span class="k">Priority</span><span class="v">${badge(i.priority)}</span></div>
        ${i.resolvedDate?`<div class="kv-row"><span class="k">Resolved</span><span class="v">${fmtDate(i.resolvedDate)}</span></div>`:''}
        <div class="kv-row"><span class="k">Verification Status</span><span class="v">${badge(verificationStatus)}</span></div>
        ${i.verifiedAt?`<div class="kv-row"><span class="k">Verification Date</span><span class="v">${fmtDateTime(i.verifiedAt)}</span></div>`:''}
      </div>
      <div class="field"><label>Description</label>
        <div style="background:var(--surface-sunk);border-radius:8px;padding:12px 14px;font-size:13.5px;color:var(--text-700)">${esc(i.description)}</div>
      </div>
      ${isAdmin?`
      <div class="divider-label">Admin Action</div>
      <div class="field-row">
        <div class="field"><label>Update Incident Status</label><select id="ui-status">
          ${['Pending','In Progress','Resolved','Rejected'].map(s=>`<option ${i.status===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
        <div class="field"><label>Priority</label><select id="ui-priority">
          ${['Low','Medium','High','Critical'].map(s=>`<option ${i.priority===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
      </div>
      <div class="field"><label>Remarks / Resolution Notes</label><textarea id="ui-remarks" rows="3" placeholder="e.g. Replaced faulty power cable…">${esc(i.remarks||'')}</textarea></div>`
      :`${i.remarks?`<div class="field"><label>Technician Remarks</label><div style="background:var(--teal-tint);border-radius:8px;padding:12px 14px;font-size:13.5px;color:var(--teal-dark)">${esc(i.remarks)}</div></div>`:''}`}
      ${canVerify?`
      <div class="divider-label">Verify the Actual Repair</div>
      <div class="banner banner-amber" style="margin-bottom:14px">${icon('check')}<div>Please inspect the equipment or completed service before confirming. If the repair was not accomplished, provide the reason and the report will be reopened.</div></div>
      <div class="field"><label for="repair-verification-notes">Verification Notes <span class="optional-label">Required when not accomplished</span></label><textarea id="repair-verification-notes" rows="3" maxlength="2000" placeholder="Optional confirmation, or explain what remains unresolved…"></textarea></div>`:''}
      ${!canVerify&&i.verificationNotes?`<div class="field"><label>Verification Notes</label><div style="background:var(--surface-sunk);border-radius:8px;padding:12px 14px;font-size:13.5px;color:var(--text-700)">${esc(i.verificationNotes)}</div></div>`:''}
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      ${i.repairForm?`<button class="btn btn-dark" type="button" onclick="openSubmittedRepairForm('${jsString(i.id)}')">${icon('file')} View / Print Repair Form</button>`:''}
      ${isAdmin?`<button class="btn btn-primary" type="button" id="incident-save-button" onclick="saveIncidentUpdate('${jsString(i.id)}')">${icon('check')} Save Update</button>`:''}
      ${canVerify?`<button class="btn btn-danger" type="button" id="repair-dispute-button" onclick="submitRepairVerification('${jsString(i.id)}',false)">Not Accomplished</button><button class="btn btn-primary" type="button" id="repair-verify-button" onclick="submitRepairVerification('${jsString(i.id)}',true)">${icon('check')} Verify Repair</button>`:''}
    </div>`);
}
function openSubmittedRepairForm(id){
  const incident=DB.incidents.find(item=>item.id===id);
  if(!incident?.repairForm){
    toast('This incident does not include a 20260825 AMT form','bad');
    return;
  }
  openModal(`
    <div class="modal-head">
      <div><h3>20260825 AMT</h3><div class="modal-sub">${esc(incident.id)} · Submitted Request for Repair</div></div>
      <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
    </div>
    <div class="modal-body submitted-repair-form-body">
      <div class="repair-form-scroll">
        ${renderRepairFormSheet(incident.repairForm,{readOnly:true,sheetId:'submitted-repair-form-sheet'})}
      </div>
    </div>
    <div class="modal-foot submitted-repair-form-actions">
      <button class="btn btn-outline" type="button" onclick="openIncidentModal('${jsString(incident.id)}')">${icon('chevron')} Back to Request</button>
      <button class="btn btn-dark" type="button" onclick="printRepairForm('submitted-repair-form-sheet')">${icon('printer')} Print Form</button>
    </div>`,{wide:true});
}
async function submitRepairVerification(id,accomplished){
  const incident=DB.incidents.find(item=>item.id===id);
  if(!incident || repairVerificationInFlight) return;
  const notes=$('#repair-verification-notes')?.value.trim()||'';
  if(!accomplished && !notes){
    toast('Please explain what remains unresolved before reopening the report','bad');
    $('#repair-verification-notes')?.focus();
    return;
  }
  const confirmation=accomplished
    ? 'Confirm that the actual repair or requested service was accomplished?'
    : 'Confirm that the repair was not accomplished and reopen this report?';
  if(!window.confirm(confirmation)) return;

  repairVerificationInFlight=true;
  const buttons=['#repair-verify-button','#repair-dispute-button'].map(selector=>$(selector)).filter(Boolean);
  buttons.forEach(button=>{ button.disabled=true; button.setAttribute('aria-busy','true'); });
  try{
    const response=await apiRequest('incidents.php',{
      method:'PATCH',
      body:JSON.stringify({
        id,
        action:'verify-resolution',
        accomplished,
        notes,
        version:incident.version,
      }),
    });
    if(!response.success||!response.data) throw new Error(response.message||'Unable to verify the repair');
    Object.assign(incident,response.data);
    if(response.data.equipmentStatus){
      const equipment=DB.equipment.find(item=>item.id===incident.equipmentId);
      if(equipment) equipment.status=response.data.equipmentStatus;
    }
    saveDb();
    closeModal();
    toast(accomplished
      ? `${id} verified as accomplished`
      : `${id} reopened because the repair was not accomplished`,'good');
    navigate(accomplished?'completed':'myreports');
  }catch(error){
    console.error('ICTRAX: repair verification failed.',error);
    if(error.status===409&&error.data){
      Object.assign(incident,error.data);
      toast(error.message,'bad');
      openIncidentModal(id);
    }else{
      toast(error.message||'Repair verification failed. No changes were saved.','bad');
    }
  }finally{
    repairVerificationInFlight=false;
    buttons.forEach(button=>{
      if(!button.isConnected) return;
      button.disabled=false;
      button.removeAttribute('aria-busy');
    });
  }
}

async function saveIncidentUpdate(id){
  const i = DB.incidents.find(x=>x.id===id);
  if(!i || incidentUpdateInFlight) return;
  const previousStatus=i.status;
  const update = {
    id,
    status:$('#ui-status').value,
    priority:$('#ui-priority').value,
    remarks:$('#ui-remarks').value.trim(),
    resolvedDate:(($('#ui-status').value==='Resolved'||$('#ui-status').value==='Rejected') ? (i.resolvedDate||todayISO()) : null),
    version:i.version,
  };
  if(update.status===i.status && update.priority===i.priority && update.remarks===(i.remarks||'') && update.resolvedDate===(i.resolvedDate||null)){
    toast('No incident changes to save','info');
    return;
  }
  incidentUpdateInFlight=true;
  const saveButton=$('#incident-save-button');
  if(saveButton){
    saveButton.disabled=true;
    saveButton.setAttribute('aria-busy','true');
    saveButton.innerHTML=`${icon('clock')} Saving...`;
  }
  try {
    const response = await apiRequest('incidents.php', {
      method:'PUT',
      body:JSON.stringify(update),
    });
    if (!response.success || !response.data) throw new Error(response.message || 'Unable to update incident');
    Object.assign(i,response.data);
    if(response.data.equipmentStatus){
      const equipment = DB.equipment.find(e=>e.id===i.equipmentId);
      if(equipment) equipment.status = response.data.equipmentStatus;
    }
  } catch (err) {
    console.error('ICTRAX: remote incident update failed.', err);
    if(err.status===409 && err.data){
      Object.assign(i,err.data);
      toast(err.message,'bad');
      openIncidentModal(id);
    }else{
      toast(err.message||'Incident update failed. No changes were saved.','bad');
    }
    return;
  } finally {
    incidentUpdateInFlight=false;
    if(saveButton?.isConnected){
      saveButton.disabled=false;
      saveButton.removeAttribute('aria-busy');
      saveButton.innerHTML=`${icon('check')} Save Update`;
    }
  }
  saveDb();
  closeModal();
  if(previousStatus!==i.status){
    toast(incidentStatusToastMessage(id,i.status),'good');
  }else{
    toast(`Incident ${id} updated successfully`,'good');
  }
  navigate(state.view);
}
async function deleteIncident(id){
  if(!await confirmAction(`Delete ${id}? This will remove the incident report from the active and completed lists. This action cannot be undone.`,{title:'Delete incident?',confirmLabel:'Delete'})) return;
  try {
    const response = await apiRequest(`incidents.php?id=${encodeURIComponent(id)}`, {method:'DELETE'});
    if (!response.success) throw new Error(response.message || 'Unable to delete incident');
    DB.incidents = DB.incidents.filter(x=>x.id!==id);
  } catch (err) {
    console.error('ICTRAX: remote incident delete failed.', err);
    toast('Incident was not deleted from the database','bad');
    return;
  }
  saveDb();
  closeModal();
  toast(`${id} deleted`,'bad');
  navigate(state.view);
}

/* ============================================================
   ADMIN — Risk Analytics
   ============================================================ */
async function openRiskDetails(id){
  const equipment = DB.equipment.find(e=>e.id===id);
  if(!equipment) return;
  openModal(`<div class="modal-head"><div><h3>${esc(equipment.name)}</h3><div class="modal-sub">${esc(equipment.id)} · Risk history</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div><div class="modal-body"><div class="page-loading">Loading score details...</div></div>`);
  try {
    const response = await apiRequest('audit.php?limit=250');
    const audit = response.data || [];
    const breakdown = riskBreakdown(equipment);
    const incidents = getIncidentsFor(equipment.id).sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported));
    const incidentIds = new Set(incidents.map(i=>i.id));
    const incidentHistory = audit.filter(row=>row.entity_type==='incident' && incidentIds.has(row.entity_id));
    const action=riskRecommendedAction(equipment,breakdown);
    const factorRows = [['Equipment status',breakdown.status,RISK_MODEL.weights.status],['Incident history',breakdown.incidents,RISK_MODEL.weights.incidents],['Recent incident trend',breakdown.trend,RISK_MODEL.weights.trend],['Equipment age',breakdown.age,RISK_MODEL.weights.age],['Maintenance staleness',breakdown.maintenance,RISK_MODEL.weights.maintenance],['Condition',breakdown.condition,RISK_MODEL.weights.condition]];
    if(breakdown.riskFloor) factorRows.push([`Risk floor: ${breakdown.floorReasons.join('; ')}`,breakdown.riskFloor,'']);
    const panel = $('#modal-panel');
    panel.querySelector('.modal-body').innerHTML = `<div class="risk-detail-score"><div class="stat-value">${breakdown.total}/100</div>${riskBar(breakdown.total)}</div><div class="risk-action"><strong>${esc(action.label)}</strong><span>${esc(action.detail)}</span></div><div class="divider-label">Why this score</div><ul style="margin:0 0 14px;padding-left:20px;color:var(--text-700)">${riskReasons(equipment,breakdown).map(reason=>`<li style="margin:4px 0">${esc(reason)}</li>`).join('')}</ul><div class="divider-label">Score contribution</div><div class="kv-list">${factorRows.map(([label,value,max])=>`<div class="kv-row"><span class="k">${esc(label)}</span><span class="v">${value}${max?`/${max}`:''}</span></div>`).join('')}</div><div class="cell-sub" style="margin-top:10px">Risk model v${RISK_MODEL.version}. Factor weights total 100 points. This score prioritizes review; it is not a probability of failure.</div><div class="divider-label">Incident history</div>${incidents.length?`<div style="display:grid;gap:8px">${incidents.map(i=>`<div style="padding:10px;border-radius:7px;background:var(--surface-sunk)"><div style="display:flex;justify-content:space-between;gap:8px"><strong>${esc(i.id)} · ${esc(i.category)}</strong>${badge(i.status)}</div><div class="cell-sub">${fmtDate(i.dateReported)} · ${esc(i.priority)} priority</div><div style="margin-top:5px;font-size:13px">${esc(i.description)}</div>${i.remarks?`<div class="cell-sub" style="margin-top:5px">Note: ${esc(i.remarks)}</div>`:''}</div>`).join('')}</div>`:emptyState('inbox','No incident history','No incident reports are linked to this unit.') }${incidentHistory.length?`<div class="divider-label">Incident change history</div><div style="display:grid;gap:8px">${incidentHistory.map(row=>`<div style="padding:10px;border-radius:7px;background:var(--surface-sunk)"><strong>${esc(row.entity_id)}</strong> · ${esc(row.username||'System')}<div class="cell-sub">${esc(row.created_at)} · ${esc(row.action)}</div></div>`).join('')}</div>`:''}`;
  } catch(err) {
    $('#modal-panel .modal-body').innerHTML = emptyState('alert','Unable to load details',err.message);
  }
}
function renderRiskView(){
  const risks = DB.equipment.map(e=>{
    const breakdown=riskBreakdown(e);
    return {e,breakdown,score:breakdown.total,action:riskRecommendedAction(e,breakdown)};
  }).sort((a,b)=>b.score-a.score||a.e.name.localeCompare(b.e.name));
  const bands = {Critical:0,High:0,Medium:0,Low:0};
  risks.forEach(r=>bands[riskBand(r.score).label]++);
  const priorityUnits=risks.filter(r=>r.score>=RISK_MODEL.thresholds.high).length;
  const overdueUnits=risks.filter(r=>r.e.status!=='Condemned'&&r.breakdown.daysSinceMaintenance>180).length;
  const openIncidents=DB.incidents.filter(i=>i.status==='Pending'||i.status==='In Progress').length;
  const averageRisk=risks.length?Math.round(risks.reduce((sum,r)=>sum+r.score,0)/risks.length):0;
  const locations=[...new Set(risks.map(r=>r.e.location))].map(location=>{
    const records=risks.filter(r=>r.e.location===location);
    return {
      location,
      units:records.length,
      average:records.length?Math.round(records.reduce((sum,r)=>sum+r.score,0)/records.length):0,
      priority:records.filter(r=>r.score>=RISK_MODEL.thresholds.high).length,
    };
  }).sort((a,b)=>b.average-a.average||a.location.localeCompare(b.location));
  const driverSummary=[
    ['Open incident evidence',risks.filter(r=>r.breakdown.openIncidentCount>0).length],
    ['Maintenance over 180 days',risks.filter(r=>r.breakdown.daysSinceMaintenance>180).length],
    ['Fair or poor condition',risks.filter(r=>r.e.condition==='Fair'||r.e.condition==='Poor').length],
    ['Repeated incident pattern',risks.filter(r=>r.breakdown.recurringCategories.length>0).length],
  ];
  const barData=[
    {label:'Low',value:bands.Low,hex:'#2e7d32'},{label:'Medium',value:bands.Medium,hex:'#f9a825'},
    {label:'High',value:bands.High,hex:'#ef6c00'},{label:'Critical',value:bands.Critical,hex:'#c62828'},
  ];
  return `<div class="view">
    <div class="banner banner-amber">${icon('activity')}<div><strong>Risk model v${RISK_MODEL.version}.</strong> The 0–100 maintenance-priority index uses status (20 pts), incident history (25), recent 90-day trend (15), age (10), maintenance staleness (20), and condition (10). Rejected incidents are excluded. The score supports prioritization and is not a probability of failure.</div></div>

    <div class="stat-grid">
      ${statCard('box','Equipment Evaluated',risks.length,'All active inventory records','blue')}
      ${statCard('alert','High or Critical',priorityUnits,`${bands.Critical} critical · ${bands.High} high`,priorityUnits?'red':'teal')}
      ${statCard('calendar','Maintenance Overdue',overdueUnits,'More than 180 days; condemned excluded',overdueUnits?'amber':'teal')}
      ${statCard('inbox','Open Incidents',openIncidents,`Fleet average risk ${averageRisk}/100`,openIncidents?'amber':'teal')}
    </div>

    <div class="grid-2">
      <div class="card"><div class="card-head"><div><h3>Risk Distribution</h3><div class="sub">${risks.length} current inventory records evaluated</div></div></div>
        <div class="card-body">${barSVG(barData)}</div></div>
      <div class="card"><div class="card-head"><div><h3>Maintenance Guidance</h3><div class="sub">Suggested response by band</div></div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
          ${guidanceRow('red','Critical','Inspect within 48 hours; follow the specific missing or condemned asset action.')}
          ${guidanceRow('orange','High',"Prioritize in this week's maintenance round and review open incidents.")}
          ${guidanceRow('yellow','Medium','Monitor; include in the next routine inspection.')}
          ${guidanceRow('green','Low','Continue the normal preventive-maintenance schedule.')}
        </div></div>
    </div>

    <div class="grid-2" style="margin-top:18px">
      <div class="card"><div class="card-head"><div><h3>Fleet Risk Indicators</h3><div class="sub">Recorded patterns contributing to prioritization</div></div></div>
        <div class="card-body"><div class="kv-list">${driverSummary.map(([label,value])=>`<div class="kv-row"><span class="k">${esc(label)}</span><span class="v">${value} unit${value===1?'':'s'}</span></div>`).join('')}</div></div></div>
      <div class="card"><div class="card-head"><div><h3>Risk by Location</h3><div class="sub">Average score and priority units</div></div></div>
        <div class="card-body"><div class="risk-location-list">${locations.map(row=>`<div class="risk-location-row"><div><strong>${esc(row.location)}</strong><span>${row.units} unit${row.units===1?'':'s'} · ${row.priority} high/critical</span></div><div>${riskBar(row.average)}</div></div>`).join('')||'<div class="cell-sub">No location data available.</div>'}</div></div></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-head"><div><h3>Maintenance Priority Ranking</h3><div class="sub">Highest score first · Select the eye icon for evidence and score history</div></div><button class="btn btn-outline btn-sm" onclick="exportRiskCSV()">${icon('download')} Export priority report</button></div>
      <div class="card-body flush"><div class="table-wrap"><table class="dtable">
        <thead><tr><th>Tag ID</th><th>Equipment</th><th>Status / Condition</th><th>Age</th><th>Evidence</th><th>Last Maintenance</th><th>Risk Score</th><th>Recommended Action</th><th></th></tr></thead>
        <tbody>
        ${risks.map(r=>{
          const ageYears=r.breakdown.ageYears.toFixed(1);
          return `<tr>
            <td>${tagChip(r.e.id)}</td>
            <td><div class="cell-strong">${esc(r.e.name)}</div><div class="cell-sub">${esc(r.e.location)}</div></td>
            <td>${badge(r.e.status)}<div class="cell-sub" style="margin-top:5px">${esc(r.e.condition)} condition</div></td>
            <td>${ageYears} yrs</td>
            <td><div class="cell-strong">${r.breakdown.openIncidentCount} open incident${r.breakdown.openIncidentCount===1?'':'s'}</div><div class="cell-sub">${esc(riskTopDrivers(r.e,r.breakdown))}</div></td>
            <td><div>${fmtDate(r.e.lastMaintenance)}</div><div class="cell-sub">${r.breakdown.daysSinceMaintenance} days ago</div></td>
            <td>${riskBar(r.score)}</td>
            <td><div class="cell-strong">${esc(r.action.label)}</div><div class="cell-sub risk-action-detail">${esc(r.action.detail)}</div></td>
            <td><button class="icon-btn" title="View score details and history" onclick="openRiskDetails('${jsString(r.e.id)}')">${icon('eye')}</button></td>
          </tr>`;
        }).join('')||'<tr><td colspan="9"><div class="empty-state"><h3>No equipment to evaluate</h3><p>Add equipment records to generate the maintenance-priority ranking.</p></div></td></tr>'}
        </tbody>
      </table></div></div>
    </div>
  </div>`;
}

function exportRiskCSV(){
  const rows=DB.equipment.map(e=>{
    const breakdown=riskBreakdown(e);
    return {equipment:e,breakdown,action:riskRecommendedAction(e,breakdown)};
  }).sort((a,b)=>b.breakdown.total-a.breakdown.total||a.equipment.name.localeCompare(b.equipment.name));
  exportCSV(rows,[
    {label:'Rank',get:r=>rows.indexOf(r)+1},
    {label:'Tag ID',get:r=>r.equipment.id},{label:'Equipment',get:r=>r.equipment.name},{label:'Category',get:r=>r.equipment.category},
    {label:'Location',get:r=>r.equipment.location},{label:'Status',get:r=>r.equipment.status},{label:'Condition',get:r=>r.equipment.condition},
    {label:'Risk Score',get:r=>r.breakdown.total},{label:'Risk Band',get:r=>riskBand(r.breakdown.total).label},
    {label:'Open Incidents',get:r=>r.breakdown.openIncidentCount},{label:'Recent Incidents 0-90 Days',get:r=>r.breakdown.recentIncidentCount},
    {label:'Previous Incidents 91-180 Days',get:r=>r.breakdown.previousIncidentCount},{label:'Days Since Maintenance',get:r=>r.breakdown.daysSinceMaintenance},
    {label:'Top Risk Drivers',get:r=>riskTopDrivers(r.equipment,r.breakdown)},{label:'Recommended Action',get:r=>r.action.label},
    {label:'Action Detail',get:r=>r.action.detail},{label:'Risk Model Version',get:()=>RISK_MODEL.version},{label:'As Of',get:()=>todayISO()},
  ],'ICTRAX_Maintenance_Priority_Report.csv');
}
/* ============================================================
   FACULTY — Dashboard
   ============================================================ */
function renderFacultyDashboard(){
  const u = state.user;
  const myReports = DB.incidents.filter(i=>String(i.reportedByUserId)===String(u.id));
  const openCount = myReports.filter(i=>i.status==='Pending'||i.status==='In Progress').length;
  const resolved = myReports.filter(i=>i.status==='Resolved').length;
  const available = DB.equipment.filter(e=>e.status==='Operational').length;

  return `<div class="view">
    <div class="banner banner-amber">${icon('shield')}<div>Welcome back, ${esc(u.name.split(' ')[0])}. Students may report equipment concerns to faculty; record the incident here so the ICT Office can track and resolve it.</div></div>

    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      ${statCard('monitor','Operational Units',available,`out of ${DB.equipment.length} tagged in the lab`,'teal')}
      ${statCard('inbox','My Open Incidents',openCount,'awaiting resolution','amber')}
      ${statCard('check','My Resolved Incidents',resolved,'closed out','teal')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><div><h3>Quick Actions</h3></div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-primary btn-block" onclick="navigate('report')">${icon('flag')} Request for Repair</button>
          <button class="btn btn-outline btn-block" onclick="navigate('browse')">${icon('box')} Browse Lab Equipment</button>
          <button class="btn btn-outline btn-block" onclick="navigate('myreports')">${icon('list')} Track My Submitted Incidents</button>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>My Recent Submitted Incidents</h3></div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('myreports')">View all ${icon('chevron')}</button>
        </div>
        <div class="card-body flush">
          ${myReports.length===0?emptyState('inbox','No incidents yet','Record any equipment concern reported to you by a student or observed in the laboratory.'):
          `<div class="table-wrap"><table class="dtable"><tbody>
          ${[...myReports].sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported)).slice(0,4).map(i=>{
            const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
            return `<tr style="cursor:pointer" onclick="openIncidentModal('${jsString(i.id)}')">
              <td><div class="cell-strong">${eqp?esc(eqp.name):'—'}</div><div class="cell-sub">${fmtDate(i.dateReported)}</div></td>
              <td>${badge(i.status)}</td>
            </tr>`;
          }).join('')}
          </tbody></table></div>`}
        </div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   FACULTY — Browse Equipment
   ============================================================ */
function filteredBrowseEquipmentRows(){
  const f = state.filters;
  let rows = DB.equipment.filter(e=>{
    if(e.status==='Condemned') return false;
    if(f.equipCategory!=='all' && e.category!==f.equipCategory) return false;
    if(f.equipStatus!=='all' && e.status!==f.equipStatus) return false;
    if(f.equipSearch){
      const q=f.equipSearch.toLowerCase();
      if(!(e.name.toLowerCase().includes(q)||e.location.toLowerCase().includes(q))) return false;
    }
    return true;
  });
  return sortTableRows(rows,'browse');
}
function browseEquipmentCardsMarkup(rows){
  return rows.map(e=>`
    <article class="equip-card equip-card-interactive" role="button" tabindex="0" aria-label="View equipment information for ${esc(e.name)}, ${esc(e.id)}" onclick="openEquipmentInformationModal('${jsString(e.id)}',{source:'browse'})" onkeydown="activateEquipmentCard(event,'${jsString(e.id)}')">
      <div class="ec-top"><div class="ec-icon">${icon(CATEGORY_ICON[e.category]||'box')}</div>${badge(e.status)}</div>
      <div><div class="ec-name">${esc(e.name)}</div><div class="ec-loc">${icon('mappin')}${esc(e.location)}</div></div>
      <div class="ec-foot"><span class="tag-chip">${esc(e.id)}</span>
        <span class="ec-action" aria-hidden="true">${icon('eye')} View details</span>
      </div>
    </article>`).join('');
}
function renderBrowseResults(){
  const rows=filteredBrowseEquipmentRows();
  const grid=$('#browse-equipment-grid');
  const empty=$('#browse-equipment-empty-state');
  if(grid) grid.innerHTML=browseEquipmentCardsMarkup(rows);
  if(empty){
    empty.classList.toggle('hidden',rows.length>0);
    empty.innerHTML=rows.length ? '' : emptyState('inbox','No equipment found','Try a different search or filter.');
  }
}
function renderBrowseView(){
  const f = state.filters;
  const rows=filteredBrowseEquipmentRows();
  const categories=[...new Set(DB.equipment.map(e=>e.category))];
  const browseSort=state.sorts.browse;
  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input type="text" placeholder="Search equipment or lab…" value="${esc(f.equipSearch)}" oninput="onBrowseSearch(this.value)"></div>
        <select class="select-filter" onchange="onBrowseFilter('equipCategory',this.value)">
          <option value="all">All categories</option>
          ${categories.map(c=>`<option value="${esc(c)}" ${f.equipCategory===c?'selected':''}>${esc(c)}</option>`).join('')}
        </select>
        <select class="select-filter" onchange="onBrowseFilter('equipStatus',this.value)">
          <option value="all">All statuses</option>
          ${['Operational','Under Repair','Damaged','Missing'].map(s=>`<option ${f.equipStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select class="select-filter" aria-label="Sort equipment by" onchange="onBrowseSort(this.value)">
          ${[['createdAt','Date Added'],['id','Tag ID'],['name','Equipment'],['location','Location'],['status','Status'],['dateAcquired','Date Acquired'],['lastMaintenance','Last Maintenance']].map(([key,label])=>`<option value="${key}" ${browseSort.key===key?'selected':''}>Sort: ${label}</option>`).join('')}
        </select>
        <button class="btn btn-outline" id="browse-sort-direction" type="button" onclick="toggleBrowseSortDirection()" aria-label="Toggle equipment sort direction">${browseSort.direction==='asc'?'▲ Ascending':'▼ Descending'}</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline" onclick="openDemoQrSheet()">${icon('qrcode')} Demo QR Sheet</button><button class="btn btn-primary" onclick="openQrScannerModal()">${icon('camera')} Scan Equipment QR</button></div>
    </div>
    <div class="equip-grid" id="browse-equipment-grid">${browseEquipmentCardsMarkup(rows)}</div>
    <div id="browse-equipment-empty-state" class="${rows.length?'hidden':''}">${rows.length?'':emptyState('inbox','No equipment found','Try a different search or filter.')}</div>
  </div>`;
}
function onBrowseSearch(v){ state.filters.equipSearch=v; renderBrowseResults(); }
function onBrowseFilter(k,v){ state.filters[k]=v; renderBrowseResults(); }
function syncBrowseSortDirectionControl(){
  const button=$('#browse-sort-direction');
  if(button) button.textContent=state.sorts.browse.direction==='asc'?'▲ Ascending':'▼ Descending';
}
function onBrowseSort(key){
  state.sorts.browse={key,direction:key==='createdAt'?'desc':'asc'};
  syncBrowseSortDirectionControl();
  renderBrowseResults();
}
function toggleBrowseSortDirection(){
  const current=state.sorts.browse;
  state.sorts.browse={...current,direction:current.direction==='asc'?'desc':'asc'};
  syncBrowseSortDirectionControl();
  renderBrowseResults();
}
function activateEquipmentCard(event,id){
  if(event.key!=='Enter' && event.key!==' ') return;
  event.preventDefault();
  void openEquipmentInformationModal(id,{source:'browse'});
}
function openEquipDetailModal(id){
  return openEquipmentInformationModal(id,{showServiceCardAction:false,source:'browse'});
}

/* ============================================================
   FACULTY — Request for Repair (20260825 AMT)
   ============================================================ */
const REPAIR_FORM_BOOLEAN_FIELDS = [
  'hardwareRepair','softwareEnhancement','maintenanceRepair',
  'computer','cpu','monitor','keyboard','mouse','printer',
  'repaired','replaced','pulledOut','returned','reformatted','forCondemnation',
  'addition','replacement','deletion','reinstallation',
];
const REPAIR_FORM_TEXT_FIELDS = [
  'requisitioner','requestDate','department','technicianResponseTime',
  'brandName','serialNumber','otherEquipment','specificProblem','hardwareRemarks',
  'softwareName','applications','softwareRemarks','approvedBy','approvalDate',
  'actionTakenBy','actionDate','attestedBy','attestedDate','completionTime',
];

function repairDisplayDate(iso=todayISO()){
  const match=String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : '';
}

function repairDateToIso(value){
  const text=String(value||'').trim();
  let year,month,day;
  let match=text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(match){
    month=Number(match[1]); day=Number(match[2]); year=Number(match[3]);
  }else{
    match=text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!match) return '';
    year=Number(match[1]); month=Number(match[2]); day=Number(match[3]);
  }
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year || date.getUTCMonth()!==month-1 || date.getUTCDate()!==day) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function repairTextControl(name,label,x,y,w,h,value='',options={}){
  const multiline=Boolean(options.multiline);
  const required=Boolean(options.required && !options.readOnly);
  const readOnly=Boolean(options.readOnly);
  const textValue=String(value||'');
  const density=textValue.length/Math.max(Number(w)||10,1);
  const valueClass=density>4?' repair-print-value-very-tight':density>2.5?' repair-print-value-tight':'';
  const common=`name="${name}" data-repair-field="${name}" aria-label="${esc(label)}" maxlength="${Number(options.maxLength||150)}" ${required?'required':''} ${readOnly?'readonly':''} oninput="syncRepairPrintValue(this)"`;
  const control=multiline
    ? `<textarea ${common}>${esc(textValue)}</textarea>`
    : `<input type="text" ${common} value="${esc(textValue)}" ${options.inputMode?`inputmode="${options.inputMode}"`:''}>`;
  return `<label class="repair-overlay-control ${multiline?'repair-overlay-multiline':''}" style="--rf-x:${x}%;--rf-y:${y}%;--rf-w:${w}%;--rf-h:${h}%">
    <span class="sr-only">${esc(label)}</span>
    ${control}
    <span class="repair-print-value${valueClass}" aria-hidden="true">${esc(textValue)}</span>
  </label>`;
}

function repairCheckControl(name,label,x,y,w,h,checked=false,readOnly=false){
  return `<label class="repair-overlay-check" title="${esc(label)}" style="--rf-x:${x}%;--rf-y:${y}%;--rf-w:${w}%;--rf-h:${h}%">
    <input type="checkbox" name="${name}" data-repair-field="${name}" aria-label="${esc(label)}" ${checked?'checked':''} ${readOnly?'disabled':''}>
    <span class="repair-check-glyph" aria-hidden="true">✓</span>
    <span class="sr-only">${esc(label)}</span>
  </label>`;
}

function repairEquipmentDefaults(equipment){
  if(!equipment) return {};
  const category=String(equipment.category||'').toLowerCase();
  const name=String(equipment.name||'').toLowerCase();
  const combined=`${category} ${name}`;
  return {
    brandName:equipment.name||'',
    serialNumber:equipment.serial||equipment.id||'',
    computer:/computer|desktop|laptop|system unit/.test(combined),
    cpu:/\bcpu\b|processor/.test(combined),
    monitor:/monitor|display/.test(combined),
    keyboard:/keyboard/.test(combined),
    mouse:/\bmouse\b/.test(combined),
    printer:/printer/.test(combined),
  };
}

function renderRepairFormSheet(values={},options={}){
  const readOnly=Boolean(options.readOnly);
  const sheetId=options.sheetId||'repair-form-sheet';
  const v={...values};
  const text=(name,label,x,y,w,h,extra={})=>repairTextControl(name,label,x,y,w,h,v[name]||'',{...extra,readOnly});
  const check=(name,label,x,y,w,h)=>repairCheckControl(name,label,x,y,w,h,Boolean(v[name]),readOnly);
  return `<section class="repair-form-sheet${readOnly?' repair-form-sheet-readonly':''}" id="${sheetId}" aria-label="20260825 AMT Request for Repair form">
    <img class="repair-form-background" src="assets/form/20260825-AMT-blank.png" alt="" draggable="false">
    ${text('requisitioner','Requisitioner printed name and signature',37.412,12.485,25.647,1.283,{required:true,maxLength:80})}
    ${text('requestDate','Request date in MM/DD/YYYY format',70,12.228,20.706,1.539,{required:true,inputMode:'numeric',maxLength:10})}
    ${text('department','Department or office',21.176,14.280,41.765,1.368,{required:true,maxLength:100})}
    ${text('technicianResponseTime',"Technician's response time",86,14.366,6.235,1.197,{maxLength:20})}

    ${check('hardwareRepair','Hardware Repair',19.882,18.043,3.765,1.368)}
    ${check('softwareEnhancement','Software Enhancement',64.941,18.299,3.412,1.05)}
    ${check('maintenanceRepair','Maintenance or Repair',86.235,17.872,3.412,1.539)}

    ${text('brandName','Brand name',17.294,20.095,14.588,1.283,{maxLength:60})}
    ${text('serialNumber','Serial number',11.294,21.976,20,1.112,{maxLength:60})}
    ${check('computer','Computer',8.471,26.337,2.706,1.368)}
    ${check('cpu','CPU',11.529,27.620,2.588,1.368)}
    ${check('monitor','Monitor',11.882,28.561,2.118,1.710)}
    ${check('keyboard','Keyboard',11.882,30.100,2.353,1.796)}
    ${check('mouse','Mouse',12,31.297,2,1.197)}
    ${check('printer','Printer',8.706,35.572,2.941,1.112)}

    ${check('repaired','Repaired',27.882,27.192,3.059,1.625)}
    ${check('replaced','Replaced',28.353,28.903,2.353,1.625)}
    ${check('pulledOut','Pulled Out',28,31.468,2.706,1.368)}
    ${check('returned','Returned',27.529,30.356,2.941,1.539)}
    ${check('reformatted','Reformatted',28.471,33.178,1.8,1.112)}
    ${check('forCondemnation','For Condemnation',28.353,34.546,1.9,0.941)}
    ${text('otherEquipment','Other equipment',13.882,37.283,18.471,1.454,{maxLength:60})}
    ${text('specificProblem','Specific problem',20.235,39.078,24.588,1.625,{maxLength:70})}
    ${text('hardwareRemarks','Hardware remarks',15.882,40.960,29.882,1.283,{maxLength:90})}

    ${text('softwareName','Name of software',62.941,20.523,24.941,1.197,{maxLength:80})}
    ${check('addition','Addition',51.1,24.38,2.4,1.25)}
    ${check('replacement','Replacement',51.1,25.70,2.4,1.25)}
    ${check('deletion','Deletion',71.8,24.38,2.4,1.25)}
    ${check('reinstallation','Reinstallation',71.8,25.70,2.4,1.25)}
    ${text('applications','Applications to be enhanced, maintained, or repaired',48.824,28.732,38.235,2.736,{multiline:true,maxLength:180})}
    ${text('softwareRemarks','Software remarks',49.529,33.349,38.471,2.309,{multiline:true,maxLength:120})}

    ${text('approvedBy','Approved by',51.176,39.591,21.294,1.881,{maxLength:80})}
    ${text('approvalDate','Approval date',78.706,40.276,10.824,1.283,{inputMode:'numeric',maxLength:10})}
    ${text('actionTakenBy','Action taken or recommended by',8.824,45.663,23.294,1.283,{maxLength:80})}
    ${text('actionDate','Action date',36.118,46.005,11.529,1.539,{inputMode:'numeric',maxLength:10})}
    ${text('attestedBy','Attested by',49.176,45.919,22.706,1.112,{maxLength:80})}
    ${text('attestedDate','Attested date',77.412,45.834,7.35,1.368,{inputMode:'numeric',maxLength:10})}
    ${text('completionTime','Completion time',85.176,46.603,5.529,1.625,{maxLength:20})}
  </section>`;
}

function syncRepairPrintValue(control){
  const wrapper=control.closest('.repair-overlay-control');
  const output=wrapper?.querySelector('.repair-print-value');
  if(!output) return;
  output.textContent=control.value;
  const density=control.value.length/Math.max(parseFloat(wrapper.style.getPropertyValue('--rf-w'))||10,1);
  output.classList.toggle('repair-print-value-tight',density>2.5);
  output.classList.toggle('repair-print-value-very-tight',density>4);
}

function syncRepairEquipment(equipmentId){
  const form=$('#repair-request-form');
  if(!form) return;
  const equipment=DB.equipment.find(item=>item.id===equipmentId);
  const defaults=repairEquipmentDefaults(equipment);
  ['brandName','serialNumber'].forEach(name=>{
    const control=form.elements[name];
    if(!control) return;
    control.value=defaults[name]||'';
    syncRepairPrintValue(control);
  });
  ['computer','cpu','monitor','keyboard','mouse','printer'].forEach(name=>{
    const control=form.elements[name];
    if(control) control.checked=Boolean(defaults[name]);
  });
}

function filterRepairEquipmentOptions(value){
  const list=$('#repair-equipment-options');
  if(!list) return;
  const query=String(value||'').trim().toLowerCase();
  const selected=$('#rf-equip')?.value||'';
  const matches=DB.equipment.filter(item=>{
    if(item.status==='Condemned') return false;
    return !query || `${item.name} ${item.id} ${item.location}`.toLowerCase().includes(query);
  });
  const placeholder=`<button type="button" class="repair-equipment-option${selected?'':' selected'}" onclick="clearRepairEquipment()">Select the affected equipment…</button>`;
  list.innerHTML=matches.length
    ? placeholder+matches.map(item=>`<button type="button" class="repair-equipment-option${item.id===selected?' selected':''}" onclick="chooseRepairEquipment('${jsString(item.id)}')">${esc(item.name)} — ${esc(item.id)} (${esc(item.location)})</button>`).join('')
    : placeholder+'<div class="repair-equipment-empty">No matching equipment found.</div>';
  list.classList.add('open');
}
function clearRepairEquipment(){
  const input=$('#rf-equip-search');
  const hidden=$('#rf-equip');
  if(!input || !hidden) return;
  hidden.value='';
  input.value='';
  $('#repair-equipment-options')?.classList.remove('open');
}
function chooseRepairEquipment(equipmentId){
  const input=$('#rf-equip-search');
  const hidden=$('#rf-equip');
  const equipment=DB.equipment.find(item=>item.id===equipmentId && item.status!=='Condemned');
  if(!input || !hidden || !equipment) return;
  hidden.value=equipment.id;
  input.value=`${equipment.name} — ${equipment.id} (${equipment.location})`;
  input.setCustomValidity('');
  $('#repair-equipment-options')?.classList.remove('open');
  syncRepairEquipment(equipment.id);
}
document.addEventListener('click',event=>{
  const picker=event.target.closest('.repair-equipment-picker');
  if(picker) return;
  $('#repair-equipment-options')?.classList.remove('open');
});

function collectRepairForm(form){
  const data={formVersion:'20260825-AMT-v1'};
  REPAIR_FORM_TEXT_FIELDS.forEach(name=>{
    data[name]=String(form.elements[name]?.value||'').trim();
  });
  REPAIR_FORM_BOOLEAN_FIELDS.forEach(name=>{
    data[name]=Boolean(form.elements[name]?.checked);
  });
  return data;
}

function repairFormSummary(data){
  const serviceRemarks=[];
  if(data.hardwareRepair) serviceRemarks.push(data.hardwareRemarks);
  if(data.softwareEnhancement||data.maintenanceRepair) serviceRemarks.push(data.softwareRemarks);
  return [...serviceRemarks,data.hardwareRemarks,data.softwareRemarks,data.specificProblem,data.applications]
    .map(value=>String(value||'').trim())
    .find(Boolean)||'Request for repair form submitted.';
}

function repairFormCategory(data){
  const specificProblem=String(data.specificProblem||'').trim();
  if(data.hardwareRepair) return specificProblem||'Hardware Repair';
  if(data.softwareEnhancement){
    const requests=[
      ['addition','Addition'],
      ['replacement','Replacement'],
      ['deletion','Deletion'],
      ['reinstallation','Reinstallation'],
    ].filter(([field])=>Boolean(data[field])).map(([,label])=>label);
    return requests.join(', ')||'Software Enhancement';
  }
  if(data.maintenanceRepair) return specificProblem||'Maintenance/Repair';
  return 'Other';
}

function printRepairForm(sheetId='repair-form-sheet'){
  const sheet=document.getElementById(sheetId);
  if(!sheet){ toast('The printable form is not available','bad'); return; }
  sheet.querySelectorAll('.repair-overlay-control input,.repair-overlay-control textarea').forEach(syncRepairPrintValue);
  document.getElementById('repair-print-root')?.remove();
  const printRoot=document.createElement('div');
  printRoot.id='repair-print-root';
  printRoot.innerHTML='<div class="repair-print-page"></div>';
  const clone=sheet.cloneNode(true);
  clone.removeAttribute('id');
  const sourceChecks=sheet.querySelectorAll('input[type="checkbox"]');
  const clonedChecks=clone.querySelectorAll('input[type="checkbox"]');
  sourceChecks.forEach((control,index)=>{ if(clonedChecks[index]) clonedChecks[index].checked=control.checked; });
  printRoot.firstElementChild.appendChild(clone);
  document.body.appendChild(printRoot);

  const previousTitle=document.title;
  document.title='20260825 AMT';
  document.body.classList.add('printing-repair-form');
  let cleaned=false;
  const cleanup=()=>{
    if(cleaned) return;
    cleaned=true;
    document.body.classList.remove('printing-repair-form');
    printRoot.remove();
    document.title=previousTitle;
  };
  window.addEventListener('afterprint',cleanup,{once:true});
  setTimeout(()=>{
    try{ window.print(); }
    catch(err){ cleanup(); toast('The print dialog could not be opened','bad'); }
  },80);
}

function renderReportView(){
  let preset=state.presetEquipId;
  try{ if(!preset) preset=sessionStorage.getItem(PRESET_KEY)||null; }catch(err){}
  const selectedEquipment=DB.equipment.find(item=>item.id===preset);
  const initialValues={
    requisitioner:state.user.name||'',
    requestDate:repairDisplayDate(),
    department:state.user.department||'',
    attestedBy:state.user.name||'',
    attestedDate:repairDisplayDate(),
    ...repairEquipmentDefaults(selectedEquipment),
  };
  return `<div class="view repair-request-view">
    <div class="card repair-request-card">
      <div class="card-head">
        <div><h3>Request for Repair</h3><div class="sub">Complete the official editable form below, then submit it to the ICT Department.</div></div>
        <span class="repair-form-name">20260825 AMT</span>
      </div>
      <form id="repair-request-form" onsubmit="submitIncidentForm(event)">
        <div class="card-body repair-request-body">
          <div class="field repair-equipment-field">
            <label for="rf-equip">Equipment</label>
            <input type="hidden" id="rf-equip" name="equipmentId" value="${esc(preset||'')}">
            <div class="repair-equipment-picker">
              <input type="text" id="rf-equip-search" value="${esc(selectedEquipment?`${selectedEquipment.name} — ${selectedEquipment.id} (${selectedEquipment.location})`:'' )}" placeholder="Select the affected equipment…" autocomplete="off" aria-controls="repair-equipment-options" aria-expanded="false" onfocus="filterRepairEquipmentOptions(this.value)" oninput="filterRepairEquipmentOptions(this.value)">
              <div id="repair-equipment-options" class="repair-equipment-options" role="listbox"></div>
            </div>
            <div class="hint">Type to filter the equipment list, then choose a matching item. Its name and serial number will be copied into the official form.</div>
          </div>
          <div class="repair-form-toolbar">
            <div><strong>Editable Request for Repair Form</strong><span>Click or tab into the highlighted areas. Every entry is included in the printed copy.</span></div>
            <button type="button" class="btn btn-outline" onclick="printRepairForm()">${icon('printer')} Print Form</button>
          </div>
          <div class="repair-form-scroll">
            ${renderRepairFormSheet(initialValues)}
          </div>
        </div>
        <div class="modal-foot repair-request-actions">
          <button type="button" class="btn btn-outline" onclick="navigate('dashboard')">Cancel</button>
          <button type="button" class="btn btn-dark" onclick="printRepairForm()">${icon('printer')} Print Form</button>
          <button type="submit" class="btn btn-primary">${icon('flag')} Submit Request</button>
        </div>
      </form>
    </div>
  </div>`;
}

async function submitIncidentForm(e){
  e.preventDefault();
  const form=e.currentTarget;
  const equipmentId=$('#rf-equip')?.value||'';
  if(!equipmentId){ toast('Please select the affected equipment first','bad'); $('#rf-equip')?.focus(); return; }
  if(!form.reportValidity()) return;

  const repairForm=collectRepairForm(form);
  if(!repairForm.hardwareRepair && !repairForm.softwareEnhancement && !repairForm.maintenanceRepair){
    toast('Select at least one requested service on the form','bad');
    return;
  }
  const dateReported=repairDateToIso(repairForm.requestDate);
  if(!dateReported || dateReported>todayISO() || dateReported<'2000-01-01'){
    toast('Enter a valid request date in MM/DD/YYYY format','bad');
    form.elements.requestDate?.focus();
    return;
  }
  for(const field of ['approvalDate','actionDate','attestedDate']){
    if(repairForm[field] && !repairDateToIso(repairForm[field])){
      toast('Use MM/DD/YYYY for every date on the form','bad');
      form.elements[field]?.focus();
      return;
    }
  }
  const description=repairFormSummary(repairForm);
  if(description==='Request for repair form submitted.'){
    toast('Describe the problem or requested software work on the form','bad');
    form.elements.specificProblem?.focus();
    return;
  }

  const rec={
    id:nextIncidentId(),equipmentId,reportedByUserId:state.user.id,
    reportedByName:repairForm.requisitioner,reportedByDepartment:repairForm.department,
    dateReported,category:repairFormCategory(repairForm),
    description,repairForm,status:'Pending',priority:'Medium',remarks:'',resolvedDate:null,
  };
  const submitButton=e.submitter;
  if(submitButton){
    submitButton.disabled=true;
    submitButton.setAttribute('aria-busy','true');
    submitButton.innerHTML=`${icon('clock')} Submitting…`;
  }
  try{
    const response=await apiRequest('incidents.php',{
      method:'POST',
      body:JSON.stringify(rec),
    });
    if(!response.success||!response.data) throw new Error(response.message||'Unable to submit request');
    DB.incidents.push(response.data);
    rec.id=response.data.id;
  }catch(err){
    console.error('ICTRAX: request for repair was not saved.',err);
    toast(err.message||'Request was not saved to the database','bad');
    if(submitButton){
      submitButton.disabled=false;
      submitButton.removeAttribute('aria-busy');
      submitButton.innerHTML=`${icon('flag')} Submit Request`;
    }
    return;
  }
  saveDb();
  state.presetEquipId=null;
  try{ sessionStorage.removeItem(PRESET_KEY); }catch(err){}
  toast(`Request ${rec.id} submitted`,'good');
  navigate('myreports');
}

/* ============================================================
   FACULTY — My Submitted Incidents
   ============================================================ */
function myReportsTableRowsMarkup(rows){
  return rows.map(i=>{
    const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
    return `<tr>
      <td>${tagChip(i.id)}</td>
      <td><div class="cell-strong">${eqp?esc(eqp.name):'—'}</div><div class="cell-sub">${eqp?esc(eqp.location):''}</div></td>
      <td>${fmtDate(i.dateReported)}</td>
      <td>${esc(i.category)}</td>
      <td>${badge(i.status)}</td>
      <td><button class="icon-btn" onclick="openIncidentModal('${jsString(i.id)}')">${icon('eye')}</button></td>
    </tr>`;
  }).join('');
}
function renderMyReportsResults(){
  const rows=sortTableRows(filteredIncidentRows('myreports'),'myreports');
  const body=$('#my-reports-table-body');
  const empty=$('#my-reports-empty-state');
  if(body) body.innerHTML=myReportsTableRowsMarkup(rows);
  if(empty){
    empty.classList.toggle('hidden',rows.length>0);
    empty.innerHTML=rows.length ? '' : emptyState('inbox','No matching active incident reports','Pending, in-progress, and rejected reports matching these filters will appear here. Resolved reports are available under Completed Incident Reports.');
  }
}
function renderMyReportsView(){
  const mine = sortTableRows(filteredIncidentRows('myreports'),'myreports');
  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input id="my-reports-search" type="text" placeholder="Search by equipment or report ID..." value="${esc(state.filters.myReportsSearch)}" oninput="onMyReportsSearch(this.value)"></div>
      </div>
    </div>
    <div class="card"><div class="card-body flush">
    <div class="table-wrap"><table class="dtable">
      <thead><tr>${sortableFilterHeader('myreports','id','Report')}${sortableFilterHeader('myreports','equipment','Equipment')}${sortableFilterHeader('myreports','dateReported','Date')}${sortableFilterHeader('myreports','category','Category')}${sortableFilterHeader('myreports','status','Incident Status')}<th></th></tr></thead>
      <tbody id="my-reports-table-body">${myReportsTableRowsMarkup(mine)}</tbody>
    </table></div>
    <div id="my-reports-empty-state" class="${mine.length?'hidden':''}">${mine.length?'':emptyState('inbox','No matching active incident reports','Pending, in-progress, and rejected reports matching these filters will appear here. Resolved reports are available under Completed Incident Reports.')}</div>
    </div></div>
  </div>`;
}
function onMyReportsSearch(value){
  state.filters.myReportsSearch=value;
  renderMyReportsResults();
}

/* ============================================================
   ROUTER TABLE
   ============================================================ */
function renderArchivedView(){
  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left"><div class="search-box">${icon('search')}<input type="text" placeholder="Search by code, name, location, or reason…" value="${esc(state.filters.archivedSearch)}" oninput="onArchivedSearch(this.value)"></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline" type="button" onclick="exportArchivedXLSX()">${icon('download')} Export Excel</button><button class="btn btn-outline" type="button" onclick="loadArchivedEquipment()">${icon('activity')} Refresh</button></div>
    </div>
    <div class="card">
      <div class="card-head"><div><h3>Archived Equipment</h3><div class="sub">Archived equipment records and available actions.</div></div></div>
      <div class="card-body flush">
        <div class="table-wrap">
          <table class="dtable">
            <thead><tr>${columnFilterHeader('archived','equipment_code','Equipment Code')}${columnFilterHeader('archived','equipment_name','Equipment Name')}${columnFilterHeader('archived','location','Location')}${columnFilterHeader('archived','archive_reason','Archive Reason')}${columnFilterHeader('archived','archived_date','Date Archived')}<th>Actions</th></tr></thead>
            <tbody id="archived-equipment-body"><tr><td colspan="6"><div class="page-loading">Loading archived equipment...</div></td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}
function onArchivedSearch(value){
  state.filters.archivedSearch=value;
  renderArchivedRows();
}
function renderArchivedRows(){
  const tbody=$('#archived-equipment-body');
  if(!tbody) return;
  const rows=sortTableRows(filteredArchivedRows(),'archived');
  tbody.innerHTML=rows.length ? rows.map(item=>`
    <tr>
      <td>${esc(item.equipment_code || '')}</td>
      <td>${esc(item.equipment_name || '')}</td>
      <td>${esc(item.location || '')}</td>
      <td>${esc(item.archive_reason || '')}</td>
      <td>${esc(item.archived_date || '')}</td>
      <td>
        <button class="btn btn-sm" data-archive-action="details" data-archive-record-id="${Number(item.archive_record_id)}">View Details</button>
        <button class="btn btn-sm" data-archive-action="qr" data-archive-record-id="${Number(item.archive_record_id)}">View QR Tag</button>
        <button class="btn btn-sm" data-archive-action="service-card" data-archive-record-id="${Number(item.archive_record_id)}">Service Card</button>
        <button class="btn btn-sm" data-archive-action="restore" data-archive-record-id="${Number(item.archive_record_id)}">Restore</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="6">No archived equipment records found.</td></tr>';
}
const VIEWS = {
  dashboard:()=> state.user.role==='admin' ? renderAdminDashboard() : renderFacultyDashboard(),
  equipment: renderEquipmentView,
  archived: renderArchivedView,
  incidents: renderIncidentsView,
  completed: renderCompletedIncidentsView,
  audit: renderAuditView,
  risk: renderRiskView,
  browse: renderBrowseView,
  report: renderReportView,
  myreports: renderMyReportsView,
};

/* ============================================================
   INIT
   ============================================================ */
function initLoginVisual(){
  const positions = [
    {top:'0px',left:'0px'}, {top:'46px',left:'190px'}, {top:'104px',left:'20px'},
    {top:'8px',left:'330px'}, {top:'140px',left:'250px'},
  ];
  const picks = DB.equipment.slice(0,positions.length).map((equipment,index)=>({...positions[index],id:equipment.id,status:equipment.status}));
  const dotHex = {'Operational':'#2f8f7f','Under Repair':'#df9f34','Damaged':'#c1443c','Missing':'#c1443c','Condemned':'#6b7280'};
  const scatter = $('#tag-scatter');
  if(scatter){
    scatter.innerHTML = picks.map(p=>`<div class="floating-tag" style="top:${p.top};left:${p.left}"><i style="background:${dotHex[p.status]}"></i>${p.id}</div>`).join('');
  }
  const equipCount = $('#lv-stat-equip');
  if(equipCount) equipCount.textContent = DB.equipment.length;
}

function renderAuthenticatedPage(page){
  state.view = page;
  try{ state.presetEquipId = sessionStorage.getItem(PRESET_KEY) || null; }catch(err){}
  renderSidebar();
  const [crumb,title] = TITLES[page]||['',''];
  if($('#topbar-crumb')) $('#topbar-crumb').textContent = crumb;
  if($('#topbar-title')) $('#topbar-title').textContent = title;
  renderNotificationControl();
  renderAccountControl();
  const renderFn = VIEWS[page];
  if($('#view-root')) $('#view-root').innerHTML = renderFn ? renderFn() : '';
  let pendingNotificationJump=null;
  try{
    const storedTarget=sessionStorage.getItem(PENDING_NOTIFICATION_JUMP_KEY) || '';
    if(storedTarget){
      try{
        const parsedTarget=JSON.parse(storedTarget);
        pendingNotificationJump=parsedTarget && typeof parsedTarget==='object'
          ? parsedTarget
          : {targetType:'incident',targetId:storedTarget};
      }catch(error){
        pendingNotificationJump={targetType:'incident',targetId:storedTarget};
      }
    }
    sessionStorage.removeItem(PENDING_NOTIFICATION_JUMP_KEY);
  }catch(error){}
  if(pendingNotificationJump?.targetId){
    setTimeout(()=>openNotificationTarget(pendingNotificationJump.targetType || 'incident',pendingNotificationJump.targetId),0);
  }
  if(page==='archived') loadArchivedEquipment();
  if(state.user?.role==='admin' || state.user?.role==='faculty') startIncidentNotifications();
  closeModal();
  startSessionInactivityMonitor();
}

window.addEventListener('DOMContentLoaded', async ()=>{
  const page=currentPage();
  const logoutRedirect=consumeLogoutRedirect();
  const forcedLogoutOnArrival=consumeForcedLogoutOnArrival();
  const mustTerminatePreviousSession=INITIAL_NAVIGATION_WAS_RELOAD || forcedLogoutOnArrival || (page==='login' && Boolean(logoutRedirect));

  if(mustTerminatePreviousSession){
    const completed=await terminateSessionAndReturnToLogin({
      reason:(INITIAL_NAVIGATION_WAS_RELOAD || forcedLogoutOnArrival) ? 'browser-reload' : 'logout-redirect-verification',
      redirect:page!=='login',
      broadcast:INITIAL_NAVIGATION_WAS_RELOAD || forcedLogoutOnArrival,
    });
    if(page!=='login') return;
    if(!completed){
      initLoginVisual();
      setLoginRole(state.loginRole);
      showLoginError('The previous server session could not be terminated. Reload this sign-in page to retry safely.');
      setGoogleAuthStatus('Sign-in is paused until the previous session is closed.');
      return;
    }
  }

  if(page==='login'){
    try{
      const session=await requestServerSession();
      if(session.authenticated){
        csrfToken=session.csrfToken;
        setSessionUser(session.user);
        window.location.replace(PAGE_MAP.dashboard);
        return;
      }
      clearSession();
    }catch(error){
      clearSession();
      initLoginVisual();
      setLoginRole(state.loginRole);
      showLoginError('ICTRAX could not verify that the previous session is closed. Please retry when the server is available.');
      setGoogleAuthStatus('Secure session verification is unavailable.');
      return;
    }
    initLoginVisual();
    setLoginRole(state.loginRole);
    initializeGoogleAuth();
    return;
  }

  try{
    const session=await requestServerSession();
    if(!session.authenticated){
      await terminateSessionAndReturnToLogin({reason:'authentication-required'});
      return;
    }
    csrfToken=session.csrfToken;
    setSessionUser(session.user);

    const allowedRoles = PAGE_ACCESS[page] || [];
    if(!allowedRoles.includes(state.user.role)){
      window.location.replace(PAGE_MAP.dashboard);
      return;
    }

    await loadPersistedDb();
    renderAuthenticatedPage(page);
    revealProtectedPage();
  }catch(error){
    if(logoutOperation) return;
    if(error.status===401 || error.status===403){
      await terminateSessionAndReturnToLogin({reason:'authentication-rejected'});
      return;
    }
    renderStartupFailure(error);
  }
});


// ICTRAX V12 Service Card Fallback
// Displays the generated service card inside a modal window.

function generateServiceCardV12(equipment){
    const item = equipment || {};

    const card = `
    <div class="service-card-preview">
        <h2>CENTRO ESCOLAR UNIVERSITY</h2>
        <h3>Equipment Repair/Service Card</h3>

        <p><b>Equipment:</b> ${esc(item.name || '')}</p>
        <p><b>Equipment Number:</b> ${esc(item.id || item.equipment_code || '')}</p>
        <p><b>Model:</b> ${esc(item.model || '')}</p>
        <p><b>Serial Number:</b> ${esc(item.serial_number || '')}</p>
        <p><b>Location:</b> ${esc(item.location || '')}</p>
        <p><b>Date Acquired:</b> ${esc(item.date_acquired || '')}</p>
        <p><b>Unit Cost:</b> ${esc(item.unit_cost || '')}</p>

        <table border="1" width="100%">
            <tr>
                <th>Date</th>
                <th>Remarks</th>
                <th>Preventive Maintenance</th>
                <th>Cost of Repair</th>
                <th>Serviced By</th>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>Yes / No</td>
                <td></td>
                <td></td>
            </tr>
        </table>

        <br>
        <button onclick="window.print()">Print Service Card</button>
    </div>`;

    if(typeof openModal === "function"){
        openModal(card);
    } else {
        document.body.insertAdjacentHTML("beforeend", card);
    }
}

window.generateServiceCardV12 = generateServiceCardV12;


// ICTRAX Faculty QR Scanner - Read Only Service Card Viewer
function openFacultyReadOnlyServiceCard(id){
  const equipment = DB.equipment.find(x => x.id === id);

  if(!equipment){
    toast('Equipment record not found','bad');
    return;
  }

  const card = `
  <div class="service-card-preview readonly">
    <h2>CENTRO ESCOLAR UNIVERSITY</h2>
    <h3>Equipment Repair/Service Card</h3>
    <span class="badge">Read Only View</span>

    <p><b>Equipment:</b> ${esc(equipment.name || '')}</p>
    <p><b>Equipment Number:</b> ${esc(equipment.equipment_code || equipment.id || '')}</p>
    <p><b>Model:</b> ${esc(equipment.model || '')}</p>
    <p><b>Serial Number:</b> ${esc(equipment.serial || equipment.serial_number || '')}</p>
    <p><b>Location:</b> ${esc(equipment.location || '')}</p>
    <p><b>Date Acquired:</b> ${esc(equipment.dateAcquired || equipment.date_acquired || '')}</p>
    <p><b>Unit Cost:</b> ${esc(equipment.unit_cost || '')}</p>

    <table border="1" width="100%">
      <tr>
        <th>Date</th>
        <th>Remarks</th>
        <th>Preventive Maintenance</th>
        <th>Cost of Repair</th>
        <th>Serviced By</th>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td>Yes / No</td>
        <td></td>
        <td></td>
      </tr>
    </table>

    <p><small>Faculty users may view service history only. Editing is restricted to administrators.</small></p>
  </div>`;

  openModal(card);
}
window.openFacultyReadOnlyServiceCard = openFacultyReadOnlyServiceCard;


// ICTRAX Archive Equipment Workflow
async function archiveEquipment(id){
  const equipment = DB.equipment.find(x=>x.id===id);

  if(!equipment){
    toast('Equipment record not found','bad');
    return;
  }

  const reason = prompt('Archive reason (Condemned / Transferred / Other):','Condemned');
  if(!reason) return;

  try{
    const result = await apiRequest('archive_equipment.php',{
      method:'POST',
      body:JSON.stringify({
        id: equipment.id,
        equipment_id: equipment.id,
        equipment_code: equipment.id,
        equipment_name: equipment.name || '',
        name: equipment.name || '',
        department: equipment.department || '',
        location: equipment.location || '',
        archive_reason: reason
      })
    });

    if(!result.success){
      throw new Error(result.message || 'Archive failed');
    }

    DB.equipment = DB.equipment.filter(x=>x.id!==id);
    saveDb();
    closeModal();

    if(typeof renderEquipmentView==='function'){
      document.querySelector('#view-root').innerHTML = renderEquipmentView();
    }

    toast('Equipment archived successfully','good');

  }catch(error){
    console.error('Archive error:',error);
    toast('Unable to archive equipment. Please try again.','bad');
  }
}

// ICTRAX Archived Equipment Loader
async function loadArchivedEquipment(){
    try{
        const data = await apiRequest('archived_equipment.php');
        if(!Array.isArray(data)){
            throw new Error('Archive response was not a list');
        }

        const tbody = document.getElementById('archived-equipment-body');
        if(!tbody) return;

        state.archivedRows=data;
        renderArchivedRows();

        tbody.onclick = async event=>{
            const button = event.target.closest('button[data-archive-action]');
            if(!button || !tbody.contains(button)) return;

            const {archiveAction,archiveRecordId} = button.dataset;
            if(archiveAction==='details') await viewArchivedDetails(archiveRecordId);
            else if(archiveAction==='qr') await viewArchivedQR(archiveRecordId);
            else if(archiveAction==='service-card') await viewArchivedServiceCard(archiveRecordId);
            else if(archiveAction==='restore') await restoreEquipment(archiveRecordId);
        };

    }catch(error){
        console.error(error);
        toast('Unable to load archived equipment','bad');
    }
}


async function fetchArchivedEquipmentRecord(id){
    const equipment = await apiRequest(`archived_equipment.php?archive_id=${encodeURIComponent(id)}`);
    if(equipment.success===false){
        throw new Error(equipment.message || 'Archived equipment request failed');
    }
    return equipment;
}

async function viewArchivedDetails(id){
    try{
        const equipment=await fetchArchivedEquipmentRecord(id);
        openModal(`
        <div class="modal-head">
            <h3>Archived Equipment Details</h3>
            <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
        </div>
        <div class="modal-body">
            <p><b>Equipment:</b> ${esc(equipment.equipment_name || '')}</p>
            <p><b>Code:</b> ${esc(equipment.equipment_code || '')}</p>
            <p><b>Department:</b> ${esc(equipment.department || '')}</p>
            <p><b>Location:</b> ${esc(equipment.location || '')}</p>
            <p><b>Warranty Provider:</b> ${esc(equipment.warranty_provider || 'Not recorded')}</p>
            <p><b>Warranty Expiration:</b> ${esc(equipment.warranty_expiration ? fmtDate(equipment.warranty_expiration) : 'Not recorded')}</p>
            <p><b>Archive Reason:</b> ${esc(equipment.archive_reason || '')}</p>
            <p><b>Date Archived:</b> ${esc(equipment.archived_date || '')}</p>
        </div>`);
    }catch(error){
        console.error('Archived equipment details failed to load:',error);
        toast('Unable to load archived equipment details','bad');
    }
}

async function viewArchivedQR(id){
    try{
        const equipment=await fetchArchivedEquipmentRecord(id);
        openModal(`
        <div class="modal-head">
            <div><h3>Equipment QR Tag</h3><div class="modal-sub">${esc(equipment.equipment_code || id)} · Archived equipment</div></div>
            <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
        </div>
        <div class="modal-body">
            <div class="qr-tag-card">
                <div class="qr-pattern" id="archived-real-qr-code" aria-label="QR code for ${esc(equipment.equipment_code || id)}"></div>
                <div class="qr-print-tag">Tag ID: ${esc(equipment.equipment_code || id)}</div>
                <div class="qr-meta">
                    <div class="qm-name">${esc(equipment.equipment_name || '')}</div>
                    <div class="qm-id">${esc(equipment.equipment_code || id)}</div>
                    <div class="kv-list">
                        <div class="kv-row"><span class="k">Location</span><span class="v">${esc(equipment.location || '')}</span></div>
                        <div class="kv-row"><span class="k">Department</span><span class="v">${esc(equipment.department || '')}</span></div>
                        <div class="kv-row"><span class="k">Archive Reason</span><span class="v">${esc(equipment.archive_reason || '')}</span></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-foot">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
            <button class="btn btn-outline" id="archived-qr-download">${icon('download')} Download JPG</button>
            <button class="btn btn-dark" onclick="window.print()">${icon('printer')} Print Tag</button>
        </div>`);
        $('#archived-qr-download').onclick=()=>downloadEquipmentQrJpg(equipment.equipment_code || id,'archived-real-qr-code');
        setTimeout(()=>renderRealQrCode(equipment.equipment_code || id,'archived-real-qr-code'),30);
    }catch(error){
        console.error('Archived equipment QR failed to load:',error);
        toast('Unable to open archived equipment QR tag','bad');
    }
}

async function viewArchivedServiceCard(id){
    try{
        const equipment=await fetchArchivedEquipmentRecord(id);
        const card=equipment.service_card;
        if(!card){
            openModal(`
            <div class="modal-head">
                <div><h3>Past Equipment Service Card</h3><div class="modal-sub">${esc(equipment.equipment_code || id)} · ${esc(equipment.equipment_name || '')}</div></div>
                <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
            </div>
            <div class="modal-body"><div class="empty-state">${icon('file')}<h3>No saved service-card history</h3><p>No service-card record was available when this equipment was archived.</p></div></div>
            <div class="modal-foot"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
            return;
        }

        const rows=Array.isArray(card.service_rows)?card.service_rows:[];
        const populatedRows=rows.filter(row=>row && Object.values(row).some(value=>String(value || '').trim()!==''));
        openModal(`
        <div class="modal-head">
            <div><h3>Past Equipment Repair/Service Card</h3><div class="modal-sub">${esc(equipment.equipment_code || id)} · ${esc(equipment.equipment_name || '')} · Read only</div></div>
            <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
        </div>
        <div class="modal-body service-card-modal">
            <div class="service-card-brand"><strong>CENTRO ESCOLAR UNIVERSITY</strong><span>Manila · Makati · Malolos</span></div>
            <div class="service-card-office">${esc(card.office || 'Office/School/College/Department/Section not recorded')}</div>
            <div class="service-card-details">
                <label><span>Equipment</span><div>${esc(equipment.equipment_name || '')}</div></label>
                <label><span>Equipment Number</span><div>${esc(equipment.equipment_code || id)}</div></label>
                <label><span>Model</span><div>${esc(card.model || 'Not recorded')}</div></label>
                <label><span>Serial Number</span><div>${esc(equipment.serial_number || '')}</div></label>
                <label><span>Location</span><div>${esc(equipment.location || '')}</div></label>
                <label><span>Date Acquired</span><div>${esc(equipment.date_acquired || '')}</div></label>
                <label><span>Unit Cost</span><div>${esc(card.unit_cost || 'Not recorded')}</div></label>
            </div>
            <div class="service-log-wrap">
                <table class="service-card-table">
                    <thead><tr><th rowspan="2">Date</th><th rowspan="2">Remarks</th><th colspan="2">Preventive<br>Maintenance?</th><th rowspan="2">Cost of<br>Repair</th><th rowspan="2">Serviced by</th></tr><tr><th>Yes</th><th>No</th></tr></thead>
                    <tbody>${populatedRows.length ? populatedRows.map(row=>`<tr>
                        <td>${esc(row.date || '')}</td>
                        <td>${esc(row.remarks || '')}</td>
                        <td class="service-check-readonly">${row.preventive==='Yes'?'<span aria-label="Yes selected">&#10003;</span>':''}</td>
                        <td class="service-check-readonly">${row.preventive==='No'?'<span aria-label="No selected">&#10003;</span>':''}</td>
                        <td>${esc(row.cost || '')}</td>
                        <td>${esc(row.servicedBy || '')}</td>
                    </tr>`).join('') : '<tr><td colspan="6">No service entries were recorded.</td></tr>'}</tbody>
                </table>
            </div>
            <div class="banner banner-blue" style="margin-top:14px">Read-only copy of the service card saved before this equipment was archived.</div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" onclick="closeModal()">Close</button><button class="btn btn-dark" onclick="printServiceCard()">${icon('printer')} Print Service Card</button></div>`,{wide:true});
    }catch(error){
        console.error('Archived service card failed to load:',error);
        toast('Unable to load the past service card','bad');
    }
}

async function restoreEquipment(id){
    if(!await confirmAction('Restore this equipment?',{title:'Restore equipment',confirmLabel:'Restore'})) return;

    try{
        const result = await apiRequest('restore_equipment.php',{
            method:'POST',
            body:JSON.stringify({archive_id:id})
        });
        if(!result.success){
            throw new Error(result.message || 'Restore failed');
        }

        if(result.equipment && !DB.equipment.some(item=>item.id===result.equipment.id)){
            DB.equipment.push(result.equipment);
            saveDb();
        }
        toast('Equipment restored to inventory','good');
        navigate('equipment');
    }catch(error){
        console.error('Equipment restore failed:',error);
        toast(error.message || 'Unable to restore equipment','bad');
    }
}
