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

t('próg cenowy liczony od wszystkich stron: 10 stron × 2 komplety = 20 -> 1-20, × 3 = 30 -> 21-100',()=>{
  const bw={...base,colorMode:'Czarno-biały',pages:10,sideMode:'Jednostronny',paperType:'Standardowy 80 g'};
  assert.equal(C.calculateDigitalPrint(prices,{...bw,sets:2}).tier,'1-20');
  assert.equal(C.calculateDigitalPrint(prices,{...bw,sets:3}).tier,'21-100');
  near(C.calculateDigitalPrint(prices,{...bw,sets:3}).price,15); // 30 × 0,50
});

t('A3: mnożnik formatu dla druku, papieru i foliowania',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,colorMode:'Czarno-biały',pages:10,sets:2,formatName:'A3',sideMode:'Jednostronny',paperType:'Papier kredowy 250 g',foilType:'Błysk'});
  assert.equal(r.printUnits,40); assert.equal(r.tier,'21-100'); near(r.printTotal,20);      // 40 × 0,50
  near(r.paperTotal,0.75*20*2);                                                             // 20 arkuszy × 2
  near(r.foilTotal,1.5*20*2); near(r.price,20+30+60);
});

t('foliowanie liczone od wszystkich arkuszy (wszystkie komplety)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,paperType:'Papier kredowy 300 g',sets:3,foilType:'Satyna'});
  near(r.foilTotal,2*60); // 3 × 20 arkuszy
});

t('oprawa: jedna na komplet (ceny z „Oprawy prac”)',()=>{
  for (const [type,variant,unit] of [['Oprawa miękka zaciskowa','5 mm',9.9],['Bindowanie – spirala plastikowa','51 mm',19],['Bindowanie – spirala metalowa','4 mm',7]]) {
    const r=C.calculateDigitalPrint(prices,{...base,sets:4,bindingType:type,bindingVariant:variant});
    assert.equal(r.bindingCopies,4); near(r.bindingTotal,unit*4,type);
  }
  const none=C.calculateDigitalPrint(prices,{...base,sets:4,bindingType:'Brak'});
  assert.equal(none.bindingActive,false); near(none.bindingTotal,0); assert.equal(none.bindingCopies,0);
});

t('liczba opraw z opcji jest ignorowana (usunięte pole)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,sets:2,bindingType:'Oprawa miękka zaciskowa',bindingVariant:'10 mm',bindingCopies:99});
  assert.equal(r.bindingCopies,2);
});

t('wszystko razem: 3 komplety',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,paperType:'Papier kredowy 250 g',sets:3,foilType:'Błysk',bindingType:'Bindowanie – spirala metalowa',bindingVariant:'8 mm'});
  // 120 stron -> 101-500: 2,00 × 120 = 240; papier 60 arkuszy × 0,75 = 45; folia 60 × 1,50 = 90; oprawa 3 × 8 = 24
  assert.equal(r.tier,'101-500'); near(r.printTotal,240); near(r.paperTotal,45); near(r.foilTotal,90); near(r.bindingTotal,24); near(r.price,399);
});

t('walidacja kompletów: 0, ujemne, ułamek',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,sets:0}),/Ilość kompletów/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,sets:-1}),/Ilość kompletów/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,sets:1.5}),/całkowitą/);
});

console.log(`${passed} passed`);
