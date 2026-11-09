const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=require('../data/prices.json');
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const names=prices.odziez_z_nadrukiem.produkty;
const defaultPrint='Do 10x15 cm';const bigPrint='Do 35x40 cm';
const base={
'Koszulki bawełniane':{'Basic 160 g':40,'Classic New 145 g':35,'Heavy New 200 g':45,'Slim Fit V-neck 180 g':45},
'Koszulki poliestrowe':{'Fantasy 150 g':45,'Chance 140 g':55,'Pixel 130 g':45},
'Koszulki polo':{'Pique Polo 200 g':55,'Cotton 170 g':55,'Single Jersey 180 g':55},
'Bluzy':{'Essential':95,'Trendy Zipper':145,'Cape':145}};
for(const [cat, products] of Object.entries(base)) for(const [name,price] of Object.entries(products)){
 assert.equal(names[cat][name].cena_odziezy,price);
 assert.equal(C.calculateApparel(prices,cat,name,defaultPrint,'Brak',1).price,price+15);
 assert.equal(C.calculateApparel(prices,cat,name,defaultPrint,'Brak',10).price,(price+15)*10*.9);
 assert.equal(C.calculateApparel(prices,cat,name,defaultPrint,bigPrint,1).price,price+15+30);
}
for(const [size,cost] of [['Do 10x15 cm',15],['Do 20x30 cm',20],['Do 35x40 cm',30]]){
 for(const qty of [1,6,10,20,50,100]){
  assert.equal(C.calculateApparel(prices,'Sam nadruk','Nadruk na odzieży klienta',size,'Brak',qty).price,qty*cost);
  assert.equal(C.calculateApparel(prices,'Sam nadruk','Nadruk na odzieży klienta',size,'Brak',qty).discountPercent,0);
 }
}
assert.equal(C.calculateApparel(prices,'Sam nadruk','Nadruk na odzieży klienta','Do 20x30 cm','Do 35x40 cm',10).price,500);
for(const [cat, items] of Object.entries({
  'Czapki':{'Czapka dziecięca':45,'Czapka bejsbolówka':50,'Czapka raperka':55},
  'Torby bawełniane':{'Carry':50,'Shopper':40},
  'Worki bawełniane':{'Worko-plecak Easygo':40}
})) for(const [name,amount] of Object.entries(items)){
 const print=Object.keys(names[cat][name].ceny)[0];
 assert.equal(C.calculateApparel(prices,cat,name,print,'Brak',1).price,amount);
 assert.equal(C.calculateApparel(prices,cat,name,'Brak',print,10).price,amount*10*.9);
 assert.throws(()=>C.calculateApparel(prices,cat,name,print,print,1),/tylko jeden/);
}
assert.throws(()=>C.calculateApparel(prices,'Koszulki bawełniane','Basic 160 g','Brak','Brak',1),/przynajmniej jeden/);
assert.throws(()=>C.calculateApparel(prices,'Koszulki bawełniane','Basic 160 g',defaultPrint,'Brak',1.5),/pełnych sztuk/);
// 0.25.1: kamizelki liczone jak koszulki (odzież 25/35 zł + nadruki) — patrz apparel_print_limits_0251.test.cjs
console.log('OK: apparel prices, 2-sided prints, standalone-print no discounts, fixed 1-print products');
