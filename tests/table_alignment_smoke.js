'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets', 'css', 'styles.css'), 'utf8');

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

check(
  /table\.dtable th\{[\s\S]*?text-align:center;/.test(styles)
    && /table\.dtable td\{[^}]*vertical-align:middle;text-align:center;/.test(styles),
  'Shared data-table headers and records are horizontally centered and vertically middle-aligned'
);
check(
  styles.includes('display:inline-flex;align-items:center;justify-content:center;gap:5px;')
    && styles.includes('.table-header-controls{display:inline-flex;align-items:center;justify-content:center;gap:3px;}'),
  'Sortable and filterable header controls remain centered as complete control groups'
);
check(
  styles.includes('table.dtable .row-actions{justify-content:center;}')
    && styles.includes('letter-spacing:normal;text-align:center;text-transform:none;'),
  'Row actions and open column-filter values follow the same centered alignment'
);
check(
  source.includes('class="cell-strong equipment-name-cell"')
    && source.includes('class="equipment-name-text"')
    && !source.includes("equipment-name-cell\">${icon(CATEGORY_ICON[e.category]||'box')}")
    && styles.includes('table.dtable .equipment-name-cell{')
    && styles.includes('display:block;min-width:0;width:100%;text-align:center;')
    && styles.includes('table.dtable .equipment-name-text{min-width:0;text-align:center;overflow-wrap:anywhere;}'),
  'Equipment names are explicitly centered without category icons or column-width changes'
);
check(
  source.includes('<table class="dtable"><thead><tr><th>Date</th><th>Actor</th>')
    && source.includes("columnFilterHeader('equipment','id','Tag ID')")
    && source.includes("columnFilterHeader('incidents','id','Report')")
    && source.includes("columnFilterHeader('completed','id','Report')")
    && source.includes("sortableFilterHeader('myreports','id','Report')")
    && source.includes("columnFilterHeader('archived','equipment_code','Equipment Code')")
    && source.includes('<th>Risk Score</th><th>Recommended Action</th>'),
  'Administrator and faculty record lists all use the centered shared data-table class'
);
check(
  styles.includes('.service-card-table th,.service-card-table td')
    && !styles.includes('table:not(.dtable) td{text-align:center')
    && source.includes('<table class="service-card-table">'),
  'Specialized service-card and printable form tables remain outside the record-list rule'
);

console.log(`\n${passed} passed, ${failures.length} failed.`);
process.exitCode = failures.length ? 1 : 0;
