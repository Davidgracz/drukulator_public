// 0.25.1: kamizelki liczone jak koszulki (odzież + nadruki), z ograniczonym zestawem nadruków; czapki 45/50/55 zł.
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=require('../data/prices.json');
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const root=prices.odziez_z_nadrukiem.produkty;
// ceny odzieży
assert.equal(root['Kamizelki odblaskowe']['Brixton Flash'].cena_odziezy,25);
assert.equal(root['Kamizelki odblaskowe']['Malfini Rimeck'].cena_odziezy,35);
for(const v of Object.values(root['Kamizelki odblaskowe'])){assert.ok(!v.nadruk_w_cenie&&!v.ceny);}
// nadruki: przód 10x15 (15 zł), tył 10x15 / 20x30 (15 / 20 zł); wymagany co najmniej jeden
const calc=(p,f,b,q=1)=>C.calculateApparel(prices,'Kamizelki odblaskowe',p,f,b,q).price;
assert.equal(calc('Brixton Flash','Do 10x15 cm',C.NO_PRINT),40);
assert.equal(calc('Malfini Rimeck','Do 10x15 cm',C.NO_PRINT),50);
assert.equal(calc('Brixton Flash',C.NO_PRINT,'Do 20x30 cm'),45);
assert.equal(calc('Brixton Flash','Do 10x15 cm','Do 20x30 cm'),60);
assert.equal(calc('Brixton Flash','Do 10x15 cm','Do 20x30 cm',10),540);   // rabat 10% od 10 szt.
assert.throws(()=>calc('Brixton Flash',C.NO_PRINT,C.NO_PRINT),/przynajmniej jeden nadruk/);
// poza zakresem: z przodu nie ma 20x30 ani 35x40; z tyłu nie ma 35x40
assert.throws(()=>calc('Brixton Flash','Do 20x30 cm',C.NO_PRINT),/nie ma nadruku/);
assert.throws(()=>calc('Malfini Rimeck','Do 35x40 cm',C.NO_PRINT),/nie ma nadruku/);
assert.throws(()=>calc('Malfini Rimeck',C.NO_PRINT,'Do 35x40 cm'),/nie ma nadruku/);
// koszulki bez ograniczeń (35x40 nadal dostępny)
assert.equal(C.calculateApparel(prices,'Koszulki bawełniane','Basic 160 g','Do 35x40 cm',C.NO_PRINT,1).price,70);
// czapki
const cap=n=>C.calculateApparel(prices,'Czapki',n,'Nadruk standardowy',C.NO_PRINT,1).price;
assert.equal(cap('Czapka dziecięca'),45);
assert.equal(cap('Czapka bejsbolówka'),50);
assert.equal(cap('Czapka raperka'),55);
console.log('apparel print limits 0.25.1 OK');
