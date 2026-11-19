// 0.26.11v: minimalny wymiar naklejki / etykiety to 20 × 20 mm (wcześniej 30 × 30 mm); maksimum bez zmian (500 × 500 mm).
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/prices.json'),'utf8'));
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const P='Naklejki, etykiety';
let passed=0;
function t(name,fn){try{fn();passed++;console.log('PASS',name);}catch(e){console.log('FAIL',name,e.message);process.exitCode=1;}}
t('20 × 20 mm jest przyjęte i wyceniane',()=>{
  const r=C.calculateStickers(prices,P,100,20,20);
  assert.ok(r.price>0);
  assert.equal(r.productionWidthMm,23); assert.equal(r.productionHeightMm,23);
  assert.equal(r.stickersPerRow,43);            // floor(1000 / 23)
  assert.equal(r.rows,3);                       // ceil(100 / 43)
  assert.ok(r.totalStickers>=100);
});
t('20 × 20 mm: obowiązuje minimum zamówienia (minimum_m2)',()=>{
  const r=C.calculateStickers(prices,P,10,20,20);
  assert.ok(Math.abs(r.minimumLengthM-prices.naklejki.powierzchniowe[P].minimum_m2)<1e-9);
  assert.ok(r.billedLengthM>=r.minimumLengthM-1e-9);
  assert.ok(r.price>0);
});
t('granice: 20 działa na obu wymiarach, 19 jest odrzucone',()=>{
  assert.ok(C.calculateStickers(prices,P,50,20,200).price>0);
  assert.ok(C.calculateStickers(prices,P,50,200,20).price>0);
  assert.throws(()=>C.calculateStickers(prices,P,50,19,50),/Minimalny wymiar naklejki to 20 × 20 mm\./);
  assert.throws(()=>C.calculateStickers(prices,P,50,50,19),/Minimalny wymiar naklejki to 20 × 20 mm\./);
  assert.throws(()=>C.calculateStickers(prices,P,50,19.9,50),/Minimalny wymiar naklejki to 20 × 20 mm\./);
});
t('maksimum 500 × 500 mm bez zmian',()=>{
  assert.ok(C.calculateStickers(prices,P,5,500,500).price>0);
  assert.throws(()=>C.calculateStickers(prices,P,5,501,100),/Maksymalny wymiar naklejki to 500 × 500 mm\./);
});
t('wymiary 30 × 30 i większe liczą się jak dotąd',()=>{
  const r=C.calculateStickers(prices,P,100,30,30);
  assert.equal(r.productionWidthMm,33); assert.equal(r.stickersPerRow,30);
});
t('serwer (send-order.php) ma ten sam zakres 20–500 mm',()=>{
  const php=fs.readFileSync(path.join(__dirname,'../send-order.php'),'utf8');
  assert.ok(php.includes('$width < 20 || $height < 20 || $width > 500 || $height > 500'));
  assert.ok(php.includes('od 20 × 20 mm do 500 × 500 mm'));
  assert.ok(!php.includes('od 30 × 30 mm'));
});
console.log(`${passed} testów`);
