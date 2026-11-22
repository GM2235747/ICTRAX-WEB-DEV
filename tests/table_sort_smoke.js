'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const equipmentApiSource = fs.readFileSync(path.join(root, 'api', 'equipment.php'), 'utf8');
const start = source.indexOf('function columnFilterDateValue(');
const end = source.indexOf('function sortTable(table,key){', start);
if (start < 0 || end < 0) throw new Error('Unable to locate shared table-sort implementation');
const facultyHeaderStart = source.indexOf('function sortableFilterHeader(');
const facultyHeaderEnd = source.indexOf('function toggleColumnFilter(', facultyHeaderStart);
const facultyHeaderSource = source.slice(facultyHeaderStart, facultyHeaderEnd);
const filterUpdateStart = source.indexOf('function renderFilteredTable(');
const filterUpdateEnd = source.indexOf('const EQUIPMENT_STATUS_ORDER', filterUpdateStart);
const filterUpdateSource = source.slice(filterUpdateStart, filterUpdateEnd);
const sortUpdateStart = source.indexOf('function sortTable(table,key){');
const sortUpdateEnd = source.indexOf('/* ============================================================', sortUpdateStart);
const sortUpdateSource = source.slice(sortUpdateStart, sortUpdateEnd);

const context = vm.createContext({
  state: {sorts: {}},
  DB: {equipment: [{id:'EMS-CL2-KB-001',name:'Desktop Computer',location:'Computer Laboratory 2'}]},
  calcRisk: row => row.testRisk || 0,
  riskBand: score => ({label:score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low'}),
  fmtDate: iso => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
});
vm.runInContext(
  `${source.slice(start, end)}\nthis.sortApi={EQUIPMENT_STATUS_ORDER,equipmentStatusRank,INCIDENT_STATUS_ORDER,incidentStatusRank,equipmentCreatedRank,sortTableRows,matchesColumnFilter};`,
  context
);

const api = context.sortApi;
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

const equipmentAscending = ['Operational', 'Under Repair', 'Damaged', 'Missing', 'Condemned'];
const equipmentDescending = [...equipmentAscending].reverse();
const mixedEquipmentRows = ['Damaged', 'Operational', 'Condemned', 'Under Repair', 'Missing']
  .map((status, index) => ({id: `EQ-${index}`, status}));
const incidentAscending = ['Resolved', 'In Progress', 'Pending', 'Rejected'];
const incidentDescending = [...incidentAscending].reverse();
const mixedIncidentRows = ['Pending', 'Resolved', 'Rejected', 'In Progress']
  .map((status, index) => ({id: `INC-${index}`, status}));

function sortedStatuses(rows, table, direction) {
  context.state.sorts[table] = {key: 'status', direction};
  return api.sortTableRows(rows, table).map(row => row.status);
}

check(
  JSON.stringify(Array.from(api.EQUIPMENT_STATUS_ORDER)) === JSON.stringify(equipmentAscending),
  'Equipment status hierarchy matches the requested business order'
);
check(
  JSON.stringify(sortedStatuses(mixedEquipmentRows, 'equipment', 'asc')) === JSON.stringify(equipmentAscending),
  'Administrator status sort is correct in ascending order'
);
check(
  JSON.stringify(sortedStatuses(mixedEquipmentRows, 'equipment', 'desc')) === JSON.stringify(equipmentDescending),
  'Administrator status sort is correct in descending order'
);
check(
  JSON.stringify(sortedStatuses(mixedEquipmentRows, 'browse', 'asc')) === JSON.stringify(equipmentAscending),
  'Faculty status sort is correct in ascending order'
);
check(
  JSON.stringify(sortedStatuses(mixedEquipmentRows, 'browse', 'desc')) === JSON.stringify(equipmentDescending),
  'Faculty status sort is correct in descending order'
);
check(
  source.includes("return sortTableRows(rows,'browse')")
    && source.includes('onBrowseSort(this.value)')
    && source.includes('toggleBrowseSortDirection()'),
  'Faculty Browse Equipment exposes shared sort controls'
);
const creationRows = [
  {id:'EQ-OLD',recordSequence:4,createdAt:'2026-10-01T08:00:00'},
  {id:'EQ-NEW',recordSequence:12,createdAt:'2026-11-09T09:00:00'},
  {id:'EQ-MIDDLE',recordSequence:8,createdAt:'2026-10-20T10:00:00'},
];
context.state.sorts.equipment = {key:'createdAt',direction:'desc'};
context.state.sorts.browse = {key:'createdAt',direction:'desc'};
check(
  api.sortTableRows(creationRows,'equipment')[0].id === 'EQ-NEW'
    && api.sortTableRows(creationRows,'browse')[0].id === 'EQ-NEW',
  'Administrator and faculty equipment views place the newest record first'
);
check(
  source.includes("equipment:{key:'createdAt',direction:'desc'}")
    && source.includes("browse:{key:'createdAt',direction:'desc'}")
    && source.includes("return sortTableRows(rows,'equipment')")
    && source.includes("['createdAt','Date Added']")
    && source.includes('DB.equipment.unshift(response.data)'),
  'Newest-first equipment ordering is the default and is applied immediately after creation'
);
check(
  equipmentApiSource.includes("'recordSequence' => (int)$row['id']")
    && equipmentApiSource.includes("'createdAt' => $row['created_at'] ?? null")
    && equipmentApiSource.includes('ORDER BY created_at DESC, id DESC'),
  'Equipment API exposes and returns database creation order newest first'
);
check(
  source.includes('function renderEquipmentResults()')
    && source.includes('function renderBrowseResults()')
    && source.includes('function onEquipSearch(v){ state.filters.equipSearch=v; renderEquipmentResults(); }')
    && source.includes('function onEquipFilter(key,val){ state.filters[key]=val; renderEquipmentResults(); }')
    && source.includes('function onBrowseSearch(v){ state.filters.equipSearch=v; renderBrowseResults(); }')
    && source.includes('function onBrowseFilter(k,v){ state.filters[k]=v; renderBrowseResults(); }'),
  'Administrator and faculty search filters update only their result containers'
);
check(
  source.includes("input?.classList.toggle('hidden',!filters[`__open_${key}`])")
    && source.includes("button.setAttribute('aria-expanded',String(open))")
    && filterUpdateSource.includes("if(table==='archived') renderArchivedRows()")
    && filterUpdateSource.includes("else if(table==='equipment') renderEquipmentResults()")
    && filterUpdateSource.includes("else if(table==='incidents') renderIncidentResults()")
    && filterUpdateSource.includes("else if(table==='completed') renderCompletedIncidentResults()")
    && filterUpdateSource.includes("else if(table==='myreports') renderMyReportsResults()")
    && !filterUpdateSource.includes("$('#view-root').innerHTML"),
  'All column filters open and update only their table result rows'
);
check(
  JSON.stringify(Array.from(api.INCIDENT_STATUS_ORDER)) === JSON.stringify(incidentAscending),
  'Incident status hierarchy matches the requested business order'
);
check(
  JSON.stringify(sortedStatuses(mixedIncidentRows, 'incidents', 'asc')) === JSON.stringify(incidentAscending),
  'Administrator incident status sort is correct in ascending order'
);
check(
  JSON.stringify(sortedStatuses(mixedIncidentRows, 'incidents', 'desc')) === JSON.stringify(incidentDescending),
  'Administrator incident status sort is correct in descending order'
);
check(
  JSON.stringify(sortedStatuses(mixedIncidentRows, 'myreports', 'asc')) === JSON.stringify(incidentAscending),
  'Faculty incident status sort is correct in ascending order'
);
check(
  JSON.stringify(sortedStatuses(mixedIncidentRows, 'myreports', 'desc')) === JSON.stringify(incidentDescending),
  'Faculty incident status sort is correct in descending order'
);
check(
  api.matchesColumnFilter({status:'Pending'}, 'myreports', 'status', 'pending')
    && !api.matchesColumnFilter({status:'In Progress'}, 'myreports', 'status', 'pending'),
  'Faculty status filters compare against the displayed status text'
);
check(
  api.matchesColumnFilter({status:'In Progress'}, 'myreports', 'status', 'in')
    && api.matchesColumnFilter({status:'In Progress'}, 'myreports', 'status', 'progress')
    && !api.matchesColumnFilter({status:'Pending'}, 'myreports', 'status', 'in'),
  'Faculty status filters match word prefixes without treating Pending as In Progress'
);
check(
  api.matchesColumnFilter({testRisk:10}, 'equipment', 'risk', 'low')
    && api.matchesColumnFilter({testRisk:30}, 'equipment', 'risk', 'medium')
    && api.matchesColumnFilter({testRisk:55}, 'equipment', 'risk', 'high')
    && api.matchesColumnFilter({testRisk:80}, 'equipment', 'risk', 'critical')
    && !api.matchesColumnFilter({testRisk:10}, 'equipment', 'risk', 'high'),
  'Administrator Risk filter recognizes Low, Medium, High, and Critical labels'
);
check(
  api.matchesColumnFilter({dateAcquired:'2026-09-29'}, 'equipment', 'dateAcquired', 'sep')
    && api.matchesColumnFilter({dateAcquired:'2026-09-29'}, 'equipment', 'dateAcquired', 'september')
    && api.matchesColumnFilter({lastMaintenance:'2026-10-05'}, 'equipment', 'lastMaintenance', 'october')
    && !api.matchesColumnFilter({lastMaintenance:'2026-10-05'}, 'equipment', 'lastMaintenance', 'september'),
  'Administrator date filters recognize displayed short and full month names'
);
check(
  api.matchesColumnFilter({dateReported:'2026-09-29'}, 'incidents', 'dateReported', 'september')
    && api.matchesColumnFilter({resolvedDate:'2026-10-05'}, 'completed', 'resolvedDate', 'oct')
    && api.matchesColumnFilter({dateReported:'2026-10-25'}, 'myreports', 'dateReported', 'october')
    && api.matchesColumnFilter({archived_date:'2026-11-02 08:30:00'}, 'archived', 'archived_date', 'nov'),
  'Formatted date text works across admin, faculty, completed, and archived tables'
);
check(
  api.matchesColumnFilter({equipmentId:'EMS-CL2-KB-001'}, 'incidents', 'equipment', 'desktop')
    && api.matchesColumnFilter({equipmentId:'EMS-CL2-KB-001'}, 'completed', 'equipment', 'kb-001')
    && api.matchesColumnFilter({equipmentId:'EMS-CL2-KB-001'}, 'myreports', 'equipment', 'laboratory 2'),
  'Incident equipment filters recognize displayed names, codes, and locations'
);
check(
  api.matchesColumnFilter({reportedByName:'Harvie Bernardo',reportedByDepartment:'Information Technology'}, 'incidents', 'reportedByName', 'technology')
    && api.matchesColumnFilter({name:'Scanner 3',category:'Scanner',serial:'SC03-32'}, 'equipment', 'name', 'sc03'),
  'Compound text cells filter by their visible secondary alphanumeric details'
);
check(
  (source.includes("mine = sortTableRows(mine,'myreports')")
    || source.includes("sortTableRows(filteredIncidentRows('myreports'),'myreports')"))
    && source.includes("sortableFilterHeader('myreports','id','Report')")
    && source.includes("sortableFilterHeader('myreports','status','Incident Status')"),
  'Faculty My Submitted Incidents table exposes sortable, filterable headers'
);
check(
  source.includes("const myReports=table==='myreports'")
    && source.includes("myReports ? f.myReportsSearch : f.incSearch")
    && source.includes("else if(table==='myreports') renderMyReportsResults()"),
  'Faculty My Submitted Incidents filters update only the active report rows'
);
check(
  source.includes('class="column-filter-toggle${value?\' active\':\'\'}${open?\' open\':\'\'}"')
    && facultyHeaderSource.includes('<input id="${inputId}" class="column-filter-input${open?\'\':\' hidden\'}"')
    && facultyHeaderSource.includes('aria-controls="${inputId}"')
    && source.includes('aria-expanded="${open}"'),
  'Faculty column filter fields remain mounted while their arrow controls show or hide them'
);
check(
  source.includes('function renderIncidentResults()')
    && source.includes('function renderCompletedIncidentResults()')
    && source.includes('function renderMyReportsResults()')
    && source.includes('function renderArchivedRows()')
    && source.includes('function onIncSearch(v){ state.filters.incSearch=v; renderIncidentResults(); }')
    && source.includes('state.filters.completedSearch=value;\n  renderCompletedIncidentResults();')
    && source.includes('state.filters.myReportsSearch=value;\n  renderMyReportsResults();')
    && source.includes('state.filters.archivedSearch=value;\n  renderArchivedRows();'),
  'Admin and faculty search fields keep their controls mounted while result rows update'
);
check(
  sortUpdateSource.includes("if(table==='archived')")
    && sortUpdateSource.includes('renderArchivedRows()')
    && sortUpdateSource.includes("else if(table==='equipment')")
    && sortUpdateSource.includes('renderEquipmentResults()')
    && sortUpdateSource.includes("else if(table==='browse')")
    && sortUpdateSource.includes('renderBrowseResults()')
    && sortUpdateSource.includes("else if(table==='incidents')")
    && sortUpdateSource.includes('renderIncidentResults()')
    && sortUpdateSource.includes("else if(table==='completed')")
    && sortUpdateSource.includes('renderCompletedIncidentResults()')
    && sortUpdateSource.includes("else if(table==='myreports')")
    && sortUpdateSource.includes('renderMyReportsResults()')
    && !sortUpdateSource.includes("$('#view-root').innerHTML"),
  'Sorting every admin and faculty result set avoids replacing the surrounding view'
);
check(
  source.includes("sortTableRows(filteredArchivedRows(),'archived')")
    && source.includes('<tbody id="archived-equipment-body">'),
  'Archived Equipment sorting and filtering reuse the persistent table body'
);
check(
  facultyHeaderStart >= 0
    && facultyHeaderEnd > facultyHeaderStart
    && !facultyHeaderSource.includes("'↕'")
    && !facultyHeaderSource.includes('${arrow}'),
  'Faculty incident headers omit the up/down sorting symbols'
);

console.log(`\n${passed} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
