// 0.26.2v: Druk cyfrowy 24h — ilość kompletów (komplet = jeden egzemplarz całego dokumentu); jedna oprawa na komplet.
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/prices.json'),'utf8'));
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<0.0051,`${msg||''} ${a} != ${b}`);
const base={colorMode:'Kolorowy',pages:40,formatName:'A4',paperType:'Papier kredowy 130 g',sideMode:'Dwustronny'};
let passed=0;
function t(name,fn){try{fn();passed++;console.log('PASS',name);}catch(e){console.log('FAIL',name,e.message);process.exitCode=1;}}

t('komplet domyślnie 1: wynik jak bez pola',()=>{
  const a=C.calculateDigitalPrint(prices,base), b=C.calculateDigitalPrint(prices,{...base,sets:1});
  near(a.price,106); near(b.price,106); assert.equal(a.sets,1); assert.equal(a.totalPages,40);
});

t('2 komplety × 40 stron dwustronnie: 80 stron, 40 arkuszy',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,sets:2});
  assert.equal(r.totalPages,80); assert.equal(r.sheetsPerSet,20); assert.equal(r.sheets,40); assert.equal(r.printUnits,80);
  assert.equal(r.tier,'21-100'); near(r.printTotal,200); near(r.paperTotal,12); near(r.price,212);
});

t('nieparzysta liczba stron: każdy komplet ma własne arkusze (5 stron × 2 komplety = 6 arkuszy, nie 5)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,pages:5,sets:2,paperType:'Standardowy 80 g'});
  assert.equal(r.sheetsPerSet,3); assert.equal(r.sheets,6); assert.equal(r.totalPages,10); near(r.price,30); // 10 stron × 3 zł
});

t('jednostronnie: arkusze = strony × komplety',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,pages:10,sets:3,sideMode:'Jednostronny'});
  assert.equal(r.sheets,30); assert.equal(r.totalPages,30); assert.equal(r.tier,'21-100'); near(r.printTotal,75); near(r.paperTotal,9);
});

t('próg cenowy liczony od wszystkich stron: 10 stron × 2 komplety = 20 -> 1-20, × 3 = 30 -> 21-50',()=>{
  const bw={...base,colorMode:'Czarno-biały',pages:10,sideMode:'Jednostronny',paperType:'Standardowy 80 g'};
  assert.equal(C.calculateDigitalPrint(prices,{...bw,sets:2}).tier,'1-20');
  assert.equal(C.calculateDigitalPrint(prices,{...bw,sets:3}).tier,'21-50');
  near(C.calculateDigitalPrint(prices,{...bw,sets:3}).price,24); // 30 × 0,80 (0.26.12)
});

t('A3: mnożnik formatu dla druku, papieru i foliowania',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,colorMode:'Czarno-biały',pages:10,sets:2,formatName:'A3',sideMode:'Jednostronny',paperType:'Papier kredowy 250 g',foilType:'Błysk'});
  assert.equal(r.printUnits,40); assert.equal(r.tier,'21-50'); near(r.printTotal,32);      // 40 × 0,80 (0.26.12)
  near(r.paperTotal,0.75*20*2);                                                             // 20 arkuszy × 2
  near(r.foilTotal,1.5*20*2); near(r.price,32+30+60);
});

t('foliowanie liczone od wszystkich arkuszy (wszystkie komplety)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,paperType:'Papier kredowy 300 g',sets:3,foilType:'Satyna'});
  near(r.foilTotal,2*60); // 3 × 20 arkuszy
});

const bindBase={...base,paperType:'Standardowy 80 g'};   // 0.26.7: bindowanie tylko dla papieru 80 g; 40 stron dwustronnie = 20 kartek na komplet
t('oprawa: jedna na komplet (własny cennik opraw druku cyfrowego, rozmiar dobrany do kartek)',()=>{
  for (const [type,variant,unit] of [['Oprawa miękka zaciskowa','5 mm',12.5],['Bindowanie – spirala plastikowa','14 mm',10],['Bindowanie – spirala metalowa','6,4 mm',11]]) {
    const r=C.calculateDigitalPrint(prices,{...bindBase,sets:4,bindingType:type});
    assert.equal(r.bindingCopies,4); assert.equal(r.bindingVariant,variant,type); near(r.bindingTotal,unit*4,type);
  }
  const none=C.calculateDigitalPrint(prices,{...bindBase,sets:4,bindingType:'Brak'});
  assert.equal(none.bindingActive,false); near(none.bindingTotal,0); assert.equal(none.bindingCopies,0);
});

t('liczba opraw z opcji jest ignorowana (usunięte pole)',()=>{
  const r=C.calculateDigitalPrint(prices,{...bindBase,sets:2,bindingType:'Oprawa miękka zaciskowa',bindingCopies:99});
  assert.equal(r.bindingCopies,2);
});

t('wszystko razem: 3 komplety (druk + papier + oprawa; foliowanie osobno)',()=>{
  const r=C.calculateDigitalPrint(prices,{...bindBase,sets:3,bindingType:'Bindowanie – spirala metalowa'});
  // 120 stron -> 101-500: 2,00 × 120 = 240; papier 80 g bez dopłaty; oprawa 3 × 11 (20 kartek → do 6,4 mm)
  assert.equal(r.tier,'101-500'); near(r.printTotal,240); near(r.paperTotal,0); near(r.bindingTotal,33); near(r.price,273);
  const f=C.calculateDigitalPrint(prices,{...base,paperType:'Papier kredowy 250 g',sets:3,foilType:'Błysk'});
  near(f.printTotal,240); near(f.paperTotal,45); near(f.foilTotal,90); near(f.price,375);
});

t('walidacja kompletów: 0, ujemne, ułamek',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,sets:0}),/Ilość sztuk/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,sets:-1}),/Ilość sztuk/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,sets:1.5}),/całkowitą/);
});

console.log(`${passed} passed`);
