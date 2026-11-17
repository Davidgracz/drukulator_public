// 0.26.7v: oprawy w druku cyfrowym — własny cennik i pojemność w kartkach, rozmiar dobierany automatycznie (najmniejszy, który mieści kartki
// jednego kompletu), bindowanie tylko dla papieru 80 g, przekroczenie pojemności = błąd, cennik „Oprawy prac” bez zmian.
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/prices.json'),'utf8'));
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<0.0051,`${msg||''} ${a} != ${b}`);
let passed=0;
function t(name,fn){try{fn();passed++;console.log('PASS',name);}catch(e){console.log('FAIL',name,e.message);process.exitCode=1;}}

const ZAC='Oprawa miękka zaciskowa', PLA='Bindowanie – spirala plastikowa', MET='Bindowanie – spirala metalowa';
// [rozmiar, kartek do, cena] — dokładnie z zamówienia
const TABLE={
  [ZAC]:[['5 mm',40,12.5],['10 mm',90,14.5],['13 mm',110,17.5],['16 mm',145,20.5]],
  [PLA]:[['14 mm',90,10],['19 mm',150,12],['25 mm',200,15],['32 mm',260,17],['38 mm',320,20],['51 mm',430,23]],
  [MET]:[['6,4 mm',30,11],['9,5 mm',60,13],['12,7 mm',90,15],['14,3 mm',105,18]]
};
// jednostronnie 1 strona = 1 kartka
const run=(type,sheets,over={})=>C.calculateDigitalPrint(prices,{colorMode:'Czarno-biały',pages:sheets,sets:1,formatName:'A4',paperType:'Standardowy 80 g',sideMode:'Jednostronny',bindingType:type,bindingVariant:'',...over});

t('cennik i pojemności w prices.json zgodne z zamówieniem',()=>{
  for (const [type,rows] of Object.entries(TABLE)) {
    const sizes=C.getDigitalBindingSizes(prices,type);
    assert.equal(JSON.stringify(sizes.map(x=>[x.size,x.maxSheets,x.price])),JSON.stringify(rows),type);
  }
  assert.deepEqual(Array.from(C.getDigitalBindingTypes(prices)),[ZAC,PLA,MET]);
});

t('rozmiar dobierany do kartek: dokładnie na granicach pojemności (n → ten rozmiar, n+1 → następny)',()=>{
  for (const [type,rows] of Object.entries(TABLE)) {
    rows.forEach(([size,cap,price],i)=>{
      const at=run(type,cap); assert.equal(at.bindingVariant,size,`${type} ${cap}`); near(at.bindingTotal,price,`${type} ${size}`); assert.equal(at.bindingCapacity,cap);
      const lo=run(type,i===0?1:rows[i-1][1]+1); assert.equal(lo.bindingVariant,size,`${type} ${size} dolna granica`);
      if (i<rows.length-1) assert.equal(run(type,cap+1).bindingVariant,rows[i+1][0],`${type} ${cap+1}`);
      else assert.throws(()=>run(type,cap+1),/większa niż pojemność oprawy/,`${type} ${cap+1}`);
    });
  }
});

t('przykład z zamówienia: 86 kartek',()=>{
  assert.equal(run(PLA,86).bindingVariant,'14 mm');   // do 90 kartek
  assert.equal(run(ZAC,86).bindingVariant,'10 mm');   // do 90 kartek
  assert.equal(run(MET,86).bindingVariant,'12,7 mm'); // do 90 kartek
  assert.equal(run(PLA,91).bindingVariant,'19 mm');
});

