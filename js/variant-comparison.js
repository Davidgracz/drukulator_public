/* Drukulator 0.23.7v — comparison UI. Final prices and cart entries use the
   unchanged Drukulator calculation/checkout pipeline. No private customer data. */
(() => {
  'use strict';
  const content = document.getElementById('content');
  const pricing = window.Druk24ConfiguratorPricing;
  if (!content || !pricing) return;

  const fieldMap = {
    'Wizytówki 24h': { bcQuantity: 'Nakład', bcFinish: 'Wykończenie', bcSides: 'Zadruk' },
    'Ulotki 24h': { flyQuantity: 'Nakład', flyFormat: 'Format', flyVariant: 'Rodzaj ulotki' },
    'Plakaty 24h': { posterQty: 'Nakład', posterFormat: 'Format' },
    'Druk cyfrowy i ksero 24h': { digQty: 'Ilość', digPaper: 'Papier', digFormat: 'Format', digSide: 'Zadruk' },
    'Folie i banery 24h': { bannerQty: 'Nakład', bannerMaterial: 'Materiał' },
    'Naklejki, etykiety i magnesy': { stickQty: 'Nakład', stickProduct: 'Materiał' },
    'Roll-upy i X-banery': { rollQty: 'Nakład', rollSize: 'Rozmiar' }
  };
  const selectedFieldByPage = new Map();
  const nf = () => new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'pl-PL', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const tr = (pl, en) => document.documentElement.lang === 'en' ? en : pl;
  const money = value => `${nf().format(value)} zł`;
  const make = (tag, className, label) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (label !== undefined) element.textContent = String(label);
    return element;
  };
  const num = raw => Number(String(raw).replace(',', '.'));
  function isUsable(ctrl) {
    if (!ctrl || !ctrl.isConnected || ctrl.disabled || ctrl.closest('.hidden,[hidden]')) return false;
    return getComputedStyle(ctrl).display !== 'none';
  }
  function formValues(form) {
    const result = {};
    form.querySelectorAll('input[id],select[id]').forEach(ctrl => {
      if (ctrl.type !== 'file') result[ctrl.id] = ctrl.value;
    });
    return result;
  }
  function candidatesForQuantity(control, page = "") {
    const current = num(control.value);
    if (!Number.isSafeInteger(current) || current <= 0) return [];
    if (control.tagName === 'SELECT') {
      const available = Array.from(control.options).filter(o => !o.disabled && o.value && Number.isSafeInteger(Number(o.value)) && Number(o.value)>0)
        .map(o => Number(o.value)).sort((a,b)=>a-b);
      const index = available.indexOf(current);
      if (index === -1) return [];
      const start = Math.max(0, Math.min(index - 2, available.length - 5));
      return available.slice(start, start + 5).map(q => ({value:String(q),label:`${q} ${tr('szt.','pcs')}`,quantity:q}));
    }
    if (control.type !== 'number') return [];
    if (page === 'Naklejki, etykiety i magnesy' && control.id === 'stickQty') {
      const candidates = [50, 100, 250, 350, 500];
      if (!candidates.includes(current)) candidates[3] = current;
      return [...new Set(candidates)].sort((a,b)=>a-b).map(q=>({value:String(q),label:`${q} ${tr('szt.','pcs')}`,quantity:q}));
    }
    const max = control.max ? Number(control.max) : Infinity;
    const min = control.min ? Number(control.min) : 1;
    const bases = new Set([
      current, Math.floor(current*.5), Math.floor(current*.75),
      Math.ceil(current*1.25), Math.ceil(current*1.5), Math.ceil(current*2),
      1,2,5,10,20,25,30,50,100,150,200,250,300,500,750,1000,1500,2000,3000,5000
    ]);
    const values = [...bases].filter(q => Number.isSafeInteger(q) && q >= min && q <= max && q > 0)
      .sort((a,b)=>a-b);
    const left = values.filter(q => q < current).slice(-2);
    const right = values.filter(q => q > current).slice(0,3);
    return [...left,current,...right].map(q => ({value:String(q),label:`${q} ${tr('szt.','pcs')}`,quantity:q}));
  }
  function optionsFor(control, isQuantity, page = "") {
    if (isQuantity) return candidatesForQuantity(control, page);
    if (control.tagName !== 'SELECT') return [];
    return Array.from(control.options).filter(o=>!o.disabled && o.value && String(o.textContent).trim() && o.value !== 'Własny wymiar')
      .slice(0,25).map(o=>({value:o.value,label:String(o.textContent).trim()}));
  }
  function quantityId(page, form) {
    const fields = fieldMap[page] || {};
    const id = Object.keys(fields).find(key=>/Quantity|Qty$/.test(key) && isUsable(form.querySelector(`[id="${key}"]`)));
    return id || null;
  }
  function buildData(page, form, fieldId) {
    const control = form.querySelector(`[id="${fieldId}"]`);
    if (!isUsable(control)) return null;
    const qId = quantityId(page, form);
    if (!qId) return null;
    const qty = num(form.querySelector(`[id="${qId}"]`)?.value);
    if (!Number.isSafeInteger(qty) || qty < 1) return null;
    const isQuantity = fieldId === qId;
    const values = formValues(form);
    const result = optionsFor(control, isQuantity, page)
      .map(item => {
        const price = pricing.preview(fieldId, item.value, values);
        if (price === null || !Number.isFinite(price) || price <= 0 || price > 5000) return null;
        const quantity = isQuantity ? item.quantity : qty;
        return {...item, price, quantity, unitPrice:price/quantity};
      }).filter(Boolean);
    if (!result.length) return null;
    if (result.length > 7) {
      const index = result.findIndex(v => v.value === control.value);
      const from = Math.max(0, Math.min(index - 2, result.length - 7));
      result.splice(0,from);result.length = 7;
    }
    const base = result.find(item=>item.value === control.value);
    if (!base || result.length < 2) return null;
    return {page,fieldId,base,items:result,isQuantity,qty};
  }
  function panel(card) {
    let host = card.querySelector(':scope > .d24-variant-compare');
    if (host) return host;
    host = make('section','d24-variant-compare');
    host.setAttribute('aria-label',tr('Porównanie wycen','Quote comparison'));
    const existing = card.querySelector(':scope > .d24-config-comparison');
    (existing || card.querySelector(':scope > .form-grid'))?.after(host);
    host.addEventListener('click',e=>{
      const mode=e.target.closest('button[data-compare-mode]');
      if (mode && host.contains(mode)) {
        selectedFieldByPage.set(pricing.page(),mode.dataset.compareMode);
        schedule();
      }
    });
    host.addEventListener('click',e=>{
      const button = e.target.closest('button[data-compare-choice]');
      if (!button || !host.contains(button)) return;
      const currentPage = pricing.page();
      const form = content.querySelector(':scope > .card .form-grid');
      const fieldId = host.querySelector('button[data-compare-mode][aria-pressed="true"]')?.dataset.compareMode;
      if (!form || !fieldId || !(fieldId in (fieldMap[currentPage]||{}))) return;
      const model = buildData(currentPage,form,fieldId);
      const item = model?.items.find(v=>v.value===button.dataset.compareChoice);
      if (!item) return;
      const applied = pricing.apply(fieldId,item.value,item.price,button.dataset.compareAdd==='1');
      if (applied) {
        schedule();
        const quote = document.getElementById('quoteArea');
        if (button.dataset.compareAdd !== '1' && quote) quote.scrollIntoView({behavior:'smooth',block:'nearest'});
      }
    });
    return host;
  }
  function buildCard(item,data,minUnit) {
    const current = item.value === data.base.value;
    const cheapest = item.unitPrice <= minUnit + .00000001;
    const node = make('article','d24-vc-card' + (current ? ' is-active':''));
    const top = make('div','d24-vc-card__top');
    top.append(make('strong','d24-vc-card__name',item.label));
    if (current) top.append(make('span','d24-vc-tag',tr('Aktualny','Current')));
    else if (cheapest) top.append(make('span','d24-vc-tag d24-vc-tag--blue',tr('Najniższa cena / szt.','Lowest per-unit price')));
    node.append(top);
    const total = make('div','d24-vc-card__total',money(item.price));
    total.append(make('small','',tr('brutto łącznie','gross total')));
    node.append(total);
    const unit = make('div','d24-vc-card__unit');
    unit.append(make('strong','',money(item.unitPrice)),make('span','',tr('za sztukę','per piece')));
    node.append(unit);
    // 0.24.8: karta pokazuje faktyczną cenę wariantu (łączną i za sztukę) — bez różnic „+/−” względem wybranego wariantu.
    const buttons = make('div','d24-vc-card__buttons');
    // 0.24.0: jeden przycisk na kartę. Wybór ustawia wariant w formularzu; do koszyka dodaje
    // jeden, stały przycisk przy cenie (pasek ceny), więc nie ma dwóch różnych „Dodaj”.
    if (current) {
      node.append(make('p','d24-vc-card__current',tr('✓ Wybrane','✓ Selected')));
    } else {
      const choose = make('button','button secondary d24-vc-button',tr('Wybierz ten wariant','Choose this option'));
      choose.type='button'; choose.dataset.compareChoice=item.value;
      choose.dataset.compareAdd='0'; buttons.append(choose);
      node.append(buttons);
    }
    return node;
  }
  let queued=false;
  function schedule() {
    if (queued) return;
    queued=true;
    requestAnimationFrame(render);
  }
  function render() {
    queued=false;
    const page = pricing.page();
    const card = content.querySelector(':scope > .card');
    const form = card?.querySelector(':scope > .form-grid');
    if (!fieldMap[page] || !form || !card.querySelector(':scope > .actions #calculate')) {
      document.body.classList.remove('d24-has-variant-compare');
      return;
    }
    const fields = Object.keys(fieldMap[page]).filter(fieldId=> {
      const ctrl=form.querySelector(`[id="${fieldId}"]`);
      return isUsable(ctrl) && buildData(page, form, fieldId);
    });
    if (!fields.length) {
      card.querySelector(':scope > .d24-variant-compare')?.remove();
      document.body.classList.remove('d24-has-variant-compare');
      return;
    }
    const selected = selectedFieldByPage.get(page);
    const field = fields.includes(selected) ? selected : fields[0];
    const data = buildData(page,form,field);
    if (!data) return;
    document.body.classList.add('d24-has-variant-compare');
    const host=panel(card);
    const signature = JSON.stringify([page,field,fields,data.items,data.base,document.documentElement.lang]);
    if (host.dataset.signature === signature) return;
    host.dataset.signature=signature;
    const wasOpen=host.querySelector('details.d24-fold')?.open || false;
    host.replaceChildren();
    const fold=make('details','d24-fold d24-vc-fold');fold.open=wasOpen;
    const summary=make('summary','d24-fold__summary');
    summary.append(make('span','d24-fold__label',tr('Porównaj warianty','Compare options')),
      make('span','d24-fold__hint',tr('Cena łączna i za sztukę','Total and per-piece prices')),
      make('span','d24-fold__chevron','⌄'));
    fold.append(summary);
    const body=make('div','d24-fold__body');fold.append(body);host.append(fold);
    const header=make('div','d24-vc-heading');
    const title = make('div','');
    title.append(make('span','d24-vc-overline',tr('Szybkie porównanie','Quick comparison')),
      make('h3','',tr('Porównaj warianty','Compare options')),
      make('p','',tr('Te same parametry, inny wybrany element. Ilość pozostaje bez zmian.', 'Same settings, one element changed. The quantity stays the same.')));
    header.append(title);body.append(header);
    const controls=make('div','d24-vc-controls');
    const modes=make('div','d24-vc-modes');
    modes.append(make('span','d24-vc-mode-label',tr('Co chcesz porównać?','What do you want to compare?')));
    fields.forEach(id=>{
      const button=make('button','d24-vc-mode-button',fieldMap[page][id]);
      button.type='button';button.dataset.compareMode=id;
      button.setAttribute('aria-pressed',String(id===field));
      modes.append(button);
    });
    controls.append(modes);
    controls.append(make('small','',tr('Kwoty brutto z aktualnego cennika Druk24','Gross prices from the current Druk24 price list')));
    body.append(controls);
    const cards=make('div','d24-vc-grid');
    const minUnit=Math.min(...data.items.map(item=>item.unitPrice));
    data.items.forEach(item=>cards.append(buildCard(item,data,minUnit)));
    body.append(cards);
    body.append(make('p','d24-vc-note',tr('Maksymalna wartość zamówienia online: 5 000 zł.', 'Maximum online order amount: PLN 5,000.')));
  }
  new MutationObserver(schedule).observe(content,{childList:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  content.addEventListener('input',e=>{if (!e.target.closest('.d24-variant-compare')) schedule();},true);
  content.addEventListener('change',e=>{if (!e.target.closest('.d24-variant-compare')) schedule();},true);
  schedule();
})();
