/* ============================================================
   EMS APPLICATION SCRIPT
   Part 1 — icons, mock data layer, utilities, risk engine,
   charts, auth, sidebar + router
   ============================================================ */

/* ---------- tiny DOM helpers ---------- */
const $  = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));
const esc = (s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>',
};
const icon=(name,extra='')=>`<span class="ico ${extra}">${ICONS[name]||''}</span>`;

const PAGE_MAP = {
  dashboard:'dashboard.html',
  equipment:'inventory.html',
  incidents:'incidents.html',
  risk:'risk.html',
  reports:'reports.html',
  browse:'browse-equipment.html',
  report:'report-issue.html',
  myreports:'my-reports.html'
};
const PAGE_ACCESS = {
  dashboard:['admin','student'],
  equipment:['admin'],
  incidents:['admin'],
  risk:['admin'],
  reports:['admin'],
  browse:['student'],
  report:['admin','student'],
  myreports:['student']
};
const SESSION_KEY = 'ictrax_session_user_v1';
const DB_STORAGE_KEY = 'ictrax_demo_db_v1';
const PRESET_KEY = 'ictrax_preset_equipment_v1';
const API_BASE_URL = 'api';


/* ---------- category → icon / code maps ---------- */
const CATEGORY_ICON = {'Desktop Computer':'cpu','Monitor':'monitor','Keyboard':'keyboard','Mouse':'mouse','UPS':'battery','Projector':'video','Printer':'printer','Router/Switch':'wifi','Webcam':'camera','Headset':'headset'};
const CATEGORY_CODE = {'Desktop Computer':'DT','Monitor':'MN','Keyboard':'KB','Mouse':'MO','UPS':'UPS','Projector':'PRJ','Printer':'PRT','Router/Switch':'NET','Webcam':'CAM','Headset':'HS'};
const LOCATIONS = ['Computer Laboratory 1','Computer Laboratory 2','Computer Laboratory 3','Server Room'];
const LOCATION_CODE = {'Computer Laboratory 1':'CL1','Computer Laboratory 2':'CL2','Computer Laboratory 3':'CL3','Server Room':'SVR'};

/* ============================================================
   MOCK DATA LAYER
   -----------------------------------------------------------
   Stand-in for the group's database. Every read/write in this
   file goes through the DB.* arrays and the functions directly
   below them — swap those functions' internals for fetch() calls
   to your teammate's API once the backend is ready, and the rest
   of the UI keeps working unchanged.
   ============================================================ */
