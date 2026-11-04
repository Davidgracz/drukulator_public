const assert = require('node:assert/strict');
const root = require('../data/prices.json');
const fs = require('fs');const vm = require('vm');
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../js/calculators.js'),'utf8'),context);
const C = context.Calculators;
for(const [format,prices] of Object.entries({A4:{5:17.5,10:35,20:70,50:150},A3:{5:35,10:70,20:120,50:300}})) {
 for(const [qty,amount] of Object.entries(prices)) assert.equal(C.calculatePosters(root,'Cyfrowy 24h',format,Number(qty)),amount);
}
for(const [qty,unit] of [[1,30],[2,25],[5,22],[11,20],[30,20]]) {
 assert.equal(C.calculatePosters(root,'Wielkoformatowy 24h','A2',qty).price,qty*unit);
}
assert.throws(()=>C.calculatePosters(root,'Wielkoformatowy 24h','A2',31),/30/);
for(const [type,format,qty,price] of [
 ['Cyfrowy','A6',1000,495],['Cyfrowy','A5',1000,890],['Cyfrowy','DL',1000,690],
 ['Offsetowy','A7',5000,270],['Offsetowy','A6',5000,370],['Offsetowy','A5',5000,630],['Offsetowy','DL',5000,470]
]) assert.equal(C.calculateFlyers(root,type,'Standard',format,qty),price);
assert.ok(root.odziez_z_nadrukiem.produkty.Czapki['Czapka bejsbolówka']);
assert.ok(root.odziez_z_nadrukiem.produkty.Czapki['Czapka raperka']);
console.log('OK: new catalog prices, 1-30 posters and apparel categories');
