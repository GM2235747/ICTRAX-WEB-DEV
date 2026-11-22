'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    throw new Error(`Unable to locate risk-engine section: ${startMarker}`);
  }
  return source.slice(start, end);
}

const dateHelpers = section('let NOW = new Date();', '/* ============================================================\n   RISK ENGINE');
const riskEngine = section('const RISK_MODEL = Object.freeze({', '/* ---------- status');
const context = vm.createContext({DB: {incidents: []}});
vm.runInContext(
  `${dateHelpers}\n${riskEngine}\nthis.riskApi={RISK_MODEL,setRiskReferenceTime,maintenanceStalenessScore,riskBreakdown,calcRisk,riskBand,riskRecommendedAction};`,
  context
);

const api = context.riskApi;
api.setRiskReferenceTime('2026-10-15T00:00:00+00:00');

let passed = 0;
const failures = [];
function check(condition, description) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${description}`);
  } else {
    failures.push(description);
    console.log(`[FAIL] ${description}`);
  }
}

function equipment(overrides = {}) {
  return {
    id: 'TEST-001',
    name: 'Test Equipment',
    category: 'Desktop Computer',
    location: 'Computer Laboratory 1',
    status: 'Operational',
    condition: 'Good',
    dateAcquired: '2025-01-01',
    lastMaintenance: '2026-09-15',
    ...overrides,
  };
}

function incident(overrides = {}) {
  return {
    id: 'INC-TEST',
    equipmentId: 'TEST-001',
    dateReported: '2026-10-01',
    category: 'Malfunctioning',
    status: 'Pending',
    priority: 'Medium',
    ...overrides,
  };
}

check(
  Object.values(api.RISK_MODEL.weights).reduce((sum, value) => sum + value, 0) === 100,
  'Risk factor weights total exactly 100 points'
);
check(
  api.RISK_MODEL.version === '2.1'
    && api.maintenanceStalenessScore(30) === 0
    && Math.round(api.maintenanceStalenessScore(90)) === 5
    && Math.round(api.maintenanceStalenessScore(107)) === 6
    && Math.round(api.maintenanceStalenessScore(180)) === 12
    && Math.round(api.maintenanceStalenessScore(365)) === 17
    && Math.round(api.maintenanceStalenessScore(730)) === 20,
  'Maintenance staleness rises progressively through the documented v2.1 checkpoints'
);

context.DB.incidents = [];
const healthy = api.riskBreakdown(equipment());
check(healthy.total < 25 && api.riskBand(healthy.total).label === 'Low', 'Healthy recent-maintenance equipment remains Low risk');

const staleEdit = api.riskBreakdown(equipment({condition:'Fair',dateAcquired:'2025-01-01',lastMaintenance:'2026-06-30'}));
const freshEdit = api.riskBreakdown(equipment({condition:'Fair',dateAcquired:'2025-01-01',lastMaintenance:'2026-10-10'}));
const olderEdit = api.riskBreakdown(equipment({condition:'Fair',dateAcquired:'2018-01-01',lastMaintenance:'2026-06-30'}));
check(staleEdit.maintenance === 6 && staleEdit.total > freshEdit.total, 'Editing maintenance dates immediately raises or lowers the calculated risk');
check(olderEdit.age > staleEdit.age && olderEdit.total > staleEdit.total, 'Editing acquisition dates immediately changes equipment-age risk');
check(
  source.includes('riskBeforeUpdate=calcRisk(existingEquipment)')
    && source.includes('Object.assign(existingEquipment,response.data)')
    && source.includes('riskAfterUpdate=calcRisk(existingEquipment)')
    && source.includes("navigate('equipment')"),
  'A saved equipment edit recalculates risk from the server-confirmed record before rerendering'
);

const missing = api.riskBreakdown(equipment({status: 'Missing', condition: 'Poor'}));
check(missing.total >= 75 && api.riskBand(missing.total).label === 'Critical', 'Missing equipment is always Critical priority');
check(api.riskRecommendedAction(equipment({status: 'Missing'}), missing).label === 'Verify immediately', 'Missing equipment receives asset-verification guidance');

const condemned = api.riskBreakdown(equipment({status: 'Condemned', condition: 'Poor'}));
check(condemned.total === 100, 'Condemned equipment remains visible at a 100-point lifecycle risk');
check(api.riskRecommendedAction(equipment({status: 'Condemned'}), condemned).label === 'Retire or replace', 'Condemned equipment receives lifecycle guidance');

const damaged = api.riskBreakdown(equipment({status: 'Damaged'}));
check(damaged.total >= 50, 'Damaged equipment cannot fall below the High-risk band');

context.DB.incidents = [incident({status: 'Rejected', priority: 'Critical'})];
const rejectedOnly = api.riskBreakdown(equipment());
check(rejectedOnly.total === healthy.total && rejectedOnly.rejectedIncidentCount === 1, 'Rejected incidents are excluded from the score and disclosed');

context.DB.incidents = [incident({priority: 'Critical'})];
const openCritical = api.riskBreakdown(equipment());
check(openCritical.total >= 75, 'An open Critical incident enforces Critical maintenance priority');

context.DB.incidents = [
  incident({id: 'INC-A', dateReported: '2026-10-01'}),
  incident({id: 'INC-B', dateReported: '2026-09-20'}),
];
const accelerating = api.riskBreakdown(equipment());
check(accelerating.trend > 0 && accelerating.recentIncidentCount === 2 && accelerating.previousIncidentCount === 0, 'Recent trend compares consecutive 90-day periods');
check(accelerating.recurringCategories.includes('Malfunctioning'), 'Repeated incident categories are identified as a pattern');

for (const candidate of [healthy, missing, condemned, damaged, openCritical, accelerating]) {
  check(candidate.total >= 0 && candidate.total <= 100, `Risk score ${candidate.total} remains within 0-100`);
}

console.log(`\n${passed} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
