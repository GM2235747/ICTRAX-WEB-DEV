'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets', 'css', 'styles.css'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'assets', 'css', 'ceu-theme.css'), 'utf8');

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Unable to locate source section: ${startMarker}`);
  return source.slice(start, end);
}

const helpers = section('function toastMessageMarkup(', 'function toast(');
const context = vm.createContext({});
vm.runInContext(
  `const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));\n${helpers}\nthis.toastApi={toastMessageMarkup,incidentStatusToastMessage};`,
  context
);
const api = context.toastApi;

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

const statusMarkup = api.toastMessageMarkup(api.incidentStatusToastMessage('INC-0042', 'Resolved'));
check(
  statusMarkup === 'Incident <strong class="toast-emphasis">INC-0042</strong> status changed to <strong class="toast-emphasis">Resolved</strong>.',
  'Incident status toast uses the requested wording and bold emphasis'
);
check(
  api.toastMessageMarkup(api.incidentStatusToastMessage('<INC-0042>', '<Resolved>')).includes('&lt;INC-0042&gt;')
    && !api.toastMessageMarkup(api.incidentStatusToastMessage('<INC-0042>', '<Resolved>')).includes('<INC-0042>'),
  'Emphasized toast values remain HTML-escaped'
);
check(
  styles.includes('#toast-root{position:fixed;top:22px;right:22px;bottom:auto;')
    && theme.includes('#toast-root{top:24px;right:24px;bottom:auto;')
    && theme.includes('#toast-root{top:12px;left:12px;right:12px;bottom:auto;}'),
  'Desktop and mobile toast stacks are anchored at the top'
);
check(
  source.includes("showFieldValidationError(input,type==='category'?'Enter a category name first':'Enter a location name first')")
    && source.includes("showFieldValidationError($('#new-category-prefix')")
    && source.includes("showFieldValidationError($('#new-category-sequence')")
    && styles.includes('.field input[aria-invalid="true"]')
    && theme.includes('.field input[aria-invalid="true"]'),
  'Catalog validation errors identify and highlight the related field'
);
check(
  source.includes("if(previousStatus!==i.status){\n    toast(incidentStatusToastMessage(id,i.status),'good');")
    && source.includes("toast(incidentStatusToastMessage(notification.incidentId,notification.status), 'info', 6500)"),
  'Direct updates and cross-role notifications share the specific status toast'
);

console.log(`\n${passed} passed, ${failures.length} failed.`);
process.exitCode = failures.length ? 1 : 0;
