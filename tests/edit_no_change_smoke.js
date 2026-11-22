'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const equipmentApi = fs.readFileSync(path.join(root, 'api', 'equipment.php'), 'utf8');
const catalogApi = fs.readFileSync(path.join(root, 'api', 'catalog.php'), 'utf8');
const serviceCardApi = fs.readFileSync(path.join(root, 'api', 'service_cards.php'), 'utf8');

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Unable to locate source section: ${startMarker}`);
  return source.slice(start, end);
}

const sharedHelpers = section('function normalizeEditableValue(', 'function serviceCardDrafts(');
const categoryHelper = section('function categoryTagEditableData(', 'function openCategorySettings(');
const equipmentHelper = section('function equipmentEditableData(', 'function openEquipmentForm(');
const context = vm.createContext({JSON});
vm.runInContext(
  `${sharedHelpers}\n${categoryHelper}\n${equipmentHelper}\nthis.editApi={editableValuesMatch,editableSnapshot,categoryTagEditableData,equipmentEditableData};`,
  context
);
const api = context.editApi;

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

const equipment = {
  id:'SC01-07', name:'Scanner 7', category:'Scanner', location:'Computer Laboratory 3',
  serial:'SC-2382', status:'Operational', condition:'New', dateAcquired:'2026-09-11',
  lastMaintenance:'2026-09-11', warrantyProvider:'ICT Office', warrantyExpiration:'2026-10-12', notes:'',
};
const unchangedEquipmentForm = {...equipment, warrantyProvider:' ICT Office '};

check(
  api.editableValuesMatch(api.equipmentEditableData(equipment), unchangedEquipmentForm),
  'Equipment comparison recognizes an unchanged edit after normalizing form whitespace'
);
check(
  !api.editableValuesMatch(api.equipmentEditableData(equipment), {...unchangedEquipmentForm,status:'Under Repair'}),
  'Equipment comparison recognizes a real field change'
);
check(
  api.editableValuesMatch(
    api.categoryTagEditableData({tagIdMode:'automatic',tagPrefix:'sc',tagSequence:'01'}),
    api.categoryTagEditableData({tagIdMode:'automatic',tagPrefix:'SC',tagSequence:'01'})
  ),
  'Category comparison normalizes automatic Tag ID settings'
);
check(
  api.editableValuesMatch(
    api.categoryTagEditableData({tagIdMode:'manual',tagPrefix:null,tagSequence:null}),
    api.categoryTagEditableData({tagIdMode:'manual',tagPrefix:'IGNORED',tagSequence:'99'})
  ),
  'Manual category comparison ignores disabled automatic-only values'
);
check(
  !api.editableValuesMatch(
    api.categoryTagEditableData({tagIdMode:'automatic',tagPrefix:'SC',tagSequence:'01'}),
    api.categoryTagEditableData({tagIdMode:'automatic',tagPrefix:'SC',tagSequence:'02'})
  ),
  'Category comparison recognizes a real Tag ID setting change'
);

const equipmentSubmit = section('async function submitEquipmentForm(', 'function showEquipmentFormError(');
const categorySubmit = section('async function saveCategorySettings(', 'async function refreshCatalogs(');
const serviceCardSubmit = section('async function saveServiceCardDraft(', 'function clearServiceCardDraft(');
const incidentSubmit = section('async function saveIncidentUpdate(', 'async function deleteIncident(');

check(
  equipmentSubmit.includes("toast('No equipment changes to save','info')")
    && equipmentSubmit.indexOf('editableValuesMatch(equipmentEditableData(existingEquipment),data)')
      < equipmentSubmit.indexOf("apiRequest('equipment.php'"),
  'Equipment edit stops before its API update when fields and photos are unchanged'
);
check(
  equipmentSubmit.includes("selectedPhotos.length===0")
    && equipmentSubmit.includes('else if(photosAttached)')
    && equipmentSubmit.includes('photo${selectedPhotos.length===1'),
  'A newly attached equipment photo still counts as a legitimate edit'
);
check(
  categorySubmit.includes("toast('No category changes to save','info')")
    && categorySubmit.indexOf('editableValuesMatch(categoryTagEditableData(category),categoryTagEditableData(data))')
      < categorySubmit.indexOf("apiRequest('catalog.php'"),
  'Category settings stop before their API update when unchanged'
);
check(
  serviceCardSubmit.includes("toast('No service card changes to save','info')")
    && serviceCardSubmit.indexOf('currentSnapshot===activeServiceCardInitialSnapshot')
      < serviceCardSubmit.indexOf('apiRequest(`service_cards.php'),
  'Service Card stops before its API update when unchanged'
);
check(
  incidentSubmit.includes("toast('No incident changes to save','info')")
    && incidentSubmit.indexOf("update.status===i.status") < incidentSubmit.indexOf("apiRequest('incidents.php'"),
  'Incident Update retains its existing unchanged-edit protection'
);
check(
  source.includes("if(state.user?.role!=='admin'){ toast('Service cards are available to administrators only','bad'); return; }")
    && source.includes("equipment:['admin']")
    && !section('async function openEquipmentInformationModal(', 'async function openReadOnlyServiceCardModal(').includes('saveServiceCardDraft('),
  'Faculty equipment and service-card modals remain read-only'
);
check(
  equipmentApi.indexOf("'unchanged' => true") < equipmentApi.indexOf("'UPDATE equipment SET"),
  'Equipment API prevents unchanged writes and audit entries'
);
check(
  catalogApi.indexOf("'unchanged' => true", catalogApi.indexOf("if ($method === 'PUT')"))
    < catalogApi.indexOf("'UPDATE equipment_categories", catalogApi.indexOf("if ($method === 'PUT')")),
  'Category API prevents unchanged writes and audit entries'
);
check(
  serviceCardApi.indexOf("'unchanged' => true") < serviceCardApi.indexOf("'INSERT INTO service_cards"),
  'Service Card API prevents unchanged writes and audit entries'
);

console.log(`\n${passed} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
