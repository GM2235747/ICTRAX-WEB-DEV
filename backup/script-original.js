/* ============================================================
   EQUIPMENT MONITORING SYSTEM (EMS)
   CEU MALOLOS · ICT
   Frontend Demo / Database-Independent Version
   ============================================================ */

'use strict';

/* ============================================================
   HELPERS
   ============================================================ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const NOW = new Date();

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(date) {
  if (!date) return '—';

  const d = new Date(date + (String(date).length === 10 ? 'T00:00:00' : ''));

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

/* ============================================================
   ICON SYSTEM
   ============================================================ */

const ICONS = {
  grid: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>`,

  box: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z"/>
      <path d="M3.5 7.5 12 12l8.5-4.5"/>
      <path d="M12 12v9"/>
    </svg>`,

  flag: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M5 21V4"/>
      <path d="M5 5c4-3 7 3 14 0v10c-7 3-10-3-14 0"/>
    </svg>`,

  activity: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M3 12h4l3-8 4 16 3-8h4"/>
    </svg>`,

  file: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M6 3h8l4 4v14H6z"/>
      <path d="M14 3v5h5"/>
      <path d="M9 13h6M9 17h6"/>
    </svg>`,

  list: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M8 6h13M8 12h13M8 18h13"/>
      <circle cx="3.5" cy="6" r="1"/>
      <circle cx="3.5" cy="12" r="1"/>
      <circle cx="3.5" cy="18" r="1"/>
    </svg>`,

  search: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="10.8" cy="10.8" r="6.8"/>
      <path d="m16 16 5 5"/>
    </svg>`,

  plus: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 5v14M5 12h14"/>
    </svg>`,

  edit: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 20h4l11-11-4-4L4 16v4Z"/>
      <path d="m13.5 6.5 4 4"/>
    </svg>`,

  trash: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/>
      <path d="M10 11v6M14 11v6"/>
    </svg>`,

  eye: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
      <circle cx="12" cy="12" r="2.5"/>
    </svg>`,

  x: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="m6 6 12 12M18 6 6 18"/>
    </svg>`,

  check: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="m5 12 4 4L19 6"/>
    </svg>`,

  alert: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 3 2.8 20h18.4L12 3Z"/>
      <path d="M12 9v5M12 17v1"/>
    </svg>`,

  qrcode: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/>
      <path d="M14 14h3v3h-3zM18 18h2v2h-2zM18 14h2M14 20h2"/>
    </svg>`,

  activity2: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 18V6M4 18h16"/>
      <path d="m7 15 3-4 3 2 5-7"/>
    </svg>`,

  logout: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M10 4H5v16h5"/>
      <path d="M14 8l4 4-4 4M18 12H9"/>
    </svg>`,

  inbox: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 5h16v14H4z"/>
      <path d="M4 14h4l2 3h4l2-3h4"/>
    </svg>`,

  desktop: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="4" width="18" height="12" rx="1.5"/>
      <path d="M8 20h8M12 16v4"/>
    </svg>`,

  monitor: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="4" width="18" height="13" rx="1.5"/>
      <path d="M8 20h8M12 17v3"/>
    </svg>`,

  printer: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M6 9V4h12v5"/>
      <path d="M6 17H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/>
      <path d="M6 14h12v7H6z"/>
    </svg>`,

  camera: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 7h4l2-2h4l2 2h4v12H4z"/>
      <circle cx="12" cy="13" r="3.5"/>
    </svg>`,

  network: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="9" y="3" width="6" height="6" rx="1"/>
      <rect x="3" y="15" width="6" height="6" rx="1"/>
      <rect x="15" y="15" width="6" height="6" rx="1"/>
      <path d="M12 9v3M6 15v-3h12v3M12 12H6M12 12h6"/>
    </svg>`
};

function icon(name, className = '') {
  return `<span class="svg-icon ${className}">${ICONS[name] || ICONS.box}</span>`;
}

/* ============================================================
   DEMO DATABASE
   Replace this object with your real backend later.
   ============================================================ */

const DB = {

  users: [
    {
      id: 'u-admin-1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'ICT Laboratory Administrator',
      title: 'Laboratory Technician',
      initials: 'IA'
    },

    {
      id: 'u-student-1',
      username: 'student',
      password: 'student123',
      role: 'student',
      name: 'Juan Dela Cruz',
      course: 'BSIT-3A',
      initials: 'JD'
    },

    {
      id: 'u-student-2',
      username: 'student2',
      password: 'student123',
      role: 'student',
      name: 'Maria Santos',
      course: 'BSIT-2B',
      initials: 'MS'
    }
  ],

  equipment: [
    {
      id: 'EMS-CL1-DT-001',
      name: 'Desktop Computer 01',
      category: 'Desktop',
      location: 'Computer Laboratory 1',
      serial: 'CEU-DT-001',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-06-15',
      lastMaintenance: '2026-06-20',
      notes: 'Standard laboratory workstation.'
    },

    {
      id: 'EMS-CL1-DT-002',
      name: 'Desktop Computer 02',
      category: 'Desktop',
      location: 'Computer Laboratory 1',
      serial: 'CEU-DT-002',
      status: 'Under Repair',
      condition: 'Needs Repair',
      dateAcquired: '2023-05-10',
      lastMaintenance: '2026-02-14',
      notes: 'Intermittent boot issue.'
    },

    {
      id: 'EMS-CL1-DT-003',
      name: 'Desktop Computer 03',
      category: 'Desktop',
      location: 'Computer Laboratory 1',
      serial: 'CEU-DT-003',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-06-15',
      lastMaintenance: '2026-06-20',
      notes: ''
    },

    {
      id: 'EMS-CL1-DT-004',
      name: 'Desktop Computer 04',
      category: 'Desktop',
      location: 'Computer Laboratory 1',
      serial: 'CEU-DT-004',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-06-15',
      lastMaintenance: '2026-05-18',
      notes: ''
    },

    {
      id: 'EMS-CL2-DT-001',
      name: 'Desktop Computer 05',
      category: 'Desktop',
      location: 'Computer Laboratory 2',
      serial: 'CEU-DT-005',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2023-05-10',
      lastMaintenance: '2026-04-15',
      notes: ''
    },

    {
      id: 'EMS-CL2-DT-002',
      name: 'Desktop Computer 06',
      category: 'Desktop',
      location: 'Computer Laboratory 2',
      serial: 'CEU-DT-006',
      status: 'Damaged',
      condition: 'Damaged',
      dateAcquired: '2022-08-22',
      lastMaintenance: '2025-11-03',
      notes: 'Display issue reported.'
    },

    {
      id: 'EMS-CL2-DT-003',
      name: 'Desktop Computer 07',
      category: 'Desktop',
      location: 'Computer Laboratory 2',
      serial: 'CEU-DT-007',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-01-12',
      lastMaintenance: '2026-05-05',
      notes: ''
    },

    {
      id: 'EMS-CL2-DT-004',
      name: 'Desktop Computer 08',
      category: 'Desktop',
      location: 'Computer Laboratory 2',
      serial: 'CEU-DT-008',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-01-12',
      lastMaintenance: '2026-05-05',
      notes: ''
    },

    {
      id: 'EMS-CL3-DT-001',
      name: 'Desktop Computer 09',
      category: 'Desktop',
      location: 'Computer Laboratory 3',
      serial: 'CEU-DT-009',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-01-12',
      lastMaintenance: '2026-06-01',
      notes: ''
    },

    {
      id: 'EMS-CL3-DT-002',
      name: 'Desktop Computer 10',
      category: 'Desktop',
      location: 'Computer Laboratory 3',
      serial: 'CEU-DT-010',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-01-12',
      lastMaintenance: '2026-06-01',
      notes: ''
    },

    {
      id: 'EMS-CL3-DT-003',
      name: 'Desktop Computer 11',
      category: 'Desktop',
      location: 'Computer Laboratory 3',
      serial: 'CEU-DT-011',
      status: 'Operational',
      condition: 'Fair',
      dateAcquired: '2022-07-10',
      lastMaintenance: '2026-03-12',
      notes: ''
    },

    {
      id: 'EMS-CL3-DT-004',
      name: 'Desktop Computer 12',
      category: 'Desktop',
      location: 'Computer Laboratory 3',
      serial: 'CEU-DT-012',
      status: 'Missing',
      condition: 'Missing',
      dateAcquired: '2022-07-10',
      lastMaintenance: '2025-10-10',
      notes: 'Missing during inventory verification.'
    },

    {
      id: 'EMS-CL1-UPS-001',
      name: 'UPS Unit 01',
      category: 'UPS',
      location: 'Computer Laboratory 1',
      serial: 'CEU-UPS-001',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2024-02-18',
      lastMaintenance: '2026-04-20',
      notes: ''
    },

    {
      id: 'EMS-CL1-PRN-001',
      name: 'Network Printer 01',
      category: 'Printer',
      location: 'Computer Laboratory 1',
      serial: 'CEU-PRN-001',
      status: 'Operational',
      condition: 'Good',
      dateAcquired: '2023-11-20',
      lastMaintenance: '2026-05-12',
      notes: ''
    },

    {
      id: 'EMS-CL3-CAM-001',
      name: 'Web Camera 01',
      category: 'Camera',
      location: 'Computer Laboratory 3',
      serial: 'CEU-CAM-001',
      status: 'Operational',
      condition: 'Fair',
      dateAcquired: '2022-08-01',
      lastMaintenance: '2026-01-20',
      notes: ''
    }
  ],

  incidents: [
    {
      id: 'INC-0001',
      equipmentId: 'EMS-CL1-DT-002',
      reportedByUserId: 'u-student-1',
      reportedByName: 'Juan Dela Cruz',
      reportedByCourse: 'BSIT-3A',
      dateReported: '2026-07-10',
      category: 'Malfunctioning',
      description: 'Computer occasionally fails to boot after pressing the power button.',
      status: 'In Progress',
      priority: 'High',
      remarks: 'Unit is currently being inspected.',
      resolvedDate: null
    },

    {
      id: 'INC-0002',
      equipmentId: 'EMS-CL2-DT-002',
      reportedByUserId: 'u-student-2',
      reportedByName: 'Maria Santos',
      reportedByCourse: 'BSIT-2B',
      dateReported: '2026-07-12',
      category: 'Damaged',
      description: 'Monitor displays distorted output.',
      status: 'Pending',
      priority: 'High',
      remarks: '',
      resolvedDate: null
    },

    {
      id: 'INC-0003',
      equipmentId: 'EMS-CL3-DT-004',
      reportedByUserId: null,
      reportedByName: 'Nicole Aquino',
      reportedByCourse: 'BSIT-4A',
      dateReported: '2026-06-05',
      category: 'Missing',
      description: 'Unit was not found at Station 4 during inventory verification.',
      status: 'Pending',
      priority: 'Critical',
      remarks: '',
      resolvedDate: null
    },

    {
      id: 'INC-0004',
      equipmentId: 'EMS-CL1-DT-001',
      reportedByUserId: 'u-student-1',
      reportedByName: 'Juan Dela Cruz',
      reportedByCourse: 'BSIT-3A',
      dateReported: '2026-03-14',
      category: 'Malfunctioning',
      description: 'Mouse pointer freezes intermittently during use.',
      status: 'Resolved',
      priority: 'Low',
      remarks: 'Replaced faulty USB port cable.',
      resolvedDate: '2026-03-18'
    },

    {
      id: 'INC-0005',
      equipmentId: 'EMS-CL2-DT-004',
      reportedByUserId: null,
      reportedByName: 'Trisha Domingo',
      reportedByCourse: 'BSIT-1A',
      dateReported: '2026-02-22',
      category: 'Other',
      description: 'Sticky spacebar key, difficult to type accurately.',
      status: 'Resolved',
      priority: 'Low',
      remarks: 'Keyboard cleaned and lubricated.',
      resolvedDate: '2026-02-25'
    },

    {
      id: 'INC-0006',
      equipmentId: 'EMS-CL3-DT-003',
      reportedByUserId: null,
      reportedByName: 'Marco Villanueva',
      reportedByCourse: 'BSIT-2A',
      dateReported: '2026-04-09',
      category: 'Malfunctioning',
      description: 'Monitor output flickers intermittently.',
      status: 'Resolved',
      priority: 'Medium',
      remarks: 'Replaced HDMI cable.',
      resolvedDate: '2026-04-14'
    },

    {
      id: 'INC-0007',
      equipmentId: 'EMS-CL1-UPS-001',
      reportedByUserId: null,
      reportedByName: 'Angeline Cruz',
      reportedByCourse: 'BSIT-3A',
      dateReported: '2026-05-02',
      category: 'Other',
      description: 'UPS emits a beeping sound during minor power fluctuations.',
      status: 'Rejected',
      priority: 'Low',
      remarks: 'Confirmed normal UPS behavior during a brownout; no defect found.',
      resolvedDate: '2026-05-04'
    },

    {
      id: 'INC-0008',
      equipmentId: 'EMS-CL2-DT-001',
      reportedByUserId: 'u-student-1',
      reportedByName: 'Juan Dela Cruz',
      reportedByCourse: 'BSIT-3A',
      dateReported: '2026-07-01',
      category: 'Malfunctioning',
      description: 'System runs unusually slow when opening multiple programming IDEs.',
      status: 'Pending',
      priority: 'Medium',
      remarks: '',
      resolvedDate: null
    },

    {
      id: 'INC-0009',
      equipmentId: 'EMS-CL1-DT-004',
      reportedByUserId: null,
      reportedByName: 'Camille Navarro',
      reportedByCourse: 'BSIT-2B',
      dateReported: '2026-01-18',
      category: 'Malfunctioning',
      description: 'USB ports on the front panel are unresponsive.',
      status: 'Resolved',
      priority: 'Low',
      remarks: 'Reconnected front-panel USB header.',
      resolvedDate: '2026-01-20'
    },

    {
      id: 'INC-0010',
      equipmentId: 'EMS-CL3-CAM-001',
      reportedByUserId: null,
      reportedByName: 'Ella Mercado',
      reportedByCourse: 'BSIT-1B',
      dateReported: '2026-07-15',
      category: 'Malfunctioning',
      description: 'Webcam image appears blurry during online class recordings.',
      status: 'Pending',
      priority: 'Medium',
      remarks: '',
      resolvedDate: null
    }
  ]
};

/* ============================================================
   APPLICATION STATE
   ============================================================ */

const state = {
  user: null,
  loginRole: 'admin',
  view: null,
  presetEquipId: null,

  filters: {
    equipSearch: '',
    equipCategory: 'all',
    equipStatus: 'all',
    incidentSearch: '',
    incidentStatus: 'all',
    incidentPriority: 'all'
  }
};

/* ============================================================
   LOCATIONS / CATEGORIES
   ============================================================ */

const LOCATIONS = [
  'Computer Laboratory 1',
  'Computer Laboratory 2',
  'Computer Laboratory 3',
  'ICT Office',
  'Storage Room'
];

const CATEGORY_ICON = {
  Desktop: 'desktop',
  Monitor: 'monitor',
  Printer: 'printer',
  Camera: 'camera',
  UPS: 'network',
  Network: 'network'
};

/* ============================================================
   LOGIN
   ============================================================ */

function renderLogin() {
  const login = $('#login-screen');

  if (!login) return;

  login.innerHTML = `
    <div class="login-layout">

      <section class="login-visual" id="login-visual">

        <div class="login-brand">
          <div class="mark">EMS</div>

          <div>
            <div class="brand-name">
              Equipment Monitoring
            </div>

            <div class="brand-sub">
              CEU MALOLOS · ICT
            </div>
          </div>
        </div>

        <div class="login-hero">

          <div class="eyebrow">
            ICT RESOURCE MANAGEMENT
          </div>

          <h1>
            Smarter equipment.
            <br>
            Better laboratory operations.
          </h1>

          <p>
            A centralized web-based platform for monitoring
            ICT resources, managing incidents, and supporting
            preventive maintenance decisions.
          </p>

          <div class="login-feature-list">
            <div>
              ${icon('box')}
              <span>Equipment inventory</span>
            </div>

            <div>
              ${icon('flag')}
              <span>Incident reporting</span>
            </div>

            <div>
              ${icon('activity')}
              <span>Predictive risk analytics</span>
            </div>
          </div>

        </div>

        <div class="login-footer">
          Capstone Prototype · AY 2025–2026
        </div>

      </section>

      <section class="login-panel">

        <div class="login-card">

          <div class="login-heading">

            <div class="eyebrow">
              SECURE ACCESS
            </div>

            <h2>Welcome back</h2>

            <p>
              Sign in to access the Equipment Monitoring System.
            </p>

          </div>

          <form id="login-form" onsubmit="handleLogin(event)">

            <div class="field">

              <label>Access as</label>

              <div class="role-switch">

                <button
                  type="button"
                  class="role-btn active"
                  id="role-admin"
                  onclick="setLoginRole('admin')"
                >
                  ${icon('activity')}
                  Administrator
                </button>

                <button
                  type="button"
                  class="role-btn"
                  id="role-student"
                  onclick="setLoginRole('student')"
                >
                  ${icon('grid')}
                  Student
                </button>

              </div>

            </div>

            <div class="field">

              <label for="li-username">
                Username
              </label>

              <input
                type="text"
                id="li-username"
                placeholder="Enter username"
                autocomplete="username"
                required
              >

            </div>

            <div class="field">

              <label for="li-password">
                Password
              </label>

              <input
                type="password"
                id="li-password"
                placeholder="Enter password"
                autocomplete="current-password"
                required
              >

            </div>

            <div
              class="login-error"
              id="login-error"
              style="display:none"
            >
              ${icon('alert')}
              <span>
                Invalid username, password, or account role.
              </span>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
            >
              Sign in
              ${icon('logout')}
            </button>

          </form>

          <div class="demo-box">

            <div class="demo-title">
              DEMO CREDENTIALS
            </div>

            <div class="demo-row">
              <span>Administrator</span>
              <code>admin / admin123</code>
            </div>

            <div class="demo-row">
              <span>Student</span>
              <code>student / student123</code>
            </div>

          </div>

        </div>

      </section>

    </div>
  `;
}

function setLoginRole(role) {
  state.loginRole = role;

  $('#role-admin')?.classList.toggle(
    'active',
    role === 'admin'
  );

  $('#role-student')?.classList.toggle(
    'active',
    role === 'student'
  );
}

function handleLogin(event) {
  event.preventDefault();

  const username = $('#li-username')?.value.trim();
  const password = $('#li-password')?.value;

  const found = DB.users.find(user =>
    user.username.toLowerCase() === username.toLowerCase() &&
    user.password === password &&
    user.role === state.loginRole
  );

  if (!found) {
    $('#login-error').style.display = 'flex';
    return;
  }

  state.user = found;

  showApp();
}

function logout() {
  state.user = null;
  state.view = null;
  state.presetEquipId = null;

  $('#app-shell')?.classList.add('hidden');
  $('#login-screen')?.classList.remove('hidden');

  if ($('#login-form')) {
    $('#login-form').reset();
  }

  $('#login-error')?.style.setProperty(
    'display',
    'none'
  );
}

/* ============================================================
   NAVIGATION
   ============================================================ */

const NAV = {

  admin: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'grid'
    },

    {
      id: 'equipment',
      label: 'Equipment Inventory',
      icon: 'box'
    },

    {
      id: 'incidents',
      label: 'Incident Reports',
      icon: 'flag',
      badge: () =>
        DB.incidents.filter(
          incident => incident.status === 'Pending'
        ).length
    },

    {
      id: 'risk',
      label: 'Risk Analytics',
      icon: 'activity'
    },

    {
      id: 'reports',
      label: 'Reports & Export',
      icon: 'file'
    }
  ],

  student: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'grid'
    },

    {
      id: 'browse',
      label: 'Browse Equipment',
      icon: 'box'
    },

    {
      id: 'report',
      label: 'Report an Issue',
      icon: 'flag'
    },

    {
      id: 'myreports',
      label: 'My Reports',
      icon: 'list'
    }
  ]
};

const TITLES = {

  dashboard: [
    'Overview',
    'Dashboard'
  ],

  equipment: [
    'ICT Resources',
    'Equipment Inventory'
  ],

  incidents: [
    'Service Desk',
    'Incident Reports'
  ],

  risk: [
    'Predictive Maintenance',
    'Risk Analytics'
  ],

  reports: [
    'Documentation',
    'Reports & Export'
  ],

  browse: [
    'ICT Resources',
    'Browse Equipment'
  ],

  report: [
    'Service Desk',
    'Report an Issue'
  ],

  myreports: [
    'Service Desk',
    'My Reports'
  ]
};

function renderSidebar() {

  const sidebar = $('#sidebar');

  if (!sidebar || !state.user) return;

  const role = state.user.role;

  const items = NAV[role];

  const navHtml = items.map(item => {

    const count = item.badge
      ? item.badge()
      : 0;

    return `
      <div
        class="nav-link ${state.view === item.id ? 'active' : ''}"
        onclick="navigate('${item.id}')"
      >

        ${icon(item.icon)}

        <span class="label-text">
          ${item.label}
        </span>

        ${
          count > 0
            ? `<span class="pill">${count}</span>`
            : ''
        }

      </div>
    `;

  }).join('');

  sidebar.innerHTML = `

    <div class="brandmark">

      <div class="mark">
        EMS
      </div>

      <div>
        <div class="name">
          Equipment Monitoring
        </div>

        <div class="sub">
          CEU MALOLOS · ICT
        </div>
      </div>

    </div>

    <div class="nav-section-label">
      ${
        role === 'admin'
          ? 'Laboratory Control'
          : 'My Workspace'
      }
    </div>

    ${navHtml}

    <div class="side-foot">

      <div class="user-chip">

        <div class="avatar">
          ${esc(state.user.initials)}
        </div>

        <div class="who">

          <div class="n">
            ${esc(state.user.name)}
          </div>

          <div class="r">
            ${
              role === 'admin'
                ? esc(state.user.title)
                : esc(state.user.course || 'Student')
            }
          </div>

        </div>

      </div>

      <button
        class="btn btn-outline btn-sm btn-block"
        onclick="logout()"
      >
        ${icon('logout')}
        <span class="label-text">
          Sign out
        </span>
      </button>

    </div>
  `;
}

function navigate(viewId, opts = {}) {

  state.view = viewId;

  if (opts.presetEquipId !== undefined) {
    state.presetEquipId = opts.presetEquipId;
  }

  renderSidebar();

  const [crumb, title] =
    TITLES[viewId] || ['', ''];

  $('#topbar-crumb').textContent = crumb;
  $('#topbar-title').textContent = title;

  const renderFn = VIEWS[viewId];

  $('#view-root').innerHTML =
    renderFn ? renderFn() : '';

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

  closeMobileNav();
}

/* ============================================================
   APP INITIALIZATION
   ============================================================ */

function showApp() {

  $('#login-screen')?.classList.add('hidden');

  $('#app-shell')?.classList.remove('hidden');

  renderSidebar();

  navigate('dashboard');

  startClock();
}

function startClock() {

  function tick() {

    const clock = $('#live-clock');

    if (!clock) return;

    const date = new Date();

    clock.textContent =
      date.toLocaleDateString(
        'en-US',
        {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }
      ) +
      ' · ' +
      date.toLocaleTimeString(
        'en-US',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      );
  }

  tick();

  setInterval(tick, 30000);
}

/* ============================================================
   BADGES / TAGS
   ============================================================ */

const STATUS_BADGE = {

  Operational: 'teal',
  'Under Repair': 'amber',
  Damaged: 'red',
  Missing: 'red',
  Decommissioned: 'grey',

  Pending: 'amber',
  'In Progress': 'blue',
  Resolved: 'teal',
  Rejected: 'grey',

  Low: 'teal',
  Medium: 'blue',
  High: 'amber',
  Critical: 'red'
};

function badge(text) {

  const c =
    STATUS_BADGE[text] || 'grey';

  return `
    <span class="badge badge-${c}">
      <i></i>
      ${esc(text)}
    </span>
  `;
}

function tagChip(id) {

  return `
    <span class="tag-chip">
      ${esc(id)}
    </span>
  `;
}

/* ============================================================
   RISK ENGINE
   ============================================================ */

function getIncidentsFor(equipId) {

  return DB.incidents.filter(
    incident => incident.equipmentId === equipId
  );
}

function calcRisk(equip) {

  const related =
    getIncidentsFor(equip.id);

  /*
   * Incident frequency
   * Maximum: 40 points
   */

  const openWeight =
    related.reduce(
      (sum, incident) =>
        sum +
        (
          incident.status === 'Resolved' ||
          incident.status === 'Rejected'
            ? 4
            : 10
        ),
      0
    );

  const incidentScore =
    Math.min(openWeight, 40);

  /*
   * Equipment age
   * Maximum: 25 points
   */

  const acquired =
    new Date(equip.dateAcquired);

  const ageYears =
    (NOW - acquired) /
    (365.25 * 86400000);

  const ageScore =
    Math.min(ageYears * 5, 25);

  /*
   * Maintenance staleness
   * Maximum: 20 points
   */

  const maintenance =
    new Date(equip.lastMaintenance);

  const daysSinceMaint =
    (NOW - maintenance) /
    86400000;

  const maintScore =
    Math.min(
      (daysSinceMaint / 30) * 3,
      20
    );

  /*
   * Current status
   * Maximum: 15 points
   */

  const statusWeight = {
    Operational: 0,
    'Under Repair': 10,
    Damaged: 15,
    Missing: 15,
    Decommissioned: 0
  };

  const statusScore =
    statusWeight[equip.status] || 0;

  const total =
    incidentScore +
    ageScore +
    maintScore +
    statusScore;

  return Math.round(
    Math.min(total, 100)
  );
}

function riskBand(score) {

  if (score >= 75) {
    return {
      label: 'Critical',
      color: 'red',
      hex: '#c1443c'
    };
  }

  if (score >= 50) {
    return {
      label: 'High',
      color: 'amber',
      hex: '#df9f34'
    };
  }

  if (score >= 25) {
    return {
      label: 'Medium',
      color: 'blue',
      hex: '#3f6fb0'
    };
  }

  return {
    label: 'Low',
    color: 'teal',
    hex: '#2f8f7f'
  };
}

function riskBar(score) {

  const band = riskBand(score);

  return `
    <div style="min-width:96px">

      <div class="risk-track">

        <div
          class="risk-fill"
          style="
            width:${score}%;
            background:${band.hex};
          "
        ></div>

      </div>

      <div
        style="
          font-family:var(--font-mono);
          font-size:10.5px;
          color:var(--text-500);
          margin-top:4px;
        "
      >
        ${score}/100 · ${band.label}
      </div>

    </div>
  `;
}

/* ============================================================
   SHARED UI
   ============================================================ */

function statCard(
  iconName,
  label,
  value,
  sub,
  tone = 'teal'
) {

  const toneMap = {

    teal: [
      'var(--teal-tint)',
      'var(--teal)'
    ],

    amber: [
      'var(--amber-tint)',
      'var(--amber)'
    ],

    red: [
      'var(--red-tint)',
      'var(--red)'
    ],

    blue: [
      'var(--blue-tint)',
      'var(--blue)'
    ]
  };

  const [bg, color] =
    toneMap[tone] || toneMap.teal;

  return `
    <div class="stat-card">

      <div
        class="stat-icon"
        style="
          background:${bg};
          color:${color};
        "
      >
        ${icon(iconName)}
      </div>

      <div class="stat-content">

        <div class="stat-label">
          ${esc(label)}
        </div>

        <div class="stat-value">
          ${esc(value)}
        </div>

        <div class="stat-sub">
          ${esc(sub)}
        </div>

      </div>

    </div>
  `;
}

function emptyState(
  iconName,
  title,
  message
) {

  return `
    <div class="empty-state">

      <div class="empty-icon">
        ${icon(iconName)}
      </div>

      <h3>
        ${esc(title)}
      </h3>

      <p>
        ${esc(message)}
      </p>

    </div>
  `;
}

function banner(
  type,
  iconName,
  title,
  message
) {

  return `
    <div class="banner banner-${type}">

      ${icon(iconName)}

      <div>
        <strong>
          ${esc(title)}
        </strong>

        <div>
          ${esc(message)}
        </div>
      </div>

    </div>
  `;
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboardView() {

  if (state.user.role === 'student') {
    return renderStudentDashboard();
  }

  return renderAdminDashboard();
}

/* ---------------- ADMIN DASHBOARD ---------------- */

function renderAdminDashboard() {

  const equipment =
    DB.equipment;

  const incidents =
    DB.incidents;

  const total =
    equipment.length;

  const operational =
    equipment.filter(
      e => e.status === 'Operational'
    ).length;

  const maintenance =
    equipment.filter(
      e => e.status === 'Under Repair'
    ).length;

  const critical =
    equipment.filter(
      e => riskBand(calcRisk(e)).label === 'Critical'
    ).length;

  const pending =
    incidents.filter(
      i => i.status === 'Pending'
    ).length;

  const recent =
    [...incidents]
      .sort(
        (a, b) =>
          new Date(b.dateReported) -
          new Date(a.dateReported)
      )
      .slice(0, 5);

  return `
    <div class="view">

      <div class="view-header">

        <div>
          <div class="eyebrow">
            LABORATORY OVERVIEW
          </div>

          <h2>
            Good day, ${esc(state.user.name)}
          </h2>

          <p>
            Monitor ICT resources, service incidents,
            and equipment risk from one workspace.
          </p>
        </div>

        <button
          class="btn btn-primary"
          onclick="navigate('equipment')"
        >
          ${icon('box')}
          View Inventory
        </button>

      </div>

      ${
        pending > 0
          ? banner(
              'amber',
              'flag',
              'Attention required',
              `${pending} incident report${pending === 1 ? '' : 's'} currently require review.`
            )
          : ''
      }

      <div class="stat-grid">

        ${statCard(
          'box',
          'Total Equipment',
          fmtNumber(total),
          'Registered ICT resources',
          'teal'
        )}

        ${statCard(
          'check',
          'Operational',
          fmtNumber(operational),
          'Currently available',
          'blue'
        )}

        ${statCard(
          'activity',
          'Under Repair',
          fmtNumber(maintenance),
          'Units requiring attention',
          'amber'
        )}

        ${statCard(
          'alert',
          'Critical Risk',
          fmtNumber(critical),
          'Priority maintenance units',
          'red'
        )}

      </div>

      <div class="dashboard-grid">

        <div class="card">

          <div class="card-head">

            <div>
              <h3>
                Recent Incident Reports
              </h3>

              <div class="card-sub">
                Latest service desk activity
              </div>
            </div>

            <button
              class="btn btn-outline btn-sm"
              onclick="navigate('incidents')"
            >
              View all
            </button>

          </div>

          <div class="card-body flush">

            ${
              recent.length
                ? `
                  <div class="table-wrap">

                    <table class="dtable">

                      <thead>
                        <tr>
                          <th>Report</th>
                          <th>Equipment</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>

                        ${recent.map(incident => {

                          const eq =
                            DB.equipment.find(
                              e =>
                                e.id ===
                                incident.equipmentId
                            );

                          return `
                            <tr>

                              <td>
                                ${tagChip(incident.id)}
                              </td>

                              <td>
                                <div class="cell-strong">
                                  ${esc(
                                    eq?.name ||
                                    'Unknown equipment'
                                  )}
                                </div>

                                <div class="cell-sub">
                                  ${esc(
                                    eq?.location || ''
                                  )}
                                </div>
                              </td>

                              <td>
                                ${fmtDate(
                                  incident.dateReported
                                )}
                              </td>

                              <td>
                                ${badge(
                                  incident.status
                                )}
                              </td>

                            </tr>
                          `;

                        }).join('')}

                      </tbody>

                    </table>

                  </div>
                `
                : emptyState(
                    'inbox',
                    'No incident reports',
                    'There are currently no recorded incidents.'
                  )
            }

          </div>

        </div>

        <div class="card">

          <div class="card-head">

            <div>
              <h3>
                Equipment Status
              </h3>

              <div class="card-sub">
                Current inventory distribution
              </div>
            </div>

          </div>

          <div class="card-body">

            ${renderStatusDistribution()}

          </div>

        </div>

      </div>

      <div class="card">

        <div class="card-head">

          <div>
            <h3>
              Highest-Risk Equipment
            </h3>

            <div class="card-sub">
              Based on the current weighted risk model
            </div>
          </div>

          <button
            class="btn btn-outline btn-sm"
            onclick="navigate('risk')"
          >
            Open analytics
          </button>

        </div>

        <div class="card-body flush">

          ${renderRiskTable(5)}

        </div>

      </div>

    </div>
  `;
}

/* ---------------- STUDENT DASHBOARD ---------------- */

function renderStudentDashboard() {

  const mine =
    DB.incidents.filter(
      i => i.reportedByUserId === state.user.id
    );

  const pending =
    mine.filter(
      i => i.status === 'Pending'
    ).length;

  const progress =
    mine.filter(
      i => i.status === 'In Progress'
    ).length;

  const resolved =
    mine.filter(
      i => i.status === 'Resolved'
    ).length;

  const available =
    DB.equipment.filter(
      e => e.status === 'Operational'
    ).length;

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            STUDENT WORKSPACE
          </div>

          <h2>
            Welcome, ${esc(state.user.name)}
          </h2>

          <p>
            Browse available ICT resources and
            submit equipment issue reports.
          </p>

        </div>

        <button
          class="btn btn-primary"
          onclick="navigate('report')"
        >
          ${icon('flag')}
          Report an Issue
        </button>

      </div>

      <div class="stat-grid">

        ${statCard(
          'box',
          'Available Equipment',
          fmtNumber(available),
          'Operational ICT resources',
          'teal'
        )}

        ${statCard(
          'flag',
          'Pending Reports',
          fmtNumber(pending),
          'Awaiting administrator review',
          'amber'
        )}

        ${statCard(
          'activity',
          'In Progress',
          fmtNumber(progress),
          'Currently being addressed',
          'blue'
        )}

        ${statCard(
          'check',
          'Resolved Reports',
          fmtNumber(resolved),
          'Successfully completed',
          'teal'
        )}

      </div>

      <div class="dashboard-grid">

        <div class="card">

          <div class="card-head">

            <div>
              <h3>
                Quick Actions
              </h3>

              <div class="card-sub">
                Common student tasks
              </div>
            </div>

          </div>

          <div class="card-body">

            <div class="quick-actions">

              <button
                class="quick-action"
                onclick="navigate('browse')"
              >
                <div class="qa-icon">
                  ${icon('box')}
                </div>

                <div>
                  <strong>
                    Browse Equipment
                  </strong>

                  <span>
                    Check equipment availability
                    and status.
                  </span>
                </div>
              </button>

              <button
                class="quick-action"
                onclick="navigate('report')"
              >
                <div class="qa-icon">
                  ${icon('flag')}
                </div>

                <div>
                  <strong>
                    Report an Issue
                  </strong>

                  <span>
                    Submit a malfunction,
                    damage, or missing-item report.
                  </span>
                </div>
              </button>

              <button
                class="quick-action"
                onclick="navigate('myreports')"
              >
                <div class="qa-icon">
                  ${icon('list')}
                </div>

                <div>
                  <strong>
                    View My Reports
                  </strong>

                  <span>
                    Track the status of your
                    submitted reports.
                  </span>
                </div>
              </button>

            </div>

          </div>

        </div>

        <div class="card">

          <div class="card-head">

            <div>
              <h3>
                Reporting Reminder
              </h3>

              <div class="card-sub">
                Help keep laboratory resources reliable
              </div>
            </div>

          </div>

          <div class="card-body">

            ${banner(
              'blue',
              'flag',
              'Report issues promptly',
              'Provide the equipment ID, location, and a clear description of the problem so ICT personnel can respond efficiently.'
            )}

          </div>

        </div>

      </div>

    </div>
  `;
}

