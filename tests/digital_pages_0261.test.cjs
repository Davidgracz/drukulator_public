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
  assert.deepEqual(d.foliowanie,{Satyna:2,'Błysk':1.5,Mat:1.5});   // 0.26.3: jeden cennik, bez podziału na jedno- i dwustronne
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

t('2 strony dwustronnie = 1 arkusz (0.26.8: dwustronnie minimum to 2 strony)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,pages:2,paperType:'Standardowy 80 g'});
  assert.equal(r.sheets,1); near(r.price,6);   // druk 2 strony × 3 zł
});

t('próg cenowy liczony od stron × mnożnik formatu (A3)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,colorMode:'Czarno-biały',pages:11,formatName:'A3',paperType:'Standardowy 80 g',sideMode:'Jednostronny'});
  assert.equal(r.printUnits,22); assert.equal(r.tier,'21-50'); near(r.printTotal,17.6); // 22 × 0,80 (0.26.12: czarno-biały 21–50 = 0,80 zł)
});

t('granice progów czarno-białych: 20 -> 1-20, 21..50 -> 21-50, 51..100 -> 51-100, 101 -> 101-500, 501 -> 501+',()=>{
  const tier=pages=>C.calculateDigitalPrint(prices,{...base,colorMode:'Czarno-biały',pages,paperType:'Standardowy 80 g'}).tier;
  assert.equal(tier(20),'1-20'); assert.equal(tier(21),'21-50'); assert.equal(tier(50),'21-50'); assert.equal(tier(51),'51-100'); assert.equal(tier(100),'51-100');
  assert.equal(tier(101),'101-500'); assert.equal(tier(500),'101-500'); assert.equal(tier(501),'501+');
});

const foilBase={...base,paperType:'Papier kredowy 250 g'};   // foliowanie tylko dla kredy od 250 g
t('foliowanie: brak = 0, każdy z trzech rodzajów (jedna cena za arkusz, bez podziału na strony zadruku)',()=>{
  const none=C.calculateDigitalPrint(prices,{...foilBase,foilType:'Brak'});
  near(none.foilTotal,0); assert.equal(none.foilActive,false); assert.equal(none.foilType,'Brak');
  near(none.price,100+15); // 40 stron × 2,50 + 20 arkuszy × 0,75
  const table={Satyna:2,'Błysk':1.5,Mat:1.5};
  for(const type of Object.keys(table)){
    for(const sideMode of ['Jednostronny','Dwustronny']){
      const sheets=sideMode==='Jednostronny'?40:20;
      const r=C.calculateDigitalPrint(prices,{...foilBase,sideMode,foilType:type});
      near(r.foilTotal,table[type]*sheets,`${type} ${sideMode}`); assert.equal(r.foilActive,true); assert.equal(r.foilType,type);
    }
  }
  near(C.calculateDigitalPrint(prices,{...foilBase,foilType:'Satyna'}).price,115+40);
});

t('foliowanie liczone od arkuszy, A3 = 2 × A4',()=>{
  const a4=C.calculateDigitalPrint(prices,{...foilBase,pages:10,sideMode:'Jednostronny',foilType:'Błysk'});
  near(a4.foilTotal,15); // 10 arkuszy × 1,50
  const a3=C.calculateDigitalPrint(prices,{...foilBase,pages:10,sideMode:'Jednostronny',formatName:'A3',foilType:'Błysk'});
  near(a3.foilTotal,30);
});

t('foliowanie: tylko kreda od 250 g (250, 300, 350 tak; 80 g, 130 g, 170 g nie)',()=>{
  for(const paper of ['Papier kredowy 250 g','Papier kredowy 300 g','Papier kredowy 350 g']){
    assert.equal(C.isDigitalFoilPaper(paper),true,paper);
    near(C.calculateDigitalPrint(prices,{...base,paperType:paper,foilType:'Mat'}).foilTotal,30);
  }
  for(const paper of ['Standardowy 80 g','Papier kredowy 130 g','Papier kredowy 170 g']){
    assert.equal(C.isDigitalFoilPaper(paper),false,paper);
    assert.throws(()=>C.calculateDigitalPrint(prices,{...base,paperType:paper,foilType:'Satyna'}),/tylko dla papieru kredowego od 250 g/);
    near(C.calculateDigitalPrint(prices,{...base,paperType:paper,foilType:'Brak'}).foilTotal,0); // bez foliowania cienki papier działa jak dotąd
  }
  assert.equal(C.isDigitalFoilPaper('Papier kolorowy'),false); assert.equal(C.isDigitalFoilPaper(''),false); assert.equal(C.isDigitalFoilPaper(undefined),false);
  assert.equal(C.isDigitalFoilPaper('Karton 300 g'),false); // tylko kreda
});

