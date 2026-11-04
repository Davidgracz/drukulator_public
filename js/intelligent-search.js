/* Drukulator 0.23.4v: local, rule-based product retrieval.
   Existing data/search-terms.json and its admin overrides remain the source of truth.
   No remote search API; no collection or transmission of search phrases here. */
((root, factory) => {
  const engine = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  if (root) root.Druk24IntelligentSearch = engine;
})(typeof window === 'object' ? window : null, () => {
  'use strict';
  const norm = input => String(input || '').toLocaleLowerCase('pl-PL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const STOP = new Set(('chce chcialbym chcialabym potrzebuje potrzebny poprosze prosze zamowic zamowie zamowienie wycena cena ile koszt ile to za na od z ze do dla w we po i lub oraz albo czy mi mnie o ten te tych zrobic wydrukowac drukowanie format wielkosc rozmiar szt sztuk sztuki sztuke egz kopii egzemplarzy stron kartek pilnie ekspres szybko').split(' '));
  const GENERIC = new Set(('druk druki produkt usluga materialy papier firma reklamowy reklamowe wydruk zamowienia kopie').split(' '));
  const RECENT_KEY = 'drukulator_recent_products_v0230';
  const EXAMPLES = [
    '100 wizytówek dwustronnych', 'Naklejki na słoiki', 'Menu do restauracji',
    'Plakat A2', 'Ksero A4 kolor', 'Baner na ogrodzenie', 'Zaproszenia na ślub',
    'Nadruk na koszulce'
  ];
  // Typical descriptions by use, distinct from a category label. Only supported calculators.
  const PURPOSES = [
    ['Naklejki, etykiety i magnesy', ['na sloiki','etykiety na butelki','naklejki na produkty','oznaczenia produktow','na opakowania','nalepki z logo','wlepki na laptop']],
    ['Restauracje, hotele', ['menu restauracji','menu do restauracji','karta dan','dla restauracji','dla hotelu','podkladki na tace','menu na stol']],
    ['Śluby, wesela i imprezy', ['na wesele','na slub','zaproszenia slubne','winietki na stol','plan stolow','dekoracja weselna']],
    ['Folie i banery 24h', ['baner na ogrodzenie','baner na plot','oklejenie witryny','na szybe sklepu','na szybe samochodu','reklama na ogrodzeniu','na witryne']],
    ['PCV i pianki', ['tabliczka na drzwi','tablica sztywna','plansza na pcv','tabliczka informacyjna','reklama na piance']],
    ['Koszulki i odzież', ['nadruk na koszulce','logo na bluzie','nadruk na ubraniach','dla druzyny koszulki','ubranie z logo']],
    ['Oprawa prac', ['oprawa licencjatu','oprawa magisterki','zbindowac prace','zrobic prace dyplomowa']],
    ['Druk cyfrowy i ksero 24h', ['skserowac dokument','wydruk dokumentu','wydruk pdf','wydrukowac kilkanascie kartek','kolorowe kopie','dla studentow']],
    ['Roll-upy i X-banery', ['stojak na targi','reklama na targi','system wystawienniczy']],
    ['Kalendarze', ['prezent na nowy rok','kalendarz z logo']],
    ['Obrazy na płótnie', ['zdjecie na sciane','obraz z fotografii']],
    ['Laminowanie', ['zabezpieczyc dokument','zalaminowac kartke']]
  ];
  const categories = list => Object.keys(list || {});
  const tokenize = x => norm(x).split(' ').filter(t => t && t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t));
  function distance(a, b, limit = 2) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    if (a === b) return 0;
    let prev = Array.from({length: b.length + 1}, (_, i) => i);
    for (let i=1; i<=a.length; i++) {
      const next=[i]; let best=next[0];
      for (let j=1; j<=b.length; j++) {
        const v=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        next.push(v); best=Math.min(best,v);
      }
      if (best>limit) return limit+1;
      prev=next;
    }
    return prev[b.length];
  }
  // Cache only by object identity; editing or importing admin terms yields a fresh dictionary.
  const cache = new WeakMap();
  function index(dictionary) {
    if (!dictionary || typeof dictionary !== 'object') return [];
    if (cache.has(dictionary)) return cache.get(dictionary);
    const rows=Object.entries(dictionary).filter(([category,terms]) => Array.isArray(terms)).map(([category,terms]) => {
      const phrases=Array.from(new Set([category,...terms].map(norm).filter(x=>x.length>1 && x.length<=140))).slice(0,450);
      const phraseWords=phrases.map(text=>({text,words:tokenize(text)}));
      const words=Array.from(new Set(phraseWords.flatMap(x=>x.words))).filter(x=>x.length>2);
      return {category, phrases:phraseWords, words, label:norm(category)};
    });
    cache.set(dictionary,rows);
    return rows;
  }
  function rank(query,dictionary,limit=18) {
    const q=norm(query);
    if (!q) return [];
    const queryWords=Array.from(new Set(tokenize(q)));
    const result=[];
    for (const entry of index(dictionary)) {
      let best=0, winning='', reason='dopasowanie';
      // Phrase match, with strong preference for concrete product names over generic words.
      for (const p of entry.phrases) {
        const phrase=p.text;
        if (q===phrase) { if (450>best) { best=450; winning=phrase; reason='dokładnie'; } continue; }
        const wordBoundary=(` ${q} `).includes(` ${phrase} `);
        if (wordBoundary && phrase.length>=4) {
          const tokens=p.words.filter(x=>!GENERIC.has(x));
          const strength = tokens.length ? 1 : 0.25;
          const current=85+Math.min(110,phrase.length*3)*strength;
          if (current>best) {best=current;winning=phrase;reason='fraza';}
        } else if (q.length>=3 && phrase.startsWith(q)) {
          if (110>best) {best=110;winning=phrase;reason='początek';}
        }
      }
      // Whole-token coverage avoids rewarding unrelated long dictionaries.
      let covered=0, fuzzy=0;
      for (const word of queryWords) {
        if (entry.words.includes(word)) { covered++; continue; }
        if (word.length<4) continue;
        const maxDist=word.length>=8?2:1;
        if (entry.words.some(w=>Math.abs(w.length-word.length)<=maxDist && distance(word,w,maxDist)<=maxDist)) fuzzy++;
      }
      const purposeful=queryWords.length?Math.min(1,(covered+fuzzy*.55)/queryWords.length):0;
      let score=best+(covered*43)+(fuzzy*20)+(purposeful*40);
      const labelWords=tokenize(entry.category);
      for (const word of queryWords) {
        if (labelWords.includes(word)) {score+=36; continue;}
        if (word.length>=5 && labelWords.some(label=>Math.abs(label.length-word.length)<=2 && distance(label,word,word.length>=8?2:1)<=(word.length>=8?2:1))) score+=145;
      }
      // A lone generic term is not enough for an unrelated category.
      if (covered===0 && fuzzy===0 && best===0) score=0;
      if (queryWords.length>=2 && covered===0 && best<110) score=0;
      for (const [target,aliases] of PURPOSES) {
        if (entry.category!==target) continue;
        const found=aliases.find(alias=>(` ${q} `).includes(` ${alias} `));
        if (found) { score+=285; if (score>best) {winning=found;reason='zastosowanie';} }
      }
      // In longer descriptions favour items that cover more of the meaningful words.
      if (queryWords.length>=2 && covered+fuzzy>0) score+=(covered+fuzzy*.5)/queryWords.length*35;
      if (score>35) result.push({pageName:entry.category,score:Math.round(score),reason,matchedPhrase:winning});
    }
    result.sort((a,b)=>b.score-a.score || a.pageName.localeCompare(b.pageName,'pl'));
    const threshold=result.length && result[0].score>=125 ? Math.max(50,result[0].score*0.24) : 40;
    return result.filter(item=>item.score>=threshold).slice(0,Math.max(1,limit));
  }
  function recent(dictionary, storage) {
    try {
      const raw=JSON.parse(storage?.getItem(RECENT_KEY)||'[]');
      return Array.isArray(raw)?raw.filter(x=>typeof x==='string' && Object.prototype.hasOwnProperty.call(dictionary||{},x)).slice(0,3):[];
    } catch { return []; }
  }
  return {normalize:norm,rank,recent,EXAMPLES,RECENT_KEY};
});
