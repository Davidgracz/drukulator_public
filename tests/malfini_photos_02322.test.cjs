'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root,'js/malfini-preview.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(code, sandbox);
const api = sandbox.window.D24MalfiniPreview;
assert(api && typeof api.mount === 'function');
const expected = [
  ['Malfini Rimeck','9V3','hv-bright-9v3'],
  ['Brixton Flash','AFK4','brixton_flash_kamizelka'],
  ['Carry','901','carry-901'],
  ['Shopper','921','shopper-921'],
  ['Worko-plecak Easygo','922','easygo-922']
];
for (const [name, sku, slug] of expected) {
  const model = api.products[name];
  assert.equal(model.code, sku, name);
  assert(model.url.includes(slug), name);
}
assert(api.products['Malfini Rimeck'].colors.some(color => color[0] === '97'));
assert(api.products['Malfini Rimeck'].colors.some(color => color[0] === '98'));
assert.equal(api.products['Brixton Flash'].colors.length, 2);
assert.equal(api.products['Brixton Flash'].photoSet.yellow.front[0], 24067);
assert.equal(api.products['Brixton Flash'].photoSet.orange.back[0], 24070);
assert(api.products['Brixton Flash'].url.startsWith('https://polstar.com.pl/'));
assert(!('Kamizelka odblaskowa' in api.products));
assert(api.products['Carry'].colors.some(color => color[0] === '10'));
assert(code.includes("{ id: 'back', title: 'Tył', remoteLetter: 'b' }"));
assert(code.includes("{ id: 'side', title: 'Profil', remoteLetter: 'e' }"));
assert(code.includes('remotePhotoCandidates(model, colorCode, view).forEach(add);'));
assert(code.includes('tester.onerror = attemptThumbnail'));
assert(code.includes("const mediaCode = code === '9V3' ? '9v3' : code;"));
const app = fs.readFileSync(path.join(root,'js/app.js'),'utf8');
assert(app.includes("catalogPreview?.showView(showSide)"));
// 0.24.1: the print-area overlay under the visualisation was removed on purpose.
assert(!app.includes('frontPrint: fixed ? (position'));
assert(!code.includes('d24-malfini-print-area'));
const css = fs.readFileSync(path.join(root,'assets/malfini-preview.css'),'utf8');
assert(!css.includes('d24-malfini-print-area'));
assert(css.includes('.d24-malfini-cut'));
console.log('PASS supplier SKUs, colors, image mapping, fallback, no print-area overlay');