t('kartki liczone na komplet: dwustronnie 2 strony na kartce, nieparzysta strona = cała kartka',()=>{
  assert.equal(run(PLA,172,{sideMode:'Dwustronny'}).sheetsPerSet,86);
  assert.equal(run(PLA,172,{sideMode:'Dwustronny'}).bindingVariant,'14 mm');
  assert.equal(run(PLA,173,{sideMode:'Dwustronny'}).sheetsPerSet,87);
  assert.equal(run(PLA,181,{sideMode:'Dwustronny'}).sheetsPerSet,91);
  assert.equal(run(PLA,181,{sideMode:'Dwustronny'}).bindingVariant,'19 mm');
  // komplety nie sumują kartek — rozmiar zależy od jednego kompletu, a oprawa jest na każdy komplet
  const r=run(PLA,60,{sets:5}); assert.equal(r.sheetsPerSet,60); assert.equal(r.bindingVariant,'14 mm'); assert.equal(r.bindingCopies,5); near(r.bindingTotal,50);
});

t('przekazany rozmiar jest ignorowany (nie można wybrać „najtańszej” oprawy, która się nie zmieści)',()=>{
  assert.equal(run(PLA,200,{bindingVariant:'14 mm'}).bindingVariant,'25 mm');
  assert.equal(run(PLA,200,{bindingVariant:'51 mm'}).bindingVariant,'25 mm');
  assert.equal(run(PLA,200,{bindingVariant:'nie istnieje'}).bindingVariant,'25 mm');
});

t('za dużo kartek: błąd z pojemnością',()=>{
  assert.throws(()=>run(PLA,500),/\(500\).*„Bindowanie – spirala plastikowa”.*maks\. 430/);
  assert.throws(()=>run(ZAC,146),/maks\. 145/);
  assert.throws(()=>run(MET,106),/maks\. 105/);
});

t('bindowanie tylko dla papieru 80 g',()=>{
  for (const paper of ['Papier kredowy 130 g','Papier kredowy 170 g','Papier kredowy 250 g','Papier kredowy 300 g','Papier kredowy 350 g'])
    assert.throws(()=>run(PLA,10,{paperType:paper}),/tylko dla papieru 80 g/,paper);
  assert.equal(run(PLA,10).bindingActive,true);
  assert.equal(run('Brak',10,{paperType:'Papier kredowy 250 g'}).bindingActive,false);   // bez oprawy każdy papier działa
});

t('kanałowa i nieznane rodzaje oprawy odrzucone',()=>{
  assert.throws(()=>run('Oprawa kanałowa twarda A4',10),/nie jest dostępna/);
  assert.throws(()=>run('Coś innego',10),/Nieprawidłowy rodzaj oprawy/);
});

t('własny cennik: pozycje bez pojemności lub ceny są pomijane, a własne ceny i pojemności działają',()=>{
  const custom=JSON.parse(JSON.stringify(prices)); const d=custom.druk_cyfrowy_i_ksero;
  d.oprawy_ceny[PLA]={'14 mm':11,'19 mm':13,'25 mm':''}; d.oprawy_pojemnosc_kartek[PLA]={'14 mm':50,'19 mm':100};   // 25 mm bez ceny → pominięty
  const sizes=C.getDigitalBindingSizes(custom,PLA); assert.equal(JSON.stringify(sizes.map(x=>[x.size,x.maxSheets,x.price])),JSON.stringify([['14 mm',50,11],['19 mm',100,13]]));
  const r=C.calculateDigitalPrint(custom,{colorMode:'Czarno-biały',pages:70,formatName:'A4',paperType:'Standardowy 80 g',sideMode:'Jednostronny',bindingType:PLA});
  assert.equal(r.bindingVariant,'19 mm'); near(r.bindingTotal,13);
  assert.throws(()=>C.calculateDigitalPrint(custom,{colorMode:'Czarno-biały',pages:101,formatName:'A4',paperType:'Standardowy 80 g',sideMode:'Jednostronny',bindingType:PLA}),/maks\. 100/);
});

t('„Oprawa prac” (osobna strona) zachowuje swój cennik',()=>{
  assert.equal(prices.oprawa_prac.rodzaje_opraw[PLA]['14 mm'],7);
  assert.equal(prices.oprawa_prac.rodzaje_opraw[ZAC]['10 mm'],11.9);
  assert.ok('Oprawa kanałowa twarda A4' in prices.oprawa_prac.rodzaje_opraw);
});

console.log(`${passed} passed`);
