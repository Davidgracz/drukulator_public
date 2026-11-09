// 0.25.4: pianki — ceny za sztukę zależą od progu ilościowego (1 / 2–4 / 5–9 / od 10 szt.), także przy własnym wymiarze.
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=require('../data/prices.json');
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const P='Plansza pianka 5 mm';
// ceny podane przez właściciela: [1 szt., 2–4, 5–9, od 10]
const expected={
  'A3 (30 × 42 cm)':[50,45,40,35],
  'A2 (42 × 59 cm)':[55,50,45,40],
  'A1 (59 × 84 cm)':[90,85,75,70],
  'B2 (50 × 70 cm)':[65,60,55,50],
  'B1 (70 × 100 cm)':[120,110,100,90],
  'B0 (100 × 140 cm)':[220,200,190,180]
};
const formats=prices.pvc[P].formaty;
assert.deepEqual(Object.keys(formats),Object.keys(expected));
for(const [name,tier] of Object.entries(expected)){
  assert.deepEqual(formats[name].progi_ilosciowe.map(t=>t.min_szt),[1,2,5,10],name);
  assert.deepEqual(formats[name].progi_ilosciowe.map(t=>t.cena_sztuki),tier,name);
  assert.equal('cena_sztuki' in formats[name],false,'stara pojedyncza cena nie powinna zostać: '+name);
  // granice progów: 1 | 2,3,4 | 5..9 | 10, 20, 100
  const byQty={1:tier[0],2:tier[1],3:tier[1],4:tier[1],5:tier[2],7:tier[2],9:tier[2],10:tier[3],20:tier[3],100:tier[3]};
  for(const [q,unit] of Object.entries(byQty)){
    const r=C.calculateFoamBoardStandard(prices,P,name,Number(q));
    assert.equal(r.unitPrice,unit,`${name} x${q}`);
    assert.equal(r.price,unit*Number(q),`${name} x${q}`);
  }
}
// własny wymiar: format rozliczeniowy + cena jego progu
let r=C.calculateFoamBoardCustom(prices,P,45,60,1);   // mieści się w B2 (50×70)
assert.equal(r.billing.formatName,'B2 (50 × 70 cm)');assert.equal(r.unitPrice,65);assert.equal(r.price,65);
r=C.calculateFoamBoardCustom(prices,P,45,60,5);assert.equal(r.unitPrice,55);assert.equal(r.price,275);
r=C.calculateFoamBoardCustom(prices,P,45,60,12);assert.equal(r.unitPrice,50);assert.equal(r.price,600);
r=C.calculateFoamBoardCustom(prices,P,60,45,3);assert.equal(r.unitPrice,60);   // po obróceniu
r=C.calculateFoamBoardCustom(prices,P,100,140,10);assert.equal(r.billing.formatName,'B0 (100 × 140 cm)');assert.equal(r.price,1800);
assert.equal(C.findFoamBoardBillingFormat(prices,P,10,10,4).price,45);              // najmniejszy format = A3
assert.equal(C.findFoamBoardBillingFormat(prices,P,10,10).price,50);                // ilość domyślnie 1
// limity bez zmian
assert.throws(()=>C.calculateFoamBoardCustom(prices,P,101,101,1),/Maksymalny wymiar/);
assert.throws(()=>C.calculateFoamBoardCustom(prices,P,100,141,1),/Maksymalny wymiar/);
assert.throws(()=>C.calculateFoamBoardStandard(prices,P,'A3 (30 × 42 cm)',1.5),/pełnych sztukach/);
assert.throws(()=>C.calculateFoamBoardStandard(prices,P,'A3 (30 × 42 cm)',0));
assert.throws(()=>C.calculateFoamBoardStandard(prices,P,'A9',1),/Nie znaleziono/);
// zgodność wstecz: stary cennik z jedną ceną działa jako jedna cena dla każdej ilości
const legacy=JSON.parse(JSON.stringify(prices));
for(const f of Object.values(legacy.pvc[P].formaty)){f.cena_sztuki=f.progi_ilosciowe[0].cena_sztuki;delete f.progi_ilosciowe;}
assert.equal(C.calculateFoamBoardStandard(legacy,P,'A3 (30 × 42 cm)',10).price,500);
assert.equal(C.calculateFoamBoardCustom(legacy,P,45,60,2).price,130);
// ceny pozostałych produktów PCV bez zmian
assert.equal(prices.pvc['Folia z nadrukiem + PCV'].grubosci['4/5 mm'].progi_cenowe_m2[0].cena_m2,220);
console.log('PASS foam_tiers_0254');