const DB = {
  equipment: [
    {id:'EMS-CL1-DT-001',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-101',status:'Operational',condition:'Good',dateAcquired:'2023-06-12',lastMaintenance:'2026-07-02',notes:'Station 1.'},
    {id:'EMS-CL1-DT-002',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-102',status:'Operational',condition:'Good',dateAcquired:'2023-06-12',lastMaintenance:'2026-07-02',notes:'Station 2.'},
    {id:'EMS-CL1-DT-003',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-103',status:'Under Repair',condition:'Fair',dateAcquired:'2022-03-04',lastMaintenance:'2026-02-18',notes:'Recurring blue-screen errors, RAM re-seated.'},
    {id:'EMS-CL1-DT-004',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-104',status:'Operational',condition:'Good',dateAcquired:'2023-06-12',lastMaintenance:'2026-06-20',notes:'Station 4.'},
    {id:'EMS-CL1-DT-005',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-105',status:'Damaged',condition:'Poor',dateAcquired:'2021-08-19',lastMaintenance:'2025-11-05',notes:'Unit does not power on — suspected PSU failure.'},
    {id:'EMS-CL1-DT-006',name:'Desktop Computer',category:'Desktop Computer',location:'Computer Laboratory 1',serial:'CEU-CL1-PC-106',status:'Operational',condition:'Good',dateAcquired:'2024-01-15',lastMaintenance:'2026-07-30',notes:'Station 6.'},
    {id:'EMS-CL1-MN-001',name:'Spare Monitor',category:'Monitor',location:'Computer Laboratory 1',serial:'CEU-CL1-MN-001',status:'Decommissioned',condition:'Poor',dateAcquired:'2019-02-10',lastMaintenance:'2024-01-10',notes:'Retired — panel discoloration beyond economical repair.'},
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
    {id:'INC-0001',equipmentId:'EMS-CL1-DT-005',reportedByUserId:'u-student-1',reportedByName:'Juan Dela Cruz',reportedByCourse:'BSIT-3A',dateReported:'2026-07-28',category:'Damaged',description:'Unit does not power on; suspected PSU failure.',status:'In Progress',priority:'High',remarks:'Escalated to supplier for a PSU replacement quote.',resolvedDate:null},
    {id:'INC-0002',equipmentId:'EMS-CL1-DT-003',reportedByUserId:null,reportedByName:'Andrea Reyes',reportedByCourse:'BSIT-2A',dateReported:'2026-06-30',category:'Malfunctioning',description:'Frequent blue-screen errors during lab exercises.',status:'In Progress',priority:'Medium',remarks:'Technician re-seated RAM modules; monitoring for recurrence.',resolvedDate:null},
    {id:'INC-0003',equipmentId:'EMS-CL1-PRJ-001',reportedByUserId:null,reportedByName:'Kevin Manalo',reportedByCourse:'BSIT-1B',dateReported:'2026-06-02',category:'Malfunctioning',description:'Projected image is dim even at full brightness.',status:'Pending',priority:'Medium',remarks:'',resolvedDate:null},
    {id:'INC-0004',equipmentId:'EMS-CL2-DT-002',reportedByUserId:null,reportedByName:'Bea Fernandez',reportedByCourse:'BSIT-2B',dateReported:'2026-07-20',category:'Damaged',description:'Casing cracked after accidental fall; RAM slot appears loose.',status:'Pending',priority:'High',remarks:'',resolvedDate:null},
    {id:'INC-0005',equipmentId:'EMS-CL2-PRT-001',reportedByUserId:null,reportedByName:'Paulo Ramirez',reportedByCourse:'BSIT-3B',dateReported:'2026-06-15',category:'Malfunctioning',description:'Printer repeatedly jams on the second page of any print job.',status:'In Progress',priority:'Low',remarks:'Awaiting replacement roller kit from supplier.',resolvedDate:null},
    {id:'INC-0006',equipmentId:'EMS-CL3-DT-004',reportedByUserId:null,reportedByName:'Nicole Aquino',reportedByCourse:'BSIT-4A',dateReported:'2026-06-05',category:'Missing',description:'Unit was not found at Station 4 during the semester-break inventory count.',status:'Pending',priority:'Critical',remarks:'',resolvedDate:null},
    {id:'INC-0007',equipmentId:'EMS-CL1-DT-001',reportedByUserId:'u-student-1',reportedByName:'Juan Dela Cruz',reportedByCourse:'BSIT-3A',dateReported:'2026-03-14',category:'Malfunctioning',description:'Mouse pointer freezes intermittently during use.',status:'Resolved',priority:'Low',remarks:'Replaced faulty USB port cable.',resolvedDate:'2026-03-18'},
    {id:'INC-0008',equipmentId:'EMS-CL2-DT-004',reportedByUserId:null,reportedByName:'Trisha Domingo',reportedByCourse:'BSIT-1A',dateReported:'2026-02-22',category:'Other',description:'Sticky spacebar key, difficult to type accurately.',status:'Resolved',priority:'Low',remarks:'Keyboard cleaned and lubricated.',resolvedDate:'2026-02-25'},
    {id:'INC-0009',equipmentId:'EMS-CL3-DT-003',reportedByUserId:null,reportedByName:'Marco Villanueva',reportedByCourse:'BSIT-2A',dateReported:'2026-04-09',category:'Malfunctioning',description:'Monitor output flickers intermittently.',status:'Resolved',priority:'Medium',remarks:'Replaced HDMI cable.',resolvedDate:'2026-04-14'},
    {id:'INC-0010',equipmentId:'EMS-CL1-UPS-001',reportedByUserId:null,reportedByName:'Angeline Cruz',reportedByCourse:'BSIT-3A',dateReported:'2026-05-02',category:'Other',description:'UPS emits a beeping sound during minor power fluctuations.',status:'Rejected',priority:'Low',remarks:'Confirmed normal UPS behavior during a brownout; no defect found.',resolvedDate:'2026-05-04'},
    {id:'INC-0011',equipmentId:'EMS-CL2-DT-001',reportedByUserId:'u-student-1',reportedByName:'Juan Dela Cruz',reportedByCourse:'BSIT-3A',dateReported:'2026-07-01',category:'Malfunctioning',description:'System runs unusually slow when opening multiple programming IDEs.',status:'Pending',priority:'Medium',remarks:'',resolvedDate:null},
    {id:'INC-0012',equipmentId:'EMS-CL1-DT-004',reportedByUserId:null,reportedByName:'Camille Navarro',reportedByCourse:'BSIT-2B',dateReported:'2026-01-18',category:'Malfunctioning',description:'USB ports on the front panel are unresponsive.',status:'Resolved',priority:'Low',remarks:'Reconnected front-panel USB header.',resolvedDate:'2026-01-20'},
    {id:'INC-0013',equipmentId:'EMS-CL3-CAM-001',reportedByUserId:null,reportedByName:'Ella Mercado',reportedByCourse:'BSIT-1B',dateReported:'2026-07-15',category:'Malfunctioning',description:'Webcam image appears blurry during online class recordings.',status:'Pending',priority:'Low',remarks:'',resolvedDate:null},
    {id:'INC-0014',equipmentId:'EMS-CL2-NET-001',reportedByUserId:null,reportedByName:'Diego Salazar',reportedByCourse:'BSIT-4B',dateReported:'2026-05-27',category:'Malfunctioning',description:'Intermittent loss of network connectivity in the last row of units.',status:'Resolved',priority:'Medium',remarks:'Replaced a faulty Ethernet switch port.',resolvedDate:'2026-06-01'},
  ],

  users: [
    {id:'u-admin-1',username:'admin.tech',password:'admin123',role:'admin',name:'Ramon Cruz',title:'ICT Laboratory Technician',initials:'RC'},
    {id:'u-student-1',username:'jdelacruz',password:'student123',role:'student',name:'Juan Dela Cruz',studentId:'22-10045',course:'BSIT-3A',initials:'JD'},
  ],
};


/* ---------- browser persistence for the frontend demo ---------- */
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: {'Content-Type': 'application/json'},
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

async function loadPersistedDb(){
  try {
    const [equipmentRes, incidentsRes] = await Promise.all([
      apiRequest('equipment.php').catch(() => ({success:false, data:[] })),
      apiRequest('incidents.php').catch(() => ({success:false, data:[] })),
    ]);

    if (equipmentRes.success && Array.isArray(equipmentRes.data)) {
      DB.equipment = equipmentRes.data;
    }
    if (incidentsRes.success && Array.isArray(incidentsRes.data)) {
      DB.incidents = incidentsRes.data;
    }

    if (equipmentRes.success || incidentsRes.success) {
      incidentSeq = DB.incidents.length;
      return;
    }
  } catch (err) {
    console.warn('ICTRAX: remote API not available, using local demo data.', err);
  }

  try{
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if(!raw) return;
    const saved = JSON.parse(raw);
    if(Array.isArray(saved.equipment)) DB.equipment = saved.equipment;
    if(Array.isArray(saved.incidents)) DB.incidents = saved.incidents;
    incidentSeq = DB.incidents.length;
  }catch(err){ console.warn('ICTRAX: unable to load demo database.', err); }
}
function saveDb(){
  try{
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify({equipment:DB.equipment,incidents:DB.incidents}));
  }catch(err){ console.warn('ICTRAX: unable to save demo database.', err); }
}
function getSessionUser(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    if(!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role) return parsed;
    } catch (err) {}

    const userId = String(raw);
    return userId ? DB.users.find(user => String(user.id) === userId) || null : null;
  }catch(err){ return null; }
}
function setSessionUser(user){
  state.user = user;
  try{
    const payload = {
      ...user,
      id: String(user.id),
      username: user.username || '',
      role: user.role || 'student'
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }catch(err){}
}
function clearSession(){
  state.user = null;
  try{ sessionStorage.removeItem(SESSION_KEY); }catch(err){}
}
function currentPage(){ return document.body?.dataset.page || 'login'; }

/* ---------- id counters (seeded from the arrays above) ---------- */
let incidentSeq = DB.incidents.length;
function nextIncidentId(){ incidentSeq++; return 'INC-'+String(incidentSeq).padStart(4,'0'); }
function nextEquipmentId(location,category){
  const loc = LOCATION_CODE[location]||'GEN', cat = CATEGORY_CODE[category]||'EQ';
  const prefix = `EMS-${loc}-${cat}-`;
  const n = DB.equipment.filter(e=>e.id.startsWith(prefix)).length + 1;
  return prefix+String(n).padStart(3,'0');
}

/* ---------- date / format helpers ---------- */
function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function daysBetween(a,b){ return Math.round((b-a)/86400000); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
const NOW = new Date();

/* ============================================================
   RISK ENGINE
   Score 0–100 from current state, history, age, maintenance, and
   condition. Incident history decays over time so old resolved
   problems remain visible without permanently dominating the score.
   ============================================================ */
function getIncidentsFor(equipId){ return DB.incidents.filter(i=>i.equipmentId===equipId); }
function calcRisk(equip){
  const related = getIncidentsFor(equip.id);
  const statusScore = {Operational:0,'Under Repair':18,Damaged:25,Missing:25,Decommissioned:0}[equip.status]||0;

  const priorityWeight = {Low:1,Medium:3,High:6,Critical:8};
  const categoryCounts = {};
  related.forEach(i=>{ categoryCounts[i.category]=(categoryCounts[i.category]||0)+1; });
  const incidentScore = Math.min(related.reduce((score,incident)=>{
    const incidentDate = new Date(`${incident.dateReported}T00:00:00`);
    const ageDays = Math.max(0, (NOW-incidentDate)/86400000);
    const recencyWeight = ageDays<=180 ? 1 : ageDays<=365 ? .6 : ageDays<=730 ? .3 : .1;
    const stateWeight = incident.status==='Pending'||incident.status==='In Progress' ? 1.25 : incident.status==='Rejected' ? .25 : .5;
    const repeatWeight = categoryCounts[incident.category]>1 ? 2 : 0;
    const unresolvedWeight = incident.status==='Pending'||incident.status==='In Progress' ? 3 : 0;
    return score + ((priorityWeight[incident.priority]||3) * stateWeight + repeatWeight + unresolvedWeight) * recencyWeight;
  },0),35);

  const ageYears = (NOW - new Date(equip.dateAcquired)) / (365.25*86400000);
  const ageScore = Math.min(Math.max(ageYears,0)*1.5, 15);

  const daysSinceMaint = (NOW - new Date(equip.lastMaintenance)) / 86400000;
  const maintScore = daysSinceMaint<=90 ? 0 : daysSinceMaint<=180 ? 5 : daysSinceMaint<=365 ? 10 : 15;

  const conditionScore = {New:0,Good:2,Fair:6,Poor:10}[equip.condition]||0;

  const total = Math.round(Math.min(statusScore+incidentScore+ageScore+maintScore+conditionScore,100));
  return total;
}
function riskBand(score){
  if(score>=75) return {label:'Critical',color:'red',hex:'#c1443c'};
  if(score>=50) return {label:'High',color:'amber',hex:'#df9f34'};
  if(score>=25) return {label:'Medium',color:'blue',hex:'#3f6fb0'};
  return {label:'Low',color:'teal',hex:'#2f8f7f'};
}
function riskBar(score){
  const band = riskBand(score);
  return `<div style="min-width:96px"><div class="risk-track"><div class="risk-fill" style="width:${score}%;background:${band.hex}"></div></div>
    <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-500);margin-top:4px">${score}/100 · ${band.label}</div></div>`;
}

/* ---------- status → badge helper ---------- */
const STATUS_BADGE = {
  'Operational':'teal','Under Repair':'amber','Damaged':'red','Missing':'red','Decommissioned':'grey',
  'Pending':'amber','In Progress':'blue','Resolved':'teal','Rejected':'grey',
  'Low':'teal','Medium':'blue','High':'amber','Critical':'red',
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
  const total = segments.reduce((s,d)=>s+d.value,0) || 1;
  let offset=0, circles='';
  segments.filter(s=>s.value>0).forEach(seg=>{
    const frac = seg.value/total, len = frac*c;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.hex}" stroke-width="${stroke}" stroke-dasharray="${len.toFixed(2)} ${(c-len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ebe9e2" stroke-width="${stroke}"/>
    ${circles}
    <text x="${cx}" y="${cy-3}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="24" font-weight="700" fill="#181a1f">${total}</text>
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
function toast(msg,type='good'){
  const root = $('#toast-root');
  const t = document.createElement('div');
  t.className = `toast t-${type==='good'?'good':type==='bad'?'bad':'info'}`;
  t.innerHTML = `<i></i><span>${esc(msg)}</span>`;
  root.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .25s'; t.style.opacity='0'; setTimeout(()=>t.remove(),250); },2600);
}
function openModal(html,{wide=false}={}){
  const panel = $('#modal-panel');
  panel.className = 'modal-panel'+(wide?' modal-wide':'');
  panel.innerHTML = html;
  $('#modal-root').classList.add('open');
}
function closeModal(){ $('#modal-root').classList.remove('open'); $('#modal-panel').innerHTML=''; }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

/* ---------- CSV export ---------- */
function exportCSV(rows,columns,filename){
  const head = columns.map(c=>`"${c.label.replace(/"/g,'""')}"`).join(',');
  const body = rows.map(r=>columns.map(c=>`"${String(c.get(r)??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([head+'\n'+body],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },200);
  toast(`Exported ${filename}`,'good');
}

/* ============================================================
   APP STATE
   ============================================================ */
const state = {
  user:null,
  loginRole:'admin',
  view:null,
  presetEquipId:null,
  filters:{ equipSearch:'',equipCategory:'all',equipStatus:'all', incSearch:'',incStatus:'all' },
};

/* ============================================================
   AUTH + MULTI-PAGE NAVIGATION
   ============================================================ */
function setLoginRole(role){
  state.loginRole = role;
  $$('#role-switch button').forEach(b=>b.classList.toggle('active',b.dataset.role===role));
  $('#li-username').placeholder = role==='admin' ? 'e.g. admin.tech' : 'e.g. jdelacruz';
  $('#login-error').style.display='none';
}
function fillDemo(role){
  setLoginRole(role);
  const u = DB.users.find(x=>x.role===role);
  if(!u) return;
  $('#li-username').value = u.username;
  $('#li-password').value = u.password;
}
async function handleLogin(e){
  e.preventDefault();
  const u = $('#li-username').value.trim();
  const p = $('#li-password').value;

  try {
    const response = await apiRequest('login.php', {
      method: 'POST',
      body: JSON.stringify({ username: u, password: p })
    });

    if (!response.success || !response.user) {
      $('#login-error').style.display='flex';
      return;
    }

    const found = response.user;
    if (found.role !== state.loginRole) {
      $('#login-error').style.display='flex';
      return;
    }

    setSessionUser(found);
    window.location.href = PAGE_MAP.dashboard;
  } catch (err) {
    const fallbackUser = DB.users.find(x => x.username.toLowerCase() === u.toLowerCase() && x.password === p && x.role === state.loginRole);
    if (!fallbackUser) {
      $('#login-error').style.display='flex';
      return;
    }
    setSessionUser(fallbackUser);
    window.location.href = PAGE_MAP.dashboard;
  }
}
function logout(){
  clearSession();
  state.view=null;
  state.presetEquipId=null;
  try{ sessionStorage.removeItem(PRESET_KEY); }catch(err){}
  window.location.href='index.html';
}

const NAV = {
  admin:[
    {id:'dashboard',label:'Dashboard',icon:'grid'},
    {id:'equipment',label:'Equipment Inventory',icon:'box'},
    {id:'incidents',label:'Incident Reports',icon:'flag',badge:()=>DB.incidents.filter(i=>i.status==='Pending').length},
    {id:'report',label:'Report an Issue',icon:'flag'},
    {id:'risk',label:'Risk Analytics',icon:'activity'},
    {id:'reports',label:'Reports & Export',icon:'file'},
  ],
  student:[
    {id:'dashboard',label:'Dashboard',icon:'grid'},
    {id:'browse',label:'Browse Equipment',icon:'box'},
    {id:'report',label:'Report an Issue',icon:'flag'},
    {id:'myreports',label:'My Reports',icon:'list'},
  ],
};
const TITLES = {
  dashboard:['Overview','Dashboard'],
  equipment:['ICT Resources','Equipment Inventory'],
  incidents:['Service Desk','Incident Reports'],
  risk:['Predictive Maintenance','Risk Analytics'],
  reports:['Documentation','Reports & Export'],
  browse:['ICT Resources','Browse Equipment'],
  report:['Service Desk','Report an Issue'],
  myreports:['Service Desk','My Reports'],
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
      <div class="mark">ICT</div>
      <div><div class="name">ICTRAX</div><div class="sub">CEU MALOLOS · ICT</div></div>
    </div>
    <div class="nav-section-label">${role==='admin'?'Laboratory Control':'My Workspace'}</div>
    ${navHtml}
    <div class="side-foot">
      <div class="user-chip">
        <div class="avatar">${state.user.initials}</div>
        <div class="who"><div class="n">${esc(state.user.name)}</div><div class="r">${role==='admin'?esc(state.user.title):esc(state.user.course||'Student')}</div></div>
      </div>
      <button class="btn btn-outline btn-sm btn-block" onclick="logout()">${icon('logout')} <span class="label-text">Sign out</span></button>
    </div>`;
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
function startClock(){
  function tick(){
    const el = $('#live-clock');
    if(!el) return;
    const d = new Date();
    el.textContent = d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' · '+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  }
  tick();
  setInterval(tick,30000);
}

/* ============================================================
   Part 2 — shared UI fragments, admin views, student views,
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

/* ============================================================
   ADMIN — Dashboard
   ============================================================ */
function renderAdminDashboard(){
  const eq = DB.equipment;
  const total = eq.length;
  const byStatus = {};
  eq.forEach(e=>{ byStatus[e.status]=(byStatus[e.status]||0)+1; });
  const operational = byStatus['Operational']||0;
  const pending = DB.incidents.filter(i=>i.status==='Pending').length;
  const inProgress = DB.incidents.filter(i=>i.status==='In Progress').length;
  const risks = eq.map(e=>({e,score:calcRisk(e)})).sort((a,b)=>b.score-a.score);
  const elevated = risks.filter(r=>r.score>=50).length;

  const donut = donutSVG([
    {label:'Operational',value:byStatus['Operational']||0,hex:'#2f8f7f'},
    {label:'Under Repair',value:byStatus['Under Repair']||0,hex:'#df9f34'},
    {label:'Damaged',value:byStatus['Damaged']||0,hex:'#c1443c'},
    {label:'Missing',value:byStatus['Missing']||0,hex:'#9c332c'},
    {label:'Decommissioned',value:byStatus['Decommissioned']||0,hex:'#93959c'},
  ]);

  const monthBuckets=[];
  for(let i=5;i>=0;i--){
    const d = new Date(NOW.getFullYear(),NOW.getMonth()-i,1);
    monthBuckets.push({key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),label:d.toLocaleDateString('en-US',{month:'short'})});
  }
  const monthData = monthBuckets.map(mb=>({label:mb.label,value:DB.incidents.filter(i=>i.dateReported.startsWith(mb.key)).length,hex:'#3f6fb0'}));
  const recent = [...DB.incidents].sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported)).slice(0,5);

  return `<div class="view">
    <div class="stat-grid">
      ${statCard('box','Total Equipment',total,`${operational} operational`,'teal')}
      ${statCard('flag','Pending Incidents',pending,`${inProgress} in progress`,pending>0?'amber':'teal')}
      ${statCard('activity','Elevated Risk Units',elevated,'High or Critical band','red')}
      ${statCard('check','Fleet Availability',(total?Math.round(operational/total*100):0)+'%','currently operational','teal')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><div><h3>Equipment Status</h3><div class="sub">Live distribution across ${total} tagged units</div></div></div>
        <div class="card-body" style="display:flex;gap:26px;align-items:center;flex-wrap:wrap">
          ${donut}
          <div style="flex:1;min-width:180px">
            ${legendRow('#2f8f7f','Operational',byStatus['Operational']||0)}
            ${legendRow('#df9f34','Under Repair',byStatus['Under Repair']||0)}
            ${legendRow('#c1443c','Damaged',byStatus['Damaged']||0)}
            ${legendRow('#9c332c','Missing',byStatus['Missing']||0)}
            ${legendRow('#93959c','Decommissioned',byStatus['Decommissioned']||0)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Top At-Risk Equipment</h3><div class="sub">Weighted risk score, highest first</div></div>
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
        <div class="card-head"><div><h3>Incident Reports — Last 6 Months</h3><div class="sub">Submitted by students and faculty</div></div></div>
        <div class="card-body">${barSVG(monthData)}</div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Recent Reports</h3><div class="sub">Latest submissions</div></div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('incidents')">View all ${icon('chevron')}</button>
        </div>
        <div class="card-body flush">
          ${recent.length===0?emptyState('inbox','No reports yet','Incident reports will appear here as they come in.'):
          `<div class="table-wrap"><table class="dtable"><tbody>
          ${recent.map(i=>{
            const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
            return `<tr style="cursor:pointer" onclick="openIncidentModal('${i.id}')">
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
function renderEquipmentView(){
  const f = state.filters;
  const rows = DB.equipment.filter(e=>{
    if(f.equipCategory!=='all' && e.category!==f.equipCategory) return false;
    if(f.equipStatus!=='all' && e.status!==f.equipStatus) return false;
    if(f.equipSearch){
      const q=f.equipSearch.toLowerCase();
      if(!(e.name.toLowerCase().includes(q)||e.id.toLowerCase().includes(q)||e.location.toLowerCase().includes(q)||e.serial.toLowerCase().includes(q))) return false;
    }
    return true;
  });
  const categories=[...new Set(DB.equipment.map(e=>e.category))];
  const statuses=['Operational','Under Repair','Damaged','Missing','Decommissioned'];

  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input type="text" placeholder="Search by name, tag ID, or location…" value="${esc(f.equipSearch)}" oninput="onEquipSearch(this.value)"></div>
        <select class="select-filter" onchange="onEquipFilter('equipCategory',this.value)">
          <option value="all">All categories</option>
          ${categories.map(c=>`<option value="${c}" ${f.equipCategory===c?'selected':''}>${c}</option>`).join('')}
        </select>
        <select class="select-filter" onchange="onEquipFilter('equipStatus',this.value)">
          <option value="all">All statuses</option>
          ${statuses.map(s=>`<option value="${s}" ${f.equipStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="openEquipmentForm()">${icon('plus')} Add Equipment</button>
    </div>

    <div class="card"><div class="card-body flush">
      <div class="table-wrap"><table class="dtable">
        <thead><tr><th>Tag ID</th><th>Equipment</th><th>Location</th><th>Status</th><th>Risk</th><th>Last Maintenance</th><th></th></tr></thead>
        <tbody>
        ${rows.map(e=>{
          const score = calcRisk(e);
          return `<tr>
            <td>${tagChip(e.id)}</td>
            <td><div class="cell-strong" style="display:flex;align-items:center;gap:9px">${icon(CATEGORY_ICON[e.category]||'box')} ${esc(e.name)}</div><div class="cell-sub">${esc(e.category)} · ${esc(e.serial)}</div></td>
            <td>${esc(e.location)}</td>
            <td>${badge(e.status)}</td>
            <td>${riskBar(score)}</td>
            <td>${fmtDate(e.lastMaintenance)}</td>
            <td><div class="row-actions">
              <button class="icon-btn" title="View QR tag" onclick="openQrModal('${e.id}')">${icon('qrcode')}</button>
              <button class="icon-btn" title="Edit" onclick="openEquipmentForm('${e.id}')">${icon('edit')}</button>
              <button class="icon-btn" title="Delete" onclick="confirmDeleteEquipment('${e.id}')">${icon('trash')}</button>
            </div></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div>
      ${rows.length===0?emptyState('inbox','No equipment found','Try clearing filters, or add a new unit to the inventory.'):''}
    </div></div>
  </div>`;
}
function onEquipSearch(v){ state.filters.equipSearch=v; $('#view-root').innerHTML=renderEquipmentView(); const inp=$('.search-box input'); if(inp){inp.focus();inp.setSelectionRange(v.length,v.length);} }
function onEquipFilter(key,val){ state.filters[key]=val; $('#view-root').innerHTML=renderEquipmentView(); }

function openEquipmentForm(id){
  const editing = !!id;
  const e = editing ? DB.equipment.find(x=>x.id===id) : null;
  const categories = Object.keys(CATEGORY_ICON);
  openModal(`
    <div class="modal-head">
      <div><h3>${editing?'Edit Equipment':'Add Equipment'}</h3><div class="modal-sub">${editing?e.id:'A new tag ID is generated automatically'}</div></div>
      <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
    </div>
    <form onsubmit="submitEquipmentForm(event,'${editing?id:''}')">
      <div class="modal-body">
        <div class="field"><label>Equipment Name</label><input type="text" id="f-name" required value="${editing?esc(e.name):''}" placeholder="e.g. Desktop Computer"></div>
        <div class="field-row">
          <div class="field"><label>Category</label><select id="f-category" required>
            ${categories.map(c=>`<option value="${c}" ${editing&&e.category===c?'selected':''}>${c}</option>`).join('')}
          </select></div>
          <div class="field"><label>Location</label><select id="f-location" required>
            ${LOCATIONS.map(l=>`<option value="${l}" ${editing&&e.location===l?'selected':''}>${l}</option>`).join('')}
          </select></div>
        </div>
        <div class="field"><label>Serial Number</label><input type="text" id="f-serial" required value="${editing?esc(e.serial):''}" placeholder="e.g. CEU-CL1-PC-107"></div>
        <div class="field-row">
          <div class="field"><label>Status</label><select id="f-status" required>
            ${['Operational','Under Repair','Damaged','Missing','Decommissioned'].map(s=>`<option ${editing&&e.status===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
          <div class="field"><label>Condition</label><select id="f-condition" required>
            ${['New','Good','Fair','Poor'].map(s=>`<option ${editing&&e.condition===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Date Acquired</label><input type="date" id="f-acquired" required value="${editing?e.dateAcquired:''}"></div>
          <div class="field"><label>Last Maintenance</label><input type="date" id="f-maint" required value="${editing?e.lastMaintenance:todayISO()}"></div>
        </div>
        <div class="field"><label>Notes</label><textarea id="f-notes" rows="3" placeholder="Optional remarks…">${editing?esc(e.notes||''):''}</textarea></div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${editing?'Save Changes':'Add Equipment'}</button>
      </div>
    </form>`);
}
async function submitEquipmentForm(e,id){
  e.preventDefault();
  const data = {
    name:$('#f-name').value.trim(), category:$('#f-category').value, location:$('#f-location').value,
    serial:$('#f-serial').value.trim(), status:$('#f-status').value, condition:$('#f-condition').value,
    dateAcquired:$('#f-acquired').value, lastMaintenance:$('#f-maint').value, notes:$('#f-notes').value.trim(),
  };
  if(id){
    try {
      const response = await apiRequest('equipment.php', {
        method:'PUT',
        body:JSON.stringify({id,...data}),
      });
      if (!response.success || !response.data) throw new Error(response.message || 'Unable to update equipment');
      Object.assign(DB.equipment.find(x=>x.id===id),response.data);
    } catch (err) {
      console.error('ICTRAX: remote equipment update failed.', err);
      toast('Equipment was not updated in the database','bad');
      return;
    }
    toast(`${data.name} updated`,'good');
  } else {
    const newId = nextEquipmentId(data.location,data.category);
    const equipment = {id:newId,...data};
    try {
      const response = await apiRequest('equipment.php', {
        method:'POST',
        body:JSON.stringify(equipment),
      });
      if (!response.success || !response.data) throw new Error(response.message || 'Unable to add equipment');
      DB.equipment.push(response.data);
    } catch (err) {
      console.error('ICTRAX: remote equipment save failed.', err);
      toast('Equipment was not saved to the database','bad');
      return;
    }
    toast(`${data.name} added as ${newId}`,'good');
  }
  saveDb();
  closeModal();
  navigate('equipment');
}
function confirmDeleteEquipment(id){
  const e = DB.equipment.find(x=>x.id===id);
  openModal(`
    <div class="modal-head"><div><h3>Remove equipment?</h3><div class="modal-sub">This cannot be undone.</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body"><div class="banner banner-amber">${icon('alert')}<div>You're about to remove <strong>${esc(e.name)}</strong> (${e.id}) from the inventory. Linked incident history is kept for records.</div></div></div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="deleteEquipment('${id}')">${icon('trash')} Remove</button>
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
function openQrModal(id){
  const e = DB.equipment.find(x=>x.id===id);
  openModal(`
    <div class="modal-head"><div><h3>Equipment Tag</h3><div class="modal-sub">Printable identifier for physical labeling</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body">
      <div class="qr-tag-card">
        <div class="qr-pattern">${qrPatternSVG(e.id)}</div>
        <div class="qr-meta">
          <div class="qm-name">${esc(e.name)}</div>
          <div class="qm-id">${e.id}</div>
          <div class="kv-list">
            <div class="kv-row"><span class="k">Location</span><span class="v">${esc(e.location)}</span></div>
            <div class="kv-row"><span class="k">Serial No.</span><span class="v">${esc(e.serial)}</span></div>
            <div class="kv-row"><span class="k">Status</span><span class="v">${badge(e.status)}</span></div>
          </div>
        </div>
      </div>
      <p class="hint" style="margin-top:12px">Scanning this tag on the deployed system opens the equipment's record and a one-tap incident report, once QR generation is wired to the backend.</p>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-dark" onclick="window.print()">${icon('printer')} Print Tag</button>
    </div>`);
}

/* ============================================================
   ADMIN — Incident Reports
   ============================================================ */
function renderIncidentsView(){
  const f = state.filters;
  const rows = DB.incidents.filter(i=>{
    if(f.incStatus!=='all' && i.status!==f.incStatus) return false;
    if(f.incSearch){
      const q=f.incSearch.toLowerCase();
      const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
      if(!(i.id.toLowerCase().includes(q)||i.reportedByName.toLowerCase().includes(q)||(eqp&&eqp.name.toLowerCase().includes(q)))) return false;
    }
    return true;
  }).sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported));
  const statuses=['Pending','In Progress','Resolved','Rejected'];

  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input type="text" placeholder="Search by reporter, equipment, or ID…" value="${esc(f.incSearch)}" oninput="onIncSearch(this.value)"></div>
        <select class="select-filter" onchange="onIncFilter(this.value)">
          <option value="all">All statuses</option>
          ${statuses.map(s=>`<option ${f.incStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="card"><div class="card-body flush">
      <div class="table-wrap"><table class="dtable">
        <thead><tr><th>Report</th><th>Equipment</th><th>Reported By</th><th>Date</th><th>Category</th><th>Priority</th><th>Status</th><th></th></tr></thead>
        <tbody>
        ${rows.map(i=>{
          const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
          return `<tr>
            <td>${tagChip(i.id)}</td>
            <td><div class="cell-strong">${eqp?esc(eqp.name):'—'}</div><div class="cell-sub">${eqp?eqp.id:''}</div></td>
            <td>${esc(i.reportedByName)}<div class="cell-sub">${esc(i.reportedByCourse||'')}</div></td>
            <td>${fmtDate(i.dateReported)}</td>
            <td>${esc(i.category)}</td>
            <td>${badge(i.priority)}</td>
            <td>${badge(i.status)}</td>
            <td><button class="icon-btn" title="Open" onclick="openIncidentModal('${i.id}')">${icon('eye')}</button></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div>
      ${rows.length===0?emptyState('inbox','No incident reports','Nothing matches these filters yet.'):''}
    </div></div>
  </div>`;
}
function onIncSearch(v){ state.filters.incSearch=v; $('#view-root').innerHTML=renderIncidentsView(); const inp=$('.search-box input'); if(inp){inp.focus();inp.setSelectionRange(v.length,v.length);} }
function onIncFilter(v){ state.filters.incStatus=v; $('#view-root').innerHTML=renderIncidentsView(); }

function openIncidentModal(id){
  const i = DB.incidents.find(x=>x.id===id);
  const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
  const isAdmin = state.user.role==='admin';
  openModal(`
    <div class="modal-head">
      <div><h3>${i.id}</h3><div class="modal-sub">Filed ${fmtDate(i.dateReported)} by ${esc(i.reportedByName)}</div></div>
      <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
    </div>
    <div class="modal-body">
      <div class="kv-list" style="margin-bottom:16px">
        <div class="kv-row"><span class="k">Equipment</span><span class="v">${eqp?esc(eqp.name)+' · '+eqp.id:'—'}</span></div>
        <div class="kv-row"><span class="k">Location</span><span class="v">${eqp?esc(eqp.location):'—'}</span></div>
        <div class="kv-row"><span class="k">Category</span><span class="v">${esc(i.category)}</span></div>
        <div class="kv-row"><span class="k">Status</span><span class="v">${badge(i.status)}</span></div>
        <div class="kv-row"><span class="k">Priority</span><span class="v">${badge(i.priority)}</span></div>
      </div>
      <div class="field"><label>Description</label>
        <div style="background:var(--surface-sunk);border-radius:8px;padding:12px 14px;font-size:13.5px;color:var(--text-700)">${esc(i.description)}</div>
      </div>
      ${isAdmin?`
      <div class="divider-label">Admin Action</div>
      <div class="field-row">
        <div class="field"><label>Update Status</label><select id="ui-status">
          ${['Pending','In Progress','Resolved','Rejected'].map(s=>`<option ${i.status===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
        <div class="field"><label>Priority</label><select id="ui-priority">
          ${['Low','Medium','High','Critical'].map(s=>`<option ${i.priority===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
      </div>
      <div class="field"><label>Remarks / Resolution Notes</label><textarea id="ui-remarks" rows="3" placeholder="e.g. Replaced faulty power cable…">${esc(i.remarks||'')}</textarea></div>`
      :`${i.remarks?`<div class="field"><label>Technician Remarks</label><div style="background:var(--teal-tint);border-radius:8px;padding:12px 14px;font-size:13.5px;color:var(--teal-dark)">${esc(i.remarks)}</div></div>`:''}`}
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      ${isAdmin?`<button class="btn btn-danger" onclick="deleteIncident('${i.id}')">${icon('trash')} Delete</button><button class="btn btn-primary" onclick="saveIncidentUpdate('${i.id}')">${icon('check')} Save Update</button>`:''}
    </div>`);
}
async function saveIncidentUpdate(id){
  const i = DB.incidents.find(x=>x.id===id);
  const update = {
    id,
    status:$('#ui-status').value,
    priority:$('#ui-priority').value,
    remarks:$('#ui-remarks').value.trim(),
    resolvedDate:(($('#ui-status').value==='Resolved'||$('#ui-status').value==='Rejected') ? (i.resolvedDate||todayISO()) : null),
  };
  try {
    const response = await apiRequest('incidents.php', {
      method:'PUT',
      body:JSON.stringify(update),
    });
    if (!response.success || !response.data) throw new Error(response.message || 'Unable to update incident');
    Object.assign(i,response.data);
  } catch (err) {
    console.error('ICTRAX: remote incident update failed.', err);
    toast('Incident was not updated in the database','bad');
    return;
  }
  saveDb();
  closeModal();
  toast(`${id} updated to ${i.status}`,'good');
  navigate(state.view);
}
async function deleteIncident(id){
  if(!window.confirm(`Delete ${id}? This cannot be undone.`)) return;
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
function renderRiskView(){
  const risks = DB.equipment.filter(e=>e.status!=='Decommissioned').map(e=>({e,score:calcRisk(e)})).sort((a,b)=>b.score-a.score);
  const bands = {Critical:0,High:0,Medium:0,Low:0};
  risks.forEach(r=>bands[riskBand(r.score).label]++);
  const barData=[
    {label:'Low',value:bands.Low,hex:'#2f8f7f'},{label:'Medium',value:bands.Medium,hex:'#3f6fb0'},
    {label:'High',value:bands.High,hex:'#df9f34'},{label:'Critical',value:bands.Critical,hex:'#c1443c'},
  ];
  return `<div class="view">
    <div class="banner banner-amber">${icon('activity')}<div><strong>How this is calculated.</strong> Each unit's score blends current status (≤25 pts), incident history with recency and priority (≤35 pts), equipment age (≤15 pts), maintenance staleness (≤15 pts), and condition (≤10 pts) into a 0–100 index.</div></div>

    <div class="grid-2">
      <div class="card"><div class="card-head"><div><h3>Risk Distribution</h3><div class="sub">${risks.length} active units evaluated</div></div></div>
        <div class="card-body">${barSVG(barData)}</div></div>
      <div class="card"><div class="card-head"><div><h3>Maintenance Guidance</h3><div class="sub">Suggested response by band</div></div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
          ${guidanceRow('red','Critical','Schedule service within 48 hours; consider taking offline.')}
          ${guidanceRow('amber','High',"Prioritize in this week's maintenance round.")}
          ${guidanceRow('blue','Medium','Monitor; include in the next routine inspection.')}
          ${guidanceRow('teal','Low','No action needed — healthy.')}
        </div></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-head"><div><h3>Equipment Risk Ranking</h3><div class="sub">Highest score first</div></div></div>
      <div class="card-body flush"><div class="table-wrap"><table class="dtable">
        <thead><tr><th>Tag ID</th><th>Equipment</th><th>Status</th><th>Age</th><th>Last Maintenance</th><th>Risk Score</th></tr></thead>
        <tbody>
        ${risks.map(r=>{
          const ageYears = ((NOW-new Date(r.e.dateAcquired))/(365.25*86400000)).toFixed(1);
          return `<tr>
            <td>${tagChip(r.e.id)}</td>
            <td><div class="cell-strong">${esc(r.e.name)}</div><div class="cell-sub">${esc(r.e.location)}</div></td>
            <td>${badge(r.e.status)}</td>
            <td>${ageYears} yrs</td>
            <td>${fmtDate(r.e.lastMaintenance)}</td>
            <td>${riskBar(r.score)}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div></div>
    </div>
  </div>`;
}

/* ============================================================
   ADMIN — Reports & Export
   ============================================================ */
function renderReportsView(){
  const eq = DB.equipment, inc = DB.incidents;
  return `<div class="view">
    <div class="banner banner-teal">${icon('file')}<div>Reports reflect the current inventory and incident log. Use <strong>Export CSV</strong> for spreadsheet analysis, or <strong>Print</strong> for a signed physical or PDF copy.</div></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><div><h3>Equipment Inventory Report</h3><div class="sub">${eq.length} records</div></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="exportEquipmentCSV()">${icon('download')} CSV</button>
            <button class="btn btn-dark btn-sm" onclick="printReport('equipment')">${icon('printer')} Print</button>
          </div>
        </div>
        <div class="card-body"><div class="kv-list">
          <div class="kv-row"><span class="k">Total tagged units</span><span class="v">${eq.length}</span></div>
          <div class="kv-row"><span class="k">Operational</span><span class="v">${eq.filter(e=>e.status==='Operational').length}</span></div>
          <div class="kv-row"><span class="k">Needs attention</span><span class="v">${eq.filter(e=>['Under Repair','Damaged','Missing'].includes(e.status)).length}</span></div>
          <div class="kv-row"><span class="k">Decommissioned</span><span class="v">${eq.filter(e=>e.status==='Decommissioned').length}</span></div>
        </div></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Incident Summary Report</h3><div class="sub">${inc.length} records</div></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="exportIncidentsCSV()">${icon('download')} CSV</button>
            <button class="btn btn-dark btn-sm" onclick="printReport('incidents')">${icon('printer')} Print</button>
          </div>
        </div>
        <div class="card-body"><div class="kv-list">
          <div class="kv-row"><span class="k">Pending</span><span class="v">${inc.filter(i=>i.status==='Pending').length}</span></div>
          <div class="kv-row"><span class="k">In Progress</span><span class="v">${inc.filter(i=>i.status==='In Progress').length}</span></div>
          <div class="kv-row"><span class="k">Resolved</span><span class="v">${inc.filter(i=>i.status==='Resolved').length}</span></div>
          <div class="kv-row"><span class="k">Rejected</span><span class="v">${inc.filter(i=>i.status==='Rejected').length}</span></div>
        </div></div>
      </div>
    </div>
    <div id="print-area" class="hidden"></div>
  </div>`;
}
function exportEquipmentCSV(){
  exportCSV(DB.equipment,[
    {label:'Tag ID',get:r=>r.id},{label:'Name',get:r=>r.name},{label:'Category',get:r=>r.category},
    {label:'Location',get:r=>r.location},{label:'Serial',get:r=>r.serial},{label:'Status',get:r=>r.status},
    {label:'Condition',get:r=>r.condition},{label:'Date Acquired',get:r=>r.dateAcquired},{label:'Last Maintenance',get:r=>r.lastMaintenance},
    {label:'Risk Score',get:r=>calcRisk(r)},
  ],'EMS_Equipment_Inventory.csv');
}
function exportIncidentsCSV(){
  exportCSV(DB.incidents,[
    {label:'Report ID',get:r=>r.id},{label:'Equipment',get:r=>{const e=DB.equipment.find(x=>x.id===r.equipmentId);return e?e.name:'';}},
    {label:'Equipment Tag',get:r=>r.equipmentId},{label:'Reported By',get:r=>r.reportedByName},{label:'Date Reported',get:r=>r.dateReported},
    {label:'Category',get:r=>r.category},{label:'Priority',get:r=>r.priority},{label:'Status',get:r=>r.status},{label:'Remarks',get:r=>r.remarks},
  ],'EMS_Incident_Reports.csv');
}
function printReport(kind){
  const eq=DB.equipment, inc=DB.incidents;
  let title, tableHtml;
  if(kind==='equipment'){
    title='Equipment Inventory Report';
    tableHtml = `<table class="dtable" style="width:100%"><thead><tr><th>Tag ID</th><th>Name</th><th>Location</th><th>Status</th><th>Condition</th><th>Acquired</th><th>Last Maint.</th><th>Risk</th></tr></thead><tbody>
      ${eq.map(e=>`<tr><td>${e.id}</td><td>${esc(e.name)}</td><td>${esc(e.location)}</td><td>${e.status}</td><td>${e.condition}</td><td>${fmtDate(e.dateAcquired)}</td><td>${fmtDate(e.lastMaintenance)}</td><td>${calcRisk(e)}</td></tr>`).join('')}
    </tbody></table>`;
  } else {
    title='Incident Summary Report';
    tableHtml = `<table class="dtable" style="width:100%"><thead><tr><th>Report ID</th><th>Equipment</th><th>Reported By</th><th>Date</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead><tbody>
      ${inc.map(i=>{const e=DB.equipment.find(x=>x.id===i.equipmentId);return `<tr><td>${i.id}</td><td>${e?esc(e.name):''}</td><td>${esc(i.reportedByName)}</td><td>${fmtDate(i.dateReported)}</td><td>${i.category}</td><td>${i.priority}</td><td>${i.status}</td></tr>`;}).join('')}
    </tbody></table>`;
  }
  const area = $('#print-area');
  area.innerHTML = `<div style="padding:26px 4px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #14181f;padding-bottom:14px;margin-bottom:18px">
        <div><div class="eyebrow" style="margin-bottom:6px">CEU MALOLOS · ICT RESOURCES</div><h2 style="font-size:22px">${title}</h2></div>
        <div style="text-align:right;font-family:var(--font-mono);font-size:11.5px;color:var(--text-500)">Generated ${fmtDate(todayISO())}</div>
      </div>
      ${tableHtml}
      <div style="display:flex;justify-content:space-between;margin-top:50px;font-size:12.5px">
        <div>Prepared by: ____________________<br><span style="color:var(--text-500)">ICT Laboratory Technician</span></div>
        <div>Noted by: ____________________<br><span style="color:var(--text-500)">ICT Department Head</span></div>
      </div>
    </div>`;
  $$('.view > *').forEach(el=>{ if(el.id!=='print-area') el.classList.add('no-print'); });
  area.classList.remove('hidden');
  setTimeout(()=>window.print(),80);
}

/* ============================================================
   STUDENT — Dashboard
   ============================================================ */
function renderStudentDashboard(){
  const u = state.user;
  const myReports = DB.incidents.filter(i=>String(i.reportedByUserId)===String(u.id));
  const openCount = myReports.filter(i=>i.status==='Pending'||i.status==='In Progress').length;
  const resolved = myReports.filter(i=>i.status==='Resolved').length;
  const available = DB.equipment.filter(e=>e.status==='Operational').length;

  return `<div class="view">
    <div class="banner banner-amber">${icon('shield')}<div>Welcome back, ${esc(u.name.split(' ')[0])}. Spotted a broken keyboard or a dead monitor? Report it in under a minute.</div></div>

    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      ${statCard('box','Operational Units',available,`out of ${DB.equipment.length} tagged in the lab`,'teal')}
      ${statCard('flag','My Open Reports',openCount,'awaiting resolution','amber')}
      ${statCard('check','My Resolved Reports',resolved,'closed out','teal')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><div><h3>Quick Actions</h3></div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-primary btn-block" onclick="navigate('report')">${icon('flag')} Report an Issue</button>
          <button class="btn btn-outline btn-block" onclick="navigate('browse')">${icon('box')} Browse Lab Equipment</button>
          <button class="btn btn-outline btn-block" onclick="navigate('myreports')">${icon('list')} Track My Reports</button>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>My Recent Reports</h3></div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('myreports')">View all ${icon('chevron')}</button>
        </div>
        <div class="card-body flush">
          ${myReports.length===0?emptyState('inbox','No reports yet','Anything wrong with the lab equipment? Let us know.'):
          `<div class="table-wrap"><table class="dtable"><tbody>
          ${[...myReports].sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported)).slice(0,4).map(i=>{
            const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
            return `<tr style="cursor:pointer" onclick="openIncidentModal('${i.id}')">
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
   STUDENT — Browse Equipment
   ============================================================ */
function renderBrowseView(){
  const f = state.filters;
  const rows = DB.equipment.filter(e=>{
    if(e.status==='Decommissioned') return false;
    if(f.equipCategory!=='all' && e.category!==f.equipCategory) return false;
    if(f.equipStatus!=='all' && e.status!==f.equipStatus) return false;
    if(f.equipSearch){
      const q=f.equipSearch.toLowerCase();
      if(!(e.name.toLowerCase().includes(q)||e.location.toLowerCase().includes(q))) return false;
    }
    return true;
  });
  const categories=[...new Set(DB.equipment.map(e=>e.category))];
  return `<div class="view">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${icon('search')}<input type="text" placeholder="Search equipment or lab…" value="${esc(f.equipSearch)}" oninput="onBrowseSearch(this.value)"></div>
        <select class="select-filter" onchange="onBrowseFilter('equipCategory',this.value)">
          <option value="all">All categories</option>
          ${categories.map(c=>`<option ${f.equipCategory===c?'selected':''}>${c}</option>`).join('')}
        </select>
        <select class="select-filter" onchange="onBrowseFilter('equipStatus',this.value)">
          <option value="all">All statuses</option>
          ${['Operational','Under Repair','Damaged','Missing'].map(s=>`<option ${f.equipStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="equip-grid">
      ${rows.map(e=>`
        <div class="equip-card">
          <div class="ec-top"><div class="ec-icon">${icon(CATEGORY_ICON[e.category]||'box')}</div>${badge(e.status)}</div>
          <div><div class="ec-name">${esc(e.name)}</div><div class="ec-loc">${icon('mappin')}${esc(e.location)}</div></div>
          <div class="ec-foot"><span class="tag-chip">${e.id}</span>
            <button class="btn btn-outline btn-sm" onclick="openEquipDetailModal('${e.id}')">View Tag</button>
          </div>
        </div>`).join('')}
    </div>
    ${rows.length===0?emptyState('inbox','No equipment found','Try a different search or filter.'):''}
  </div>`;
}
function onBrowseSearch(v){ state.filters.equipSearch=v; $('#view-root').innerHTML=renderBrowseView(); const inp=$('.search-box input'); if(inp){inp.focus();inp.setSelectionRange(v.length,v.length);} }
function onBrowseFilter(k,v){ state.filters[k]=v; $('#view-root').innerHTML=renderBrowseView(); }
function openEquipDetailModal(id){
  const e = DB.equipment.find(x=>x.id===id);
  openModal(`
    <div class="modal-head"><div><h3>${esc(e.name)}</h3><div class="modal-sub">${e.id}</div></div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="modal-body">
      <div class="qr-tag-card"><div class="qr-pattern">${qrPatternSVG(e.id,92)}</div>
        <div class="qr-meta"><div class="kv-list">
          <div class="kv-row"><span class="k">Location</span><span class="v">${esc(e.location)}</span></div>
          <div class="kv-row"><span class="k">Status</span><span class="v">${badge(e.status)}</span></div>
          <div class="kv-row"><span class="k">Condition</span><span class="v">${esc(e.condition)}</span></div>
        </div></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="closeModal();navigate('report',{presetEquipId:'${e.id}'})">${icon('flag')} Report an Issue</button>
    </div>`);
}

/* ============================================================
   STUDENT — Report an Issue
   ============================================================ */
function renderReportView(){
  let preset = state.presetEquipId;
  try{ if(!preset) preset = sessionStorage.getItem(PRESET_KEY) || null; }catch(err){}
  const u = state.user;
  return `<div class="view" style="max-width:640px">
    <div class="card">
      <div class="card-head"><div><h3>Report an Issue</h3><div class="sub">Tell us what's wrong — a technician will follow up.</div></div></div>
      <form onsubmit="submitIncidentForm(event)">
        <div class="card-body">
          <div class="field">
            <label>Equipment</label>
            <select id="rf-equip" required>
              <option value="">Select the affected equipment…</option>
              ${DB.equipment.filter(e=>e.status!=='Decommissioned').map(e=>`<option value="${e.id}" ${preset===e.id?'selected':''}>${e.name} — ${e.id} (${e.location})</option>`).join('')}
            </select>
            <div class="hint">Can't find it? Check the tag printed on the unit, or ask lab staff.</div>
          </div>
          <div class="field-row">
            <div class="field"><label>Issue Type</label><select id="rf-category" required>
              ${['Damaged','Malfunctioning','Missing','Other'].map(c=>`<option>${c}</option>`).join('')}
            </select></div>
            <div class="field"><label>Date Noticed</label><input type="date" id="rf-date" value="${todayISO()}" required></div>
          </div>
          <div class="field"><label>Description</label><textarea id="rf-desc" rows="4" required placeholder="What happened? Be as specific as you can — error messages, sounds, timing…"></textarea></div>
          <div class="field-row">
            <div class="field"><label>Your Name</label><input type="text" id="rf-name" value="${esc(u.name)}" required></div>
            <div class="field"><label>${u.role==='admin'?'Department / Unit':'Section / Course'}</label><input type="text" id="rf-course" value="${esc(u.course||'')}" ${u.role==='admin'?'':'required'}></div>
          </div>
        </div>
        <div class="modal-foot" style="border-top:1px solid var(--line)">
          <button type="button" class="btn btn-outline" onclick="navigate('dashboard')">Cancel</button>
          <button type="submit" class="btn btn-primary">${icon('flag')} Submit Report</button>
        </div>
      </form>
    </div>
  </div>`;
}
async function submitIncidentForm(e){
  e.preventDefault();
  const equipmentId = $('#rf-equip').value;
  if(!equipmentId){ toast('Please select the equipment first','bad'); return; }
  const rec = {
    id: nextIncidentId(), equipmentId, reportedByUserId: state.user.id,
    reportedByName: $('#rf-name').value.trim(), reportedByCourse: $('#rf-course').value.trim(),
    dateReported: $('#rf-date').value||todayISO(), category: $('#rf-category').value,
    description: $('#rf-desc').value.trim(), status:'Pending', priority:'Medium', remarks:'', resolvedDate:null,
  };
  try {
    const response = await apiRequest('incidents.php', {
      method:'POST',
      body:JSON.stringify(rec),
    });
    if (!response.success || !response.data) throw new Error(response.message || 'Unable to submit report');
    DB.incidents.push(response.data);
    rec.id = response.data.id;
  } catch (err) {
    console.error('ICTRAX: incident report was not saved.', err);
    toast('Report was not saved to the database','bad');
    return;
  }
  saveDb();
  state.presetEquipId = null;
  try{ sessionStorage.removeItem(PRESET_KEY); }catch(err){}
  toast(`Report ${rec.id} submitted`,'good');
  navigate('myreports');
}

/* ============================================================
   STUDENT — My Reports
   ============================================================ */
function renderMyReportsView(){
  const mine = DB.incidents.filter(i=>String(i.reportedByUserId)===String(state.user.id)).sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported));
  return `<div class="view">
    <div class="card"><div class="card-body flush">
    ${mine.length===0?emptyState('inbox','No reports submitted yet','Reports you file will show up here with live status updates.'):
    `<div class="table-wrap"><table class="dtable">
      <thead><tr><th>Report</th><th>Equipment</th><th>Date</th><th>Category</th><th>Status</th><th></th></tr></thead>
      <tbody>
      ${mine.map(i=>{
        const eqp = DB.equipment.find(e=>e.id===i.equipmentId);
        return `<tr>
          <td>${tagChip(i.id)}</td>
          <td><div class="cell-strong">${eqp?esc(eqp.name):'—'}</div><div class="cell-sub">${eqp?eqp.location:''}</div></td>
          <td>${fmtDate(i.dateReported)}</td>
          <td>${esc(i.category)}</td>
          <td>${badge(i.status)}</td>
          <td><button class="icon-btn" onclick="openIncidentModal('${i.id}')">${icon('eye')}</button></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>`}
    </div></div>
  </div>`;
}

/* ============================================================
   ROUTER TABLE
   ============================================================ */
const VIEWS = {
  dashboard:()=> state.user.role==='admin' ? renderAdminDashboard() : renderStudentDashboard(),
  equipment: renderEquipmentView,
  incidents: renderIncidentsView,
  risk: renderRiskView,
  reports: renderReportsView,
  browse: renderBrowseView,
  report: renderReportView,
  myreports: renderMyReportsView,
};

/* ============================================================
   INIT
   ============================================================ */
function initLoginVisual(){
  const picks = [
    {id:'EMS-CL1-DT-001',status:'Operational',top:'0px',left:'0px'},
    {id:'EMS-CL2-PRT-001',status:'Under Repair',top:'46px',left:'190px'},
    {id:'EMS-CL1-UPS-001',status:'Operational',top:'104px',left:'20px'},
    {id:'EMS-CL3-DT-004',status:'Missing',top:'8px',left:'330px'},
    {id:'EMS-CL2-DT-002',status:'Damaged',top:'140px',left:'250px'},
  ];
  const dotHex = {'Operational':'#2f8f7f','Under Repair':'#df9f34','Damaged':'#c1443c','Missing':'#c1443c'};
  const scatter = $('#tag-scatter');
  if(scatter){
    scatter.innerHTML = picks.map(p=>`<div class="floating-tag" style="top:${p.top};left:${p.left}"><i style="background:${dotHex[p.status]}"></i>${p.id}</div>`).join('');
  }
  const equipCount = $('#lv-stat-equip');
  if(equipCount) equipCount.textContent = DB.equipment.length;
}
window.addEventListener('DOMContentLoaded', async ()=>{
  await loadPersistedDb();

  if(currentPage()==='login'){
    const sessionUser = getSessionUser();
    if(sessionUser){ window.location.replace(PAGE_MAP.dashboard); return; }
    initLoginVisual();
    const a = DB.users.find(u=>u.role==='admin'), s = DB.users.find(u=>u.role==='student');
    if($('#demo-admin-cred') && a) $('#demo-admin-cred').textContent = a.username+' / '+a.password;
    if($('#demo-student-cred') && s) $('#demo-student-cred').textContent = s.username+' / '+s.password;
    return;
  }

  state.user = getSessionUser();
  if(!state.user){ window.location.replace('index.html'); return; }

  const page = currentPage();
  const allowedRoles = PAGE_ACCESS[page] || [];
  if(!allowedRoles.includes(state.user.role)){
    window.location.replace(PAGE_MAP.dashboard);
    return;
  }

  state.view = page;
  try{ state.presetEquipId = sessionStorage.getItem(PRESET_KEY) || null; }catch(err){}
  renderSidebar();
  const [crumb,title] = TITLES[page]||['',''];
  if($('#topbar-crumb')) $('#topbar-crumb').textContent = crumb;
  if($('#topbar-title')) $('#topbar-title').textContent = title;
  const renderFn = VIEWS[page];
  if($('#view-root')) $('#view-root').innerHTML = renderFn ? renderFn() : '';
  startClock();
  closeModal();
});
