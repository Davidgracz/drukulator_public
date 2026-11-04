/* Druk24: odzież — katalogowy podgląd i zdjęcia / wizualizacje poglądowe. */
(() => {
  "use strict";

  const basicColors = [
    ["00", "Biały", "#fdfdfb"], ["01", "Czarny", "#191b20"],
    ["02", "Granatowy", "#192b4e"], ["05", "Chabrowy", "#176ab2"],
    ["07", "Czerwony", "#c82c3a"], ["12", "Ciemnoszary melanż", "#646971"],
    ["03", "Jasnoszary melanż", "#cacdd0"], ["04", "Żółty", "#f5d828"],
    ["11", "Pomarańczowy", "#ef812d"], ["06", "Zieleń butelkowa", "#236247"],
    ["30", "Różowy", "#df91b2"], ["36", "Stalowy", "#657986"]
  ];
  const commonColors = basicColors.slice(0, 8);
  const neutralBagColors = [["10", "Naturalny", "#dfceb3"], ["00", "Biały", "#f7f5ee"], ["01", "Czarny", "#1f1f22"], ["05", "Granatowy", "#22375b"], ["07", "Czerwony", "#c73440"]];
  const carryColors = neutralBagColors;
  const shopperColors = neutralBagColors;
  const easygoColors = [["10", "Naturalny", "#dfceb3"], ["00", "Biały", "#f7f5ee"], ["01", "Czarny", "#1f1f22"], ["05", "Granatowy", "#22375b"], ["07", "Czerwony", "#c73440"]];
  const capColors = [["01", "Czarny", "#1b1c21"], ["02", "Granatowy", "#243a61"], ["07", "Czerwony", "#c63643"], ["00", "Biały", "#f5f5f3"]];
  // Czapka raperka = Malfini RAP 5P (kod 301): siedem kolorów z katalogu (nazwy wg sklepu Malfini).
  const rapColors = [["00", "Biały", "#f5f5f3"], ["01", "Czarny", "#1b1c21"], ["02", "Granatowy", "#1f2a3c"], ["05", "Chabrowy", "#1f4f9c"], ["07", "Czerwony", "#b3202b"], ["25", "Siwoszary melanż", "#8a8c90"], ["40", "Czerwień purpurowa", "#d0307a"]];
  const vestColors = [["97", "Żółty fluorescencyjny", "#e9ec34"], ["98", "Pomarańczowy fluorescencyjny", "#f58a23"]];
  // Brixton Flash (Polstar): kody kolorów są własne, bo zdjęcia nie pochodzą z katalogu Malfini.
  const brixtonColors = [["yellow", "Żółty fluorescencyjny", "#e6ec33"], ["orange", "Pomarańczowy fluorescencyjny", "#f58a23"]];

  // Kroje oferowane dla modelu (wg opisów w cenniku). Wybór kroju jest preferencją zamówienia — nie zmienia ceny.
  const cutsMKD = ["Męska", "Damska", "Dziecięca"];
  const cutsMD = ["Męska", "Damska"];
  const cutAdjective = { "Męska": "męski", "Damska": "damski", "Dziecięca": "dziecięcy", "Unisex": "unisex" };

  const entry = (code, name, type, gram, material, sizes, url, colors = commonColors, visualType = "shirt", extra = {}) => ({
    code, name, type, gram, material, sizes, url, colors, visualType, cuts: [], ...extra
  });

  const frontOnlyViews = ["front", "side"];
  const polstarBase = "https://polstar.com.pl/product_media/";
  // [id pliku w Polstar, nazwa pliku] — front, ujęcie z boku (3/4) i tył.
  const brixtonPhotos = {
    yellow: {
      front: [24067, "brixton_flash_kamizelka_%282%29_zolta.jpg"],
      side: [24069, "brixton_flash_kamizelka_%284%29_zolta.jpg"],
      back: [24066, "brixton_flash_kamizelka_%281%29_zolta.jpg"]
    },
    orange: {
      front: [24071, "brixton_flash_kamizelka_%289%29_pomaranczowa.jpg"],
      side: [24073, "brixton_flash_kamizelka_%2811%29_pomaranczowa.jpg"],
      back: [24070, "brixton_flash_kamizelka_%288%29_pomaranczowa.jpg"]
    }
  };

  const products = {
    "Basic 160 g": entry("129", "Basic", "Koszulka bawełniana", "160 g/m²", "100% bawełna*", "XS–5XL", "https://shop.malfini.com/pl/pl/product/basic-129", basicColors, "shirt", { cuts: cutsMKD, photoCut: "Męska" }),
    "Classic New 145 g": entry("132", "Classic New", "Koszulka bawełniana", "145 g/m²", "100% bawełna*", "S–3XL", "https://shop.malfini.com/pl/pl/product/classic-new-132", commonColors, "shirt", { cuts: cutsMKD, photoCut: "Męska" }),
    "Heavy New 200 g": entry("137", "Heavy New", "Koszulka bawełniana oversize", "200 g/m²", "100% bawełna*", "XS–3XL", "https://shop.malfini.com/pl/pl/product/heavy-new-137", commonColors, "shirt", { cuts: ["Unisex"], photoCut: "Unisex" }),
    "Slim Fit V-neck 180 g": entry("146", "Slim Fit V-neck", "Koszulka bawełniana, dekolt w serek", "180 g/m²", "100% bawełna*", "S–3XL", "https://shop.malfini.com/pl/pl/product/slim-fit-v-neck-146", commonColors, "shirt", { cuts: cutsMD, photoCut: "Męska" }),
    "Fantasy 150 g": entry("124", "Fantasy", "Koszulka sportowa", "150 g/m²", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product?category=t-shirts", commonColors, "shirt", { cuts: cutsMKD, photoCut: "Męska" }),
    "Chance 140 g": entry("810", "Chance", "Koszulka sportowa", "140 g/m²", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product?category=t-shirts", commonColors, "shirt", { cuts: cutsMD, photoCut: "Męska" }),
    "Pixel 130 g": entry("P81", "Pixel", "Koszulka sportowa", "130 g/m²", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product?category=t-shirts", commonColors, "shirt", { cuts: ["Unisex"], photoCut: "Unisex" }),
    "Pique Polo 200 g": entry("203", "Pique Polo", "Koszulka polo", "200 g/m²", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product?category=polo-shirts", commonColors, "polo", { cuts: cutsMKD, photoCut: "Męska" }),
    "Cotton 170 g": entry("212", "Cotton", "Koszulka polo", "170 g/m²", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product?category=polo-shirts", commonColors, "polo", { cuts: cutsMD, photoCut: "Męska" }),
    "Single Jersey 180 g": entry("202", "Single J.", "Koszulka polo", "180 g/m²", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product?category=polo-shirts", commonColors, "polo", { cuts: cutsMD, photoCut: "Męska" }),
    "Essential": entry("406", "Essential", "Bluza", "Wg modelu", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product", commonColors, "sweatshirt", { cuts: ["Unisex"], photoCut: "Unisex" }),
    "Trendy Zipper": entry("410", "Trendy Zipper", "Bluza rozpinana z kapturem", "Wg modelu", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product", commonColors, "hoodiezip"),
    "Cape": entry("413", "Cape", "Bluza z kapturem", "Wg modelu", "Do potwierdzenia", "Do potwierdzenia", "https://shop.malfini.com/pl/pl/product", commonColors, "hoodie", { cuts: cutsMD, photoCut: "Męska" }),
    "Brixton Flash": entry("AFK4", "Brixton Flash", "Kamizelka odblaskowa", "120 g/m²", "100% poliester, pasy odblaskowe", "S–3XL", "https://polstar.com.pl/produkt/brixton_flash_kamizelka", brixtonColors, "vest", { supplier: "Polstar", norm: "EN ISO 20471, klasa 2", photoSet: brixtonPhotos, showColorCode: false, linkLabel: "Zobacz produkt w katalogu Polstar" }),
    "Malfini Rimeck": entry("9V3", "Malfini Rimeck HV Bright", "Kamizelka odblaskowa", "120 g/m²", "100% poliester, pasy odblaskowe", "M, 2XL", "https://shop.malfini.com/pl/pl/product/hv-bright-9v3?color=97", vestColors, "vest", { supplier: "Malfini", norm: "EN ISO 20471, klasa 2", cuts: ["Unisex"], photoCut: "Unisex" }),
    "Czapka bejsbolówka": entry("305", "6P", "Czapka bejsbolówka", "—", "Do potwierdzenia", "Uniwersalny", "https://shop.malfini.com/pl/pl/product", capColors, "cap", { views: frontOnlyViews }),
    "Czapka raperka": entry("301", "Rap 5P", "Czapka raperka (snapback)", "—", "Twill, 100% bawełna", "Uniwersalny", "https://shop.malfini.com/pl/pl/product/rap-5p-301", rapColors, "cap", { views: frontOnlyViews }),
    "Carry": entry("901", "Carry", "Torba bawełniana", "280 g/m²", "100% bawełna", "43 × 43 × 12 cm", "https://shop.malfini.com/pl/pl/product/carry-901", carryColors, "tote", { views: frontOnlyViews }),
    "Shopper": entry("921", "Shopper", "Torba bawełniana", "195 g/m²", "100% bawełna", "45 × 40 cm", "https://shop.malfini.com/pl/pl/product/shopper-921", shopperColors, "tote", { views: frontOnlyViews }),
    "Worko-plecak Easygo": entry("922", "Easygo", "Worek bawełniany", "180 g/m²", "100% bawełna", "Uniwersalny", "https://shop.malfini.com/pl/pl/product/easygo-922", easygoColors, "drawstring", { views: frontOnlyViews })
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const views = [
    { id: 'front', title: 'Przód', remoteLetter: 'a' },
    { id: 'side', title: 'Profil', remoteLetter: 'e' },
    { id: 'back', title: 'Tył', remoteLetter: 'b' }
  ];
  const customPhotos = window.D24_MALFINI_PHOTOS || {};
  const shopBase = 'https://shop.malfini.com/image/product/';
  const validSku = /^[0-9A-Z]{2,4}$/;

  function urlFor(code, color, view, useRemote = true) {
    if (!validSku.test(code) || !validSku.test(color)) return '';
    const viewMeta = views.find(v => v.id === view);
    if (!viewMeta?.remoteLetter) return '';
    const id = `${code}-${color}-${view}`;
    const custom = customPhotos[id];
    if (typeof custom === 'string' && (/^https:\/\//.test(custom) || /^assets\/malfini\/[\w./-]+$/i.test(custom))) return custom;
    if (!useRemote || window.D24_MALFINI_USE_REMOTE === false) return `assets/malfini/${id}.webp`;
    // Malfini's vest files use lower-case `9v3`; its published previews use `~w400`.
    const mediaCode = code === '9V3' ? '9v3' : code;
    const mediaWidth = ['9V3', '901', '921', '922'].includes(code) ? '400' : '460';
    return `${shopBase}${mediaCode}/${mediaCode}_${color}_${viewMeta.remoteLetter}~w${mediaWidth}.jpg?t=0`;
  }

  function localUrl(code, color, view) {
    return `assets/malfini/${code}-${color}-${view}.webp`;
  }

  function remoteViewLetters(model, view) {
    const type = model?.visualType || '';
    const isVest = type === 'vest';
    const isBag = type === 'tote' || type === 'drawstring';
    if (view === 'front') return ['a', 'c'];
    if (view === 'back') {
      if (isVest) return ['b', 'd', 'a'];
      if (isBag) return ['b', 'd', 'c', 'a'];
      return ['b', 'd', 'a'];
    }
    if (view === 'side') {
      if (isVest) return ['c', 'e', 'd', 'a'];
      if (isBag) return ['c', 'e', 'd', 'a'];
      return ['e', 'c', 'd', 'a'];
    }
    return ['a'];
  }

  function remotePhotoCandidates(model, colorCode, view) {
    if (!model?.code || !validSku.test(colorCode)) return [];
    const mediaCode = model.code === '9V3' ? '9v3' : model.code;
    const mediaWidth = ['9V3', '901', '921', '922'].includes(model.code) ? '400' : '460';
    return remoteViewLetters(model, view).map(letter => ({
      src: `${shopBase}${mediaCode}/${mediaCode}_${colorCode}_${letter}~w${mediaWidth}.jpg?t=0`,
      kind: 'photo',
      note: 'Fotografia katalogowa Malfini'
    }));
  }

  function visualAvailable(name) {
    return !/sam nadruk/i.test(name || '');
  }

  function hexToRgb(hex) {
    const cleaned = String(hex || '').replace('#', '');
    const full = cleaned.length === 3 ? cleaned.split('').map(ch => ch + ch).join('') : cleaned;
    const value = Number.parseInt(full, 16);
    return Number.isFinite(value) ? { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 } : { r: 60, g: 73, b: 97 };
  }

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function shade(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    const mix = channel => amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount);
    const parts = [mix(r), mix(g), mix(b)].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'));
    return `#${parts.join('')}`;
  }

  function svgDataUrl(content) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(content)}`;
  }

  function mockupSvg(model, category, view, colorHex, colorName) {
    const visualType = model?.visualType || (/torb|work/i.test(category || '') ? 'tote' : /kamiz/i.test(category || '') ? 'vest' : 'shirt');
    const base = colorHex || '#526074';
    const dark = shade(base, -0.18);
    const light = shade(base, 0.14);
    const accent = /vest/.test(visualType) ? '#d9d9d9' : shade(base, -0.28);
    const viewLabel = views.find(v => v.id === view)?.title || 'Przód';
    const title = escapeHtml(model?.name || 'Produkt');
    const subtitle = `${escapeHtml(colorName || 'Kolor do ustalenia')} · ${escapeHtml(viewLabel)}`;

    const bodyByType = {
      shirt: {
        front: `<path d="M152 120l28-42 42-18 18 18h80l18-18 42 18 28 42-28 20v184H152V140z" fill="${base}"/><path d="M240 78h80l10 25-22 22h-56l-22-22z" fill="${light}"/><rect x="228" y="180" width="104" height="84" rx="10" fill="${shade(base, 0.05)}" opacity="0.22"/>`,
        side: `<path d="M218 82l54 8 30 38 26 12v184H192V150l18-14z" fill="${base}"/><path d="M228 94l46 8-10 22-30 8-14-14z" fill="${light}"/><rect x="220" y="174" width="70" height="90" rx="10" fill="${shade(base, 0.05)}" opacity="0.18"/>`,
        back: `<path d="M152 120l28-42 42-18 18 18h80l18-18 42 18 28 42-28 20v184H152V140z" fill="${base}"/><path d="M234 80h92l6 16-18 18h-68l-18-18z" fill="${dark}" opacity="0.25"/><rect x="228" y="186" width="104" height="70" rx="10" fill="${shade(base, 0.03)}" opacity="0.12"/>`
      },
      polo: {
        front: `<path d="M152 120l28-42 42-18 18 18h80l18-18 42 18 28 42-28 20v184H152V140z" fill="${base}"/><path d="M238 78h84l-14 34-28 20-28-20z" fill="${light}"/><path d="M274 96l18 26-12 8-12-12z" fill="${dark}"/>`,
        side: `<path d="M218 82l54 8 30 38 26 12v184H192V150l18-14z" fill="${base}"/><path d="M240 96l36 10-8 16-24 8-14-10z" fill="${light}"/>`,
        back: `<path d="M152 120l28-42 42-18 18 18h80l18-18 42 18 28 42-28 20v184H152V140z" fill="${base}"/><path d="M242 84h76l10 18-14 12h-68l-14-12z" fill="${dark}" opacity="0.25"/>`
      },
      sweatshirt: {
        front: `<path d="M152 120l36-48 34-12 18 18h80l18-18 34 12 36 48-26 20v184H152V140z" fill="${base}"/><path d="M240 80h80l12 20-20 20h-64l-20-20z" fill="${light}"/>`,
        side: `<path d="M216 76l54 12 34 40 24 12v184H194V148l22-16z" fill="${base}"/><path d="M232 96l40 10-8 18-28 10-14-14z" fill="${light}"/>`,
        back: `<path d="M152 120l36-48 34-12 18 18h80l18-18 34 12 36 48-26 20v184H152V140z" fill="${base}"/><path d="M238 84h84l8 16-18 18h-64l-18-18z" fill="${dark}" opacity="0.23"/>`
      },
      hoodie: {
        front: `<path d="M152 128l34-44 32-18 24-6 18 18h48l18-18 24 6 32 18 34 44-26 16v180H152V144z" fill="${base}"/><path d="M220 90c12-24 44-36 60-36s48 12 60 36l-18 26h-84z" fill="${light}"/><rect x="226" y="232" width="108" height="52" rx="18" fill="${shade(base, -0.08)}" opacity="0.3"/>`,
        side: `<path d="M214 88l56 8 34 34 24 12v182H194V150l20-14z" fill="${base}"/><path d="M232 98c18-22 36-28 48-28 22 0 40 16 48 36l-30 20-50 4-18-14z" fill="${light}"/>`,
        back: `<path d="M152 128l34-44 32-18 24-6 18 18h48l18-18 24 6 32 18 34 44-26 16v180H152V144z" fill="${base}"/><path d="M224 96c16-26 34-34 56-34 24 0 44 12 56 34l-16 18h-80z" fill="${dark}" opacity="0.25"/>`
      },
      hoodiezip: {
        front: `<path d="M152 128l34-44 32-18 24-6 18 18h48l18-18 24 6 32 18 34 44-26 16v180H152V144z" fill="${base}"/><path d="M220 90c12-24 44-36 60-36s48 12 60 36l-18 26h-84z" fill="${light}"/><rect x="274" y="120" width="8" height="198" rx="4" fill="${shade(base, -0.28)}"/>`,
        side: `<path d="M214 88l56 8 34 34 24 12v182H194V150l20-14z" fill="${base}"/><path d="M232 98c18-22 36-28 48-28 22 0 40 16 48 36l-30 20-50 4-18-14z" fill="${light}"/>`,
        back: `<path d="M152 128l34-44 32-18 24-6 18 18h48l18-18 24 6 32 18 34 44-26 16v180H152V144z" fill="${base}"/><path d="M224 96c16-26 34-34 56-34 24 0 44 12 56 34l-16 18h-80z" fill="${dark}" opacity="0.25"/>`
      },
      vest: {
        front: `<path d="M186 74h188l20 42-36 20v188H202V136l-36-20z" fill="${base}"/><path d="M246 74l34 50 34-50" stroke="${shade(base, -0.18)}" stroke-width="10" fill="none"/><rect x="208" y="164" width="144" height="18" rx="9" fill="#d9d9d9" opacity="0.95"/><rect x="208" y="218" width="144" height="18" rx="9" fill="#d9d9d9" opacity="0.95"/>`,
        side: `<path d="M226 76h92l40 40-18 16v192H212V138l14-10z" fill="${base}"/><rect x="228" y="176" width="104" height="16" rx="8" fill="#d9d9d9" opacity="0.95"/><rect x="228" y="224" width="104" height="16" rx="8" fill="#d9d9d9" opacity="0.95"/>`,
        back: `<path d="M186 74h188l20 42-36 20v188H202V136l-36-20z" fill="${base}"/><rect x="208" y="174" width="144" height="18" rx="9" fill="#d9d9d9" opacity="0.95"/><rect x="208" y="228" width="144" height="18" rx="9" fill="#d9d9d9" opacity="0.95"/>`
      },
      cap: {
        front: `<path d="M178 176c0-58 46-106 102-106s102 48 102 106v28H178z" fill="${base}"/><path d="M216 182c16 22 40 34 64 34s48-12 64-34" stroke="${shade(base, -0.22)}" stroke-width="10" fill="none"/><path d="M126 214c26-34 80-58 154-58 66 0 110 14 154 58-34 18-90 32-154 32-72 0-126-16-154-32z" fill="${dark}"/>`,
        side: `<path d="M198 194c0-54 36-96 82-96 48 0 82 40 82 90v26H198z" fill="${base}"/><path d="M364 214c32 4 54 16 74 34-28 10-52 16-94 16z" fill="${dark}"/>`,
        back: `<path d="M178 176c0-58 46-106 102-106s102 48 102 106v28H178z" fill="${base}"/><rect x="246" y="132" width="68" height="76" rx="20" fill="${shade(base, -0.26)}" opacity="0.24"/><rect x="266" y="104" width="28" height="26" rx="12" fill="${shade(base, -0.16)}"/>`
      },
      tote: {
        front: `<rect x="182" y="104" width="196" height="200" rx="12" fill="${base}"/><path d="M220 126c0-38 18-68 60-68s60 30 60 68" stroke="${accent}" stroke-width="14" fill="none" stroke-linecap="round"/><rect x="226" y="162" width="108" height="86" rx="12" fill="${shade(base, 0.08)}" opacity="0.22"/>`,
        side: `<rect x="228" y="106" width="118" height="198" rx="12" fill="${base}"/><path d="M252 126c0-34 12-64 36-64 26 0 38 30 38 64" stroke="${accent}" stroke-width="12" fill="none" stroke-linecap="round"/>`,
        back: `<rect x="182" y="104" width="196" height="200" rx="12" fill="${base}"/><path d="M220 126c0-38 18-68 60-68s60 30 60 68" stroke="${accent}" stroke-width="14" fill="none" stroke-linecap="round"/>`
      },
      drawstring: {
        front: `<rect x="188" y="94" width="184" height="216" rx="18" fill="${base}"/><path d="M206 112h148" stroke="${shade(base, -0.22)}" stroke-width="10"/><path d="M214 126l-12 158" stroke="${accent}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M346 126l12 158" stroke="${accent}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M206 280l74 36 74-36" stroke="${accent}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
        side: `<rect x="224" y="96" width="112" height="214" rx="18" fill="${base}"/><path d="M240 112h80" stroke="${shade(base, -0.22)}" stroke-width="10"/><path d="M320 126l20 154" stroke="${accent}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
        back: `<rect x="188" y="94" width="184" height="216" rx="18" fill="${base}"/><path d="M206 112h148" stroke="${shade(base, -0.22)}" stroke-width="10"/>`
      }
    };

    const art = bodyByType[visualType]?.[view] || bodyByType.shirt.front;
    return svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 420" role="img" aria-label="${title}, ${escapeHtml(viewLabel)}">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#f7f9fc"/>
            <stop offset="100%" stop-color="#e6ecf5"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#97a5ba" flood-opacity="0.32"/>
          </filter>
        </defs>
        <rect width="560" height="420" rx="28" fill="url(#bg)"/>
        <g transform="translate(0,8)" filter="url(#shadow)">${art}</g>
        <text x="280" y="356" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#233044">${title}</text>
        <text x="280" y="386" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#55657d">${escapeHtml(subtitle)}</text>
        <text x="280" y="44" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#5f7189">WIZUALIZACJA POGLĄDOWA</text>
      </svg>`);
  }

  function polstarSources(model, colorCode, view, size) {
    const photo = model?.photoSet?.[colorCode]?.[view];
    if (!photo) return [];
    const [id, file] = photo;
    const base = `${polstarBase}${id}/`;
    const note = `Fotografia katalogowa ${model.supplier || 'dostawcy'}`;
    // Miniatury ujęć używają mniejszych plików „thumb_”; główny podgląd — pełnego zdjęcia.
    const files = size === 'thumb' ? [`thumb_${file}`, file] : [file];
    return files.map(name => ({ src: `${base}${name}`, kind: 'photo', note }));
  }

  function buildSources(model, category, view, colorCode, colorHex, colorName, size = 'main') {
    const sources = [];
    const seen = new Set();
    const add = item => {
      if (item?.src && !seen.has(item.src)) {
        sources.push(item);
        seen.add(item.src);
      }
    };
    if (model?.photoSet) {
      // Zdjęcia dostawcy spoza Malfini (np. Polstar): zdalne → lokalna kopia → wizualizacja.
      polstarSources(model, colorCode, view, size).forEach(add);
      if (model.code) add({ src: localUrl(model.code, colorCode, view), kind: 'photo', note: `Fotografia katalogowa ${model.supplier || 'dostawcy'}` });
    } else if (model?.code && model?.url) {
      // Supplier photos take precedence for every model, including vests and bags.
      remotePhotoCandidates(model, colorCode, view).forEach(add);
      const local = localUrl(model.code, colorCode, view);
      if (local) add({ src: local, kind: 'photo', note: 'Fotografia katalogowa Malfini' });
    }
    sources.push({ src: mockupSvg(model, category, view, colorHex, colorName), kind: 'mockup', note: 'Wizualizacja poglądowa produktu' });
    return sources;
  }

  function mount(node) {
    if (!node) return { render() {}, showView() {}, selection() { return {}; } };
    let current = { category: '', product: '' };
    let activeView = 'front', activeColor = '01', activeCut = '', colorName = '';
    let requestNumber = 0;
    let activeModel = null;

    function viewsFor(model = activeModel) {
      return Array.isArray(model?.views) ? views.filter(v => model.views.includes(v.id)) : views;
    }

    function cutsFor() {
      return Array.isArray(activeModel?.cuts) ? activeModel.cuts : [];
    }

    function colorsFor() {
      if (/kamizelk/i.test(current.category)) return activeModel?.colors || vestColors;
      if (/sam nadruk/i.test(current.category)) return [];
      if (/torby|worki/i.test(current.category)) return activeModel?.colors || neutralBagColors;
      if (/czapk/i.test(current.category)) return activeModel?.colors || capColors;
      return activeModel?.colors || commonColors;
    }

    function choiceText() {
      const colors = colorsFor();
      const chosen = colors.find(c => c[0] === activeColor) || colors[0];
      colorName = chosen?.[1] || 'Do ustalenia';
      const label = node.querySelector('.d24-malfini-color-label');
      if (label) label.textContent = chosen ? (activeModel?.showColorCode === false ? colorName : `${colorName} · kod ${chosen[0]}`) : 'Kolor ustalimy mailowo';
      node.querySelectorAll('[data-app-color]').forEach(button => {
        const on = button.dataset.appColor === activeColor;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-pressed', String(on));
      });
      node.querySelectorAll('[data-app-view]').forEach(button => {
        const on = button.dataset.appView === activeView;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-pressed', String(on));
      });
    }

    function cutText() {
      const subtitle = node.querySelector('.d24-malfini-subtitle');
      if (subtitle) subtitle.textContent = `${activeModel?.type || current.category}${activeCut ? ` · krój ${cutAdjective[activeCut] || activeCut.toLowerCase()}` : ''}`;
      node.querySelectorAll('[data-app-cut]').forEach(button => {
        const on = button.dataset.appCut === activeCut;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-pressed', String(on));
      });
      const note = node.querySelector('.d24-malfini-cut-note');
      if (note) {
        const differs = Boolean(activeCut && activeModel?.photoCut && activeCut !== activeModel.photoCut);
        note.hidden = !differs;
        note.textContent = differs
          ? `Zdjęcia są poglądowe — krój ${cutAdjective[activeCut] || activeCut.toLowerCase()} ma nieco inny fason, kolory są takie same.`
          : '';
      }
    }

    function loadPrimary() {
      const stage = node.querySelector('.d24-malfini-gallery__stage');
      const image = node.querySelector('.d24-malfini-photo');
      const status = node.querySelector('.d24-malfini-photo-status');
      const marker = node.querySelector('.d24-malfini-gallery__note');
      if (!stage || !image || !status) return;
      const stamp = ++requestNumber;
      image.hidden = true;
      stage.classList.add('is-loading');
      stage.classList.remove('is-unavailable');
      status.hidden = false;
      status.textContent = activeModel ? 'Ładowanie podglądu produktu…' : 'Podgląd produktu będzie dostępny po ustaleniu modelu.';
      if (marker) marker.textContent = activeModel ? 'Podgląd produktu' : 'Produkt do ustalenia z drukarnią';
      if (!activeModel || !visualAvailable(current.category)) {
        stage.classList.remove('is-loading');
        stage.classList.add('is-unavailable');
        return;
      }
      const palette = colorsFor();
      const chosen = palette.find(c => c[0] === activeColor) || palette[0] || ['00', 'Do ustalenia', '#526074'];
      const sources = buildSources(activeModel, current.category, activeView, chosen[0], chosen[2], chosen[1]);
      const alt = `${activeModel.name} ${activeModel.code || ''}, ${chosen[1]}, ${views.find(v => v.id === activeView)?.title.toLowerCase() || 'przód'}`.trim();
      let candidateIndex = 0;

      function attempt() {
        if (stamp !== requestNumber) return;
        const source = sources[candidateIndex++];
        if (!source) return fail();
        const preload = new Image();
        preload.onload = () => {
          if (stamp !== requestNumber) return;
          image.src = source.src;
          image.alt = alt;
          image.hidden = false;
          status.hidden = true;
          stage.classList.remove('is-loading', 'is-unavailable');
          if (marker) marker.textContent = source.note;
        };
        preload.onerror = () => {
          if (stamp !== requestNumber) return;
          if (candidateIndex < sources.length + 1) attempt();
          else fail();
        };
        preload.src = source.src;
      }

      function fail() {
        if (stamp !== requestNumber) return;
        image.hidden = true;
        status.textContent = 'Podgląd tego produktu jest obecnie niedostępny.';
        status.hidden = false;
        stage.classList.remove('is-loading');
        stage.classList.add('is-unavailable');
      }

      attempt();
    }

    function loadThumbnails() {
      const gallery = node.querySelector('.d24-malfini-gallery__views');
      if (!gallery) return;
      const palette = colorsFor();
      const chosen = palette.find(c => c[0] === activeColor) || palette[0] || ['00', 'Do ustalenia', '#526074'];
      gallery.querySelectorAll('[data-app-view]').forEach(button => {
        const photo = button.querySelector('img');
        if (!photo || !activeModel || !visualAvailable(current.category)) return;
        const view = button.dataset.appView;
        const sources = buildSources(activeModel, current.category, view, chosen[0], chosen[2], chosen[1], 'thumb');
        const stamp = requestNumber;
        photo.hidden = true;
        let sourceIndex = 0;
        function attemptThumbnail() {
          if (stamp !== requestNumber) return;
          const source = sources[sourceIndex++];
          if (!source) return;
          const tester = new Image();
          tester.onload = () => {
            if (stamp !== requestNumber) return;
            photo.src = source.src;
            photo.hidden = false;
          };
          tester.onerror = attemptThumbnail;
          tester.src = source.src;
        }
        attemptThumbnail();
      });
    }

    function updateGallery() {
      choiceText();
      cutText();
      loadPrimary();
      loadThumbnails();
    }

    function render(next) {
      const changed = next.product !== current.product || next.category !== current.category;
      const previousCut = activeCut;
      current = { category: next.category, product: next.product };
      activeModel = products[current.product] || null;
      const colors = colorsFor();
      const cuts = cutsFor();
      if (changed) {
        activeView = 'front';
        activeColor = /torby|worki/i.test(current.category) && colors.some(c => c[0] === '10')
          ? '10'
          : colors.some(c => c[0] === '01') ? '01' : colors[0]?.[0] || '';
        // Zachowaj wybrany krój przy zmianie modelu, jeśli nowy model go oferuje.
        activeCut = cuts.includes(previousCut) ? previousCut : (cuts.includes(activeModel?.photoCut) ? activeModel.photoCut : cuts[0] || '');
      }
      if (!colors.some(c => c[0] === activeColor)) activeColor = colors[0]?.[0] || '';
      if (!cuts.includes(activeCut)) activeCut = cuts.includes(activeModel?.photoCut) ? activeModel.photoCut : cuts[0] || '';
      const viewList = viewsFor();
      if (!viewList.some(v => v.id === activeView)) activeView = 'front';
      const name = activeModel ? `${activeModel.name}${activeModel.code ? ` ${activeModel.code}` : ''}` : current.product;
      const modelLink = activeModel?.url || '';
      const hasImages = !!activeModel && visualAvailable(current.category);
      const facts = [
        ['Gramatura', activeModel?.gram || 'Do potwierdzenia'],
        ['Materiał', activeModel?.material || 'Do potwierdzenia'],
        ['Rozmiary', activeModel?.sizes || 'Do ustalenia']
      ];
      if (activeModel?.norm) facts.push(['Norma', activeModel.norm]);
      const cutsHtml = cuts.length
        ? `<div class="d24-malfini-cuts"><div class="d24-malfini-cuts__heading"><strong>Krój</strong></div>${cuts.length > 1
          ? `<div class="d24-malfini-cut-options" role="group" aria-label="Wybierz krój">${cuts.map(cut => `<button type="button" class="d24-malfini-cut" data-app-cut="${escapeHtml(cut)}" aria-pressed="false">${escapeHtml(cut)}</button>`).join('')}</div>`
          : `<span class="d24-malfini-cut-fixed">${escapeHtml(cuts[0])}</span>`}<p class="d24-malfini-cut-note" aria-live="polite" hidden></p></div>`
        : '';
      node.innerHTML = `
        <div class="d24-malfini-gallery">
          <div class="d24-malfini-gallery__stage" aria-label="Podgląd wybranego produktu">
            <span class="d24-malfini-gallery__topline">PODGLĄD PRODUKTU</span>
            <div class="d24-malfini-gallery__canvas">
              <img class="d24-malfini-photo" alt="" hidden decoding="async">
              <div class="d24-malfini-photo-status" role="status">Ładowanie podglądu…</div>
            </div>
            <span class="d24-malfini-gallery__note"></span>
          </div>
          <div class="d24-malfini-gallery__views" role="group" aria-label="Zobacz inne ujęcie" style="--d24-view-count:${viewList.length}">
            ${viewList.map(v => `<button type="button" data-app-view="${v.id}" aria-pressed="false" title="${v.title}"><img alt="" hidden loading="lazy"><span>${v.title}</span></button>`).join('')}
          </div>
        </div>
        <div class="d24-malfini-detail">
          <span class="d24-malfini-eyebrow">${activeModel ? `PODGLĄD · ${escapeHtml(activeModel.code || 'MODEL')}` : 'Katalog odzieży'}</span>
          <h3 class="d24-malfini-title">${escapeHtml(name)}</h3>
          <p class="d24-malfini-subtitle">${escapeHtml(activeModel?.type || current.category)}</p>
          <div class="d24-malfini-facts${facts.length > 3 ? ' has-extra' : ''}">
            ${facts.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
          </div>
          ${cutsHtml}
          ${colors.length ? `<div class="d24-malfini-colors"><div class="d24-malfini-colors__heading"><strong>Kolor produktu</strong><span class="d24-malfini-color-label"></span></div><div class="d24-malfini-swatches" role="group" aria-label="Wybierz kolor">${colors.map(([code, label, hex]) => `<button type="button" class="d24-malfini-swatch" data-app-color="${escapeHtml(code)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" aria-pressed="false"><span style="--swatch:${escapeHtml(hex)}"></span></button>`).join('')}</div></div>` : ''}
          <div class="d24-malfini-help"><strong>Indywidualne zamówienie</strong><p>Podaj ilość sztuk i ewentualne uwagi. Rozmiary, kolor, dostępność i ostateczną cenę potwierdzimy mailowo.</p></div>
          ${modelLink ? `<a class="d24-malfini-link" href="${escapeHtml(modelLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(activeModel?.linkLabel || 'Zobacz produkt w katalogu Malfini')} <span aria-hidden="true">↗</span></a>` : ''}
          <small class="d24-malfini-disclaimer">${hasImages ? 'Podgląd ma charakter poglądowy — część ujęć może pochodzić ze zdjęć katalogowych, a część z wizualizacji.' : ''} Wybrany kolor${cuts.length ? ' i krój' : ''} zapisujemy jako preferencję, bez potwierdzania stanu magazynowego.</small>
        </div>`;
      node.querySelectorAll('[data-app-view]').forEach(btn => btn.addEventListener('click', () => { activeView = btn.dataset.appView; updateGallery(); }));
      node.querySelectorAll('[data-app-color]').forEach(btn => btn.addEventListener('click', () => { activeColor = btn.dataset.appColor; updateGallery(); }));
      node.querySelectorAll('[data-app-cut]').forEach(btn => btn.addEventListener('click', () => { activeCut = btn.dataset.appCut; cutText(); }));
      updateGallery();
    }

    return {
      render,
      showView(view) {
        if (!viewsFor().some(item => item.id === view) || view === activeView) return;
        activeView = view;
        updateGallery();
      },
      selection() {
        return {
          colorCode: activeColor,
          colorName: colorsFor().length ? colorName : 'Do ustalenia',
          modelCode: activeModel?.code || '',
          cut: activeCut,
          cutLabel: activeCut ? (cutAdjective[activeCut] || activeCut.toLowerCase()) : ''
        };
      }
    };
  }

  window.D24MalfiniPreview = { mount, products };
})();
