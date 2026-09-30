/**
 * Man Power — pure helper tests (Node, no browser)
 * Run: node tests/run-utils-tests.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const utilsCode = fs.readFileSync(path.join(root, 'js/utils.js'), 'utf8');

const documentStub = {
  querySelector() { return null; },
  createElement() {
    return {
      src: '', async: false, setAttribute() {},
      onload: null, onerror: null,
      addEventListener() {},
    };
  },
  head: { appendChild() {} },
  documentElement: { appendChild() {} },
};

const sandbox = {
  console,
  document: documentStub,
  crypto: crypto.webcrypto || {
    subtle: {
      digest(algo, data) {
        const h = crypto.createHash('sha256');
        h.update(Buffer.from(data));
        return Promise.resolve(h.digest().buffer);
      },
    },
  },
  TextEncoder: global.TextEncoder || require('util').TextEncoder,
};
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.globalThis = sandbox;

vm.runInNewContext(utilsCode, sandbox, { filename: 'utils.js' });

const U = sandbox.MP_UTILS;
if (!U) {
  console.error('FAIL: MP_UTILS not defined');
  process.exit(1);
}

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log('  ✓', msg);
  } else {
    failed++;
    console.error('  ✗', msg);
  }
}

console.log('\n=== normMobileKey ===');
assert(U.normMobileKey('9876543210') === '9876543210', '10 digit unchanged');
assert(U.normMobileKey('+919876543210') === '9876543210', '+91 stripped');
assert(U.normMobileKey('919876543210') === '9876543210', '91 prefix stripped');
assert(U.normMobileKey('98-765-43210') === '9876543210', 'non-digits removed');
assert(U.normMobileKey('') === '', 'empty');
assert(U.normMobileKey(null) === '', 'null');

console.log('\n=== isValidMobile10 ===');
assert(U.isValidMobile10('9876543210') === true, 'valid starts with 9');
assert(U.isValidMobile10('6876543210') === true, 'valid starts with 6');
assert(U.isValidMobile10('5876543210') === false, 'invalid starts with 5');
assert(U.isValidMobile10('98765') === false, 'too short');
assert(U.isValidMobile10('+919876543210') === true, '+91 form valid');

console.log('\n=== isValidEmpId ===');
assert(U.isValidEmpId('EMP001') === true, 'EMP001');
assert(U.isValidEmpId('AB') === false, 'too short');
assert(U.isValidEmpId('emp001') === false, 'lowercase rejected');
assert(U.isValidEmpId('EMP-001') === false, 'hyphen rejected');

console.log('\n=== sanitizeFbPath ===');
assert(U.sanitizeFbPath('a/b.c') === 'a_b_c', 'slash and dot');
assert(U.sanitizeFbPath('x$y#z[1]') === 'x_y_z_1_', 'forbidden chars');
assert(U.sanitizeFbPath('ok_path') === 'ok_path', 'safe path');
assert(U.sanitizeFbPath('a'.repeat(300)).length === 256, 'max 256');

console.log('\n=== escHtml / escAttr ===');
assert(U.escHtml('<script>') === '&lt;script&gt;', 'escHtml tags');
assert(U.escHtml('a&b') === 'a&amp;b', 'escHtml amp');
assert(U.escHtml('"x"') === '&quot;x&quot;', 'escHtml quote');
assert(U.escAttr("a'b") === 'a&#39;b', 'escAttr quote');
assert(U.escHtml(null) === '', 'escHtml null');

console.log('\n=== isHardAdminPhone ===');
sandbox.MP_CFG = { hardAdminPhones: ['+918929397949', '8929397949'] };
assert(U.isHardAdminPhone('8929397949') === true, 'bootstrap match');
assert(U.isHardAdminPhone('+918929397949') === true, '+91 form match');
assert(U.isHardAdminPhone('9999999999') === false, 'non-admin');
sandbox.__mpHardAdminPhones = ['7000000000'];
assert(U.isHardAdminPhone('7000000000') === true, 'runtime list match');

console.log('\n=== hashPass ===');
U.hashPass('test').then((h) => {
  assert(typeof h === 'string' && h.length === 64, 'sha256 hex length 64');
  return U.hashPass('test');
}).then((h2) => {
  assert(h2.length === 64, 'hash deterministic length');
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