/* ============================================================
   EQUIPMENT STATUS DISTRIBUTION
   ============================================================ */

function renderStatusDistribution() {

  const statuses = [
    'Operational',
    'Under Repair',
    'Damaged',
    'Missing',
    'Decommissioned'
  ];

  const total =
    DB.equipment.length || 1;

  return `
    <div class="status-list">

      ${statuses.map(status => {

        const count =
          DB.equipment.filter(
            e => e.status === status
          ).length;

        const percent =
          Math.round(
            count / total * 100
          );

        return `
          <div class="status-row">

            <div class="status-row-top">

              <span>
                ${badge(status)}
              </span>

              <strong>
                ${count}
              </strong>

            </div>

            <div class="progress-track">

              <div
                class="progress-fill"
                style="width:${percent}%"
              ></div>

            </div>

          </div>
        `;

      }).join('')}

    </div>
  `;
}

/* ============================================================
   ADMIN — EQUIPMENT INVENTORY
   ============================================================ */

function renderEquipmentView() {

  const f =
    state.filters;

  const rows =
    DB.equipment.filter(e => {

      if (
        f.equipCategory !== 'all' &&
        e.category !== f.equipCategory
      ) {
        return false;
      }

      if (
        f.equipStatus !== 'all' &&
        e.status !== f.equipStatus
      ) {
        return false;
      }

      if (f.equipSearch) {

        const q =
          f.equipSearch.toLowerCase();

        const searchable = [
          e.name,
          e.id,
          e.location,
          e.serial,
          e.category
        ]
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(q)) {
          return false;
        }
      }

      return true;
    });

  const categories = [
    ...new Set(
      DB.equipment.map(
        e => e.category
      )
    )
  ];

  const statuses = [
    'Operational',
    'Under Repair',
    'Damaged',
    'Missing',
    'Decommissioned'
  ];

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            ICT RESOURCES
          </div>

          <h2>
            Equipment Inventory
          </h2>

          <p>
            Maintain a centralized record of
            ICT equipment and its current condition.
          </p>

        </div>

        <button
          class="btn btn-primary"
          onclick="openEquipmentForm()"
        >
          ${icon('plus')}
          Add Equipment
        </button>

      </div>

      <div class="toolbar">

        <div class="toolbar-left">

          <div class="search-box">

            ${icon('search')}

            <input
              type="text"
              placeholder="Search by name, tag ID, location, or serial..."
              value="${esc(f.equipSearch)}"
              oninput="onEquipSearch(this.value)"
            >

          </div>

          <select
            class="select-filter"
            onchange="onEquipFilter('equipCategory', this.value)"
          >

            <option value="all">
              All categories
            </option>

            ${categories.map(category => `
              <option
                value="${esc(category)}"
                ${f.equipCategory === category ? 'selected' : ''}
              >
                ${esc(category)}
              </option>
            `).join('')}

          </select>

          <select
            class="select-filter"
            onchange="onEquipFilter('equipStatus', this.value)"
          >

            <option value="all">
              All statuses
            </option>

            ${statuses.map(status => `
              <option
                value="${esc(status)}"
                ${f.equipStatus === status ? 'selected' : ''}
              >
                ${esc(status)}
              </option>
            `).join('')}

          </select>

        </div>

      </div>

      <div class="card">

        <div class="card-body flush">

          <div class="table-wrap">

            <table class="dtable">

              <thead>

                <tr>
                  <th>Tag ID</th>
                  <th>Equipment</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Last Maintenance</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                ${rows.map(equipment => {

                  const score =
                    calcRisk(equipment);

                  return `
                    <tr>

                      <td>
                        ${tagChip(equipment.id)}
                      </td>

                      <td>

                        <div
                          class="cell-strong"
                          style="
                            display:flex;
                            align-items:center;
                            gap:9px;
                          "
                        >
                          ${icon(
                            CATEGORY_ICON[
                              equipment.category
                            ] || 'box'
                          )}

                          ${esc(
                            equipment.name
                          )}

                        </div>

                        <div class="cell-sub">
                          ${esc(
                            equipment.category
                          )}
                          ·
                          ${esc(
                            equipment.serial
                          )}
                        </div>

                      </td>

                      <td>
                        ${esc(
                          equipment.location
                        )}
                      </td>

                      <td>
                        ${badge(
                          equipment.status
                        )}
                      </td>

                      <td>
                        ${riskBar(score)}
                      </td>

                      <td>
                        ${fmtDate(
                          equipment.lastMaintenance
                        )}
                      </td>

                      <td>

                        <div class="row-actions">

                          <button
                            class="icon-btn"
                            title="View equipment"
                            onclick="openEquipmentDetails('${equipment.id}')"
                          >
                            ${icon('eye')}
                          </button>

                          <button
                            class="icon-btn"
                            title="View QR tag"
                            onclick="openQrModal('${equipment.id}')"
                          >
                            ${icon('qrcode')}
                          </button>

                          <button
                            class="icon-btn"
                            title="Edit"
                            onclick="openEquipmentForm('${equipment.id}')"
                          >
                            ${icon('edit')}
                          </button>

                          <button
                            class="icon-btn"
                            title="Delete"
                            onclick="confirmDeleteEquipment('${equipment.id}')"
                          >
                            ${icon('trash')}
                          </button>

                        </div>

                      </td>

                    </tr>
                  `;

                }).join('')}

              </tbody>

            </table>

          </div>

          ${
            rows.length === 0
              ? emptyState(
                  'inbox',
                  'No equipment found',
                  'Try clearing your filters or adding a new equipment record.'
                )
              : ''
          }

        </div>

      </div>

    </div>
  `;
}

function onEquipSearch(value) {

  state.filters.equipSearch =
    value;

  const root =
    $('#view-root');

  root.innerHTML =
    renderEquipmentView();

  const input =
    $('.search-box input');

  if (input) {

    input.focus();

    input.setSelectionRange(
      value.length,
      value.length
    );
  }
}

function onEquipFilter(
  key,
  value
) {

  state.filters[key] =
    value;

  $('#view-root').innerHTML =
    renderEquipmentView();
}

/* ============================================================
   EQUIPMENT FORM
   ============================================================ */

function openEquipmentForm(id) {

  const editing =
    Boolean(id);

  const equipment =
    editing
      ? DB.equipment.find(
          e => e.id === id
        )
      : null;

  if (editing && !equipment) {
    toast(
      'Equipment record not found.',
      'bad'
    );

    return;
  }

  const categories =
    Object.keys(CATEGORY_ICON);

  openModal(`

    <div class="modal-head">

      <div>

        <h3>
          ${
            editing
              ? 'Edit Equipment'
              : 'Add Equipment'
          }
        </h3>

        <div class="modal-sub">
          ${
            editing
              ? equipment.id
              : 'A new equipment tag ID will be generated automatically.'
          }
        </div>

      </div>

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ${icon('x')}
      </button>

    </div>

    <form
      onsubmit="submitEquipmentForm(event, '${editing ? id : ''}')"
    >

      <div class="modal-body">

        <div class="field">

          <label>
            Equipment Name
          </label>

          <input
            type="text"
            id="f-name"
            required
            value="${
              editing
                ? esc(equipment.name)
                : ''
            }"
            placeholder="e.g. Desktop Computer"
          >

        </div>

        <div class="field-row">

          <div class="field">

            <label>
              Category
            </label>

            <select
              id="f-category"
              required
            >

              ${categories.map(category => `
                <option
                  value="${esc(category)}"
                  ${
                    editing &&
                    equipment.category === category
                      ? 'selected'
                      : ''
                  }
                >
                  ${esc(category)}
                </option>
              `).join('')}

            </select>

          </div>

          <div class="field">

            <label>
              Location
            </label>

            <select
              id="f-location"
              required
            >

              ${LOCATIONS.map(location => `
                <option
                  value="${esc(location)}"
                  ${
                    editing &&
                    equipment.location === location
                      ? 'selected'
                      : ''
                  }
                >
                  ${esc(location)}
                </option>
              `).join('')}

            </select>

          </div>

        </div>

        <div class="field-row">

          <div class="field">

            <label>
              Serial Number
            </label>

            <input
              type="text"
              id="f-serial"
              required
              value="${
                editing
                  ? esc(equipment.serial)
                  : ''
              }"
              placeholder="e.g. CEU-DT-001"
            >

          </div>

          <div class="field">

            <label>
              Status
            </label>

            <select id="f-status">

              ${[
                'Operational',
                'Under Repair',
                'Damaged',
                'Missing',
                'Decommissioned'
              ].map(status => `
                <option
                  value="${status}"
                  ${
                    editing &&
                    equipment.status === status
                      ? 'selected'
                      : ''
                  }
                >
                  ${status}
                </option>
              `).join('')}

            </select>

          </div>

        </div>

        <div class="field-row">

          <div class="field">

            <label>
              Condition
            </label>

            <select id="f-condition">

              ${[
                'Excellent',
                'Good',
                'Fair',
                'Needs Repair',
                'Damaged',
                'Missing'
              ].map(condition => `
                <option
                  value="${condition}"
                  ${
                    editing &&
                    equipment.condition === condition
                      ? 'selected'
                      : ''
                  }
                >
                  ${condition}
                </option>
              `).join('')}

            </select>

          </div>

          <div class="field">

            <label>
              Date Acquired
            </label>

            <input
              type="date"
              id="f-acquired"
              required
              value="${
                editing
                  ? equipment.dateAcquired
                  : todayISO()
              }"
            >

          </div>

        </div>

        <div class="field">

          <label>
            Last Maintenance
          </label>

          <input
            type="date"
            id="f-maint"
            required
            value="${
              editing
                ? equipment.lastMaintenance
                : todayISO()
            }"
          >

        </div>

        <div class="field">

          <label>
            Notes
          </label>

          <textarea
            id="f-notes"
            rows="4"
            placeholder="Additional equipment notes..."
          >${
            editing
              ? esc(equipment.notes || '')
              : ''
          }</textarea>

        </div>

      </div>

      <div class="modal-foot">

        <button
          type="button"
          class="btn btn-outline"
          onclick="closeModal()"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn-primary"
        >
          ${icon('check')}

          ${
            editing
              ? 'Save Changes'
              : 'Add Equipment'
          }

        </button>

      </div>

    </form>

  `);
}

function nextEquipmentId(
  location,
  category
) {

  const locationMatch =
    location.match(/(\d+)/);

  const locationCode =
    locationMatch
      ? `CL${locationMatch[1]}`
      : 'ICT';

  const categoryCode = {
    Desktop: 'DT',
    Monitor: 'MON',
    Printer: 'PRN',
    Camera: 'CAM',
    UPS: 'UPS',
    Network: 'NET'
  }[category] || 'EQ';

  const prefix =
    `EMS-${locationCode}-${categoryCode}-`;

  const existing =
    DB.equipment
      .filter(
        equipment =>
          equipment.id.startsWith(prefix)
      )
      .map(
        equipment =>
          parseInt(
            equipment.id.split('-').pop(),
            10
          )
      )
      .filter(
        Number.isFinite
      );

  const next =
    existing.length
      ? Math.max(...existing) + 1
      : 1;

  return (
    prefix +
    String(next).padStart(3, '0')
  );
}

function submitEquipmentForm(
  event,
  id
) {

  event.preventDefault();

  const data = {

    name:
      $('#f-name').value.trim(),

    category:
      $('#f-category').value,

    location:
      $('#f-location').value,

    serial:
      $('#f-serial').value.trim(),

    status:
      $('#f-status').value,

    condition:
      $('#f-condition').value,

    dateAcquired:
      $('#f-acquired').value,

    lastMaintenance:
      $('#f-maint').value,

    notes:
      $('#f-notes').value.trim()
  };

  if (id) {

    const equipment =
      DB.equipment.find(
        e => e.id === id
      );

    Object.assign(
      equipment,
      data
    );

    toast(
      `${data.name} updated.`,
      'good'
    );

  } else {

    const newId =
      nextEquipmentId(
        data.location,
        data.category
      );

    DB.equipment.push({
      id: newId,
      ...data
    });

    toast(
      `${data.name} added as ${newId}.`,
      'good'
    );
  }

  closeModal();

  navigate('equipment');
}

/* ============================================================
   EQUIPMENT DETAILS
   ============================================================ */

function openEquipmentDetails(id) {

  const equipment =
    DB.equipment.find(
      e => e.id === id
    );

  if (!equipment) return;

  const incidents =
    getIncidentsFor(id);

  const score =
    calcRisk(equipment);

  const band =
    riskBand(score);

  openModal(`

    <div class="modal-head">

      <div>

        <h3>
          Equipment Details
        </h3>

        <div class="modal-sub">
          ${esc(equipment.id)}
        </div>

      </div>

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ${icon('x')}
      </button>

    </div>

    <div class="modal-body">

      <div class="detail-hero">

        <div class="detail-icon">
          ${icon(
            CATEGORY_ICON[
              equipment.category
            ] || 'box'
          )}
        </div>

        <div>

          <div class="eyebrow">
            ${esc(equipment.category)}
          </div>

          <h2>
            ${esc(equipment.name)}
          </h2>

          <div class="detail-id">
            ${esc(equipment.id)}
          </div>

        </div>

      </div>

      <div class="detail-grid">

        <div class="detail-item">
          <span>Location</span>
          <strong>${esc(equipment.location)}</strong>
        </div>

        <div class="detail-item">
          <span>Serial Number</span>
          <strong>${esc(equipment.serial)}</strong>
        </div>

        <div class="detail-item">
          <span>Status</span>
          <strong>${badge(equipment.status)}</strong>
        </div>

        <div class="detail-item">
          <span>Condition</span>
          <strong>${esc(equipment.condition)}</strong>
        </div>

        <div class="detail-item">
          <span>Date Acquired</span>
          <strong>${fmtDate(equipment.dateAcquired)}</strong>
        </div>

        <div class="detail-item">
          <span>Last Maintenance</span>
          <strong>${fmtDate(equipment.lastMaintenance)}</strong>
        </div>

      </div>

      <div class="risk-summary">

        <div>

          <div class="eyebrow">
            PREDICTIVE RISK SCORE
          </div>

          <h3>
            ${score}/100
          </h3>

        </div>

        <div>
          ${badge(band.label)}
        </div>

      </div>

      ${
        equipment.notes
          ? `
            <div class="field">

              <label>
                Notes
              </label>

              <div class="readonly-box">
                ${esc(equipment.notes)}
              </div>

            </div>
          `
          : ''
      }

      <div class="field">

        <label>
          Incident History
        </label>

        ${
          incidents.length
            ? `
              <div class="mini-list">

                ${incidents.map(incident => `
                  <div class="mini-list-row">

                    <div>
                      <strong>
                        ${esc(incident.id)}
                      </strong>

                      <span>
                        ${fmtDate(
                          incident.dateReported
                        )}
                      </span>
                    </div>

                    <div>
                      ${badge(
                        incident.status
                      )}
                    </div>

                  </div>
                `).join('')}

              </div>
            `
            : `
              <div class="readonly-box">
                No incident reports recorded.
              </div>
            `
        }

      </div>

    </div>

    <div class="modal-foot">

      <button
        class="btn btn-outline"
        onclick="closeModal()"
      >
        Close
      </button>

      <button
        class="btn btn-primary"
        onclick="closeModal(); openQrModal('${equipment.id}')"
      >
        ${icon('qrcode')}
        View QR Tag
      </button>

    </div>

  `);
}

/* ============================================================
   DELETE EQUIPMENT
   ============================================================ */

function confirmDeleteEquipment(id) {

  const equipment =
    DB.equipment.find(
      e => e.id === id
    );

  if (!equipment) return;

  openModal(`

    <div class="modal-head">

      <div>

        <h3>
          Remove equipment?
        </h3>

        <div class="modal-sub">
          This action cannot be undone in the demo database.
        </div>

      </div>

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ${icon('x')}
      </button>

    </div>

    <div class="modal-body">

      ${banner(
        'amber',
        'alert',
        'Confirm removal',
        `You are about to remove ${equipment.name} (${equipment.id}) from the inventory.`
      )}

      <p class="hint">
        Linked incident history remains available
        in the current demo session.
      </p>

    </div>

    <div class="modal-foot">

      <button
        class="btn btn-outline"
        onclick="closeModal()"
      >
        Cancel
      </button>

      <button
        class="btn btn-danger"
        onclick="deleteEquipment('${id}')"
      >
        ${icon('trash')}
        Remove
      </button>

    </div>

  `);
}

function deleteEquipment(id) {

  DB.equipment =
    DB.equipment.filter(
      e => e.id !== id
    );

  closeModal();

  toast(
    'Equipment removed.',
    'bad'
  );

  navigate('equipment');
}

/* ============================================================
   QR TAG
   ============================================================ */

function qrPatternSVG(
  seed,
  size = 150
) {

  const modules = 15;

  const cell =
    size / modules;

  let hash = 0;

  for (
    let i = 0;
    i < seed.length;
    i++
  ) {
    hash =
      (
        hash * 31 +
        seed.charCodeAt(i)
      ) >>> 0;
  }

  function rnd() {

    hash =
      (
        hash * 1664525 +
        1013904223
      ) >>> 0;

    return (
      hash /
      4294967295
    );
  }

  let rects = '';

  function finder(
    offsetX,
    offsetY
  ) {

    return `
      <rect
        x="${offsetX}"
        y="${offsetY}"
        width="${7 * cell}"
        height="${7 * cell}"
        fill="#14181f"
      />

      <rect
        x="${offsetX + cell}"
        y="${offsetY + cell}"
        width="${5 * cell}"
        height="${5 * cell}"
        fill="#fff"
      />

      <rect
        x="${offsetX + 2 * cell}"
        y="${offsetY + 2 * cell}"
        width="${3 * cell}"
        height="${3 * cell}"
        fill="#14181f"
      />
    `;
  }

  for (
    let y = 0;
    y < modules;
    y++
  ) {

    for (
      let x = 0;
      x < modules;
      x++
    ) {

      const inFinder =
        (
          x < 7 &&
          y < 7
        ) ||
        (
          x > modules - 8 &&
          y < 7
        ) ||
        (
          x < 7 &&
          y > modules - 8
        );

      if (inFinder) {
        continue;
      }

      if (rnd() < 0.46) {

        rects += `
          <rect
            x="${(x * cell).toFixed(1)}"
            y="${(y * cell).toFixed(1)}"
            width="${cell.toFixed(1)}"
            height="${cell.toFixed(1)}"
            fill="#14181f"
          />
        `;
      }
    }
  }

  rects += finder(0, 0);

  rects += finder(
    (modules - 7) * cell,
    0
  );

  rects += finder(
    0,
    (modules - 7) * cell
  );

  return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Equipment QR identifier"
    >

      <rect
        width="${size}"
        height="${size}"
        fill="#fff"
      />

      ${rects}

    </svg>
  `;
}

