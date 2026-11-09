// 0.25.2: obrazy na płótnie — format w obu orientacjach (30x40 i 40x30) ma tę samą cenę, nieznany format jest odrzucany.
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=require('../data/prices.json');
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const list=prices.obrazy_na_plotnie.formaty;
// format z cennika działa jak dotąd
assert.equal(C.calculateCanvasStandard(prices,'30x40',1).price,list['30x40']);
assert.equal(C.calculateCanvasStandard(prices,'30x40',3).price,list['30x40']*3);
// odwrócony kierunek = ta sama cena
for(const key of Object.keys(list)){
  const [a,b]=key.split('x');
  assert.equal(C.calculateCanvasStandard(prices,`${b}x${a}`,2).price,list[key]*2,key);
  assert.equal(C.calculateCanvasStandard(prices,`${b}x${a}`,2).unitPrice,list[key],key);
}
assert.equal(C.calculateCanvasStandard(prices,'40x30',1).price,75);
assert.equal(C.calculateCanvasStandard(prices,'150x30',1).price,list['30x150']);
// brak formatu w cenniku (150x150 nie ma ceny) albo zły zapis = błąd, nie „NaN zł”
assert.throws(()=>C.calculateCanvasStandard(prices,'150x150',1),/Brak formatu/);
assert.throws(()=>C.calculateCanvasStandard(prices,'25x25',1),/Brak formatu/);
assert.throws(()=>C.calculateCanvasStandard(prices,'abc',1),/Brak formatu/);
// ograniczenia ilości bez zmian
assert.throws(()=>C.calculateCanvasStandard(prices,'30x40',11));
assert.throws(()=>C.calculateCanvasStandard(prices,'30x40',0));
// ceny w cenniku nie zmieniły się (kontrola kilku wartości z 0.25.1v)
assert.equal(list['30x40'],75);assert.equal(list['40x60'],110);assert.equal(list['100x140'],340);
console.log('PASS canvas_calc_0252');
