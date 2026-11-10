/* Drukulator 0.23.6v — intelligent configurators, progressive enhancement only.
   The native controls and app.js calculators remain the only sources of truth. */
(() => {
  'use strict';
  const content = document.getElementById('content');
  const pricing = window.Druk24ConfiguratorPricing;
  if (!content || !pricing) return;

  const tr = (pl, en) => document.documentElement.lang === 'en' ? en : pl;
  const money = value => new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'pl-PL', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value) + ' zł';
  const previewFields = {
    'Wizytówki 24h': ['bcFinish', 'bcSides'],
    'Ulotki 24h': ['flyFormat', 'flyVariant'],
    'Plakaty 24h': ['posterFormat'],
    'Druk cyfrowy i ksero 24h': ['digPaper', 'digSide', 'digFormat'],
    'Folie i banery 24h': ['bannerMaterial'],
    'Naklejki, etykiety i magnesy': ['stickProduct'],
    'Roll-upy i X-banery': ['rollSize']
  };
  const papers = [
    [/80\s*g/i, ['Lekki papier', 'Lightweight']],
    [/130\s*g/i, ['Papier o niższej gramaturze', 'Lighter paper']],
    [/170\s*g/i, ['Średnia gramatura', 'Medium weight']],
    [/250\s*g/i, ['Sztywniejszy papier', 'Heavier stock']],
    [/300\s*g|350\s*g/i, ['Gruby, sztywniejszy papier', 'Heavy stock']]
  ];
  let queued = false;
  const selectValues = () => {
    const values = {};
    content.querySelectorAll(':scope > .card .form-grid select, :scope > .card .form-grid input').forEach(ctrl => {
      if (ctrl.id && ctrl.type !== 'file') values[ctrl.id] = ctrl.value;
    });
    return values;
  };
  const permitted = (select) => Array.from(select.options)
    .filter(o => !o.disabled && o.value && String(o.label || o.textContent).trim())
    .map(o => ({value: o.value, label: String(o.label || o.textContent).trim()}));
  function visible(select) {
    if (!select || !select.isConnected || select.disabled || select.closest('.hidden, [hidden]')) return false;
    if (getComputedStyle(select).display === 'none') return false;
    return true;
  }
  function decoration(button, type, label) {
    let info = button.querySelector('.d24-choice-visual');
    if (info) return;
    info = document.createElement('span');
    info.className = 'd24-choice-visual';
    info.setAttribute('aria-hidden','true');
    const text = label.toLowerCase();
    if (type === 'format') {
      let dimensions = label.match(/\b(\d{2,4})\s*[x×]\s*(\d{2,4})/i);
      if (dimensions) {
        const w = Number(dimensions[1]), h = Number(dimensions[2]);
        if (w>0 && h>0) {
          const ratio = Math.min(w/h, 2.5);
          info.classList.add('d24-choice-visual--sheet');
          info.style.setProperty('--d24-sheet-ratio',String(ratio));
        }
      }
      if (!dimensions && /\b(?:A[0-6]|B[0-2]|DL)\b/i.test(text)) info.classList.add('d24-choice-visual--sheet');
    } else if (type === 'print' && /dwu|double|2.stron/i.test(text)) {
      info.textContent = '◫';
    } else if (type === 'print' && /jedno|single|1.stron/i.test(text)) {
      info.textContent = '▯';
    }
    if (info.classList.length > 1 || info.textContent) button.prepend(info);
  }
  function smallInfo(type, label) {
    if (type === 'paper') {
      const p = papers.find(([pattern]) => pattern.test(label));
      return p ? tr(...p[1]) : '';
    }
    if (type === 'print') {
      if (/dwu|double/i.test(label)) return tr('Zadruk dwóch stron', 'Print on both sides');
      if (/jedno|single/i.test(label)) return tr('Zadruk jednej strony', 'Print on one side');
    }
    return '';
  }
  function enrichChoices(card, values) {
    card.querySelectorAll('.field').forEach(field => {
      const select = field.querySelector(':scope > select');
      const chipRow = field.querySelector(':scope > .d24-smart-options');
      if (!select || !chipRow || !visible(select)) return;
      const kind = /^(rollSize|canvas)/.test(select.id) ? 'other' // 0.24.2: roll-upy i płótna — bez miniaturek-prostokątów przy formatach
        : /papier|gramatura/i.test(field.querySelector(':scope > label')?.textContent || '') ? 'paper'
        : /format/i.test(field.querySelector(':scope > label')?.textContent || '') ? 'format'
        : /zadruk|stronność/i.test(field.querySelector(':scope > label')?.textContent || '') ? 'print' : 'other';
      const available = permitted(select);
      const priceEnabled = (previewFields[pricing.page()] || []).includes(select.id);
      const prices = new Map();
      if (priceEnabled) available.forEach(o => {
        const price = pricing.preview(select.id, o.value, values);
        if (price !== null) prices.set(o.value, price);
      });
      const signature = JSON.stringify([document.documentElement.lang, select.id, kind, select.value, available, Array.from(prices.entries()), chipRow.dataset.signature || '']);
      if (chipRow.dataset.configuratorSignature === signature) return;
      chipRow.dataset.configuratorSignature = signature;
      chipRow.querySelectorAll('button[data-option-index]').forEach(button => {
        const option = select.options[Number(button.dataset.optionIndex)];
        if (!option) return;
        button.querySelectorAll('.d24-config-price, .d24-config-context, .d24-choice-visual').forEach(node => node.remove());
        const note = smallInfo(kind, option.label);
        decoration(button,kind,option.label);
        if (note) {
          const context = document.createElement('small');
          context.className = 'd24-config-context'; context.textContent = note;
          button.append(context);
        }
        const amount = prices.get(option.value);
        // 0.24.5: kwota przy formacie zostaje także wtedy, gdy dana ilość jest dostępna tylko w jednym formacie
        // (np. offset A3 × 500 szt. = 575 zł); chodzi o liczbę dostępnych opcji, nie o liczbę policzonych cen.
        if (amount !== undefined && available.length > 1) {
          const label = document.createElement('span');
          label.className = 'd24-config-price';
          label.textContent = money(amount);
          button.append(label);
        }
      });
    });
  }
  function getComparable(card, values) {
    const fieldIds = previewFields[pricing.page()] || [];
    for (const id of fieldIds) {
      const select = card.querySelector(`#${id}`);
      if (!visible(select)) continue;
      const options = permitted(select).slice(0,24);
      const alternatives = options.map(option => ({...option, price:pricing.preview(id,option.value,values)}))
        .filter(item => item.price !== null);
      if (alternatives.length < 2) continue;
      const uniquePrices = new Set(alternatives.map(item => item.price));
      if (uniquePrices.size < 2) continue; // Avoid pretending identical prices are meaningful savings.
      const selected = alternatives.find(item => item.value === select.value);
      if (!selected) continue;
      const sorted = [...alternatives].sort((a,b)=>a.price-b.price || a.label.localeCompare(b.label,'pl'));
      const sample = sorted.slice(0, 4);
      if (!sample.some(item=>item.value===selected.value)) sample[sample.length-1] = selected;
      sample.sort((a,b)=>a.price-b.price || a.label.localeCompare(b.label,'pl'));
      const label = select.closest('.field')?.querySelector('label')?.textContent?.trim() || tr('Wariant','Option');
      return {id,label,selected,sample};
    }
    return null;
  }
  function makeNode(tag, className, text) {
    const elem = document.createElement(tag);
    if (className) elem.className=className;
    if (text!==undefined) elem.textContent=text;
    return elem;
  }
  function updateComparison(card, values) {
    const config = getComparable(card,values);
    let host = card.querySelector(':scope > .d24-config-comparison');
    if (!config) { if(host) host.remove(); return; }
    if (!host) {
      host = makeNode('section','d24-config-comparison');
      host.setAttribute('aria-label',tr('Porównaj warianty','Compare options'));
      card.querySelector(':scope > .form-grid')?.after(host);
      host.addEventListener('click',event=>{
        const button=event.target.closest('button[data-compare-value]');
        if (!button || !host.contains(button)) return;
        const control=card.querySelector(`#${button.dataset.compareId}`);
        if (!visible(control)) return;
        const choice=Array.from(control.options).find(o=>o.value===button.dataset.compareValue && !o.disabled);
        if (!choice) return;
        // Dependent selectors in app.js may rebuild their quantity list.
        // Preserve the compared quantity whenever it is supported in both variants.
        const qtyId = control.id === 'flyFormat' ? 'flyQuantity' : control.id === 'bcFinish' ? 'bcQuantity' : null;
        const oldQty = qtyId ? card.querySelector(`#${qtyId}`)?.value : null;
        if (control.value !== choice.value) {
          control.value=choice.value;
          control.dispatchEvent(new Event('change',{bubbles:true}));
        }
        const nextQty = qtyId ? card.querySelector(`#${qtyId}`) : null;
        if (nextQty && oldQty !== null && Array.from(nextQty.options).some(o => o.value === oldQty && !o.disabled)) {
          nextQty.value = oldQty;
          nextQty.dispatchEvent(new Event('change',{bubbles:true}));
        }
        card.querySelector(':scope > .actions #calculate, :scope > .actions #calculateCanvas')?.click();
      });
    }
    const signature = JSON.stringify([document.documentElement.lang,config.id,config.label,config.selected.value,config.sample]);
    if (host.dataset.signature === signature) return;
    host.dataset.signature=signature;
    const wasOpen=host.querySelector('details.d24-fold')?.open || false;
    host.replaceChildren();
    const fold=makeNode('details','d24-fold d24-config-fold');fold.open=wasOpen;
    const summary=makeNode('summary','d24-fold__summary');
    summary.append(makeNode('span','d24-fold__label',tr('Porównaj warianty','Compare options')),
      makeNode('span','d24-fold__hint',tr('Sprawdź ceny dostępnych opcji','View available option prices')),
      makeNode('span','d24-fold__chevron','⌄'));
    fold.append(summary);
    const body=makeNode('div','d24-fold__body');fold.append(body);host.append(fold);
    const heading = makeNode('div','d24-config-comparison__heading');
    const left = makeNode('div','');
    left.append(makeNode('strong','',tr('Porównaj dostępne warianty','Compare available options')),
      makeNode('small','',tr(`Zmiana: ${config.label}. Pozostałe parametry bez zmian.`,`Changing: ${config.label}. Other settings unchanged.`)));
    heading.append(left, makeNode('span','d24-config-comparison__tag',tr('Z aktualnego cennika','From current prices')));
    body.append(heading);
    const rows=makeNode('div','d24-config-comparison__options');
    config.sample.forEach(item=>{
      const selected=item.value===config.selected.value;
      const button=makeNode('button',`d24-config-comparison__option${selected?' is-selected':''}`);
      button.type='button';button.dataset.compareId=config.id;button.dataset.compareValue=item.value;
      button.setAttribute('aria-pressed',String(selected));
      const name=makeNode('span','d24-config-comparison__option-name',item.label);
      const amount=makeNode('strong','',money(item.price));
      // 0.24.8: faktyczna cena zamiast „+X zł” / „taniej” — różnice w kwotach klient widzi sam.
      const secondary=makeNode('small','',selected ? tr('Wybrany wariant','Selected option') : '');
      button.append(name,amount);if (selected) button.append(secondary);rows.append(button);
    });
    body.append(rows,makeNode('p','d24-config-comparison__note',tr('Ceny brutto dla obecnego nakładu i parametrów. Wybrany wariant zatwierdzisz przyciskiem „Dodaj do koszyka”.','Gross prices for the current quantity and settings. Confirm the configuration with “Add to cart”.')));
  }
  function render() {
    queued = false;
    if (document.body.classList.contains('is-home-page')) return;
    const card=content.querySelector(':scope > .card');
    if (!card || !card.querySelector(':scope > .form-grid') || !card.querySelector(':scope > .actions #calculate, :scope > .actions #calculateCanvas')) return;
    const values=selectValues();
    enrichChoices(card,values);
    updateComparison(card,values);
  }
  function schedule() { if(queued) return; queued=true; requestAnimationFrame(render); }
  // Only react when the whole calculator page is replaced. Dynamic form changes
  // are handled via the input/change listeners below. Do not observe generated
  // comparison content: it must never trigger itself recursively.
  new MutationObserver(schedule).observe(content,{childList:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  // Keep the chosen quantity when using the existing visual format/finish chips.
  // The original app resets this dependent select while rebuilding its options.
  content.addEventListener('click', event => {
    const button = event.target.closest('.d24-smart-options button[data-option-index]');
    if (!button) return;
    const select = button.closest('.field')?.querySelector(':scope > select');
    const qtyId = select?.id === 'flyFormat' ? 'flyQuantity' : select?.id === 'bcFinish' ? 'bcQuantity' : null;
    if (!qtyId) return;
    const before = content.querySelector(`#${qtyId}`)?.value;
    queueMicrotask(() => {
      const after = content.querySelector(`#${qtyId}`);
      if (before && after && Array.from(after.options).some(o => o.value === before && !o.disabled) && after.value !== before) {
        after.value = before;
        after.dispatchEvent(new Event('change',{bubbles:true}));
      }
    });
  }, true);
  content.addEventListener('change',schedule,true);
  content.addEventListener('input',schedule,true);
  // 0.25.6: kafelki odbudowane przez smart-forms.js (np. po zmianie kwot przy piankach) dostają miniatury i kwoty ponownie.
  content.addEventListener('d24-smart-options-rebuilt',schedule);
  schedule();
})();