function openQrModal(id) {

  const equipment =
    DB.equipment.find(
      e => e.id === id
    );

  if (!equipment) return;

  openModal(`

    <div class="modal-head">

      <div>

        <h3>
          Equipment Tag
        </h3>

        <div class="modal-sub">
          Printable identifier for physical labeling
        </div>

      </div>

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ${icon('x')}
      </button>

    </div>

    <div class="modal-body">

      <div class="qr-tag-card">

        <div class="qr-pattern">
          ${qrPatternSVG(equipment.id)}
        </div>

        <div class="qr-meta">

          <div class="qm-name">
            ${esc(equipment.name)}
          </div>

          <div class="qm-id">
            ${esc(equipment.id)}
          </div>

          <div class="kv-list">

            <div class="kv-row">
              <span class="k">Location</span>
              <span class="v">
                ${esc(equipment.location)}
              </span>
            </div>

            <div class="kv-row">
              <span class="k">Serial No.</span>
              <span class="v">
                ${esc(equipment.serial)}
              </span>
            </div>

            <div class="kv-row">
              <span class="k">Status</span>
              <span class="v">
                ${badge(equipment.status)}
              </span>
            </div>

          </div>

        </div>

      </div>

      <p class="hint">
        The current pattern is a visual equipment identifier
        for the frontend prototype. A real scannable QR code
        can be connected when the backend/database integration
        is implemented.
      </p>

    </div>

    <div class="modal-foot">

      <button
        class="btn btn-outline"
        onclick="closeModal()"
      >
        Close
      </button>

      <button
        class="btn btn-primary"
        onclick="printQrTag('${equipment.id}')"
      >
        ${icon('file')}
        Print Tag
      </button>

    </div>

  `);
}

