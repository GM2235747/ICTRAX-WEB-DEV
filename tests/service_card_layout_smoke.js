'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets', 'css', 'styles.css'), 'utf8');
const expectedFields = [
  'Equipment',
  'Equipment Number',
  'Model',
  'Serial Number',
  'Location',
  'Date Acquired',
  'Unit Cost',
];

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

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Unable to locate source section: ${startMarker}`);
  return source.slice(start, end);
}

function labelsFromDetails(functionSource) {
  return Array.from(
    functionSource.matchAll(/<label><span>([^<]+)<\/span>/g),
    match => match[1]
  );
}

function labelsFromParagraphs(functionSource) {
  return Array.from(functionSource.matchAll(/<p><b>([^<:]+):<\/b>/g), match => match[1]);
}

const editableCard = section('function serviceCardDetailsMarkup(', 'function serviceCardPageMarkup(');
const equipmentInformationCard = section('async function openEquipmentInformationModal(', 'async function openReadOnlyServiceCardModal(');
const readOnlyCard = section('async function openReadOnlyServiceCardModal(', 'async function openServiceCardModal(');
const legacyCard = section('function generateServiceCardV12(', 'window.generateServiceCardV12');
const facultyCard = section('function openFacultyReadOnlyServiceCard(', 'window.openFacultyReadOnlyServiceCard');
const archivedCard = section('async function viewArchivedServiceCard(', 'async function restoreEquipment(');
const archivedView = section('function renderArchivedView(', 'const VIEWS = {');

check(
  JSON.stringify(labelsFromDetails(editableCard)) === JSON.stringify(expectedFields),
  'Editable service card contains only the seven requested fields in order'
);
check(
  JSON.stringify(labelsFromParagraphs(legacyCard)) === JSON.stringify(expectedFields),
  'Legacy service-card fallback contains only the seven requested fields in order'
);
check(
  JSON.stringify(labelsFromParagraphs(facultyCard)) === JSON.stringify(expectedFields),
  'Faculty read-only service card contains only the seven requested fields in order'
);
check(
  JSON.stringify(labelsFromDetails(archivedCard)) === JSON.stringify(expectedFields),
  'Archived read-only service card contains only the seven requested fields in order'
);
check(
  /onclick="saveServiceCardDraft\('[^']*'\)">Save<\/button>/.test(source)
    && !/onclick="saveServiceCardDraft\('[^']*'\)">Saved<\/button>/.test(source),
  'Service-card draft action is labeled Save'
);
check(
  equipmentInformationCard.indexOf('readOnlyServiceHistoryMarkup(rows)')
      < equipmentInformationCard.indexOf('embedded-service-card-section')
    && equipmentInformationCard.includes('serviceCardPagesMarkup(equipment,rows,serviceCardPageCount,serviceCardDetails,{readOnly:true})'),
  'Faculty equipment modal retains its information and service-history summary above the complete service card'
);
check(
  equipmentInformationCard.includes('onclick="moveServiceCardPage(-1)"')
    && equipmentInformationCard.includes('id="service-card-page-indicator"')
    && equipmentInformationCard.includes('onclick="moveServiceCardPage(1)"')
    && equipmentInformationCard.includes('onclick="printServiceCard()"')
    && equipmentInformationCard.includes('>Done</button>'),
  'Embedded faculty service card uses the shared pagination, page indicator, and print workflow'
);
check(
  !equipmentInformationCard.includes('clearServiceCardDraft(')
    && !equipmentInformationCard.includes('saveServiceCardDraft(')
    && !equipmentInformationCard.includes('addServiceCardPage(')
    && readOnlyCard.includes('return openEquipmentInformationModal('),
  'Faculty service-card footer omits all editing actions'
);
check(
  styles.includes('.equipment-details-body>*{display:none !important;}')
    && styles.includes('.equipment-details-body>.embedded-service-card-section{display:block !important;'),
  'Printing the embedded card omits the equipment-summary content above it'
);
check(
  source.includes('service-check-print-mark')
    && source.includes('syncServiceCardPrintMarks();')
    && styles.includes('.service-check-print-mark{display:inline-flex !important;width:2.8mm !important;height:2.8mm !important;')
    && styles.includes('.service-check-selected .service-check-print-mark{color:#111 !important;}'),
  'Preventive-maintenance checkboxes retain a compact fixed size and selected mark when printed or saved as PDF'
);
check(
  archivedCard.includes('class="service-check-readonly"')
    && archivedCard.includes('&#10003;'),
  'Archived saved service cards show checkmarks in their selected Yes or No column'
);
check(
  !archivedView.includes("sortableHeader('archived','department'")
    && !archivedView.includes("item.department")
    && archivedView.includes('colspan="6"'),
  'Archived Equipment table omits Department and uses the six-column layout'
);

console.log(`\n${passed} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
