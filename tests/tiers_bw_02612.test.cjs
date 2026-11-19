// 0.26.12v: czarno-biały druk cyfrowy — przedziały 1–20: 1,00 zł, 21–50: 0,80 zł, 51–100: 0,50 zł, 101–500: 0,30 zł, 501+: 0,20 zł.
// Kolorowy i „Ksero i druk” bez zmian; przedział wybierany jest z kluczy tabeli cen.
const assert=require('node:assert/strict');
const fs=require('fs');const vm=require('vm');const path=require('path');
const prices=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/prices.json'),'utf8'));
const context={};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/calculators.js'),'utf8'),context);
const C=context.Calculators;
const near=(a,b)=>assert.ok(Math.abs(a-b)<0.005,`${a} != ${b}`);
const d=prices.druk_cyfrowy_i_ksero;
let passed=0;
function t(name,fn){try{fn();passed++;console.log('PASS',name);}catch(e){console.log('FAIL',name,e.message);process.exitCode=1;}}
const bw={colorMode:'Czarno-biały',formatName:'A4',paperType:'Standardowy 80 g',sideMode:'Jednostronny',sets:1};
const print=(pages,extra={})=>C.calculateDigitalPrint(prices,{...bw,pages,...extra});

t('cennik: czarno-biały druk cyfrowy ma pięć przedziałów, kolorowy i ksero bez zmian',()=>{
  assert.deepEqual(d.druk_cyfrowy['Czarno-biały'],{'1-20':1,'21-50':0.8,'51-100':0.5,'101-500':0.3,'501+':0.2});
  assert.deepEqual(d.druk_cyfrowy['Kolorowy'],{'1-20':3,'21-100':2.5,'101-500':2,'501+':1.5});
  assert.deepEqual(d.ksero_i_druk['Czarno-biały'],{'1-20':1,'21-100':0.5,'101-500':0.3,'501+':0.2});
});
t('Druk cyfrowy 24h, B/W: granice 20 / 21 / 50 / 51 / 100 / 101 / 500 / 501 i ceny za stronę',()=>{
  const expect=[[1,'1-20',1],[20,'1-20',1],[21,'21-50',0.8],[50,'21-50',0.8],[51,'51-100',0.5],[100,'51-100',0.5],[101,'101-500',0.3],[500,'101-500',0.3],[501,'501+',0.2]];
  for(const [pages,tier,unit] of expect){const r=print(pages);assert.equal(r.tier,tier,`${pages}`);near(r.basePrice??unit,unit);near(r.printTotal,pages*unit);}
});
t('Druk cyfrowy 24h, B/W: przykładowe ceny (80 g bez dopłaty)',()=>{
  near(print(30).price,24); near(print(50).price,40); near(print(51).price,25.5); near(print(100).price,50);
});
t('próg liczony od wszystkich stron × komplety × format: 10 stron × 3 komplety = 30 -> 21-50; A3 (×2): 11 stron = 22 -> 21-50',()=>{
  assert.equal(print(10,{sets:3}).tier,'21-50'); near(print(10,{sets:3}).price,24);
  assert.equal(print(11,{formatName:'A3'}).tier,'21-50'); near(print(11,{formatName:'A3'}).printTotal,17.6);
  assert.equal(print(26,{formatName:'A3'}).tier,'51-100');   // 52 jednostki
});
t('dwustronnie: próg liczony od stron, nie od arkuszy',()=>{
  const r=print(40,{sideMode:'Dwustronny'}); assert.equal(r.sheets,20); assert.equal(r.tier,'21-50'); near(r.printTotal,32);
});
t('Kolorowy: jeden przedział 21–100 jak dotąd',()=>{
  for(const pages of [21,50,51,100]){const r=print(pages,{colorMode:'Kolorowy'});assert.equal(r.tier,'21-100');near(r.printTotal,pages*2.5);}
});
t('Druk cyfrowy (stara funkcja): B/W 30 stron = 0,80 zł, Ksero i druk B/W 30 stron = 0,50 zł',()=>{
  const dc=C.calculateDigital(prices,'Druk cyfrowy','Czarno-biały',30,'A4','Standardowy 80 g','Jednostronny');
  assert.equal(dc.tier,'21-50'); near(dc.price,24);
  const kd=C.calculateDigital(prices,'Ksero i druk','Czarno-biały',30,'A4','Standardowy 80 g');
  assert.equal(kd.tier,'21-100'); near(kd.price,15);
  near(C.calculateDigital(prices,'Ksero i druk','Czarno-biały',60,'A4','Standardowy 80 g').price,30);
});
t('Druk i oprawa prac: używa tabeli druku cyfrowego (B/W 30 stron = 0,80 zł za stronę)',()=>{
  const type=Object.keys(prices.oprawa_prac.rodzaje_opraw)[0], variant=Object.keys(prices.oprawa_prac.rodzaje_opraw[type])[0];
  const r=C.calculateWorkBinding(prices,30,1,'Czarno-biały','Jednostronny',type,variant);
  assert.equal(r.tier,'21-50'); near(r.printPricePerPage,0.8);
  const k=C.calculateWorkBinding(prices,30,1,'Kolorowy','Jednostronny',type,variant); assert.equal(k.tier,'21-100');
});
t('getQuantityTier: bez tabeli stary podział, z tabelą — klucze tabeli (także stary lokalny cennik 21-100)',()=>{
  assert.equal(C.getQuantityTier(60),'21-100');
  assert.equal(C.getQuantityTier(60,{'1-20':1,'21-100':0.5,'101-500':0.3,'501+':0.2}),'21-100');
  assert.equal(C.getQuantityTier(60,{'1-20':1,'21-50':0.8,'51-100':0.5,'101-500':0.3,'501+':0.2}),'51-100');
  assert.equal(C.getQuantityTier(20.5,{'1-20':1,'21-50':0.8,'51-100':0.5,'101-500':0.3,'501+':0.2}),'21-50');
  assert.equal(C.getQuantityTier(100000,{'1-20':1,'21-50':0.8,'501+':0.2}),'501+');
});
console.log(`${passed} testów`);
