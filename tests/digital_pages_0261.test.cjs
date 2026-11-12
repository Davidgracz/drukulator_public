// 0.26.1v: Druk cyfrowy 24h liczony od liczby stron + foliowanie + bindowanie i oprawy.
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

t('ceny: papier kolorowy i etykietowy usunięte, foliowanie jest',()=>{
  const d=prices.druk_cyfrowy_i_ksero;
  assert.equal('Papier kolorowy' in d.doplaty_do_papieru,false);
  assert.equal('Papier etykietowy' in d.doplaty_do_papieru,false);
  assert.deepEqual(d.foliowanie,{Jednostronne:{Satyna:2,'Błysk':1.5},Dwustronne:{Satyna:2.5,'Błysk':2}});
});

t('dwustronny: 40 stron = 20 arkuszy, druk od stron, papier od arkuszy',()=>{
  const r=C.calculateDigitalPrint(prices,base);
  assert.equal(r.sheets,20); assert.equal(r.printUnits,40); assert.equal(r.tier,'21-100');
  near(r.printTotal,100); near(r.paperTotal,6); near(r.price,106);
});

t('jednostronny: arkuszy tyle co stron',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,sideMode:'Jednostronny'});
  assert.equal(r.sheets,40); near(r.printTotal,100); near(r.paperTotal,12); near(r.price,112);
});

t('dwustronny, nieparzysta liczba stron: 5 stron = 3 arkusze, druk 5 stron',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,pages:5,paperType:'Standardowy 80 g'});
  assert.equal(r.sheets,3); assert.equal(r.printUnits,5); near(r.price,15); // 5 × 3 zł
});

t('1 strona dwustronnie = 1 arkusz',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,pages:1,paperType:'Standardowy 80 g'});
  assert.equal(r.sheets,1); near(r.price,3);
});

t('próg cenowy liczony od stron × mnożnik formatu (A3)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,colorMode:'Czarno-biały',pages:11,formatName:'A3',paperType:'Standardowy 80 g',sideMode:'Jednostronny'});
  assert.equal(r.printUnits,22); assert.equal(r.tier,'21-100'); near(r.printTotal,11); // 22 × 0,50
});

t('granice progów: 20 -> 1-20, 21 -> 21-100, 101 -> 101-500, 501 -> 501+',()=>{
  const tier=pages=>C.calculateDigitalPrint(prices,{...base,colorMode:'Czarno-biały',pages,paperType:'Standardowy 80 g'}).tier;
  assert.equal(tier(20),'1-20'); assert.equal(tier(21),'21-100'); assert.equal(tier(100),'21-100');
  assert.equal(tier(101),'101-500'); assert.equal(tier(500),'101-500'); assert.equal(tier(501),'501+');
});

t('foliowanie: brak = 0, każda z czterech kombinacji',()=>{
  const none=C.calculateDigitalPrint(prices,{...base,foilSide:'Brak'});
  near(none.foilTotal,0); assert.equal(none.foilActive,false);
  const table={Jednostronne:{Satyna:2,'Błysk':1.5},Dwustronne:{Satyna:2.5,'Błysk':2}};
  for(const side of Object.keys(table)) for(const type of Object.keys(table[side])){
    const r=C.calculateDigitalPrint(prices,{...base,foilSide:side,foilType:type});
    near(r.foilTotal,table[side][type]*20,`${side} ${type}`); // 20 arkuszy
    near(r.price,106+table[side][type]*20); assert.equal(r.foilActive,true);
  }
});

t('foliowanie liczone od arkuszy, A3 = 2 × A4',()=>{
  const a4=C.calculateDigitalPrint(prices,{...base,pages:10,sideMode:'Jednostronny',foilSide:'Jednostronne',foilType:'Błysk'});
  near(a4.foilTotal,15); // 10 arkuszy × 1,50
  const a3=C.calculateDigitalPrint(prices,{...base,pages:10,sideMode:'Jednostronny',formatName:'A3',foilSide:'Jednostronne',foilType:'Błysk'});
  near(a3.foilTotal,30);
});

t('foliowanie: brak rodzaju folii lub nieznany sposób -> błąd',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,foilSide:'Dwustronne',foilType:''}),/rodzaj folii/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,foilSide:'Trójstronne',foilType:'Satyna'}),/foliowania/);
});

t('oprawa: lista bez oprawy kanałowej',()=>{
  const types=C.getDigitalBindingTypes(prices);
  assert.equal(types.includes('Oprawa kanałowa twarda A4'),false);
  assert.deepEqual(Array.from(types),['Oprawa miękka zaciskowa','Bindowanie – spirala plastikowa','Bindowanie – spirala metalowa']);
});

t('oprawa: cena × liczba opraw, niezależna od liczby stron',()=>{
  const one=C.calculateDigitalPrint(prices,{...base,bindingType:'Bindowanie – spirala plastikowa',bindingVariant:'14 mm',bindingCopies:1});
  near(one.bindingTotal,7); near(one.price,113); assert.equal(one.bindingActive,true);
  const three=C.calculateDigitalPrint(prices,{...base,pages:200,bindingType:'Oprawa miękka zaciskowa',bindingVariant:'10 mm',bindingCopies:3});
  near(three.bindingTotal,35.7); assert.equal(three.bindingCopies,3);
});

t('oprawa: kanałowa odrzucona, brak rozmiaru, zła liczba opraw',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,bindingType:'Oprawa kanałowa twarda A4',bindingVariant:'5 mm'}),/nie jest dostępna/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,bindingType:'Oprawa miękka zaciskowa',bindingVariant:''}),/rozmiar/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,bindingType:'Oprawa miękka zaciskowa',bindingVariant:'5 mm',bindingCopies:0}),/Liczba opraw/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,bindingType:'Oprawa miękka zaciskowa',bindingVariant:'5 mm',bindingCopies:1.5}),/całkowitą/);
});

t('wszystko razem: druk + papier + foliowanie + oprawa',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,foilSide:'Dwustronne',foilType:'Satyna',bindingType:'Bindowanie – spirala plastikowa',bindingVariant:'14 mm',bindingCopies:2});
  near(r.price,100+6+50+14);
});

t('walidacja stron: 0, ujemne, ułamek',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,pages:0}),/Liczba stron/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,pages:-3}),/Liczba stron/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,pages:2.5}),/całkowitą/);
});

t('papier usunięty z cennika jest odrzucany',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,paperType:'Papier kolorowy'}),/papieru/);
});

t('arkuszowanie bez zmian (calculateDigital liczy w arkuszach)',()=>{
  const r=C.calculateDigital(prices,'Druk cyfrowy','Kolorowy',10,'A4','Standardowy 80 g','Dwustronny');
  near(r.price,60); // 10 arkuszy × 2 strony × 3 zł
  const imp=C.calculateDigitalImposition(prices,90,50,100,'Papier kredowy 130 g','Kolorowy','Jednostronny');
  assert.ok(imp.price>0&&imp.sheets>0);
});

t('pozostałe usługi bez zmian',()=>{
  near(C.calculateDigital(prices,'Ksero książki','Czarno-biały',10).price,prices.druk_cyfrowy_i_ksero.ksero_ksiazki['Czarno-biały']*10);
  near(C.calculateDigital(prices,'Ksero i druk','Czarno-biały',10,'A4','Standardowy 80 g').price,10);
});

console.log(`${passed} passed`);
