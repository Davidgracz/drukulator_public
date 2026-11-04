(function () {
  "use strict";

  const VERSION = "0.24.8v";
  const C = window.Calculators;
  const content = document.getElementById("content");
  const navigation = document.getElementById("navigation");
  const cartPanel = document.getElementById("cartPanel");
  const quoteDock = document.getElementById("quoteDock");
  const quoteDockDescription = document.getElementById("quoteDockDescription");
  const quoteDockTotal = document.getElementById("quoteDockTotal");
  const quoteDockPrice = document.getElementById("quoteDockPrice");
  const quoteDockTotalLabel = document.getElementById("quoteDockTotalLabel");
  const quoteDockOpen = document.getElementById("quoteDockOpen");
  const toast = document.getElementById("toast");
  const sidebar = document.getElementById("sidebar");
  const siteMenuToggle = document.getElementById("siteMenuToggle");
  const siteNavigation = document.getElementById("siteNavigation");
  const themeToggle = document.getElementById("themeToggle");
  const productSearch = document.getElementById("productSearch");
  const productSearchResults = document.getElementById("productSearchResults");
  const intelligentSearch = window.Druk24IntelligentSearch || null;
  const quoteInterpreter = window.Druk24QuoteInterpreter || null;
  let homeQuoteWizard = null;
  let priceBarActive = false;
  const mobileCartBar = document.getElementById("mobileCartBar");
  const mobileCartSummary = document.getElementById("mobileCartSummary");
  const mobileCartButton = document.getElementById("mobileCartButton");
  const mobilePriceBar = document.getElementById("mobilePriceBar");
  const mobilePriceValue = document.getElementById("mobilePriceValue");
  const mobilePriceHint = document.getElementById("mobilePriceHint");
  const mobileAddButton = document.getElementById("mobileAddButton");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const THEME_KEY = "drukulator_theme";
  const PRICE_OVERRIDE_KEY = "drukulator_prices_override_0_18_2";
  const LEGACY_PRICE_OVERRIDE_KEYS = ["drukulator_prices_override_0_18_1", "drukulator_prices_override_0_18_0", "drukulator_prices_override_0_17_0", "drukulator_prices_override_0_16_2", "drukulator_prices_override_0_16_1", "drukulator_prices_override_0_16_0", "drukulator_prices_override_0_15_0", "drukulator_prices_override_0_14_0", "drukulator_prices_override_0_13_0", "drukulator_prices_override_0_12_0", "drukulator_prices_override_0_11_1", "drukulator_prices_override_0_11_0", "drukulator_prices_override_0_9_6", "drukulator_prices_override_0_9_5", "drukulator_prices_override_0_9_4", "drukulator_prices_override_0_9_3", "drukulator_prices_override_0_9_2", "drukulator_prices_override_0_9_1", "drukulator_prices_override_0_9_0", "drukulator_prices_override_0_8_1", "drukulator_prices_override_0_8_0", "drukulator_prices_override_0_7_2", "drukulator_prices_override_0_7_1", "drukulator_prices_override_0_7_0", "drukulator_prices_override_0_6_0", "drukulator_prices_override_0_5_11", "drukulator_prices_override_0_5_10", "drukulator_prices_override_0_5_9", "drukulator_prices_override_0_5_8", "drukulator_prices_override_0_5_7", "drukulator_prices_override_0_5_6", "drukulator_prices_override_0_5_5", "drukulator_prices_override_0_5_4", "drukulator_prices_override_0_5_3", "drukulator_prices_override_0_5_2", "drukulator_prices_override_0_5_1", "drukulator_prices_override_0_5_0", "drukulator_prices_override_0_4_1", "drukulator_prices_override_0_4_0", "drukulator_prices_override_0_3_1", "drukulator_prices_override_0_3_0"];
  const SEARCH_TERMS_OVERRIDE_KEY = "drukulator_search_terms_override_0_18_2";
  const LEGACY_SEARCH_TERMS_OVERRIDE_KEYS = ["drukulator_search_terms_override_0_18_1", "drukulator_search_terms_override_0_18_0", "drukulator_search_terms_override_0_17_0", "drukulator_search_terms_override_0_16_2", "drukulator_search_terms_override_0_16_1", "drukulator_search_terms_override_0_16_0", "drukulator_search_terms_override_0_15_0", "drukulator_search_terms_override_0_14_0", "drukulator_search_terms_override_0_13_0", "drukulator_search_terms_override_0_12_0", "drukulator_search_terms_override_0_11_1", "drukulator_search_terms_override_0_11_0", "drukulator_search_terms_override_0_9_6", "drukulator_search_terms_override_0_9_5", "drukulator_search_terms_override_0_9_4", "drukulator_search_terms_override_0_9_3", "drukulator_search_terms_override_0_9_2", "drukulator_search_terms_override_0_9_1", "drukulator_search_terms_override_0_9_0", "drukulator_search_terms_override_0_8_1", "drukulator_search_terms_override_0_8_0", "drukulator_search_terms_override_0_7_2", "drukulator_search_terms_override_0_7_1", "drukulator_search_terms_override_0_7_0", "drukulator_search_terms_override_0_6_0", "drukulator_search_terms_override_0_5_11", "drukulator_search_terms_override_0_5_10", "drukulator_search_terms_override_0_5_9", "drukulator_search_terms_override_0_5_8", "drukulator_search_terms_override_0_5_7", "drukulator_search_terms_override_0_5_6", "drukulator_search_terms_override_0_5_5", "drukulator_search_terms_override_0_5_4", "drukulator_search_terms_override_0_5_3", "drukulator_search_terms_override_0_5_2", "drukulator_search_terms_override_0_5_1"];
  const ADMIN_SESSION_KEY = "drukulator_admin_unlocked";
  const ADMIN_PASSWORD_HASH = "76ec9956";
  const CONTACT_EMAIL = "biuro@druk24.szczecin.pl";
  const MAX_ORDER_TOTAL = 5000;
  const LIMIT_CONTACT_TEXT = `W sprawie zlecenia wykraczającego poza kalkulator skontaktuj się z ${CONTACT_EMAIL}.`;
  const ORDER_FILE_LIMIT = 5;
  const ORDER_FILE_MAX_TOTAL_BYTES = 50 * 1024 * 1024;
  const ORDER_FILE_ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp", "tif", "tiff", "svg", "ai", "eps", "psd", "cdr", "zip"]);
  let orderFiles = [];
  const ROULETTE_TRIGGER = "we wtorki chodze do kasyna";
  const BRAINROT_TRIGGER = "67 67 gyatt";
  const PRICE_ADMIN_TRIGGERS = new Set(["nie wszsytko zloto", "nie wszystko zloto"]);
  const SEARCH_ADMIN_TRIGGER = "mowa srebrem";
  const ANALYTICS_ADMIN_TRIGGER = "liczby nie klamia";
  const STAFF_GATE_DEFAULT_TRIGGER = "za zielonymi drzwiami";
  const ROULETTE_STORAGE_KEY = "drukulator_case_0_10_0";
  const ROULETTE_MAX_DISCOUNT = 20;
  const CASE_STARTING_KEYS = 5;
  const CASE_SPIN_ITEM_COUNT = 72;
  const CASE_TARGET_INDEX = 60;
  const CASE_SPIN_DURATION_MS = 10000;
  const CASE_SPIN_EASING = "cubic-bezier(.05, .68, .08, 1)";
  const ROULETTE_JUMPSCARE_CHECK_MS = 1000;
  const ROULETTE_JUMPSCARE_CHANCE = 1 / 10;
  const ROULETTE_JUMPSCARE_DISPLAY_MS = 850;
  const ROULETTE_JUMPSCARE_IMAGE = "assets/easter-eggs/fnaf-foxy-jumpscare-once.gif";
  const CASE_RARITIES = new Set(["common", "uncommon", "rare", "epic", "legendary"]);
  let rouletteJumpscareIntervalId = null;
  let rouletteJumpscareTimeoutId = null;
  let rouletteJumpscareActive = false;
  const DEFAULT_CASE_CONFIG = {
    name: "Skrzynka zniżek Druk24",
    items: [
      { id: "discount-1", name: "1% zniżki", image: "assets/case-items/discount-1.png", rarity: "common", discount: 1, weight: 42 },
      { id: "discount-2", name: "2% zniżki", image: "assets/case-items/discount-2.png", rarity: "common", discount: 2, weight: 28 },
      { id: "discount-3", name: "3% zniżki", image: "assets/case-items/discount-3.png", rarity: "uncommon", discount: 3, weight: 16 },
      { id: "discount-5", name: "5% zniżki", image: "assets/case-items/discount-5.png", rarity: "rare", discount: 5, weight: 9 },
      { id: "discount-10", name: "10% zniżki", image: "assets/case-items/discount-10.png", rarity: "epic", discount: 10, weight: 4 },
      { id: "discount-15", name: "15% zniżki", image: "assets/case-items/discount-15.png", rarity: "legendary", discount: 15, weight: 1 }
    ]
  };

  const state = {
    basePrices: null,
    prices: null,
    baseSearchTerms: null,
    searchTerms: null,
    page: "Start",
    searchQuery: "",
    smartQuotePreset: null,
    adminUnlocked: loadSessionFlag(ADMIN_SESSION_KEY),
    cart: loadJson("drukulator_cart", []),
    order: loadJson("drukulator_order", {
      name: "", email: "", phone: "", pickup: "Odbiór osobisty", notes: ""
    }),
    caseConfig: sanitizeCaseConfig(DEFAULT_CASE_CONFIG),
    roulette: normalizeRouletteState(loadSavedRoulette())
  };

  let quoteCapture = null;
  let quoteSuggestionBusy = false;
  const QUOTE_SHARE_ENDPOINT = "quote-share.php";

  const pages = [
    ["Start", renderHome],
    ["Wizytówki 24h", renderBusinessCards],
    ["Ulotki 24h", renderFlyers],
    ["Plakaty 24h", renderPosters],
    ["Druk cyfrowy i ksero 24h", renderDigital],
    ["Folie i banery 24h", renderBanners],
    ["Naklejki, etykiety i magnesy", renderStickers],
    ["Roll-upy i X-banery", renderRollup],
    ["PCV i pianki", renderPvc],
    ["Koszulki i odzież", renderApparel],
	["Notesy i bloczki", renderNotepads],
    ["Koperty, teczki i papier firmowy", renderCompanyMaterials],
    ["Kalendarze", renderCalendars],
    ["Restauracje, hotele", renderHospitality],
    ["Oprawa prac", renderBinding],
    ["Laminowanie", renderLamination],
    ["Obrazy na płótnie", renderCanvas],
    ["Śluby, wesela i imprezy", renderWedding],
    ["Nieruchomości", renderRealEstate],
    ["Edycja cen", renderPriceAdmin],
    ["Edycja wyszukiwarki", renderSearchAdmin],
    ["Statystyki", renderAnalyticsAdmin]
  ];

  const ADMIN_PAGE_NAMES = new Set(["Edycja cen", "Edycja wyszukiwarki", "Statystyki"]);

  const NAV_GROUPS = [
    {
      label: "Szybki dostęp",
      pages: ["Wizytówki 24h", "Ulotki 24h", "Plakaty 24h", "Druk cyfrowy i ksero 24h"]
    },
    {
      label: "Reklama i wielki format",
      pages: ["Folie i banery 24h", "Naklejki, etykiety i magnesy", "Roll-upy i X-banery", "PCV i pianki", "Obrazy na płótnie"]
    },
    {
      label: "Dla firm",
      pages: ["Notesy i bloczki", "Koperty, teczki i papier firmowy", "Kalendarze", "Oprawa prac", "Laminowanie"]
    },
    {
      label: "Branżowe i wydarzenia",
      pages: ["Restauracje, hotele", "Śluby, wesela i imprezy", "Nieruchomości"]
    }
  ];

  const PRICE_SEARCH_VOCABULARY_ROOTS = {
    "Wizytówki 24h": ["wizytowki"],
    "Ulotki 24h": ["ulotki"],
    "Plakaty 24h": ["plakaty"],
    "Druk cyfrowy i ksero 24h": ["druk_cyfrowy_i_ksero"],
    "Folie i banery 24h": ["banery"],
    "Naklejki, etykiety i magnesy": ["naklejki"],
    "Roll-upy i X-banery": ["rollup"],
    "PCV i pianki": ["pvc"],
    "Koszulki i odzież": ["odziez_z_nadrukiem"],
    "Notesy i bloczki": ["notesy_i_bloczki"],
    "Koperty, teczki i papier firmowy": ["materialy_firmowe", "papier_firmowy"],
    "Kalendarze": ["kalendarze"],
    "Restauracje, hotele": ["restauracje_hotele"],
    "Oprawa prac": ["oprawa_prac"],
    "Laminowanie": ["laminowanie"],
    "Obrazy na płótnie": ["obrazy_na_plotnie"],
    "Śluby, wesela i imprezy": ["sluby_wesela_imprezy"],
    "Nieruchomości": []
  };

  const DEFAULT_PRODUCT_SEARCH_TERMS = {
    "Wizytówki 24h": [
      "wizytowki", "wizytowka", "wizytowek", "wizytowke", "wiytowki", "wizytuwki",
      "karty biznesowe", "karta biznesowa", "business card", "business cards", "karty firmowe",
      "karta kontaktowa", "dane kontaktowe na karcie", "85x55", "90x50", "soft touch",
      "wizytowki z folia", "wizytowki foliowane", "wizytowki dwustronne", "wizytowki jednostronne",
      "wizytowki 24h", "wizytówki 24h", "wizytowki cyfrowe", "wizytowki offsetowe"
    ],
    "Ulotki 24h": [
      "ulotki", "ulotka", "ulotek", "ulotke", "flyer", "flyers", "folder reklamowy",
      "reklama papierowa", "materialy reklamowe", "rozdawane ulotki", "ulotki a6", "ulotki a5",
      "ulotki a4", "ulotki dl", "ulotki 24h", "ulotka 24h", "ulotki ekspres", "ulotki skladane", "ulotki cyfrowe", "ulotki offsetowe"
    ],
    "Koperty, teczki i papier firmowy": [
      "koperty", "koperta", "koperty z nadrukiem", "koperty firmowe", "koperta dl", "koperta c5", "koperta c6",
      "teczki", "teczka", "teczki ofertowe", "teczka ofertowa", "teczka jednobigowa", "teczka dwubigowa", "teczka foliowana",
      "papier firmowy", "papier firmowy a4", "preprint", "preprint 90g", "papier firmowy 90g", "korespondencja firmowa"
    ],
    "Kalendarze": [
      "kalendarze", "kalendarz", "kalendarz firmowy", "kalendarze reklamowe", "kalendarz trojdzielny", "kalendarz trójdzielny",
      "kalendarz jednodzielny", "plaska glowka", "płaska główka", "wypukla glowka", "wypukła główka", "soft skin",
      "kalendarz listwowany", "kalendarz plakatowy", "kalendarz a1", "kalendarz a2", "kalendarz b1",
      "biuwar", "biuwary", "kalendarz biurkowy", "kalendarz na biurko", "52 karty", "piramidka", "kalendarz piramidka",
      "kalendarz spiralowany", "kalendarz a5", "kalendarz dl"
    ],
    "Notesy i bloczki": [
      "notesy", "notes", "notatniki", "notatnik", "notes firmowy", "notesy firmowe",
      "notes reklamowy", "notesy reklamowe", "notes klejony", "notesy klejone",
      "notes spiralowany", "notesy spiralowane", "notes na spirali", "bloczek", "bloczki",
      "bloczek samokopiujacy", "bloczki samokopiujace", "druk samokopiujacy", "druki samokopiujace",
      "papier samokopiujacy", "oryginal i kopia", "oryginał plus kopia", "ncr", "50 kart",
      "notes a4", "notes a5", "notes a6", "notes dl", "bloczek a4", "bloczek a5",
      "bloczek a6", "bloczek dl", "notes bez okladki", "notes z okladka"
    ],
    "Restauracje, hotele": [
      "restauracje", "restauracja", "hotele", "hotel", "gastronomia", "horeca",
      "menu restauracyjne", "menu hotelowe", "karta menu", "karty menu",
      "podkładki na tackę", "podkladki na tacke", "podkładka na tackę", "tray liner",
      "papier na tackę", "papier na tace", "40x30", "40 x 30", "menu a3", "menu offset",
      "menu preprint", "preprint 90 g", "menu jednostronne", "menu dwustronne", "menu laminowane",
      "prezenter", "prezenter trójkątny", "prezenter trojkatny", "stojak dl", "stojak a6",
      "stojak na stół", "stojak na stol", "tent card", "notes kelnerski", "notesy kelnerskie",
      "notatnik kelnerski", "notes dla kelnera", "bloczek samokopiujący", "bloczki samokopiujące", "ncr"
    ],
    "Nieruchomości": [
      "nieruchomości", "nieruchomosci", "biuro nieruchomości", "biuro nieruchomosci", "agencja nieruchomości", "agencja nieruchomosci",
      "pośrednik nieruchomości", "posrednik nieruchomosci", "agent nieruchomości", "agent nieruchomosci", "deweloper", "deweloperzy",
      "materiały dla nieruchomości", "materialy dla nieruchomosci", "druk dla nieruchomości", "druk dla nieruchomosci",
      "reklama nieruchomości", "reklama nieruchomosci", "materiały dla biura nieruchomości", "materialy dla biura nieruchomosci",
      "tablica sprzedam", "tablica na sprzedaż", "tablica na sprzedaz", "tablica wynajem", "tablica do wynajęcia", "tablica do wynajecia",
      "baner sprzedam", "baner na sprzedaż", "baner na sprzedaz", "baner wynajem", "baner do wynajęcia", "baner do wynajecia",
      "plansza nieruchomości", "plansza nieruchomosci", "tablica nieruchomości", "tablica nieruchomosci", "baner nieruchomości", "baner nieruchomosci",
      "folia na witrynę biura", "folia na witryne biura", "owh nieruchomości", "owh nieruchomosci", "owv nieruchomości", "owv nieruchomosci", "ovh nieruchomości", "ovh nieruchomosci",
      "teczki dla biura nieruchomości", "teczki dla biura nieruchomosci", "teczka ofertowa nieruchomości", "teczka ofertowa nieruchomosci",
      "ulotki nieruchomości", "ulotki nieruchomosci", "ulotki dla dewelopera", "wizytówki agenta", "wizytowki agenta",
      "wizytówki pośrednika", "wizytowki posrednika", "papier firmowy nieruchomości", "papier firmowy nieruchomosci",
      "pakiet nieruchomości", "pakiet nieruchomosci", "komplet nieruchomości", "komplet nieruchomosci"
    ],
    "Folie i banery 24h": [
      "folie", "folia", "folii", "baner", "banery", "banner", "frontlit", "mesh", "siatka mesh",
      "baner reklamowy", "baner z oczkami", "druk banera", "folia mat", "folia matowa", "folia blysk",
      "folia blyszczaca", "folia z laminatem", "folia laminowana", "folia owh", "folia owv",
      "one way vision", "folia transparentna", "folia przezroczysta", "naklejka na witryne",
      "oklejenie witryny", "grafika na szybe", "druk na folii", "folia samoprzylepna",
      "folie i banery 24h", "banery 24h", "folie 24h", "baner powlekany", "baner powlekany 510g",
      "folia do podswietlen", "folia podświetlana", "backlit", "folia do kasetonu", "folia do lightboxa",
      "folia z transferem", "folia transferowa", "transfer folia", "transfer tape"
    ],
    "Naklejki, etykiety i magnesy": [
      "naklejki", "naklejka", "naklejek", "naklejke", "wlepki", "wlepka", "wlepek", "etykiety",
      "etykieta", "etykiet", "sticker", "stickers", "naklejki laminowane", "etykiety laminowane",
      "naklejki wycinane", "naklejki ploterowe", "naklejki na rolce", "naklejki na arkuszu",
      "naklejki produktowe", "etykiety produktowe", "etykiety cenowe", "naklejki z logo",
      "naklejki okragle", "naklejki prostokatne", "naklejki dowolny ksztalt", "wlepki reklamowe",
      "naklejki taxi", "magnes taxi"
    ],
    "Plakaty 24h": [
      "plakaty", "plakat", "plakatow", "poster", "postery", "afisz", "afisze", "plakat reklamowy",
      "plakaty 24h", "plakat 24h", "plakat ekspres", "plakat na jutro", "wielkoformatowy 24h",
      "plakat a3", "plakat a2", "plakat a1", "plakat a0", "duzy wydruk", "druk wielkoformatowy",
      "plakat cyfrowy", "plakat offsetowy", "papier plakatowy"
    ],
    "Roll-upy i X-banery": [
      "rollup", "roll up", "roll-up", "rollupy", "rolap", "rolup", "x baner", "x-baner", "x banner",
      "stojak reklamowy", "system wystawienniczy", "scianka reklamowa", "potykacz reklamowy",
      "rollup standard", "rollup black", "rollup czarny", "rollup exclusive", "rollup lezka",
      "rollup dwustronny", "rollup podwojny", "wklad do rollupa", "wymiana wkladu rollup"
    ],
    "Śluby, wesela i imprezy": [
      "slub", "sluby", "wesele", "wesela", "impreza", "imprezy", "zaproszenia slubne", "zaproszenie slubne",
      "zaproszenia skladane", "zaproszenia z folia satynowa", "winietki", "plan stolow", "plan stołu",
      "dekoracja sali", "zdjecie pary mlodej", "zdjecie na pcv", "x baner wesele", "etykiety na wodke",
      "etykiety na wino", "zawieszki na alkohol", "standy weselne", "dekoracje weselne"
    ],
    "PCV i pianki": [
      "pcv", "pvc", "plyta pcv", "plyta pvc", "tablica", "tabliczka", "tablice", "szyld", "szyldy",
      "plansza", "plansze", "druk na plycie", "druk na pcv", "folia na pcv", "folia plus pcv",
      "tablica reklamowa", "tabliczka informacyjna", "tabliczka firmowa", "sztywna plyta",
      "pcv 2 mm", "pcv 3 mm", "pcv 4 mm", "pcv 5 mm", "pianka", "pianki", "plansza piankowa",
      "plansze piankowe", "pianka 5 mm", "plyta piankowa", "foam board", "foamboard", "kapa",
      "plansza a3", "plansza a2", "plansza a1", "plansza b2", "plansza b1", "plansza b0",
      "lekka plansza", "plansza wystawowa", "plansza prezentacyjna", "wydruk na piance"
    ],
    "Druk cyfrowy i ksero 24h": [
      "druk cyfrowy", "drukowanie", "wydruk", "wydruki", "ksero", "kopie", "kopiowanie", "skanowanie",
      "druk dokumentow", "druk cyfrowy i ksero 24h", "druk cyfrowy 24h", "dla studentow 24h", "dla studentów 24h", "arkuszowanie 24h", "druk 24h", "wydruk 24h", "druk a4", "druk a3", "kolor a4", "kolorowy a4", "czarno bialy",
      "druk dwustronny", "druk jednostronny", "papier kredowy", "papier 130g", "papier 170g",
      "papier 250g", "papier 300g", "sra4", "sra3", "arkuszowanie", "impozycja", "uzytki na arkuszu",
      "winietki", "winietka", "winietek", "zaproszenia", "zaproszenie", "bilety", "bilet", "vouchery",
      "voucher", "kupony", "kupon", "karteczki", "karty menu", "menu restauracyjne", "certyfikaty",
      "dyplomy", "identyfikatory papierowe", "papier firmowy", "preprint", "druk malego formatu"
    ],
    "Koszulki i odzież": [
      "koszulki", "koszulka", "koszulek", "odziez", "odziezy", "ubrania z nadrukiem", "nadruk na koszulce",
      "nadruki na odziezy", "dtf", "termotransfer", "bluza", "bluzy", "czapka", "czapki", "torba z nadrukiem",
      "fartuch z nadrukiem", "odziez firmowa", "koszulka firmowa", "koszulka z logo", "sam nadruk",
      "dodatkowy nadruk", "nadruk przod", "nadruk tyl", "pique polo", "pique polo 200 g",
      "cotton 170 g", "single jersey 180 g", "koszulka polo 200 g", "koszulka polo 170 g", "koszulka polo 180 g"
    ],
    "Oprawa prac": [
      "oprawa", "oprawa prac", "bindowanie", "bindownica", "spirala", "oprawa spiralna", "termobindowanie",
      "praca dyplomowa", "praca magisterska", "magisterska", "praca licencjacka", "licencjacka",
      "praca doktorska", "doktorat", "oprawa dokumentu", "oprawa ksiazki", "druk i oprawa",
      "oprawa miekka", "oprawa twarda"
    ],
    "Laminowanie": [
      "laminowanie", "laminacja", "zalaminowac", "zalaminowanie", "laminat dokumentu", "folia laminacyjna",
      "laminowanie a4", "laminowanie a3", "laminowanie a5", "laminowanie wizytowki", "ochrona dokumentu",
      "foliowanie dokumentu", "dokument w folii", "80 mikronow"
    ],
    "Obrazy na płótnie": [
      "obrazy", "obraz", "obrazu", "plotno", "plotnie", "canvas", "fotoobraz", "foto obraz",
      "zdjecie na plotnie", "fotografia na plotnie", "obraz ze zdjecia", "druk na plotnie", "wydruk na canvas",
      "obraz na sciane", "portret na plotnie", "obraz panoramiczny", "wlasny rozmiar obrazu"
    ]
  };

  const SEARCH_STOP_WORDS = new Set([
    "chce", "chcialbym", "chcialabym", "potrzebuje", "poprosze", "prosze", "mozna", "zrobic",
    "zamowic", "zamowie", "wycenic", "zamówienie", "cena", "koszt", "ile", "bedzie", "interesuje",
    "mnie", "mi", "dla", "na", "do", "od", "z", "ze", "i", "oraz", "albo", "czy", "jak",
    "szt", "sztuk", "sztuki", "format", "rozmiar", "wymiar", "potrzebny", "potrzebna", "potrzebne"
  ]);

  // Numer wersji nie jest pokazywany klientom; zostaje tylko w atrybucie do diagnostyki.
  document.documentElement.dataset.drukulatorVersion = VERSION;
  const productMenuToggle = document.getElementById("menuToggle");
  const syncProductMenuToggle = () => {
    const open = sidebar.classList.contains("open");
    productMenuToggle.setAttribute("aria-expanded", String(open));
    productMenuToggle.setAttribute("aria-label", open ? "Zamknij menu produktów" : "Otwórz menu produktów");
    const label = productMenuToggle.querySelector(".menu-toggle__label");
    if (label) label.textContent = open ? "Zamknij" : "Produkty";
  };
  productMenuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  // Menu zamyka się też po wyborze produktu — etykieta i ARIA zawsze zgadzają się ze stanem.
  new MutationObserver(syncProductMenuToggle).observe(sidebar, { attributes: true, attributeFilter: ["class"] });
  const compactProductMenuToggle = () => productMenuToggle.classList.toggle("menu-toggle--compact", window.scrollY > 160 && !sidebar.classList.contains("open"));
  window.addEventListener("scroll", compactProductMenuToggle, { passive: true });
  new MutationObserver(compactProductMenuToggle).observe(sidebar, { attributes: true, attributeFilter: ["class"] });
  function jumpToQuote() {
    if (state.cart.length) {
      cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const selector = state.page === "Start" ? "#homePopularTitle" : "#content";
    (document.querySelector(selector) || content).scrollIntoView({ behavior: "smooth", block: "start" });
  }
  quoteDockOpen?.addEventListener("click", jumpToQuote);
  (mobileCartButton || mobileCartBar)?.addEventListener("click", jumpToQuote);
  if (siteMenuToggle && siteNavigation) {
    siteMenuToggle.addEventListener("click", () => {
      const isOpen = siteNavigation.classList.toggle("is-open");
      siteMenuToggle.classList.toggle("is-open", isOpen);
      siteMenuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNavigation.addEventListener("click", event => {
      if (!event.target.closest("a")) return;
      siteNavigation.classList.remove("is-open");
      siteMenuToggle.classList.remove("is-open");
      siteMenuToggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", event => {
      if (siteNavigation.contains(event.target) || siteMenuToggle.contains(event.target)) return;
      siteNavigation.classList.remove("is-open");
      siteMenuToggle.classList.remove("is-open");
      siteMenuToggle.setAttribute("aria-expanded", "false");
    });
  }
  setupThemeToggle();
  setupProductSearch();

  function setupThemeToggle() {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(currentTheme, false);

    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .toLocaleLowerCase("pl-PL")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function parseSmartDimensions(query) {
    const raw = String(query || "").toLocaleLowerCase("pl-PL").replace(/,/g, ".");
    const match = raw.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mm|cm|m)?/i);
    if (!match) return null;
    return {
      raw: match[0],
      width: Number(match[1]),
      height: Number(match[2]),
      unit: String(match[3] || "").toLowerCase()
    };
  }

  function parseSmartQuantity(query, dimensions = null) {
    let raw = String(query || "").toLocaleLowerCase("pl-PL");
    if (dimensions?.raw) raw = raw.replace(dimensions.raw, " ");
    raw = raw.replace(/\b\d+(?:[.,]\d+)?\s*(?:g\s*\/?\s*m2|gram(?:ow|y)?|g)\b/gi, " ");
    const explicit = raw.match(/\b(\d{1,6})\s*(?:szt\.?|sztuk|sztuki|kopii|kopie|egz(?:emplarzy)?|arkusz(?:y|e|ow|ów)?|stron(?:y|a)?|komplet(?:ow|ów|y)?|bloczk(?:ow|ów|i)?)\b/i);
    if (explicit) return Number(explicit[1]);
    const normalized = normalizeSearchText(raw);
    const candidates = normalized.match(/\b\d{1,6}\b/g) || [];
    return candidates.length ? Number(candidates[0]) : null;
  }

  function parseSmartFormat(query) {
    const normalized = normalizeSearchText(query);
    const match = normalized.match(/(?:^|\s)(a[0-7]|b[0-2]|dl)(?:\s|$)/i);
    return match ? match[1].toUpperCase() : null;
  }

  function normalizedIncludes(text, fragment) {
    return normalizeSearchText(text).includes(normalizeSearchText(fragment));
  }

  function smartFormatKey(keys, requestedFormat, allowPrefix = false) {
    if (!requestedFormat) return null;
    const wanted = normalizeSearchText(requestedFormat);
    const exact = keys.find(key => normalizeSearchText(key) === wanted);
    if (exact) return exact;
    if (!allowPrefix) return null;
    return keys.find(key => normalizeSearchText(key).startsWith(`${wanted} `)) || null;
  }

  function chooseStandardQuantity(priceMap, requestedQuantity, priceResolver = value => Number(value)) {
    const requested = Math.max(1, Number(requestedQuantity) || 0);
    if (!requested || !priceMap || typeof priceMap !== "object") return null;
    const rows = Object.entries(priceMap).map(([quantityKey, value]) => {
      const quantity = Number(quantityKey);
      const price = Number(priceResolver(value, quantityKey));
      return { quantity, price };
    }).filter(row => Number.isFinite(row.quantity) && row.quantity > 0 && Number.isFinite(row.price));
    if (!rows.length) return null;
    const exact = rows.find(row => row.quantity === requested);
    if (exact) return { requested, selected: requested, price: exact.price, adjusted: false };
    const eligible = rows.filter(row => row.quantity >= requested);
    if (!eligible.length) return null;
    eligible.sort((a, b) => a.price - b.price || a.quantity - b.quantity);
    const chosen = eligible[0];
    return { requested, selected: chosen.quantity, price: chosen.price, adjusted: true };
  }

  function applyQuantityChoice(intent, choice) {
    if (!intent || !choice) return intent;
    if (choice.adjusted) {
      intent.quantityFallback = true;
      intent.requestedQuantity = choice.requested;
      intent.selectedQuantity = choice.selected;
      intent.fallbackPrice = choice.price;
    }
    return intent;
  }

  function smartLabelScore(query, label) {
    const normalizedQuery = normalizeSearchText(query);
    const normalizedLabel = normalizeSearchText(label);
    if (!normalizedQuery || !normalizedLabel) return 0;
    if (normalizedQuery.includes(normalizedLabel)) return 120;
    const queryTokens = normalizedQuery.split(/\s+/).filter(token => token.length > 1);
    const labelTokens = normalizedLabel.split(/\s+/).filter(token => token.length > 1);
    function related(left, right) {
      if (left === right || left.startsWith(right) || right.startsWith(left)) return true;
      let common = 0;
      while (common < left.length && common < right.length && left[common] === right[common]) common += 1;
      const minLength = Math.min(left.length, right.length);
      if (common >= 4) return true;
      const allowed = Math.max(left.length, right.length) >= 7 ? 2 : 1;
      return levenshteinDistance(left, right) <= allowed;
    }
    let score = 0;
    labelTokens.forEach(labelToken => {
      if (queryTokens.some(token => related(token, labelToken))) score += 18;
    });
    return score;
  }

  function quantityFallbackSummary(choice) {
    return choice?.adjusted ? `${choice.requested} szt. → standard ${choice.selected} szt.` : `${choice?.selected || ""} szt.`;
  }

  function buildFlyerSmartQuote(query, quantity, requestedFormat) {
    if (!quantity) return null;
    const root = state.prices?.ulotki;
    if (!root) return null;
    const normalized = normalizeSearchText(query);
    const wantsOffset = normalized.includes("offset");
    const wantsDigital = normalized.includes("cyfrow");
    const wantsFolded = normalized.includes("sklad");
    const configurations = [];

    Object.entries(root).forEach(([printName, variants]) => {
      if (wantsOffset && printName !== "Offsetowy") return;
      if (wantsDigital && printName !== "Cyfrowy") return;
      Object.entries(variants).forEach(([variantName, formats]) => {
        if (wantsFolded && variantName !== "Składane") return;
        if (!wantsFolded && normalized.includes("standard") && variantName !== "Standard") return;
        Object.entries(formats).forEach(([formatName, quantities]) => {
          const exactFormat = requestedFormat && normalizeSearchText(formatName) === normalizeSearchText(requestedFormat);
          const prefixFormat = requestedFormat && normalizeSearchText(formatName).startsWith(`${normalizeSearchText(requestedFormat)} `);
          if (requestedFormat && !exactFormat && !(wantsFolded && prefixFormat)) return;
          if (!requestedFormat && !wantsFolded && normalizeSearchText(formatName) !== "a6") return;
          let score = 0;
          if (printName === "Cyfrowy") score += 20;
          if (variantName === "Standard") score += 10;
          if (exactFormat) score += 30;
          if (wantsOffset && printName === "Offsetowy") score += 100;
          if (wantsDigital && printName === "Cyfrowy") score += 100;
          if (wantsFolded && variantName === "Składane") score += 100;
          configurations.push({ printName, variantName, formatName, quantities, score });
        });
      });
    });

    const exact = configurations.filter(item => Object.prototype.hasOwnProperty.call(item.quantities, String(quantity)));
    let chosen = null;
    let choice = null;
    if (exact.length) {
      exact.sort((a, b) => b.score - a.score || Number(a.quantities[String(quantity)]) - Number(b.quantities[String(quantity)]));
      chosen = exact[0];
      choice = chooseStandardQuantity(chosen.quantities, quantity);
    } else {
      const fallback = configurations.map(item => ({ item, choice: chooseStandardQuantity(item.quantities, quantity) })).filter(entry => entry.choice);
      if (!fallback.length) return null;
      fallback.sort((a, b) => a.choice.price - b.choice.price || a.choice.selected - b.choice.selected || b.item.score - a.item.score);
      chosen = fallback[0].item;
      choice = fallback[0].choice;
    }

    const intent = {
      pageName: "Ulotki 24h",
      summary: `${quantityFallbackSummary(choice)} • ${chosen.formatName} • ${chosen.printName}${chosen.variantName !== "Standard" ? ` • ${chosen.variantName}` : ""}`,
      steps: [["flyPrint", chosen.printName], ["flyVariant", chosen.variantName], ["flyFormat", chosen.formatName], ["flyQuantity", String(choice.selected)]]
    };
    return applyQuantityChoice(intent, choice);
  }

  function buildBusinessCardSmartQuote(query, quantity, dimensions) {
    if (!quantity) return null;
    const prices = state.prices?.wizytowki;
    if (!prices) return null;
    const normalized = normalizeSearchText(query);
    const wantsOffset = normalized.includes("offset");
    const wantsDigital = normalized.includes("cyfrow");
    const wantsFoil = normalized.includes("folia") || normalized.includes("soft touch") || normalized.includes("blysk");
    const wantsDouble = normalized.includes("dwustron");
    const wantsSingle = normalized.includes("jednostron");
    const sides = wantsDouble ? "Dwustronne" : wantsSingle ? "Jednostronne" : "Jednostronne";
    const sideKey = C.SIDE_KEYS?.[sides] || (sides === "Dwustronne" ? "dwustronne" : "jednostronne");
    let formatName = prices.formaty?.[0] || "90x50 mm";
    if (dimensions) {
      const w = Math.round(dimensions.unit === "cm" ? dimensions.width * 10 : dimensions.width);
      const h = Math.round(dimensions.unit === "cm" ? dimensions.height * 10 : dimensions.height);
      const requested = [w, h].sort((a, b) => a - b).join("x");
      const matched = (prices.formaty || []).find(name => {
        const nums = name.match(/\d+/g)?.slice(0, 2).map(Number).sort((a, b) => a - b).join("x");
        return nums === requested;
      });
      if (matched) formatName = matched;
    }

    const configurations = [];
    if (!wantsOffset) {
      const wantsGloss = normalized.includes("blysk");
      const finish = wantsFoil ? (wantsGloss ? "Folia błyszcząca" : "Folia Soft Touch") : "Standard";
      const priceKey = C.DIGITAL_FINISH_KEYS[finish];
      const priceMap = prices.cyfrowe?.[priceKey];
      if (priceMap) configurations.push({ mode: "digital", print: "Cyfrowy 24h", finish, priceMap, score: wantsDigital ? 200 : 50, resolver: row => Number(row?.[sideKey]) });
    }
    if (!wantsDigital) {
      const finishCandidates = wantsFoil
        ? [normalized.includes("blysk") ? "Foliowane — błysk" : "Foliowane — Soft Touch", "Złocenie lub srebrzenie + Soft Touch", "Lakier UV 3D + Soft Touch"]
        : ["Standard dwustronne"];
      finishCandidates.forEach(finish => {
        const priceMap = prices.offsetowe?.[C.OFFSET_FINISH_KEYS[finish]];
        if (priceMap) configurations.push({ mode: "offset", print: "Offsetowy", finish, priceMap, score: wantsOffset ? 200 : 0, resolver: value => Number(value) });
      });
    }

    const exact = configurations.map(item => ({ item, choice: chooseStandardQuantity(item.priceMap, quantity, item.resolver) })).filter(entry => entry.choice && !entry.choice.adjusted);
    let selectedEntry;
    if (exact.length) {
      exact.sort((a, b) => b.item.score - a.item.score || a.choice.price - b.choice.price);
      selectedEntry = exact[0];
    } else {
      const fallback = configurations.map(item => ({ item, choice: chooseStandardQuantity(item.priceMap, quantity, item.resolver) })).filter(entry => entry.choice);
      if (!fallback.length) return null;
      fallback.sort((a, b) => a.choice.price - b.choice.price || a.choice.selected - b.choice.selected || b.item.score - a.item.score);
      selectedEntry = fallback[0];
    }

    const { item, choice } = selectedEntry;
    const actualSides = item.mode === "offset" ? "Dwustronne" : sides;
    const intent = {
      pageName: "Wizytówki 24h",
      summary: `${quantityFallbackSummary(choice)} • ${formatName} • ${actualSides.toLowerCase()} • ${item.mode === "offset" ? "offset" : "cyfrowy"}${wantsFoil ? " • folia" : ""}`,
      steps: [["bcFormat", formatName], ["bcPrint", item.print], ["bcFinish", item.finish], ["bcSides", actualSides], ["bcQuantity", String(choice.selected)]]
    };
    return applyQuantityChoice(intent, choice);
  }

  function dimensionsToPosterFormat(dimensions) {
    if (!dimensions) return null;
    let width = dimensions.width;
    let height = dimensions.height;
    if (dimensions.unit === "mm") { width /= 10; height /= 10; }
    if (dimensions.unit === "m") { width *= 100; height *= 100; }
    const formats = {
      A4: [21, 29.7], A3: [29.7, 42], A2: [42, 59], A1: [59, 84], A0: [84, 120],
      B2: [50, 70], B1: [70, 100], B0: [100, 140]
    };
    const pair = [width, height].sort((a, b) => a - b);
    return Object.entries(formats).find(([, dims]) => Math.abs(pair[0] - dims[0]) <= 1 && Math.abs(pair[1] - dims[1]) <= 1)?.[0] || null;
  }

  function buildPosterSmartQuote(query, quantity, requestedFormat, dimensions) {
    if (!quantity) return null;
    const root = state.prices?.plakaty;
    if (!root) return null;
    const normalized = normalizeSearchText(query);
    const formatName = requestedFormat || dimensionsToPosterFormat(dimensions);
    const wantsOffset = normalized.includes("offset");
    const wantsDigital = normalized.includes("cyfrow");
    const wantsLarge = normalized.includes("wielko") || normalized.includes("satyn") || normalized.includes("135g") || normalized.includes("135 g");

    if (formatName && root["Wielkoformatowy 24h"]?.[formatName] && quantity >= 1 && quantity <= 30 && !wantsOffset && !wantsDigital) {
      return { pageName: "Plakaty 24h", summary: `${quantity} szt. • ${formatName} • papier satynowy 135 g`, steps: [["posterPrint", "Wielkoformatowy 24h"], ["posterFormat", formatName], ["posterQty", String(quantity)]] };
    }
    if (wantsLarge) return null;

    const configurations = [];
    if (!wantsOffset) {
      const digitalFormat = formatName || "A4";
      const priceMap = root["Cyfrowy 24h"]?.[digitalFormat];
      if (priceMap) configurations.push({ print: "Cyfrowy 24h", format: digitalFormat, priceMap, score: wantsDigital ? 200 : 50 });
    }
    if (!wantsDigital) {
      const offsetFormat = formatName || "A3";
      const priceMap = root.Offsetowy?.[offsetFormat];
      if (priceMap) configurations.push({ print: "Offsetowy", format: offsetFormat, priceMap, score: wantsOffset ? 200 : 0 });
    }
    if (!configurations.length) return null;

    const exact = configurations.map(item => ({ item, choice: chooseStandardQuantity(item.priceMap, quantity) })).filter(entry => entry.choice && !entry.choice.adjusted);
    let selectedEntry;
    if (exact.length) {
      exact.sort((a, b) => b.item.score - a.item.score || a.choice.price - b.choice.price);
      selectedEntry = exact[0];
    } else {
      const fallback = configurations.map(item => ({ item, choice: chooseStandardQuantity(item.priceMap, quantity) })).filter(entry => entry.choice);
      if (!fallback.length) return null;
      fallback.sort((a, b) => a.choice.price - b.choice.price || a.choice.selected - b.choice.selected || b.item.score - a.item.score);
      selectedEntry = fallback[0];
    }
    const { item, choice } = selectedEntry;
    const intent = { pageName: "Plakaty 24h", summary: `${quantityFallbackSummary(choice)} • ${item.format} • ${item.print.toLowerCase()}`, steps: [["posterPrint", item.print], ["posterFormat", item.format], ["posterQty", String(choice.selected)]] };
    return applyQuantityChoice(intent, choice);
  }

  function buildDigitalSmartQuote(query, quantity, requestedFormat) {
    if (!quantity) return null;
    const normalized = normalizeSearchText(query);
    const root = state.prices?.druk_cyfrowy_i_ksero;
    if (!root) return null;
    let service = "Druk cyfrowy 24h";
    if (normalized.includes("skan")) service = "Skanowanie";
    else if (normalized.includes("ksiaz") && normalized.includes("ksero")) service = "Ksero książki";
    else if (normalized.includes("student")) service = "Dla studentów 24h";
    else if (normalized.includes("ksero")) service = "Ksero i druk";
    const color = normalized.includes("kolor") ? "Kolorowy" : (normalized.includes("mono") || normalized.includes("czarno") || normalized.includes("cz b")) ? "Czarno-biały" : "Czarno-biały";
    const formatName = requestedFormat && ["A4", "A3"].includes(requestedFormat) ? requestedFormat : "A4";
    const side = normalized.includes("dwustron") ? "Dwustronny" : "Jednostronny";
    const paperWeight = normalized.match(/\b(130|170|250|300|350)\s*g\b/);
    const paper = paperWeight ? `Papier kredowy ${paperWeight[1]} g` : "Standardowy 80 g";
    const steps = [["digService", service], ["digColor", color]];
    if (["Druk cyfrowy 24h", "Ksero i druk", "Dla studentów 24h"].includes(service)) steps.push(["digFormat", formatName]);
    if (service === "Druk cyfrowy 24h") { steps.push(["digSide", side]); steps.push(["digPaper", paper]); }
    if (service === "Ksero i druk") steps.push(["digPaper", paper]);
    steps.push(["digQty", String(quantity)]);
    return { pageName: "Druk cyfrowy i ksero 24h", summary: `${quantity} ${service === "Ksero książki" || service === "Skanowanie" ? "str." : "szt."} • ${formatName} • ${color.toLowerCase()}${service === "Druk cyfrowy 24h" ? ` • ${side.toLowerCase()}` : ""}`, steps };
  }

  function buildTaxiSmartQuote(query, quantity) {
    const root = state.prices?.naklejki?.taxi;
    if (!root) return null;
    const qty = quantity || 1;
    let productName = null;

    if (smartQueryHas(query, ["identyfikator taxi", "identyfikator taksi", "ident taxi", "identyfikator kierowcy"])) {
      productName = "Identyfikator taxi";
    } else if (smartQueryHas(query, ["cennik taxi", "cennik taksi", "tabliczka taxi", "cennik do taxi"])) {
      productName = "Cennik taxi – 2 sztuki";
    } else if (smartQueryHas(query, ["magnes taxi", "magnesy taxi", "magnes taksi", "magnesy taksi", "magnes na taxi", "magnesy na taxi", "moagne taxi", "manges taxi", "magenes taxi"])) {
      productName = "Komplet magnesy + naklejki taxi";
    } else if (smartQueryHas(query, ["naklejka taxi", "naklejki taxi", "naklejka taksi", "naklejki taksi", "oklejenie taxi"])) {
      productName = "Komplet naklejek taxi";
    }

    if (!productName || !root[productName]) return null;
    return {
      pageName: "Naklejki, etykiety i magnesy",
      summary: `${qty} szt./kompletów • ${productName}`,
      steps: [["stickProduct", productName], ["stickTaxiQty", String(qty)]]
    };
  }

  function buildStickerSmartQuote(query, quantity, dimensions) {
    if (!quantity) return null;
    const normalized = normalizeSearchText(query);
    const root = state.prices?.naklejki?.powierzchniowe;
    if (!root) return null;
    let productName = "Naklejki, etykiety";
    if (smartQueryHas(query, ["laminowane", "laminowana", "laminat", "z laminatem"])) productName = "Naklejki laminowane";
    else if (smartQueryHas(query, ["magnes reklamowy", "magnesy reklamowe", "magnes na auto", "magnesy na auto", "magnes samochodowy", "magnesy samochodowe", "magnes z nadrukiem", "magnesy z nadrukiem", "magnes firmowy", "magnesy firmowe"])) productName = "Magnesy reklamowe";
    if (!root[productName]) return null;

    if (!dimensions) {
      return {
        pageName: "Naklejki, etykiety i magnesy",
        summary: `${quantity} szt. • ${productName.toLowerCase()} • wybierz wymiary`,
        autoCalculate: false,
        steps: [["stickProduct", productName], ["stickQty", String(quantity)]]
      };
    }

    const multiplier = dimensions.unit === "cm" ? 10 : dimensions.unit === "m" ? 1000 : 1;
    const width = Math.round(dimensions.width * multiplier);
    const height = Math.round(dimensions.height * multiplier);
    if (width < 30 || width > 500 || height < 30 || height > 500) return null;
    return { pageName: "Naklejki, etykiety i magnesy", summary: `${quantity} szt. • ${width} × ${height} mm • ${productName.toLowerCase()}`, steps: [["stickProduct", productName], ["stickWidth", String(width)], ["stickHeight", String(height)], ["stickQty", String(quantity)]] };
  }

  function buildBannerSmartQuote(query, quantity, dimensions) {
    if (!dimensions) return null;
    const root = state.prices?.banery;
    if (!root) return null;
    const normalized = normalizeSearchText(query);
    let material = "Baner powlekany 510g";
    if (normalized.includes("folia")) {
      if (normalized.includes("laminat")) material = "Folia + laminat";
      else if (normalized.includes("owh") || normalized.includes("owv") || normalized.includes("one way")) material = "Folia OWH";
      else if (normalized.includes("transparent") || normalized.includes("przezrocz")) material = "Folia transparentna";
      else if (normalized.includes("podswiet") || normalized.includes("backlit")) material = "Folia do podświetleń";
      else if (normalized.includes("transfer")) material = "Folia z transferem";
      else if (normalized.includes("blysk")) material = "Folia błysk";
      else material = "Folia mat";
    }
    if (!root[material]) return null;
    const multiplier = dimensions.unit === "m" ? 100 : dimensions.unit === "mm" ? 0.1 : 1;
    const width = Number((dimensions.width * multiplier).toFixed(1));
    const height = Number((dimensions.height * multiplier).toFixed(1));
    const qty = quantity || 1;
    if (width <= 0 || width > 160 || height <= 0 || height > 1000) return null;
    if (!/^Folia\b/i.test(material) && width < 30) return null;
    return { pageName: "Folie i banery 24h", summary: `${qty} szt. • ${width} × ${height} cm • ${material}`, steps: [["bannerMaterial", material], ["bannerWidth", String(width)], ["bannerHeight", String(height)], ["bannerQty", String(qty)]] };
  }

  function buildCatalogSmartQuote(query, quantity, root, config) {
    if (!quantity || !root) return null;
    const requestedFormat = parseSmartFormat(query);
    const candidates = [];
    let order = 0;
    Object.entries(root).forEach(([typeName, typeData]) => {
      Object.entries(typeData?.warianty || {}).forEach(([variantName, variantData]) => {
        Object.entries(variantData?.formaty || {}).forEach(([formatName, priceMap]) => {
          if (!priceMap || typeof priceMap !== "object") return;
          if (requestedFormat) {
            const f = normalizeSearchText(formatName);
            const wanted = normalizeSearchText(requestedFormat);
            if (f !== wanted && !f.startsWith(`${wanted} `) && !f.includes(wanted)) return;
          }
          const score = smartLabelScore(query, typeName) * 4 + smartLabelScore(query, variantName) * 2 + smartLabelScore(query, formatName) * 3;
          const choice = chooseStandardQuantity(priceMap, quantity);
          if (!choice) return;
          candidates.push({ typeName, variantName, formatName, choice, score, order: order++ });
        });
      });
    });
    if (!candidates.length) return null;
    const exact = candidates.filter(item => !item.choice.adjusted);
    const pool = exact.length ? exact : candidates;
    const maxScore = Math.max(...pool.map(item => item.score));
    let semantic = maxScore > 0 ? pool.filter(item => item.score === maxScore) : pool.sort((a, b) => a.order - b.order).slice(0, 1);
    if (maxScore > 0) semantic.sort((a, b) => a.order - b.order);
    const chosen = semantic[0];
    const intent = {
      pageName: config.pageName,
      summary: `${quantityFallbackSummary(chosen.choice)} • ${chosen.typeName} • ${chosen.formatName}`,
      steps: [[`${config.prefix}Type`, chosen.typeName], [`${config.prefix}Variant`, chosen.variantName], [`${config.prefix}Format`, chosen.formatName], [`${config.prefix}Qty`, String(chosen.choice.selected)]]
    };
    return applyQuantityChoice(intent, chosen.choice);
  }

  function buildNotepadSmartQuote(query, quantity) {
    const root = state.prices?.notesy_i_bloczki;
    if (!root || !quantity) return null;
    const requestedFormat = parseSmartFormat(query);
    const candidates = [];
    let order = 0;
    Object.entries(root).forEach(([typeName, typeData]) => {
      Object.entries(typeData?.warianty || {}).forEach(([variantName, variantData]) => {
        Object.entries(variantData?.formaty || {}).forEach(([formatName, priceMap]) => {
          if (requestedFormat && normalizeSearchText(formatName) !== normalizeSearchText(requestedFormat)) return;
          const choice = chooseStandardQuantity(priceMap, quantity);
          if (!choice) return;
          const score = smartLabelScore(query, typeName) * 4 + smartLabelScore(query, variantName) * 2 + smartLabelScore(query, formatName) * 3;
          candidates.push({ typeName, variantName, formatName, choice, score, order: order++ });
        });
      });
    });
    if (!candidates.length) return null;
    const exact = candidates.filter(item => !item.choice.adjusted);
    const pool = exact.length ? exact : candidates;
    const maxScore = Math.max(...pool.map(item => item.score));
    let semantic = maxScore > 0 ? pool.filter(item => item.score === maxScore) : pool.sort((a, b) => a.order - b.order).slice(0, 1);
    if (maxScore > 0) semantic.sort((a, b) => a.order - b.order);
    const chosen = semantic[0];
    const intent = { pageName: "Notesy i bloczki", summary: `${quantityFallbackSummary(chosen.choice)} • ${chosen.typeName} • ${chosen.formatName}`, steps: [["noteType", chosen.typeName], ["noteVariant", chosen.variantName], ["noteFormat", chosen.formatName], ["noteQty", String(chosen.choice.selected)]] };
    return applyQuantityChoice(intent, chosen.choice);
  }

  function buildWeddingSmartQuote(query, quantity) {
    const root = state.prices?.sluby_wesela_imprezy;
    if (!root || !quantity) return null;
    const requestedFormat = parseSmartFormat(query);
    const candidates = [];
    let order = 0;
    Object.entries(root).forEach(([productName, productData]) => {
      if (productData?.tryb !== "pakiet") return;
      Object.entries(productData?.warianty || {}).forEach(([variantName, formats]) => {
        Object.entries(formats || {}).forEach(([formatName, priceMap]) => {
          if (requestedFormat) {
            const f = normalizeSearchText(formatName);
            const wanted = normalizeSearchText(requestedFormat);
            if (f !== wanted && !f.startsWith(`${wanted} `) && !f.includes(wanted)) return;
          }
          const choice = chooseStandardQuantity(priceMap, quantity);
          if (!choice) return;
          const score = smartLabelScore(query, productName) * 4 + smartLabelScore(query, variantName) * 2 + smartLabelScore(query, formatName) * 3;
          candidates.push({ productName, variantName, formatName, choice, score, order: order++ });
        });
      });
    });
    if (!candidates.length) return null;
    const exact = candidates.filter(item => !item.choice.adjusted);
    const pool = exact.length ? exact : candidates;
    const maxScore = Math.max(...pool.map(item => item.score));
    let semantic = maxScore > 0 ? pool.filter(item => item.score === maxScore) : pool.sort((a, b) => a.order - b.order).slice(0, 1);
    if (maxScore > 0) semantic.sort((a, b) => a.order - b.order);
    const chosen = semantic[0];
    const intent = { pageName: "Śluby, wesela i imprezy", summary: `${quantityFallbackSummary(chosen.choice)} • ${chosen.productName} • ${chosen.formatName}`, steps: [["weddingProduct", chosen.productName], ["weddingVariant", chosen.variantName], ["weddingFormat", chosen.formatName], ["weddingQty", String(chosen.choice.selected)]] };
    return applyQuantityChoice(intent, chosen.choice);
  }

  function getSmartQuoteIntent(query) {
    if (!state.prices) return null;
    const normalized = normalizeSearchText(query);
    if (!normalized) return null;
    const dimensions = parseSmartDimensions(query);
    const quantity = parseSmartQuantity(query, dimensions);
    const format = parseSmartFormat(query);

    if (smartQueryHas(query, ["ulotka", "ulotki", "ulotke", "ulotek", "flyer", "flyers", "flayer"])) return buildFlyerSmartQuote(query, quantity, format);
    if (smartQueryHas(query, ["wizytowka", "wizytowki", "wizytowke", "wizytowek", "business card", "karta biznesowa"])) return buildBusinessCardSmartQuote(query, quantity, dimensions);
    if (smartQueryHas(query, ["plakat", "plakaty", "poster", "postery", "afisz"])) return buildPosterSmartQuote(query, quantity, format, dimensions);
    if (smartQueryHas(query, ["taxi", "taksi"])) {
      const taxiIntent = buildTaxiSmartQuote(query, quantity);
      if (taxiIntent) return taxiIntent;
    }
    if (smartQueryHas(query, ["naklejka", "naklejki", "etykieta", "etykiety", "wlepka", "wlepki", "sticker", "stickers", "magnes", "magnesy", "moagne", "manges", "magenes"])) return buildStickerSmartQuote(query, quantity, dimensions);
    if (smartQueryHas(query, ["baner", "banery", "banner", "bannery", "folia", "folie", "frontlit", "owv", "owh"])) return buildBannerSmartQuote(query, quantity, dimensions);
    if (smartQueryHas(query, ["notes", "notesy", "notatnik", "bloczek", "bloczki", "samokopiuj", "ncr"])) return buildNotepadSmartQuote(query, quantity);
    if (smartQueryHas(query, ["koperta", "koperty", "teczka", "teczki", "papier firmowy", "preprint"])) return buildCatalogSmartQuote(query, quantity, buildCompanyMaterialsCatalog(), { pageName: "Koperty, teczki i papier firmowy", prefix: "companyMaterials" });
    if (smartQueryHas(query, ["kalendarz", "kalendarze", "biuwar", "biuwary", "piramidka"])) return buildCatalogSmartQuote(query, quantity, state.prices?.kalendarze, { pageName: "Kalendarze", prefix: "calendar" });
    if (smartQueryHas(query, ["menu a3", "podkladka na tacke", "podkladki na tacke", "prezenter", "stojak dl", "stojak a6", "notes kelnerski", "notesy kelnerskie"])) return buildCatalogSmartQuote(query, quantity, buildHospitalityCatalog(), { pageName: "Restauracje, hotele", prefix: "hospitality" });
    if (smartQueryHas(query, ["zaproszenie", "zaproszenia", "zaproszenie slubne", "zaproszenia slubne"])) return buildWeddingSmartQuote(query, quantity);
    if (smartQueryHas(query, ["druk", "wydruk", "wydruki", "ksero", "skan", "skanowanie", "kopie", "kopii", "strony", "stron"])) return buildDigitalSmartQuote(query, quantity, format);
    return null;
  }

  // Recommendations use only existing Drukulator calculators and materials.
  // The use-case descriptions are suggestions, not automatic substrate selection.
  const QUOTE_USE_CASES = [
    {
      id: "witryna", title: "Reklama na szybę lub witrynę", icon: "▤",
      aliases: ["reklama na szybe", "reklame na szybe", "reklamy na szybe", "cos na szybe", "grafika na okno", "reklama na szybie", "reklama na witryne", "reklame na witryne", "cos na witryne", "reklamy na witryne", "reklama na witrynie", "okleic szybe", "oklejenie szyby", "okleic witryne", "oklejenie witryny", "grafika na szybe", "grafika na witryne", "witryna sklepowa", "okno sklepowe", "naklejka na okno", "naklejka na szybe", "reklama w oknie"],
      note: "Dobór folii zależy m.in. od przepuszczalności światła, widoczności grafiki i sposobu montażu.",
      suggestions: [
        { title: "Folia OWH / OWV", query: "folia OWH", page: "Folie i banery 24h", reason: "Perforowana folia na przeszklenia — gdy chcesz zachować częściową widoczność przez szybę." },
        { title: "Folia transparentna", query: "folia transparentna", page: "Folie i banery 24h", reason: "Do grafiki na przezroczystym podłożu; efekt zależy od projektu." },
        { title: "Folia matowa", query: "folia mat", page: "Folie i banery 24h", reason: "Do pełniejszych oznaczeń, napisów i reklam zasłaniających podłoże." }
      ]
    },
    {
      id: "auto", title: "Reklama na samochód", icon: "▰",
      aliases: ["reklama na auto", "reklame na auto", "reklamy na auto", "cos na auto", "reklama na samochod", "reklame na samochod", "reklamy na samochod", "cos na samochod", "reklama na samochodzie", "oznaczenie auta", "reklama na aucie", "reklama na busa", "reklama na busie", "oznakowac samochod", "oznakowanie pojazdu", "oznaczenie pojazdu", "logo na samochod", "magnes na samochod", "reklama samochodowa"],
      note: "W kalkulatorze wycenisz magnesy reklamowe. Pełne oklejanie pojazdów wymaga osobnego doboru folii i indywidualnego kontaktu.",
      suggestions: [
        { title: "Magnesy reklamowe", query: "magnesy reklamowe", page: "Naklejki, etykiety i magnesy", reason: "Zdejmowane oznakowanie metalowych elementów karoserii; najpierw sprawdź, czy magnes trzyma się podłoża." },
        { title: "Naklejki reklamowe", query: "naklejki", page: "Naklejki, etykiety i magnesy", reason: "Drobne naklejki z nadrukiem; trwałość i zastosowanie na pojeździe wymagają potwierdzenia." }
      ]
    },
    {
      id: "lokal", title: "Reklama przed lokalem", icon: "▣",
      aliases: ["reklama przed lokalem", "reklame przed lokalem", "cos przed lokalem", "reklama na zewnatrz sklepu", "oznaczenie lokalu", "reklama przed sklepem", "tablica przed lokalem", "reklama na ogrodzeniu", "reklama na plot", "reklama na płot", "reklama przed firma", "szyld do lokalu", "szyld sklepu"],
      note: "Wybór zależy od tego, czy reklamę wieszasz, mocujesz na sztywno czy ustawiasz wewnątrz lokalu.",
      suggestions: [
        { title: "Baner powlekany 510 g", query: "baner powlekany", page: "Folie i banery 24h", reason: "Do zawieszenia na ogrodzeniu, elewacji lub konstrukcji." },
        { title: "Tablica PCV", query: "tablica PCV", page: "PCV i pianki", reason: "Do sztywnego oznaczenia, przykręcenia lub montażu." },
        { title: "Roll-up", query: "rollup", page: "Roll-upy i X-banery", reason: "Mobilny stojak reklamowy, przede wszystkim do ustawienia wewnątrz." }
      ]
    },
    {
      id: "targi", title: "Targi, stoisko lub wydarzenie", icon: "▥",
      aliases: ["stoisko targowe", "na targi", "materialy na targi", "reklama na targi", "stoisko wystawiennicze", "reklama na event", "reklama na konferencje", "wydarzenie firmowe", "promocja na targach", "na stoisko"],
      note: "Możesz zamówić kilka różnych produktów i dodać je do jednego zamówienia.",
      suggestions: [
        { title: "Roll-up lub X-baner", query: "rollup", page: "Roll-upy i X-banery", reason: "Lekki, mobilny nośnik do ustawienia na stoisku." },
        { title: "Ulotki", query: "ulotki", page: "Ulotki 24h", reason: "Do rozdawania odwiedzającym." },
        { title: "Baner", query: "baner", page: "Folie i banery 24h", reason: "Duża grafika do zawieszenia na przygotowanej konstrukcji." }
      ]
    },
    {
      id: "firma", title: "Zakładam firmę", icon: "▦",
      aliases: ["otwarcie firmy", "otwieram firme", "zakladam firme", "nowa firma", "start firmy", "rozpoczynam dzialalnosc", "otwieram biuro", "materialy do nowej firmy", "identyfikacja firmy", "otwarcie biura"],
      note: "Na początek najczęściej wystarczają proste materiały kontaktowe; resztę można dodać później.",
      suggestions: [
        { title: "Wizytówki", query: "wizytówki", page: "Wizytówki 24h", reason: "Podstawowy kontakt dla klientów i partnerów." },
        { title: "Papier firmowy", query: "papier firmowy", page: "Koperty, teczki i papier firmowy", reason: "Do korespondencji i dokumentów." },
        { title: "Ulotki", query: "ulotki", page: "Ulotki 24h", reason: "Do promowania usług i oferty." },
        { title: "Teczki ofertowe", query: "teczki ofertowe", page: "Koperty, teczki i papier firmowy", reason: "Do przekazywania ofert i dokumentacji." }
      ]
    },
    {
      id: "gastronomia", title: "Restauracja, bar lub hotel", icon: "▤",
      aliases: ["dla restauracji", "otwieram restauracje", "otwieram bar", "do restauracji", "dla hotelu", "menu do restauracji", "reklama restauracji", "reklama baru", "kawiarnia", "otwieram kawiarnie", "gastronomia", "lokal gastronomiczny"],
      note: "Produkty restauracyjne mają osobne warianty w kalkulatorze; dobierzesz je po przejściu do kategorii.",
      suggestions: [
        { title: "Menu restauracyjne", query: "menu A3", page: "Restauracje, hotele", reason: "Karty i menu do prezentowania oferty." },
        { title: "Podkładki na tacki", query: "podkładki na tackę", page: "Restauracje, hotele", reason: "Materiały pod posiłki i promocje." },
        { title: "Naklejki i etykiety", query: "naklejki", page: "Naklejki, etykiety i magnesy", reason: "Oznaczenia opakowań i produktów." }
      ]
    },
    {
      id: "nieruchomosci", title: "Sprzedaż lub wynajem nieruchomości", icon: "▧",
      aliases: ["sprzedaje mieszkanie", "sprzedaz mieszkania", "wynajem mieszkania", "wynajmuje mieszkanie", "sprzedaz domu", "na sprzedaż mieszkania", "reklama nieruchomosci", "ogloszenie na budynku", "biuro nieruchomosci", "dla dewelopera", "sprzedam dom", "sprzedam mieszkanie"],
      note: "Wybierz pojedynczy produkt. W sekcji „Nieruchomości” znajdziesz też cały zestaw materiałów branżowych.",
      suggestions: [
        { title: "Tablica PCV", query: "tablica PCV", page: "PCV i pianki", reason: "Sztywna tablica z informacją „sprzedam” lub „wynajmę”." },
        { title: "Baner", query: "baner", page: "Folie i banery 24h", reason: "Duża grafika widoczna na ogrodzeniu lub elewacji." },
        { title: "Ulotki", query: "ulotki", page: "Ulotki 24h", reason: "Do przekazywania oferty zainteresowanym." }
      ]
    },
    {
      id: "dyplom", title: "Praca dyplomowa i dokumenty", icon: "≡",
      aliases: ["praca magisterska", "praca licencjacka", "praca inzynierska", "druk pracy dyplomowej", "wydruk pracy", "oprawa pracy", "praca dyplomowa", "druk do uczelni", "materialy na uczelnie", "wydruk dokumentow", "wydruk dokumentów"],
      note: "Druk i oprawa są oddzielnymi usługami — możesz policzyć je osobno i dodać do jednego zamówienia.",
      suggestions: [
        { title: "Oprawa pracy", query: "oprawa prac", page: "Oprawa prac", reason: "Do spięcia gotowej pracy dyplomowej." },
        { title: "Druk cyfrowy / ksero", query: "druk cyfrowy", page: "Druk cyfrowy i ksero 24h", reason: "Do wydrukowania stron dokumentu." },
        { title: "Laminowanie", query: "laminowanie", page: "Laminowanie", reason: "Do zabezpieczenia pojedynczych dokumentów." }
      ]
    },
    {
      id: "slub", title: "Ślub lub przyjęcie", icon: "◇",
      aliases: ["organizuje slub", "na wesele", "slub i wesele", "przygotowuje wesele", "zaproszenia na slub", "dekoracje na wesele", "materialy na wesele", "przyjecie rodzinne", "organizuje przyjecie"],
      note: "Dostępne elementy zależą od wariantu w cenniku. Część zamówień wymaga doprecyzowania w kalkulatorze.",
      suggestions: [
        { title: "Zaproszenia", query: "zaproszenia ślubne", page: "Śluby, wesela i imprezy", reason: "Dla gości i zapraszanych osób." },
        { title: "Winietki", query: "winietki", page: "Śluby, wesela i imprezy", reason: "Do oznaczania miejsc przy stołach." },
        { title: "Plan stołów", query: "plan stołów", page: "Śluby, wesela i imprezy", reason: "Do wskazania gościom miejsc." }
      ]
    },
    {
      id: "odziez", title: "Odzież dla zespołu", icon: "▨",
      aliases: ["odziez dla pracownikow", "koszulki firmowe", "ubrania z logo", "odziez z logo", "ubrania dla zespolu", "koszulki dla zespolu", "nadruk dla druzyny", "ubrania robocze z nadrukiem"],
      note: "Kolor, rozmiary i sposób nadruku dobierzesz w kalkulatorze odzieży.",
      suggestions: [
        { title: "Koszulki z nadrukiem", query: "koszulki", page: "Koszulki i odzież", reason: "Do wspólnego oznakowania pracowników lub drużyny." },
        { title: "Bluzy z nadrukiem", query: "bluzy", page: "Koszulki i odzież", reason: "Alternatywa do pracy i na wydarzenia." }
      ]
    }
  ];

  function findQuoteUseCase(query) {
    const normalized = normalizeSearchText(query);
    if (!normalized) return null;
    const padded = ` ${normalized} `;
    const matching = QUOTE_USE_CASES.flatMap(item => item.aliases
      .filter(alias => padded.includes(` ${normalizeSearchText(alias)} `))
      .map(alias => ({ item, score: normalizeSearchText(alias).length })));
    matching.sort((a, b) => b.score - a.score);
    return matching[0]?.item || null;
  }

  function quoteHasNamedProduct(query) {
    const normalized = normalizeSearchText(query);
    const terms = ["ulot", "wizyt", "plakat", "baner", "roll", "x baner", "tablic", "plansz", "naklej", "etykiet", "magnes", "foli", "kalendar", "tecz", "papier firmow", "notes", "bloczk", "kopert", "koszulk", "bluz", "opraw", "laminow", "winiet", "zaprosz"];
    return terms.some(term => normalized.split(" ").some(word => word.startsWith(term)) || (term.includes(" ") && normalized.includes(term)));
  }

  const QUOTE_ASSISTANT_PRODUCT_CHOICES = [
    ["Ulotki", "ulotki"],
    ["Wizytówki", "wizytówki"],
    ["Plakaty", "plakaty"],
    ["Naklejki / etykiety", "naklejki"],
    ["Banery / folie", "baner"],
    ["Druk / ksero", "druk cyfrowy"]
  ];

  function quoteAssistantProductPage(query) {
    const direct = [
      ["Ulotki 24h", ["ulotka", "ulotki", "ulotke", "ulotek", "flyer", "flyers", "flayer"]],
      ["Wizytówki 24h", ["wizytowka", "wizytowki", "wizytowke", "wizytowek", "business card", "karta biznesowa"]],
      ["Plakaty 24h", ["plakat", "plakaty", "poster", "postery", "afisz"]],
      ["Naklejki, etykiety i magnesy", ["naklejka", "naklejki", "etykieta", "etykiety", "wlepka", "wlepki", "sticker", "stickers", "magnes", "magnesy", "taxi", "taksi"]],
      ["Folie i banery 24h", ["baner", "banery", "banner", "bannery", "folia", "folie", "frontlit", "owv", "owh"]],
      ["Druk cyfrowy i ksero 24h", ["druk", "wydruk", "wydruki", "ksero", "skan", "skanowanie", "kopie", "kopii", "strony", "stron"]],
      ["Notesy i bloczki", ["notes", "notesy", "notatnik", "bloczek", "bloczki", "samokopiuj", "ncr"]],
      ["Koperty, teczki i papier firmowy", ["koperta", "koperty", "teczka", "teczki", "papier firmowy", "preprint"]],
      ["Kalendarze", ["kalendarz", "kalendarze", "biuwar", "biuwary", "piramidka"]],
      ["Restauracje, hotele", ["menu a3", "podkladka na tacke", "podkladki na tacke", "prezenter", "stojak dl", "stojak a6", "notes kelnerski", "notesy kelnerskie"]],
      ["Śluby, wesela i imprezy", ["zaproszenie", "zaproszenia", "winietka", "winietki", "plan stolow", "plan stołów"]],
      ["Roll-upy i X-banery", ["rollup", "roll up", "roll-up", "xbaner", "x baner", "x-banner"]],
      ["PCV i pianki", ["pcv", "pianka", "pianki", "foamboard", "plansza", "plansze", "tablica reklamowa", "tablice reklamowe"]],
      ["Koszulki i odzież", ["koszulka", "koszulki", "bluza", "bluzy", "polo", "odziez", "odzież", "nadruk na koszulce"]],
      ["Oprawa prac", ["oprawa", "oprawa pracy", "bindowanie", "bindownica"]],
      ["Laminowanie", ["laminowanie", "zalaminowac", "zalaminować"]],
      ["Obrazy na płótnie", ["obraz na plotnie", "obraz na płótnie", "canvas", "plotno", "płótno"]],
      ["Nieruchomości", ["nieruchomosci", "nieruchomości", "biuro nieruchomosci", "biuro nieruchomości", "deweloper", "agent nieruchomosci", "agent nieruchomości"]]
    ];
    for (const [pageName, variants] of direct) {
      if (smartQueryHas(query, variants)) return pageName;
    }
    const matches = getProductSearchMatches(query);
    return matches[0]?.score >= 45 ? matches[0].pageName : null;
  }

  function quoteAssistantHasAny(query, variants) {
    const normalized = normalizeSearchText(query);
    return variants.some(item => normalized.includes(normalizeSearchText(item)));
  }

  function quoteAssistantQuestion(prompt, chips = [], placeholder = "Napisz odpowiedź…", note = "") {
    return { status: "question", prompt, chips, placeholder, note };
  }

  function quoteAssistantQuantityQuestion(pageName) {
    const presets = {
      "Ulotki 24h": [100, 250, 500, 1000, 2500],
      "Wizytówki 24h": [50, 100, 200, 500],
      "Plakaty 24h": [1, 5, 10, 20, 30],
      "Naklejki, etykiety i magnesy": [50, 100, 250, 500, 1000],
      "Folie i banery 24h": [1, 2, 5, 10],
      "Druk cyfrowy i ksero 24h": [10, 20, 50, 100, 200],
      "Notesy i bloczki": [10, 50, 100, 250, 500],
      "Koperty, teczki i papier firmowy": [50, 100, 250, 500, 1000],
      "Kalendarze": [10, 50, 100, 150],
      "Restauracje, hotele": [10, 50, 100, 250],
      "Śluby, wesela i imprezy": [25, 50, 100, 150]
    };
    const values = presets[pageName] || [1, 10, 50, 100];
    return quoteAssistantQuestion(
      "Ile sztuk potrzebujesz?",
      values.map(value => [String(value), `${value} szt.`]),
      "Np. 350 szt."
    );
  }

  function quoteAssistantFormatQuestion(pageName) {
    if (pageName === "Ulotki 24h") {
      return quoteAssistantQuestion("Jaki format ulotki?", [["A6", "A6"], ["A5", "A5"], ["DL", "DL"], ["A4", "A4"]], "Np. A5");
    }
    if (pageName === "Plakaty 24h") {
      return quoteAssistantQuestion("Jaki format plakatu?", [["A4", "A4"], ["A3", "A3"], ["A2", "A2"], ["A1", "A1"], ["A0", "A0"], ["B1", "B1"]], "Np. A2 albo 50x70 cm");
    }
    if (pageName === "Druk cyfrowy i ksero 24h") {
      return quoteAssistantQuestion("Jaki format wydruku?", [["A4", "A4"], ["A3", "A3"]], "A4 lub A3");
    }
    return null;
  }

  function quoteAssistantAnalyze(query) {
    const clean = String(query || "").trim();
    if (!clean) {
      return quoteAssistantQuestion(
        "Co chcesz wycenić? Możesz napisać normalnym zdaniem.",
        QUOTE_ASSISTANT_PRODUCT_CHOICES,
        "Np. potrzebuję 500 ulotek A5"
      );
    }

    const matchingUseCase = findQuoteUseCase(clean);
    if (matchingUseCase && !quoteHasNamedProduct(clean)) {
      return { status: "usecase", useCase: matchingUseCase, source: clean };
    }
    const pageName = quoteAssistantProductPage(clean);
    if (!pageName) {
      return quoteAssistantQuestion(
        "Nie rozpoznałem jeszcze produktu. Wybierz kategorię albo dopisz, czego potrzebujesz.",
        QUOTE_ASSISTANT_PRODUCT_CHOICES,
        "Np. 2 banery 100x200 cm"
      );
    }

    const dimensions = parseSmartDimensions(clean);
    const quantity = parseSmartQuantity(clean, dimensions);
    const format = parseSmartFormat(clean);
    const normalized = normalizeSearchText(clean);

    if (pageName === "Nieruchomości") {
      return quoteAssistantQuestion(
        "Co dokładnie chcesz przygotować dla nieruchomości?",
        [["Wizytówki", "wizytówki"], ["Tablice PCV", "tablice PCV"], ["Banery", "banery"], ["Folia OWH", "folia OWH"], ["Teczki ofertowe", "teczki ofertowe"], ["Ulotki", "ulotki"], ["Papier firmowy", "papier firmowy"]],
        "Np. 2 tablice PCV 70x100 cm"
      );
    }

    const quantityPages = new Set([
      "Ulotki 24h", "Wizytówki 24h", "Plakaty 24h", "Naklejki, etykiety i magnesy",
      "Folie i banery 24h", "Druk cyfrowy i ksero 24h", "Notesy i bloczki",
      "Koperty, teczki i papier firmowy", "Kalendarze", "Restauracje, hotele", "Śluby, wesela i imprezy"
    ]);
    if (quantityPages.has(pageName) && !quantity) return quoteAssistantQuantityQuestion(pageName);

    if (pageName === "Ulotki 24h" && !format && !normalized.includes("sklad")) {
      return quoteAssistantFormatQuestion(pageName);
    }

    if (pageName === "Wizytówki 24h") {
      if (!dimensions) {
        const formats = state.prices?.wizytowki?.formaty || ["90x50 mm", "85x55 mm"];
        return quoteAssistantQuestion("Jaki format wizytówki?", formats.map(item => [item, item]), "Np. 90x50 mm");
      }
      if (!quoteAssistantHasAny(clean, ["jednostron", "dwustron", "offset"])) {
        return quoteAssistantQuestion("Druk jednostronny czy dwustronny?", [["Jednostronny", "jednostronne"], ["Dwustronny", "dwustronne"]], "Jednostronne lub dwustronne");
      }
    }

    if (pageName === "Plakaty 24h" && !format && !dimensions) {
      return quoteAssistantFormatQuestion(pageName);
    }

    if (pageName === "Naklejki, etykiety i magnesy" && !quoteAssistantHasAny(clean, ["taxi", "taksi"]) && !dimensions) {
      return quoteAssistantQuestion(
        "Jakie mają być wymiary jednej sztuki?",
        [["50 × 50 mm", "50x50 mm"], ["100 × 100 mm", "100x100 mm"], ["50 × 100 mm", "50x100 mm"]],
        "Np. 70x40 mm",
        "W kalkulatorze przyjmujemy wymiary od 30 × 30 do 500 × 500 mm."
      );
    }

    if (pageName === "Folie i banery 24h") {
      if (!dimensions) {
        return quoteAssistantQuestion(
          "Podaj szerokość i wysokość.",
          [["100 × 200 cm", "100x200 cm"], ["100 × 100 cm", "100x100 cm"], ["50 × 100 cm", "50x100 cm"]],
          "Np. 120x250 cm"
        );
      }
      if (quoteAssistantHasAny(clean, ["folia", "folie"]) && !quoteAssistantHasAny(clean, ["mat", "blysk", "laminat", "owh", "owv", "transparent", "przezrocz", "podswiet", "backlit", "transfer"])) {
        return quoteAssistantQuestion(
          "Jakiej folii potrzebujesz?",
          [["Mat", "folia mat"], ["Błysk", "folia błysk"], ["Z laminatem", "folia z laminatem"], ["OWH / OWV", "folia OWH"], ["Transparentna", "folia transparentna"], ["Do podświetleń", "folia do podświetleń"]],
          "Np. folia OWH"
        );
      }
    }

    if (pageName === "Druk cyfrowy i ksero 24h") {
      const isScan = normalized.includes("skan");
      const isBookCopy = normalized.includes("ksiaz") && normalized.includes("ksero");
      if (!isScan && !isBookCopy && !format) return quoteAssistantFormatQuestion(pageName);
      if (!quoteAssistantHasAny(clean, ["kolor", "mono", "czarno", "cz b"])) {
        return quoteAssistantQuestion("Kolor czy czarno-biały?", [["Kolor", "kolor"], ["Czarno-biały", "czarno-biały"]], "Kolor lub czarno-biały");
      }
      if (!isScan && !isBookCopy && !normalized.includes("ksero") && !quoteAssistantHasAny(clean, ["jednostron", "dwustron"])) {
        return quoteAssistantQuestion("Wydruk jednostronny czy dwustronny?", [["Jednostronny", "jednostronny"], ["Dwustronny", "dwustronny"]], "Jednostronny lub dwustronny");
      }
    }

    if (pageName === "Notesy i bloczki") {
      if (!quoteAssistantHasAny(clean, ["klejon", "spiral", "samokopi", "ncr"])) {
        return quoteAssistantQuestion("Jaki rodzaj?", [["Notes klejony", "notes klejony"], ["Notes spiralowany", "notes spiralowany"], ["Bloczek NCR", "bloczek samokopiujący NCR"]], "Np. notes klejony A5");
      }
      if (quoteAssistantHasAny(clean, ["notes klejon"]) && !quoteAssistantHasAny(clean, ["z oklad", "z okład", "bez oklad", "bez okład"])) {
        return quoteAssistantQuestion("Notes z okładką czy bez?", [["Z okładką 170 g", "z okładką kredową 170 g"], ["Bez okładki", "bez okładki"]], "Z okładką lub bez okładki");
      }
      if (!format) {
        return quoteAssistantQuestion("Jaki format?", [["A4", "A4"], ["A5", "A5"], ["A6", "A6"], ["DL", "DL"]], "Np. A5");
      }
    }

    if (pageName === "Kalendarze") {
      if (!quoteAssistantHasAny(clean, ["trojdziel", "trójdziel", "jednodziel", "listwow", "biuwar", "piramid"])) {
        return quoteAssistantQuestion("Jaki rodzaj kalendarza?", [["Trójdzielny", "kalendarz trójdzielny"], ["Jednodzielny", "kalendarz jednodzielny"], ["Listwowany", "kalendarz listwowany"], ["Biuwar", "biuwar"], ["Piramidka", "piramidka"]], "Np. kalendarz trójdzielny");
      }
      if (quoteAssistantHasAny(clean, ["trojdziel", "trójdziel", "jednodziel"]) && !quoteAssistantHasAny(clean, ["plask", "płask", "wypuk", "soft skin", "folia mat", "folia blysk", "folia błysk"])) {
        return quoteAssistantQuestion("Jaka główka kalendarza?", [["Płaska", "płaska główka"], ["Wypukła Soft Skin", "główka wypukła folia soft skin"], ["Wypukła mat", "główka wypukła folia mat"], ["Wypukła błysk", "główka wypukła folia błysk"]], "Np. płaska główka");
      }
      if (quoteAssistantHasAny(clean, ["listwow"]) && !format) {
        return quoteAssistantQuestion("Jaki format kalendarza listwowanego?", [["A1", "A1"], ["A2", "A2"], ["B1", "B1"]], "A1, A2 lub B1");
      }
      if (quoteAssistantHasAny(clean, ["biuwar"]) && !format) {
        return quoteAssistantQuestion("Jaki format biuwaru?", [["A2", "A2"], ["B2", "B2"]], "A2 lub B2");
      }
      if (quoteAssistantHasAny(clean, ["piramid"]) && !format) {
        return quoteAssistantQuestion("Jaki format piramidki?", [["A5", "A5"], ["DL", "DL"]], "A5 lub DL");
      }
    }

    if (pageName === "Koperty, teczki i papier firmowy") {
      if (!quoteAssistantHasAny(clean, ["kopert", "teczk", "papier firmowy", "preprint"])) {
        return quoteAssistantQuestion("Co z materiałów firmowych?", [["Teczki ofertowe", "teczki ofertowe"], ["Papier firmowy", "papier firmowy"], ["Koperty", "koperty"]], "Np. 250 teczek ofertowych");
      }
      if (quoteAssistantHasAny(clean, ["teczk"])) {
        if (!quoteAssistantHasAny(clean, ["foliow", "standardow", "standard 4 0"])) {
          return quoteAssistantQuestion("Teczki standardowe czy foliowane?", [["Standardowe", "standardowe 4/0"], ["Foliowane", "standardowe foliowane 4/0"]], "Standardowe lub foliowane");
        }
        if (!quoteAssistantHasAny(clean, ["jednobig", "dwubig"])) {
          return quoteAssistantQuestion("Teczki jednobigowe czy dwubigowe?", [["Jednobigowe", "jednobigowe"], ["Dwubigowe", "dwubigowe"]], "Jednobigowe lub dwubigowe");
        }
      }
      if (quoteAssistantHasAny(clean, ["kopert"]) && !quoteAssistantHasAny(clean, [" dl", "c5", "c6"])) {
        return quoteAssistantQuestion("Jaki format koperty?", [["DL", "DL"], ["C5", "C5"], ["C6", "C6"]], "DL, C5 lub C6");
      }
    }

    const intent = getSmartQuoteIntent(clean);
    if (intent && intent.autoCalculate !== false) return { status: "ready", intent, pageName };
    if (intent && intent.autoCalculate === false) {
      return { status: "navigation", pageName, intent, message: "Rozpoznałem produkt i część parametrów. Otworzę kalkulator z tym, co udało się ustawić — uzupełnisz tylko brakujące pole." };
    }

    return {
      status: "navigation",
      pageName,
      message: "Rozpoznałem kategorię, ale ten produkt ma kilka dodatkowych parametrów. Otworzę właściwy kalkulator, żeby dokończyć zamówienie bez zgadywania."
    };
  }

  function setupQuoteAssistant() {
    const launch = document.getElementById("openQuoteAssistant");
    const panel = document.getElementById("quoteAssistant");
    const messages = document.getElementById("quoteAssistantMessages");
    const choices = document.getElementById("quoteAssistantChoices");
    const form = document.getElementById("quoteAssistantForm");
    const input = document.getElementById("quoteAssistantInput");
    const reset = document.getElementById("quoteAssistantReset");
    const purposeLaunch = document.getElementById("openPurposeFinder");
    const purposeLaunchBottom = document.getElementById("openPurposeFinderBottom");
    if (!launch || !panel || !messages || !choices || !form || !input) return;

    const session = { parts: [], readyIntent: null, navigationPage: null, navigationIntent: null, suggestions: [], started: false };

    function scrollAssistant() {
      requestAnimationFrame(() => messages.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }

    function addBubble(role, text, html = false) {
      const node = document.createElement("div");
      node.className = `quote-assistant__bubble quote-assistant__bubble--${role}`;
      node.innerHTML = html ? text : esc(text);
      messages.appendChild(node);
      scrollAssistant();
      return node;
    }

    function clearActions() {
      choices.innerHTML = "";
      session.readyIntent = null;
      session.navigationPage = null;
      session.navigationIntent = null;
      session.suggestions = [];
    }

    function showUseCaseChoices() {
      clearActions();
      addBubble("assistant", "<strong>Do czego potrzebujesz wydruku?</strong><span>Wybierz zastosowanie. Pokażę pasujące produkty z oferty, a Ty zdecydujesz, który chcesz wycenić.</span>", true);
      QUOTE_USE_CASES.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quote-assistant__purpose-choice";
        button.dataset.purposeId = item.id;
        button.innerHTML = `<span aria-hidden="true">${item.icon}</span><strong>${esc(item.title)}</strong><span aria-hidden="true">→</span>`;
        choices.appendChild(button);
      });
      input.placeholder = "Lub opisz zastosowanie własnymi słowami…";
    }

    function renderUseCaseRecommendations(result) {
      clearActions();
      const item = result.useCase;
      session.suggestions = item.suggestions;
      addBubble("assistant", `<strong>${esc(item.title)}</strong><span>Te produkty mogą pasować do Twojego zastosowania. Wybierz jeden, aby przejść do koszyka.</span>`, true);
      item.suggestions.forEach((suggestion, index) => {
        if (!pages.some(([name]) => name === suggestion.page)) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quote-assistant__recommendation";
        button.dataset.suggestionIndex = String(index);
        button.innerHTML = `<strong>${esc(suggestion.title)} <span aria-hidden="true">→</span></strong><small>${esc(suggestion.reason)}</small>`;
        choices.appendChild(button);
      });
      addBubble("assistant", `<span>${esc(item.note)} Nie naliczam ceny, dopóki nie wybierzesz produktu i nie uzupełnisz parametrów.</span>`, true);
      const again = document.createElement("button");
      again.type = "button";
      again.className = "quote-assistant__choice";
      again.dataset.purposeBack = "true";
      again.textContent = "← Inne zastosowanie";
      choices.appendChild(again);
      input.placeholder = "Możesz też wpisać nazwę innego produktu…";
      analyticsTrack("quote_wizard_use_case", { use_case: item.id });
    }

    function renderQuestion(result) {
      clearActions();
      addBubble("assistant", `<strong>${esc(result.prompt)}</strong>${result.note ? `<span>${esc(result.note)}</span>` : ""}`, true);
      (result.chips || []).forEach(([label, value]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quote-assistant__choice";
        button.dataset.assistantAnswer = value;
        button.textContent = label;
        choices.appendChild(button);
      });
      input.placeholder = result.placeholder || "Napisz odpowiedź…";
      input.focus({ preventScroll: true });
    }

    function renderReady(result, combined) {
      clearActions();
      session.readyIntent = result.intent;
      const fallback = result.intent.quantityFallback
        ? `<span>Poprosiłeś o ${esc(result.intent.requestedQuantity)} szt. — kalkulator dobierze korzystny standard ${esc(result.intent.selectedQuantity)} szt.</span>`
        : `<span>Sprawdzę jeszcze wszystkie ustawienia w kalkulatorze przed pokazaniem ceny.</span>`;
      addBubble("assistant", `<strong>Mam komplet ✓</strong><span>${esc(result.intent.pageName)}</span><b>${esc(result.intent.summary)}</b>${fallback}`, true);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button quote-assistant__open-quote";
      button.id = "quoteAssistantOpenQuote";
      button.textContent = "Policz i pokaż cenę →";
      choices.appendChild(button);
      input.placeholder = "Gotowe — kliknij przycisk powyżej albo zacznij od nowa.";
      analyticsTrack("quote_wizard_ready", { page: result.intent.pageName, summary: result.intent.summary });
    }

    function renderNavigation(result) {
      clearActions();
      session.navigationPage = result.pageName;
      session.navigationIntent = result.intent || null;
      addBubble("assistant", `<strong>${esc(result.message)}</strong><span>${esc(result.pageName)}</span>`, true);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button quote-assistant__open-quote";
      button.id = "quoteAssistantOpenCalculator";
      button.textContent = "Otwórz właściwy kalkulator →";
      choices.appendChild(button);
    }

    function analyze() {
      const combined = session.parts.join(" ").trim();
      const result = quoteAssistantAnalyze(combined);
      if (result.status === "usecase") renderUseCaseRecommendations(result);
      else if (result.status === "question") renderQuestion(result);
      else if (result.status === "ready") renderReady(result, combined);
      else renderNavigation(result);
    }

    function submitAnswer(answer, displayText = answer) {
      const clean = String(answer || "").trim();
      if (!clean) return;
      if (!session.started) {
        session.started = true;
        analyticsTrack("quote_wizard_start");
      }
      addBubble("user", String(displayText || clean));
      session.parts.push(clean);
      input.value = "";
      choices.innerHTML = "";
      analyticsTrack("quote_wizard_message", { step: session.parts.length });
      analyze();
    }

    function resetSession() {
      session.parts = [];
      session.readyIntent = null;
      session.navigationPage = null;
      session.navigationIntent = null;
      session.started = false;
      messages.innerHTML = "";
      choices.innerHTML = "";
      addBubble("assistant", `<strong>Cześć! Pomogę Ci zrobić zamówienie.</strong><span>Napisz normalnie, czego potrzebujesz — np. „potrzebuję 1500 ulotek A5” albo „200 wizytówek dwustronnych”. Dopytam tylko o brakujące rzeczy.</span>`, true);
      // Jedno wejście pomocy zamiast dwóch: kto nie wie, czego potrzebuje, wybiera zastosowanie.
      const useCaseHelp = document.createElement("button");
      useCaseHelp.type = "button";
      useCaseHelp.className = "quote-assistant__purpose-choice";
      useCaseHelp.dataset.purposeBack = "1";
      useCaseHelp.innerHTML = `<span aria-hidden="true">▦</span><strong>Nie wiem, czego potrzebuję — dobierz według zastosowania</strong><span aria-hidden="true">→</span>`;
      choices.appendChild(useCaseHelp);
      input.placeholder = "Opisz, czego potrzebujesz…";
    }

    function openWizard() {
      panel.hidden = false;
      launch.setAttribute("aria-expanded", "true");
      purposeLaunch?.setAttribute("aria-expanded", "true");
      if (!messages.children.length) resetSession();
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function openPurposeFinder(sourceQuery = "") {
      openWizard();
      resetSession();
      messages.innerHTML = "";
      const query = String(sourceQuery || "").trim();
      const found = findQuoteUseCase(query);
      if (query && found) {
        session.parts = [query];
        session.started = true;
        addBubble("user", query);
        renderUseCaseRecommendations({ useCase: found });
      } else {
        showUseCaseChoices();
      }
      input.focus({ preventScroll: true });
    }

    launch.addEventListener("click", () => {
      if (panel.hidden) openWizard();
      else {
        panel.hidden = true;
        launch.setAttribute("aria-expanded", "false");
        purposeLaunch?.setAttribute("aria-expanded", "false");
      }
    });
    purposeLaunch?.addEventListener("click", () => openPurposeFinder());
    purposeLaunchBottom?.addEventListener("click", () => openPurposeFinder());

    form.addEventListener("submit", event => {
      event.preventDefault();
      submitAnswer(input.value);
    });

    choices.addEventListener("click", event => {
      const useCaseButton = event.target.closest("[data-purpose-id]");
      if (useCaseButton) {
        const found = QUOTE_USE_CASES.find(item => item.id === useCaseButton.dataset.purposeId);
        if (found) {
          addBubble("user", found.title);
          session.parts = [found.title];
          renderUseCaseRecommendations({ useCase: found });
        }
        return;
      }
      if (event.target.closest("[data-purpose-back]")) {
        session.parts = [];
        showUseCaseChoices();
        return;
      }
      const suggestionButton = event.target.closest("[data-suggestion-index]");
      if (suggestionButton) {
        const suggestion = session.suggestions[Number(suggestionButton.dataset.suggestionIndex)];
        if (!suggestion) return;
        const previousText = session.parts.join(" ");
        const dimensions = parseSmartDimensions(previousText);
        const quantity = parseSmartQuantity(previousText, dimensions);
        const format = parseSmartFormat(previousText);
        session.parts = [suggestion.query, quantity ? `${quantity} szt.` : "", dimensions?.raw || "", format || ""].filter(Boolean);
        messages.innerHTML = "";
        addBubble("user", suggestion.title);
        analyticsTrack("quote_wizard_product_suggested", { page: suggestion.page });
        analyze();
        return;
      }
      const answerButton = event.target.closest("[data-assistant-answer]");
      if (answerButton) {
        submitAnswer(answerButton.dataset.assistantAnswer, answerButton.textContent);
        return;
      }
      if (event.target.closest("#quoteAssistantOpenQuote") && session.readyIntent) {
        const combined = session.parts.join(" ").trim();
        openSmartQuote(session.readyIntent, combined);
        return;
      }
      if (event.target.closest("#quoteAssistantOpenCalculator") && session.navigationPage) {
        if (session.navigationIntent) {
          const combined = session.parts.join(" ").trim();
          openSmartQuote(session.navigationIntent, combined);
        } else {
          navigateToPage(session.navigationPage);
        }
      }
    });

    function startFromDescription(sourceQuery = "") {
      openWizard();
      resetSession();
      const query = String(sourceQuery || "").trim();
      if (query) submitAnswer(query);
      else input.focus({ preventScroll: true });
    }
    reset?.addEventListener("click", resetSession);
    return { openPurposeFinder, startFromDescription };
  }

  function setSmartControlValue(id, requestedValue) {
    const control = document.getElementById(id);
    if (!control) return false;
    if (control.tagName === "SELECT") {
      const wanted = normalizeSearchText(requestedValue);
      const option = Array.from(control.options).find(item => normalizeSearchText(item.value) === wanted);
      if (!option) return false;
      control.value = option.value;
    } else {
      control.value = requestedValue;
    }
    control.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function applySmartQuotePreset(preset) {
    if (!preset || preset.pageName !== state.page) return;
    let success = true;
    for (const [id, value] of preset.steps || []) {
      if (!setSmartControlValue(id, value)) { success = false; break; }
    }
    if (!success) {
      showToast("Otworzyliśmy kalkulator, ale sprawdź parametry ręcznie.");
      return;
    }
    if (preset.autoCalculate === false) {
      showToast("Ustawiliśmy produkt — wybierz brakujące parametry.");
      return;
    }
    const calculateButton = document.getElementById("calculate");
    if (!calculateButton) return;
    calculateButton.click();
    const quoteArea = document.getElementById("quoteArea");
    if (quoteArea?.querySelector(".quote-card")) {
      const fallbackMessage = preset.quantityFallback
        ? `<span><strong>Nie ma standardowego nakładu ${esc(preset.requestedQuantity)} szt.</strong> Wybraliśmy najkorzystniejszy dostępny nakład, który pokrywa zapotrzebowanie: <strong>${esc(preset.selectedQuantity)} szt.</strong>${Number.isFinite(Number(preset.fallbackPrice)) ? ` za ${money(preset.fallbackPrice)} zł brutto` : ""}.</span>`
        : `<span>Na podstawie: „${esc(preset.sourceQuery)}”. Sprawdź ustawienia przed dodaniem do koszyka.</span>`;
      quoteArea.insertAdjacentHTML("afterbegin", `<div class="smart-quote-notice${preset.quantityFallback ? " smart-quote-notice--fallback" : ""}"><strong>${preset.quantityFallback ? "↗ Dopasowaliśmy najkorzystniejszy standardowy nakład" : "✓ Parametry ustawione automatycznie"}</strong>${fallbackMessage}</div>`);
      quoteArea.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast(preset.quantityFallback ? `Najbliższy opłacalny nakład: ${preset.selectedQuantity} szt.` : "Gotowe — cena została policzona automatycznie.");
    }
  }

  function openSmartQuote(intent, sourceQuery) {
    if (!intent?.pageName) return;
    state.smartQuotePreset = { ...intent, sourceQuery: String(sourceQuery || "").trim() };
    analyticsTrack("smart_quote", { query: sourceQuery, page: intent.pageName, summary: intent.summary });
    navigateToPage(intent.pageName);
  }

  function levenshteinDistance(a, b) {
    const left = String(a);
    const right = String(b);
    const rows = right.length + 1;
    const previous = Array.from({ length: rows }, (_, index) => index);

    for (let i = 1; i <= left.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= right.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
        );
      }
      previous.splice(0, previous.length, ...current);
    }

    return previous[right.length];
  }

  function getProductSearchMatches(query) {
    if (intelligentSearch) return intelligentSearch.rank(query, state.searchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];
    const rawTokens = normalizedQuery.split(/\s+/).filter(token => token.length > 1);
    const queryTokens = rawTokens.filter(token => !SEARCH_STOP_WORDS.has(token));
    const meaningfulTokens = queryTokens.length ? queryTokens : rawTokens;

    return Object.entries(state.searchTerms || DEFAULT_PRODUCT_SEARCH_TERMS).map(([pageName, terms]) => {
      const normalizedTerms = [pageName, ...terms].map(normalizeSearchText);
      let score = 0;

      for (const term of normalizedTerms) {
        if (term === normalizedQuery) score = Math.max(score, 120);
        else if (term.includes(normalizedQuery) || normalizedQuery.includes(term)) score = Math.max(score, 90);

        const termTokens = term.split(/\s+/);
        for (const token of meaningfulTokens) {
          if (term.includes(token)) {
            score += 24;
            continue;
          }

          let bestDistance = Infinity;
          for (const termToken of termTokens) {
            bestDistance = Math.min(bestDistance, levenshteinDistance(token, termToken));
          }
          const allowedDistance = token.length >= 9 ? 3 : token.length >= 6 ? 2 : token.length >= 4 ? 1 : 0;
          if (bestDistance <= allowedDistance) score += 18 - bestDistance * 5;
        }
      }

      const combinedTerms = normalizedTerms.join(" ");
      const matchedTokenCount = meaningfulTokens.filter(token => {
        if (combinedTerms.includes(token)) return true;
        return normalizedTerms.some(term => term.split(/\s+/).some(termToken => {
          const allowedDistance = token.length >= 9 ? 3 : token.length >= 6 ? 2 : token.length >= 4 ? 1 : 0;
          return allowedDistance > 0 && levenshteinDistance(token, termToken) <= allowedDistance;
        }));
      }).length;

      if (meaningfulTokens.length > 1 && matchedTokenCount === meaningfulTokens.length) score += 45;
      else if (matchedTokenCount >= 2) score += matchedTokenCount * 12;

      return { pageName, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.pageName.localeCompare(b.pageName, "pl"));
  }

  function isStaffGateTrigger(query) {
    return normalizeSearchText(query) === STAFF_GATE_DEFAULT_TRIGGER;
  }

  async function tryOpenStaffPanel(query) {
    const phrase = String(query || "").trim();
    if (!phrase) return false;
    try {
      const response = await fetch("staff-gate.php", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ phrase })
      });
      if (!response.ok) return false;
      const result = await response.json();
      if (!result.success || !result.url) return false;
      window.location.href = result.url;
      return true;
    } catch {
      return false;
    }
  }

  function setupProductSearch() {
    if (!productSearch || !productSearchResults) return;

    productSearch.addEventListener("input", () => {
      state.searchQuery = productSearch.value;
      if (isBrainrotTrigger(state.searchQuery)) {
        activateBrainrotMode();
        return;
      }
      const adminPage = getHiddenAdminPage(state.searchQuery);
      if (adminPage) {
        openHiddenAdminPage(adminPage);
        return;
      }
      if (isRouletteTrigger(state.searchQuery)) {
        openRouletteEasterEgg();
        return;
      }
      if (isStaffGateTrigger(state.searchQuery)) {
        productSearchResults.innerHTML = '<button class="product-search__result is-best" type="button" id="openStaffGateResult">Panel pracowniczy — naciśnij Enter</button>';
        const staffResult = document.getElementById("openStaffGateResult");
        if (staffResult) staffResult.addEventListener("click", async () => {
          if (!(await tryOpenStaffPanel(state.searchQuery))) showToast("Nie udało się otworzyć panelu pracowniczego.");
        });
        return;
      }
      renderNavigation();
    });

    productSearch.addEventListener("keydown", async event => {
      if (event.key !== "Enter") return;
      if (isBrainrotTrigger(state.searchQuery)) {
        event.preventDefault();
        activateBrainrotMode();
        return;
      }
      if (isStaffGateTrigger(state.searchQuery)) {
        event.preventDefault();
        if (!(await tryOpenStaffPanel(state.searchQuery))) {
          showToast("Nie udało się otworzyć panelu pracowniczego.");
        }
        return;
      }
      const adminPage = getHiddenAdminPage(state.searchQuery);
      if (adminPage) {
        event.preventDefault();
        openHiddenAdminPage(adminPage);
        return;
      }
      if (isRouletteTrigger(state.searchQuery)) {
        event.preventDefault();
        openRouletteEasterEgg();
        return;
      }
      const smartAnalysis = quoteAssistantAnalyze(state.searchQuery);
      const smartIntent = smartAnalysis.status === "question" ? null : getSmartQuoteIntent(state.searchQuery);
      if (smartIntent) {
        event.preventDefault();
        openSmartQuote(smartIntent, state.searchQuery);
        return;
      }
      const matches = getProductSearchMatches(state.searchQuery);
      const [bestMatch] = matches;
      if (!bestMatch) {
        event.preventDefault();
        if (await tryOpenStaffPanel(state.searchQuery)) return;
        analyticsTrack("search", { query: state.searchQuery, results: 0 });
        return;
      }
      event.preventDefault();
      openPageFromSearch(bestMatch.pageName);
    });
    productSearch.addEventListener("focus", () => {
      if (!productSearch.value.trim()) renderProductSearchResults([]);
    });
    bindSearchArrowKeys(productSearch, productSearchResults);
  }

  function getHiddenAdminPage(query) {
    const normalized = normalizeSearchText(query);
    if (PRICE_ADMIN_TRIGGERS.has(normalized)) return "Edycja cen";
    if (normalized === SEARCH_ADMIN_TRIGGER) return "Edycja wyszukiwarki";
    if (normalized === ANALYTICS_ADMIN_TRIGGER) return "Statystyki";
    return null;
  }

  function openHiddenAdminPage(pageName) {
    state.adminUnlocked = true;
    try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch {}
    state.page = pageName;
    state.searchQuery = "";
    if (productSearch) productSearch.value = "";
    if (productSearchResults) productSearchResults.innerHTML = "";
    renderNavigation();
    renderCurrentPage();
    sidebar.classList.remove("open");
  }

  function isBrainrotTrigger(query) {
    return String(query || "")
      .toLocaleLowerCase("en-US")
      .trim()
      .replace(/\s+/g, " ") === BRAINROT_TRIGGER;
  }

  function activateBrainrotMode() {
    state.searchQuery = "";
    if (productSearch) productSearch.value = "";
    if (productSearchResults) productSearchResults.innerHTML = "";
    renderNavigation();
    renderCurrentPage();
    renderCart();
    sidebar.classList.remove("open");
    window.DrukulatorI18n?.setLanguage?.("brainrot", false);
    showToast("Brainrot mode activated 💀");
  }

  function isRouletteTrigger(query) {
    return normalizeSearchText(query) === ROULETTE_TRIGGER;
  }

  function sanitizeCaseConfig(rawConfig) {
    const source = rawConfig && typeof rawConfig === "object" ? rawConfig : DEFAULT_CASE_CONFIG;
    const rawItems = Array.isArray(source.items) ? source.items : [];
    const usedIds = new Set();
    const items = rawItems.map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const baseId = String(item.id || `item-${index + 1}`).trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || `item-${index + 1}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
      usedIds.add(id);

      const name = String(item.name || `Nagroda ${index + 1}`).trim();
      const image = String(item.image || "").trim();
      const rarity = CASE_RARITIES.has(String(item.rarity || "").toLowerCase())
        ? String(item.rarity).toLowerCase()
        : "common";
      const discount = Math.max(0, Math.min(ROULETTE_MAX_DISCOUNT, Math.round(Number(item.discount) || 0)));
      const weight = Number(item.weight);
      if (!name || !Number.isFinite(weight) || weight <= 0) return null;
      return { id, name, image, rarity, discount, weight };
    }).filter(Boolean);

    const fallbackItems = DEFAULT_CASE_CONFIG.items.map(item => ({ ...item }));
    return {
      name: String(source.name || DEFAULT_CASE_CONFIG.name).trim() || DEFAULT_CASE_CONFIG.name,
      items: items.length ? items : fallbackItems
    };
  }

  function normalizeRouletteState(saved) {
    const hasNewFormat = saved && typeof saved === "object" && Object.prototype.hasOwnProperty.call(saved, "keys");
    const keys = hasNewFormat ? Number.parseInt(saved.keys, 10) : CASE_STARTING_KEYS;
    const discount = hasNewFormat ? Number(saved.discount) : 0;
    const lastItemId = hasNewFormat && typeof saved.lastItemId === "string" ? saved.lastItemId : null;
    const plays = hasNewFormat ? Math.max(0, Number.parseInt(saved.plays, 10) || 0) : 0;
    return {
      keys: Number.isInteger(keys) ? Math.max(0, Math.min(CASE_STARTING_KEYS, keys)) : CASE_STARTING_KEYS,
      discount: Number.isFinite(discount) ? Math.max(0, Math.min(ROULETTE_MAX_DISCOUNT, Math.round(discount))) : 0,
      lastItemId,
      plays
    };
  }

  function saveRouletteState() {
    try {
      localStorage.setItem(ROULETTE_STORAGE_KEY, JSON.stringify(state.roulette));
    } catch {
      // Gra działa również bez pamięci lokalnej.
    }
  }

  function getCaseItemById(id) {
    return state.caseConfig.items.find(item => item.id === id) || null;
  }

  function secureRandomUnit() {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] / 4294967296;
    }
    return Math.random();
  }

  function weightedCaseItem() {
    const items = state.caseConfig.items;
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = secureRandomUnit() * totalWeight;
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item;
    }
    return items[items.length - 1];
  }

  function caseItemInitials(name) {
    const words = String(name || "?").trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(word => word[0]).join("").toUpperCase() || "?";
  }

  function renderCaseItemCard(item, index, isTarget = false) {
    const image = item.image
      ? `<img src="${esc(item.image)}" alt="" draggable="false">`
      : "";
    return `
      <article class="case-item rarity-${esc(item.rarity)}${isTarget ? " is-target" : ""}" data-case-index="${index}" data-case-item-id="${esc(item.id)}">
        <div class="case-item-visual">
          <span class="case-item-fallback" aria-hidden="true">${esc(caseItemInitials(item.name))}</span>
          ${image}
        </div>
        <strong>${esc(item.name)}</strong>
        <small>+${item.discount}%</small>
      </article>`;
  }

  function bindCaseImageFallbacks(container) {
    container.querySelectorAll(".case-item img, .case-winner img").forEach(image => {
      image.addEventListener("error", () => {
        image.hidden = true;
        image.closest(".case-item")?.classList.add("image-missing");
      }, { once: true });
    });
  }

  function createCaseRoll(winner) {
    const roll = Array.from({ length: CASE_SPIN_ITEM_COUNT }, () => weightedCaseItem());
    roll[CASE_TARGET_INDEX] = winner;
    if (CASE_TARGET_INDEX > 0 && roll[CASE_TARGET_INDEX - 1].id === winner.id) roll[CASE_TARGET_INDEX - 1] = weightedCaseItem();
    if (CASE_TARGET_INDEX + 1 < roll.length && roll[CASE_TARGET_INDEX + 1].id === winner.id) roll[CASE_TARGET_INDEX + 1] = weightedCaseItem();
    return roll;
  }

  function renderIdleCaseTrack(overlay) {
    const track = overlay.querySelector("#rouletteTrack");
    const items = Array.from({ length: 14 }, (_, index) => state.caseConfig.items[index % state.caseConfig.items.length]);
    track.dataset.spinning = "false";
    track.style.transition = "none";
    track.style.transform = "translate3d(0, 0, 0)";
    track.innerHTML = items.map((item, index) => renderCaseItemCard(item, index)).join("");
    bindCaseImageFallbacks(track);
  }

  function renderCaseWinner(item) {
    const image = item.image
      ? `<img src="${esc(item.image)}" alt="${esc(item.name)}">`
      : "";
    return `
      <div class="case-winner rarity-${esc(item.rarity)}">
        <div class="case-winner-image">
          <span aria-hidden="true">${esc(caseItemInitials(item.name))}</span>
          ${image}
        </div>
        <div>
          <small>Wylosowano</small>
          <strong>${esc(item.name)}</strong>
          <span>Łączna zniżka: ${state.roulette.discount}%</span>
        </div>
      </div>`;
  }

  function openRouletteEasterEgg() {
    state.searchQuery = "";
    productSearch.value = "";
    productSearchResults.innerHTML = "";
    renderNavigation();
    sidebar.classList.remove("open");

    let overlay = document.getElementById("rouletteEasterEgg");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "rouletteEasterEgg";
      overlay.className = "roulette-overlay";
      overlay.innerHTML = `
        <section class="roulette-dialog" role="dialog" aria-modal="true" aria-labelledby="rouletteTitle">
          <button class="roulette-close" id="rouletteClose" type="button" aria-label="Zamknij skrzynkę">×</button>
          <p class="roulette-kicker">Sekret Druk24</p>
          <h2 id="rouletteTitle">${esc(state.caseConfig.name)}</h2>
          <p class="roulette-intro">Otwieranie działa jak losowanie skrzynki. Każda próba zużywa 1 klucz, a wylosowana nagroda zwiększa Twoją zniżkę.</p>

          <div class="case-stats" aria-label="Stan gry">
            <div class="roulette-balance">
              <span>Klucze</span>
              <strong id="rouletteKeys">${CASE_STARTING_KEYS}</strong>
              <small>1 otwarcie = 1 klucz</small>
            </div>
            <div class="roulette-balance">
              <span>Zdobyta zniżka</span>
              <strong id="rouletteBalance">0%</strong>
              <small>Maksymalnie ${ROULETTE_MAX_DISCOUNT}%</small>
            </div>
          </div>

          <div class="case-viewport" id="rouletteViewport" aria-label="Losowanie nagrody">
            <div class="case-pointer" aria-hidden="true"></div>
            <div class="case-track" id="rouletteTrack"></div>
          </div>

          <div class="roulette-controls">
            <button class="button full roulette-spin" id="rouletteSpin" type="button">Użyj klucza</button>
            <button class="button secondary full hidden" id="rouletteRestart" type="button">Nowa runda — 5 kluczy</button>
          </div>

          <div class="roulette-result" id="rouletteResult" aria-live="polite">Masz 5 kluczy. Otwórz pierwszą skrzynkę.</div>
          <div class="roulette-footer-actions">
            <button class="button secondary" id="rouletteCopy" type="button">Kopiuj wynik</button>
          </div>
          <p class="roulette-note">Grafiki, nazwy, zniżki i szanse ustawisz w <code>data/case-items.json</code>. Wynik easter egga wymaga potwierdzenia przy składaniu zamówienia.</p>
        </section>`;
      document.body.appendChild(overlay);
      setupRouletteEvents(overlay);
    }

    overlay.classList.add("is-open");
    document.body.classList.add("roulette-open");
    startRouletteJumpscareWatch();
    updateRouletteUi();
    document.getElementById("rouletteClose").focus();
  }

  function setupRouletteEvents(overlay) {
    overlay.querySelector("#rouletteClose").addEventListener("click", closeRouletteEasterEgg);
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeRouletteEasterEgg();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) closeRouletteEasterEgg();
    });

    overlay.querySelector("#rouletteSpin").addEventListener("click", spinRoulette);
    overlay.querySelector("#rouletteRestart").addEventListener("click", () => {
      state.roulette = { keys: CASE_STARTING_KEYS, discount: 0, lastItemId: null, plays: 0 };
      saveRouletteState();
      renderIdleCaseTrack(overlay);
      updateRouletteUi("Nowa runda. Masz 5 kluczy.");
    });
    overlay.querySelector("#rouletteCopy").addEventListener("click", () => {
      const lastItem = getCaseItemById(state.roulette.lastItemId);
      const lastResult = lastItem ? ` Ostatnia nagroda: ${lastItem.name}.` : "";
      copyText(`Skrzynka zniżek Druk24 — moja łączna zniżka: ${state.roulette.discount}%.${lastResult}`);
    });
  }

  function closeRouletteEasterEgg() {
    const overlay = document.getElementById("rouletteEasterEgg");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("roulette-open");
    stopRouletteJumpscareWatch();
    productSearch.focus();
  }

  function startRouletteJumpscareWatch() {
    stopRouletteJumpscareWatch();
    rouletteJumpscareIntervalId = window.setInterval(() => {
      const rouletteOverlay = document.getElementById("rouletteEasterEgg");
      if (!rouletteOverlay?.classList.contains("is-open")) {
        stopRouletteJumpscareWatch();
        return;
      }
      if (!rouletteJumpscareActive && secureRandomUnit() < ROULETTE_JUMPSCARE_CHANCE) {
        showRouletteJumpscare();
      }
    }, ROULETTE_JUMPSCARE_CHECK_MS);
  }

  function stopRouletteJumpscareWatch() {
    if (rouletteJumpscareIntervalId !== null) {
      window.clearInterval(rouletteJumpscareIntervalId);
      rouletteJumpscareIntervalId = null;
    }
    hideRouletteJumpscare();
  }

  function showRouletteJumpscare() {
    const rouletteOverlay = document.getElementById("rouletteEasterEgg");
    if (!rouletteOverlay?.classList.contains("is-open") || rouletteJumpscareActive) return;

    rouletteJumpscareActive = true;
    const jumpscare = document.createElement("div");
    jumpscare.id = "rouletteJumpscare";
    jumpscare.className = "roulette-jumpscare";
    jumpscare.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.alt = "";
    image.draggable = false;
    image.src = `${ROULETTE_JUMPSCARE_IMAGE}?play=${Date.now()}-${Math.floor(secureRandomUnit() * 1e9)}`;
    jumpscare.appendChild(image);
    document.body.appendChild(jumpscare);
    document.body.classList.add("roulette-jumpscare-open");

    rouletteJumpscareTimeoutId = window.setTimeout(hideRouletteJumpscare, ROULETTE_JUMPSCARE_DISPLAY_MS);
  }

  function hideRouletteJumpscare() {
    if (rouletteJumpscareTimeoutId !== null) {
      window.clearTimeout(rouletteJumpscareTimeoutId);
      rouletteJumpscareTimeoutId = null;
    }
    document.getElementById("rouletteJumpscare")?.remove();
    document.body.classList.remove("roulette-jumpscare-open");
    rouletteJumpscareActive = false;
  }

  function spinRoulette() {
    const overlay = document.getElementById("rouletteEasterEgg");
    const spinButton = overlay.querySelector("#rouletteSpin");
    const track = overlay.querySelector("#rouletteTrack");
    const viewport = overlay.querySelector("#rouletteViewport");

    if (track.dataset.spinning === "true") return;
    if (state.roulette.keys <= 0) {
      updateRouletteUi("Nie masz już kluczy. Rozpocznij nową rundę.");
      return;
    }

    const winner = weightedCaseItem();
    const roll = createCaseRoll(winner);
    state.roulette.keys -= 1;
    saveRouletteState();
    updateCaseCounters(overlay);

    track.dataset.spinning = "true";
    track.style.transition = "none";
    track.style.transform = "translate3d(0, 0, 0)";
    track.innerHTML = roll.map((item, index) => renderCaseItemCard(item, index, index === CASE_TARGET_INDEX)).join("");
    bindCaseImageFallbacks(track);

    spinButton.disabled = true;
    overlay.querySelector("#rouletteRestart").classList.add("hidden");
    overlay.querySelector("#rouletteResult").textContent = "Skrzynka się otwiera...";

    const targetCard = track.querySelector(`[data-case-index="${CASE_TARGET_INDEX}"]`);
    const targetCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
    const viewportCenter = viewport.clientWidth / 2;
    const safeJitter = Math.min(22, targetCard.offsetWidth * 0.16);
    const jitter = (secureRandomUnit() * 2 - 1) * safeJitter;
    const destination = viewportCenter - targetCenter + jitter;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const duration = reducedMotion ? 450 : CASE_SPIN_DURATION_MS;

    void track.offsetWidth;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        track.style.transition = `transform ${duration}ms ${CASE_SPIN_EASING}`;
        track.style.transform = `translate3d(${destination}px, 0, 0)`;
      });
    });

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      track.dataset.spinning = "false";
      targetCard.classList.add("is-winner");

      state.roulette.discount = Math.min(ROULETTE_MAX_DISCOUNT, state.roulette.discount + winner.discount);
      state.roulette.lastItemId = winner.id;
      state.roulette.plays += 1;
      saveRouletteState();

      spinButton.disabled = false;
      updateCaseCounters(overlay);
      spinButton.classList.toggle("hidden", state.roulette.keys <= 0);
      overlay.querySelector("#rouletteRestart").classList.toggle("hidden", state.roulette.keys > 0);
      overlay.querySelector("#rouletteResult").innerHTML = renderCaseWinner(winner);
      bindCaseImageFallbacks(overlay.querySelector("#rouletteResult"));
    };

    track.addEventListener("transitionend", event => {
      if (event.propertyName === "transform") finish();
    }, { once: true });
    window.setTimeout(finish, duration + 250);
  }

  function updateCaseCounters(overlay) {
    overlay.querySelector("#rouletteKeys").textContent = String(state.roulette.keys);
    overlay.querySelector("#rouletteBalance").textContent = `${state.roulette.discount}%`;
  }

  function updateRouletteUi(message) {
    const overlay = document.getElementById("rouletteEasterEgg");
    if (!overlay) return;

    updateCaseCounters(overlay);
    const spinButton = overlay.querySelector("#rouletteSpin");
    const restartButton = overlay.querySelector("#rouletteRestart");
    spinButton.disabled = false;
    spinButton.classList.toggle("hidden", state.roulette.keys <= 0);
    restartButton.classList.toggle("hidden", state.roulette.keys > 0);

    const track = overlay.querySelector("#rouletteTrack");
    if (!track.children.length || message?.startsWith("Nowa runda")) renderIdleCaseTrack(overlay);

    const result = overlay.querySelector("#rouletteResult");
    if (message) {
      result.textContent = message;
      return;
    }

    const lastItem = getCaseItemById(state.roulette.lastItemId);
    if (lastItem) {
      result.innerHTML = renderCaseWinner(lastItem);
      bindCaseImageFallbacks(result);
    } else {
      result.textContent = `Masz ${state.roulette.keys} kluczy. Otwórz pierwszą skrzynkę.`;
    }
  }

  function openPageFromSearch(pageName) {
    const query = state.searchQuery;
    const resultCount = getProductSearchMatches(query).length;
    analyticsTrack("search", { query, results: resultCount, selected: pageName });
    navigateToPage(pageName);
  }

  function searchRecentPages() {
    return intelligentSearch ? intelligentSearch.recent(state.searchTerms || DEFAULT_PRODUCT_SEARCH_TERMS, window.localStorage) : [];
  }

  function searchExamplesHtml() {
    // Search only returns matching products; the separate assistant handles descriptions.
    return "";
  }

  function searchResultDescription(match, prefix = "") {
    const intentLabels = {"zastosowanie":"Dobór według zastosowania", "dokładnie":"Dokładne dopasowanie", "fraza":"Pasuje do wyszukiwania", "początek":"Podpowiedź nazwy"};
    return prefix || intentLabels[match.reason] || "Podobne określenie lub literówka";
  }

  function bindSearchSuggestionButtons(results, input, onNavigate) {
    results.querySelectorAll("[data-search-example]").forEach(button => button.addEventListener("click", () => {
      input.value = button.dataset.searchExample;
      input.dispatchEvent(new Event("input", {bubbles:true}));
      input.focus();
    }));
    results.querySelectorAll("[data-search-recent]").forEach(button => button.addEventListener("click", () => onNavigate(button.dataset.searchRecent)));
  }

  // A keyboard-only visitor can open a suggestion without leaving the field with Tab.
  function bindSearchArrowKeys(input, results) {
    const buttons = () => Array.from(results.querySelectorAll("button:not([disabled])"));
    const handle = event => {
      if (event.key === "Escape") { results.innerHTML = ""; if (document.activeElement !== input) input.focus(); return; }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = buttons();
      if (!items.length) return;
      const index = items.indexOf(document.activeElement);
      event.preventDefault();
      const target = event.key === "ArrowDown" ? (index < 0 ? 0 : (index + 1) % items.length) : (index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length);
      items[target].focus();
    };
    input.addEventListener("keydown", handle);
    results.addEventListener("keydown", handle);
  }

  // 0.23.5v: inline interpreter for BOTH search fields. Existing hidden admin
  // triggers are handled before this renderer. We only ever suggest catalog
  // options; the original calculator remains the sole price authority.
  function renderInlineQuoteAssistant(host, input, query, matches) {
    if (!quoteInterpreter || !query || !state.prices) return;
    const analysis = quoteAssistantAnalyze(query);
    const intent = getSmartQuoteIntent(query);
    const result = quoteInterpreter.inspect(query, matches, state.prices, analysis, intent);
    if (!result) return;

    const card = document.createElement("section");
    card.className = "d24-quote-help";
    card.setAttribute("aria-label", "Asystent zamówienia — rozpoznane parametry");
    const head = document.createElement("div");
    head.className = "d24-quote-help__head";
    const titleContainer = document.createElement("div");
    const eyebrow = document.createElement("span");
    eyebrow.className = "d24-quote-help__eyebrow";
    eyebrow.textContent = "Asystent zamówienia · bez AI";
    const title = document.createElement("div");
    title.className = "d24-quote-help__title";
    title.textContent = result.page;
    titleContainer.append(eyebrow,title);
    const confidence = document.createElement("span");
    confidence.className = "d24-quote-help__confidence";
    confidence.textContent = result.confidence;
    head.append(titleContainer, confidence);
    card.append(head);

    if (result.fields.length) {
      const facts = document.createElement("div");
      facts.className = "d24-quote-help__data";
      result.fields.forEach(([label,value]) => {
        const fact = document.createElement("span");
        fact.className = "d24-quote-help__fact";
        const small = document.createElement("small"); small.textContent = label;
        const strong = document.createElement("b"); strong.textContent = value;
        fact.append(small,strong); facts.append(fact);
      });
      card.append(facts);
    }

    if (result.action === "clarify") {
      const question = document.createElement("div");
      question.className = "d24-quote-help__question";
      const strong = document.createElement("strong");
      strong.textContent = result.prompt || "Doprecyzuj zamówienie, zanim policzymy cenę.";
      question.append(strong);
      if (result.answers.length) {
        const chips = document.createElement("div");
        chips.className = "d24-quote-help__chips";
        result.answers.forEach(([value, label]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "d24-quote-help__chip";
          button.textContent = label;
          button.addEventListener("click", () => {
            input.value = `${query} ${value}`.trim();
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus({ preventScroll: true });
          });
          chips.append(button);
        });
        question.append(chips);
      }
      card.append(question);
    } else if (result.summary) {
      const summary = document.createElement("div");
      summary.className = "d24-quote-help__summary";
      summary.textContent = `Proponowana konfiguracja: ${result.summary}`;
      card.append(summary);
    }
    result.warnings.forEach(message => {
      const warning = document.createElement("div");
      warning.className = "d24-quote-help__warning";
      warning.textContent = message;
      card.append(warning);
    });

    const actions = document.createElement("div");
    actions.className = "d24-quote-help__actions";
    const primary = document.createElement("button");
    primary.type = "button";
    primary.className = "d24-quote-help__action";
    primary.textContent = result.action === "calculate" ? "Policz tę konfigurację →" : result.action === "clarify" ? "Przejdź do asystenta →" : "Otwórz kalkulator →";
    primary.addEventListener("click", () => {
      if (result.action === "calculate" && result.intent) openSmartQuote(result.intent,query);
      else if (result.action === "clarify") {
        if (state.page !== "Start") navigateToPage("Start");
        homeQuoteWizard?.startFromDescription(query);
      } else navigateToPage(result.page);
    });
    actions.append(primary);
    if (result.action !== "navigate") {
      const manual = document.createElement("button");
      manual.type = "button";
      manual.className = "d24-quote-help__action d24-quote-help__action--secondary";
      manual.textContent = "Ustaw ręcznie";
      manual.addEventListener("click", () => navigateToPage(result.page));
      actions.append(manual);
    }
    card.append(actions);
    const foot = document.createElement("small");
    foot.className = "d24-quote-help__foot";
    foot.textContent = "Rozpoznane dane i sugestie sprawdź w kalkulatorze. Cena pochodzi wyłącznie z aktualnego cennika Druk24.";
    card.append(foot);
    host.prepend(card);
  }

  function renderProductSearchResults(matches) {
    if (!productSearchResults) return;
    const query = normalizeSearchText(state.searchQuery);
    if (!query) { productSearchResults.replaceChildren(); return; }
    productSearchResults.innerHTML = matches.length ? matches.slice(0, 6).map((match, index) => `
      <button class="product-search__result d24-search-result${index === 0 ? " is-best" : ""}" type="button" data-search-page="${esc(match.pageName)}">
        <span class="d24-search-result__eyebrow">${searchResultDescription(match,index===0 ? "Najlepsze dopasowanie" : "")}</span>
        <strong>${format24hLabel(match.pageName)}</strong><span class="d24-search-result__arrow" aria-hidden="true">→</span>
      </button>`).join("") : `<div class="d24-search-no-results"><strong>Nie znaleźliśmy produktu</strong><span>Spróbuj krótszej nazwy lub wybierz kategorię z menu.</span></div>`;
    productSearchResults.querySelectorAll("[data-search-page]").forEach(button => {
      button.addEventListener("click", () => openPageFromSearch(button.dataset.searchPage));
    });
  }

  function applyTheme(theme, persist) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";

    if (themeToggle) {
      const icon = themeToggle.querySelector(".theme-toggle__icon");
      const label = themeToggle.querySelector(".theme-toggle__label");
      const nextLabel = isDark ? "Tryb jasny" : "Tryb ciemny";

      if (icon) icon.textContent = isDark ? "☀️" : "🌙";
      if (label) label.textContent = nextLabel;
      themeToggle.setAttribute("aria-label", isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny");
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.title = isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny";
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", "#050505");
    }

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
      } catch {
        // Motyw działa również bez pamięci lokalnej.
      }
    }
  }

  function collectPriceSearchVocabulary(value, output, depth = 0) {
    if (value == null || depth > 8) return;
    if (typeof value === "string") {
      const phrase = value.trim();
      if (phrase.length >= 3 && phrase.length <= 140) output.push(phrase);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(item => collectPriceSearchVocabulary(item, output, depth + 1));
      return;
    }
    if (typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      const cleanKey = String(key).trim();
      if (cleanKey && !/^[-+]?\d+(?:[.,]\d+)?$/.test(cleanKey) && cleanKey.length <= 100) {
        output.push(cleanKey);
      }
      collectPriceSearchVocabulary(child, output, depth + 1);
    }
  }

  function mergeSearchTermSets(baseTerms, extraTerms) {
    const result = {};
    const categories = new Set([...Object.keys(baseTerms || {}), ...Object.keys(extraTerms || {})]);
    categories.forEach(category => {
      const unique = new Map();
      [...(baseTerms?.[category] || []), ...(extraTerms?.[category] || [])].forEach(item => {
        const phrase = String(item || "").trim();
        const normalized = normalizeSearchText(phrase);
        if (phrase && normalized && !unique.has(normalized)) unique.set(normalized, phrase);
      });
      result[category] = Array.from(unique.values());
    });
    return result;
  }

  function enrichSearchTermsFromPrices(searchTerms, prices) {
    const dynamic = {};
    for (const [pageName, roots] of Object.entries(PRICE_SEARCH_VOCABULARY_ROOTS)) {
      const vocabulary = [];
      roots.forEach(rootKey => collectPriceSearchVocabulary(prices?.[rootKey], vocabulary));
      dynamic[pageName] = vocabulary;
    }
    return mergeSearchTermSets(searchTerms, dynamic);
  }

  function smartQueryHas(query, variants) {
    const normalized = normalizeSearchText(query);
    const tokens = normalized.split(/\s+/).filter(Boolean);
    return variants.some(variant => {
      const wanted = normalizeSearchText(variant);
      if (!wanted) return false;
      if (normalized.includes(wanted)) return true;
      if (wanted.includes(" ")) {
        const wantedTokens = wanted.split(/\s+/).filter(Boolean);
        return wantedTokens.every(wantedToken => tokens.some(token => {
          if (token === wantedToken) return true;
          const allowed = wantedToken.length >= 6 ? 2 : wantedToken.length >= 4 ? 1 : 0;
          return allowed > 0 && levenshteinDistance(token, wantedToken) <= allowed;
        }));
      }
      return tokens.some(token => {
        if (token === wanted || token.startsWith(wanted) || wanted.startsWith(token)) return true;
        const allowed = wanted.length >= 6 ? 2 : wanted.length >= 4 ? 1 : 0;
        return allowed > 0 && levenshteinDistance(token, wanted) <= allowed;
      });
    });
  }

  boot();

  async function boot() {
    try {
      const [priceResponse, searchResponse, caseResponse] = await Promise.all([
        fetch("data/prices.json", { cache: "no-store" }),
        fetch("data/search-terms.json", { cache: "no-store" }).catch(() => null),
        fetch("data/case-items.json", { cache: "no-store" }).catch(() => null)
      ]);

      if (!priceResponse.ok) throw new Error(`Błąd pobierania cennika: HTTP ${priceResponse.status}`);
      state.basePrices = await priceResponse.json();
      const savedPrices = loadSavedPrices();
      state.prices = migratePrices(savedPrices ? mergeDeep(deepClone(state.basePrices), savedPrices) : deepClone(state.basePrices));

      let repositorySearchTerms = deepClone(DEFAULT_PRODUCT_SEARCH_TERMS);
      if (searchResponse && searchResponse.ok) {
        const loadedTerms = await searchResponse.json();
        repositorySearchTerms = sanitizeSearchTerms(loadedTerms, DEFAULT_PRODUCT_SEARCH_TERMS);
      }
      state.baseSearchTerms = enrichSearchTermsFromPrices(repositorySearchTerms, state.prices);
      state.searchTerms = loadSavedSearchTerms() || deepClone(state.baseSearchTerms);

      if (caseResponse && caseResponse.ok) {
        try {
          state.caseConfig = sanitizeCaseConfig(await caseResponse.json());
        } catch (error) {
          console.warn("Nie udało się wczytać data/case-items.json. Używam konfiguracji domyślnej.", error);
        }
      }

      const sharedQuoteLoaded = await loadSharedQuoteFromUrl();
      renderNavigation();
      renderCurrentPage();
      renderCart();
      analyticsStartSession();
      if (sharedQuoteLoaded) showToast("Wczytano zapisaną zamówienie");
    } catch (error) {
      content.innerHTML = `${header("Błąd uruchomienia", "Nie udało się wczytać plików projektu.")}${alertBox(error.message + " Uruchom projekt przez GitHub Pages albo lokalny serwer HTTP, nie przez dwuklik index.html.", "error")}`;
    }
  }

  function migratePrices(pricesToMigrate) {
    if (!pricesToMigrate || typeof pricesToMigrate !== "object") return pricesToMigrate;

    if (pricesToMigrate.notesy_i_bloczki && typeof pricesToMigrate.notesy_i_bloczki === "object") {
      delete pricesToMigrate.notesy_i_bloczki.Biuwary;
    }

    const banners = pricesToMigrate.banery;
    if (banners && banners["Frontlit 510g"]) {
      const legacyBanner = banners["Frontlit 510g"];
      banners["Baner powlekany 510g"] = mergeDeep(
        banners["Baner powlekany 510g"] || {},
        legacyBanner
      );
      delete banners["Frontlit 510g"];
    }

    const rollups = pricesToMigrate.rollup;
    if (rollups) {
      if (rollups["Standard"]) {
        rollups["Roll-up Standard"] = mergeDeep(rollups["Roll-up Standard"] || {}, rollups["Standard"]);
        delete rollups["Standard"];
      }
      if (rollups["Standard Black"]) {
        rollups["Roll-up Standard Black"] = mergeDeep(rollups["Roll-up Standard Black"] || {}, rollups["Standard Black"]);
        delete rollups["Standard Black"];
      }
      if (rollups["Exclusive („łezka”)"]) {
        rollups["Roll-up Exclusive („łezka”)"] = mergeDeep(rollups["Roll-up Exclusive („łezka”)"] || {}, rollups["Exclusive („łezka”)"]);
        delete rollups["Exclusive („łezka”)"];
      }
    }

    const posters = pricesToMigrate.plakaty;
    if (posters) {
      if (posters["Cyfrowy"]) {
        posters["Cyfrowy 24h"] = mergeDeep(
          posters["Cyfrowy 24h"] || {},
          posters["Cyfrowy"]
        );
      }
      delete posters["Cyfrowy"];
      delete posters["Wielkoformatowy"];

      const largeFormat = posters["Wielkoformatowy 24h"];
      if (largeFormat) {
        const updatedPosterTiers = {
          A2: [30, 25, 20, 18],
          A1: [55, 50, 45, 40],
          A0: [100, 90, 80, 70],
          B2: [35, 30, 25, 22],
          B1: [65, 55, 50, 45],
          B0: [110, 100, 90, 80]
        };
        Object.entries(updatedPosterTiers).forEach(([formatName, prices]) => {
          const formatData = largeFormat[formatName];
          if (!formatData) return;
          const current = formatData.progi_ilosciowe || [];
          const isLegacyUniformPrice = current.length === 4 && current.every((tier, index) => {
            const expectedMin = [1, 2, 5, 11][index];
            const expectedPrice = [65, 55, 50, 45][index];
            return Number(tier.min_szt) === expectedMin && Number(tier.cena_sztuki) === expectedPrice;
          });
          if (isLegacyUniformPrice || formatName === "B1") {
            formatData.progi_ilosciowe = [1, 2, 5, 10].map((min_szt, index) => ({
              min_szt,
              cena_sztuki: prices[index]
            }));
          }
          if (formatName === "A2") {
            // Translate pre-0.23.13 local overrides only; retain intentional custom prices.
            (formatData.progi_ilosciowe || []).forEach(tier => {
              if (Number(tier.min_szt) === 5 && Number(tier.cena_sztuki) === 20) tier.cena_sztuki = 22;
              if (Number(tier.min_szt) === 11 && Number(tier.cena_sztuki) === 18) tier.cena_sztuki = 20;
            });
          }
          // Applies the 10-item threshold even to customers' saved, older price overrides.
          (formatData.progi_ilosciowe || []).forEach(tier => {
            if (Number(tier.min_szt) === 11) tier.min_szt = 10;
          });
        });
      }
    }

    // Migrate only historic default prices from a previously saved local catalog.
    // Do not touch custom merchant amounts.
    const legacyPosterDigital = {
      A4: { "10": [45, 35], "20": [65, 70], "50": [165, 150] },
      A3: { "10": [65, 70], "20": [110, 120], "50": [255, 300] }
    };
    const digitalPosters = pricesToMigrate.plakaty?.["Cyfrowy 24h"];
    if (digitalPosters) {
      for (const [formatName, quantities] of Object.entries(legacyPosterDigital)) {
        const formatPrices = digitalPosters[formatName];
        if (!formatPrices) continue;
        for (const [qty, [oldPrice, newPrice]] of Object.entries(quantities)) {
          if (formatPrices[qty] === oldPrice) formatPrices[qty] = newPrice;
        }
        if (formatPrices["5"] == null) formatPrices["5"] = formatName === "A4" ? 17.5 : 35;
      }
    }
    const flyersToMigrate = pricesToMigrate.ulotki;
    if (flyersToMigrate) {
      for (const [typeName, qty, amounts] of [
        ["Cyfrowy", "1000", { A6:495, A5:890, DL:690 }],
        ["Offsetowy", "5000", { A7:270, A6:370, A5:630, DL:470 }]
      ]) {
        const formats = flyersToMigrate[typeName]?.Standard;
        if (!formats) continue;
        for (const [formatName, amount] of Object.entries(amounts)) {
          if (formats[formatName]?.[qty] == null) formats[formatName][qty] = amount;
        }
      }
    }
    const capModels = pricesToMigrate.odziez_z_nadrukiem?.produkty?.Czapki;
    if (capModels?.["Czapka z daszkiem"]) {
      const legacyCap = capModels["Czapka z daszkiem"];
      if (!capModels["Czapka bejsbolówka"]) capModels["Czapka bejsbolówka"] = { ...legacyCap, opis: "Czapka z daszkiem w fasonie bejsbolówka" };
      if (!capModels["Czapka raperka"]) capModels["Czapka raperka"] = { ...legacyCap, opis: "Czapka z daszkiem w fasonie raperka" };
      delete capModels["Czapka z daszkiem"];
    }

    const paperPrices = pricesToMigrate.druk_cyfrowy_i_ksero?.doplaty_do_papieru;
    if (paperPrices) {
      const paperPriceUpdates = {
        "Papier kredowy 130 g": [0.5, 0.3],
        "Papier kredowy 170 g": [1.0, 0.5],
        "Papier kredowy 250 g": [1.5, 0.75],
        "Papier kredowy 300 g": [2.0, 1.0],
        "Papier kredowy 350 g": [2.5, 1.5]
      };
      Object.entries(paperPriceUpdates).forEach(([paperName, [oldPrice, newPrice]]) => {
        if (Number(paperPrices[paperName]) === oldPrice) paperPrices[paperName] = newPrice;
      });
    }

    const standardStickers = pricesToMigrate.naklejki?.powierzchniowe?.["Naklejki, etykiety"];
    if (standardStickers && Number(standardStickers.minimum_m2) === 1) {
      standardStickers.minimum_m2 = 0.7;
    }

    const apparelProducts = pricesToMigrate.odziez_z_nadrukiem?.produkty;
    if (apparelProducts) {
      const apparelModelUpdates = {
        "Koszulki bawełniane": {
          "Basic": ["Basic 160 g", "100% bawełna 160 g, bez szwów bocznych, wykończenie silikonowe, krój męski, damski i dziecięcy.", "https://shop.malfini.com/pl/pl/product/basic-129?color=01"],
          "Classic New": ["Classic New 145 g", "100% bawełna 145 g, dopasowany krój ze szwami bocznymi, wykończenie silikonowe, krój męski, damski i dziecięcy.", "https://shop.malfini.com/pl/pl/product/classic-new-133?color=01"],
          "Heavy New": ["Heavy New 200 g", "100% bawełna 200 g, bez szwów bocznych, wykończenie silikonowe, krój unisex oversize.", "https://shop.malfini.com/pl/pl/product/heavy-new-137?color=01"],
          "Slim Fit V-neck": ["Slim Fit V-neck 180 g", "100% bawełna 180 g, ze szwami bocznymi, wykończenie silikonowe, krój slim-fit z dekoltem w serek, damski i męski.", "https://shop.malfini.com/pl/pl/product/slim-fit-v-neck-146?color=01"]
        },
        "Koszulki poliestrowe": {
          "Fantasy": ["Fantasy 150 g", "100% poliester 150 g, ze szwami bocznymi, szybkoschnący materiał, krój męski, damski i dziecięcy.", "https://shop.malfini.com/pl/pl/product/fantasy-124?color=01"],
          "Chance": ["Chance 140 g", "100% mikropoliester 140 g, ze szwami bocznymi, szybkoschnący materiał, krój męski i damski.", "https://shop.malfini.com/pl/pl/product/chance-grs-810?color=01"],
          "Pixel": ["Pixel 130 g", "100% poliester 130 g, ze szwami bocznymi, gładki i szybkoschnący materiał, luźniejszy krój unisex.", "https://shop.malfini.com/pl/pl/product/pixel-p81?color=01"]
        },
        "Koszulki polo": {
          "Pique Polo": ["Pique Polo 200 g", "65% bawełna, 35% poliester, 200 g, z bocznymi szwami, wykończenie silikonowe, krój męski, damski i dziecięcy.", "https://shop.malfini.com/pl/pl/product/pique-polo-203?color=01"],
          "Cotton": ["Cotton 170 g", "100% bawełna, 170 g, rozporki na końcach bocznych szwów, krój męski i damski.", "https://shop.malfini.com/pl/pl/product/cotton-212?color=01"],
          "Single Jersey": ["Single Jersey 180 g", "100% bawełna, 180 g, krój z bocznymi szwami, krój męski i damski.", "https://shop.malfini.com/pl/pl/product/single-j-202?color=01"]
        }
      };
      Object.entries(apparelModelUpdates).forEach(([categoryName, models]) => {
        const categoryData = apparelProducts[categoryName];
        if (!categoryData) return;
        Object.entries(models).forEach(([oldName, [newName, description, specificationUrl]]) => {
          if (categoryData[oldName] && oldName !== newName) {
            categoryData[newName] = mergeDeep(categoryData[newName] || {}, categoryData[oldName]);
            delete categoryData[oldName];
          }
          if (categoryData[newName]) {
            categoryData[newName].opis = description;
            categoryData[newName].url_specyfikacji = specificationUrl;
          }
        });
      });
      const largestPrintUpdates = [
        ["Koszulki bawełniane", "Basic 160 g", 85, 75],
        ["Koszulki bawełniane", "Classic New 145 g", 80, 70],
        ["Koszulki bawełniane", "Heavy New 200 g", 90, 80],
        ["Koszulki bawełniane", "Slim Fit V-neck 180 g", 90, 80],
        ["Koszulki poliestrowe", "Fantasy 150 g", 90, 80],
        ["Koszulki poliestrowe", "Chance 140 g", 100, 90],
        ["Koszulki poliestrowe", "Pixel 130 g", 90, 80],
        ["Koszulki polo", "Pique Polo 200 g", 100, 90],
        ["Koszulki polo", "Cotton 170 g", 100, 90],
        ["Koszulki polo", "Single Jersey 180 g", 100, 90]
      ];
      largestPrintUpdates.forEach(([category, product, oldPrice, newPrice]) => {
        const prices = apparelProducts[category]?.[product]?.ceny;
        if (prices && Number(prices["Do 35x40 cm"]) === oldPrice) prices["Do 35x40 cm"] = newPrice;
      });

      const apparelSizePresets = {
        "Koszulki bawełniane": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Dziecięcy — podaj w uwagach", "Inny — podaj w uwagach", "Różne rozmiary — podaj w uwagach"],
        "Koszulki poliestrowe": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Dziecięcy — podaj w uwagach", "Inny — podaj w uwagach", "Różne rozmiary — podaj w uwagach"],
        "Koszulki polo": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Dziecięcy — podaj w uwagach", "Inny — podaj w uwagach", "Różne rozmiary — podaj w uwagach"],
        "Bluzy": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Dziecięcy — podaj w uwagach", "Inny — podaj w uwagach", "Różne rozmiary — podaj w uwagach"],
        "Kamizelki odblaskowe": ["S", "M", "L", "XL", "2XL", "3XL", "Inny — podaj w uwagach", "Różne rozmiary — podaj w uwagach"],
        "Czapki": ["Uniwersalny"],
        "Torby bawełniane": ["Uniwersalny"],
        "Worki bawełniane": ["Uniwersalny"],
        "Sam nadruk": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Dziecięcy — podaj w uwagach", "Inny — podaj w uwagach", "Różne rozmiary — podaj w uwagach"]
      };
      Object.entries(apparelProducts).forEach(([categoryName, categoryProducts]) => {
        const defaultSizes = apparelSizePresets[categoryName] || ["Uniwersalny"];
        Object.values(categoryProducts || {}).forEach(productData => {
          if (!Array.isArray(productData.rozmiary) || !productData.rozmiary.length) productData.rozmiary = [...defaultSizes];
        });
      });
    }

    const pvcProducts = pricesToMigrate.pvc;
    if (pvcProducts) {
      const pvcBoard = pvcProducts["Folia z nadrukiem + PCV"];
      if (pvcBoard && typeof pvcBoard.doliczaj_ciecie_reczne !== "boolean") pvcBoard.doliczaj_ciecie_reczne = true;

      const foamBoard = pvcProducts["Plansza pianka 5 mm"];
      if (foamBoard && typeof foamBoard.doliczaj_ciecie_reczne !== "boolean") foamBoard.doliczaj_ciecie_reczne = false;
    }

    return pricesToMigrate;
  }

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function loadSavedRoulette() {
    const saved = loadJson(ROULETTE_STORAGE_KEY, null);
    return saved && typeof saved === "object" ? saved : null;
  }
  function loadSavedPrices() {
    const keys = [PRICE_OVERRIDE_KEY, ...LEGACY_PRICE_OVERRIDE_KEYS];

    for (const key of keys) {
      const saved = loadJson(key, null);

      if (isValidPriceFile(saved)) {
        if (key !== PRICE_OVERRIDE_KEY) {
          try {
            localStorage.setItem(PRICE_OVERRIDE_KEY, JSON.stringify(saved));
          } catch {
            // Zapis lokalny jest opcjonalny.
          }
        }
        return saved;
      }

      if (saved) {
        try { localStorage.removeItem(key); } catch {}
      }
    }

    return null;
  }
  function loadSavedSearchTerms() {
    const keys = [SEARCH_TERMS_OVERRIDE_KEY, ...LEGACY_SEARCH_TERMS_OVERRIDE_KEYS];

    for (const key of keys) {
      const saved = loadJson(key, null);
      if (isValidSearchTermsFile(saved)) {
        const sanitized = sanitizeSearchTerms(saved, state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
        if (key !== SEARCH_TERMS_OVERRIDE_KEY) {
          try { localStorage.setItem(SEARCH_TERMS_OVERRIDE_KEY, JSON.stringify(sanitized)); } catch {}
        }
        return sanitized;
      }
      if (saved) {
        try { localStorage.removeItem(key); } catch {}
      }
    }
    return null;
  }

  function isValidSearchTermsFile(valueToCheck) {
    return Boolean(
      valueToCheck &&
      typeof valueToCheck === "object" &&
      !Array.isArray(valueToCheck) &&
      Object.values(valueToCheck).every(items => Array.isArray(items) && items.every(item => typeof item === "string"))
    );
  }

  function sanitizeSearchTerms(source, fallback) {
    const result = {};
    const categories = Object.keys(fallback || DEFAULT_PRODUCT_SEARCH_TERMS);
    categories.forEach(category => {
      const categoryAliases = { "Folie i banery 24h": ["Folie i banery"], "Plakaty 24h": ["Plakaty"], "Wizytówki 24h": ["Wizytówki"], "Ulotki 24h": ["Ulotki"], "Druk cyfrowy i ksero 24h": ["Druk cyfrowy 24h", "Druk cyfrowy i ksero"], "Naklejki, etykiety i magnesy": ["Naklejki", "Naklejki i etykiety"], "Roll-upy i X-banery": ["Roll-up", "Roll-up i X-baner", "Roll-up i X-bannery"] };
      const alias = (categoryAliases[category] || []).find(name => Array.isArray(source && source[name]));
      const sourceItems = Array.isArray(source && source[category])
        ? source[category]
        : alias
          ? source[alias]
          : [];
      const unique = new Map();
      [...(fallback[category] || []), ...sourceItems].forEach(item => {
        const phrase = String(item || "").trim();
        const normalized = normalizeSearchText(phrase);
        if (phrase && normalized && !unique.has(normalized)) unique.set(normalized, phrase);
      });
      result[category] = Array.from(unique.values());
    });
    return result;
  }

  function loadSessionFlag(key) {
    try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
  }
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function mergeDeep(base, override) {
    if (Array.isArray(override)) return deepClone(override);
    if (!override || typeof override !== "object") return override;
    const result = base && typeof base === "object" && !Array.isArray(base) ? base : {};
    for (const [key, value] of Object.entries(override)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = mergeDeep(result[key], value);
      } else {
        result[key] = deepClone(value);
      }
    }
    return result;
  }
  function isValidPriceFile(value) {
    return Boolean(value && typeof value === "object" && value.banery && value.naklejki && value.druk_cyfrowy_i_ksero && value.notesy_i_bloczki);
  }
  function saveState() {
    try {
      localStorage.setItem("drukulator_cart", JSON.stringify(state.cart));
      localStorage.setItem("drukulator_order", JSON.stringify(state.order));
    } catch {
      // Kalkulator działa również wtedy, gdy przeglądarka blokuje pamięć lokalną.
    }
  }
  function money(value) {
    return Number(value).toLocaleString(window.DrukulatorI18n?.getLocale?.() || "pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function num(value, digits = 2) {
    return Number(value).toLocaleString(window.DrukulatorI18n?.getLocale?.() || "pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[ch]);
  }
  function options(values, selected) {
    return Array.from(values).map(v => `<option value="${esc(v)}"${String(v) === String(selected) ? " selected" : ""}>${esc(v)}</option>`).join("");
  }
  function header(title, subtitle = "Wybierz parametry — cenę zobaczysz od razu.") {
    const shownTitle = displayProductName(title);
    const breadcrumb = title === "Kalkulator druku – cennik druku online" || title === "Start"
      ? ""
      : `<nav class="breadcrumb" aria-label="Okruszki"><button type="button" data-breadcrumb-home>Start</button><span aria-hidden="true">/</span><strong>${esc(shownTitle)}</strong></nav>`;
    return `<header class="page-header">${breadcrumb}<div class="page-header__eyebrow">Cennik online Druk24</div><h2>${esc(shownTitle)}</h2><p>${esc(subtitle)}</p></header>`;
  }
  function alertBox(text, type = "info") { return `<div class="alert ${type}">${esc(text)}</div>`; }
  function value(id) { return document.getElementById(id).value; }
  function numberValue(id) { return Number(value(id)); }
  function showToast(message) {
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // Random per-tab token; server keeps only an HMAC hash for a limited retention period.
  let analyticsSessionToken = "";
  function analyticsSession() {
    if (analyticsSessionToken) return analyticsSessionToken;
    try {
      const key = "drukulator_analytics_token_0228";
      const stored = sessionStorage.getItem(key);
      if (stored && /^[a-f0-9]{32}$/.test(stored)) return (analyticsSessionToken = stored);
      if (!globalThis.crypto?.getRandomValues) return "";
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes, n => n.toString(16).padStart(2,"0")).join("");
      sessionStorage.setItem(key, token);
      return (analyticsSessionToken = token);
    } catch { return ""; }
  }
  function analyticsSource() {
    try {
      if (!document.referrer) return "direct";
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (!host || host === location.hostname.toLowerCase()) return "direct";
      if (/(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia)\./.test(host)) return "search";
      if (/(^|\.)(facebook|instagram|tiktok|linkedin|pinterest|x|twitter|youtube)\.com$/.test(host)) return "social";
      return "referral";
    } catch { return "direct"; }
  }
  function analyticsTrack(event, data = {}) {
    if (!event || ADMIN_PAGE_NAMES.has(state.page)) return;
    const payload = JSON.stringify({ event, data: { ...data, source: analyticsSource() }, session: analyticsSession() });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon("analytics-track.php", blob)) return;
      }
    } catch {}
    fetch("analytics-track.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true
    }).catch(() => {});
  }

  function analyticsStartSession() {
    let shouldCount = true;
    try {
      const key = "drukulator_analytics_session_0_13_0";
      if (sessionStorage.getItem(key) === "1") shouldCount = false;
      else sessionStorage.setItem(key, "1");
    } catch {}
    if (shouldCount) analyticsTrack("session_start");
    analyticsTrack("page_view", { page: state.page });
  }
  function setResultError(error) {
    if (quoteCapture) {
      quoteCapture.error = error.message || String(error);
      return;
    }
    document.getElementById("quoteArea").innerHTML = alertBox(error.message || String(error), "error");
  }

  // Produkty z drukiem cyfrowym i offsetowym nie mają „24h” w nazwie — termin zależy od wybranej
  // technologii i jest pokazywany jako opcja. Klucze stron w kodzie pozostają bez zmian.
  const NO_24H_BADGE = new Set(["Wizytówki 24h", "Ulotki 24h", "Plakaty 24h"]);
  function displayProductName(text) {
    return NO_24H_BADGE.has(text) ? String(text).replace(/\s*24h$/i, "") : String(text);
  }

  function format24hLabel(text, keepBadge = false) {
    // keepBadge: strona główna pokazuje pełne nazwy z plakietką 24h (jak w 0.23.27).
    return esc(keepBadge ? text : displayProductName(text)).replace(/(24h)/gi, '<span class="service-badge-24h">$1</span>');
  }

  function renderNavigation() {
    const matches = getProductSearchMatches(state.searchQuery);
    const matchedPages = new Set(matches.slice(0, 3).map(item => item.pageName));
    const hasSearch = normalizeSearchText(state.searchQuery).length > 0;
    const renderButton = name => {
      const classes = ["nav-button"];
      if (name === state.page) classes.push("active");
      if (hasSearch && matchedPages.has(name)) classes.push("search-match");
      if (hasSearch && !matchedPages.has(name)) classes.push("search-dim");
      return `<button class="${classes.join(" ")}" data-page="${esc(name)}">${format24hLabel(name)}</button>`;
    };

    const startButton = `<button class="nav-button nav-button--home${state.page === "Start" ? " active" : ""}" data-page="Start"><span aria-hidden="true">⌂</span> Start</button>`;
    const groups = NAV_GROUPS.map((group, index) => {
      const relevantPages = group.pages.filter(name => pages.some(([pageName]) => pageName === name));
      const containsActive = relevantPages.includes(state.page);
      const containsMatch = relevantPages.some(name => matchedPages.has(name));
      const open = index === 0 || containsActive || containsMatch;
      return `<details class="nav-group"${open ? " open" : ""}>
        <summary>${esc(group.label)}<span aria-hidden="true">⌄</span></summary>
        <div class="nav-group__items">${relevantPages.map(renderButton).join("")}</div>
      </details>`;
    }).join("");

    navigation.innerHTML = startButton + groups;
    renderProductSearchResults(matches);

    navigation.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => {
      navigateToPage(button.dataset.page);
    }));
  }

  function navigateToPage(pageName) {
    if (!pages.some(([name]) => name === pageName) || ADMIN_PAGE_NAMES.has(pageName)) return;
    state.page = pageName;
    state.searchQuery = "";
    if (productSearch) productSearch.value = "";
    analyticsTrack("page_view", { page: pageName });
    renderNavigation();
    renderCurrentPage();
    sidebar.classList.remove("open");
  }

  function renderCurrentPage() {
    const isHome = state.page === "Start";
    document.body.classList.toggle("is-home-page", isHome);
    const found = pages.find(([name]) => name === state.page);
    (found ? found[1] : renderHome)();
    setupQuickAddForCurrentPage();
    if (state.smartQuotePreset && state.smartQuotePreset.pageName === state.page) {
      const preset = state.smartQuotePreset;
      state.smartQuotePreset = null;
      applySmartQuotePreset(preset);
    }
    content.querySelectorAll("[data-breadcrumb-home]").forEach(button => button.addEventListener("click", () => navigateToPage("Start")));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let livePriceTimer = null;
  let currentPriceRequest = 0;
  const PRINT_CHOICES = [
    { key: "digital", name: "Szybko · druk cyfrowy", detail: "Orientacyjnie 24–48 h", test: /cyfrow/i },
    { key: "offset", name: "Ekonomicznie · druk offsetowy", detail: "Orientacyjnie 3–5 dni roboczych", test: /offset|ofset/i },
    { key: "large", name: "Druk wielkoformatowy", badge24h: true, detail: "Formaty A2–B0 · już od 1 szt.", test: /wielkoformat/i }
  ];

  function setSelectedPrintChoice(select, key) {
    const choice = PRINT_CHOICES.find(item => item.key === key);
    const option = choice && Array.from(select.options).find(item => choice.test.test(item.value || item.textContent));
    if (!option || select.value === option.value) return;
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setupPrintChoices() {
    const select = ["bcPrint", "flyPrint", "posterPrint"].map(id => document.getElementById(id)).find(Boolean);
    if (!select) return;
    const available = PRINT_CHOICES.filter(choice =>
      Array.from(select.options).some(option => choice.test.test(option.value || option.textContent)));
    if (!available.some(item => item.key === "digital") || !available.some(item => item.key === "offset")) return;
    const host = select.closest(".card");
    const form = host?.querySelector(".form-grid");
    if (!form) return;
    const field = document.createElement("section");
    field.className = "d24-technology-select";
    if (select.id === "posterPrint") {
      field.classList.add("d24-technology-select--posters");
      // The editable native control remains in the form as the authoritative value.
      // Only the extra visual duplicate is hidden in favour of the three technology buttons.
      select.closest(".field")?.classList.add("d24-poster-original-print");
    }
    field.innerHTML = `<div class="d24-technology-select__head"><strong>Szybko czy ekonomicznie?</strong><small>Wybierz sposób druku. Terminy są orientacyjne.</small></div>
      <div class="d24-technology-select__buttons">${available.map(o=>`<button type="button" data-print-mode="${o.key}" aria-pressed="false"><strong>${o.name}${o.badge24h ? ' <span class="service-badge-24h">24h</span>' : ""}</strong><small>${o.detail}</small></button>`).join("")}</div>`;
    host.insertBefore(field, form);
    // Ten sam wybór był pokazywany drugi raz jako „Rodzaj druku”. Natywny select zostaje w DOM
    // (kalkulator i asystent nadal z niego korzystają), ale klient widzi tylko jedną decyzję.
    const duplicatedField = select.closest(".field");
    const onlyTwoModes = Array.from(select.options).filter(o => o.value)
      .every(o => /cyfrow|offset|ofset|wielkoformat/i.test(o.value || o.textContent));
    if (duplicatedField && onlyTwoModes) duplicatedField.classList.add("d24-field-merged");
    const sync = () => field.querySelectorAll("[data-print-mode]").forEach(button => {
      const choice = available.find(item => item.key === button.dataset.printMode);
      button.setAttribute("aria-pressed", String(!!choice && choice.test.test(select.value)));
    });
    field.querySelectorAll("[data-print-mode]").forEach(button => button.addEventListener("click", () => {
      setSelectedPrintChoice(select, button.dataset.printMode);
      sync();
    }));
    select.addEventListener("change", sync);
    sync();
  }

  function captureCurrentFormQuote(button) {
    if (!button || !button.isConnected || quoteCapture) return null;
    const capture = { quote: null };
    quoteCapture = capture;
    try { button.click(); } catch { /* Original calculator owns validation. */ }
    finally { quoteCapture = null; }
    return capture.quote && Number.isFinite(Number(capture.quote.price)) ? capture.quote : null;
  }

  function refreshQuickAddPrice(button) {
    if (!button?.isConnected || !button.closest(".content")) return;
    const token = ++currentPriceRequest;
    const draft = captureCurrentFormQuote(button);
    if (!button.isConnected || token !== currentPriceRequest) return;
    button.dataset.livePrice = draft ? String(draft.price) : "";
    button.textContent = draft?.meta?.requiresManualPrice ? "Dodaj do koszyka · cena do ustalenia" : draft ? `Dodaj do koszyka · ${money(draft.price)} zł` : "Dodaj do koszyka · sprawdź parametry";
    const headline = document.getElementById("d24LivePriceValue");
    if (headline) headline.textContent = draft?.meta?.requiresManualPrice ? "Cena do potwierdzenia mailowo" : draft ? `${money(draft.price)} zł` : "Uzupełnij parametry";
    updatePriceBar(draft);
  }

  // Cena za sztukę liczona z tej samej ceny łącznej i ilości z formularza (bez własnego cennika).
  function currentUnitPriceInfo(totalPrice) {
    const form = content.querySelector(":scope > .card .form-grid");
    if (!form || !Number.isFinite(Number(totalPrice))) return null;
    const control = Array.from(form.querySelectorAll("select[id], input[id]")).find(el =>
      /(Quantity|Qty)$/.test(el.id) && !el.disabled && el.type !== "file" && !el.closest(".hidden, [hidden]"));
    if (!control) return null;
    const quantity = Number(String(control.value).replace(",", "."));
    if (!Number.isInteger(quantity) || quantity < 2) return null;
    const label = control.closest(".field")?.querySelector(":scope > label")?.textContent || "";
    const unit = /kopii/i.test(label) ? "za kopię" : /stron/i.test(label) ? "za stronę"
      : /ilość|nakład|bloczków|notesów/i.test(label) ? "za sztukę" : "";
    if (!unit) return null;
    return { quantity, perUnit: Number(totalPrice) / quantity, unit };
  }

  // Jedno miejsce odświeżające wszystkie widoki aktualnej ceny: blok przy formularzu
  // oraz przyklejony pasek na telefonie. Nie liczy niczego poza dzieleniem przez ilość.
  function updatePriceBar(draft) {
    const unit = draft ? currentUnitPriceInfo(draft.price) : null;
    const unitText = unit ? `${money(unit.perUnit)} zł ${unit.unit}` : "";
    const glanceUnit = document.getElementById("d24LiveUnitPrice");
    if (glanceUnit) glanceUnit.textContent = draft && !draft.meta?.requiresManualPrice ? ["w tym VAT", unitText].filter(Boolean).join(" • ") : "";
    if (!mobilePriceBar) return;
    const manual = Boolean(draft?.meta?.requiresManualPrice);
    if (mobilePriceValue) mobilePriceValue.textContent = draft && !manual ? `${money(draft.price)} zł` : "—";
    if (mobilePriceHint) mobilePriceHint.textContent = manual
      ? "Cenę potwierdzimy mailowo"
      : draft
        ? ["brutto", unitText].filter(Boolean).join(" • ")
        : "Uzupełnij parametry";
    if (mobileAddButton) mobileAddButton.disabled = !draft;
  }

  function setPriceBarActive(active) {
    priceBarActive = Boolean(active);
    if (mobilePriceBar) mobilePriceBar.hidden = !priceBarActive;
    if (!priceBarActive) updatePriceBar(null);
    updateMobileCartBar();
  }

  function setupQuickAddForCurrentPage() {
    clearTimeout(livePriceTimer);
    ++currentPriceRequest;
    setupPrintChoices();
    const button = content.querySelector("#calculate, #calculateCanvas");
    const card = button?.closest(".card");
    if (!button || !card) { setPriceBarActive(false); return; }
    const action = button.closest(".actions");
    if (action && !card.querySelector(".d24-price-at-a-glance")) {
      action.insertAdjacentHTML("beforebegin", `<div class="d24-price-at-a-glance"><div><small>Cena brutto</small><strong id="d24LivePriceValue">Sprawdzanie…</strong><span class="d24-price-unit" id="d24LiveUnitPrice"></span></div><small class="d24-price-note">Cenę i termin potwierdzi drukarnia przed realizacją.</small></div>`);
    }
    setPriceBarActive(true);
    livePriceTimer = setTimeout(() => refreshQuickAddPrice(button), 180);
  }

  content.addEventListener("input", event => {
    if (!event.target.closest(".card") || event.target.matches('input[type="file"]')) return;
    clearTimeout(livePriceTimer);
    const button = content.querySelector("#calculate, #calculateCanvas");
    if (button) livePriceTimer = setTimeout(() => refreshQuickAddPrice(button), 250);
  });
  content.addEventListener("change", event => {
    if (!event.target.closest(".card") || event.target.matches('input[type="file"]')) return;
    clearTimeout(livePriceTimer);
    const button = content.querySelector("#calculate, #calculateCanvas");
    if (button) livePriceTimer = setTimeout(() => refreshQuickAddPrice(button), 150);
  });
  // Trusted user interaction means add; .click() from the existing comparison,
  // preset and suggestion engines continues to mean calculate-only.
  // Popular shortcuts use the same direct navigation as the product tiles.
  // Avoid nested synthetic clicks on sidebar buttons from the refresh layer.
  content.addEventListener("click", event => {
    const shortcut = event.target.closest("button[data-shortcut]");
    if (!shortcut || !content.contains(shortcut)) return;
    event.preventDefault();
    event.stopPropagation();
    navigateToPage(shortcut.dataset.shortcut);
  }, true);
  document.getElementById("d24BrandHome")?.addEventListener("click", event => {
    event.preventDefault(); navigateToPage("Start");
  });
  // Dodanie aktualnej konfiguracji do koszyka — ta sama ścieżka dla przycisku w formularzu
  // i dla przyklejonego paska ceny na telefonie.
  function addCurrentConfigurationToCart() {
    const button = content.querySelector("#calculate, #calculateCanvas");
    if (!button) return false;
    clearTimeout(livePriceTimer);
    const draft = captureCurrentFormQuote(button);
    if (!draft) { button.click(); refreshQuickAddPrice(button); return false; }
    showQuote(draft);
    document.getElementById("addToCart")?.click();
    refreshQuickAddPrice(button);
    return true;
  }
  content.addEventListener("click", event => {
    const button = event.target.closest("#calculate, #calculateCanvas");
    if (!button || !event.isTrusted || !content.contains(button)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    addCurrentConfigurationToCart();
  }, true);
  mobileAddButton?.addEventListener("click", () => {
    if (!addCurrentConfigurationToCart()) {
      showToast("Uzupełnij parametry, aby dodać produkt.");
      document.getElementById("quoteArea")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  function showQuote(quote) {
    if (quoteCapture) {
      quoteCapture.quote = quote;
      return;
    }

    analyticsTrack("quote_view", { page: state.page });
    const details = (quote.details || []).map(([label, val]) => `<div class="detail-row"><span>${esc(label)}</span><strong>${esc(val)}</strong></div>`).join("");
    document.getElementById("quoteArea").innerHTML = `
      <details class="d24-detailed-quote"><summary>Wycena szczegółowa · rozwiń konfigurację</summary><section class="quote-card">
        <div class="quote-card__kicker">Twoje zamówienie</div>
        <h3>${esc(quote.title)}</h3>
        <div class="price-big"><span>${quote.meta?.requiresManualPrice ? "Cena" : "Cena brutto"}</span><strong>${quote.meta?.requiresManualPrice ? "Do ustalenia" : `${money(quote.price)} zł`}</strong></div>
        <p>${esc(quote.description)}</p>
        ${details ? `<div class="details">${details}</div>` : ""}
        <div class="actions"><button class="button full" id="addToCart">Dodaj do koszyka</button></div>
      </section></details>`;
    document.getElementById("addToCart").addEventListener("click", () => {
      const currentTotal = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
      const newTotal = currentTotal + Number(quote.price);
      if (newTotal > MAX_ORDER_TOTAL) {
        window.alert(`Maksymalna wartość zamówienia przez kalkulator to ${money(MAX_ORDER_TOTAL)} zł brutto. ${LIMIT_CONTACT_TEXT}`);
        return;
      }

      const quoteFiles = Array.isArray(quote.files) ? quote.files.filter(file => file instanceof File) : [];
      // Plik wybrany w „Pliku i podglądzie projektu” dołączamy do zamówienia bez ponownego wybierania.
      const artworkFile = window.Druk24PreviewArtwork?.getFile?.();
      if (artworkFile instanceof File && !quoteFiles.includes(artworkFile)) quoteFiles.push(artworkFile);
      if (quoteFiles.length) {
        const newFiles = quoteFiles.filter(file => !orderFiles.some(existing =>
          existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified
        ));
        try {
          validateOrderFiles([...orderFiles, ...newFiles]);
          orderFiles = [...orderFiles, ...newFiles];
        } catch (error) {
          window.alert(error.message || String(error));
          return;
        }
      }

      const { files, ...cartQuote } = quote;
      state.cart.push({ ...cartQuote, id: Date.now() + Math.random() });
      saveState();
      renderCart();
      analyticsTrack("add_to_cart", { product: quote.title, page: state.page, value: Number(quote.price) });
      showToast(quoteFiles.length ? "Dodano do koszyka wraz z plikiem" : "Dodano do koszyka");
    });

    if (!quoteSuggestionBusy) {
      renderBestValueSuggestion(quote);
    }
  }

  function getQuoteQuantityControl() {
    const quantityIds = {
      "Wizytówki 24h": ["bcQuantity"],
      "Ulotki 24h": ["flyQuantity"],
      "Plakaty 24h": ["posterQty"],
      "Druk cyfrowy i ksero 24h": ["digQty"],
      "Folie i banery 24h": ["bannerQty"],
      "Naklejki, etykiety i magnesy": ["stickQty", "stickTaxiQty"],
      "Roll-upy i X-banery": ["rollQty"],
      "PCV i pianki": ["pvcQty"],
      "Koszulki i odzież": ["appQty"],
      "Notesy i bloczki": ["noteQty"],
      "Koperty, teczki i papier firmowy": ["companyMaterialsQty"],
      "Kalendarze": ["calendarQty"],
      "Restauracje, hotele": ["hospitalityQty"],
      "Śluby, wesela i imprezy": ["weddingQty", "weddingQtyInput"],
      "Oprawa prac": ["bindCopies"],
      "Laminowanie": ["lamQty"],
      "Obrazy na płótnie": ["canvasQty"]
    };

    const ids = quantityIds[state.page] || [];
    for (const id of ids) {
      const control = document.getElementById(id);
      if (!control || control.disabled || control.classList.contains("hidden")) continue;
      if (control.type === "hidden") continue;
      return control;
    }
    return null;
  }

  function getQuoteCalculateButton() {
    return document.getElementById("calculate")
      || document.getElementById("calculateCanvas")
      || Array.from(content.querySelectorAll("button")).find(button => normalizeSearchText(button.textContent) === "oblicz cene")
      || null;
  }

  function niceQuantityCandidates(current, maximum = Infinity) {
    const values = new Set();
    const add = raw => {
      const candidate = Math.ceil(Number(raw));
      if (!Number.isFinite(candidate) || candidate <= current || candidate > maximum) return;
      values.add(candidate);
    };

    [1.25, 1.5, 2, 2.5, 3].forEach(multiplier => add(current * multiplier));
    if (current <= 2) add(current * 5);

    [
      2, 3, 5, 10, 20, 21, 25, 30, 50, 51, 75, 100, 101, 150, 200, 201,
      250, 300, 500, 501, 750, 1000, 1500, 2000, 2500, 3000, 5000
    ].forEach(add);

    const maxRatio = current <= 2 ? 5 : 3;
    return Array.from(values)
      .filter(candidate => candidate / current <= maxRatio + 0.0001)
      .sort((a, b) => a - b)
      .slice(0, 14);
  }

  function getQuantityCandidates(control, current) {
    if (control.tagName === "SELECT") {
      const maxRatio = current <= 2 ? 5 : 3;
      return Array.from(control.options)
        .map(option => Number(option.value))
        .filter(candidate => Number.isFinite(candidate) && candidate > current && candidate / current <= maxRatio + 0.0001)
        .sort((a, b) => a - b)
        .slice(0, 12);
    }

    const maximum = control.max !== "" && Number.isFinite(Number(control.max))
      ? Number(control.max)
      : Infinity;
    return niceQuantityCandidates(current, maximum);
  }

  function captureQuoteForQuantity(control, calculateButton, candidateQuantity) {
    const originalValue = control.value;
    const capture = { quote: null, error: "" };
    quoteCapture = capture;

    try {
      control.value = String(candidateQuantity);
      if (control.tagName === "SELECT" && String(control.value) !== String(candidateQuantity)) return null;
      calculateButton.click();
      return capture.quote;
    } catch {
      return null;
    } finally {
      control.value = originalValue;
      quoteCapture = null;
    }
  }

  function quantityUnitLabel() {
    if (state.page === "Oprawa prac") return "egz.";
    if (state.page === "Druk cyfrowy i ksero 24h") {
      const service = document.getElementById("digService")?.value || "";
      if (service === "Ksero książki" || service === "Skanowanie") return "str.";
      if (service === "Ksero i druk" || service === "Dla studentów 24h") return "kopii";
      if (service === "Druk cyfrowy 24h") return "ark.";
    }
    return "szt.";
  }

  function buildBestValueCandidate(baseQuote, currentQuantity, candidates, control, calculateButton) {
    const basePrice = Number(baseQuote.price);
    if (!Number.isFinite(basePrice) || basePrice <= 0 || !Number.isFinite(currentQuantity) || currentQuantity <= 0) return null;

    const currentUnitPrice = basePrice / currentQuantity;
    const evaluated = [];

    candidates.forEach(candidateQuantity => {
      const capturedQuote = captureQuoteForQuantity(control, calculateButton, candidateQuantity);
      const candidatePrice = Number(capturedQuote?.price);
      if (!capturedQuote || !Number.isFinite(candidatePrice) || candidatePrice <= 0 || candidatePrice > MAX_ORDER_TOTAL) return;

      const candidateUnitPrice = candidatePrice / candidateQuantity;
      const savingPercent = ((currentUnitPrice - candidateUnitPrice) / currentUnitPrice) * 100;
      if (!Number.isFinite(savingPercent) || savingPercent < 3) return;

      const extraPrice = candidatePrice - basePrice;
      const extraQuantity = candidateQuantity - currentQuantity;
      const quantityRatio = candidateQuantity / currentQuantity;
      const priceRatio = candidatePrice / basePrice;
      const efficiency = quantityRatio / Math.max(priceRatio, 0.01);
      const affordabilityPenalty = extraPrice > 0 ? Math.min(20, (extraPrice / Math.max(basePrice, 1)) * 8) : 0;
      const score = savingPercent + Math.min(30, (quantityRatio - 1) * 12) + Math.min(25, (efficiency - 1) * 18) - affordabilityPenalty;

      evaluated.push({
        quantity: candidateQuantity,
        quote: capturedQuote,
        price: candidatePrice,
        extraPrice,
        extraQuantity,
        savingPercent,
        unitPrice: candidateUnitPrice,
        score
      });
    });

    if (!evaluated.length) return null;
    evaluated.sort((a, b) => b.score - a.score || a.extraPrice - b.extraPrice || a.quantity - b.quantity);
    return evaluated[0];
  }

  function chooseVariantUpgrade(baseQuote, candidates) {
    const basePrice = Number(baseQuote.price);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return null;

    const allowedExtra = Math.max(40, basePrice * 0.45);
    const valid = candidates
      .filter(candidate => Number.isFinite(Number(candidate.price)) && Number(candidate.price) > basePrice)
      .map(candidate => ({ ...candidate, extraPrice: Number(candidate.price) - basePrice }))
      .filter(candidate => candidate.extraPrice <= allowedExtra)
      .sort((a, b) => a.extraPrice - b.extraPrice || Number(a.price) - Number(b.price));

    return valid[0] || null;
  }

  function buildVariantUpgradeSuggestion(baseQuote) {
    const candidates = [];

    try {
      if (state.page === "Wizytówki 24h") {
        const print = value("bcPrint");
        const finish = value("bcFinish");
        const sides = value("bcSides");
        const quantity = numberValue("bcQuantity");
        const finishControl = document.getElementById("bcFinish");
        const sidesControl = document.getElementById("bcSides");

        if (print === "Cyfrowy 24h") {
          Array.from(finishControl.options).forEach(option => {
            const nextFinish = option.value;
            if (nextFinish === finish || !normalizeSearchText(nextFinish).includes("folia")) return;
            const price = C.calculateBusinessCards(state.prices, print, nextFinish, quantity, sides);
            candidates.push({
              label: nextFinish,
              note: "wykończenie wizytówek",
              price,
              apply: () => {
                finishControl.value = nextFinish;
                finishControl.dispatchEvent(new Event("change", { bubbles: true }));
                const qtyControl = document.getElementById("bcQuantity");
                if (Array.from(qtyControl.options).some(item => Number(item.value) === quantity)) qtyControl.value = String(quantity);
                document.getElementById("bcSides").value = sides;
                getQuoteCalculateButton()?.click();
              }
            });
          });

          if (sides === "Jednostronne" && Array.from(sidesControl.options).some(option => option.value === "Dwustronne")) {
            const price = C.calculateBusinessCards(state.prices, print, finish, quantity, "Dwustronne");
            candidates.push({
              label: "Druk dwustronny",
              note: "więcej miejsca na treść",
              price,
              apply: () => {
                sidesControl.value = "Dwustronne";
                getQuoteCalculateButton()?.click();
              }
            });
          }
        }
      }

      if (state.page === "Druk cyfrowy i ksero 24h" && value("digService") === "Druk cyfrowy 24h") {
        const paperControl = document.getElementById("digPaper");
        const color = value("digColor");
        const quantity = numberValue("digQty");
        const format = value("digFormat");
        const side = value("digSide");
        const currentIndex = paperControl.selectedIndex;

        Array.from(paperControl.options).slice(currentIndex + 1, currentIndex + 3).forEach(option => {
          const nextPaper = option.value;
          const price = C.calculateDigital(state.prices, "Druk cyfrowy", color, quantity, format, nextPaper, side).price;
          candidates.push({
            label: nextPaper,
            note: "grubszy / inny papier",
            price,
            apply: () => {
              paperControl.value = nextPaper;
              getQuoteCalculateButton()?.click();
            }
          });
        });
      }

      if (state.page === "Naklejki, etykiety i magnesy") {
        const productControl = document.getElementById("stickProduct");
        const currentProduct = productControl.value;
        if (currentProduct === "Naklejki, etykiety") {
          const quantity = numberValue("stickQty");
          const width = numberValue("stickWidth");
          const height = numberValue("stickHeight");
          const nextProduct = "Naklejki laminowane";
          if (Array.from(productControl.options).some(option => option.value === nextProduct)) {
            const result = C.calculateStickers(state.prices, nextProduct, quantity, width, height);
            candidates.push({
              label: "Naklejki laminowane",
              note: "większa odporność powierzchni",
              price: result.price,
              apply: () => {
                productControl.value = nextProduct;
                productControl.dispatchEvent(new Event("change", { bubbles: true }));
                getQuoteCalculateButton()?.click();
              }
            });
          }
        }
      }

      if (state.page === "Folie i banery 24h") {
        const materialControl = document.getElementById("bannerMaterial");
        const currentMaterial = materialControl.value;
        if (["Folia mat", "Folia błysk"].includes(currentMaterial)) {
          const nextMaterial = "Folia + laminat";
          if (Array.from(materialControl.options).some(option => option.value === nextMaterial)) {
            const result = C.calculateBanner(
              state.prices,
              numberValue("bannerWidth"),
              numberValue("bannerHeight"),
              numberValue("bannerQty"),
              nextMaterial
            );
            candidates.push({
              label: "Folia + laminat",
              note: "dodatkowe zabezpieczenie wydruku",
              price: result.price,
              apply: () => {
                materialControl.value = nextMaterial;
                materialControl.dispatchEvent(new Event("change", { bubbles: true }));
                getQuoteCalculateButton()?.click();
              }
            });
          }
        }
      }

      if (state.page === "Roll-upy i X-banery") {
        const productControl = document.getElementById("rollProduct");
        const sizeControl = document.getElementById("rollSize");
        const currentProduct = productControl.value;
        const currentSize = sizeControl.value;
        const quantity = numberValue("rollQty");

        Object.keys(state.prices.rollup || {}).forEach(nextProduct => {
          if (nextProduct === currentProduct || !state.prices.rollup[nextProduct]?.[currentSize]) return;
          const result = C.calculateRollup(state.prices, nextProduct, currentSize, quantity);
          candidates.push({
            label: nextProduct,
            note: "alternatywny system",
            price: result.price,
            apply: () => {
              productControl.value = nextProduct;
              productControl.dispatchEvent(new Event("change", { bubbles: true }));
              const refreshedSize = document.getElementById("rollSize");
              if (Array.from(refreshedSize.options).some(option => option.value === currentSize)) refreshedSize.value = currentSize;
              getQuoteCalculateButton()?.click();
            }
          });
        });
      }

      const catalogConfigs = {
        "Notesy i bloczki": {
          root: () => state.prices.notesy_i_bloczki,
          typeId: "noteType",
          variantId: "noteVariant",
          formatId: "noteFormat",
          qtyId: "noteQty",
          calculate: (root, type, variant, format, qty) => C.calculateNotepads(state.prices, type, variant, format, qty)
        },
        "Koperty, teczki i papier firmowy": {
          root: () => buildCompanyMaterialsCatalog(),
          typeId: "companyMaterialsType",
          variantId: "companyMaterialsVariant",
          formatId: "companyMaterialsFormat",
          qtyId: "companyMaterialsQty",
          calculate: (root, type, variant, format, qty) => C.calculateCatalogProduct(root, type, variant, format, qty)
        },
        "Kalendarze": {
          root: () => state.prices.kalendarze,
          typeId: "calendarType",
          variantId: "calendarVariant",
          formatId: "calendarFormat",
          qtyId: "calendarQty",
          calculate: (root, type, variant, format, qty) => C.calculateCatalogProduct(root, type, variant, format, qty)
        },
        "Restauracje, hotele": {
          root: () => buildHospitalityCatalog(),
          typeId: "hospitalityType",
          variantId: "hospitalityVariant",
          formatId: "hospitalityFormat",
          qtyId: "hospitalityQty",
          calculate: (root, type, variant, format, qty) => C.calculateCatalogProduct(root, type, variant, format, qty)
        }
      };

      const catalog = catalogConfigs[state.page];
      if (catalog) {
        const root = catalog.root();
        const type = value(catalog.typeId);
        const variant = value(catalog.variantId);
        const format = value(catalog.formatId);
        const quantity = numberValue(catalog.qtyId);
        const variants = root?.[type]?.warianty || {};

        Object.keys(variants).forEach(nextVariant => {
          if (nextVariant === variant) return;
          const priceMap = variants[nextVariant]?.formaty?.[format];
          if (!priceMap || priceMap[String(quantity)] == null) return;
          const result = catalog.calculate(root, type, nextVariant, format, quantity);
          candidates.push({
            label: nextVariant,
            note: "alternatywny wariant",
            price: result.price,
            apply: () => {
              const variantControl = document.getElementById(catalog.variantId);
              variantControl.value = nextVariant;
              variantControl.dispatchEvent(new Event("change", { bubbles: true }));
              const formatControl = document.getElementById(catalog.formatId);
              if (Array.from(formatControl.options).some(option => option.value === format)) {
                formatControl.value = format;
                formatControl.dispatchEvent(new Event("change", { bubbles: true }));
              }
              const qtyControl = document.getElementById(catalog.qtyId);
              if (Array.from(qtyControl.options).some(option => Number(option.value) === quantity)) qtyControl.value = String(quantity);
              getQuoteCalculateButton()?.click();
            }
          });
        });
      }

      if (state.page === "Śluby, wesela i imprezy") {
        const root = state.prices.sluby_wesela_imprezy;
        const product = value("weddingProduct");
        const variant = value("weddingVariant");
        const format = value("weddingFormat");
        const productData = root?.[product];
        const quantity = productData?.tryb === "pakiet" ? numberValue("weddingQty") : numberValue("weddingQtyInput");

        Object.keys(productData?.warianty || {}).forEach(nextVariant => {
          if (nextVariant === variant || !productData.warianty[nextVariant]?.[format]) return;
          const formatData = productData.warianty[nextVariant][format];
          if (productData.tryb === "pakiet" && formatData[String(quantity)] == null) return;
          const result = C.calculateWedding(state.prices, product, nextVariant, format, quantity);
          candidates.push({
            label: nextVariant,
            note: "alternatywny wariant",
            price: result.price,
            apply: () => {
              const variantControl = document.getElementById("weddingVariant");
              variantControl.value = nextVariant;
              variantControl.dispatchEvent(new Event("change", { bubbles: true }));
              const formatControl = document.getElementById("weddingFormat");
              if (Array.from(formatControl.options).some(option => option.value === format)) {
                formatControl.value = format;
                formatControl.dispatchEvent(new Event("change", { bubbles: true }));
              }
              const qtyControl = getQuoteQuantityControl();
              if (qtyControl?.tagName === "SELECT" && Array.from(qtyControl.options).some(option => Number(option.value) === quantity)) qtyControl.value = String(quantity);
              else if (qtyControl) qtyControl.value = String(quantity);
              getQuoteCalculateButton()?.click();
            }
          });
        });
      }
    } catch {
      return null;
    }

    return chooseVariantUpgrade(baseQuote, candidates);
  }

  function renderVariantUpgradeCard(container, upgrade) {
    if (!container || !upgrade) return;
    const card = document.createElement("div");
    card.className = "variant-upgrade-card";
    card.innerHTML = `
      <div class="variant-upgrade-card__head"><span>WARTO ROZWAŻYĆ</span><strong>${esc(upgrade.label)}</strong></div>
      <p>${esc(upgrade.note.charAt(0).toUpperCase() + upgrade.note.slice(1))}: <b>${money(upgrade.price)} zł</b> za całe zamówienie (obecnie ${money(Number(upgrade.price) - Number(upgrade.extraPrice))} zł).</p>
      <button class="button secondary full" type="button">Pokaż ten wariant — ${money(upgrade.price)} zł</button>`;
    card.querySelector("button").addEventListener("click", () => upgrade.apply());
    container.appendChild(card);
  }

  function renderBestValueSuggestion(baseQuote) {
    const quoteArea = document.getElementById("quoteArea");
    const quoteCard = quoteArea?.querySelector(".quote-card");
    if (!quoteCard) return;

    const control = getQuoteQuantityControl();
    const calculateButton = getQuoteCalculateButton();
    const currentQuantity = control ? Number(control.value) : 0;
    const candidates = control && Number.isFinite(currentQuantity) && currentQuantity > 0
      ? getQuantityCandidates(control, currentQuantity)
      : [];

    const variantUpgrade = buildVariantUpgradeSuggestion(baseQuote);
    let suggestion = null;

    if (control && calculateButton && candidates.length) {
      quoteSuggestionBusy = true;
      try {
        suggestion = buildBestValueCandidate(baseQuote, currentQuantity, candidates, control, calculateButton);
        control.value = String(currentQuantity);
        calculateButton.click();
      } finally {
        quoteSuggestionBusy = false;
      }
    }

    const refreshedCard = document.getElementById("quoteArea")?.querySelector(".quote-card");
    if (!refreshedCard || (!suggestion && !variantUpgrade)) return;

    const actions = refreshedCard.querySelector(".actions");

    if (suggestion) {
      const unit = quantityUnitLabel();
      // 0.24.8: faktyczne ceny zamiast „+N szt. za +X zł”.
      const extraText = `${suggestion.quantity} ${unit} za ${money(suggestion.price)} zł zamiast ${currentQuantity} ${unit} za ${money(baseQuote.price)} zł`;

      const card = document.createElement("div");
      card.className = "best-value-card";
      card.innerHTML = `
        <div class="best-value-card__head">
          <span class="best-value-card__badge">NAJKORZYSTNIEJ</span>
          <strong>Sprawdź większy nakład</strong>
        </div>
        <div class="best-value-card__price">
          <span>${suggestion.quantity} ${esc(unit)}</span>
          <strong>${money(suggestion.price)} zł</strong>
        </div>
        <p><b>${esc(extraText)}</b>. Cena jednostkowa spada o około <b>${num(suggestion.savingPercent, 0)}%</b>.</p>
        <button class="button secondary best-value-card__button" type="button">Wybierz ${suggestion.quantity} ${esc(unit)}</button>`;

      card.querySelector("button").addEventListener("click", () => {
        control.value = String(suggestion.quantity);
        control.dispatchEvent(new Event("change", { bubbles: true }));
        calculateButton.click();
        document.getElementById("quoteArea")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      refreshedCard.insertBefore(card, actions || null);
    }

    if (variantUpgrade) {
      const target = refreshedCard.querySelector(".best-value-card") || refreshedCard;
      if (target.classList.contains("best-value-card")) {
        renderVariantUpgradeCard(target, variantUpgrade);
      } else {
        const wrapper = document.createElement("div");
        wrapper.className = "quote-upgrade-wrap";
        renderVariantUpgradeCard(wrapper, variantUpgrade);
        refreshedCard.insertBefore(wrapper, actions || null);
      }
    }
  }


  // 0.24.4: strona główna (Start) wraca do wyglądu z 0.23.27 — wersja przed uproszczeniem z 0.24.0.
  function renderHome() {
    const iconSvg = body => `<svg viewBox="0 0 24 24" class="home-product-tile__icon-svg" aria-hidden="true" focusable="false">${body}</svg>`;
    const tileIcons = {
      "Wizytówki 24h": iconSvg(`<rect x="3.5" y="7" width="12" height="8.5" rx="1.8"></rect><path d="M6 10h5.5"></path><path d="M6 12.5h3.5"></path><rect x="8.5" y="9.5" width="12" height="8.5" rx="1.8"></rect>`),
      "Ulotki 24h": iconSvg(`<path d="M7 4.5h8l3 3V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5Z"></path><path d="M15 4.5V8h3"></path><path d="M8 11h8M8 14h8M8 17h5"></path>`),
      "Plakaty 24h": iconSvg(`<rect x="6" y="3.5" width="12" height="16.5" rx="1.8"></rect><path d="M9 7.5h6M9 11h6M9 14.5h4.5"></path><circle cx="15.8" cy="16.2" r="1.3"></circle>`),
      "Druk cyfrowy i ksero 24h": iconSvg(`<path d="M7 8V4.8A1.3 1.3 0 0 1 8.3 3.5h7.4A1.3 1.3 0 0 1 17 4.8V8"></path><path d="M6.2 18.5h11.6A1.7 1.7 0 0 0 19.5 16.8v-5.1A2.2 2.2 0 0 0 17.3 9.5H6.7a2.2 2.2 0 0 0-2.2 2.2v5.1a1.7 1.7 0 0 0 1.7 1.7Z"></path><rect x="7.5" y="14" width="9" height="6.5" rx="1"></rect>`),
      "Folie i banery 24h": iconSvg(`<path d="M5 6.5h14M7 6.5v2M17 6.5v2"></path><path d="M7 8.5h10v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 15.5Z"></path><path d="M10 17v2.5M14 17v2.5"></path>`),
      "Naklejki, etykiety i magnesy": iconSvg(`<path d="M8 4.5h6.5A3.5 3.5 0 0 1 18 8v6a5.5 5.5 0 0 1-5.5 5.5H8A3.5 3.5 0 0 1 4.5 16V8A3.5 3.5 0 0 1 8 4.5Z"></path><path d="M14 19.2c-.2-1.8.1-3 .9-3.8.8-.8 2-1.1 3.8-.9"></path>`),
      "Roll-upy i X-banery": iconSvg(`<rect x="7" y="4.5" width="10" height="14" rx="1.5"></rect><path d="M10 8.5h4M10 12h4M12 18.5v2M9 21.5h6"></path>`),
      "PCV i pianki": iconSvg(`<path d="M7 7.5 15.5 5l3 2.2-8.5 2.5Z"></path><path d="M7 7.5v8.5l3 2.2v-8.5M10 18.2 18.5 15.7V7.2"></path>`),
      "Koszulki i odzież": iconSvg(`<path d="M9 5.2 10.8 3.8h2.4L15 5.2l2.7 1.2L19 10l-2.3 1.1-.8 8.9H8.1l-.8-8.9L5 10l1.3-3.6Z"></path>`),
      "Notesy i bloczki": iconSvg(`<rect x="6.5" y="4.5" width="11" height="15" rx="1.6"></rect><path d="M9 4.5v15M11.5 8.5H15M11.5 12h4.5M11.5 15.5h3.5"></path>`),
      "Koperty, teczki i papier firmowy": iconSvg(`<path d="M4.5 7.5h15v10.5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18Z"></path><path d="m5.2 8.3 6.8 5 6.8-5M7.5 4.5h9"></path>`),
      "Kalendarze": iconSvg(`<rect x="5" y="5.5" width="14" height="14" rx="2"></rect><path d="M8 3.5v4M16 3.5v4M5 9.5h14M8.5 13h2M13.5 13h2M8.5 16h2M13.5 16h2"></path>`),
      "Restauracje, hotele": iconSvg(`<path d="M6 4.5v6.2M4.5 4.5v3.2M7.5 4.5v3.2M6 10.7v8.8M14.5 4.5v15"></path><path d="M14.5 4.5c2.8 1.2 4 3.3 4 5.3 0 2.3-1.6 3.7-4 3.7"></path>`),
      "Oprawa prac": iconSvg(`<path d="M7.5 4.5h8A2.5 2.5 0 0 1 18 7v12.5H8.7A2.2 2.2 0 0 0 6.5 21V6.7A2.2 2.2 0 0 1 8.7 4.5Z"></path><path d="M10 8.5h4.5M10 12h4.5"></path>`),
      "Laminowanie": iconSvg(`<rect x="6" y="4.5" width="10" height="15" rx="1.5"></rect><path d="M9 8h4M9 11h4.5M9 14h3.5M16 7.5h1.8"></path>`),
      "Obrazy na płótnie": iconSvg(`<rect x="4.5" y="5" width="15" height="14" rx="1.8"></rect><path d="M8 15.5 11 12l2.4 2.6 2.3-2.8 2.3 3.7"></path><circle cx="9" cy="9" r="1.2"></circle>`),
      "Śluby, wesela i imprezy": iconSvg(`<circle cx="9" cy="12" r="4"></circle><circle cx="15" cy="12" r="4"></circle><path d="M12 7.5 13.7 5.8 15.4 7.5"></path>`),
      "Nieruchomości": iconSvg(`<path d="M4.5 11.2 12 5l7.5 6.2"></path><path d="M6.8 10.5v8h10.4v-8"></path><path d="M10 18.5v-4.8h4v4.8"></path><path d="M16.8 7.2V4.5h2v4.3"></path>`)
    };
    const fallbackIcon = iconSvg(`<circle cx="12" cy="12" r="2"></circle>`);
    const productMeta = {
      "Wizytówki 24h": "Wizytówki cyfrowe i offsetowe",
      "Ulotki 24h": "A6, A5, DL i składane",
      "Plakaty 24h": "A4–B0, także wielki format",
      "Druk cyfrowy i ksero 24h": "A4/A3, kolor, mono i arkuszowanie",
      "Folie i banery 24h": "Banery, folie, laminat i OWH",
      "Naklejki, etykiety i magnesy": "Naklejki, etykiety i magnesy reklamowe",
      "Roll-upy i X-banery": "Systemy wystawiennicze i wymiana wkładów",
      "PCV i pianki": "Sztywne plansze reklamowe i ekspozycyjne",
      "Koszulki i odzież": "Koszulki, polo, bluzy i sam nadruk",
      "Notesy i bloczki": "Notesy klejone, spiralowane i NCR",
      "Koperty, teczki i papier firmowy": "Materiały firmowe i korespondencja",
      "Kalendarze": "Ścienne, listwowane, biuwary i piramidki",
      "Restauracje, hotele": "Menu, podkładki, prezentery i notesy",
      "Oprawa prac": "Oprawy kanałowe, miękkie i bindowanie",
      "Laminowanie": "Dokumenty od A6 do A3",
      "Obrazy na płótnie": "Gotowe formaty i własny wymiar",
      "Śluby, wesela i imprezy": "Zaproszenia, plany stołów i dekoracje",
      "Nieruchomości": "Komplet materiałów dla biur, agentów i deweloperów"
    };
    const popularNames = [
      "Wizytówki 24h",
      "Ulotki 24h",
      "Plakaty 24h",
      "Koszulki i odzież",
      "Naklejki, etykiety i magnesy",
      "Folie i banery 24h"
    ];
    const groupDefs = [
      ["Reklama i ekspozycja", ["Roll-upy i X-banery", "PCV i pianki", "Obrazy na płótnie"]],
      ["Dla firm", ["Druk cyfrowy i ksero 24h", "Notesy i bloczki", "Koperty, teczki i papier firmowy", "Kalendarze", "Oprawa prac", "Laminowanie"]],
      ["Branżowe", ["Restauracje, hotele", "Śluby, wesela i imprezy", "Nieruchomości"]]
    ];
    const tile = (name, featured = false) => `
      <button class="home-product-tile${featured ? " home-product-tile--featured" : ""}" type="button" data-home-page="${esc(name)}">
        <span class="home-product-tile__icon" aria-hidden="true">${tileIcons[name] || fallbackIcon}</span>
        <span class="home-product-tile__content"><strong>${format24hLabel(name, true)}</strong><span>${esc(productMeta[name] || "Przejdź do koszyka")}</span></span>
        <span class="home-product-tile__arrow" aria-hidden="true">→</span>
      </button>`;
    const popularTiles = popularNames.map(name => tile(name, true)).join("");
    const groupedTiles = groupDefs.map(([label, names]) => `
      <section class="home-category-group">
        <div class="home-category-group__head"><h3>${esc(label)}</h3><span>${names.length} ${names.length === 1 ? "usługa" : "usług"}</span></div>
        <div class="home-product-grid home-product-grid--compact">${names.map(name => tile(name)).join("")}</div>
      </section>`).join("");

    content.innerHTML = `
      <section class="home-conversion-hero">
        <div class="home-conversion-hero__main">
          <span class="home-hero__badge">ZAMÓWIENIA ONLINE</span>
          <h1>Zamów druk<br><em>szybko i wygodnie</em></h1>
          <p class="home-conversion-hero__lead">Wybierz produkt, sprawdź cenę i dodaj go do koszyka. Jeśli potrzebujesz pomocy z parametrami, skorzystaj z asystenta.</p>
          <div class="home-search home-search--primary">
            <span aria-hidden="true">⌕</span>
            <input id="homeProductSearch" type="search" autocomplete="off" placeholder="Wpisz produkt, np. ulotki, wizytówki, plakaty…">
          </div>
          <div id="homeSearchResults" class="home-search-results" aria-live="polite"></div>
          <p class="home-search-hint">Wyszukaj produkt po nazwie. Jeśli nie znasz parametrów, skorzystaj z osobnego asystenta poniżej.</p>
          <div class="quote-assistant-launch">
            <button class="quote-assistant-launch__button" id="openQuoteAssistant" type="button" aria-expanded="false" aria-controls="quoteAssistant">
              <span class="quote-assistant-launch__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M8 6h8v4H8z"></path><path d="M8 13h2M14 13h2M8 17h2M14 17h2"></path></svg></span>
              <span><strong>Uruchom asystenta zamówień</strong><small>Bez AI — dopyta tylko o brakujące parametry</small></span>
              <b>BEZ AI</b>
            </button>
            <button class="quote-purpose-launch" id="openPurposeFinder" type="button" aria-expanded="false" aria-controls="quoteAssistant">
              <span class="quote-purpose-launch__icon" aria-hidden="true">▦</span>
              <span><strong>Nie wiem, czego potrzebuję</strong><small>Dobierz produkt według zastosowania</small></span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <section class="quote-assistant" id="quoteAssistant" hidden aria-label="Asystent zamówień">
            <div class="quote-assistant__head">
              <div><span class="quote-assistant__status"><i></i> Asystent zamówień</span><strong>Opisz zamówienie po swojemu</strong></div>
              <button id="quoteAssistantReset" type="button">Zacznij od nowa</button>
            </div>
            <div class="quote-assistant__messages" id="quoteAssistantMessages" aria-live="polite"></div>
            <div class="quote-assistant__choices" id="quoteAssistantChoices"></div>
            <form class="quote-assistant__form" id="quoteAssistantForm">
              <input id="quoteAssistantInput" type="text" autocomplete="off" placeholder="Opisz, czego potrzebujesz…" aria-label="Opis zamówienia do kreatora zamówienia">
              <button type="submit" aria-label="Wyślij do kreatora">Wyślij →</button>
            </form>
            <p class="quote-assistant__foot">To nie jest AI. Kreator działa na prostych regułach, słowniku produktów i aktualnym cenniku Druk24. Nie wysyła opisu zamówienia do żadnego modelu AI ani usługi generatywnej. Jeśli czegoś nie da się ustalić jednoznacznie, nie zgaduje — otwiera właściwy kalkulator.</p>
          </section>
        </div>
        <aside class="home-simple-steps">
          <span class="home-simple-steps__label">To naprawdę proste</span>
          <ol>
            <li><b>1</b><div><strong>Wybierz produkt</strong><span>albo wpisz go w wyszukiwarkę</span></div></li>
            <li><b>2</b><div><strong>Albo wpisz wszystko jednym zdaniem</strong><span>np. „200 ulotek A5”</span></div></li>
            <li><b>3</b><div><strong>Zobacz cenę</strong><span>i dopiero wtedy zdecyduj, co dalej</span></div></li>
          </ol>
          <div class="home-no-risk"><strong>Wymaga potwierdzenia drukarni.</strong><span>Przesłanie zamówienia nie jest zakupem ani rozpoczęciem produkcji. Drukarnia potwierdzi cenę i termin realizacji.</span></div>
        </aside>
      </section>

      <section class="home-popular home-popular--conversion" aria-labelledby="homePopularTitle">
        <div class="home-section-head"><div><span class="home-section-kicker">Najczęściej wybierane</span><h2 id="homePopularTitle">Od czego chcesz zacząć?</h2></div></div>
        <div class="home-product-grid home-product-grid--featured">${popularTiles}</div>
      </section>

      <section class="home-all-products" id="allProducts" aria-label="Wszystkie pozostałe usługi">
        <div class="home-groups">${groupedTiles}</div>
      </section>

      <section class="home-help-choice">
        <div><span class="home-section-kicker">Nie wiesz, co wybrać?</span><h2>Nie musisz zgadywać</h2><p>Opisz krótko czego potrzebujesz albo skontaktuj się z nami. Pomożemy dobrać odpowiednią opcję.</p></div>
        <div class="home-help-choice__actions"><button class="button" id="openPurposeFinderBottom" type="button">Dobierz produkt do zastosowania</button><a class="button secondary" href="mailto:${CONTACT_EMAIL}">Napisz e-mail</a><a class="button secondary" href="tel:+48918314747">Zadzwoń: 91 831 47 47</a></div>
      </section>

      <section class="home-trust-strip" aria-label="Najważniejsze informacje">
        <div><strong>Ceny brutto</strong><span>Od razu widzisz wyliczoną cenę, do potwierdzenia przez drukarnię</span></div>
        <div><strong>Weryfikacja przez drukarnię</strong><span>W godzinach pracy drukarni</span></div>
        <div><strong>Pliki do zapytania</strong><span>Możesz dołączyć je przed wysłaniem</span></div>
        <div><strong>Bez obowiązku zapłaty</strong><span>Zamówienie wymaga akceptacji drukarni</span></div>
      </section>`;

    content.querySelectorAll("[data-home-page]").forEach(button => button.addEventListener("click", () => navigateToPage(button.dataset.homePage)));

    const homeSearch = document.getElementById("homeProductSearch");
    const homeResults = document.getElementById("homeSearchResults");
    const quoteWizard = setupQuoteAssistant();
    homeQuoteWizard = quoteWizard;
    const updateHomeSearch = () => {
      const query = homeSearch.value.trim();
      if (!query) {
        homeResults.innerHTML = searchExamplesHtml(true);
        bindSearchSuggestionButtons(homeResults, homeSearch, pageName => navigateToPage(pageName));
        return;
      }
      if (isBrainrotTrigger(query)) { activateBrainrotMode(); return; }
      const adminPage = getHiddenAdminPage(query);
      if (adminPage) { openHiddenAdminPage(adminPage); return; }
      if (isRouletteTrigger(query)) { openRouletteEasterEgg(); return; }
      if (isStaffGateTrigger(query)) {
        homeResults.innerHTML = '<button type="button" class="is-best" id="homeOpenStaffGate"><span>Ukryty panel</span><strong>Panel pracowniczy — naciśnij Enter</strong><b aria-hidden="true">→</b></button>';
        document.getElementById("homeOpenStaffGate")?.addEventListener("click", async () => {
          if (!(await tryOpenStaffPanel(query))) showToast("Nie udało się otworzyć panelu pracowniczego.");
        });
        return;
      }
      const oldQuery = state.searchQuery;
      state.searchQuery = query;
      const matches = getProductSearchMatches(query).slice(0, 5);
      state.searchQuery = oldQuery;
      const matchHtml = matches.length ? matches.map((match, index) => `
        <button type="button" data-home-search-page="${esc(match.pageName)}">
          <span>${searchResultDescription(match, index === 0 ? "Najlepsze dopasowanie" : "")}</span>
          <strong>${format24hLabel(match.pageName, true)}</strong><b aria-hidden="true">→</b>
        </button>`).join("") : "";
      homeResults.innerHTML = matchHtml || `<div class="home-search-results__empty">Brak dopasowania. Wpisz nazwę produktu albo wybierz kategorię poniżej.</div>`;
      homeResults.querySelectorAll("[data-home-search-page]").forEach(button => button.addEventListener("click", () => {
        analyticsTrack("search", { query, results: matches.length, selected: button.dataset.homeSearchPage });
        navigateToPage(button.dataset.homeSearchPage);
      }));
    };
    homeSearch.addEventListener("input", updateHomeSearch);
    homeSearch.addEventListener("focus", () => { if (!homeSearch.value.trim()) updateHomeSearch(); });
    bindSearchArrowKeys(homeSearch, homeResults);
    updateHomeSearch();
    homeSearch.addEventListener("keydown", async event => {
      if (event.key !== "Enter") return;
      const query = homeSearch.value.trim();
      if (isBrainrotTrigger(query)) { event.preventDefault(); activateBrainrotMode(); return; }
      if (isStaffGateTrigger(query)) { event.preventDefault(); if (!(await tryOpenStaffPanel(query))) showToast("Nie udało się otworzyć panelu pracowniczego."); return; }
      const adminPage = getHiddenAdminPage(query);
      if (adminPage) { event.preventDefault(); openHiddenAdminPage(adminPage); return; }
      if (isRouletteTrigger(query)) { event.preventDefault(); openRouletteEasterEgg(); return; }
      const useCase = !quoteHasNamedProduct(query) ? findQuoteUseCase(query) : null;
      if (useCase) {
        event.preventDefault();
        quoteWizard?.openPurposeFinder(query);
        return;
      }
      const quoteAnalysis = quoteAssistantAnalyze(query);
      const smartIntent = quoteAnalysis.status === "question" ? null : getSmartQuoteIntent(query);
      if (smartIntent) {
        event.preventDefault();
        openSmartQuote(smartIntent, query);
        return;
      }
      if (quoteAnalysis.status === "question" && getProductSearchMatches(query)[0]?.score >= 90) {
        event.preventDefault();
        quoteWizard?.startFromDescription(query);
        return;
      }
      const first = homeResults.querySelector("[data-home-search-page]");
      if (first) {
        event.preventDefault();
        const matches = getProductSearchMatches(query);
        analyticsTrack("search", { query, results: matches.length, selected: first.dataset.homeSearchPage });
        navigateToPage(first.dataset.homeSearchPage);
      } else if (query) {
        event.preventDefault();
        if (await tryOpenStaffPanel(query)) return;
        analyticsTrack("search", { query, results: 0 });
      }
    });
  }

  async function renderAnalyticsAdmin() {
    content.innerHTML = `${header("Statystyki", "Anonimowe statystyki korzystania z Drukulatora")}
      <div class="card analytics-toolbar">
        ${alertBox("Statystyki nie zapisują adresów IP, e-maili ani danych klientów. Liczone są tylko anonimowe zdarzenia w Drukulatorze.", "info")}
        <div class="actions">
          <button class="button" id="refreshAnalytics" type="button">Odśwież statystyki</button>
          <button class="button secondary" id="downloadAnalytics" type="button">Pobierz JSON</button>
          <button class="button danger" id="resetAnalytics" type="button">Wyzeruj statystyki</button>
        </div>
      </div>
      <div id="analyticsStatus"></div>
      <div id="analyticsDashboard" class="analytics-dashboard"><div class="card"><p class="muted">Wczytywanie statystyk…</p></div></div>`;

    let analyticsPayload = null;
    let analyticsNonce = "";
    const dashboard = document.getElementById("analyticsDashboard");
    const status = document.getElementById("analyticsStatus");

    const number = value => Number(value || 0);
    const percent = value => `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
    const dateLabel = date => {
      const parts = String(date || "").split("-");
      return parts.length === 3 ? `${parts[2]}.${parts[1]}` : date;
    };
    const sortedEntries = object => Object.entries(object || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
    const renderRanking = (title, entries, emptyText) => {
      const rows = entries.slice(0, 10);
      const max = rows.length ? Math.max(...rows.map(([, count]) => Number(count) || 0), 1) : 1;
      return `<section class="card analytics-panel"><div class="analytics-panel__header"><h3>${esc(title)}</h3></div>${rows.length ? `<div class="analytics-ranking">${rows.map(([label, count], index) => `<div class="analytics-ranking__row"><span class="analytics-ranking__position">${index + 1}</span><div class="analytics-ranking__label"><strong>${esc(label)}</strong><span class="analytics-ranking__bar"><i style="width:${Math.max(4, (Number(count) / max) * 100)}%"></i></span></div><b>${Number(count)}</b></div>`).join("")}</div>` : `<p class="muted">${esc(emptyText)}</p>`}</section>`;
    };

    const renderDashboard = stats => {
      const totals = stats?.totals || {};
      const sessions = number(totals.sessions);
      const orders = number(totals.orders);
      const orderValue = number(totals.order_value);
      const searches = number(totals.searches);
      const noResults = number(totals.searches_no_results);
      const conversion = sessions > 0 ? (orders / sessions) * 100 : 0;
      const averageOrder = orders > 0 ? orderValue / orders : 0;
      const daily = Object.entries(stats?.daily || {}).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
      const maxDailySessions = Math.max(1, ...daily.map(([, row]) => number(row.sessions)));

      dashboard.innerHTML = `
        <section class="analytics-metrics">
          <div class="card analytics-metric"><span>Sesje</span><strong>${sessions}</strong><small>otwarcia Drukulatora</small></div>
          <div class="card analytics-metric"><span>Wyświetlenia działów</span><strong>${number(totals.page_views)}</strong><small>przejścia między kalkulatorami</small></div>
          <div class="card analytics-metric"><span>Dodania do zamówienia</span><strong>${number(totals.cart_adds)}</strong><small>wszystkie produkty</small></div>
          <div class="card analytics-metric"><span>Wysłane zapytania</span><strong>${orders}</strong><small>konwersja ${percent(conversion)}</small></div>
          <div class="card analytics-metric"><span>Wartość zapytań</span><strong>${money(orderValue)} zł</strong><small>łącznie</small></div>
          <div class="card analytics-metric"><span>Średnie zapytanie</span><strong>${money(averageOrder)} zł</strong><small>średnia wartość zamówienia</small></div>
          <div class="card analytics-metric"><span>Wyszukiwania</span><strong>${searches}</strong><small>${noResults} bez wyniku</small></div>
          <div class="card analytics-metric"><span>Brak wyników</span><strong>${searches ? percent((noResults / searches) * 100) : "0,0%"}</strong><small>udział wyszukiwań</small></div>
        </section>

        <section class="card analytics-panel analytics-daily">
          <div class="analytics-panel__header"><h3>Ostatnie 14 dni</h3><span>sesje / zapytania</span></div>
          ${daily.length ? `<div class="analytics-daily__chart">${daily.map(([date, row]) => `<div class="analytics-daily__day" title="${esc(date)}: ${number(row.sessions)} sesji, ${number(row.orders)} zapytań"><div class="analytics-daily__bars"><i style="height:${Math.max(3, (number(row.sessions) / maxDailySessions) * 100)}%"></i><b style="height:${Math.max(number(row.orders) ? 8 : 0, (number(row.orders) / maxDailySessions) * 100)}%"></b></div><span>${esc(dateLabel(date))}</span></div>`).join("")}</div>` : `<p class="muted">Statystyki zaczną się pojawiać po pierwszych wizytach.</p>`}
        </section>

        <div class="analytics-grid">
          ${renderRanking("Najczęściej otwierane działy", sortedEntries(stats?.pages), "Brak danych o wyświetleniach.")}
          ${renderRanking("Najczęściej dodawane produkty", sortedEntries(stats?.products), "Brak produktów dodanych do koszyka.")}
          ${renderRanking("Najczęściej wyszukiwane frazy", sortedEntries(stats?.search_terms), "Brak danych z wyszukiwarki.")}
          ${renderRanking("Frazy bez wyników", sortedEntries(stats?.search_terms_no_results), "Wyszukiwarka znajduje odpowiedź na wszystkie zapisane frazy.")}
        </div>
        <p class="muted analytics-footnote">Dane są agregowane i przechowywane w bazie WordPressa. Nie zapisujemy adresów IP, adresów e-mail ani treści formularza zamówienia. Historia dzienna obejmuje ostatnie 90 dni.</p>`;
    };

    const loadAnalytics = async () => {
      status.innerHTML = "";
      dashboard.innerHTML = `<div class="card"><p class="muted">Wczytywanie statystyk…</p></div>`;
      try {
        const response = await fetch("analytics-admin.php", { cache: "no-store", credentials: "same-origin" });
        const result = await response.json();
        if (!response.ok || !result.success) {
          const loginLink = result.login_url ? ` <a href="${esc(result.login_url)}">Zaloguj się do WordPressa</a>.` : "";
          throw new Error((result.message || "Nie udało się pobrać statystyk.") + loginLink);
        }
        analyticsPayload = result.stats || {};
        analyticsNonce = result.nonce || "";
        renderDashboard(analyticsPayload);
      } catch (error) {
        dashboard.innerHTML = "";
        status.innerHTML = alertBox(error.message || String(error), "error");
      }
    };

    document.getElementById("refreshAnalytics").addEventListener("click", loadAnalytics);
    document.getElementById("downloadAnalytics").addEventListener("click", () => {
      if (!analyticsPayload) return showToast("Najpierw wczytaj statystyki");
      const blob = new Blob([JSON.stringify(analyticsPayload, null, 2)], { type: "application/json;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `drukulator-analytics-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
    document.getElementById("resetAnalytics").addEventListener("click", async () => {
      if (!analyticsNonce) return showToast("Najpierw odśwież statystyki");
      if (!window.confirm("Na pewno wyzerować wszystkie statystyki Drukulatora? Tej operacji nie można cofnąć.")) return;
      try {
        const response = await fetch("analytics-admin.php", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset", nonce: analyticsNonce })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Nie udało się wyzerować statystyk.");
        showToast("Statystyki wyzerowane");
        await loadAnalytics();
      } catch (error) {
        status.innerHTML = alertBox(error.message || String(error), "error");
      }
    });

    await loadAnalytics();
  }

  function renderPriceAdmin() {
    if (!state.adminUnlocked) {
      renderPriceAdminLogin();
      return;
    }

    const hasOverride = Boolean(loadJson(PRICE_OVERRIDE_KEY, null));
    content.innerHTML = `${header("Edycja cen", "Zapis cen bezpośrednio na serwerze")}
      <div class="card admin-toolbar">
        ${alertBox("Aby zapisać ceny dla wszystkich użytkowników, musisz być jednocześnie zalogowany do WordPressa jako administrator. Przed zapisem serwer automatycznie utworzy kopię poprzedniego cennika.", "info")}
        <div class="admin-status-row">
          <span class="status-dot ${hasOverride ? "active" : ""}"></span>
          <strong id="adminPriceStatus">${hasOverride ? "Używane są ceny robocze zapisane w tej przeglądarce" : "Używane są ceny pobrane z serwera"}</strong>
        </div>
        <div class="field admin-search"><label>Wyszukaj kategorię lub cenę</label><input id="adminSearch" type="search" placeholder="np. baner, A4, laminat, wizytówki"></div>
        <div class="actions admin-actions">
          <button class="button" id="saveAdminPricesServer" type="button">Zapisz ceny na serwerze</button>
          <button class="button secondary" id="saveAdminPricesLocal" type="button">Zastosuj tylko w tej przeglądarce</button>
          <button class="button secondary" id="downloadAdminPrices" type="button">Pobierz prices.json</button>
          <label class="button secondary admin-file-button">Wczytaj prices.json<input id="importAdminPrices" type="file" accept="application/json,.json"></label>
          <button class="button secondary" id="resetAdminPrices" type="button">Wczytaj aktualne ceny z serwera</button>
          <button class="button secondary" id="openAnalytics" type="button">Statystyki</button>
          <button class="button danger" id="lockAdmin" type="button">Zablokuj panel</button>
        </div>
      </div>
      <div id="adminMessage"></div>
      <div id="priceEditor" class="price-editor">${buildPriceEditor(state.prices)}</div>`;

    document.getElementById("adminSearch").addEventListener("input", event => filterPriceEditor(event.target.value));
    document.getElementById("saveAdminPricesServer").addEventListener("click", saveAdminPricesToServer);
    document.getElementById("saveAdminPricesLocal").addEventListener("click", saveAdminPricesLocally);
    document.getElementById("downloadAdminPrices").addEventListener("click", downloadPricesJson);
    document.getElementById("importAdminPrices").addEventListener("change", importAdminPrices);
    document.getElementById("resetAdminPrices").addEventListener("click", reloadAdminPricesFromServer);
    document.getElementById("openAnalytics").addEventListener("click", () => openHiddenAdminPage("Statystyki"));
    document.getElementById("lockAdmin").addEventListener("click", lockPriceAdmin);
  }

  function renderPriceAdminLogin() {
    content.innerHTML = `${header("Edycja cen", "Panel administracyjny")}
      <div class="card admin-login-card">
        <form id="adminLoginForm">
          <div class="field"><label>Hasło</label><input id="adminPassword" type="password" autocomplete="current-password" required autofocus></div>
          <div class="actions"><button class="button full" type="submit">Otwórz edycję cen</button></div>
        </form>
        <div id="adminLoginMessage"></div>
        <p class="muted admin-security-note">Hasło otwiera edytor cen. Zapis globalny jest dodatkowo chroniony aktywną sesją administratora WordPressa.</p>
      </div>`;

    document.getElementById("adminLoginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const message = document.getElementById("adminLoginMessage");
      try {
        const passwordHash = hashPassword(value("adminPassword"));
        if (passwordHash !== ADMIN_PASSWORD_HASH) {
          message.innerHTML = alertBox("Nieprawidłowe hasło.", "error");
          document.getElementById("adminPassword").select();
          return;
        }
        state.adminUnlocked = true;
        try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch {}
        renderPriceAdmin();
      } catch (error) {
        message.innerHTML = alertBox(error.message || String(error), "error");
      }
    });
  }

  function buildPriceEditor(prices) {
    const fields = [];
    collectEditablePriceFields(prices, [], fields);
    const groups = new Map();
    fields.forEach(field => {
      const category = String(field.path[0]);
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(field);
    });

    return Array.from(groups.entries()).map(([category, categoryFields], index) => {
      const rows = categoryFields.map(field => {
        const contextParts = field.path.slice(1, -1).map((part, partIndex) => humanizePathPart(part, field.path[partIndex]));
        const label = humanizePathPart(field.path[field.path.length - 1], field.path[field.path.length - 2]);
        const pathJson = JSON.stringify(field.path);
        const searchText = `${categoryLabel(category)} ${contextParts.join(" ")} ${label}`.toLocaleLowerCase("pl-PL");
        if (field.type === "boolean") {
          return `<div class="admin-price-field admin-price-field--checkbox" data-search="${esc(searchText)}">
            <label class="admin-checkbox-label">
              <input type="checkbox" data-price-path="${esc(pathJson)}" data-price-type="boolean"${field.value ? " checked" : ""}>
              <span>${esc(label)}</span>
            </label>
            <small>${esc(contextParts.join(" / ") || categoryLabel(category))}</small>
          </div>`;
        }
        return `<div class="admin-price-field" data-search="${esc(searchText)}">
          <label>${esc(label)}</label>
          <input type="number" step="0.01" data-price-path="${esc(pathJson)}" data-price-type="number" value="${esc(field.value)}">
          <small>${esc(contextParts.join(" / ") || categoryLabel(category))}</small>
        </div>`;
      }).join("");
      return `<details class="admin-category"${index === 0 ? " open" : ""}>
        <summary><span>${esc(categoryLabel(category))}</span><span class="admin-count">${categoryFields.length}</span></summary>
        <div class="admin-price-grid">${rows}</div>
      </details>`;
    }).join("");
  }

  function collectEditablePriceFields(valueToCheck, path, result) {
    if (Array.isArray(valueToCheck)) {
      valueToCheck.forEach((item, index) => collectEditablePriceFields(item, [...path, index], result));
      return;
    }
    if (valueToCheck && typeof valueToCheck === "object") {
      Object.entries(valueToCheck).forEach(([key, item]) => collectEditablePriceFields(item, [...path, key], result));
      return;
    }
    if (typeof valueToCheck === "number" && Number.isFinite(valueToCheck)) {
      result.push({ path, value: valueToCheck, type: "number" });
      return;
    }
    if (typeof valueToCheck === "boolean" && path[path.length - 1] === "doliczaj_ciecie_reczne") {
      result.push({ path, value: valueToCheck, type: "boolean" });
    }
  }

  function categoryLabel(category) {
    const labels = {
      meta: "Ustawienia ogólne",
      banery: "Folie i banery 24h",
      pvc: "PCV i pianki",
      wizytowki: "Wizytówki 24h",
      papier_firmowy: "Papier firmowy",
      materialy_firmowe: "Koperty i teczki",
      kalendarze: "Kalendarze",
      rollup: "Roll-upy i X-banery",
      ulotki: "Ulotki 24h",
      notesy_i_bloczki: "Notesy i bloczki",
      restauracje_hotele: "Restauracje, hotele",
      plakaty: "Plakaty 24h",
      naklejki: "Naklejki, etykiety i magnesy",
      druk_cyfrowy_i_ksero: "Druk cyfrowy i ksero 24h",
      odziez_z_nadrukiem: "Koszulki i odzież",
      oprawa_prac: "Oprawa prac",
      laminowanie: "Laminowanie",
      obrazy_na_plotnie: "Obrazy na płótnie",
      sluby_wesela_imprezy: "Śluby, wesela i imprezy"
    };
    return labels[category] || humanizeText(category);
  }

  function humanizePathPart(part, parent) {
    if (typeof part === "number") {
      if (["progi_cenowe", "progi_cenowe_mb", "progi_cenowe_m2", "progi_ilosciowe"].includes(parent)) return `Próg ${part + 1}`;
      return `Pozycja ${part + 1}`;
    }
    const labels = {
      cena_m2: "Cena za m²",
      cena_mb: "Cena za mb",
      cena_sztuki: "Cena za sztukę",
      cena_odziezy: "Cena samej odzieży (bez nadruku)",
      szerokosc_cm: "Szerokość [cm]",
      wysokosc_cm: "Wysokość [cm]",
      minimum_zamowienia: "Minimum zamówienia",
      minimum_m2: "Minimalna długość / powierzchnia",
      maks_m2: "Górna granica m²",
      maks_mb: "Górna granica mb",
      vat: "VAT [%]",
      ciecie_reczne_cena_mb: "Cięcie ręczne [zł/mb]",
      doliczaj_ciecie_reczne: "Doliczaj cięcie ręczne",
      folia_mikrony: "Grubość folii [µm]",
      maksymalny_bok_cm: "Maksymalny bok [cm]",
      od_10_sztuk: "Rabat od 10 sztuk [%]",
      powyzej_20_sztuk: "Rabat powyżej 20 sztuk [%]",
      cena_za_m2: "Cena za m²",
      cena_m2_obrazu: "Cena za m² obrazu",
      doplaty_do_papieru: "Dopłaty do papieru",
      mnozniki_formatu: "Mnożniki formatu",
      mnozniki_zadruku: "Mnożniki zadruku",
      progi_cenowe: "Progi cenowe",
      progi_cenowe_mb: "Progi cenowe mb",
      progi_cenowe_m2: "Progi cenowe m²",
      progi_ilosciowe: "Progi ilościowe",
      min_szt: "Od liczby sztuk",
      rabat_proc: "Rabat [%]",
      grubosci: "Grubości",
      formaty: "Formaty",
      rodzaje_opraw: "Rodzaje opraw",
      produkty: "Produkty",
      ceny: "Ceny"
    };
    return labels[part] || humanizeText(part);
  }

  function humanizeText(valueToFormat) {
    const text = String(valueToFormat).replaceAll("_", " ");
    return text.charAt(0).toLocaleUpperCase("pl-PL") + text.slice(1);
  }

  function filterPriceEditor(query) {
    const normalized = String(query || "").trim().toLocaleLowerCase("pl-PL");
    document.querySelectorAll(".admin-price-field").forEach(field => {
      field.classList.toggle("filtered-out", normalized && !field.dataset.search.includes(normalized));
    });
    document.querySelectorAll(".admin-category").forEach(category => {
      const visible = category.querySelector(".admin-price-field:not(.filtered-out)");
      category.classList.toggle("filtered-out", !visible);
      if (normalized && visible) category.open = true;
    });
  }

  function readPricesFromEditor() {
    const updatedPrices = deepClone(state.prices);
    document.querySelectorAll("[data-price-path]").forEach(input => {
      const fieldType = input.dataset.priceType || "number";
      const parsed = fieldType === "boolean" ? input.checked : Number(input.value);
      if (fieldType === "number" && !Number.isFinite(parsed)) {
        throw new Error(`Nieprawidłowa wartość w polu: ${input.closest(".admin-price-field").querySelector("label").textContent}`);
      }
      setValueAtPath(updatedPrices, JSON.parse(input.dataset.pricePath), parsed);
    });
    return updatedPrices;
  }

  function setValueAtPath(target, path, newValue) {
    let current = target;
    for (let index = 0; index < path.length - 1; index += 1) current = current[path[index]];
    current[path[path.length - 1]] = newValue;
  }

  function clearPriceOverrides() {
    [PRICE_OVERRIDE_KEY, ...LEGACY_PRICE_OVERRIDE_KEYS].forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });
  }

  function saveAdminPricesLocally() {
    const message = document.getElementById("adminMessage");
    try {
      state.prices = readPricesFromEditor();
      localStorage.setItem(PRICE_OVERRIDE_KEY, JSON.stringify(state.prices));
      document.getElementById("adminPriceStatus").textContent = "Używane są ceny robocze zapisane w tej przeglądarce";
      document.querySelector(".status-dot").classList.add("active");
      message.innerHTML = alertBox("Ceny zostały zastosowane tylko w tej przeglądarce. Inni użytkownicy nadal widzą cennik zapisany na serwerze.", "success");
      showToast("Zastosowano ceny lokalnie");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
    }
  }

  async function parseJsonResponse(response) {
    const textResponse = await response.text();
    try {
      return JSON.parse(textResponse);
    } catch {
      throw new Error(`Serwer zwrócił nieprawidłową odpowiedź (HTTP ${response.status}).`);
    }
  }

  async function saveAdminPricesToServer() {
    const message = document.getElementById("adminMessage");
    const button = document.getElementById("saveAdminPricesServer");
    const originalLabel = button.textContent;

    try {
      const updatedPrices = readPricesFromEditor();
      button.disabled = true;
      button.textContent = "Sprawdzanie uprawnień…";
      message.innerHTML = alertBox("Sprawdzam sesję administratora WordPressa…", "info");

      const authResponse = await fetch("admin-auth.php", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      const authResult = await parseJsonResponse(authResponse);

      if (!authResponse.ok || !authResult.success || !authResult.nonce) {
        const loginHint = authResult.login_url ? ` Zaloguj się tutaj: ${authResult.login_url}` : "";
        throw new Error((authResult.message || "Zaloguj się do WordPressa jako administrator.") + loginHint);
      }

      button.textContent = "Zapisywanie na serwerze…";
      message.innerHTML = alertBox("Tworzę kopię zapasową i zapisuję nowy cennik…", "info");

      const saveResponse = await fetch("save-prices.php", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nonce: authResult.nonce, prices: updatedPrices })
      });
      const saveResult = await parseJsonResponse(saveResponse);

      if (!saveResponse.ok || !saveResult.success) {
        throw new Error(saveResult.message || "Nie udało się zapisać cennika na serwerze.");
      }

      state.prices = deepClone(updatedPrices);
      state.basePrices = deepClone(updatedPrices);
      clearPriceOverrides();

      const status = document.getElementById("adminPriceStatus");
      status.textContent = saveResult.updated_at
        ? `Cennik zapisany na serwerze: ${saveResult.updated_at}`
        : "Używane są ceny zapisane na serwerze";
      document.querySelector(".status-dot").classList.remove("active");
      message.innerHTML = alertBox(`${saveResult.message || "Cennik został zapisany na serwerze."} Nowe ceny są dostępne dla wszystkich użytkowników.`, "success");
      showToast("Zapisano ceny na serwerze");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  function downloadPricesJson() {
    if (!state.prices) return;
    const data = JSON.stringify(state.prices, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "application/json;charset=utf-8" }));
    link.download = "prices.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importAdminPrices(event) {
    const file = event.target.files[0];
    if (!file) return;
    const message = document.getElementById("adminMessage");
    try {
      const imported = JSON.parse(await file.text());
      if (!isValidPriceFile(imported)) throw new Error("Wybrany plik nie ma prawidłowej struktury cennika.");
      state.prices = migratePrices(imported);
      localStorage.setItem(PRICE_OVERRIDE_KEY, JSON.stringify(state.prices));
      renderPriceAdmin();
      showToast("Wczytano prices.json");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
      event.target.value = "";
    }
  }

  async function reloadAdminPricesFromServer() {
    if (!window.confirm("Wczytać aktualne ceny zapisane na serwerze? Niezapisane zmiany w formularzu zostaną utracone.")) return;
    const message = document.getElementById("adminMessage");
    const button = document.getElementById("resetAdminPrices");
    const originalLabel = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Pobieranie…";
      const response = await fetch(`data/prices.json?refresh=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Nie udało się pobrać cennika: HTTP ${response.status}`);
      const prices = await response.json();
      if (!isValidPriceFile(prices)) throw new Error("Plik prices.json na serwerze ma nieprawidłową strukturę.");
      state.basePrices = deepClone(prices);
      state.prices = deepClone(prices);
      clearPriceOverrides();
      renderPriceAdmin();
      document.getElementById("adminMessage").innerHTML = alertBox("Wczytano aktualny cennik z serwera.", "success");
      showToast("Wczytano ceny z serwera");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  function lockPriceAdmin() {
    state.adminUnlocked = false;
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {}
    state.page = "Start";
    renderNavigation();
    renderCurrentPage();
  }

  function hashPassword(text) {
    let hash = 0x811c9dc5;
    const valueToHash = String(text);
    for (let index = 0; index < valueToHash.length; index += 1) {
      hash ^= valueToHash.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function renderSearchAdmin() {
    if (!state.adminUnlocked) {
      renderSearchAdminLogin();
      return;
    }

    const hasOverride = Boolean(loadJson(SEARCH_TERMS_OVERRIDE_KEY, null));
    content.innerHTML = `${header("Edycja wyszukiwarki", "Dodawaj własne frazy i określenia klientów")}
      <div class="card admin-toolbar">
        ${alertBox("Frazy zapisane w panelu działają od razu w tej przeglądarce. Aby opublikować je dla wszystkich, pobierz search-terms.json i podmień plik data/search-terms.json na serwerze lub GitHubie.", "info")}
        <div class="admin-status-row">
          <span class="status-dot ${hasOverride ? "active" : ""}"></span>
          <strong id="adminSearchStatus">${hasOverride ? "Używany jest słownik zapisany w tej przeglądarce" : "Używany jest słownik z serwera"}</strong>
        </div>
        <div class="field admin-search"><label>Wyszukaj kategorię</label><input id="searchDictionaryFilter" type="search" placeholder="np. wizytówki, naklejki, pianki"></div>
        <div class="actions admin-actions">
          <button class="button" id="saveSearchDictionary" type="button">Zapisz i zastosuj</button>
          <button class="button secondary" id="downloadSearchDictionary" type="button">Pobierz search-terms.json</button>
          <label class="button secondary admin-file-button">Wczytaj search-terms.json<input id="importSearchDictionary" type="file" accept="application/json,.json"></label>
          <button class="button secondary" id="resetSearchDictionary" type="button">Przywróć słownik z serwera</button>
          <button class="button danger" id="lockSearchAdmin" type="button">Zablokuj panel</button>
        </div>
      </div>
      <div id="searchDictionaryMessage"></div>
      <div id="searchDictionaryEditor" class="search-dictionary-editor">${buildSearchTermsEditor(state.searchTerms)}</div>`;

    document.getElementById("searchDictionaryFilter").addEventListener("input", event => filterSearchTermsEditor(event.target.value));
    document.getElementById("saveSearchDictionary").addEventListener("click", saveSearchTerms);
    document.getElementById("downloadSearchDictionary").addEventListener("click", downloadSearchTermsJson);
    document.getElementById("importSearchDictionary").addEventListener("change", importSearchTerms);
    document.getElementById("resetSearchDictionary").addEventListener("click", resetSearchTerms);
    document.getElementById("lockSearchAdmin").addEventListener("click", lockSearchAdmin);
  }

  function renderSearchAdminLogin() {
    content.innerHTML = `${header("Edycja wyszukiwarki", "Panel administracyjny")}
      <div class="card admin-login-card">
        <form id="searchAdminLoginForm">
          <div class="field"><label>Hasło</label><input id="searchAdminPassword" type="password" autocomplete="current-password" required autofocus></div>
          <div class="actions"><button class="button full" type="submit">Otwórz edycję wyszukiwarki</button></div>
        </form>
        <div id="searchAdminLoginMessage"></div>
        <p class="muted admin-security-note">Panel korzysta z tego samego hasła co edycja cen.</p>
      </div>`;

    document.getElementById("searchAdminLoginForm").addEventListener("submit", event => {
      event.preventDefault();
      const message = document.getElementById("searchAdminLoginMessage");
      const passwordHash = hashPassword(value("searchAdminPassword"));
      if (passwordHash !== ADMIN_PASSWORD_HASH) {
        message.innerHTML = alertBox("Nieprawidłowe hasło.", "error");
        document.getElementById("searchAdminPassword").select();
        return;
      }
      state.adminUnlocked = true;
      try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch {}
      renderSearchAdmin();
    });
  }

  function buildSearchTermsEditor(searchTerms) {
    return Object.entries(searchTerms || {}).map(([category, phrases], index) => `
      <details class="search-dictionary-category" data-search-category="${esc(normalizeSearchText(category))}"${index === 0 ? " open" : ""}>
        <summary><span>${esc(category)}</span><span class="admin-count">${phrases.length}</span></summary>
        <div class="search-dictionary-category__body">
          <p class="muted">Jedna fraza w każdym wierszu. Możesz dodawać nazwy potoczne, odmiany i typowe literówki.</p>
          <textarea data-search-terms-category="${esc(category)}" spellcheck="false">${esc(phrases.join("\n"))}</textarea>
        </div>
      </details>`).join("");
  }

  function filterSearchTermsEditor(query) {
    const normalized = normalizeSearchText(query);
    document.querySelectorAll(".search-dictionary-category").forEach(category => {
      const matches = !normalized || category.dataset.searchCategory.includes(normalized);
      category.classList.toggle("filtered-out", !matches);
      if (normalized && matches) category.open = true;
    });
  }

  function readSearchTermsFromEditor() {
    const updated = {};
    document.querySelectorAll("[data-search-terms-category]").forEach(textarea => {
      const category = textarea.dataset.searchTermsCategory;
      const phrases = textarea.value
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
      updated[category] = phrases;
    });
    return sanitizeSearchTerms(updated, state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
  }

  function saveSearchTerms() {
    const message = document.getElementById("searchDictionaryMessage");
    try {
      state.searchTerms = readSearchTermsFromEditor();
      localStorage.setItem(SEARCH_TERMS_OVERRIDE_KEY, JSON.stringify(state.searchTerms));
      document.getElementById("adminSearchStatus").textContent = "Używany jest słownik zapisany w tej przeglądarce";
      document.querySelector(".status-dot").classList.add("active");
      renderNavigation();
      message.innerHTML = alertBox("Frazy zostały zapisane i wyszukiwarka już z nich korzysta.", "success");
      showToast("Zapisano słownik wyszukiwarki");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
    }
  }

  function downloadSearchTermsJson() {
    const terms = readSearchTermsFromEditor();
    const data = JSON.stringify(terms, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "application/json;charset=utf-8" }));
    link.download = "search-terms.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importSearchTerms(event) {
    const file = event.target.files[0];
    if (!file) return;
    const message = document.getElementById("searchDictionaryMessage");
    try {
      const imported = JSON.parse(await file.text());
      if (!isValidSearchTermsFile(imported)) throw new Error("Wybrany plik nie ma prawidłowej struktury słownika.");
      state.searchTerms = sanitizeSearchTerms(imported, state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
      localStorage.setItem(SEARCH_TERMS_OVERRIDE_KEY, JSON.stringify(state.searchTerms));
      renderNavigation();
      renderSearchAdmin();
      showToast("Wczytano search-terms.json");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
      event.target.value = "";
    }
  }

  function resetSearchTerms() {
    if (!window.confirm("Przywrócić frazy zapisane w pliku data/search-terms.json?")) return;
    localStorage.removeItem(SEARCH_TERMS_OVERRIDE_KEY);
    state.searchTerms = deepClone(state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
    renderNavigation();
    renderSearchAdmin();
    showToast("Przywrócono słownik z serwera");
  }

  function lockSearchAdmin() {
    state.adminUnlocked = false;
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {}
    state.page = "Start";
    renderNavigation();
    renderCurrentPage();
  }


  // 0.23.6: read-only cost previews for available form options.
  // Uses the same calculator and the current (including admin-overridden) prices.
  // No artificial price table and no change to the actual order calculation.
  window.Druk24ConfiguratorPricing = Object.freeze({
    page: () => state.page,
    preview(fieldId, candidate, values) {
      if (!state.prices || !values || typeof values !== "object") return null;
      const allowed = {
        "Wizytówki 24h": ["bcFinish", "bcSides", "bcQuantity"],
        "Ulotki 24h": ["flyFormat", "flyVariant", "flyQuantity"],
        "Plakaty 24h": ["posterFormat", "posterQty"],
        "Druk cyfrowy i ksero 24h": ["digPaper", "digSide", "digFormat", "digColor", "digQty"],
        "Folie i banery 24h": ["bannerMaterial", "bannerQty"],
        "Naklejki, etykiety i magnesy": ["stickProduct", "stickQty"],
        "Roll-upy i X-banery": ["rollSize", "rollQty"]
      };
      if (!(allowed[state.page] || []).includes(fieldId)) return null;
      const v = { ...values, [fieldId]: candidate };
      const n = id => Number(v[id]);
      let result;
      try {
        if (state.page === "Wizytówki 24h" && ["bcFinish", "bcSides", "bcQuantity"].includes(fieldId)) {
          if (v.bcPrint === "Offsetowy" && v.bcSides !== "Dwustronne") return null;
          result = C.calculateBusinessCards(state.prices, v.bcPrint, v.bcFinish, n("bcQuantity"), v.bcSides);
        } else if (state.page === "Ulotki 24h" && ["flyFormat", "flyVariant", "flyQuantity"].includes(fieldId)) {
          result = C.calculateFlyers(state.prices, v.flyPrint, v.flyVariant, v.flyFormat, n("flyQuantity"));
        } else if (state.page === "Plakaty 24h" && ["posterFormat", "posterQty"].includes(fieldId) && v.posterFormat !== "Własny wymiar") {
          result = C.calculatePosters(state.prices, v.posterPrint, v.posterFormat, n("posterQty"));
        } else if (state.page === "Druk cyfrowy i ksero 24h" && ["digPaper", "digSide", "digFormat", "digColor", "digQty"].includes(fieldId)) {
          if (v.digService === "Arkuszowanie 24h") return null;
          const svc = v.digService === "Druk cyfrowy 24h" ? "Druk cyfrowy" : v.digService === "Dla studentów 24h" ? "Dla studentów" : v.digService;
          result = C.calculateDigital(state.prices, svc, v.digColor, n("digQty"), v.digFormat || "A4", v.digPaper || "Standardowy 80 g", v.digSide || "Jednostronny");
        } else if (state.page === "Folie i banery 24h" && ["bannerMaterial", "bannerQty"].includes(fieldId)) {
          result = C.calculateBanner(state.prices, n("bannerWidth"), n("bannerHeight"), n("bannerQty"), v.bannerMaterial);
        } else if (state.page === "Naklejki, etykiety i magnesy" && ["stickProduct", "stickQty"].includes(fieldId)) {
          const surface = Object.prototype.hasOwnProperty.call(state.prices.naklejki.powierzchniowe, v.stickProduct);
          if (!surface) return null; // Taxi variants have a different quantity input.
          result = C.calculateStickers(state.prices, v.stickProduct, n("stickQty"), n("stickWidth"), n("stickHeight"));
        } else if (state.page === "Roll-upy i X-banery" && ["rollSize", "rollQty"].includes(fieldId)) {
          result = C.calculateRollup(state.prices, v.rollProduct, v.rollSize, n("rollQty"));
        } else {
          return null;
        }
        const cost = Number(result && typeof result === "object" ? result.price : result);
        return Number.isFinite(cost) && cost > 0 && cost <= MAX_ORDER_TOTAL ? Math.round(cost * 100) / 100 : null;
      } catch { return null; }
    },
    // Apply an available alternative using the real quote path. Never fabricate a cart item.
    apply(fieldId, candidate, expectedPrice, addToCart = false) {
      const form = content.querySelector(":scope > .card .form-grid");
      const control = form?.querySelector(`[id="${fieldId}"]`);
      if (!control || control.disabled || quoteCapture) return false;
      const values = {};
      form.querySelectorAll("input[id], select[id]").forEach(input => {
        if (input.type !== "file") values[input.id] = input.value;
      });
      if (control.tagName === "SELECT") {
        if (!Array.from(control.options).some(option => option.value === String(candidate) && !option.disabled)) return false;
      } else {
        const q = Number(candidate), min = Number(control.min || 1), max = control.max ? Number(control.max) : Infinity;
        if (control.type !== "number" || !Number.isSafeInteger(q) || q < min || q > max) return false;
      }
      const previewPrice = this.preview(fieldId, String(candidate), values);
      if (previewPrice === null || Math.abs(previewPrice - Number(expectedPrice)) > 0.011) {
        showToast("Cena wariantu się zmieniła. Porównaj ponownie.");
        return false;
      }
      const qtyId = fieldId === "flyFormat" ? "flyQuantity" : fieldId === "bcFinish" ? "bcQuantity" : null;
      const previousQty = qtyId ? form.querySelector(`[id="${qtyId}"]`)?.value : null;
      control.value = String(candidate);
      control.dispatchEvent(new Event("change", { bubbles: true }));
      if (qtyId && previousQty) {
        const qty = form.querySelector(`[id="${qtyId}"]`);
        if (qty && Array.from(qty.options).some(option => option.value === previousQty && !option.disabled)) {
          qty.value = previousQty;
          qty.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      const calculate = getQuoteCalculateButton();
      if (!calculate) return false;
      const capture = { quote: null };
      quoteCapture = capture;
      try { calculate.click(); }
      catch { /* Failed calculation must not add anything to the cart. */ }
      finally { quoteCapture = null; }
      if (!capture.quote || !Number.isFinite(Number(capture.quote.price)) ||
          Math.abs(Number(capture.quote.price) - previewPrice) > 0.011) {
        showToast("Parametry wymagają ponownego przeliczenia. Sprawdź formularz.");
        return false;
      }
      showQuote(capture.quote);
      if (addToCart) {
        const addButton = document.getElementById("addToCart");
        if (!addButton) return false;
        addButton.click();
      }
      return true;
    }
  });

  function renderBusinessCards() {
    const p = state.prices.wizytowki;
    content.innerHTML = `${header("Wizytówki 24h")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Format</label><select id="bcFormat">${options(p.formaty)}</select></div>
      <div class="field half"><label>Rodzaj druku</label><select id="bcPrint">${options(["Cyfrowy 24h", "Offsetowy"])}</select></div>
      <div class="field half"><label>Wykończenie</label><select id="bcFinish"></select></div>
      <div class="field half"><label>Ile stron zadrukować</label><select id="bcSides"></select></div>
      <div class="field"><label>Ilość sztuk</label><select id="bcQuantity"></select></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("bcPrint"), finish = document.getElementById("bcFinish"), sides = document.getElementById("bcSides"), qty = document.getElementById("bcQuantity");
    function refresh() {
      if (print.value === "Cyfrowy 24h") {
        finish.innerHTML = options(Object.keys(C.DIGITAL_FINISH_KEYS)); sides.innerHTML = options(["Jednostronne", "Dwustronne"]); sides.disabled = false;
        qty.innerHTML = options(Object.keys(p.cyfrowe[C.DIGITAL_FINISH_KEYS[finish.value]]));
      } else {
        finish.innerHTML = options(Object.keys(C.OFFSET_FINISH_KEYS)); sides.innerHTML = options(["Dwustronne"]); sides.disabled = false; // Offset supports only double-sided printing.
        qty.innerHTML = options(Object.keys(p.offsetowe[C.OFFSET_FINISH_KEYS[finish.value]]));
      }
    }
    print.addEventListener("change", refresh); finish.addEventListener("change", () => {
      const root = print.value === "Cyfrowy 24h" ? p.cyfrowe[C.DIGITAL_FINISH_KEYS[finish.value]] : p.offsetowe[C.OFFSET_FINISH_KEYS[finish.value]];
      qty.innerHTML = options(Object.keys(root));
    }); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const price = C.calculateBusinessCards(state.prices, print.value, finish.value, Number(qty.value), sides.value);
      showQuote({ title: "Wizytówki 24h", description: `${value("bcFormat")}, druk ${print.value.toLowerCase()}, ${finish.value}, ${sides.value.toLowerCase()}, ${qty.value} szt.`, price, details: [["Format", value("bcFormat")], ["Nakład", `${qty.value} szt.`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderFlyers() {
    const root = state.prices.ulotki;
    content.innerHTML = `${header("Ulotki 24h", "Papier 130 g, kolor dwustronny")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj druku</label><select id="flyPrint">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Rodzaj ulotki</label><select id="flyVariant"></select></div>
      <div class="field half"><label>Format</label><select id="flyFormat"></select></div>
      <div class="field half"><label>Ilość sztuk</label><select id="flyQuantity"></select></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("flyPrint"), variant = document.getElementById("flyVariant"), format = document.getElementById("flyFormat"), qty = document.getElementById("flyQuantity");
    function refreshVariants() { variant.innerHTML = options(Object.keys(root[print.value])); refreshFormats(); }
    function refreshFormats() { format.innerHTML = options(Object.keys(root[print.value][variant.value])); refreshQty(); }
    function refreshQty() { qty.innerHTML = options(Object.keys(root[print.value][variant.value][format.value])); }
    print.addEventListener("change", refreshVariants); variant.addEventListener("change", refreshFormats); format.addEventListener("change", refreshQty); refreshVariants();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const price = C.calculateFlyers(state.prices, print.value, variant.value, format.value, Number(qty.value));
      showQuote({ title: "Ulotki 24h", description: `${print.value}, ${variant.value}, format ${format.value}, ${qty.value} szt.`, price, details: [["Papier", "130 g"], ["Zadruk", "Kolor dwustronny"]] });
    } catch (e) { setResultError(e); } });
  }

  function renderBanners() {
    const root = state.prices.banery;
    content.innerHTML = `${header("Folie i banery 24h", "Realizacja standardowa: 24h")}<div class="card"><div class="form-grid">
      <div class="field"><label>Materiał</label><select id="bannerMaterial">${options(Object.keys(root))}</select></div>
      <div class="field third"><label>Szerokość [cm]</label><input id="bannerWidth" type="number" min="0.1" max="1000" step="0.1" value="100"></div>
      <div class="field third"><label>Wysokość [cm]</label><input id="bannerHeight" type="number" min="0.1" max="1000" step="0.1" value="100"></div>
      <div class="field third"><label>Ilość sztuk</label><input id="bannerQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="bannerInfo"></div><details><summary>Progi cenowe materiału</summary><div id="tierTable"></div></details>
    <div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const material = document.getElementById("bannerMaterial");
    function refresh() {
      const data = root[material.value];
      const isFilm = /^Folia\b/i.test(material.value);
      const widthInput = document.getElementById("bannerWidth");
      widthInput.min = "0.1";
      widthInput.max = "1000";
      const maxShortSide = /laminat/i.test(material.value) ? 135 : 160;
      const sizeInfo = `Maksymalny krótszy bok: ${maxShortSide} cm; dłuższy: do 1000 cm (niezależnie od orientacji). ${!isFilm ? "Minimalny krótszy bok baneru: 30 cm." : ""}`;
      document.getElementById("bannerInfo").innerHTML = (data.oczka_w_standardzie ? alertBox("✓ Oczka w standardzie", "success") : "") + alertBox(`${sizeInfo} ${LIMIT_CONTACT_TEXT}`, "info");
      const tiers = data.progi_cenowe || [];
      let previous = 0;
      const rows = tiers.length
        ? tiers.map(t => {
            const label = t.maks_m2 == null ? `powyżej ${previous} m²` : previous === 0 ? `do ${t.maks_m2} m²` : `powyżej ${previous} do ${t.maks_m2} m²`;
            previous = t.maks_m2 ?? previous;
            return `<tr><td>${label}</td><td>${money(t.cena_m2)} zł/m²</td></tr>`;
          }).join("")
        : `<tr><td>Każda powierzchnia</td><td>${money(data.cena_m2)} zł/m²</td></tr>`;
      document.getElementById("tierTable").innerHTML = `<table class="tier-table"><thead><tr><th>Powierzchnia</th><th>Cena</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    material.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateBanner(state.prices, numberValue("bannerWidth"), numberValue("bannerHeight"), numberValue("bannerQty"), material.value);
      const details = [["Łączna powierzchnia", `${num(result.totalArea)} m²`], ["Cena za m²", `${money(result.unitPrice)} zł`], ["Minimum zamówienia", `${money(result.minimumOrder)} zł`]];
      showQuote({ title: material.value, description: `${material.value}, ${value("bannerWidth")} × ${value("bannerHeight")} cm, ${value("bannerQty")} szt.`, price: result.price, details, meta: { productType: "banner", material: material.value, widthCm: numberValue("bannerWidth"), heightCm: numberValue("bannerHeight"), quantity: numberValue("bannerQty") } });
    } catch (e) { setResultError(e); } });
  }

  function renderStickers() {
    const root = state.prices.naklejki;
    const products = [...Object.keys(root.powierzchniowe), ...Object.keys(root.taxi)];
    content.innerHTML = `${header("Naklejki, etykiety i magnesy")}<div class="card"><div class="form-grid">
      <div class="field"><label>Rodzaj produktu</label><select id="stickProduct">${options(products)}</select></div>
      <div id="stickSurfaceFields" class="field" style="display:contents">
        <div class="field third"><label>Szerokość jednej sztuki [mm]</label><input id="stickWidth" type="number" min="30" max="500" step="1" value="100"></div>
        <div class="field third"><label>Wysokość jednej sztuki [mm]</label><input id="stickHeight" type="number" min="30" max="500" step="1" value="100"></div>
        <div class="field third"><label for="stickQty">Ilość sztuk</label><div class="d24-control-guide d24-sticker-hint">Podaj ilość potrzebnych naklejek lub etykiet.</div><input id="stickQty" type="number" min="1" step="1" value="80"></div>
      </div>
      <div id="stickTaxiFields" class="field hidden"><label>Ilość kompletów / sztuk</label><input id="stickTaxiQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="stickInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const product = document.getElementById("stickProduct");
    function refresh() {
      const surface = Object.prototype.hasOwnProperty.call(root.powierzchniowe, product.value);
      document.getElementById("stickSurfaceFields").classList.toggle("hidden", !surface);
      document.getElementById("stickTaxiFields").classList.toggle("hidden", surface);
      if (!surface) {
        document.getElementById("stickInfo").innerHTML = "";
        return;
      }

      const productData = root.powierzchniowe[product.value];
      const tiers = productData.progi_cenowe_mb || [];
      let previous = 0;
      const tierTable = tiers.length ? `<details><summary>Progi cenowe</summary><table class="tier-table"><thead><tr><th>Długość rozliczeniowa</th><th>Cena</th></tr></thead><tbody>${tiers.map(tier => {
        const label = tier.maks_mb == null
          ? `powyżej ${previous} mb`
          : previous === 0
            ? `do ${tier.maks_mb} mb`
            : `powyżej ${previous} do ${tier.maks_mb} mb`;
        previous = tier.maks_mb ?? previous;
        return `<tr><td>${label}</td><td>${money(tier.cena_mb)} zł/mb</td></tr>`;
      }).join("")}</tbody></table></details>` : "";

      document.getElementById("stickInfo").innerHTML =
        alertBox(`Minimalny wymiar: 30 × 30 mm. Maksymalny wymiar: 500 × 500 mm. Minimalne zamówienie: ${num(productData.minimum_m2, 1)} mb. Szerokość folii: 1000 mm. Do wymiaru produkcyjnego dodawane są 3 mm. ${LIMIT_CONTACT_TEXT}`, "info") +
        tierTable;
    }
    product.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const surface = Object.prototype.hasOwnProperty.call(root.powierzchniowe, product.value);
      const quantity = surface ? numberValue("stickQty") : numberValue("stickTaxiQty");
      const result = C.calculateStickers(state.prices, product.value, quantity, surface ? numberValue("stickWidth") : null, surface ? numberValue("stickHeight") : null);
      if (surface) {
        showQuote({ title: product.value, description: `${product.value}, ${value("stickWidth")} × ${value("stickHeight")} mm, zamawiana ilość ${quantity} szt.`, price: result.price, details: [["Naklejek w rzędzie", result.stickersPerRow], ["Liczba rzędów", result.rows], ["Łącznie wykonanych naklejek", result.totalStickers], ["Dodatkowych naklejek", result.extraStickers], ["Długość przed zaokrągleniem", `${num(result.baseLengthM, 3)} mb`], ["Długość rozliczeniowa", `${num(result.billedLengthM, 1)} mb`], ["Cena za mb", `${money(result.pricePerLinearMeter)} zł`], ["Wymiar produkcyjny", `${num(result.productionWidthMm, 1)} × ${num(result.productionHeightMm, 1)} mm`]], meta: { productType: "sticker", widthMm: numberValue("stickWidth"), heightMm: numberValue("stickHeight"), quantity } });
      } else showQuote({ title: product.value, description: `${product.value}, ${quantity} szt./kompletów`, price: result.price, details: [["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderNotepads() {
    const root = state.prices.notesy_i_bloczki;
    const productTypes = Object.keys(root);
    content.innerHTML = `${header("Notesy i bloczki", "Notesy klejone, spiralowane oraz bloczki samokopiujące")}
      <div class="card"><div class="form-grid">
        <div class="field half"><label>Rodzaj produktu</label><select id="noteType">${options(productTypes)}</select></div>
        <div class="field half"><label>Wariant</label><select id="noteVariant"></select></div>
        <div class="field half"><label>Format</label><select id="noteFormat"></select></div>
        <div class="field half"><label>Ilość sztuk</label><select id="noteQty"></select></div>
      </div>
      <div id="noteInfo"></div>
      <details open><summary>Cennik wybranego wariantu</summary><div id="notePriceTable"></div></details>
      <div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div>
      <div id="quoteArea"></div>`;

    const type = document.getElementById("noteType");
    const variant = document.getElementById("noteVariant");
    const format = document.getElementById("noteFormat");
    const quantity = document.getElementById("noteQty");
    const info = document.getElementById("noteInfo");
    const table = document.getElementById("notePriceTable");

    function currentVariantData() {
      return root[type.value].warianty[variant.value];
    }

    function refreshTable() {
      const data = currentVariantData();
      const quantities = Array.from(new Set(Object.values(data.formaty).flatMap(formatPrices => Object.keys(formatPrices))));
      const rows = Object.entries(data.formaty).map(([formatName, formatPrices]) => `<tr><th>${esc(formatName)}</th>${quantities.map(qty => `<td>${formatPrices[qty] == null ? "—" : `${money(formatPrices[qty])} zł`}</td>`).join("")}</tr>`).join("");
      table.innerHTML = `<table class="tier-table"><thead><tr><th>Format</th>${quantities.map(qty => `<th>${esc(qty)} szt.</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
      info.innerHTML = alertBox(data.opis, "info");
    }

    function refreshQuantities() {
      const formatPrices = currentVariantData().formaty[format.value];
      quantity.innerHTML = options(Object.keys(formatPrices));
      refreshTable();
    }

    function refreshFormats() {
      format.innerHTML = options(Object.keys(currentVariantData().formaty));
      refreshQuantities();
    }

    function refreshVariants() {
      variant.innerHTML = options(Object.keys(root[type.value].warianty));
      refreshFormats();
    }

    type.addEventListener("change", refreshVariants);
    variant.addEventListener("change", refreshFormats);
    format.addEventListener("change", refreshQuantities);
    refreshVariants();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateNotepads(state.prices, type.value, variant.value, format.value, Number(quantity.value));
      const quantityLabel = type.value === "Bloczki samokopiujące" ? "Liczba bloczków" : "Ilość notesów";
      showQuote({
        title: type.value,
        description: `${variant.value}, format ${format.value}, ${quantity.value} szt.`,
        price: result.price,
        details: [["Specyfikacja", result.description], ["Format", format.value], [quantityLabel, `${quantity.value} szt.`], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]],
        meta: { productType: "notepad", category: type.value, variant: variant.value, format: format.value, quantity: Number(quantity.value) }
      });
    } catch (e) { setResultError(e); } });
  }


  function renderCatalogPage(root, config) {
    const productTypes = Object.keys(root || {});
    if (!productTypes.length) {
      content.innerHTML = `${header(config.title, config.subtitle)}${alertBox("Brak pozycji w tej kategorii. Skontaktuj się z biuro@druk24.szczecin.pl.", "info")}`;
      return;
    }

    const prefix = config.prefix;
    content.innerHTML = `${header(config.title, config.subtitle)}
      <div class="card"><div class="form-grid">
        <div class="field half"><label>Rodzaj produktu</label><select id="${prefix}Type">${options(productTypes)}</select></div>
        <div class="field half"><label>Wariant</label><select id="${prefix}Variant"></select></div>
        <div class="field half"><label>Format</label><select id="${prefix}Format"></select></div>
        <div class="field half"><label>Ilość sztuk</label><select id="${prefix}Qty"></select></div>
      </div>
      <div id="${prefix}Info"></div>
      <details open><summary>Cennik wybranego wariantu</summary><div id="${prefix}PriceTable"></div></details>
      <div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div>
      <div id="quoteArea"></div>`;

    const type = document.getElementById(`${prefix}Type`);
    const variant = document.getElementById(`${prefix}Variant`);
    const format = document.getElementById(`${prefix}Format`);
    const quantity = document.getElementById(`${prefix}Qty`);
    const info = document.getElementById(`${prefix}Info`);
    const table = document.getElementById(`${prefix}PriceTable`);

    function currentVariantData() {
      return root[type.value].warianty[variant.value];
    }

    function refreshTable() {
      const data = currentVariantData();
      const quantities = Array.from(new Set(Object.values(data.formaty).flatMap(formatPrices => Object.keys(formatPrices))))
        .sort((a, b) => Number(a) - Number(b));
      const rows = Object.entries(data.formaty).map(([formatName, formatPrices]) => `<tr><th>${esc(formatName)}</th>${quantities.map(qty => `<td>${formatPrices[qty] == null ? "—" : `${money(formatPrices[qty])} zł`}</td>`).join("")}</tr>`).join("");
      table.innerHTML = `<table class="tier-table"><thead><tr><th>Format</th>${quantities.map(qty => `<th>${esc(qty)} szt.</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
      info.innerHTML = data.opis ? alertBox(data.opis, "info") : "";
    }

    function refreshQuantities() {
      const formatPrices = currentVariantData().formaty[format.value];
      quantity.innerHTML = options(Object.keys(formatPrices).sort((a, b) => Number(a) - Number(b)));
      refreshTable();
    }

    function refreshFormats() {
      format.innerHTML = options(Object.keys(currentVariantData().formaty));
      refreshQuantities();
    }

    function refreshVariants() {
      variant.innerHTML = options(Object.keys(root[type.value].warianty));
      refreshFormats();
    }

    type.addEventListener("change", refreshVariants);
    variant.addEventListener("change", refreshFormats);
    format.addEventListener("change", refreshQuantities);
    refreshVariants();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateCatalogProduct(root, type.value, variant.value, format.value, Number(quantity.value));
      showQuote({
        title: type.value,
        description: `${variant.value}, ${format.value}, ${quantity.value} szt.`,
        price: result.price,
        details: [["Specyfikacja", result.description], ["Format", format.value], ["Nakład", `${quantity.value} szt.`], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]],
        meta: { productType: config.productType, category: type.value, variant: variant.value, format: format.value, quantity: Number(quantity.value) }
      });
    } catch (e) { setResultError(e); } });
  }

  function buildCompanyMaterialsCatalog() {
    const root = deepClone(state.prices.materialy_firmowe || {});
    const preprint = state.prices.papier_firmowy?.preprint_90g_kolor_jednostronny;
    if (preprint && Object.keys(preprint).length) {
      root["Papier firmowy"] = {
        warianty: {
          "Preprint 90 g, kolor jednostronny": {
            opis: "Papier firmowy A4, preprint 90 g, druk kolorowy jednostronny.",
            formaty: deepClone(preprint)
          }
        }
      };
    }
    return root;
  }

  function renderCompanyMaterials() {
    renderCatalogPage(buildCompanyMaterialsCatalog(), {
      title: "Koperty, teczki i papier firmowy",
      subtitle: "Materiały firmowe, korespondencja i prezentacja ofert",
      prefix: "companyMaterials",
      productType: "company_materials"
    });
  }

  function renderCalendars() {
    renderCatalogPage(deepClone(state.prices.kalendarze || {}), {
      title: "Kalendarze",
      subtitle: "Kalendarze ścienne, listwowane, biuwary i piramidki",
      prefix: "calendar",
      productType: "calendar"
    });
  }

  function buildHospitalityCatalog() {
    const fixed = deepClone(state.prices.restauracje_hotele || {});
    const source = state.prices.notesy_i_bloczki || {};

    const waiterVariants = {};
    ["Notesy klejone", "Notesy spiralowane"].forEach(noteType => {
      const product = source[noteType];
      if (!product || !product.warianty) return;
      Object.entries(product.warianty).forEach(([variantName, variantData]) => {
        const filteredFormats = Object.fromEntries(
          Object.entries(variantData.formaty || {}).filter(([formatName]) => formatName !== "A4")
        );
        if (!Object.keys(filteredFormats).length) return;
        const shortType = noteType === "Notesy klejone" ? "Klejone" : "Spiralowane";
        waiterVariants[`${shortType} — ${variantName}`] = {
          opis: variantData.opis,
          formaty: filteredFormats
        };
      });
    });

    if (Object.keys(waiterVariants).length) {
      fixed["Notesy kelnerskie"] = { warianty: waiterVariants };
    }

    const copyPads = source["Bloczki samokopiujące"];
    if (copyPads && copyPads.warianty) {
      const variants = {};
      Object.entries(copyPads.warianty).forEach(([variantName, variantData]) => {
        const filteredFormats = Object.fromEntries(
          Object.entries(variantData.formaty || {}).filter(([formatName]) => formatName !== "A4")
        );
        if (Object.keys(filteredFormats).length) {
          variants[variantName] = { opis: variantData.opis, formaty: filteredFormats };
        }
      });
      if (Object.keys(variants).length) fixed["Bloczki samokopiujące"] = { warianty: variants };
    }

    return fixed;
  }

  function renderHospitality() {
    const root = buildHospitalityCatalog();
    const productTypes = Object.keys(root);
    content.innerHTML = `${header("Restauracje, hotele", "Druki i materiały dla gastronomii oraz hoteli")}
      <div class="card"><div class="form-grid">
        <div class="field half"><label>Rodzaj produktu</label><select id="hospitalityType">${options(productTypes)}</select></div>
        <div class="field half"><label>Wariant</label><select id="hospitalityVariant"></select></div>
        <div class="field half"><label>Format</label><select id="hospitalityFormat"></select></div>
        <div class="field half"><label>Ilość sztuk</label><select id="hospitalityQty"></select></div>
      </div>
      <div id="hospitalityInfo"></div>
      <details open><summary>Cennik wybranego wariantu</summary><div id="hospitalityPriceTable"></div></details>
      <div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div>
      <div id="quoteArea"></div>`;

    const type = document.getElementById("hospitalityType");
    const variant = document.getElementById("hospitalityVariant");
    const format = document.getElementById("hospitalityFormat");
    const quantity = document.getElementById("hospitalityQty");
    const info = document.getElementById("hospitalityInfo");
    const table = document.getElementById("hospitalityPriceTable");

    function currentVariantData() {
      return root[type.value].warianty[variant.value];
    }

    function refreshTable() {
      const data = currentVariantData();
      const quantities = Array.from(new Set(Object.values(data.formaty).flatMap(formatPrices => Object.keys(formatPrices))));
      const rows = Object.entries(data.formaty).map(([formatName, formatPrices]) => `<tr><th>${esc(formatName)}</th>${quantities.map(qty => `<td>${formatPrices[qty] == null ? "—" : `${money(formatPrices[qty])} zł`}</td>`).join("")}</tr>`).join("");
      table.innerHTML = `<table class="tier-table"><thead><tr><th>Format</th>${quantities.map(qty => `<th>${esc(qty)} szt.</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
      info.innerHTML = alertBox(data.opis, "info");
    }

    function refreshQuantities() {
      const formatPrices = currentVariantData().formaty[format.value];
      quantity.innerHTML = options(Object.keys(formatPrices));
      refreshTable();
    }

    function refreshFormats() {
      format.innerHTML = options(Object.keys(currentVariantData().formaty));
      refreshQuantities();
    }

    function refreshVariants() {
      variant.innerHTML = options(Object.keys(root[type.value].warianty));
      refreshFormats();
    }

    type.addEventListener("change", refreshVariants);
    variant.addEventListener("change", refreshFormats);
    format.addEventListener("change", refreshQuantities);
    refreshVariants();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateCatalogProduct(root, type.value, variant.value, format.value, Number(quantity.value));
      const quantityLabel = type.value === "Bloczki samokopiujące" ? "Liczba bloczków" : "Ilość sztuk";
      showQuote({
        title: type.value,
        description: `${variant.value}, format ${format.value}, ${quantity.value} szt.`,
        price: result.price,
        details: [["Specyfikacja", result.description], ["Format", format.value], [quantityLabel, `${quantity.value} szt.`], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]],
        meta: { productType: "hospitality", category: type.value, variant: variant.value, format: format.value, quantity: Number(quantity.value) }
      });
    } catch (e) { setResultError(e); } });
  }

  function renderPosters() {
    const root = state.prices.plakaty;
    const CUSTOM_FORMAT = "Własny wymiar";
    const largeFormatLabels = {
      A2: "A2 (42 × 59 cm)",
      A1: "A1 (59 × 84 cm)",
      A0: "A0 (84 × 120 cm)",
      B2: "B2 (50 × 70 cm)",
      B1: "B1 (70 × 100 cm)",
      B0: "B0 (100 × 140 cm)"
    };
    const lastStandardFormat = {};
    // 0.24.5: największy nakład plakatów wielkoformatowych wpisywany ręcznie (wcześniej 100).
    const POSTER_LARGE_MAX_QUANTITY = 30;
    let largeQuantity = "1";
    let ownQuantityMode = false;
    let ownQuantityChange = false;

    content.innerHTML = `${header("Plakaty 24h")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj druku</label><select id="posterPrint">${options(Object.keys(root))}</select></div>
      <div class="field d24-poster-format-field"><label>Format</label><select id="posterFormat"></select></div>
      <div id="posterCustomFields" class="field" style="display:contents"></div>
      <div class="field" id="posterQtyWrap"><label for="posterQty" id="posterQtyLabel">Ilość sztuk</label><select id="posterQty"></select>
        <button class="d24-poster-own-toggle" type="button" id="posterOwnQtyToggle" aria-pressed="false" aria-expanded="false" aria-controls="posterOwnQtyPanel">+ Własna ilość</button>
        <div class="d24-poster-own-panel" id="posterOwnQtyPanel" hidden>
          <label for="posterOwnQty">Wpisz liczbę plakatów</label>
          <div class="d24-poster-own-entry"><input id="posterOwnQty" type="number" min="1" max="30" step="1" inputmode="numeric" placeholder="Np. 17"></div>
          <div class="d24-poster-own-note" id="posterOwnQtyNote" role="status" aria-live="polite"></div>
        </div>
      </div>
    </div><div id="posterInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("posterPrint");
    const format = document.getElementById("posterFormat");
    const customFields = document.getElementById("posterCustomFields");
    const info = document.getElementById("posterInfo");
    const ownToggle = document.getElementById("posterOwnQtyToggle");
    const ownPanel = document.getElementById("posterOwnQtyPanel");
    const ownInput = document.getElementById("posterOwnQty");
    const ownNote = document.getElementById("posterOwnQtyNote");
    const posterQty = document.getElementById("posterQty");

    function updateOwnQuantityPanel() {
      ownPanel.hidden = !ownQuantityMode;
      ownToggle.setAttribute("aria-pressed", String(ownQuantityMode));
      ownToggle.setAttribute("aria-expanded", String(ownQuantityMode));
      ownToggle.textContent = ownQuantityMode ? "✓ Własna ilość" : "+ Własna ilość";
    }

    function setOwnQuantity() {
      if (!ownQuantityMode) return;
      const raw = ownInput.value.trim();
      const q = Number(raw);
      const isLarge = print.value === "Wielkoformatowy 24h";
      const maxQuantity = POSTER_LARGE_MAX_QUANTITY;
      const valid = raw !== "" && Number.isSafeInteger(q) && q >= 1 && q <= maxQuantity;
      let billingFormat = format.value;
      if (valid && isCustomFormat()) {
        try { billingFormat = resolveBilling().formatName; }
        catch { billingFormat = null; }
      }
      const priceData = !isLarge && billingFormat ? root[print.value]?.[billingFormat] : null;
      const hasCatalogPrice = valid && !!billingFormat && (isLarge || !!(priceData && Object.prototype.hasOwnProperty.call(priceData, String(q))));
      const existing = Array.from(posterQty.options).find(option => option.value === String(q) && !option.dataset.d24CustomOption);
      posterQty.querySelectorAll('option[data-d24-custom-option]').forEach(option => option.remove());
      if (valid && !existing) {
        const option = document.createElement("option");
        option.value = String(q);
        option.textContent = `${q} szt. (własna ilość)`;
        option.dataset.d24CustomOption = "1";
        posterQty.append(option);
      } else if (!valid) {
        const option = document.createElement("option");
        option.value = "__poster_custom_invalid__";
        option.textContent = "Wpisz poprawną ilość";
        option.dataset.d24CustomOption = "1";
        posterQty.append(option);
      }
      posterQty.value = valid ? String(q) : "__poster_custom_invalid__";
      if (isLarge && valid) largeQuantity = String(q);
      document.getElementById("quoteArea").replaceChildren();
      if (!valid) {
        ownNote.textContent = `Wpisz pełną liczbę sztuk od 1 do ${maxQuantity.toLocaleString("pl-PL")}.`;
        ownNote.dataset.status = "error";
      } else if (hasCatalogPrice) {
        ownNote.textContent = `Wybrano ${q} szt. Cena zostanie obliczona z aktualnego cennika.`;
        ownNote.dataset.status = "success";
      } else {
        ownNote.dataset.status = "notice";
        ownNote.textContent = "Ten nakład nie ma ceny w cenniku online. Zapytaj drukarnię o indywidualną cenę.";
        const inquiry = document.createElement("a");
        inquiry.className = "d24-poster-inquiry";
        inquiry.textContent = "Zapytaj o cenę dla tej ilości";
        const dimensions = isCustomFormat() ? getCustomSize() : null;
        const size = dimensions ? `${dimensions.widthCm} × ${dimensions.heightCm} cm` : format.value;
        const subject = `Plakaty — własna ilość ${q} szt.`;
        const body = `Dzień dobry, proszę o potwierdzenie ceny za ${q} szt. plakatów.\nTechnologia: ${print.value}\nFormat: ${size}`;
        inquiry.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        ownNote.append(document.createTextNode(" "),inquiry);
      }
      ownQuantityChange = true;
      posterQty.dispatchEvent(new Event("input", { bubbles: true }));
      posterQty.dispatchEvent(new Event("change", { bubbles: true }));
      ownQuantityChange = false;
    }

    ownToggle.addEventListener("click", () => {
      ownQuantityMode = !ownQuantityMode;
      updateOwnQuantityPanel();
      if (ownQuantityMode) {
        ownInput.value = posterQty.value && Number.isFinite(Number(posterQty.value)) ? posterQty.value : "";
        ownInput.max = String(POSTER_LARGE_MAX_QUANTITY);
        setOwnQuantity();
        ownInput.focus();
      } else {
        posterQty.querySelectorAll('option[data-d24-custom-option]').forEach(option => option.remove());
        refreshQty();
        posterQty.dispatchEvent(new Event("change", { bubbles:true }));
      }
    });
    ownInput.addEventListener("input", setOwnQuantity);
    ownInput.addEventListener("change", setOwnQuantity);

    function isCustomFormat() {
      return format.value === CUSTOM_FORMAT;
    }

    function formatLabel(formatName) {
      return print.value === "Wielkoformatowy 24h"
        ? (largeFormatLabels[formatName] || formatName)
        : formatName;
    }

    function getCustomSize() {
      return {
        widthCm: Number(document.getElementById("posterWidth")?.value),
        heightCm: Number(document.getElementById("posterHeight")?.value)
      };
    }

    function formatDimension(value) {
      const numeric = Number(value);
      return num(numeric, Number.isInteger(numeric) ? 0 : 1);
    }

    function resolveBilling() {
      if (!isCustomFormat()) {
        const dimensions = C.getPosterFormatDimensions(format.value) || {};
        return { formatName: format.value, ...dimensions };
      }
      const { widthCm, heightCm } = getCustomSize();
      return C.findPosterBillingFormat(state.prices, print.value, widthCm, heightCm);
    }

    function refreshCustomFields() {
      if (!isCustomFormat()) {
        customFields.innerHTML = "";
        return;
      }
      const fallbackFormat = lastStandardFormat[print.value] || Object.keys(root[print.value])[0];
      const dimensions = C.getPosterFormatDimensions(fallbackFormat) || { widthCm: 21, heightCm: 29.7 };
      customFields.innerHTML = `
        <div class="field half"><label>Szerokość plakatu [cm]</label><input id="posterWidth" type="number" min="0.1" step="0.1" value="${esc(dimensions.widthCm)}"></div>
        <div class="field half"><label>Wysokość plakatu [cm]</label><input id="posterHeight" type="number" min="0.1" step="0.1" value="${esc(dimensions.heightCm)}"></div>`;
      document.getElementById("posterWidth").addEventListener("input", refreshQty);
      document.getElementById("posterHeight").addEventListener("input", refreshQty);
    }

    function customBillingNotice(billing) {
      if (!isCustomFormat()) return "";
      const { widthCm, heightCm } = getCustomSize();
      return alertBox(`Własny wymiar ${formatDimension(widthCm)} × ${formatDimension(heightCm)} cm zostanie rozliczony jako pełny format ${formatLabel(billing.formatName)}.`, "success");
    }

    function refreshFormats() {
      const formatNames = Object.keys(root[print.value]);
      lastStandardFormat[print.value] = formatNames[0];
      format.innerHTML = [
        ...formatNames.map(formatName => `<option value="${esc(formatName)}">${esc(formatLabel(formatName))}</option>`),
        `<option value="${esc(CUSTOM_FORMAT)}">${esc(CUSTOM_FORMAT)}</option>`
      ].join("");
      refreshCustomFields();
      refreshQty();
    }

    function refreshQty() {
      const qty = document.getElementById("posterQty");
      const isLarge = print.value === "Wielkoformatowy 24h";
      const previousQty = isLarge ? largeQuantity : qty.value;
      let billing;
      try {
        billing = resolveBilling();
      } catch (error) {
        qty.disabled = true;
        qty.innerHTML = '<option value="">—</option>';
        info.innerHTML = alertBox(error.message, "error");
        return;
      }

      const formatData = root[print.value][billing.formatName];
      qty.disabled = false;
      // 0.24.5: „+ Własna ilość" tylko w druku wielkoformatowym; w cyfrze i offsecie znika.
      ownToggle.hidden = !isLarge;
      if (!isLarge && ownQuantityMode) {
        ownQuantityMode = false;
        ownNote.replaceChildren();
        ownInput.value = "";
        qty.querySelectorAll('option[data-d24-custom-option]').forEach(option => option.remove());
        updateOwnQuantityPanel();
      }
      if (isLarge) {
        // Wszystkie wartości 1–30 zostają w polu (asystent i presety zamówień z tekstu z nich korzystają).
        // 0.24.5: jako szybkie kafelki pokazujemy tylko 1, 3, 6, 10 i 20 — tak samo jak w druku cyfrowym
        // i offsetowym: sama ilość i cena łączna (bez ceny za sztukę).
        qty.dataset.d24FeaturedQuantities = "1,3,6,10,20";
        qty.dataset.d24NoUnitPrice = "1";
        const quantities = Array.from({ length: POSTER_LARGE_MAX_QUANTITY }, (_, index) => String(index + 1));
        qty.innerHTML = options(quantities);
        qty.value = quantities.includes(previousQty) ? previousQty : "1";
        largeQuantity = qty.value;
        const tiers = formatData.progi_ilosciowe || [];
        const rows = tiers.map((tier, index) => {
          const next = tiers[index + 1];
          const range = next
            ? (Number(tier.min_szt) === Number(next.min_szt) - 1
              ? `${tier.min_szt} szt.`
              : `${tier.min_szt}–${Number(next.min_szt) - 1} szt.`)
            : `od ${tier.min_szt} szt.`;
          return `<tr><td>${esc(range)}</td><td>${money(tier.cena_sztuki)} zł/szt.</td></tr>`;
        }).join("");
        info.innerHTML = `${customBillingNotice(billing)}${alertBox(`Papier satynowy 135 g. Możesz zamówić już od 1 sztuki; własny nakład od 1 do ${POSTER_LARGE_MAX_QUANTITY} sztuk. Własny wymiar jest liczony jak najmniejszy standardowy format, w którym mieści się cały plakat, również po obróceniu. ${LIMIT_CONTACT_TEXT}`, "info")}<details><summary>Cennik: ${esc(formatLabel(billing.formatName))}</summary><table class="tier-table"><thead><tr><th>Nakład</th><th>Cena jednostkowa</th></tr></thead><tbody>${rows}</tbody></table></details>`;
      } else {
        delete qty.dataset.d24FeaturedQuantities;
        delete qty.dataset.d24NoUnitPrice;
        const quantities = Object.keys(formatData);
        qty.innerHTML = options(quantities);
        if (quantities.includes(previousQty)) qty.value = previousQty;
        info.innerHTML = isCustomFormat()
          ? `${customBillingNotice(billing)}${alertBox("Własny wymiar jest liczony jak najmniejszy standardowy format, w którym mieści się cały plakat, również po obróceniu.", "info")}`
          : "";
      }
      if (ownQuantityMode) setOwnQuantity();
    }

    posterQty.addEventListener("change", event => {
      if (!ownQuantityChange && ownQuantityMode) {
        ownQuantityMode = false;
        ownNote.replaceChildren();
        posterQty.querySelectorAll('option[data-d24-custom-option]').forEach(option => option.remove());
        updateOwnQuantityPanel();
      }
      if (print.value === "Wielkoformatowy 24h" && Number.isSafeInteger(Number(event.target.value))) largeQuantity = event.target.value;
    });

    print.addEventListener("change", () => {
      ownQuantityMode = false;
      ownNote.replaceChildren();
      ownInput.value = "";
      updateOwnQuantityPanel();
      if (print.value === "Wielkoformatowy 24h") largeQuantity = "1";
      refreshFormats();
    });
    format.addEventListener("change", () => {
      if (!isCustomFormat()) lastStandardFormat[print.value] = format.value;
      refreshCustomFields();
      refreshQty();
    });
    refreshFormats();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const q = numberValue("posterQty");
      const custom = isCustomFormat();
      const customSize = custom ? getCustomSize() : null;
      const result = custom
        ? C.calculatePosterCustom(state.prices, print.value, customSize.widthCm, customSize.heightCm, q)
        : C.calculatePosters(state.prices, print.value, format.value, q);
      const billingFormat = custom ? result.billing.formatName : format.value;
      const paper = print.value === "Wielkoformatowy 24h" ? "Papier satynowy 135 g" : "Papier 170 g, kolor jednostronny";
      const shownBillingFormat = formatLabel(billingFormat);
      const shownFormat = custom ? `${formatDimension(customSize.widthCm)} × ${formatDimension(customSize.heightCm)} cm` : shownBillingFormat;
      const details = [["Materiał", paper]];
      if (custom) {
        details.push(["Własny wymiar", shownFormat], ["Format rozliczeniowy", shownBillingFormat]);
      } else {
        details.push(["Format", shownFormat]);
      }
      if (result && typeof result === "object") {
        details.push(["Cena jednostkowa", `${money(result.unitPrice)} zł`]);
      }
      showQuote({
        title: "Plakaty 24h",
        description: custom
          ? `${print.value}, własny wymiar ${shownFormat}, rozliczenie jak ${shownBillingFormat}, ${q} szt.`
          : `${print.value}, format ${shownFormat}, ${q} szt.`,
        price: result && typeof result === "object" ? result.price : result,
        details,
        meta: {
          productType: "poster",
          printType: print.value,
          format: billingFormat,
          widthCm: custom ? customSize.widthCm : undefined,
          heightCm: custom ? customSize.heightCm : undefined,
          customSize: custom,
          quantity: q
        }
      });
    } catch (e) { setResultError(e); } });
  }

  function renderRollup() {
    const root = state.prices.rollup;
    content.innerHTML = `${header("Roll-upy i X-banery")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj produktu</label><select id="rollProduct">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Szerokość / format</label><select id="rollSize"></select></div>
      <div class="field"><label>Ilość sztuk</label><input id="rollQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="rollInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const product = document.getElementById("rollProduct"), size = document.getElementById("rollSize");
    function refresh() {
      const productData = root[product.value];
      size.innerHTML = options(Object.keys(productData));
      const firstVariant = Object.values(productData)[0];
      const tierHeaders = [...firstVariant.progi_ilosciowe].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
      const rows = Object.entries(productData).map(([format, data]) => {
        const tiers = [...data.progi_ilosciowe].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
        return `<tr><td>${esc(format)}</td>${tiers.map(tier => `<td>${money(tier.cena_sztuki)} zł</td>`).join("")}</tr>`;
      }).join("");
      const headings = tierHeaders.map((tier, index) => {
        if (index === 0 && Number(tier.min_szt) === 1) return "1 szt.";
        const next = tierHeaders[index + 1];
        return next ? `${tier.min_szt}–${Number(next.min_szt) - 1} szt.` : `Od ${tier.min_szt} szt.`;
      });
      const note = product.value === "X-baner" ? "Format jest określony w wybranym wariancie." : "Wysokość roll-upu i wkładu: 200 cm.";
      document.getElementById("rollInfo").innerHTML = `${alertBox(note, "info")}<details><summary>Cennik brutto za sztukę</summary><table class="tier-table"><thead><tr><th>Format</th>${headings.map(label => `<th>${esc(label)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></details>`;
    }
    product.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const quantity = numberValue("rollQty");
      const result = C.calculateRollup(state.prices, product.value, size.value, quantity);
      const tierLabel = result.tierMinQuantity >= 5 ? "Od 5 sztuk" : result.tierMinQuantity >= 2 ? "2–4 sztuki" : "1 sztuka";
      showQuote({ title: product.value, description: `${product.value}, ${size.value}, ${quantity} szt.`, price: result.price, details: [["Próg ilościowy", tierLabel], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderRealEstate() {
    const serviceCards = [
      {
        key: "business-cards",
        title: "Wizytówki",
        description: "Dla agentów, pośredników, biur sprzedaży i deweloperów.",
        action: "Wybierz wizytówki"
      },
      {
        key: "boards",
        title: "Tablice PCV, plansze i banery",
        description: "Oznakowanie ofert, inwestycji, lokali i nieruchomości na sprzedaż lub wynajem.",
        action: "PCV i plansze",
        secondaryAction: "Banery"
      },
      {
        key: "owh",
        title: "Folia i OWH",
        description: "Grafika na witryny biur, szyby i powierzchnie reklamowe.",
        action: "Wybierz folię OWH"
      },
      {
        key: "folders",
        title: "Teczki ofertowe",
        description: "Do przekazywania ofert, umów, prezentacji inwestycji i dokumentów klienta.",
        action: "Wybierz teczki"
      },
      {
        key: "flyers",
        title: "Ulotki",
        description: "Oferty mieszkań, inwestycji, dni otwarte, skup i sprzedaż nieruchomości.",
        action: "Wybierz ulotki"
      },
      {
        key: "letterhead",
        title: "Papier firmowy",
        description: "Spójna korespondencja firmowa, oferty, pisma i dokumenty dla klientów.",
        action: "Wybierz papier firmowy"
      }
    ];

    content.innerHTML = `${header("Nieruchomości", "Komplet materiałów dla biur nieruchomości, pośredników i deweloperów")}
      <section class="industry-hub-hero">
        <span class="home-section-kicker">BRANŻOWE · NIERUCHOMOŚCI</span>
        <h2>Wszystko, czego potrzebujesz do prezentacji i oznakowania ofert</h2>
        <p>Ta kategoria zbiera w jednym miejscu najczęściej zamawiane materiały dla branży nieruchomości. Ceny są pobierane z tych samych kalkulatorów co w pozostałych częściach Drukulatora.</p>
        <div class="industry-hub-pills"><span>✓ Jedno wspólne zamówienie</span><span>✓ Aktualne ceny brutto</span><span>✓ Możesz łączyć kilka produktów</span></div>
      </section>
      <section class="industry-service-grid">
        ${serviceCards.map(card => `<article class="industry-service-card">
          <div class="industry-service-card__icon" aria-hidden="true">${card.key === "business-cards" ? "▣" : card.key === "boards" ? "▤" : card.key === "owh" ? "◫" : card.key === "folders" ? "▱" : card.key === "flyers" ? "▧" : "≣"}</div>
          <div class="industry-service-card__body"><h3>${esc(card.title)}</h3><p>${esc(card.description)}</p></div>
          <div class="industry-service-card__actions">
            <button class="button" type="button" data-realestate-action="${esc(card.key)}">${esc(card.action)}</button>
            ${card.secondaryAction ? `<button class="button secondary" type="button" data-realestate-action="banners">${esc(card.secondaryAction)}</button>` : ""}
          </div>
        </article>`).join("")}
      </section>
      ${alertBox("Dodaj wybrane produkty do jednego zamówienia. Nie tworzę osobnego cennika dla branży nieruchomości — każda pozycja korzysta z aktualnej ceny właściwego kalkulatora.", "info")}`;

    function openPreset(pageName, steps = []) {
      state.smartQuotePreset = steps.length
        ? { pageName, steps, autoCalculate: false, sourceQuery: "Nieruchomości" }
        : null;
      navigateToPage(pageName);
    }

    content.querySelectorAll("[data-realestate-action]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.realestateAction;
      analyticsTrack("industry_real_estate_select", { product: action });
      if (action === "business-cards") return openPreset("Wizytówki 24h");
      if (action === "boards") return openPreset("PCV i pianki", [["pvcProduct", "Folia z nadrukiem + PCV"]]);
      if (action === "banners") return openPreset("Folie i banery 24h", [["bannerMaterial", "Baner powlekany 510g"]]);
      if (action === "owh") return openPreset("Folie i banery 24h", [["bannerMaterial", "Folia OWH"]]);
      if (action === "folders") return openPreset("Koperty, teczki i papier firmowy", [["companyMaterialsType", "Teczki ofertowe"]]);
      if (action === "flyers") return openPreset("Ulotki 24h");
      if (action === "letterhead") return openPreset("Koperty, teczki i papier firmowy", [["companyMaterialsType", "Papier firmowy"]]);
    }));
  }

  function renderWedding() {
    const root = state.prices.sluby_wesela_imprezy;
    content.innerHTML = `${header("Śluby, wesela i imprezy", "Zaproszenia, plany stołów i dekoracje – ceny brutto")}
      <div class="card"><div class="form-grid">
        <div class="field half"><label>Rodzaj produktu</label><select id="weddingProduct">${options(Object.keys(root))}</select></div>
        <div class="field half"><label>Wariant</label><select id="weddingVariant"></select></div>
        <div class="field half"><label>Format</label><select id="weddingFormat"></select></div>
        <div class="field half"><label id="weddingQtyLabel">Ilość sztuk</label><select id="weddingQty"></select><input id="weddingQtyInput" class="hidden" type="number" min="1" step="1" value="1"></div>
      </div>
      <div id="weddingInfo"></div>
      <div class="actions">
        <button class="button" id="calculate">Oblicz cenę</button>
        <a class="button secondary" href="/oferta/sluby-wesela-imprezy/" target="_blank" rel="noopener">Pełna oferta ślubna</a>
      </div></div><div id="quoteArea"></div>`;

    const product = document.getElementById("weddingProduct");
    const variant = document.getElementById("weddingVariant");
    const format = document.getElementById("weddingFormat");
    const qtySelect = document.getElementById("weddingQty");
    const qtyInput = document.getElementById("weddingQtyInput");
    const qtyLabel = document.getElementById("weddingQtyLabel");
    const info = document.getElementById("weddingInfo");

    function productData() { return root[product.value]; }
    function variantData() { return productData().warianty[variant.value]; }

    function refreshQuantity() {
      const data = productData();
      const formatData = variantData()[format.value];
      const isPackage = data.tryb === "pakiet";
      qtySelect.classList.toggle("hidden", !isPackage);
      qtyInput.classList.toggle("hidden", isPackage);
      qtyLabel.textContent = "Ilość sztuk";
      if (isPackage) qtySelect.innerHTML = options(Object.keys(formatData));
      const pricingInfo = isPackage
        ? alertBox("Cena dotyczy całego wybranego nakładu.", "info")
        : alertBox("Cena z cennika dotyczy 1 sztuki i jest mnożona przez podaną ilość.", "info");
      info.innerHTML = pricingInfo + alertBox("Dekoracja stołów: standy, winietki, etykiety na wódkę i wino oraz zawieszki na alkohol są wyceniane indywidualnie.", "info");
    }

    function refreshFormats() {
      format.innerHTML = options(Object.keys(variantData()));
      refreshQuantity();
    }

    function refreshVariants() {
      variant.innerHTML = options(Object.keys(productData().warianty));
      refreshFormats();
    }

    product.addEventListener("change", refreshVariants);
    variant.addEventListener("change", refreshFormats);
    format.addEventListener("change", refreshQuantity);
    refreshVariants();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const isPackage = productData().tryb === "pakiet";
      const quantity = isPackage ? Number(qtySelect.value) : Number(qtyInput.value);
      const result = C.calculateWedding(state.prices, product.value, variant.value, format.value, quantity);
      const details = [
        ["Wariant", variant.value],
        ["Format", format.value],
        [isPackage ? "Nakład" : "Ilość sztuk", `${quantity} szt.`],
        [isPackage ? "Cena za sztukę w pakiecie" : "Cena jednostkowa", `${money(result.unitPrice)} zł`]
      ];
      showQuote({
        title: product.value,
        description: `${product.value}, ${variant.value}, ${format.value}, ${quantity} szt.`,
        price: result.price,
        details,
        meta: { productType: "wedding", category: product.value, variant: variant.value, format: format.value, quantity }
      });
    } catch (e) { setResultError(e); } });
  }

  function renderPvc() {
    const root = state.prices.pvc;
    content.innerHTML = `${header("PCV i pianki")}<div class="card"><div class="form-grid">
      <div class="field"><label>Rodzaj produktu</label><select id="pvcProduct">${options(Object.keys(root))}</select></div>
      <div id="pvcDynamic" class="field" style="display:contents"></div>
    </div><div id="pvcInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;

    const product = document.getElementById("pvcProduct");
    const dynamic = document.getElementById("pvcDynamic");
    const info = document.getElementById("pvcInfo");

    function isCuttingEnabled(data, defaultValue) {
      return typeof data?.doliczaj_ciecie_reczne === "boolean" ? data.doliczaj_ciecie_reczne : Boolean(defaultValue);
    }

    function cuttingInfo(data, defaultValue) {
      return isCuttingEnabled(data, defaultValue)
        ? `Cięcie ręczne jest doliczane automatycznie: obwód każdej sztuki × ilość × ${money(state.prices.meta?.ciecie_reczne_cena_mb ?? 5)} zł/mb.`
        : "Cięcie ręczne nie jest doliczane do ceny.";
    }

    function cuttingQuoteDetails(result) {
      if (!result.cuttingEnabled) return [];
      return [
        ["Łączny obwód cięcia", `${num(result.totalPerimeterM, 2)} mb`],
        ["Stawka cięcia ręcznego", `${money(result.cuttingRate)} zł/mb`],
        ["Koszt cięcia ręcznego", `${money(result.cuttingCost)} zł`]
      ];
    }

    function renderPvcFields(data) {
      dynamic.innerHTML = `
        <div class="field"><label>Grubość płyty</label><select id="pvcThickness">${options(Object.keys(data.grubosci).sort((a, b) => (parseFloat(b) || 0) - (parseFloat(a) || 0)))}</select></div>
        <div class="field third"><label>Wysokość jednej sztuki [cm]</label><input id="pvcHeight" type="number" min="0.1" max="300" step="0.1" value="50"></div>
        <div class="field third"><label>Szerokość jednej sztuki [cm]</label><input id="pvcWidth" type="number" min="0.1" max="300" step="0.1" value="50"></div>
        <div class="field third"><label>Ilość sztuk</label><input id="pvcQty" type="number" min="1" step="1" value="1"></div>`;

      const thickness = document.getElementById("pvcThickness");
      function refreshInfo() {
        const tiers = data.grubosci[thickness.value].progi_cenowe_m2;
        const rows = tiers.map((tier, index) => {
          const range = index === 0 ? "Poniżej 2 m²" : tier.maks_m2 == null ? "Powyżej 5 m²" : "Od 2 do 5 m²";
          return `<tr><td>${range}</td><td>${money(tier.cena_m2)} zł/m²</td></tr>`;
        }).join("");
        info.innerHTML = `${alertBox(`Maksymalny wymiar: 160 × 300 cm, również po obróceniu. ${cuttingInfo(data, true)} ${LIMIT_CONTACT_TEXT}`, "info")}<details><summary>Cennik dla grubości ${esc(thickness.value)}</summary><table class="tier-table"><tbody>${rows}</tbody></table></details>`;
      }
      thickness.addEventListener("change", refreshInfo);
      refreshInfo();
    }

    function renderFoamFields(data) {
      const formatNames = Object.keys(data.formaty);
      dynamic.innerHTML = `
        <div class="field half"><label>Sposób wyboru wymiaru</label><select id="foamMode">${options(["Format z cennika", "Inny wymiar"], "Format z cennika")}</select></div>
        <div class="field half" id="foamFormatField"><label>Format</label><select id="foamFormat">${options(formatNames)}</select></div>
        <div id="foamCustomFields" class="field" style="display:contents"></div>
        <div class="field" id="foamQtyField"><label>Ilość sztuk</label><input id="pvcQty" type="number" min="1" step="1" value="1"></div>`;

      // 0.24.3: kafelki formatów pianki — bez rozmiarów w mm, za to z ceną za sztukę z cennika (brutto), na niebiesko.
      const foamFormatSelect = document.getElementById("foamFormat");
      foamFormatSelect.dataset.d24NoDetail = "1";
      for (const option of foamFormatSelect.options) {
        const unit = Number(data.formaty[option.value]?.cena_sztuki);
        if (Number.isFinite(unit)) option.dataset.d24FinalPrice = `${money(unit)} zł/szt.`;
      }
      content.dispatchEvent(new Event("d24-option-prices"));

      const mode = document.getElementById("foamMode");
      const formatField = document.getElementById("foamFormatField");
      const customFields = document.getElementById("foamCustomFields");
      const qtyField = document.getElementById("foamQtyField");
      const rows = Object.entries(data.formaty).map(([name, item]) => `<tr><td>${esc(name)}</td><td>${money(item.cena_sztuki)} zł/szt.</td></tr>`).join("");
      info.innerHTML = `${alertBox(`Pianki są rozliczane wyłącznie na pełne sztuki. Maksymalny wymiar: 100 × 140 cm, również po obróceniu. Inne wymiary mieszczące się w formatach cennikowych są rozliczane według najmniejszego pasującego formatu; większe wymagają kontaktu. ${cuttingInfo(data, false)} ${LIMIT_CONTACT_TEXT}`, "info")}<details><summary>Cennik plansz z pianki 5 mm</summary><table class="tier-table"><thead><tr><th>Format</th><th>Cena brutto</th></tr></thead><tbody>${rows}</tbody></table></details>`;

      function refreshMode() {
        const custom = mode.value === "Inny wymiar";
        formatField.classList.toggle("hidden", custom);
        // Custom size: height, width and quantity share one row.
        qtyField.classList.toggle("third", custom);
        customFields.innerHTML = custom ? `
          <div class="field third d24-row-start"><label>Wysokość planszy [cm]</label><input id="pvcHeight" type="number" min="0.1" max="140" step="0.1" value="50"></div>
          <div class="field third"><label>Szerokość planszy [cm]</label><input id="pvcWidth" type="number" min="0.1" max="140" step="0.1" value="50"></div>` : "";
      }
      mode.addEventListener("change", refreshMode);
      refreshMode();
    }

    function refreshProduct() {
      const data = root[product.value];
      if (data.grubosci) renderPvcFields(data);
      else if (data.formaty) renderFoamFields(data);
    }

    // 0.24.2: osobny blok „Cena brutto za wybrany wariant” usunięty — cena jest raz, w bloku ceny niżej.
    product.addEventListener("change", refreshProduct);
    refreshProduct();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const data = root[product.value];
      const quantity = numberValue("pvcQty");

      if (data.grubosci) {
        const thickness = value("pvcThickness");
        const result = C.calculatePvc(state.prices, numberValue("pvcWidth"), numberValue("pvcHeight"), quantity, product.value, thickness);
        showQuote({ title: "Folia z nadrukiem + PCV", description: `${product.value}, płyta ${thickness}, ${value("pvcWidth")} × ${value("pvcHeight")} cm, ${quantity} szt.`, price: result.price, details: [["Łączna powierzchnia", `${num(result.totalArea)} m²`], ["Cena za m²", `${money(result.unitPrice)} zł`], ["Minimum zamówienia", `${money(result.minimumOrder)} zł`], [result.cuttingEnabled ? "Cena bez cięcia" : "Cena materiału", `${money(result.materialPrice)} zł`], ...cuttingQuoteDetails(result)], meta: { productType: "pvc", widthCm: numberValue("pvcWidth"), heightCm: numberValue("pvcHeight"), quantity } });
        return;
      }

      const mode = value("foamMode");
      if (mode === "Format z cennika") {
        const formatName = value("foamFormat");
        const result = C.calculateFoamBoardStandard(state.prices, product.value, formatName, quantity);
        showQuote({ title: "Plansza pianka 5 mm", description: `${formatName}, ${quantity} szt.`, price: result.price, details: [["Grubość", data.grubosc], [result.cuttingEnabled ? "Cena jednostkowa bez cięcia" : "Cena jednostkowa", `${money(result.unitPrice)} zł`], [result.cuttingEnabled ? "Cena bez cięcia" : "Cena materiału", `${money(result.materialPrice)} zł`], ...cuttingQuoteDetails(result)], meta: { productType: "foam", widthCm: Number(data.formaty[formatName].szerokosc_cm), heightCm: Number(data.formaty[formatName].wysokosc_cm), quantity } });
      } else {
        const width = numberValue("pvcWidth");
        const height = numberValue("pvcHeight");
        const result = C.calculateFoamBoardCustom(state.prices, product.value, width, height, quantity);
        showQuote({ title: "Plansza pianka 5 mm", description: `${width} × ${height} cm, ${quantity} szt.`, price: result.price, details: [["Grubość", data.grubosc], ["Format rozliczeniowy", result.billing.formatName], ["Sposób rozliczenia", result.billing.billingMethod], [result.cuttingEnabled ? "Cena jednostkowa bez cięcia" : "Cena jednostkowa", `${money(result.unitPrice)} zł`], [result.cuttingEnabled ? "Cena bez cięcia" : "Cena materiału", `${money(result.materialPrice)} zł`], ...cuttingQuoteDetails(result)], meta: { productType: "foam", widthCm: width, heightCm: height, quantity } });
      }
    } catch (e) { setResultError(e); } });
  }

  function renderDigital() {
    const root = state.prices.druk_cyfrowy_i_ksero;
    const imposition = root.arkuszowanie || {};
    const services = ["Druk cyfrowy 24h", "Ksero i druk", "Ksero książki", "Dla studentów 24h", "Skanowanie", "Arkuszowanie 24h"];
    content.innerHTML = `${header("Druk cyfrowy i ksero 24h")}<div class="card"><div class="form-grid">
      <div class="field"><label>Rodzaj usługi</label><select id="digService">${options(services)}</select></div>
      <div id="digitalDynamic" class="field" style="display:contents"></div>
    </div><div id="digitalInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const service = document.getElementById("digService"), dynamic = document.getElementById("digitalDynamic");
    const standardPapers = ["Standardowy 80 g", "Papier kredowy 130 g", "Papier kredowy 170 g", "Papier kredowy 250 g", "Papier kredowy 300 g", "Papier kredowy 350 g"];
    const blackPapers = ["Standardowy 80 g", "Papier kolorowy", "Papier etykietowy", ...standardPapers.slice(1)];
    const impositionPapers = imposition.papiery || standardPapers.filter(name => ["130 g", "170 g", "250 g", "300 g"].some(weight => name.includes(weight)));

    function refresh() {
      let html = "", note = "";
      if (service.value === "Arkuszowanie 24h") {
        const sheetFormats = Object.keys(imposition.formaty_arkuszy || {});
        const bleed = Number(imposition.domyslny_spad_mm ?? 3);
        const margin = Number(imposition.margines_arkusza_mm ?? 3);
        html = `<div class="field third"><label>Szerokość netto [mm]</label><input id="digWidth" type="number" min="1" step="1" value="100"></div>
          <div class="field third"><label>Wysokość netto [mm]</label><input id="digHeight" type="number" min="1" step="1" value="50"></div>
          <div class="field third"><label>Liczba gotowych sztuk</label><input id="digQty" type="number" min="1" step="1" value="100"></div>
          <div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.druk_cyfrowy), "Kolorowy")}</select></div>
          <div class="field half"><label>Ile stron zadrukować</label><select id="digSide">${options(Object.keys(root.mnozniki_zadruku), "Jednostronny")}</select></div>
          <div class="field half"><label>Papier</label><select id="digPaper">${options(impositionPapers)}</select></div>
          <div class="field half"><label>Arkusz</label><select id="digSheet">${options(["Automatycznie", ...sheetFormats])}</select></div>`;
        note = `Kalkulator dodaje ${bleed} mm spadu z każdej strony, uwzględnia ${margin} mm marginesu arkusza i porównuje układ na SRA4 oraz SRA3. Cena korzysta z aktualnego cennika druku cyfrowego.`;
      } else if (service.value === "Druk cyfrowy 24h") {
        html = `<div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.druk_cyfrowy))}</select></div><div class="field half"><label>Format</label><select id="digFormat">${options(Object.keys(root.mnozniki_formatu))}</select></div><div class="field half"><label>Ile stron zadrukować</label><select id="digSide">${options(Object.keys(root.mnozniki_zadruku))}</select></div><div class="field half"><label>Rodzaj papieru</label><select id="digPaper"></select></div><div class="field"><label>Liczba kartek</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Druk dwustronny: cena druku × 2. Koszt papieru jest doliczany tylko raz.";
      } else if (service.value === "Ksero i druk") {
        html = `<div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.ksero_i_druk))}</select></div><div class="field half"><label>Format</label><select id="digFormat">${options(Object.keys(root.mnozniki_formatu))}</select></div><div class="field"><label>Rodzaj papieru</label><select id="digPaper">${options(standardPapers)}</select></div><div class="field"><label>Liczba kopii</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Format A3 kosztuje 2 razy więcej niż format A4.";
      } else if (service.value === "Ksero książki") {
        html = `<div class="field"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.ksero_ksiazki))}</select></div><div class="field"><label>Liczba stron</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Cena jest naliczana za każdą kopiowaną stronę.";
      } else if (service.value === "Dla studentów 24h") {
        html = `<div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.dla_studentow))}</select></div><div class="field half"><label>Format</label><select id="digFormat"></select></div><div class="field"><label>Liczba kopii</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Cennik studencki nie dotyczy kopiowania książek.";
      } else {
        html = `<div class="field"><label>Rodzaj skanowania</label><select id="digColor">${options(Object.keys(root.skanowanie))}</select></div><div class="field"><label>Liczba skanowanych stron</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Cena jest taka sama dla skanów czarno-białych i kolorowych.";
      }
      dynamic.innerHTML = html;
      document.getElementById("digitalInfo").innerHTML = alertBox(note, "info");
      if (service.value === "Druk cyfrowy 24h") {
        const color = document.getElementById("digColor"), paper = document.getElementById("digPaper");
        function setPaper() { paper.innerHTML = options(color.value === "Czarno-biały" ? blackPapers : standardPapers); }
        color.addEventListener("change", setPaper); setPaper();
      }
      if (service.value === "Dla studentów 24h") {
        const color = document.getElementById("digColor"), format = document.getElementById("digFormat");
        function setFormats() { format.innerHTML = options(Object.keys(root.dla_studentow[color.value])); }
        color.addEventListener("change", setFormats); setFormats();
      }
    }

    service.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const s = service.value;

      if (s === "Arkuszowanie 24h") {
        const widthMm = numberValue("digWidth");
        const heightMm = numberValue("digHeight");
        const quantity = numberValue("digQty");
        const color = value("digColor");
        const side = value("digSide");
        const paper = value("digPaper");
        const sheetChoice = value("digSheet");
        const result = C.calculateDigitalImposition(state.prices, widthMm, heightMm, quantity, paper, color, side, sheetChoice);
        const comparisonRows = result.comparisons.map(item => `<tr class="${item.sheetFormat === result.sheetFormat ? "is-selected" : ""}">
          <td>${esc(item.sheetFormat)}${item.sheetFormat === result.recommendedFormat ? " — polecany" : ""}</td>
          <td>${item.piecesPerSheet}</td>
          <td>${item.sheets}</td>
          <td>${money(item.price)} zł</td>
        </tr>`).join("");
        document.getElementById("digitalInfo").innerHTML = `${alertBox(`Wybrany układ: ${result.sheetFormat}. Format polecany na podstawie ceny i liczby arkuszy: ${result.recommendedFormat}.`, "success")}
          <details open><summary>Porównanie SRA4 i SRA3</summary><div class="table-scroll"><table class="tier-table comparison-table"><thead><tr><th>Arkusz</th><th>Użytków/ark.</th><th>Arkuszy</th><th>Cena</th></tr></thead><tbody>${comparisonRows}</tbody></table></div></details>`;
        showQuote({
          title: "Arkuszowanie 24h",
          description: `${widthMm} × ${heightMm} mm, ${quantity} szt., ${paper}, ${color.toLowerCase()}, ${side.toLowerCase()}`,
          price: result.price,
          details: [
            ["Wymiar netto", `${num(result.netWidthMm, 0)} × ${num(result.netHeightMm, 0)} mm`],
            ["Wymiar ze spadem", `${num(result.productionWidthMm, 0)} × ${num(result.productionHeightMm, 0)} mm`],
            ["Spad", `${num(result.bleedMm, 0)} mm z każdej strony`],
            ["Arkusz", `${result.sheetFormat} — ${num(result.sheetWidthMm, 0)} × ${num(result.sheetHeightMm, 0)} mm`],
            ["Pole zadruku", `${num(result.usableWidthMm, 0)} × ${num(result.usableHeightMm, 0)} mm`],
            ["Układ", result.layoutDescription],
            ["Użytków na arkuszu", String(result.piecesPerSheet)],
            ["Potrzebne arkusze", String(result.sheets)],
            ["Łącznie wykonanych sztuk", String(result.totalPieces)],
            ["Dodatkowych sztuk", String(result.extraPieces)],
            ["Papier", paper],
            ["Próg cenowy druku", result.tier],
            ["Cena za zamówioną sztukę", `${money(result.pricePerOrderedPiece)} zł`]
          ]
        });
        return;
      }

      const color = value("digColor"), q = numberValue("digQty");
      const format = document.getElementById("digFormat")?.value || "A4", paper = document.getElementById("digPaper")?.value || "Standardowy 80 g", side = document.getElementById("digSide")?.value || "Jednostronny";
      const serviceKey = s === "Druk cyfrowy 24h"
        ? "Druk cyfrowy"
        : s === "Dla studentów 24h"
          ? "Dla studentów"
          : s;
      const result = C.calculateDigital(state.prices, serviceKey, color, q, format, paper, side);
      const details = [["Rodzaj usługi", s], ["Wariant", color], ["Ilość", q]];
      if (document.getElementById("digFormat")) details.push(["Format", format]);
      if (document.getElementById("digSide")) details.push(["Zadruk", side]);
      if (document.getElementById("digPaper")) details.push(["Papier", paper]);
      if (result.tier) details.push(["Próg cenowy", result.tier]);
      showQuote({ title: s, description: `${s}, ${color}, ${q} szt./stron`, price: result.price, details });
    } catch (e) { setResultError(e); } });
  }

  const FRONT_ONLY_CATEGORIES = ["Czapki", "Torby i worki"];

  function renderApparel() {
    const productRoot = state.prices.odziez_z_nadrukiem.produkty;
    // Keep bags and drawstring backpacks in one customer-facing group.
    const products = { ...productRoot, "Torby i worki": { ...(productRoot["Torby bawełniane"] || {}), ...(productRoot["Worki bawełniane"] || {}) } };
    delete products["Torby bawełniane"];
    delete products["Worki bawełniane"];
    const categories = Object.keys(products);
    const printSizes = Object.keys(productRoot["Sam nadruk"]?.["Nadruk na odzieży klienta"]?.ceny || {});
    content.innerHTML = `${header("Koszulki, odzież, torby i nadruki", "Wybierz produkt, nadruk i liczbę sztuk. Cenę brutto zobaczysz od razu.")}
      <div class="card"><div class="form-grid">
        <div class="field half"><label for="appCategory">Rodzaj produktu</label><select id="appCategory">${options(categories)}</select></div>
        <div class="field half"><label for="appProduct">Model</label><select id="appProduct"></select></div>
        <div class="field d24-apparel-print-option" id="appFrontField"><label for="appFront">Nadruk z przodu</label><select id="appFront">${options([...printSizes, C.NO_PRINT])}</select></div>
        <div class="field d24-apparel-print-option" id="appBackField"><label for="appBack">Nadruk z tyłu (nieobowiązkowy)</label><select id="appBack">${options([...printSizes, C.NO_PRINT])}</select></div>
        <div class="field half hidden" id="appPositionField"><label for="appPosition">Miejsce nadruku (1 nadruk w cenie)</label><select id="appPosition">${options(["Przód", "Tył"])}</select></div>
        <div class="field half"><label for="appQty">Ilość sztuk</label><input id="appQty" type="number" min="1" max="10000" step="1" value="1" aria-describedby="appQtyHint"><p id="appQtyHint" class="d24-apparel-qty-hint" aria-live="polite"></p></div>
        <div class="field"><label for="appRemarks">Dodatkowy opis (nieobowiązkowy)</label><textarea id="appRemarks" rows="3" maxlength="1000" placeholder="Np. podział sztuk na rozmiary i kolory, dokładne miejsce nadruku. Możesz zostawić puste — dopytamy mailowo."></textarea></div>
      </div>
      <section class="d24-apparel-catalog" id="d24ApparelCatalog" aria-label="Katalogowy podgląd odzieży"></section>
      <div id="appInfo"></div><div class="actions"><button class="button" id="calculate">Dodaj do koszyka</button></div>
      </div><div id="quoteArea"></div>`;
    const category = document.getElementById("appCategory");
    const product = document.getElementById("appProduct");
    const front = document.getElementById("appFront");
    const back = document.getElementById("appBack");
    const position = document.getElementById("appPosition");
    const qtyInput = document.getElementById("appQty");
    const qtyHint = document.getElementById("appQtyHint");
    const appInfo = document.getElementById("appInfo");
    const catalogPreview = window.D24MalfiniPreview?.mount(document.getElementById("d24ApparelCatalog"));

    // Model buttons show the final GROSS price of the whole order line for that model
    // (garment + chosen prints, current quantity and quantity discount), e.g. "890,00 zł".
    // Uses the SAME calculator as the cart; print buttons show no prices.
    function originalCategoryFor(modelName) {
      return category.value === "Torby i worki"
        ? (/work/i.test(modelName) ? "Worki bawełniane" : "Torby bawełniane")
        : category.value;
    }
    function refreshPrintOptionPrices() {
      const qty = Number(qtyInput.value);
      const validQuantity = Number.isSafeInteger(qty) && qty >= 1 && qty <= 10000;
      let changed = false;
      for (const option of product.options) {
        let priceText = "";
        const originalCategory = originalCategoryFor(option.value);
        const info = productRoot[originalCategory]?.[option.value];
        if (info && validQuantity) {
          const includedSize = info.nadruk_w_cenie ? Object.keys(info.ceny || {})[0] : null;
          const candidateFront = includedSize ? (position.value === "Przód" ? includedSize : C.NO_PRINT) : front.value;
          const candidateBack = includedSize ? (position.value === "Tył" ? includedSize : C.NO_PRINT) : back.value;
          try {
            const result = C.calculateApparel(state.prices, originalCategory, option.value, candidateFront, candidateBack, qty);
            priceText = `${money(result.price)} zł`;
          } catch (_) { /* Invalid combination (e.g. no print chosen): do not show a misleading price. */ }
        }
        if (option.dataset.d24FinalPrice !== priceText) {
          option.dataset.d24FinalPrice = priceText;
          changed = true;
        }
      }
      if (changed) content.dispatchEvent(new Event("d24-apparel-option-prices"));
    }

    function refreshPreview(showSide = '') {
      catalogPreview?.render({
        category: category.value,
        product: product.value
      });
      if (showSide) catalogPreview?.showView(showSide);
    }
    // Informational only: shows the quantity-discount tiers already defined in prices.json; the price itself
    // is still calculated by C.calculateApparel().
    function refreshQuantityHint() {
      const base = "Wpisz sumę wszystkich zamawianych sztuk (razem: rozmiary, kolory i kroje tego modelu).";
      if (category.value === "Sam nadruk") { qtyHint.textContent = `${base} Same nadruki nie podlegają rabatom ilościowym.`; return; }
      const tiers = [...(state.prices.odziez_z_nadrukiem.rabaty?.progi_ilosciowe || [])]
        .map(tier => ({ min: Number(tier.min_szt), percent: Number(tier.rabat_proc) }))
        .filter(tier => Number.isFinite(tier.min) && Number.isFinite(tier.percent))
        .sort((a, b) => a.min - b.min);
      const qty = Number(qtyInput.value);
      const valid = Number.isSafeInteger(qty) && qty >= 1;
      const reached = valid ? [...tiers].reverse().find(tier => qty >= tier.min) : null;
      const next = tiers.find(tier => !valid || tier.min > qty);
      let extra = "";
      if (reached && next) extra = ` Rabat przy tej ilości: ${reached.percent}%. Następny próg: ${next.min} szt. — ${next.percent}%.`;
      else if (reached) extra = ` Rabat przy tej ilości: ${reached.percent}% (najwyższy próg).`;
      else if (next) extra = ` Pierwszy rabat: od ${next.min} szt. — ${next.percent}%.`;
      qtyHint.textContent = `${base} Rabat naliczymy automatycznie.${extra}`;
    }
    function refreshProducts() {
      product.innerHTML = options(Object.keys(products[category.value] || {}));
      refreshDetails();
    }
    function refreshDetails() {
      const info = products[category.value]?.[product.value];
      const fixed = Boolean(info?.nadruk_w_cenie);
      // Caps and bags: printing only on the front, so there is no front/back choice at all.
      const frontOnly = fixed && FRONT_ONLY_CATEGORIES.includes(category.value);
      document.getElementById("appFrontField").classList.toggle("hidden", fixed);
      document.getElementById("appBackField").classList.toggle("hidden", fixed);
      document.getElementById("appPositionField").classList.toggle("hidden", !fixed || frontOnly);
      if (frontOnly) position.value = "Przód";
      if (!fixed) {
        front.value = printSizes[0] || C.NO_PRINT;
        back.value = C.NO_PRINT;
      }
      const included = fixed ? `W cenie: 1 nadruk${frontOnly ? " z przodu" : ""} (${Object.keys(info.ceny || {})[0] || "standardowy"}).` : "";
      const standalone = category.value === "Sam nadruk" ? " Same nadruki nie podlegają rabatom ilościowym." : "";
      appInfo.innerHTML = info?.opis || included || standalone
        ? alertBox([info?.opis, included + standalone].filter(Boolean).join(" "), "info")
        : "";
      refreshPrintOptionPrices();
      refreshQuantityHint();
      refreshPreview(fixed && position.value === "Tył" ? 'back' : '');
    }
    category.addEventListener("change", refreshProducts);
    product.addEventListener("change", refreshDetails);
    front.addEventListener("change", () => { refreshPrintOptionPrices(); refreshPreview('front'); });
    back.addEventListener("change", () => { refreshPrintOptionPrices(); refreshPreview('back'); });
    position.addEventListener("change", () => { refreshPrintOptionPrices(); refreshPreview(position.value === 'Tył' ? 'back' : 'front'); });
    qtyInput.addEventListener('input', () => { refreshPrintOptionPrices(); refreshQuantityHint(); });
    qtyInput.addEventListener('change', () => { refreshPrintOptionPrices(); refreshQuantityHint(); });
    refreshProducts();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const qty = numberValue("appQty");
      if (!Number.isSafeInteger(qty) || qty < 1 || qty > 10000) throw new Error("Podaj pełną liczbę sztuk od 1 do 10 000.");
      const comment = document.getElementById("appRemarks").value.trim();
      const selectedCategory = category.value;
      const originalCategory = selectedCategory === "Torby i worki" ? (/work/i.test(product.value) ? "Worki bawełniane" : "Torby bawełniane") : selectedCategory;
      const productData = productRoot[originalCategory]?.[product.value];
      if (!productData) throw new Error("Nie znaleziono cennika wybranego modelu.");
      const fixed = Boolean(productData.nadruk_w_cenie);
      const selectedPrint = fixed ? Object.keys(productData.ceny || {})[0] : null;
      const frontPrint = fixed ? (position.value === "Przód" ? selectedPrint : C.NO_PRINT) : front.value;
      const backPrint = fixed ? (position.value === "Tył" ? selectedPrint : C.NO_PRINT) : back.value;
      const result = C.calculateApparel(state.prices, originalCategory, product.value, frontPrint, backPrint, qty);
      const previewSelection = catalogPreview?.selection() || {};
      const color = previewSelection.colorName || "Do ustalenia";
      const cutLabel = previewSelection.cutLabel || "";
      const printDescription = [frontPrint !== C.NO_PRINT ? `przód: ${frontPrint}` : "", backPrint !== C.NO_PRINT ? `tył: ${backPrint}` : ""].filter(Boolean).join(", ");
      const description = `${selectedCategory} — ${product.value}, ${qty} szt.; nadruk ${printDescription}; ${cutLabel ? `krój: ${cutLabel}; ` : ""}kolor: ${color}; ${comment || "Pozostałe szczegóły ustalimy mailowo"}.`;
      const details = [["Ilość", `${qty} szt.`], ["Nadruk", printDescription]];
      if (cutLabel) details.push(["Krój (preferencja)", cutLabel]);
      details.push(["Kolor (preferencja)", color]);
      if (productData.cena_odziezy != null) details.push(["Odzież bez nadruku / szt.", `${money(result.garmentUnitPrice)} zł`]);
      if (!fixed) {
        if (frontPrint !== C.NO_PRINT) details.push(["Nadruk z przodu / szt.", `${money(Number(productRoot["Sam nadruk"]["Nadruk na odzieży klienta"].ceny[frontPrint]))} zł`]);
        if (backPrint !== C.NO_PRINT) details.push(["Nadruk z tyłu / szt.", `${money(Number(productRoot["Sam nadruk"]["Nadruk na odzieży klienta"].ceny[backPrint]))} zł`]);
      } else details.push(["Cena produktu z nadrukiem / szt.", `${money(result.baseUnitPrice)} zł`]);
      details.push(["Cena jednostkowa przed rabatem", `${money(result.unitPrice)} zł`]);
      if (selectedCategory === "Sam nadruk") details.push(["Rabat ilościowy", "Nie dotyczy samych nadruków"]);
      else if (result.discountPercent) details.push(["Rabat ilościowy", `${result.discountPercent}% (−${money(result.discountAmount)} zł)`]);
      details.push(["Cena jednostkowa brutto", `${money(result.discountedUnitPrice)} zł`]);
      if (comment) details.push(["Dodatkowy opis", comment]);
      showQuote({ title: product.value, description, price: result.price, details,
        meta: { productType: "apparel", category: originalCategory, product: product.value, quantity: qty,
          frontPrint, backPrint, color, colorCode: previewSelection.colorCode || "", cut: cutLabel, malfiniCode: previewSelection.modelCode || "", discountPercent: result.discountPercent } });
    } catch (error) { setResultError(error); } });
  }

  function renderBinding() {
    const bindings = state.prices.oprawa_prac.rodzaje_opraw, digital = state.prices.druk_cyfrowy_i_ksero.druk_cyfrowy;
    content.innerHTML = `${header("Druk i oprawa prac", "Druk cyfrowy A4 oraz oprawa dokumentu")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Tryb druku</label><select id="bindColor">${options(Object.keys(digital))}</select></div>
      <div class="field half"><label>Sposób zadruku</label><select id="bindSide">${options(["Jednostronny", "Dwustronny"])}</select></div>
      <div class="field half"><label>Liczba stron jednego dokumentu</label><input id="bindPages" type="number" min="1" step="1" value="80"></div>
      <div class="field half"><label>Liczba egzemplarzy</label><input id="bindCopies" type="number" min="1" step="1" value="1"></div>
      <div class="field half"><label>Rodzaj oprawy</label><select id="bindType">${options(Object.keys(bindings))}</select></div>
      <div class="field half"><label>Rozmiar oprawy / spirali</label><select id="bindVariant"></select></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const type = document.getElementById("bindType"), variant = document.getElementById("bindVariant");
    function refresh() { variant.innerHTML = options(Object.keys(bindings[type.value])); }
    type.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateWorkBinding(state.prices, numberValue("bindPages"), numberValue("bindCopies"), value("bindColor"), value("bindSide"), type.value, variant.value);
      showQuote({ title: "Druk i oprawa prac", description: `${value("bindCopies")} egz., po ${value("bindPages")} stron, ${value("bindColor")}, ${value("bindSide").toLowerCase()}, ${type.value} ${variant.value}`, price: result.price, details: [["Łączna liczba drukowanych stron", result.totalPrintedPages], ["Łączna liczba arkuszy", result.totalSheets], ["Próg cenowy druku", result.tier], ["Koszt druku", `${money(result.printTotal)} zł`], ["Koszt opraw", `${money(result.bindingTotal)} zł`], ["Cena jednego egzemplarza", `${money(result.pricePerCopy)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderLamination() {
    const root = state.prices.laminowanie;
    content.innerHTML = `${header("Laminowanie", `Laminowanie dokumentów folią ${root.folia_mikrony || 80} mikronów`)}<div class="card"><div class="form-grid">
      <div class="field half"><label>Format dokumentu</label><select id="lamFormat">${options(Object.keys(root.formaty))}</select></div>
      <div class="field half"><label>Ilość sztuk</label><input id="lamQty" type="number" min="1" step="1" value="1"></div>
    </div><details><summary>Cennik brutto</summary><table class="tier-table"><tbody>${Object.entries(root.formaty).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${money(v)} zł/szt.</td></tr>`).join("")}</tbody></table></details><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateLamination(state.prices, value("lamFormat"), numberValue("lamQty"));
      showQuote({ title: "Laminowanie", description: `Format ${value("lamFormat")}, ${value("lamQty")} szt., folia ${result.foilMicrons} µm`, price: result.price, details: [["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderCanvas() {
    const root = state.prices.obrazy_na_plotnie;
    content.innerHTML = `${header("Obrazy na płótnie", `${root.material || "Płótno"}; zakres boków: ${root.minimalny_bok_cm || 30}–${root.maksymalny_bok_cm || 150} cm`)}<div class="card"><div class="form-grid">
      <div class="field half"><label>Sposób wyboru rozmiaru</label><select id="canvasMode">${options(["Wybierz format z cennika", "Wpisz własny wymiar", "Dopasuj do zdjęcia"])}</select></div>
      <div class="field half"><label>Ilość obrazów</label><input id="canvasQty" type="number" min="1" max="10" step="1" value="1"></div>
      <div id="canvasDynamic" class="field" style="display:contents"></div>
    </div><div id="canvasMessage"></div>${alertBox(`Maksymalnie 10 jednakowych obrazów w jednym zamówieniu. ${LIMIT_CONTACT_TEXT}`, "info")}<div class="actions"><button class="button" id="calculateCanvas">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;

    const mode = document.getElementById("canvasMode");
    const dynamic = document.getElementById("canvasDynamic");
    const message = document.getElementById("canvasMessage");
    let imageInfo = null;

    // 0.24.2: podgląd produktu pokazuje format, według którego liczona jest cena (np. 70 × 104 → 70 × 110 cm).
    window.Druk24CanvasBilling = (widthCm, heightCm) => {
      try { return C.calculateCanvasCustom(state.prices, widthCm, heightCm, 1).billing; } catch (_) { return null; }
    };

    // „Dopasuj do zdjęcia → Podaj jeden bok”: wartość zmienia się co 10 cm, a wpisana ręcznie jest zaokrąglana w górę.
    const KNOWN_SIDE_STEP = 10;
    const knownSideMin = Math.ceil(Number(root.minimalny_bok_cm || 30) / KNOWN_SIDE_STEP) * KNOWN_SIDE_STEP;
    const knownSideMax = Math.floor(Number(root.maksymalny_bok_cm || 150) / KNOWN_SIDE_STEP) * KNOWN_SIDE_STEP;
    function roundKnownSide(rawValue) {
      const n = Number(String(rawValue ?? "").replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) return null;
      return Math.min(knownSideMax, Math.max(knownSideMin, Math.ceil(n / KNOWN_SIDE_STEP - 1e-9) * KNOWN_SIDE_STEP));
    }

    // The most frequently chosen sizes are shown first; the rest stay under "Pokaż wszystkie opcje".
    const POPULAR_CANVAS_FORMATS = ["30x40", "40x60", "50x70", "60x90", "70x100", "80x120", "100x140"];
    function orderedCanvasFormats() {
      const all = Object.keys(root.formaty);
      const popular = POPULAR_CANVAS_FORMATS.filter(key => all.includes(key));
      return [...popular, ...all.filter(key => !popular.includes(key))];
    }
    function standardFormatOptions() {
      return orderedCanvasFormats().map(formatKey => `<option value="${esc(formatKey)}">${esc(formatKey.replace("x", " × "))} cm</option>`).join("");
    }
    // Full price list of all canvas formats (plain table, no pictograms). A row picks the format.
    function renderCanvasPriceList() {
      const body = document.getElementById("canvasPriceListBody");
      const select = document.getElementById("canvasFormat");
      if (!body || !select) return;
      const quantity = numberValue("canvasQty");
      const showTotal = Number.isSafeInteger(quantity) && quantity > 1 && quantity <= 10;
      const rows = orderedCanvasFormats().map(formatKey => {
        const unit = Number(root.formaty[formatKey]);
        const selected = select.value === formatKey;
        return `<tr${selected ? ' class="is-selected"' : ""}><td><button type="button" class="d24-canvas-pick" data-canvas-format="${esc(formatKey)}" aria-pressed="${selected}">${esc(formatKey.replace("x", " × "))} cm</button></td><td>${money(unit)} zł</td>${showTotal ? `<td>${money(unit * quantity)} zł</td>` : ""}</tr>`;
      }).join("");
      body.innerHTML = `<table class="tier-table d24-canvas-prices"><thead><tr><th>Format</th><th>Cena brutto za sztukę</th>${showTotal ? `<th>Razem (${quantity} szt.)</th>` : ""}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    // Price under each format button: total gross price for the chosen quantity, e.g. "75,00 zł".
    function refreshCanvasFormatPrices() {
      const select = document.getElementById("canvasFormat");
      if (!select) return;
      const quantity = numberValue("canvasQty");
      let changed = false;
      for (const option of select.options) {
        let priceText = "";
        try { priceText = `${money(C.calculateCanvasStandard(state.prices, option.value, quantity).price)} zł`; }
        catch (_) { /* Invalid quantity: no price instead of a misleading one. */ }
        if (option.dataset.d24FinalPrice !== priceText) {
          option.dataset.d24FinalPrice = priceText;
          changed = true;
        }
      }
      if (changed) content.dispatchEvent(new Event("d24-option-prices"));
    }

    function isPdfFile(file) {
      return String(file?.type || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(String(file?.name || ""));
    }

    function revokeCanvasObjectUrl() {
      if (imageInfo?.url) URL.revokeObjectURL(imageInfo.url);
    }

    async function readPdfPageSize(file) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const header = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 1024)));
      if (!header.includes("%PDF-")) throw new Error("Wybrany plik nie jest prawidłowym plikiem PDF.");

      const pdfText = new TextDecoder("latin1").decode(bytes);
      const boxPatterns = [
        /\/CropBox\s*\[\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\]/,
        /\/MediaBox\s*\[\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\]/
      ];

      for (const pattern of boxPatterns) {
        const match = pdfText.match(pattern);
        if (!match) continue;
        const values = match.slice(1).map(Number);
        let widthPt = Math.abs(values[2] - values[0]);
        let heightPt = Math.abs(values[3] - values[1]);
        const rotationMatch = pdfText.match(/\/Rotate\s+(-?\d+)/);
        const rotation = rotationMatch ? ((Number(rotationMatch[1]) % 360) + 360) % 360 : 0;
        if (rotation === 90 || rotation === 270) [widthPt, heightPt] = [heightPt, widthPt];
        if (widthPt > 0 && heightPt > 0) {
          return {
            width: widthPt,
            height: heightPt,
            widthMm: widthPt * 25.4 / 72,
            heightMm: heightPt * 25.4 / 72,
            detected: true
          };
        }
      }
      return null;
    }

    function canvasFileDetails() {
      if (!imageInfo) return [];
      if (imageInfo.kind === "pdf") {
        return [["Rozmiar pierwszej strony PDF", `${num(imageInfo.pageWidthMm, 1)} × ${num(imageInfo.pageHeightMm, 1)} mm`]];
      }
      return [["Rozdzielczość pliku", `${imageInfo.width} × ${imageInfo.height} px`]];
    }

    function renderImageSizeOptions() {
      const holder = document.getElementById("canvasImageOptions");
      if (!holder || !imageInfo) return;
      const sizeMode = document.getElementById("canvasImageSizeMode").value;
      if (sizeMode === "Proponowane formaty") {
        const suggestions = C.getCanvasSuggestions(state.prices, imageInfo.width, imageInfo.height);
        imageInfo.suggestions = suggestions;
        holder.innerHTML = `<div class="field"><label>Proponowany format</label><select id="canvasSuggestion">${suggestions.map((item, index) => `<option value="${index}">${item.displayWidthCm} × ${item.displayHeightCm} cm — ${money(item.price)} zł/szt. — różnica proporcji ${num(item.ratioErrorPercent, 2)}%</option>`).join("")}</select></div>`;
        message.innerHTML = "";
      } else {
        holder.innerHTML = `<div class="field half"><label>Który bok podajesz?</label><select id="canvasKnownSide">${options(["Szerokość", "Wysokość"])}</select></div><div class="field half"><label for="canvasKnownValue">Wartość boku [cm]</label><input id="canvasKnownValue" type="number" min="${knownSideMin}" max="${knownSideMax}" step="${KNOWN_SIDE_STEP}" value="60" aria-describedby="canvasKnownHint"><small id="canvasKnownHint" class="d24-canvas-known-hint">Wartość zmienia się co ${KNOWN_SIDE_STEP} cm. Wpisaną liczbę zaokrąglamy w górę do pełnych ${KNOWN_SIDE_STEP} cm.</small></div>`;
        const updateProportionalSize = () => {
          try {
            const rounded = roundKnownSide(document.getElementById("canvasKnownValue").value);
            const result = C.calculateProportionalCanvasSize(state.prices, imageInfo.width, imageInfo.height, value("canvasKnownSide"), rounded ?? numberValue("canvasKnownValue"));
            message.innerHTML = alertBox(`Rozmiar z zachowaniem proporcji: ${num(result.widthCm, 1)} × ${num(result.heightCm, 1)} cm`, "success");
          } catch (error) {
            message.innerHTML = alertBox(error.message, "warning");
          }
        };
        document.getElementById("canvasKnownSide").addEventListener("change", updateProportionalSize);
        document.getElementById("canvasKnownValue").addEventListener("input", updateProportionalSize);
        // Ręcznie wpisana wartość jest po zakończeniu edycji zaokrąglana w górę do pełnych 10 cm.
        document.getElementById("canvasKnownValue").addEventListener("change", event => {
          const rounded = roundKnownSide(event.target.value);
          if (rounded !== null) event.target.value = String(rounded);
          updateProportionalSize();
        });
        updateProportionalSize();
      }
    }

    function renderCanvasFileWorkspace(info, previewHtml, noteHtml = "") {
      imageInfo = info;
      const workspace = document.getElementById("canvasImageWorkspace");
      workspace.innerHTML = `${previewHtml}${noteHtml}<div class="field"><label>Dopasowanie rozmiaru</label><select id="canvasImageSizeMode">${options(["Proponowane formaty", "Podaj jeden bok"])}</select></div><div id="canvasImageOptions" class="form-grid"></div>`;
      document.getElementById("canvasImageSizeMode").addEventListener("change", renderImageSizeOptions);
      renderImageSizeOptions();
      window.DrukulatorI18n?.refresh?.();
    }

    function renderPdfManualSize(file) {
      const workspace = document.getElementById("canvasImageWorkspace");
      imageInfo = {
        file,
        kind: "pdf",
        width: 210,
        height: 297,
        pageWidthMm: 210,
        pageHeightMm: 297,
        suggestions: [],
        manualPdfSize: true
      };
      workspace.innerHTML = `<div class="canvas-pdf-preview"><span class="canvas-pdf-preview__badge">PDF</span><div><strong>${esc(file.name)}</strong><small>${formatFileSize(file.size)}</small></div></div>
        ${alertBox("Nie udało się automatycznie odczytać rozmiaru strony PDF. Podaj rozmiar pierwszej strony — domyślnie ustawiono A4.", "warning")}
        <div class="form-grid"><div class="field half"><label>Szerokość strony PDF [mm]</label><input id="canvasPdfWidth" type="number" min="1" step="0.1" value="210"></div><div class="field half"><label>Wysokość strony PDF [mm]</label><input id="canvasPdfHeight" type="number" min="1" step="0.1" value="297"></div></div>
        <p class="muted">PDF zostanie automatycznie dodany do załączników po dodaniu produktu do koszyka.</p>
        <div class="field"><label>Dopasowanie rozmiaru</label><select id="canvasImageSizeMode">${options(["Proponowane formaty", "Podaj jeden bok"])}</select></div><div id="canvasImageOptions" class="form-grid"></div>`;

      const updatePdfSize = () => {
        const width = Number(document.getElementById("canvasPdfWidth")?.value);
        const height = Number(document.getElementById("canvasPdfHeight")?.value);
        if (!(width > 0) || !(height > 0)) return;
        imageInfo.width = width;
        imageInfo.height = height;
        imageInfo.pageWidthMm = width;
        imageInfo.pageHeightMm = height;
        renderImageSizeOptions();
      };
      document.getElementById("canvasPdfWidth").addEventListener("input", updatePdfSize);
      document.getElementById("canvasPdfHeight").addEventListener("input", updatePdfSize);
      document.getElementById("canvasImageSizeMode").addEventListener("change", renderImageSizeOptions);
      renderImageSizeOptions();
      window.DrukulatorI18n?.refresh?.();
    }

    async function handleCanvasFile(event) {
      const file = event.target.files[0];
      revokeCanvasObjectUrl();
      imageInfo = null;
      message.innerHTML = "";
      const workspace = document.getElementById("canvasImageWorkspace");
      if (!file) {
        workspace.innerHTML = alertBox("Wybierz zdjęcie lub plik PDF, aby dopasować format.", "info");
        return;
      }

      if (isPdfFile(file)) {
        workspace.innerHTML = alertBox("Odczytywanie rozmiaru pierwszej strony PDF…", "info");
        try {
          const pageSize = await readPdfPageSize(file);
          if (!pageSize) {
            renderPdfManualSize(file);
            return;
          }
          renderCanvasFileWorkspace(
            {
              file,
              kind: "pdf",
              width: pageSize.width,
              height: pageSize.height,
              pageWidthMm: pageSize.widthMm,
              pageHeightMm: pageSize.heightMm,
              suggestions: []
            },
            `<div class="canvas-pdf-preview"><span class="canvas-pdf-preview__badge">PDF</span><div><strong>${esc(file.name)}</strong><small>${formatFileSize(file.size)}</small></div></div>`,
            `<p class="muted">Rozmiar pierwszej strony: ${num(pageSize.widthMm, 1)} × ${num(pageSize.heightMm, 1)} mm. PDF zostanie automatycznie dodany do załączników po dodaniu produktu do koszyka.</p>`
          );
        } catch (error) {
          workspace.innerHTML = alertBox(error.message || String(error), "error");
        }
        return;
      }

      const extension = String(file.name || "").split(".").pop().toLowerCase();
      if (!["jpg", "jpeg", "png", "webp", "tif", "tiff"].includes(extension)) {
        workspace.innerHTML = alertBox("Obsługiwane są pliki PDF, JPG, PNG, WebP i TIFF.", "error");
        return;
      }

      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        renderCanvasFileWorkspace(
          { file, kind: "image", url, width: image.naturalWidth, height: image.naturalHeight, suggestions: [] },
          `<img class="image-preview" src="${url}" alt="Podgląd"><p class="muted">${esc(file.name)} — ${image.naturalWidth} × ${image.naturalHeight} px</p>`,
          `<p class="muted">Plik zostanie automatycznie dodany do załączników po dodaniu produktu do koszyka.</p>`
        );
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        workspace.innerHTML = alertBox("Nie można odczytać tego pliku obrazu.", "error");
      };
      image.src = url;
    }

    function refresh() {
      revokeCanvasObjectUrl();
      imageInfo = null;
      message.innerHTML = "";
      if (mode.value === "Wybierz format z cennika") {
        dynamic.innerHTML = `<div class="field"><label>Format obrazu</label><select id="canvasFormat" data-d24-initial-choices="${POPULAR_CANVAS_FORMATS.length}" data-d24-no-more="1">${standardFormatOptions()}</select></div>
          <div class="field"><details class="d24-canvas-pricelist" id="canvasPriceList"><summary>Pokaż wszystkie formaty i ceny (${orderedCanvasFormats().length})</summary><div id="canvasPriceListBody"></div></details></div>`;
        refreshCanvasFormatPrices();
        renderCanvasPriceList();
        document.getElementById("canvasPriceList").addEventListener("click", event => {
          const pick = event.target.closest("[data-canvas-format]");
          if (!pick) return;
          const select = document.getElementById("canvasFormat");
          select.value = pick.dataset.canvasFormat;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          renderCanvasPriceList();
          document.getElementById("canvasPriceList").open = false;
          select.closest(".field")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
        document.getElementById("canvasFormat").addEventListener("change", renderCanvasPriceList);
      } else if (mode.value === "Wpisz własny wymiar") {
        dynamic.innerHTML = `<div class="field half"><label>Szerokość [cm]</label><input id="canvasWidth" type="number" min="${root.minimalny_bok_cm || 30}" max="${root.maksymalny_bok_cm || 150}" step="0.1" value="60"></div><div class="field half"><label>Wysokość [cm]</label><input id="canvasHeight" type="number" min="${root.minimalny_bok_cm || 30}" max="${root.maksymalny_bok_cm || 150}" step="0.1" value="90"></div>`;
        message.innerHTML = alertBox("Własny wymiar jest rozliczany według najbliższego większego formatu z cennika.", "info");
      } else {
        dynamic.innerHTML = `<div class="field"><label>Wybierz plik PDF / JPG / PNG / WebP</label><input id="canvasFile" type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,image/tiff"></div><div id="canvasImageWorkspace" class="field">${alertBox("Wybierz zdjęcie lub plik PDF, aby dopasować format.", "info")}</div>`;
        document.getElementById("canvasFile").addEventListener("change", handleCanvasFile);
      }
      window.DrukulatorI18n?.refresh?.();
    }

    mode.addEventListener("change", refresh);
    document.getElementById("canvasQty").addEventListener("input", () => { refreshCanvasFormatPrices(); renderCanvasPriceList(); });
    document.getElementById("canvasQty").addEventListener("change", () => { refreshCanvasFormatPrices(); renderCanvasPriceList(); });
    refresh();

    document.getElementById("calculateCanvas").addEventListener("click", () => {
      try {
        const quantity = numberValue("canvasQty");
        if (mode.value === "Wybierz format z cennika") {
          const formatKey = value("canvasFormat");
          const result = C.calculateCanvasStandard(state.prices, formatKey, quantity);
          const [width, height] = formatKey.split("x");
          showQuote({ title: "Obrazy na płótnie", description: `${width} × ${height} cm, ${quantity} szt.`, price: result.price, details: [["Format cennikowy", formatKey], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]], meta: { productType: "canvas", quantity } });
          return;
        }
        if (mode.value === "Wpisz własny wymiar") {
          const width = numberValue("canvasWidth");
          const height = numberValue("canvasHeight");
          const result = C.calculateCanvasCustom(state.prices, width, height, quantity);
          showQuote({ title: "Obrazy na płótnie", description: `${num(width, 1)} × ${num(height, 1)} cm, ${quantity} szt.`, price: result.price, details: [["Format rozliczeniowy", result.billing.formatKey], ["Wymiar rozliczeniowy", `${result.billing.displayWidthCm} × ${result.billing.displayHeightCm} cm`], ["Sposób rozliczenia", result.billing.billingMethod], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]], meta: { productType: "canvas", quantity } });
          return;
        }
        if (!imageInfo) throw new Error("Najpierw wybierz zdjęcie lub plik PDF.");
        const fileDetails = canvasFileDetails();
        if (value("canvasImageSizeMode") === "Proponowane formaty") {
          const selected = imageInfo.suggestions[Number(value("canvasSuggestion"))];
          if (!selected) throw new Error("Nie udało się wybrać proponowanego formatu.");
          const result = C.calculateCanvasStandard(state.prices, selected.formatKey, quantity);
          showQuote({
            title: "Obrazy na płótnie",
            description: `${selected.displayWidthCm} × ${selected.displayHeightCm} cm, ${quantity} szt., plik ${imageInfo.file.name}`,
            price: result.price,
            details: [["Format cennikowy", selected.formatKey], ["Cena jednostkowa", `${money(result.unitPrice)} zł`], ["Różnica proporcji", `${num(selected.ratioErrorPercent, 2)}%`], ...fileDetails],
            meta: { productType: "canvas", quantity, fileName: imageInfo.file.name, fileType: imageInfo.kind },
            files: [imageInfo.file]
          });
        } else {
          const knownSideValue = roundKnownSide(document.getElementById("canvasKnownValue").value) ?? numberValue("canvasKnownValue");
          const proportional = C.calculateProportionalCanvasSize(state.prices, imageInfo.width, imageInfo.height, value("canvasKnownSide"), knownSideValue);
          const result = C.calculateCanvasCustom(state.prices, proportional.widthCm, proportional.heightCm, quantity);
          showQuote({
            title: "Obrazy na płótnie",
            description: `${num(proportional.widthCm, 1)} × ${num(proportional.heightCm, 1)} cm, ${quantity} szt., plik ${imageInfo.file.name}`,
            price: result.price,
            details: [["Format rozliczeniowy", result.billing.formatKey], ["Wymiar rozliczeniowy", `${result.billing.displayWidthCm} × ${result.billing.displayHeightCm} cm`], ["Sposób rozliczenia", result.billing.billingMethod], ["Cena jednostkowa", `${money(result.unitPrice)} zł`], ...fileDetails],
            meta: { productType: "canvas", quantity, fileName: imageInfo.file.name, fileType: imageInfo.kind },
            files: [imageInfo.file]
          });
        }
      } catch (error) {
        setResultError(error);
      }
    });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${num(bytes / 1024, 1)} KB`;
    return `${num(bytes / (1024 * 1024), 2)} MB`;
  }

  function validateOrderFiles(files) {
    if (files.length > ORDER_FILE_LIMIT) {
      throw new Error(`Można dołączyć maksymalnie ${ORDER_FILE_LIMIT} plików.`);
    }
    let total = 0;
    files.forEach(file => {
      const extension = String(file.name || "").split(".").pop().toLowerCase();
      if (!ORDER_FILE_ALLOWED_EXTENSIONS.has(extension)) {
        throw new Error(`Ten typ pliku nie jest obsługiwany: ${file.name}`);
      }
      if (!Number(file.size)) {
        throw new Error(`Nie można odczytać rozmiaru pliku: ${file.name}`);
      }
      total += Number(file.size || 0);
    });
    if (total > ORDER_FILE_MAX_TOTAL_BYTES) {
      throw new Error("Łączny rozmiar załączników może wynosić maksymalnie 50 MB.");
    }
    return total;
  }

  function renderOrderFileList() {
    // UI module never modifies orderFiles; the existing validation and upload remain authoritative.
    if (window.DrukulatorCheckoutUX?.renderFiles) {
      window.DrukulatorCheckoutUX.renderFiles();
      return;
    }
    const container = document.getElementById("orderFileList");
    if (!container) return;
    container.textContent = orderFiles.length
      ? `${orderFiles.length} plików do wysłania: ${orderFiles.map(file => file.name).join(", ")}`
      : "Nie wybrano plików.";
  }

  function removeOrderFile(index) {
    if (!Number.isInteger(index) || index < 0 || index >= orderFiles.length) return;
    orderFiles.splice(index, 1);
    renderOrderFileList();
    updateOrderText();
  }

  function addOrderFiles(incoming) {
    const status = document.getElementById("orderSendStatus");
    const fresh = (Array.isArray(incoming) ? incoming : Array.from(incoming || [])).filter(file =>
      !orderFiles.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)
    );
    try {
      const combined = [...orderFiles, ...fresh];
      validateOrderFiles(combined);
      orderFiles = combined;
      if (status) status.innerHTML = "";
    } catch (error) {
      if (status) status.innerHTML = alertBox(error.message || String(error), "error");
    }
    renderOrderFileList();
    updateOrderText();
  }

  function handleOrderFiles(event) {
    addOrderFiles(Array.from(event.target.files || []));
    event.target.value = "";
  }

  function orderTotalLabel(pickup = state.order.pickup) {
    return pickup === "Dostawa na terenie Szczecina" ? "Razem brutto z dostawą" : "Razem brutto";
  }

  function updateMobileCartBar() {
    if (!mobileCartBar || !mobileCartSummary) return;
    const count = state.cart.length;
    const total = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
    const totalWithDelivery = total + orderDeliveryFee(total);
    // Na stronie produktu pasek pokazuje aktualną cenę i „Dodaj do koszyka”;
    // koszyk jest wtedy małym przyciskiem z liczbą pozycji (tylko gdy coś w nim jest).
    mobileCartSummary.textContent = priceBarActive
      ? String(count)
      : count
        ? `${count} ${count === 1 ? "pozycja" : count >= 2 && count <= 4 ? "pozycje" : "pozycji"} • ${money(totalWithDelivery)} zł brutto`
        : "0 pozycji";
    mobileCartBar.classList.toggle("has-items", count > 0);
    mobileCartBar.classList.toggle("has-price", priceBarActive);
    if (mobileCartButton) mobileCartButton.hidden = priceBarActive && count === 0;
    mobileCartBar.hidden = !priceBarActive && count === 0;
    document.body.classList.toggle("has-price-bar", priceBarActive);
  }

  function updateQuoteDock() {
    const count = state.cart.length;
    const total = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
    if (quoteDock) quoteDock.classList.toggle("quote-dock--filled", count > 0);
    if (quoteDockDescription) quoteDockDescription.textContent = count
      ? `${count} ${count === 1 ? "produkt" : count >= 2 && count <= 4 ? "produkty" : "produktów"} w zamówieniu`
      : "Dodaj produkt do koszyka";
    if (quoteDockPrice) quoteDockPrice.hidden = count === 0;
    if (quoteDockTotalLabel) quoteDockTotalLabel.textContent = orderTotalLabel();
    if (quoteDockTotal) quoteDockTotal.textContent = `${money(total + orderDeliveryFee(total))} zł`;
    if (quoteDockOpen) quoteDockOpen.innerHTML = count
      ? 'Zobacz koszyk <span aria-hidden="true">↓</span>'
      : 'Wybierz produkt <span aria-hidden="true">→</span>';
  }

  function renderCart() {
    document.body.classList.toggle("has-cart-items", state.cart.length > 0);
    updateQuoteDock();
    if (!state.cart.length) {
      cartPanel.innerHTML = "";
      updateMobileCartBar();
      return;
    }
    const total = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
    cartPanel.innerHTML = `<div class="card cart-shell">
      <div class="cart-heading cart-heading--wide">
        <div><span class="cart-kicker">PODSUMOWANIE ZAMÓWIENIA</span><h2>Twoje zamówienie</h2><p>Sprawdź produkty i prześlij zamówienie do drukarni. Realizacja wymaga jej potwierdzenia wraz z terminem.</p></div>
        <span class="cart-count">${state.cart.length} ${state.cart.length === 1 ? "produkt" : state.cart.length < 5 ? "produkty" : "produktów"}</span>
      </div>
      <div class="cart-review-layout">
        <section class="cart-review-products" aria-label="Produkty w zamówieniu">
          <h3>Wybrane produkty</h3>
          <div class="cart-list">${state.cart.map((item, index) => `<article class="cart-card">
            <div class="d24-cart-row"><span class="d24-cart-number">${index + 1}</span><div class="d24-cart-data">
              <h4>${esc(displayProductName(item.title))}</h4><p>${esc(item.description)}</p>
              ${Array.isArray(item.details) && item.details.length ? `<details class="d24-cart-details"><summary>Zobacz konfigurację</summary><dl>${item.details.slice(0, 25).filter(entry => Array.isArray(entry)).map(([key, val]) => `<dt>${esc(key)}</dt><dd>${esc(val)}</dd>`).join("")}</dl></details>` : ""}
            </div></div>
            <div class="cart-card-footer"><strong>${item.meta?.requiresManualPrice ? "Do ustalenia" : `${money(item.price)} zł`}</strong><button class="button danger" data-remove="${esc(item.id)}" type="button">Usuń</button></div>
          </article>`).join("")}</div>
        </section>
        <section class="cart-review-summary" aria-label="Podsumowanie kosztów">
          <span class="cart-kicker">RAZEM BRUTTO</span>
          <div class="cart-total"><span id="cartFinalTotalLabel">${orderTotalLabel()}</span><strong id="cartFinalTotal">${money(total + orderDeliveryFee(total))} zł</strong></div>
          ${state.cart.some(item => item.meta?.requiresManualPrice) ? `<p class="d24-manual-cart-note">Niektóre produkty wymagają osobnego ustalenia ceny. Powyższa kwota nie obejmuje ich kosztu.</p>` : ""}
          <div class="d24-cart-total-hint">To nie jest zakup. Realizacja rozpocznie się dopiero po potwierdzeniu ceny i terminu przez drukarnię oraz Twojej akceptacji.</div>
          <section class="quote-share-card">
            <div class="quote-share-card__head"><div><span class="cart-kicker">Zapisz na później</span><h3>Udostępnij to zamówienie</h3></div><span class="quote-share-card__icon" aria-hidden="true">↗</span></div>
            <p>Utwórz prywatny link do tej konfiguracji. Link nie zawiera danych kontaktowych ani załączników.</p>
            <button class="button secondary full" id="saveQuoteLink" type="button">Utwórz link do zamówienia</button>
            <div id="shareQuoteStatus" class="quote-share-status" aria-live="polite"></div>
          </section>
          <div class="cart-utilities"><button class="button secondary" id="downloadCsv">Pobierz CSV</button><button class="button danger" id="clearCart">Wyczyść zamówienie</button></div>
        </section>
      </div>
      ${total + orderDeliveryFee(total) > MAX_ORDER_TOTAL ? alertBox(`Maksymalna wartość zamówienia przez kalkulator to ${money(MAX_ORDER_TOTAL)} zł brutto. ${LIMIT_CONTACT_TEXT}`, "warning") : ""}
      <div class="cart-order-zone">
        <div class="cart-order-zone__intro"><span class="cart-kicker">OSTATNI KROK</span><h3>Wyślij zamówienie</h3><p>Podaj dane kontaktowe, opcjonalnie dodaj pliki i prześlij zamówienie do Druk24.</p>
          <div class="d24-checkout-steps" aria-label="Etapy przesyłania zamówienia"><span><b>1</b> Kontakt i dostawa</span><span><b>2</b> Pliki i szczegóły (nieobowiązkowe)</span><span><b>3</b> Wyślij zamówienie</span></div>
        </div>
        ${renderOrderFormHtml(total)}
      </div>
    </div>`;
    cartPanel.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => { state.cart = state.cart.filter(item => String(item.id) !== button.dataset.remove); if (!state.cart.length) { orderFiles = []; window.DrukulatorCheckoutUX?.clear?.(); } saveState(); renderCart(); }));
    document.getElementById("clearCart").addEventListener("click", () => { state.cart = []; orderFiles = []; window.DrukulatorCheckoutUX?.clear?.(); saveState(); renderCart(); });
    document.getElementById("downloadCsv").addEventListener("click", downloadCsv);
    document.getElementById("saveQuoteLink").addEventListener("click", saveShareableQuote);
    document.getElementById("orderFiles").addEventListener("change", handleOrderFiles);
    window.DrukulatorCheckoutUX?.mount?.({
      getFiles: () => orderFiles,
      getCart: () => state.cart,
      addFiles: addOrderFiles,
      removeFile: removeOrderFile
    });
    ["orderName","orderEmail","orderPhone","orderNotes","orderDeliveryAddress"].forEach(id => document.getElementById(id).addEventListener("input", updateOrderText));
    document.getElementById("orderPickup").addEventListener("change", updateOrderText);
    document.getElementById("copySubject").addEventListener("click", () => copyText(document.getElementById("orderSubject").value));
    document.getElementById("copyOrder").addEventListener("click", () => copyText(document.getElementById("orderText").value));
    document.getElementById("sendOrder").addEventListener("click", sendOrderEmail);
    // Checkout intent only when the customer interacts with the contact form.
    cartPanel.querySelector(".order-card")?.addEventListener("focusin", () => analyticsTrack("checkout_view"), { once: true });
    renderOrderFileList();
    updateOrderText();
    updateMobileCartBar();
  }

  function cartForSharing() {
    return state.cart.map(item => {
      const shared = {
        title: String(item.title || ""),
        description: String(item.description || ""),
        price: Number(item.price),
        details: Array.isArray(item.details) ? item.details : []
      };
      if (item.meta && typeof item.meta === "object") shared.meta = item.meta;
      return shared;
    });
  }

  async function saveShareableQuote() {
    const button = document.getElementById("saveQuoteLink");
    const status = document.getElementById("shareQuoteStatus");
    if (!button || !status || !state.cart.length) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Tworzenie linku…";
    status.innerHTML = "";

    try {
      const response = await fetch(QUOTE_SHARE_ENDPOINT, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "Drukulator"
        },
        body: JSON.stringify({ cart: cartForSharing(), version: VERSION })
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result?.url) {
        throw new Error(result?.message || "Nie udało się utworzyć linku do koszyka.");
      }

      status.innerHTML = `<div class="quote-share-result">
        <strong>Link gotowy</strong>
        <p>Każda osoba posiadająca ten link może otworzyć to zamówienie. Link jest ważny do ${esc(result.expiresLabel || "daty podanej przez serwer")}.</p>
        <div class="quote-share-result__field"><input id="sharedQuoteUrl" type="text" readonly value="${esc(result.url)}"><button id="copySharedQuoteUrl" class="button secondary" type="button">Kopiuj link</button></div>
      </div>`;

      document.getElementById("copySharedQuoteUrl").addEventListener("click", async () => {
        await copyText(result.url);
      });

      try {
        await navigator.clipboard.writeText(result.url);
        showToast("Link do zamówienia skopiowany");
      } catch {
        showToast("Link do zamówienia jest gotowy");
      }
    } catch (error) {
      status.innerHTML = alertBox(error.message || String(error), "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function sanitizeLoadedSharedCart(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 30).map((item, index) => ({
      title: String(item?.title || "Pozycja"),
      description: String(item?.description || ""),
      price: Number(item?.price || 0),
      details: Array.isArray(item?.details) ? item.details : [],
      meta: item?.meta && typeof item.meta === "object" ? item.meta : undefined,
      id: Date.now() + index + Math.random()
    })).filter(item => Number.isFinite(item.price) && item.price >= 0);
  }

  async function loadSharedQuoteFromUrl() {
    let token = "";
    try {
      token = new URL(window.location.href).searchParams.get("q") || "";
    } catch {
      return false;
    }

    token = token.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,20}$/.test(token)) return false;

    try {
      const response = await fetch(`${QUOTE_SHARE_ENDPOINT}?q=${encodeURIComponent(token)}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !Array.isArray(result.cart)) {
        throw new Error(result?.message || "Nie udało się wczytać zapisanego zamówienia.");
      }

      const loadedCart = sanitizeLoadedSharedCart(result.cart);
      if (!loadedCart.length) throw new Error("Zapisane zamówienie jest puste.");

      if (state.cart.length) {
        const replace = window.confirm("Otworzyć zamówienie z linku? Aktualne zamówienie w tej przeglądarce zostanie zastąpione.");
        if (!replace) return false;
      }

      state.cart = loadedCart;
      saveState();
      return true;
    } catch (error) {
      setTimeout(() => window.alert(error.message || String(error)), 0);
      return false;
    }
  }


  // Delivery prices always use the merchandise subtotal, never the fee itself.
  function orderDeliveryFee(subtotal, pickup = state.order.pickup) {
    return pickup === "Dostawa na terenie Szczecina" ? (subtotal >= 300 ? 0 : 20) : 0;
  }
  function orderDeliveryLabel(subtotal, pickup = state.order.pickup) {
    if (pickup === "Dostawa na terenie Szczecina") return subtotal >= 300 ? "Dostawa w Szczecinie — GRATIS" : "Dostawa w Szczecinie — 20,00 zł";
    if (pickup === "Wysyłka kurierska (do ustalenia)") return "Kurier — koszt do potwierdzenia przez drukarnię";
    return "Odbiór osobisty — 0,00 zł";
  }
  function refreshCheckoutTotals() {
    const total = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
    const fee = orderDeliveryFee(total);
    const totalEl = document.getElementById("orderFinalTotal");
    const deliveryEl = document.getElementById("orderDeliveryCost");
    const caption = document.getElementById("orderDeliveryExplanation");
    const cartTotal = document.getElementById("cartFinalTotal");
    const cartTotalLabel = document.getElementById("cartFinalTotalLabel");
    const orderFinalTotalLabel = document.getElementById("orderFinalTotalLabel");
    if (cartTotalLabel) cartTotalLabel.textContent = orderTotalLabel();
    if (orderFinalTotalLabel) orderFinalTotalLabel.textContent = state.order.pickup === "Dostawa na terenie Szczecina" ? "Razem obecnie z dostawą — brutto" : "Razem obecnie — brutto";
    if (totalEl) totalEl.textContent = `${money(total + fee)} zł`;
    if (cartTotal) cartTotal.textContent = `${money(total + fee)} zł`;
    if (deliveryEl) deliveryEl.textContent = orderDeliveryLabel(total);
    if (caption) caption.textContent = state.order.pickup === "Wysyłka kurierska (do ustalenia)" ? "Podana kwota nie obejmuje kosztu kuriera, który potwierdzi drukarnia." : (total >= 300 && state.order.pickup === "Dostawa na terenie Szczecina" ? "Darmowa dostawa obowiązuje od 300 zł wartości produktów." : "Cena i termin wymagają potwierdzenia drukarni.");
    const address = document.getElementById("orderDeliveryAddressField");
    if (address) address.hidden = state.order.pickup !== "Dostawa na terenie Szczecina";
    const addressInput = document.getElementById("orderDeliveryAddress");
    if (addressInput) addressInput.required = state.order.pickup === "Dostawa na terenie Szczecina";
    updateQuoteDock();
    updateMobileCartBar();
  }

  function renderOrderFormHtml(total) {
    return `<section class="order-card">
      <div class="order-card__head"><span class="order-step-badge">1</span><div><h3>Kontakt i dostawa</h3><p>Podaj kontakt, żebyśmy mogli potwierdzić termin, dostępność i realizację.</p></div></div>
      <div class="order-form-grid">
        <div class="field"><label>Imię i nazwisko / firma *</label><input id="orderName" value="${esc(state.order.name)}" placeholder="np. Jan Kowalski / Firma ABC" autocomplete="name" required></div>
        <div class="field"><label>E-mail *</label><input id="orderEmail" type="email" value="${esc(state.order.email)}" autocomplete="email" placeholder="np. kontakt@firma.pl" required><small>Na ten adres wyślemy potwierdzenie otrzymania zamówienia.</small></div>
        <div class="field"><label>Telefon</label><input id="orderPhone" value="${esc(state.order.phone)}" autocomplete="tel" placeholder="np. 500 000 000"></div>
        <div class="field"><label>Sposób odbioru / dostawy</label><select id="orderPickup">${options(["Odbiór osobisty", "Dostawa na terenie Szczecina", "Wysyłka kurierska (do ustalenia)"], ["Odbiór osobisty", "Dostawa na terenie Szczecina", "Wysyłka kurierska (do ustalenia)"].includes(state.order.pickup) ? state.order.pickup : "Odbiór osobisty")}</select></div>
        <div class="field d24-shipping-address" id="orderDeliveryAddressField" ${state.order.pickup === "Dostawa na terenie Szczecina" ? "" : "hidden"}><label>Adres dostawy w Szczecinie *</label><input id="orderDeliveryAddress" maxlength="220" value="${esc(state.order.deliveryAddress || "")}" placeholder="Ulica, numer budynku/lokalu, Szczecin" autocomplete="street-address"></div>
      </div>
      <div class="d24-delivery-note" role="note"><strong id="orderDeliveryCost">${esc(orderDeliveryLabel(total))}</strong><small>Dostawa na terenie Szczecina: 20 zł, bezpłatnie przy wartości produktów od 300 zł. Wysyłka kurierska możliwa po uzgodnieniu kosztów z drukarnią.</small></div>
      <div class="order-section">
        <div class="order-section__title"><span class="order-step-badge">2</span><div><strong>Pliki i szczegóły (nieobowiązkowe)</strong><small>Możesz dodać projekt, ale nie jest to wymagane do przesłania zamówienia.</small></div></div>
        <div class="field"><label>Uwagi</label><textarea id="orderNotes" maxlength="3000" placeholder="Termin, sposób pakowania, dodatkowe informacje...">${esc(state.order.notes)}</textarea></div>
        <div class="field"><label>Załączniki</label>
          <div class="d24-file-dropzone" id="orderFileDropZone">
            <label class="order-files-input"><input id="orderFiles" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.svg,.ai,.eps,.psd,.cdr,.zip">
              <span class="order-files-input__icon" aria-hidden="true">↑</span><strong>Wybierz pliki lub przeciągnij je tutaj</strong><small>PDF, JPG, PNG, WebP, TIFF, AI, CDR, PSD, EPS, SVG lub ZIP. Możesz wybrać kilka plików jednocześnie.</small>
            </label>
          </div>
          <p class="d24-file-disclaimer">Limit: 5 plików, łącznie do 50 MB. Miniatury i kontrola zdjęć działają lokalnie — wysyłka nastąpi dopiero po kliknięciu „Wyślij zamówienie”.</p>
          <div class="d24-file-meter" id="d24FileMeter" aria-label="Wykorzystanie limitu załączników">
            <div class="d24-file-meter-text"><strong data-file-count>0 / 5 plików</strong><span data-file-usage>0 KB / 50 MB</span></div>
            <div class="d24-file-meter-track"><span data-file-bar></span></div>
          </div>
          <div id="orderFileList" class="order-file-list" aria-live="polite"></div>
        </div>
      </div>
      <div class="order-honeypot" aria-hidden="true"><label>Strona internetowa<input id="orderWebsite" type="text" tabindex="-1" autocomplete="off"></label></div>
      <div class="order-section order-section--submit">
        <div class="order-section__title"><span class="order-step-badge">3</span><div><strong>Wyślij zamówienie</strong><small>Samo wysłanie nie powoduje obowiązku zapłaty. Drukarnia potwierdzi cenę i termin przed realizacją.</small></div></div>
        <label class="privacy-check"><input id="orderPrivacy" type="checkbox"> <span>Zapoznałem/am się z <a href="/polityka-prywatnosci/" target="_blank" rel="noopener">polityką prywatności</a> i zgadzam się na kontakt w sprawie tego zamówienia. *</span></label>
        <div class="order-submit-summary"><span id="orderFinalTotalLabel">Razem obecnie — brutto</span><strong id="orderFinalTotal">${money(total + orderDeliveryFee(total))} zł</strong></div><p id="orderDeliveryExplanation" class="d24-delivery-explanation" aria-live="polite"></p>
        <div class="actions"><button id="sendOrder" class="button full button--primary-large" type="button"${Number(total + orderDeliveryFee(total)) > MAX_ORDER_TOTAL ? " disabled" : ""}>Wyślij zamówienie do Druk24</button></div>
        <div id="orderSendStatus" class="order-send-status" aria-live="polite"></div>
      </div>
      <details class="order-copy-details"><summary>Tekst wiadomości do ręcznego skopiowania</summary>
        <div class="field"><label>Temat wiadomości</label><div class="code-box"><input id="orderSubject" readonly><button id="copySubject" class="button secondary copy-button" type="button">Kopiuj</button></div></div>
        <div class="field"><label>Treść wiadomości</label><div class="code-box"><textarea id="orderText" readonly></textarea><button id="copyOrder" class="button secondary copy-button" type="button">Kopiuj</button></div></div>
      </details>
    </section>`;
  }

  function updateOrderText() {
    state.order = { name: value("orderName"), email: value("orderEmail"), phone: value("orderPhone"), pickup: value("orderPickup"), deliveryAddress: value("orderDeliveryAddress"), notes: value("orderNotes") };
    saveState();
    document.getElementById("orderSubject").value = "Zamówienie do potwierdzenia — Druk24";
    const total = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
    const lines = ["Dzień dobry,", "", "przesyłam zamówienie do weryfikacji w drukarni Druk24:", ""];
    state.cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.title}`, `   ${item.description}`);
      (item.details || []).forEach(([label, val]) => lines.push(`   ${label}: ${val}`));
      lines.push(`   Cena brutto: ${money(item.price)} zł`, "");
    });
    lines.push(`PRODUKTY BRUTTO: ${money(total)} zł`, `Dostawa: ${orderDeliveryLabel(total)}`, `RAZEM Z DOSTAWĄ: ${money(total + orderDeliveryFee(total))} zł${state.order.pickup === "Wysyłka kurierska (do ustalenia)" ? " (bez kosztu kuriera)" : ""}`, "", "Dane zamawiającego:", `Imię i nazwisko / firma: ${state.order.name || "—"}`, `E-mail: ${state.order.email || "—"}`, `Telefon: ${state.order.phone || "—"}`, `Sposób odbioru: ${state.order.pickup}`);
    if (state.order.pickup === "Dostawa na terenie Szczecina") lines.push(`Adres dostawy: ${state.order.deliveryAddress}, Szczecin`);
    lines.push("Termin realizacji do potwierdzenia przez drukarnię.");
    if (state.order.notes.trim()) lines.push("", "Uwagi do zamówienia:", state.order.notes.trim());
    if (orderFiles.length) lines.push("", "Załączniki:", ...orderFiles.map(file => `- ${file.name} (${formatFileSize(file.size)})`));
    lines.push("", "Proszę o potwierdzenie ceny, terminu realizacji oraz sposobu przekazania plików.", "", "Pozdrawiam,", state.order.name || "");
    document.getElementById("orderText").value = lines.join("\n").trimEnd();
    refreshCheckoutTotals();
    window.DrukulatorI18n?.refresh?.();
  }

  async function orderFetchJson(response, context) {
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      if (response.status === 413) throw new Error("Serwer odrzucił rozmiar przesyłanych danych (HTTP 413). Skontaktuj się z drukarnią lub dodaj mniejsze pliki.");
      if (response.status === 403) throw new Error("Serwer zablokował przesyłanie danych (HTTP 403). Sprawdź ustawienia zabezpieczeń hostingu.");
      if (response.status === 404) throw new Error(`${context}: na serwerze brakuje pliku obsługującego wysyłkę (HTTP 404).`);
      if (response.status >= 500) throw new Error(`${context}: błąd serwera (HTTP ${response.status}).`);
      throw new Error(`${context}: serwer zwrócił nieprawidłową odpowiedź (HTTP ${response.status}).`);
    }
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `${context}: błąd HTTP ${response.status}.`);
    }
    return data;
  }

  async function uploadOrderFilesInChunks(files, status) {
    const start = await fetch("upload-files.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Requested-With": "Drukulator" },
      body: JSON.stringify({ action: "start", files: files.map(file => ({ name: file.name, size: file.size })) })
    });
    const session = await orderFetchJson(start, "Przygotowanie załączników");
    if (!/^[a-f0-9]{48}$/.test(String(session.token || ""))) {
      throw new Error("Nie udało się otrzymać bezpiecznej sesji przesyłania plików.");
    }

    const defaultChunkSize = Math.min(8 * 1024 * 1024, Math.max(256 * 1024, Number(session.chunkSize) || 4 * 1024 * 1024));
    const minimumChunkSize = 256 * 1024;
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const started = performance.now();
    const abort = new AbortController();
    let uploaded = 0;
    let nextFile = 0;
    const activePieces = new Map();

    const showUploadProgress = () => {
      const inFlight = Array.from(activePieces.values()).reduce((sum, bytes) => sum + bytes, 0);
      const current = Math.min(totalBytes, uploaded + inFlight);
      const percentage = Math.min(100, Math.floor((current / totalBytes) * 100));
      const seconds = Math.max(0.25, (performance.now() - started) / 1000);
      const mbPerSecond = (current / 1048576 / seconds).toFixed(1);
      status.innerHTML = `<div class="d24-upload-progress" role="progressbar" aria-label="Wysyłanie załączników" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}">
        <strong>Wysyłanie załączników: ${percentage}%</strong>
        <div class="d24-upload-progress-track"><span style="width:${percentage}%"></span></div>
        <small>${mbPerSecond} MB/s · Nie zamykaj strony. Po przesłaniu plików zostanie wysłane zgłoszenie do drukarni.</small>
      </div>`;
    };

    // XMLHttpRequest reports real upload progress, including during a large fragment.
    const sendPiece = (formData, index, signal) => new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", "upload-files.php", true);
      request.withCredentials = true;
      request.setRequestHeader("X-Requested-With", "Drukulator");
      const abortRequest = () => request.abort();
      const finish = (callback, value) => {
        signal.removeEventListener("abort", abortRequest);
        activePieces.delete(index);
        callback(value);
      };
      request.upload.onprogress = event => {
        if (event.lengthComputable) {
          activePieces.set(index, event.loaded);
          showUploadProgress();
        }
      };
      request.onload = () => {
        let body;
        try { body = JSON.parse(request.responseText); }
        catch { body = { message: `Błąd serwera HTTP ${request.status}.` }; }
        if (request.status >= 200 && request.status < 300 && body.success) {
          finish(resolve, body);
        } else {
          const error = new Error(body.message || `Błąd serwera HTTP ${request.status}.`);
          error.httpStatus = request.status;
          finish(reject, error);
        }
      };
      request.onerror = () => finish(reject, new TypeError("Failed to fetch"));
      request.onabort = () => finish(reject, new Error("Przesyłanie przerwano."));
      signal.addEventListener("abort", abortRequest, { once: true });
      request.send(formData);
    });

    const uploadOneFile = async (file, index) => {
      let chunkSize = defaultChunkSize;
      let offset = 0;
      while (offset < file.size && !abort.signal.aborted) {
        const piece = file.slice(offset, Math.min(offset + chunkSize, file.size));
        const formData = new FormData();
        formData.append("action", "chunk");
        formData.append("token", session.token);
        formData.append("index", String(index));
        formData.append("offset", String(offset));
        formData.append("chunk", piece, "fragment.bin");
        let result = null;
        let retryWithSmallerChunk = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            result = await sendPiece(formData, index, abort.signal);
            break;
          } catch (error) {
            if (abort.signal.aborted) throw error;
            // The proxy may reject a large body with HTTP 413 or PHP may silently discard it.
            if ([400, 413].includes(error.httpStatus) && chunkSize > minimumChunkSize) {
              retryWithSmallerChunk = true;
              break;
            }
            const networkIssue = error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(String(error.message || ""));
            if (attempt === 2 || !networkIssue) throw error;
          }
        }
        if (retryWithSmallerChunk) {
          chunkSize = Math.max(minimumChunkSize, Math.floor(chunkSize / 2));
          continue;
        }
        if (!result || Number(result.received) !== offset + piece.size) {
          throw new Error("Serwer potwierdził nieprawidłowy rozmiar fragmentu. Spróbuj ponownie.");
        }
        offset += piece.size;
        uploaded += piece.size;
        showUploadProgress();
      }
    };

    // Przy wielu załącznikach dwie kolejki przesyłają pliki jednocześnie.
    const worker = async () => {
      while (nextFile < files.length && !abort.signal.aborted) {
        const index = nextFile++;
        try {
          await uploadOneFile(files[index], index);
        } catch (error) {
          abort.abort();
          throw error;
        }
      }
    };
    const results = await Promise.allSettled(Array.from({ length: Math.min(2, files.length) }, worker));
    const failed = results.find(result => result.status === "rejected");
    if (failed) {
      try {
        const cancel = new FormData();
        cancel.append("action", "cancel");
        cancel.append("token", session.token);
        await fetch("upload-files.php", { method: "POST", credentials: "same-origin", body: cancel });
      } catch {}
      throw failed.reason;
    }
    return session.token;
  }

  async function sendOrderEmail() {
    updateOrderText();

    const button = document.getElementById("sendOrder");
    const status = document.getElementById("orderSendStatus");
    const privacyAccepted = document.getElementById("orderPrivacy").checked;
    const website = document.getElementById("orderWebsite").value;

    if (!state.cart.length) {
      status.innerHTML = alertBox("Koszyk jest pusty.", "error");
      return;
    }
    const orderTotal = state.cart.reduce((sum, item) => sum + Number(item.price), 0) + orderDeliveryFee(state.cart.reduce((sum, item) => sum + Number(item.price), 0));
    if (orderTotal > MAX_ORDER_TOTAL) {
      window.alert(`Maksymalna wartość zamówienia przez kalkulator to ${money(MAX_ORDER_TOTAL)} zł brutto. ${LIMIT_CONTACT_TEXT}`);
      status.innerHTML = alertBox(`Maksymalna wartość zamówienia przez kalkulator to ${money(MAX_ORDER_TOTAL)} zł brutto. ${LIMIT_CONTACT_TEXT}`, "warning");
      return;
    }
    if (!state.order.name.trim()) {
      status.innerHTML = alertBox("Podaj imię i nazwisko albo nazwę firmy.", "error");
      document.getElementById("orderName").focus();
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(state.order.email.trim())) {
      status.innerHTML = alertBox("Podaj poprawny adres e-mail.", "error");
      document.getElementById("orderEmail").focus();
      return;
    }
    if (state.order.pickup === "Dostawa na terenie Szczecina" && state.order.deliveryAddress.trim().length < 5) {
      status.innerHTML = alertBox("Podaj ulicę i numer budynku dla dostawy w Szczecinie.", "error");
      document.getElementById("orderDeliveryAddress").focus();
      return;
    }
    if (!privacyAccepted) {
      status.innerHTML = alertBox("Zaznacz potwierdzenie zapoznania się z polityką prywatności.", "error");
      document.getElementById("orderPrivacy").focus();
      return;
    }

    try {
      validateOrderFiles(orderFiles);
    } catch (error) {
      status.innerHTML = alertBox(error.message || String(error), "error");
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Wysyłanie…";
    status.innerHTML = alertBox(orderFiles.length ? "Przygotowanie załączników do wysyłki…" : "Wysyłanie zamówienia do drukarni…", "info");

    try {
      const payload = {
        customer: {
          name: state.order.name,
          email: state.order.email,
          phone: state.order.phone,
          pickup: state.order.pickup,
          notes: state.order.notes,
          deliveryAddress: state.order.deliveryAddress || ""
        },
        cart: state.cart.map(item => ({
          title: item.title,
          description: item.description,
          price: Number(item.price),
          details: Array.isArray(item.details) ? item.details : [],
          meta: item.meta && typeof item.meta === "object" ? item.meta : null
        })),
        privacyAccepted,
        website,
        analyticsSession: analyticsSession()
      };
      if (orderFiles.length) {
        payload.uploadToken = await uploadOrderFilesInChunks(orderFiles, status);
        status.innerHTML = alertBox("Pliki przesłane. Trwa wysyłanie e-maila z załącznikami do drukarni…", "info");
      }
      const response = await fetch("send-order.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Requested-With": "Drukulator" },
        body: JSON.stringify(payload)
      });
      const result = await orderFetchJson(response, "Przesyłanie zamówienia");

      const confirmationText = result.confirmationSent
        ? " Potwierdzenie zostało wysłane również na podany adres e-mail."
        : " Zgłoszenie dotarło do Druk24, ale automatyczne potwierdzenie dla klienta nie zostało wysłane. Sprawdź poprawność adresu lub skontaktuj się z nami.";
      status.innerHTML = `<div class="order-success-card ${result.confirmationSent ? "is-success" : "is-warning"}"><div class="order-success-card__icon">✓</div><div><strong>Zamówienie przesłano do potwierdzenia</strong><p>Numer zgłoszenia: <b>${esc(result.orderId)}</b>.</p><p>Drukarnia sprawdzi zgłoszenie i poda termin realizacji. Produkcja nie rozpoczęła się automatycznie.${esc(confirmationText)}</p></div></div>`;
      showToast("Wysłano zamówienie do potwierdzenia");
    } catch (error) {
      const networkFailure = error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(String(error.message || ""));
      const message = networkFailure
        ? "Nie udało się połączyć z serwerem podczas wysyłki. Możliwy jest limit hostingu, blokada zabezpieczeń lub przerwane połączenie. Sprawdź pocztę przed ponowną próbą — zgłoszenie mogło już dotrzeć."
        : (error.message || String(error));
      status.innerHTML = alertBox(`${message} Możesz także skopiować tekst zamówienia poniżej i przesłać go na ${CONTACT_EMAIL}.`, "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  async function copyText(text) {
    text = window.DrukulatorI18n?.translate?.(text) || text;
    try { await navigator.clipboard.writeText(text); showToast("Skopiowano do schowka"); }
    catch { const temp = document.createElement("textarea"); temp.value = text; document.body.appendChild(temp); temp.select(); document.execCommand("copy"); temp.remove(); showToast("Skopiowano do schowka"); }
  }

  function downloadCsv() {
    const rows = [["Lp.", "Produkt", "Opis", "Cena brutto"], ...state.cart.map((item, i) => [i + 1, item.title, item.description, Number(item.price).toFixed(2).replace(".", ",")]), [], ["", "RAZEM", "", state.cart.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2).replace(".", ",")]];
    const csv = "\uFEFF" + rows.map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "zamówienie_kalkulator_druku.csv"; link.click(); URL.revokeObjectURL(link.href);
  }
})();
