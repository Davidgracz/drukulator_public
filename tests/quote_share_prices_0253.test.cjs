// 0.25.3: link do zamówienia („Utwórz link do zamówienia”) ważny 7 dni; poprawione dwie ceny obrazów na płótnie.
const assert=require('node:assert/strict');
const fs=require('fs');const path=require('path');
const php=fs.readFileSync(path.join(__dirname,'../quote-share.php'),'utf8');
assert.match(php,/const D24_SHARED_QUOTES_RETENTION_DAYS = 7;/);
// termin liczony ze stałej (nie z liczby wpisanej na sztywno) i zwracany użytkownikowi jako data
assert.match(php,/modify\('\+' \. D24_SHARED_QUOTES_RETENTION_DAYS \. ' days'\)/);
assert.match(php,/'expiresLabel' => wp_date\('d\.m\.Y', \$expires->getTimestamp\(\)\)/);
// wygasłe linki są odrzucane przy odczycie
assert.match(php,/expires_at >= %s/);
// ceny: poprawione 80x80 i 40x120, reszta formatów jak w 0.25.2v
const list=require('../data/prices.json').obrazy_na_plotnie.formaty;
assert.equal(list['80x80'],185);assert.equal(list['40x120'],175);
assert.equal(list['30x40'],75);assert.equal(list['80x90'],195);assert.equal(list['70x80'],170);
// spójność cennika: większy format nigdy nie kosztuje mniej niż mniejszy (oba kierunki)
const sides=[];for(let s=30;s<=150;s+=10)sides.push(s);
const key=(a,b)=>`${Math.min(a,b)}x${Math.max(a,b)}`;
for(const a of sides)for(const b of sides){
  const k=key(a,b);if(!(k in list))continue;
  for(const [a2,b2] of [[a,b+10],[a+10,b]]){
    const k2=key(a2,b2);
    if(k2 in list)assert.ok(list[k2]>=list[k],`${k2} (${list[k2]}) tańszy niż ${k} (${list[k]})`);
  }
}
console.log('PASS quote_share_prices_0253');
