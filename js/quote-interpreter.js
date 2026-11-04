/* Drukulator 0.23.5v — local interpreter UI adapter.
 * No AI, network calls, or price calculations. The existing pricing engine remains
 * the only authority for available products, standard quantities and final prices.
 * Exported as CommonJS for regression tests as well as a browser global. */
((root, factory) => {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.Druk24QuoteInterpreter = engine;
})(typeof window === 'object' ? window : null, () => {
  'use strict';
  const normalize = value => String(value ?? '').toLocaleLowerCase('pl-PL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
  const validNumber = value => Number.isFinite(Number(value)) && Number(value) > 0;

  function parse(query) {
    const text = String(query || '').slice(0, 400);
    const plain = normalize(text);
    const dim = text.match(/(?:^|[^\d])(?<width>\d+(?:[.,]\d+)?)\s*[x×]\s*(?<height>\d+(?:[.,]\d+)?)\s*(?<unit>mm|cm|m)?\b/i);
    let raw = dim ? text.replace(dim[0], ' ') : text;
    // Never treat paper weight (130 g), dimensions or format A4 as a quantity.
    raw = raw.replace(/\b\d+(?:[.,]\d+)?\s*(?:g\s*\/?\s*m2|gram(?:ow|y)?|g)\b/gi,' ');
    const exact = raw.match(/\b(\d{1,6})\s*(?:szt\.?|sztuk|sztuki|egz\.?|egzemplarzy|kopii|kartek|arkuszy|stron|kompletow|kompletów)\b/i);
    const first = (normalize(raw).match(/(?:^|\s)(\d{1,6})(?=\s|$)/) || [])[1];
    const amount = exact ? Number(exact[1]) : first ? Number(first) : null;
    const fmt = plain.match(/(?:^|\s)(a[0-7]|b[0-2]|dl)(?=\s|$)/i);
    const sides = /\bdwustron\w*/.test(plain) ? 'Dwustronny' : /\bjednostron\w*/.test(plain) ? 'Jednostronny' : null;
    const color = /\b(?:czarno[ -]?bial|cz[ -]?b|mono)\w*/.test(plain) ? 'Czarno-biały' : /\bkolor\w*/.test(plain) ? 'Kolorowy' : null;
    const grams = text.match(/\b(\d{2,3})\s*(?:g\/?m²|g\/?m2|g|gram(?:y|ów|ow)?)\b/i);
    return {
      quantity: amount && amount > 0 ? amount : null,
      format: fmt ? fmt[1].toUpperCase() : null,
      dimensions: dim ? `${dim.groups.width.replace(',','.')} × ${dim.groups.height.replace(',','.')} ${dim.groups.unit || '(jednostkę potwierdź)'}` : null,
      sides, color, paper: grams ? `${grams[1]} g` : null
    };
  }

  function availableFormats(page, prices) {
    if (page === 'Wizytówki 24h') return (prices?.wizytowki?.formaty || []).slice();
    if (page === 'Druk cyfrowy i ksero 24h') return Object.keys(prices?.druk_cyfrowy_i_ksero?.mnozniki_formatu || {});
    if (page === 'Ulotki 24h') {
      const values = new Set();
      Object.values(prices?.ulotki || {}).forEach(variants => Object.values(variants || {}).forEach(formats => Object.keys(formats || {}).forEach(v=>values.add(v))));
      return Array.from(values);
    }
    if (page === 'Plakaty 24h') {
      const values = new Set();
      Object.values(prices?.plakaty || {}).forEach(formats => Object.keys(formats || {}).forEach(v=>values.add(v)));
      return Array.from(values);
    }
    return [];
  }

  function availableStandardQuantities(page, prices) {
    const rows = new Set();
    const root = ({'Wizytówki 24h':prices?.wizytowki,'Ulotki 24h':prices?.ulotki,'Plakaty 24h':prices?.plakaty})[page];
    const visit = (data, depth=0) => {
      if (!data || typeof data !== 'object' || depth>5) return;
      Object.entries(data).forEach(([key,value]) => {
        if (/^\d{1,6}$/.test(key) && validNumber(key)) rows.add(Number(key));
        if (typeof value === 'object') visit(value,depth+1);
      });
    };
    visit(root);
    if (page === 'Plakaty 24h' && prices?.plakaty?.['Wielkoformatowy 24h']) [1,2,5,10,20,30].forEach(value=>rows.add(value));
    return Array.from(rows).sort((a,b)=>a-b);
  }

  function filteredAnswers(question, page, prices, query = '') {
    const chips = Array.isArray(question?.chips) ? question.chips.filter(chip=>Array.isArray(chip) && chip.length>=2) : [];
    const prompt = normalize(question?.prompt || '');
    if (prompt.includes('format')) {
      const available = (page === 'Ulotki 24h' && !normalize(query).includes('sklad')
        ? Array.from(new Set(Object.values(prices?.ulotki || {}).flatMap(v=>Object.keys(v?.Standard || {}))))
        : availableFormats(page,prices)).map(normalize);
      return chips.filter(([answer]) => available.some(item=>item === normalize(answer) || item.startsWith(`${normalize(answer)} `)));
    }
    if (prompt.includes('ile sztuk') || prompt.includes('ile egzemplarzy')) {
      const available = availableStandardQuantities(page,prices);
      if (available.length) return available.slice(0,8).map(value=>[`${value} szt.`,`${value} szt.`]);
    }
    return chips;
  }

  function inspect(query, matches, prices, question, intent) {
    const text = String(query || '').trim();
    if (!text || !prices) return null;
    // The page match is supplied by the existing 0.23.4 search dictionary.
    const best = Array.isArray(matches) ? matches[0] : null;
    const page = intent?.pageName || question?.pageName || (best && best.score >= 90 ? best.pageName : null);
    if (!page || !Number.isFinite(best?.score || 0) && !intent) return null;
    if (best && best.score < 90 && !intent && !question?.pageName) return null;
    const fields = parse(text);
    const captured = [];
    if (fields.quantity) captured.push(['Nakład',`${fields.quantity} szt.`]);
    if (fields.format) captured.push(['Format',fields.format]);
    if (fields.dimensions) captured.push(['Wymiary',fields.dimensions]);
    if (fields.sides) captured.push(['Zadruk',fields.sides]);
    if (fields.color) captured.push(['Kolor',fields.color]);
    if (fields.paper) captured.push(['Papier',fields.paper]);
    const questionNeeded = question?.status === 'question';
    const answers = questionNeeded ? filteredAnswers(question,page,prices,text) : [];
    const formats = availableFormats(page,prices);
    const relevantFormats = page === 'Ulotki 24h' && !normalize(text).includes('sklad')
      ? Array.from(new Set(Object.values(prices?.ulotki || {}).flatMap(v=>Object.keys(v?.Standard || {})))) : formats;
    const allowed = !fields.format || !relevantFormats.length || relevantFormats.some(item=>normalize(item)===normalize(fields.format) || (page !== 'Ulotki 24h' && normalize(item).startsWith(normalize(fields.format)+' ')));
    const warnings=[];
    if (!allowed) warnings.push(`Format ${fields.format} nie jest dostępny w tej kategorii — sprawdź wariant w kalkulatorze.`);
    if (!questionNeeded && intent?.quantityFallback) warnings.push(`Nakład ${intent.requestedQuantity} szt. nie występuje w wybranym wariancie. Propozycja: ${intent.selectedQuantity} szt. — potwierdź w kalkulatorze.`);
    if (!questionNeeded && intent && (!fields.sides && page==='Wizytówki 24h')) warnings.push('Sposób zadruku to propozycja — sprawdź przed dodaniem do koszyka.');
    return {
      page, fields: captured, prompt: questionNeeded ? question.prompt : '',
      answers:answers.slice(0,8),
      intent: questionNeeded ? null : intent || null, warnings,
      action: questionNeeded ? 'clarify' : intent ? 'calculate' : 'navigate',
      summary: intent?.summary || '',
      confidence: (best && best.pageName===page && best.score>=160) || Boolean(intent) ? 'Wysokie dopasowanie' : 'Propozycja produktu'
    };
  }
  return {parse,availableFormats,availableStandardQuantities,filteredAnswers,inspect};
});