function printQrTag(id) {

  const equipment =
    DB.equipment.find(
      e => e.id === id
    );

  if (!equipment) return;

  const qr =
    qrPatternSVG(
      equipment.id,
      220
    );

  const printWindow =
    window.open(
      '',
      '_blank',
      'width=600,height=700'
    );

  if (!printWindow) {

    toast(
      'Please allow pop-ups to print the equipment tag.',
      'bad'
    );

    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <title>
        ${esc(equipment.id)}
      </title>

      <style>

        body {
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
        }

        .tag {
          width: 420px;
          border: 1px solid #ddd;
          padding: 28px;
          text-align: center;
        }

        svg {
          display: block;
          margin: 0 auto 20px;
        }

        h1 {
          font-size: 20px;
          margin: 0 0 6px;
        }

        p {
          color: #666;
          margin: 5px 0;
        }

        .id {
          font-family: monospace;
          font-weight: bold;
          margin-top: 12px;
        }

      </style>

    </head>

    <body>

      <div class="tag">

        ${qr}

        <h1>
          ${esc(equipment.name)}
        </h1>

        <p>
          ${esc(equipment.location)}
        </p>

        <p class="id">
          ${esc(equipment.id)}
        </p>

      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>

    </body>

    </html>
  `);

  printWindow.document.close();
}

/* ============================================================
   ADMIN — INCIDENT REPORTS
   ============================================================ */

function renderIncidentsView() {

  const f =
    state.filters;

  const rows =
    DB.incidents
      .filter(incident => {

        if (
          f.incidentStatus !== 'all' &&
          incident.status !== f.incidentStatus
        ) {
          return false;
        }

        if (
          f.incidentPriority !== 'all' &&
          incident.priority !== f.incidentPriority
        ) {
          return false;
        }

        if (f.incidentSearch) {

          const q =
            f.incidentSearch.toLowerCase();

          const equipment =
            DB.equipment.find(
              e =>
                e.id ===
                incident.equipmentId
            );

          const searchable = [
            incident.id,
            incident.reportedByName,
            incident.reportedByCourse,
            incident.category,
            incident.description,
            equipment?.name,
            equipment?.location
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!searchable.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.dateReported) -
          new Date(a.dateReported)
      );

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            SERVICE DESK
          </div>

          <h2>
            Incident Reports
          </h2>

          <p>
            Review, prioritize, and resolve
            reported equipment issues.
          </p>

        </div>

      </div>

      <div class="toolbar">

        <div class="toolbar-left">

          <div class="search-box">

            ${icon('search')}

            <input
              type="text"
              placeholder="Search reports, equipment, or reporter..."
              value="${esc(f.incidentSearch)}"
              oninput="onIncidentSearch(this.value)"
            >

          </div>

          <select
            class="select-filter"
            onchange="onIncidentFilter('incidentStatus', this.value)"
          >

            <option value="all">
              All statuses
            </option>

            ${[
              'Pending',
              'In Progress',
              'Resolved',
              'Rejected'
            ].map(status => `
              <option
                value="${status}"
                ${f.incidentStatus === status ? 'selected' : ''}
              >
                ${status}
              </option>
            `).join('')}

          </select>

          <select
            class="select-filter"
            onchange="onIncidentFilter('incidentPriority', this.value)"
          >

            <option value="all">
              All priorities
            </option>

            ${[
              'Low',
              'Medium',
              'High',
              'Critical'
            ].map(priority => `
              <option
                value="${priority}"
                ${f.incidentPriority === priority ? 'selected' : ''}
              >
                ${priority}
              </option>
            `).join('')}

          </select>

        </div>

      </div>

      <div class="card">

        <div class="card-body flush">

          <div class="table-wrap">

            <table class="dtable">

              <thead>

                <tr>
                  <th>Report</th>
                  <th>Equipment</th>
                  <th>Reporter</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                ${rows.map(incident => {

                  const equipment =
                    DB.equipment.find(
                      e =>
                        e.id ===
                        incident.equipmentId
                    );

                  return `
                    <tr>

                      <td>
                        ${tagChip(incident.id)}
                      </td>

                      <td>

                        <div class="cell-strong">
                          ${esc(
                            equipment?.name ||
                            'Unknown equipment'
                          )}
                        </div>

                        <div class="cell-sub">
                          ${esc(
                            equipment?.location || ''
                          )}
                        </div>

                      </td>

                      <td>

                        <div class="cell-strong">
                          ${esc(
                            incident.reportedByName
                          )}
                        </div>

                        <div class="cell-sub">
                          ${esc(
                            incident.reportedByCourse
                          )}
                        </div>

                      </td>

                      <td>
                        ${fmtDate(
                          incident.dateReported
                        )}
                      </td>

                      <td>
                        ${esc(
                          incident.category
                        )}
                      </td>

                      <td>
                        ${badge(
                          incident.priority
                        )}
                      </td>

                      <td>
                        ${badge(
                          incident.status
                        )}
                      </td>

                      <td>

                        <button
                          class="icon-btn"
                          title="View report"
                          onclick="openIncidentModal('${incident.id}')"
                        >
                          ${icon('eye')}
                        </button>

                      </td>

                    </tr>
                  `;

                }).join('')}

              </tbody>

            </table>

          </div>

          ${
            rows.length === 0
              ? emptyState(
                  'inbox',
                  'No incident reports found',
                  'Try adjusting your filters.'
                )
              : ''
          }

        </div>

      </div>

    </div>
  `;
}

function onIncidentSearch(value) {

  state.filters.incidentSearch =
    value;

  $('#view-root').innerHTML =
    renderIncidentsView();

  const input =
    $('.search-box input');

  if (input) {

    input.focus();

    input.setSelectionRange(
      value.length,
      value.length
    );
  }
}

function onIncidentFilter(
  key,
  value
) {

  state.filters[key] =
    value;

  $('#view-root').innerHTML =
    renderIncidentsView();
}

/* ============================================================
   INCIDENT MODAL
   ============================================================ */

function openIncidentModal(id) {

  const incident =
    DB.incidents.find(
      i => i.id === id
    );

  if (!incident) return;

  const equipment =
    DB.equipment.find(
      e =>
        e.id ===
        incident.equipmentId
    );

  const isAdmin =
    state.user?.role === 'admin';

  openModal(`

    <div class="modal-head">

      <div>

        <h3>
          Incident Report
        </h3>

        <div class="modal-sub">
          ${esc(incident.id)}
        </div>

      </div>

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ${icon('x')}
      </button>

    </div>

    <div class="modal-body">

      <div class="incident-hero">

        <div class="incident-status">
          ${badge(incident.status)}
        </div>

        <div>

          <div class="eyebrow">
            ${esc(incident.category)}
          </div>

          <h2>
            ${
              equipment
                ? esc(equipment.name)
                : 'Unknown equipment'
            }
          </h2>

          <div class="detail-id">
            ${
              equipment
                ? esc(equipment.id)
                : ''
            }
          </div>

        </div>

      </div>

      <div class="detail-grid">

        <div class="detail-item">
          <span>Reporter</span>
          <strong>
            ${esc(incident.reportedByName)}
          </strong>
        </div>

        <div class="detail-item">
          <span>Course / Section</span>
          <strong>
            ${esc(incident.reportedByCourse)}
          </strong>
        </div>

        <div class="detail-item">
          <span>Date Reported</span>
          <strong>
            ${fmtDate(incident.dateReported)}
          </strong>
        </div>

        <div class="detail-item">
          <span>Priority</span>
          <strong>
            ${badge(incident.priority)}
          </strong>
        </div>

        <div class="detail-item">
          <span>Location</span>
          <strong>
            ${esc(
              equipment?.location || '—'
            )}
          </strong>
        </div>

        <div class="detail-item">
          <span>Resolution Date</span>
          <strong>
            ${fmtDate(
              incident.resolvedDate
            )}
          </strong>
        </div>

      </div>

      <div class="field">

        <label>
          Problem Description
        </label>

        <div class="readonly-box">
          ${esc(incident.description)}
        </div>

      </div>

      ${
        isAdmin
          ? `
            <div class="field-row">

              <div class="field">

                <label>
                  Status
                </label>

                <select id="ui-status">

                  ${[
                    'Pending',
                    'In Progress',
                    'Resolved',
                    'Rejected'
                  ].map(status => `
                    <option
                      value="${status}"
                      ${
                        incident.status === status
                          ? 'selected'
                          : ''
                      }
                    >
                      ${status}
                    </option>
                  `).join('')}

                </select>

              </div>

              <div class="field">

                <label>
                  Priority
                </label>

                <select id="ui-priority">

                  ${[
                    'Low',
                    'Medium',
                    'High',
                    'Critical'
                  ].map(priority => `
                    <option
                      value="${priority}"
                      ${
                        incident.priority === priority
                          ? 'selected'
                          : ''
                      }
                    >
                      ${priority}
                    </option>
                  `).join('')}

                </select>

              </div>

            </div>

            <div class="field">

              <label>
                Remarks / Resolution Notes
              </label>

              <textarea
                id="ui-remarks"
                rows="4"
                placeholder="e.g. Replaced faulty power cable..."
              >${esc(
                incident.remarks || ''
              )}</textarea>

            </div>
          `
          : incident.remarks
            ? `
              <div class="field">

                <label>
                  Technician Remarks
                </label>

                <div class="readonly-box">
                  ${esc(incident.remarks)}
                </div>

              </div>
            `
            : ''
      }

    </div>

    <div class="modal-foot">

      <button
        class="btn btn-outline"
        onclick="closeModal()"
      >
        Close
      </button>

      ${
        isAdmin
          ? `
            <button
              class="btn btn-primary"
              onclick="saveIncidentUpdate('${incident.id}')"
            >
              ${icon('check')}
              Save Update
            </button>
          `
          : ''
      }

    </div>

  `);
}

function saveIncidentUpdate(id) {

  const incident =
    DB.incidents.find(
      i => i.id === id
    );

  if (!incident) return;

  incident.status =
    $('#ui-status').value;

  incident.priority =
    $('#ui-priority').value;

  incident.remarks =
    $('#ui-remarks').value.trim();

  if (
    incident.status === 'Resolved' ||
    incident.status === 'Rejected'
  ) {

    incident.resolvedDate =
      incident.resolvedDate ||
      todayISO();

  } else {

    incident.resolvedDate =
      null;
  }

  closeModal();

  toast(
    `${id} updated to ${incident.status}.`,
    'good'
  );

  navigate(state.view);
}

/* ============================================================
   STUDENT — BROWSE EQUIPMENT
   ============================================================ */

function renderBrowseView() {

  const available =
    DB.equipment.filter(
      e =>
        e.status !== 'Decommissioned'
    );

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            ICT RESOURCES
          </div>

          <h2>
            Browse Equipment
          </h2>

          <p>
            View the current availability and status
            of laboratory ICT resources.
          </p>

        </div>

      </div>

      <div class="toolbar">

        <div class="toolbar-left">

          <div class="search-box">

            ${icon('search')}

            <input
              type="text"
              id="student-equipment-search"
              placeholder="Search equipment or location..."
              oninput="filterStudentEquipment(this.value)"
            >

          </div>

        </div>

      </div>

      <div
        class="equipment-grid"
        id="student-equipment-grid"
      >

        ${renderStudentEquipmentCards(
          available
        )}

      </div>

    </div>
  `;
}

function renderStudentEquipmentCards(
  equipmentList
) {

  if (!equipmentList.length) {

    return emptyState(
      'box',
      'No equipment found',
      'Try searching for another equipment name or location.'
    );
  }

  return equipmentList.map(
    equipment => {

      const score =
        calcRisk(equipment);

      return `
        <div class="equip-card">

          <div class="ec-top">

            <div class="ec-icon">
              ${icon(
                CATEGORY_ICON[
                  equipment.category
                ] || 'box'
              )}
            </div>

            ${badge(
              equipment.status
            )}

          </div>

          <div class="ec-body">

            <div class="eyebrow">
              ${esc(equipment.category)}
            </div>

            <h3>
              ${esc(equipment.name)}
            </h3>

            <div class="ec-meta">

              <div>
                ${icon('box')}
                ${esc(equipment.id)}
              </div>

              <div>
                ${icon('grid')}
                ${esc(equipment.location)}
              </div>

            </div>

          </div>

          <div class="ec-foot">

            <div>
              <span class="ec-risk-label">
                Risk
              </span>

              <strong>
                ${score}/100
              </strong>
            </div>

            <button
              class="btn btn-outline btn-sm"
              onclick="openStudentEquipment('${equipment.id}')"
            >
              View
            </button>

          </div>

        </div>
      `;
    }
  ).join('');
}

function filterStudentEquipment(
  value
) {

  const q =
    value.trim().toLowerCase();

  const filtered =
    DB.equipment.filter(
      equipment => {

        if (
          equipment.status ===
          'Decommissioned'
        ) {
          return false;
        }

        const searchable = [
          equipment.name,
          equipment.id,
          equipment.location,
          equipment.category,
          equipment.status
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(q);
      }
    );

  $('#student-equipment-grid').innerHTML =
    renderStudentEquipmentCards(
      filtered
    );
}

function openStudentEquipment(id) {

  const equipment =
    DB.equipment.find(
      e => e.id === id
    );

  if (!equipment) return;

  const score =
    calcRisk(equipment);

  openModal(`

    <div class="modal-head">

      <div>

        <h3>
          Equipment Information
        </h3>

        <div class="modal-sub">
          ${esc(equipment.id)}
        </div>

      </div>

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ${icon('x')}
      </button>

    </div>

    <div class="modal-body">

      <div class="detail-hero">

        <div class="detail-icon">
          ${icon(
            CATEGORY_ICON[
              equipment.category
            ] || 'box'
          )}
        </div>

        <div>

          <div class="eyebrow">
            ${esc(equipment.category)}
          </div>

          <h2>
            ${esc(equipment.name)}
          </h2>

        </div>

      </div>

      <div class="detail-grid">

        <div class="detail-item">
          <span>Equipment ID</span>
          <strong>
            ${esc(equipment.id)}
          </strong>
        </div>

        <div class="detail-item">
          <span>Location</span>
          <strong>
            ${esc(equipment.location)}
          </strong>
        </div>

        <div class="detail-item">
          <span>Status</span>
          <strong>
            ${badge(equipment.status)}
          </strong>
        </div>

        <div class="detail-item">
          <span>Condition</span>
          <strong>
            ${esc(equipment.condition)}
          </strong>
        </div>

      </div>

      ${
        equipment.status !== 'Operational'
          ? banner(
              'amber',
              'alert',
              'This equipment is currently unavailable',
              'Please select another operational unit or report the issue to the ICT laboratory.'
            )
          : banner(
              'teal',
              'check',
              'Equipment is operational',
              'This unit is currently recorded as available for laboratory use.'
            )
      }

    </div>

    <div class="modal-foot">

      <button
        class="btn btn-outline"
        onclick="closeModal()"
      >
        Close
      </button>

      <button
        class="btn btn-primary"
        onclick="closeModal(); navigate('report', {presetEquipId:'${equipment.id}'})"
      >
        ${icon('flag')}
        Report an Issue
      </button>

    </div>

  `);
}

/* ============================================================
   STUDENT — REPORT ISSUE
   ============================================================ */

function renderReportView() {

  const user =
    state.user;

  const selected =
    state.presetEquipId;

  const operational =
    DB.equipment.filter(
      e =>
        e.status !==
        'Decommissioned'
    );

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            SERVICE DESK
          </div>

          <h2>
            Report an Issue
          </h2>

          <p>
            Submit an equipment issue for review
            by the ICT laboratory administrator.
          </p>

        </div>

      </div>

      <div class="card report-card">

        <form
          onsubmit="submitIncidentForm(event)"
        >

          <div class="card-head">

            <div>

              <h3>
                Incident Information
              </h3>

              <div class="card-sub">
                Please provide accurate details about the issue.
              </div>

            </div>

          </div>

          <div class="card-body">

            <div class="field">

              <label>
                Equipment
              </label>

              <select
                id="rf-equip"
                required
              >

                <option value="">
                  Select equipment
                </option>

                ${operational.map(
                  equipment => `
                    <option
                      value="${esc(equipment.id)}"
                      ${
                        selected === equipment.id
                          ? 'selected'
                          : ''
                      }
                    >
                      ${esc(equipment.id)}
                      —
                      ${esc(equipment.name)}
                      ·
                      ${esc(equipment.location)}
                    </option>
                  `
                ).join('')}

              </select>

            </div>

            <div class="field-row">

              <div class="field">

                <label>
                  Issue Category
                </label>

                <select
                  id="rf-category"
                  required
                >

                  <option value="">
                    Select category
                  </option>

                  <option>
                    Malfunctioning
                  </option>

                  <option>
                    Damaged
                  </option>

                  <option>
                    Missing
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </div>

              <div class="field">

                <label>
                  Date Reported
                </label>

                <input
                  type="date"
                  id="rf-date"
                  value="${todayISO()}"
                  required
                >

              </div>

            </div>

            <div class="field">

              <label>
                Problem Description
              </label>

              <textarea
                id="rf-desc"
                rows="6"
                required
                placeholder="Describe what happened. Include error messages, sounds, timing, or other useful details."
              ></textarea>

            </div>

            <div class="field-row">

              <div class="field">

                <label>
                  Your Name
                </label>

                <input
                  type="text"
                  id="rf-name"
                  value="${esc(user.name)}"
                  required
                >

              </div>

              <div class="field">

                <label>
                  Section / Course
                </label>

                <input
                  type="text"
                  id="rf-course"
                  value="${esc(user.course || '')}"
                  required
                >

              </div>

            </div>

            ${banner(
              'blue',
              'flag',
              'Before submitting',
              'Please verify the equipment, issue category, and description before sending the report.'
            )}

          </div>

          <div class="modal-foot">

            <button
              type="button"
              class="btn btn-outline"
              onclick="navigate('dashboard')"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              ${icon('flag')}
              Submit Report
            </button>

          </div>

        </form>

      </div>

    </div>
  `;
}

function nextIncidentId() {

  const numbers =
    DB.incidents
      .map(
        incident =>
          parseInt(
            incident.id
              .replace('INC-', ''),
            10
          )
      )
      .filter(
        Number.isFinite
      );

  const next =
    numbers.length
      ? Math.max(...numbers) + 1
      : 1;

  return (
    'INC-' +
    String(next).padStart(4, '0')
  );
}

function submitIncidentForm(event) {

  event.preventDefault();

  const equipmentId =
    $('#rf-equip').value;

  if (!equipmentId) {

    toast(
      'Please select the equipment first.',
      'bad'
    );

    return;
  }

  const description =
    $('#rf-desc').value.trim();

  if (!description) {

    toast(
      'Please describe the problem.',
      'bad'
    );

    return;
  }

  const rec = {

    id: nextIncidentId(),

    equipmentId,

    reportedByUserId:
      state.user.id,

    reportedByName:
      $('#rf-name').value.trim(),

    reportedByCourse:
      $('#rf-course').value.trim(),

    dateReported:
      $('#rf-date').value ||
      todayISO(),

    category:
      $('#rf-category').value,

    description,

    status: 'Pending',

    priority: 'Medium',

    remarks: '',

    resolvedDate: null
  };

  DB.incidents.push(rec);

  state.presetEquipId = null;

  toast(
    `Report ${rec.id} submitted successfully.`,
    'good'
  );

  navigate('myreports');
}

/* ============================================================
   STUDENT — MY REPORTS
   ============================================================ */

function renderMyReportsView() {

  const mine =
    DB.incidents
      .filter(
        incident =>
          incident.reportedByUserId ===
          state.user.id
      )
      .sort(
        (a, b) =>
          new Date(b.dateReported) -
          new Date(a.dateReported)
      );

  const pending =
    mine.filter(
      i => i.status === 'Pending'
    ).length;

  const progress =
    mine.filter(
      i => i.status === 'In Progress'
    ).length;

  const resolved =
    mine.filter(
      i => i.status === 'Resolved'
    ).length;

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            SERVICE DESK
          </div>

          <h2>
            My Reports
          </h2>

          <p>
            Track the status and resolution of
            your submitted equipment reports.
          </p>

        </div>

        <button
          class="btn btn-primary"
          onclick="navigate('report')"
        >
          ${icon('flag')}
          New Report
        </button>

      </div>

      <div class="stat-grid">

        ${statCard(
          'flag',
          'Pending',
          pending,
          'Awaiting review',
          'amber'
        )}

        ${statCard(
          'activity',
          'In Progress',
          progress,
          'Being addressed',
          'blue'
        )}

        ${statCard(
          'check',
          'Resolved',
          resolved,
          'Completed reports',
          'teal'
        )}

      </div>

      <div class="card">

        <div class="card-body flush">

          ${
            mine.length === 0
              ? emptyState(
                  'inbox',
                  'No reports submitted yet',
                  'Reports you file will appear here with live status updates.'
                )
              : `
                <div class="table-wrap">

                  <table class="dtable">

                    <thead>

                      <tr>
                        <th>Report</th>
                        <th>Equipment</th>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th></th>
                      </tr>

                    </thead>

                    <tbody>

                      ${mine.map(
                        incident => {

                          const equipment =
                            DB.equipment.find(
                              e =>
                                e.id ===
                                incident.equipmentId
                            );

                          return `
                            <tr>

                              <td>
                                ${tagChip(
                                  incident.id
                                )}
                              </td>

                              <td>

                                <div class="cell-strong">
                                  ${
                                    equipment
                                      ? esc(
                                          equipment.name
                                        )
                                      : '—'
                                  }
                                </div>

                                <div class="cell-sub">
                                  ${
                                    equipment
                                      ? esc(
                                          equipment.location
                                        )
                                      : ''
                                  }
                                </div>

                              </td>

                              <td>
                                ${fmtDate(
                                  incident.dateReported
                                )}
                              </td>

                              <td>
                                ${esc(
                                  incident.category
                                )}
                              </td>

                              <td>
                                ${badge(
                                  incident.status
                                )}
                              </td>

                              <td>

                                <button
                                  class="icon-btn"
                                  title="View report"
                                  onclick="openIncidentModal('${incident.id}')"
                                >
                                  ${icon('eye')}
                                </button>

                              </td>

                            </tr>
                          `;

                        }
                      ).join('')}

                    </tbody>

                  </table>

                </div>
              `
          }

        </div>

      </div>

    </div>
  `;
}

/* ============================================================
   ADMIN — RISK ANALYTICS
   ============================================================ */

function renderRiskView() {

  const risks =
    DB.equipment
      .filter(
        equipment =>
          equipment.status !==
          'Decommissioned'
      )
      .map(
        equipment => ({
          equipment,
          score:
            calcRisk(equipment)
        })
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      );

  const bands = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  };

  risks.forEach(
    risk =>
      bands[
        riskBand(risk.score).label
      ]++
  );

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            PREDICTIVE MAINTENANCE
          </div>

          <h2>
            Risk Analytics
          </h2>

          <p>
            Identify equipment that may require
            priority maintenance attention.
          </p>

        </div>

      </div>

      ${banner(
        'amber',
        'activity',
        'How the risk score is calculated',
        'The prototype blends incident frequency, equipment age, maintenance staleness, and current equipment status into a 0–100 weighted risk index.'
      )}

      <div class="stat-grid">

        ${statCard(
          'alert',
          'Critical',
          bands.Critical,
          'Priority attention',
          'red'
        )}

        ${statCard(
          'activity',
          'High',
          bands.High,
          'Monitor closely',
          'amber'
        )}

        ${statCard(
          'grid',
          'Medium',
          bands.Medium,
          'Regular monitoring',
          'blue'
        )}

        ${statCard(
          'check',
          'Low',
          bands.Low,
          'Lower current risk',
          'teal'
        )}

      </div>

      <div class="card">

        <div class="card-head">

          <div>

            <h3>
              Equipment Risk Ranking
            </h3>

            <div class="card-sub">
              Highest-risk units are shown first.
            </div>

          </div>

        </div>

        <div class="card-body flush">

          ${renderRiskTable()}

        </div>

      </div>

    </div>
  `;
}

function renderRiskTable(
  limit = Infinity
) {

  const risks =
    DB.equipment
      .filter(
        e =>
          e.status !==
          'Decommissioned'
      )
      .map(
        equipment => ({
          equipment,
          score:
            calcRisk(equipment)
        })
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(0, limit);

  return `
    <div class="table-wrap">

      <table class="dtable">

        <thead>

          <tr>
            <th>Equipment</th>
            <th>Location</th>
            <th>Status</th>
            <th>Risk Score</th>
            <th>Last Maintenance</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${risks.map(
            ({ equipment, score }) => `
              <tr>

                <td>

                  <div class="cell-strong">
                    ${esc(
                      equipment.name
                    )}
                  </div>

                  <div class="cell-sub">
                    ${tagChip(
                      equipment.id
                    )}
                  </div>

                </td>

                <td>
                  ${esc(
                    equipment.location
                  )}
                </td>

                <td>
                  ${badge(
                    equipment.status
                  )}
                </td>

                <td>
                  ${riskBar(score)}
                </td>

                <td>
                  ${fmtDate(
                    equipment.lastMaintenance
                  )}
                </td>

                <td>

                  <button
                    class="icon-btn"
                    onclick="openEquipmentDetails('${equipment.id}')"
                    title="View equipment"
                  >
                    ${icon('eye')}
                  </button>

                </td>

              </tr>
            `
          ).join('')}

        </tbody>

      </table>

    </div>
  `;
}

/* ============================================================
   ADMIN — REPORTS
   ============================================================ */

function renderReportsView() {

  const total =
    DB.equipment.length;

  const incidents =
    DB.incidents.length;

  const resolved =
    DB.incidents.filter(
      i =>
        i.status === 'Resolved'
    ).length;

  const operational =
    DB.equipment.filter(
      e =>
        e.status === 'Operational'
    ).length;

  return `
    <div class="view">

      <div class="view-header">

        <div>

          <div class="eyebrow">
            DOCUMENTATION
          </div>

          <h2>
            Reports & Export
          </h2>

          <p>
            Generate a printable overview of the
            current equipment monitoring records.
          </p>

        </div>

        <button
          class="btn btn-primary"
          onclick="printSystemReport()"
        >
          ${icon('file')}
          Print Report
        </button>

      </div>

      <div class="stat-grid">

        ${statCard(
          'box',
          'Equipment Records',
          total,
          'Current inventory',
          'teal'
        )}

        ${statCard(
          'flag',
          'Incident Reports',
          incidents,
          'All recorded reports',
          'amber'
        )}

        ${statCard(
          'check',
          'Resolved',
          resolved,
          'Completed incidents',
          'blue'
        )}

        ${statCard(
          'activity',
          'Operational',
          operational,
          'Available equipment',
          'teal'
        )}

      </div>

      <div class="card">

        <div class="card-head">

          <div>

            <h3>
              Report Contents
            </h3>

            <div class="card-sub">
              The printable report includes the following sections.
            </div>

          </div>

        </div>

        <div class="card-body">

          <div class="report-outline">

            <div>
              ${icon('box')}

              <div>
                <strong>
                  Equipment Inventory
                </strong>

                <span>
                  Equipment IDs, names, locations,
                  statuses, and maintenance dates.
                </span>
              </div>
            </div>

            <div>
              ${icon('flag')}

              <div>
                <strong>
                  Incident Summary
                </strong>

                <span>
                  Report categories, priorities,
                  statuses, and resolution information.
                </span>
              </div>
            </div>

            <div>
              ${icon('activity')}

              <div>
                <strong>
                  Predictive Risk Overview
                </strong>

                <span>
                  Current weighted equipment risk
                  scores and risk classifications.
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  `;
}

function printSystemReport() {

  const risks =
    DB.equipment
      .filter(
        e =>
          e.status !==
          'Decommissioned'
      )
      .map(
        e => ({
          equipment: e,
          score: calcRisk(e)
        })
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      );

  const printWindow =
    window.open(
      '',
      '_blank',
      'width=1000,height=800'
    );

  if (!printWindow) {

    toast(
      'Please allow pop-ups to print the report.',
      'bad'
    );

    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <title>
        EMS Equipment Monitoring Report
      </title>

      <style>

        body {
          font-family: Arial, sans-serif;
          color: #181a1f;
          margin: 40px;
        }

        h1 {
          margin-bottom: 4px;
        }

        h2 {
          margin-top: 30px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }

        .meta {
          color: #666;
          margin-bottom: 24px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        th,
        td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        th {
          background: #f5f4f0;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .summary-card {
          border: 1px solid #ddd;
          padding: 15px;
        }

        .summary-card strong {
          display: block;
          font-size: 22px;
          margin-top: 4px;
        }

      </style>

    </head>

    <body>

      <h1>
        Equipment Monitoring System
      </h1>

      <div class="meta">
        CEU Malolos · ICT Resources
        <br>
        Generated:
        ${new Date().toLocaleString()}
      </div>

      <div class="summary">

        <div class="summary-card">
          Total Equipment
          <strong>
            ${DB.equipment.length}
          </strong>
        </div>

        <div class="summary-card">
          Operational
          <strong>
            ${
              DB.equipment.filter(
                e =>
                  e.status ===
                  'Operational'
              ).length
            }
          </strong>
        </div>

        <div class="summary-card">
          Incidents
          <strong>
            ${DB.incidents.length}
          </strong>
        </div>

        <div class="summary-card">
          Resolved
          <strong>
            ${
              DB.incidents.filter(
                i =>
                  i.status ===
                  'Resolved'
              ).length
            }
          </strong>
        </div>

      </div>

      <h2>
        Equipment Inventory
      </h2>

      <table>

        <thead>

          <tr>
            <th>Tag ID</th>
            <th>Equipment</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
            <th>Maintenance</th>
          </tr>

        </thead>

        <tbody>

          ${DB.equipment.map(
            equipment => `
              <tr>

                <td>
                  ${esc(equipment.id)}
                </td>

                <td>
                  ${esc(equipment.name)}
                </td>

                <td>
                  ${esc(equipment.category)}
                </td>

                <td>
                  ${esc(equipment.location)}
                </td>

                <td>
                  ${esc(equipment.status)}
                </td>

                <td>
                  ${fmtDate(
                    equipment.lastMaintenance
                  )}
                </td>

              </tr>
            `
          ).join('')}

        </tbody>

      </table>

      <h2>
        Incident Reports
      </h2>

      <table>

        <thead>

          <tr>
            <th>Report</th>
            <th>Equipment</th>
            <th>Reporter</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>

        </thead>

        <tbody>

          ${DB.incidents.map(
            incident => {

              const equipment =
                DB.equipment.find(
                  e =>
                    e.id ===
                    incident.equipmentId
                );

              return `
                <tr>

                  <td>
                    ${esc(incident.id)}
                  </td>

                  <td>
                    ${esc(
                      equipment?.name ||
                      'Unknown'
                    )}
                  </td>

                  <td>
                    ${esc(
                      incident.reportedByName
                    )}
                  </td>

                  <td>
                    ${esc(
                      incident.category
                    )}
                  </td>

                  <td>
                    ${esc(
                      incident.priority
                    )}
                  </td>

                  <td>
                    ${esc(
                      incident.status
                    )}
                  </td>

                </tr>
              `;
            }
          ).join('')}

        </tbody>

      </table>

      <h2>
        Predictive Risk Overview
      </h2>

      <table>

        <thead>

          <tr>
            <th>Equipment</th>
            <th>Risk Score</th>
            <th>Risk Band</th>
            <th>Status</th>
          </tr>

        </thead>

        <tbody>

          ${risks.map(
            ({ equipment, score }) => `
              <tr>

                <td>
                  ${esc(
                    equipment.name
                  )}
                </td>

                <td>
                  ${score}/100
                </td>

                <td>
                  ${esc(
                    riskBand(score).label
                  )}
                </td>

                <td>
                  ${esc(
                    equipment.status
                  )}
                </td>

              </tr>
            `
          ).join('')}

        </tbody>

      </table>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>

    </body>

    </html>
  `);

  printWindow.document.close();
}

/* ============================================================
   MODAL SYSTEM
   ============================================================ */

function openModal(content) {

  const root =
    $('#modal-root');

  if (!root) return;

  root.innerHTML = `
    <div
      class="modal-backdrop"
      onclick="handleModalBackdrop(event)"
    >

      <div
        class="modal-panel"
        onclick="event.stopPropagation()"
      >
        ${content}
      </div>

    </div>
  `;

  root.classList.add('open');

  document.body.classList.add(
    'modal-open'
  );
}

function closeModal() {

  const root =
    $('#modal-root');

  if (!root) return;

  root.classList.remove('open');

  root.innerHTML = '';

  document.body.classList.remove(
    'modal-open'
  );
}

function handleModalBackdrop(event) {

  if (
    event.target.classList.contains(
      'modal-backdrop'
    )
  ) {
    closeModal();
  }
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */

function toast(
  message,
  type = 'good'
) {

  const root =
    $('#toast-root');

  if (!root) return;

  const toastEl =
    document.createElement('div');

  toastEl.className =
    `toast toast-${type}`;

  toastEl.innerHTML = `

    <div class="toast-icon">

      ${
        type === 'good'
          ? icon('check')
          : icon('alert')
      }

    </div>

    <div class="toast-message">
      ${esc(message)}
    </div>

    <button
      class="toast-close"
      onclick="this.parentElement.remove()"
    >
      ${icon('x')}
    </button>

  `;

  root.appendChild(
    toastEl
  );

  setTimeout(() => {

    toastEl.classList.add(
      'toast-hide'
    );

    setTimeout(
      () => toastEl.remove(),
      250
    );

  }, 3500);
}

/* ============================================================
   MOBILE NAVIGATION
   ============================================================ */

function toggleMobileNav() {

  const sidebar =
    $('#sidebar');

  const overlay =
    $('#mobile-overlay');

  if (!sidebar || !overlay) {
    return;
  }

  sidebar.classList.toggle(
    'mobile-open'
  );

  overlay.classList.toggle(
    'open'
  );
}

function closeMobileNav() {

  const sidebar =
    $('#sidebar');

  const overlay =
    $('#mobile-overlay');

  if (!sidebar || !overlay) {
    return;
  }

  sidebar.classList.remove(
    'mobile-open'
  );

  overlay.classList.remove(
    'open'
  );
}

/* ============================================================
   VIEW ROUTER
   ============================================================ */

const VIEWS = {

  dashboard:
    renderDashboardView,

  equipment:
    renderEquipmentView,

  incidents:
    renderIncidentsView,

  risk:
    renderRiskView,

  reports:
    renderReportsView,

  browse:
    renderBrowseView,

  report:
    renderReportView,

  myreports:
    renderMyReportsView
};

/* ============================================================
   KEYBOARD CONTROLS
   ============================================================ */

document.addEventListener(
  'keydown',
  event => {

    if (
      event.key ===
      'Escape'
    ) {

      closeMobileNav();

      const modal =
        $('#modal-root');

      if (
        modal?.classList.contains(
          'open'
        )
      ) {
        closeModal();
      }
    }
  }
);

/* ============================================================
   APPLICATION START
   ============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    /*
     * The original index.html may already contain
     * the login markup. If it does, we preserve it.
     *
     * Otherwise, render the login screen.
     */

    if (
      $('#login-screen') &&
      !$('#login-form')
    ) {
      renderLogin();
    }

    /*
     * If the original HTML already provides
     * the login screen, its handlers remain usable.
     */

    if (!$('#login-screen')) {

      const login =
        document.createElement('div');

      login.id =
        'login-screen';

      document.body.prepend(
        login
      );

      renderLogin();
    }

    /*
     * Demo-only default state:
     * The user remains logged out until
     * credentials are entered.
     */

    closeMobileNav();

    /*
     * Ensure the modal container exists.
     */

    if (!$('#modal-root')) {

      const modal =
        document.createElement('div');

      modal.id =
        'modal-root';

      document.body.appendChild(
        modal
      );
    }

    /*
     * Ensure toast container exists.
     */

    if (!$('#toast-root')) {

      const toastRoot =
        document.createElement('div');

      toastRoot.id =
        'toast-root';

      document.body.appendChild(
        toastRoot
      );
    }

  }
);