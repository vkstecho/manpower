/**
 * Man Power — lightweight Node smoke tests (v5.1.0)
 * Run: node tests/smoke.js
 * No browser / Firebase required.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  passed++;
  console.log('  ✓', name);
}

console.log('1) Split modules exist + parse');
const files = [
  'js/i18n/i18n_dict.js',
  'js/schedule/sched-shift-edit.js',
  'js/schedule/sched-auto-coverage.js',
  'js/session/app-session-settings-shift.js',
  'js/session/app-session-settings-profile.js',
  'js/session/app-session-settings-security.js',
  'js/team/app-team-excel-ops.js',
  'js/schedule/app-sched-builder.js',
  'js/session/app-session-settings.js',
];
for (const f of files) {
  const full = path.join(root, f);
  ok(f + ' exists', fs.existsSync(full));
  const src = fs.readFileSync(full, 'utf8');
  ok(f + ' non-empty', src.length > 100);
  // crude balance check
  const opens = (src.match(/\{/g) || []).length;
  const closes = (src.match(/\}/g) || []).length;
  ok(f + ' brace balance', Math.abs(opens - closes) <= 2);
}

console.log('2) Rules: no hard-coded admin phone');
const rules = fs.readFileSync(path.join(root, 'database.rules.json'), 'utf8');
ok('rules JSON parse', !!JSON.parse(rules));
ok('no 8929397949 in rules', !rules.includes('8929397949'));
ok('claims admin still present', rules.includes('auth.token.admin'));
ok('claims manager still present', rules.includes('auth.token.manager'));

console.log('3) Version alignment');
const cfg = fs.readFileSync(path.join(root, 'js/config/config.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok('APP_VERSION 5.1.0', cfg.includes('APP_VERSION:"5.1.0"'));
ok('SW_VERSION 5.1.0', sw.includes("SW_VERSION = '5.1.0'"));

console.log('4) app.html loads new modules');
const html = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
for (const s of [
  'i18n_dict.js',
  'sched-shift-edit.js',
  'sched-auto-coverage.js',
  'app-session-settings-shift.js',
  'app-session-settings-profile.js',
  'app-session-settings-security.js',
]) {
  ok('html includes ' + s, html.includes(s));
}

console.log('\\nAll passed:', passed);
