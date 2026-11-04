/* 0.23.0 — progressive enhancement: never replaces calculator logic. */
(() => {
  'use strict';
  const content = document.getElementById('content');
  const navigation = document.getElementById('navigation');
  const sidebar = document.getElementById('sidebar');
  if (!content || !navigation || !sidebar) return;
  const RECENTS_KEY = 'drukulator_recent_products_v0230';
  const icons = ['▤','▣','▥','▦','▰','◆','▧','▨','◈','▤','✉','▦','◫','▱','▣','▧','♡','⌂'];
  const isEnglish = () => document.documentElement.lang === 'en';
  const tr = (pl, en) => isEnglish() ? en : pl;
  let recent = [];
  try { const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); if (Array.isArray(stored)) recent = stored.filter(s => typeof s === 'string').slice(0,3); } catch {}
  let lastPage = '';
  let queued = false;
  function pageButton(name) { return Array.from(navigation.querySelectorAll('button[data-page]')).find(button => button.dataset.page === name); }
  function visit(name) { const button = pageButton(name); if (button) button.click(); }
  function remember(name) {
    if (!name || name === 'Start' || name === lastPage) return;
    lastPage = name;
    recent = [name, ...recent.filter(item => item !== name)].slice(0,3);
    try { localStorage.setItem(RECENTS_KEY, JSON.stringify(recent)); } catch {}
  }
  function decorateNavigation() {
    const navButtons = Array.from(navigation.querySelectorAll('button[data-page]'));
    navButtons.forEach((button, index) => {
      if (button.querySelector('.refresh-nav-icon')) return;
      const icon = document.createElement('span');
      icon.className = 'refresh-nav-icon';
      icon.setAttribute('aria-hidden','true');
      icon.textContent = index === 0 ? '⌂' : icons[(index - 1) % icons.length];
      button.prepend(icon);
    });
    const current = navButtons.find(button => button.classList.contains('active'))?.dataset.page || '';
    if (current && current !== 'Start') remember(current);
    // Recent products are no longer shown in the sidebar.
    sidebar.querySelector('.refresh-recents')?.remove();
  }
  const shortcuts = [
    ['Wizytówki 24h','Wizytówki','Business cards'],
    ['Ulotki 24h','Ulotki','Flyers'],
    ['Naklejki, etykiety i magnesy','Naklejki','Stickers'],
    ['Folie i banery 24h','Banery','Banners'],
    ['Koszulki i odzież','Koszulki','T-shirts']
  ];
  function decorateHome() {
    const hero = content.querySelector('.home-conversion-hero__main');
    if (!hero) return;
    if (!hero.querySelector('.refresh-home-shortcuts')) {
      const row = document.createElement('div');
      row.className = 'refresh-home-shortcuts';
      const search = hero.querySelector('.home-search--primary') || hero.querySelector('.home-search');
      if (search) search.before(row);
      row.addEventListener('click', event => {
        const button = event.target.closest('button[data-shortcut]');
        if (button) visit(button.dataset.shortcut);
      });
    }
    const row = hero.querySelector('.refresh-home-shortcuts');
    const lang = isEnglish() ? 'en':'pl';
    if (!row || row.dataset.lang === lang) return;
    row.dataset.lang = lang;
    row.replaceChildren();
    const title = document.createElement('span');
    title.textContent = tr('Popularne:','Popular:'); row.append(title);
    shortcuts.forEach(([name, pl, en]) => {
      const button = document.createElement('button'); button.type = 'button';
      button.dataset.shortcut = name; button.textContent = isEnglish() ? en : pl;
      row.append(button);
    });
  }
  function decorateCalculator() {
    const header = content.querySelector('.page-header');
    const card = content.querySelector(':scope > .card');
    const form = card?.querySelector(':scope > .form-grid');
    if (!header || !card || !form || document.body.classList.contains('is-home-page')) return;
    if (/edycja cen|edycja wyszukiwarki|statystyki/i.test(header.querySelector('h2')?.textContent || '')) return;
    if (!content.querySelector('.refresh-journey')) {
      const journey = document.createElement('div');
      journey.className = 'refresh-journey';
      journey.setAttribute('aria-label', tr('Etapy zamówienia','Order steps'));
      header.after(journey);
    }
    const journey = content.querySelector('.refresh-journey');
    const steps = isEnglish()
      ? [['01','Choose options','Specify the print'],['02','Check price','Review the quote'],['03','Add to cart','Await confirmation']]
      : [['01','Ustaw parametry','Wybierz druk'],['02','Sprawdź cenę','Wybierz produkt'],['03','Dodaj do koszyka','Potwierdzi drukarnia']];

    const step = content.querySelector('.quote-card') ? 1 : 0;
    const signature = (isEnglish() ? 'en':'pl') + step;
    if (journey.dataset.signature !== signature) {
      journey.dataset.signature = signature;
      journey.innerHTML = steps.map(([number,title,subtitle],index) =>
        `<div class="refresh-journey__step${step === index ? ' is-active' : ''}${index < step ? ' is-complete' : ''}"><b>${number}</b><span><strong>${title}</strong><small>${subtitle}</small></span></div>`).join('');
    }
    if (!card.querySelector('.refresh-form-heading')) {
      const heading = document.createElement('div');
      heading.className = 'refresh-form-heading';
      heading.innerHTML = `<span aria-hidden="true">01</span><div><strong>${tr('Parametry zamówienia','Order specifications')}</strong><small>${tr('Wybierz warianty, a następnie oblicz cenę brutto.','Choose options, then calculate the gross price.')}</small></div>`;
      card.prepend(heading);
    } else {
      const heading = card.querySelector('.refresh-form-heading div');
      const lang = isEnglish() ? 'en':'pl';
      if (heading?.dataset.lang !== lang) {
        heading.dataset.lang = lang;
        heading.querySelector('strong').textContent = tr('Parametry zamówienia','Order specifications');
        heading.querySelector('small').textContent = tr('Wybierz warianty, a następnie oblicz cenę brutto.','Choose options, then calculate the gross price.');
        heading.dataset.lang = lang;
      }
    }
    for (const field of form.querySelectorAll('.field')) {
      const label = field.querySelector('label');
      const input = field.querySelector('input,select,textarea');
      if (label && input?.id && !label.hasAttribute('for')) label.setAttribute('for',input.id);
      if (!input || input.disabled || field.closest('[hidden]')) continue;
      if (input.matches('input[type="number"]')) enhanceNumber(input);
      if (input.matches('select') && /qty|quantity|naklad/i.test(input.id)) enhanceQuantities(input);
    }
  }
  function enhanceNumber(input) {
    if (input.dataset.refreshNumber === '1' || input.parentElement?.classList.contains('refresh-number')) return;
    input.dataset.refreshNumber = '1';
    const wrapper = document.createElement('div'); wrapper.className = 'refresh-number';
    input.parentNode.insertBefore(wrapper,input); wrapper.append(input);
    for (const [direction,label] of [[-1,'−'],[1,'+']]) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label;
      button.setAttribute('aria-label', direction > 0 ? tr('Zwiększ wartość','Increase value') : tr('Zmniejsz wartość','Decrease value'));
      button.dataset.direction = String(direction);
      wrapper[direction < 0 ? 'prepend':'append'](button);
      button.addEventListener('click', () => {
        if (input.disabled || input.readOnly) return;
        const previous = input.value;
        try { if (direction > 0) input.stepUp(); else input.stepDown(); }
        catch {
          const step = Number(input.step); const current = Number(input.value);
          if (!Number.isFinite(current)) return;
          let next = current + direction * (Number.isFinite(step) && step > 0 ? step : 1);
          if (input.min !== '') next = Math.max(next,Number(input.min));
          if (input.max !== '') next = Math.min(next,Number(input.max));
          input.value = String(Number(next.toFixed(5)));
        }
        if (input.value !== previous) {
          input.dispatchEvent(new Event('input',{bubbles:true}));
          input.dispatchEvent(new Event('change',{bubbles:true}));
        }
      });
    }
  }
  function enhanceQuantities(select) {
    const field = select.closest('.field');
    if (!field) return;
    const values = Array.from(select.options).filter(option => !option.disabled && option.value).map(option => ({value:option.value, label:option.textContent.trim()}));
    // Presets are only shown for small sets of actual quantities configured by the calculator.
    let row = field.querySelector('.refresh-choice-row');
    if (values.length < 2 || values.length > 8 || values.some(option => option.label.length > 13)) {
      if (row) row.remove(); return;
    }
    if (!row) {
      row = document.createElement('div'); row.className = 'refresh-choice-row';
      row.setAttribute('role','group'); row.setAttribute('aria-label',tr('Szybki wybór nakładu','Quick quantity selection'));
      select.after(row);
      row.addEventListener('click', event => {
        const button = event.target.closest('button[data-quantity]');
        if (!button || select.disabled) return;
        if (Array.from(select.options).some(option => option.value === button.dataset.quantity)) {
          select.value = button.dataset.quantity;
          select.dispatchEvent(new Event('change',{bubbles:true}));
        }
      });
    }
    const signature = JSON.stringify(values) + (isEnglish() ? ':en':':pl');
    if (row.dataset.signature !== signature) {
      row.dataset.signature = signature;
      row.replaceChildren();
      for (const option of values) {
        const button = document.createElement('button'); button.type = 'button';
        button.dataset.quantity = option.value; button.textContent = option.label;
        row.append(button);
      }
    }
    row.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.quantity === select.value)));
  }
  function refresh() {
    queued = false;
    decorateNavigation();
    decorateHome();
    decorateCalculator();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(refresh);
  }
  new MutationObserver(schedule).observe(navigation,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(content,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-language']});
  document.addEventListener('change',event => {
    if (event.target.matches('.form-grid select')) schedule();
  },true);
  schedule();
})();