t('foliowanie: lista rodzajów z cennika, nieznany rodzaj -> błąd, stary układ nie przechodzi',()=>{
  assert.deepEqual(Array.from(C.getDigitalFoilTypes(prices)),['Satyna','Błysk','Mat']);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...foilBase,foilType:'Brokat'}),/rodzaj folii/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...foilBase,foilType:'Jednostronne'}),/rodzaj folii/);
  const legacy=JSON.parse(JSON.stringify(prices)); legacy.druk_cyfrowy_i_ksero.foliowanie={Jednostronne:{Satyna:2}};
  assert.deepEqual(Array.from(C.getDigitalFoilTypes(legacy)),[]);
});

t('foliowanie: opcja foilSide ze starej wersji jest ignorowana',()=>{
  const r=C.calculateDigitalPrint(prices,{...foilBase,foilSide:'Dwustronne',foilType:'Brak'});
  assert.equal(r.foilActive,false); near(r.foilTotal,0);
});

t('oprawa: lista bez oprawy kanałowej',()=>{
  const types=C.getDigitalBindingTypes(prices);
  assert.equal(types.includes('Oprawa kanałowa twarda A4'),false);
  assert.deepEqual(Array.from(types),['Oprawa miękka zaciskowa','Bindowanie – spirala plastikowa','Bindowanie – spirala metalowa']);
});

const bindBase={...base,paperType:'Standardowy 80 g'};   // 0.26.7: bindowanie tylko dla papieru 80 g
t('oprawa: jedna oprawa na komplet, rozmiar dobrany do liczby kartek',()=>{
  const none=C.calculateDigitalPrint(prices,bindBase);
  const one=C.calculateDigitalPrint(prices,{...bindBase,bindingType:'Bindowanie – spirala plastikowa',bindingVariant:'51 mm'});   // przekazany rozmiar jest ignorowany: 20 kartek → do 14 mm
  assert.equal(one.bindingVariant,'14 mm'); assert.equal(one.bindingCapacity,90);
  near(one.bindingTotal,10); near(one.price,none.price+10); assert.equal(one.bindingActive,true); assert.equal(one.bindingCopies,1);
  const three=C.calculateDigitalPrint(prices,{...bindBase,pages:200,sets:3,bindingType:'Oprawa miękka zaciskowa'});   // 100 kartek na komplet → do 13 mm (110)
  assert.equal(three.bindingVariant,'13 mm'); near(three.bindingTotal,52.5); assert.equal(three.bindingCopies,3);
});

t('oprawa: kanałowa odrzucona; rozmiar z formularza nie ma znaczenia',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...bindBase,bindingType:'Oprawa kanałowa twarda A4',bindingVariant:'5 mm'}),/nie jest dostępna/);
  const r=C.calculateDigitalPrint(prices,{...bindBase,bindingType:'Oprawa miękka zaciskowa',bindingVariant:''});
  assert.equal(r.bindingVariant,'5 mm'); near(r.bindingTotal,12.5);
});

t('oprawa tylko dla papieru 80 g, foliowanie tylko od 250 g — razem się nie łączą',()=>{
  for (const paper of ['Papier kredowy 130 g','Papier kredowy 250 g','Papier kredowy 350 g']) {
    assert.throws(()=>C.calculateDigitalPrint(prices,{...bindBase,paperType:paper,bindingType:'Bindowanie – spirala plastikowa'}),/tylko dla papieru 80 g/,paper);
  }
  assert.throws(()=>C.calculateDigitalPrint(prices,{...bindBase,foilType:'Satyna',bindingType:'Bindowanie – spirala plastikowa'}),/tylko dla papieru kredowego od 250 g/);
  assert.throws(()=>C.calculateDigitalPrint(prices,{...foilBase,foilType:'Satyna',bindingType:'Bindowanie – spirala plastikowa'}),/tylko dla papieru 80 g/);
  assert.equal(C.isDigitalBindingPaper('Standardowy 80 g'),true); assert.equal(C.isDigitalBindingPaper('Papier kredowy 130 g'),false); assert.equal(C.isDigitalBindingPaper('Papier kredowy 80 g'),false);
});

t('foliowanie + komplety bez oprawy',()=>{
  const r=C.calculateDigitalPrint(prices,{...foilBase,sets:3,foilType:'Satyna'});
  near(r.price,240+45+120);   // 120 stron × 2,00 + 60 arkuszy × 0,75 + 60 × 2
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
