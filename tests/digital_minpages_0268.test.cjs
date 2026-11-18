// 0.26.8v: minimalna liczba stron w „Druku cyfrowym 24h” — dwustronnie 2, jednostronnie 1 (kalkulator jest ostatecznym strażnikiem).
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/prices.json'),'utf8'));
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const base={colorMode:'Czarno-biały',formatName:'A4',paperType:'Standardowy 80 g'};
let passed=0;
function t(name,fn){try{fn();passed++;console.log('PASS',name);}catch(e){console.log('FAIL',name,e.message);process.exitCode=1;}}

t('getDigitalMinPages: Dwustronny = 2, Jednostronny = 1',()=>{
  assert.equal(C.getDigitalMinPages('Dwustronny'),2);
  assert.equal(C.getDigitalMinPages('Jednostronny'),1);
});
t('dwustronnie: 1 strona jest odrzucona czytelnym komunikatem',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,pages:1,sets:1,sideMode:'Dwustronny'}),/Przy druku dwustronnym minimalna liczba stron to 2\./);
});
t('dwustronnie: 2 strony = 1 arkusz, 3 strony = 2 arkusze',()=>{
  assert.equal(C.calculateDigitalPrint(prices,{...base,pages:2,sets:1,sideMode:'Dwustronny'}).sheets,1);
  assert.equal(C.calculateDigitalPrint(prices,{...base,pages:3,sets:1,sideMode:'Dwustronny'}).sheets,2);
});
t('jednostronnie: 1 strona działa (1 arkusz)',()=>{
  const r=C.calculateDigitalPrint(prices,{...base,pages:1,sets:1,sideMode:'Jednostronny'});
  assert.equal(r.sheets,1); assert.ok(r.price>0);
});
t('jednostronnie: 0 stron nadal jest błędem',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,pages:0,sets:1,sideMode:'Jednostronny'}));
});
t('minimum dotyczy stron jednego kompletu, nie liczby kompletów',()=>{
  assert.throws(()=>C.calculateDigitalPrint(prices,{...base,pages:1,sets:10,sideMode:'Dwustronny'}),/minimalna liczba stron to 2/);
  assert.ok(C.calculateDigitalPrint(prices,{...base,pages:2,sets:10,sideMode:'Dwustronny'}).price>0);
});
t('starsza funkcja calculateDigital(„Druk cyfrowy”) ma to samo minimum',()=>{
  assert.throws(()=>C.calculateDigital(prices,'Druk cyfrowy','Czarno-biały',1,'A4','Standardowy 80 g','Dwustronny'),/minimalna liczba stron to 2/);
  assert.ok(C.calculateDigital(prices,'Druk cyfrowy','Czarno-biały',1,'A4','Standardowy 80 g','Jednostronny').price>0);
  assert.ok(C.calculateDigital(prices,'Ksero i druk','Czarno-biały',1,'A4','Standardowy 80 g').price>0);   // ksero nie ma zadruku
});
console.log(passed+' passed');
