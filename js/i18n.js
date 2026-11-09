(function () {
  "use strict";

  const STORAGE_KEY = "drukulator_language";
  const supported = new Set(["pl", "en", "brainrot"]);
  const persistentLanguages = new Set(["pl", "en"]);
  let language = "pl";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (persistentLanguages.has(saved)) language = saved;
  } catch {}

  const exact = new Map(Object.entries({
    "Przejdź do cennika online": "Skip to online price list",
    "Ta aplikacja wymaga włączonego JavaScript.": "This application requires JavaScript to be enabled.",
    "Druk24 Szczecin — strona główna": "Druk24 Szczecin — home page",
    "Włącz tryb ciemny": "Enable dark mode",
    "Włącz tryb jasny": "Enable light mode",
    "Tryb ciemny": "Dark mode",
    "Tryb jasny": "Light mode",
    "Otwórz menu strony": "Open site menu",
    "Otwórz menu produktów": "Open product menu",
    "Menu główne": "Main menu",
    "Produkty": "Products",
    "Start": "Home",
    "Cennik": "Price list",
    "Cennik online": "Online price list",
    "O nas": "About us",
    "Dojazd i kontakt": "Directions and contact",
    "Kontakt i dojazd": "Contact and directions",
    "Kontakt": "Contact",
    "Oferta": "Services",
    "Drukarnia": "Print shop",
    "Informacje": "Information",
    "Polityka prywatności": "Privacy policy",
    "Regulamin": "Terms and conditions",
    "Poniedziałek–piątek:": "Monday–Friday:",
    "Ulotki i plakaty": "Flyers and posters",
    "Ulotki": "Flyers",
    "Plakaty": "Posters",
    "Wizytówki": "Business cards",
    "Naklejki, etykiety i magnesy": "Stickers, labels and magnets",
    "Folie i banery": "Films and banners",
    "Roll-upy i X-banery": "Roll-ups and X-banners",
    "Obrazy na płótnie": "Canvas prints",
    "Opisz, czego potrzebujesz": "Describe what you need",
    "Np. wizytówki, wlepki, winietki...": "E.g. business cards, stickers, place cards...",
    "Możesz wpisać nazwę produktu albo krótko opisać zamówienie.": "Enter a product name or briefly describe your order.",
    "Nie znaleziono kategorii": "No category found",
    "Najlepsze dopasowanie:": "Best match:",

    "Szybka wycena online": "Quick online quote",
    "Wypróbuj kreator wyceny": "Try the quote wizard",
    "Bez AI — dopyta tylko o brakujące parametry": "No AI — it only asks for missing details",
    "Kreator wyceny": "Quote wizard",
    "Opisz zamówienie po swojemu": "Describe your order in your own words",
    "Zacznij od nowa": "Start over",
    "Opisz, czego potrzebujesz…": "Describe what you need…",
    "Wyślij →": "Send →",
    "To nie jest AI. Kreator działa na prostych regułach, słowniku produktów i aktualnym cenniku Druk24. Nie wysyła opisu zamówienia do żadnego modelu AI ani usługi generatywnej. Jeśli czegoś nie da się ustalić jednoznacznie, nie zgaduje — otwiera właściwy kalkulator.": "This is not AI. The quote wizard uses simple rules, the product vocabulary and the current Druk24 price list. It does not send your order description to any AI model or generative service. If something cannot be determined unambiguously, it does not guess — it opens the correct calculator.",
    "Cześć! Pomogę Ci zrobić wycenę.": "Hi! I will help you prepare a quote.",
    "Napisz normalnie, czego potrzebujesz — np. „potrzebuję 1500 ulotek A5” albo „200 wizytówek dwustronnych”. Dopytam tylko o brakujące rzeczy.": "Just describe what you need — for example “I need 1500 A5 flyers” or “200 double-sided business cards”. I will only ask for missing details.",
    "Co chcesz wycenić? Możesz napisać normalnym zdaniem.": "What would you like to quote? You can write it as a normal sentence.",
    "Nie rozpoznałem jeszcze produktu. Wybierz kategorię albo dopisz, czego potrzebujesz.": "I have not recognized the product yet. Choose a category or add what you need.",
    "Ile sztuk potrzebujesz?": "How many do you need?",
    "Jaki format ulotki?": "What flyer size do you need?",
    "Jaki format plakatu?": "What poster size do you need?",
    "Jaki format wydruku?": "What print size do you need?",
    "Jaki format wizytówki?": "What business card size do you need?",
    "Druk jednostronny czy dwustronny?": "Single-sided or double-sided printing?",
    "Jakie mają być wymiary jednej sztuki?": "What should the dimensions of one item be?",
    "Podaj szerokość i wysokość.": "Enter the width and height.",
    "Jakiej folii potrzebujesz?": "What type of film do you need?",
    "Kolor czy czarno-biały?": "Colour or black and white?",
    "Wydruk jednostronny czy dwustronny?": "Single-sided or double-sided printing?",
    "Jaki rodzaj?": "What type?",
    "Jaki rodzaj kalendarza?": "What type of calendar?",
    "Co z materiałów firmowych?": "Which company material do you need?",
    "Co dokładnie chcesz przygotować dla nieruchomości?": "What exactly would you like to prepare for real estate?",
    "Mam komplet ✓": "I have everything ✓",
    "Sprawdzę jeszcze wszystkie ustawienia w kalkulatorze przed pokazaniem ceny.": "I will verify all calculator settings before showing the price.",
    "Policz i pokaż cenę →": "Calculate and show price →",
    "Otwórz właściwy kalkulator →": "Open the correct calculator →",
    "Sprawdź cenę druku": "Check your print price",
    "w mniej niż minutę": "in less than a minute",
    "Bez logowania, bez płatności i bez zobowiązań. Wybierz produkt, podaj podstawowe parametry i od razu zobacz cenę brutto.": "No login, no payment and no commitment. Choose a product, enter the basic parameters and see the gross price instantly.",
    "✓ Cena brutto od razu": "✓ Gross price instantly",
    "✓ Bez obowiązku zakupu": "✓ No obligation to buy",
    "✓ Kontakt zwykle do 15 min": "✓ Usually contacted within 15 min",
    "Co chcesz wydrukować? np. 500 ulotek A5": "What would you like to print? e.g. 500 A5 flyers",
    "Nie musisz znać technologii druku — wpisz po prostu czego potrzebujesz.": "You do not need to know printing technology — just describe what you need.",
    "To naprawdę proste": "It is really simple",
    "albo wpisz go w wyszukiwarkę": "or type it into the search box",
    "Ustaw parametry": "Set the parameters",
    "format, ilość i wariant": "format, quantity and variant",
    "Zobacz cenę": "See the price",
    "i dopiero wtedy zdecyduj, co dalej": "and only then decide what to do next",
    "To nie jest zakup.": "This is not a purchase.",
    "Wysłanie wyceny oznacza tylko zapytanie do drukarni.": "Sending the quote only submits an enquiry to the print shop.",
    "Najczęściej wybierane": "Most popular",
    "Od czego chcesz zacząć?": "What would you like to start with?",
    "Pokaż wszystkie pozostałe usługi ↓": "Show all remaining services ↓",
    "Wszystkie pozostałe usługi": "All remaining services",
    "Nie wiesz, co wybrać?": "Not sure what to choose?",
    "Nie musisz zgadywać": "You do not have to guess",
    "Opisz krótko czego potrzebujesz albo skontaktuj się z nami. Pomożemy dobrać odpowiednią opcję.": "Briefly describe what you need or contact us. We will help you choose the right option.",
    "Napisz e-mail": "Send an email",
    "Zadzwoń: 91 831 47 47": "Call: 91 831 47 47",
    "Od razu widzisz końcową cenę wyceny": "You immediately see the final quote price",
    "Możesz dołączyć je przed wysłaniem": "You can attach them before sending",
    "Wysyłasz zapytanie, nie zakup": "You are sending an enquiry, not making a purchase",
    "Twoja wycena": "Your quote",
    "Twoja wycena jest pusta.": "Your quote is empty.",
    "Dodaj do wyceny": "Add to quote",
    "Dodano do wyceny": "Added to quote",
    "Dodano do wyceny wraz z plikiem": "Added to quote with the file",
    "Pobierz wycenę CSV": "Download quote CSV",
    "Wyczyść wycenę": "Clear quote",
    "Wycena": "Quote",
    "Kalkulator druku – cennik druku online": "Print calculator – online print price list",
    "Wersja statyczna działająca na HTTP": "Static version running over HTTP",
    "Wybierz produkt i od razu przejdź do wyceny": "Choose a product and go straight to the quote",
    "Wybierz produkt": "Choose a product",
    "Najpopularniejsze usługi masz od razu pod ręką. Możesz też skorzystać z menu po lewej stronie.": "Your most popular services are immediately available below. You can also use the menu on the left.",
    "Otwórz kalkulator": "Open calculator",
    "14 kalkulatorów": "14 calculators",
    "15 kalkulatorów": "15 calculators",
    "Wybierz produkt z menu. Wszystkie obliczenia wykonywane są lokalnie w przeglądarce, na podstawie pliku data/prices.json.": "Choose a product from the menu. All calculations are performed locally in your browser using the data/prices.json file.",
    "Kalkulatory": "Calculators",
    "Ceny": "Prices",
    "Brutto": "Gross",
    "Razem brutto": "Total incl. VAT",
    "Razem brutto z dostawą": "Total incl. VAT and delivery",
    "Razem obecnie — brutto": "Current total incl. VAT",
    "Razem obecnie z dostawą — brutto": "Current total incl. VAT and delivery",
    "Kontakt i dostawa": "Contact and delivery",
    "Pliki i szczegóły (nieobowiązkowe)": "Files and details (optional)",
    "Wyślij zamówienie": "Send order",
    "Wyślij zamówienie do Druk24": "Send order to Druk24",
    "Wersja": "Version",
    "Informacja o wysyłaniu zapytania": "Information about sending an enquiry",
    "Po dodaniu produktów do koszyka możesz wypełnić formularz i wysłać zapytanie bezpośrednio do Druk24. Nie jest to klasyczne zamówienie z obowiązkiem zapłaty, lecz pytanie o możliwość produkcji, czas realizacji zlecenia lub ewentualne zmiany w projekcie.": "After adding products to the cart, you can complete the form and send an enquiry directly to Druk24. This is not a binding order with an obligation to pay, but a request about production availability, turnaround time, or possible artwork changes.",
    "Po otrzymaniu zapytania skontaktujemy się z Tobą tak szybko, jak będzie to możliwe — w godzinach pracy drukarni najczęściej w ciągu 15 minut od otrzymania maila ze wstępnym zamówieniem.": "We will contact you as soon as possible after receiving your enquiry—during opening hours, usually within 15 minutes of receiving the preliminary order email.",
    "Uzupełnij parametry i oblicz cenę brutto": "Enter the parameters and calculate the gross price",
    "Zaproszenia, plany stołów i dekoracje – ceny brutto": "Invitations, seating plans and decorations – gross prices",

    "Wizytówki 24h": "Business cards 24h",
    "Ulotki 24h": "Flyers 24h",
    "Plakaty 24h": "Posters 24h",
    "Druk cyfrowy i ksero 24h": "Digital printing and copying 24h",
    "Folie i banery 24h": "Films and banners 24h",
    "Naklejki, etykiety i magnesy": "Stickers, labels and magnets",
    "Roll-upy i X-banery": "Roll-ups and X-banners",
    "PCV i pianki": "PVC and foam boards",
    "Koszulki i odzież": "T-shirts and apparel",
    "Notesy i bloczki": "Notepads and pads",
    "Restauracje, hotele": "Restaurants and hotels",
    "Nieruchomości": "Real estate",
    "Oprawa prac": "Document binding",
    "Laminowanie": "Lamination",
    "Edycja cen": "Price editor",
    "Edycja wyszukiwarki": "Search editor",
    "Śluby, wesela i imprezy": "Weddings and events",
    "Zaproszenia": "Invitations",
    "Zaproszenia składane": "Folded invitations",
    "Zaproszenia z folią satynową": "Invitations with satin lamination",
    "Plan stołów": "Seating plan",
    "Dekoracja sali": "Venue decoration",
    "Pełna oferta ślubna": "Full wedding offer",
    "Wariant": "Variant",
    "Papier kreda 300 g": "300 gsm coated paper",
    "Papier kreda 300 g + satyna": "300 gsm coated paper + satin lamination",
    "Plakat papier satynowy 135 g": "135 gsm satin poster paper",
    "Folia + PCV 4 mm": "Printed film + 4 mm PVC",
    "Plansza Pianka 5 mm": "5 mm foam board",
    "Zdjęcie na PCV 4 mm": "Photo on 4 mm PVC",
    "Cena dotyczy całego wybranego nakładu.": "The price covers the entire selected quantity.",
    "Cena z cennika dotyczy 1 sztuki i jest mnożona przez podaną ilość.": "The listed price is per item and is multiplied by the quantity.",
    "Dekoracja stołów: standy, winietki, etykiety na wódkę i wino oraz zawieszki na alkohol są wyceniane indywidualnie.": "Table decorations such as stands, place cards, alcohol labels and bottle tags are quoted individually.",
    "Cena za sztukę w pakiecie": "Price per item in the package",
    "Druki i materiały dla gastronomii oraz hoteli": "Print products and materials for restaurants and hotels",
    "Komplet materiałów dla biur nieruchomości, pośredników i deweloperów": "A complete print set for real estate agencies, agents and developers",
    "Podkładki na tackę": "Tray liners",
    "Offset 80 g, jednostronnie": "80 gsm offset, single-sided",
    "Papier offsetowy 80 g, druk jednostronny, format 40 × 30 cm": "80 gsm offset paper, single-sided printing, 40 × 30 cm format",
    "Menu A3 offset preprint 90 g": "A3 menu, 90 gsm offset preprint",
    "Format A3, papier offset preprint 90 g, druk jednostronny": "A3 format, 90 gsm offset preprint paper, single-sided printing",
    "Format A3, papier offset preprint 90 g, druk dwustronny": "A3 format, 90 gsm offset preprint paper, double-sided printing",
    "Menu A3 laminowane": "Laminated A3 menu",
    "Format A3, menu laminowane, druk dwustronny": "A3 format, laminated menu, double-sided printing",
    "Prezenter trójkątny – stojak": "Triangular table presenter",
    "Prezenter trójkątny, stojak stołowy": "Triangular tabletop presenter",
    "Notesy kelnerskie": "Waiter notepads",
    "Klejone — Z okładką kredową 170 g": "Glued — with 170 gsm coated cover",
    "Klejone — Bez okładki": "Glued — without cover",
    "Spiralowane — Z okładką kredową 170 g": "Spiral-bound — with 170 gsm coated cover",

    "Format": "Format",
    "Własny wymiar": "Custom size",
    "Szerokość plakatu [cm]": "Poster width [cm]",
    "Wysokość plakatu [cm]": "Poster height [cm]",
    "Szerokość plakatu": "Poster width",
    "Wysokość plakatu": "Poster height",
    "Szerokość i wysokość plakatu muszą być większe od zera.": "The poster width and height must be greater than zero.",
    "Brak cennika dla wybranego plakatu.": "No price list is available for the selected poster.",
    "Brak cennika dla wybranego rodzaju plakatu.": "No price list is available for the selected poster printing method.",
    "Podany wymiar plakatu nie mieści się w żadnym formacie dostępnym dla wybranego rodzaju druku.": "The entered poster size does not fit any format available for the selected printing method.",
    "Własny wymiar jest liczony jak najmniejszy standardowy format, w którym mieści się cały plakat, również po obróceniu.": "A custom size is billed as the smallest standard format that contains the entire poster, including when rotated.",
    "Rodzaj druku": "Print type",
    "Wykończenie": "Finish",
    "Zadruk": "Printing sides",
    "Nakład": "Quantity",
    "Oblicz cenę": "Calculate price",
    "Cyfrowy 24h": "Digital 24h",
    "Cyfrowy": "Digital",
    "Offsetowy": "Offset",
    "Jednostronne": "Single-sided",
    "Dwustronne": "Double-sided",
    "Jednostronny": "Single-sided",
    "Dwustronny": "Double-sided",
    "Papier 130 g, kolor dwustronny": "130 gsm paper, full colour on both sides",
    "Rodzaj ulotki": "Flyer type",
    "Realizacja standardowa: 24h": "Standard turnaround: 24h",
    "Materiał": "Material",
    "Szerokość [cm]": "Width [cm]",
    "Wysokość [cm]": "Height [cm]",
    "Ilość sztuk": "Quantity",
    "Krój": "Cut",
    "Cena brutto za sztukę": "Gross price per piece",
    "Wartość zmienia się co 10 cm. Wpisaną liczbę zaokrąglamy w górę do pełnych 10 cm.": "The value changes in 10 cm steps. A number you type is rounded up to the next full 10 cm.",
    "Wybierz krój": "Choose a cut",
    "Męska": "Men's",
    "Damska": "Women's",
    "Dziecięca": "Children's",
    "Norma": "Standard",
    "Zobacz produkt w katalogu Polstar": "View the product in the Polstar catalogue",
    "Kamizelka odblaskowa": "High-visibility vest",
    "Kamizelka odblaskowa Brixton Flash (żółta lub pomarańczowa), rozmiary S–3XL.": "Brixton Flash high-visibility vest (yellow or orange), sizes S–3XL.",
    "Kamizelka odblaskowa Malfini Rimeck HV Bright (żółta lub pomarańczowa), dostępna tylko w rozmiarach M i 2XL.": "Malfini Rimeck HV Bright high-visibility vest (yellow or orange), available only in sizes M and 2XL.",
    "Progi cenowe materiału": "Material price tiers",
    "Powierzchnia": "Area",
    "Cena": "Price",
    "Każda powierzchnia": "Any area",
    "✓ Oczka w standardzie": "✓ Eyelets included",
    "Łączna powierzchnia": "Total area",
    "Cena za m²": "Price per m²",
    "Minimum zamówienia": "Minimum order",
    "Cena bez cięcia": "Price before cutting",
    "Cena jednostkowa bez cięcia": "Unit price before cutting",
    "Łączny obwód cięcia": "Total cutting perimeter",
    "Stawka cięcia ręcznego": "Manual cutting rate",
    "Koszt cięcia ręcznego": "Manual cutting cost",
    "Cięcie ręczne [zł/mb]": "Manual cutting [PLN/linear m]",
    "Doliczaj cięcie ręczne": "Add manual cutting",
    "Cena materiału": "Material price",
    "Cięcie ręczne nie jest doliczane do ceny.": "Manual cutting is not added to the price.",
    "Rodzaj produktu": "Product type",
    "Szerokość jednej sztuki [mm]": "Width of one item [mm]",
    "Wysokość jednej sztuki [mm]": "Height of one item [mm]",
    "Minimalna liczba naklejek": "Minimum number of stickers",
    "Ilość kompletów / sztuk": "Number of sets / items",
    "Progi cenowe": "Price tiers",
    "Długość rozliczeniowa": "Billable length",
    "Naklejek w rzędzie": "Stickers per row",
    "Liczba rzędów": "Number of rows",
    "Łącznie wykonanych naklejek": "Total stickers produced",
    "Dodatkowych naklejek": "Extra stickers",
    "Długość przed zaokrągleniem": "Length before rounding",
    "Cena za mb": "Price per linear metre",
    "Wymiar produkcyjny": "Production size",
    "Cena jednostkowa": "Unit price",
    "Notesy klejone, spiralowane oraz bloczki samokopiujące": "Glued and spiral notepads and NCR pads",
    "Wariant": "Variant",
    "Cennik wybranego wariantu": "Price list for the selected variant",
    "Specyfikacja": "Specification",
    "Liczba bloczków": "Number of pads",
    "Nakład notesów": "Notepad quantity",
    "Papier satynowy 135 g": "135 gsm satin paper",
    "Papier 170 g, kolor jednostronny": "170 gsm paper, full colour on one side",
    "Cena jednostkowa": "Unit price",
    "Roll-up i X-bannery": "Roll-ups and X-banners",
    "Szerokość / format": "Width / format",
    "Cennik brutto za sztukę": "Gross price list per item",
    "Format jest określony w wybranym wariancie.": "The format is specified by the selected variant.",
    "Wysokość roll-upu i wkładu: 200 cm.": "Roll-up and insert height: 200 cm.",
    "Próg ilościowy": "Quantity tier",
    "Od 5 sztuk": "5 or more items",
    "2–4 sztuki": "2–4 items",
    "1 sztuka": "1 item",
    "Grubość płyty": "Board thickness",
    "Sposób wyboru wymiaru": "Size selection method",
    "Format z cennika": "Price-list format",
    "Inny wymiar": "Custom size",
    "Szerokość planszy [cm]": "Board width [cm]",
    "Wysokość planszy [cm]": "Board height [cm]",
    "Cennik plansz z pianki 5 mm": "5 mm foam board price list",
    "Cena brutto": "Gross price",
    "Grubość": "Thickness",
    "Format rozliczeniowy": "Billing format",
    "Sposób rozliczenia": "Billing method",

    "Rodzaj usługi": "Service type",
    "Arkuszowanie 24h": "Imposition 24h",
    "Druk cyfrowy 24h": "Digital printing 24h",
    "Druk cyfrowy": "Digital printing",
    "Ksero i druk": "Copying and printing",
    "Ksero książki": "Book copying",
    "Dla studentów 24h": "For students 24h",
    "Dla studentów": "For students",
    "Skanowanie": "Scanning",
    "Szerokość netto [mm]": "Finished width [mm]",
    "Wysokość netto [mm]": "Finished height [mm]",
    "Liczba gotowych sztuk": "Number of finished items",
    "Papier": "Paper",
    "Arkusz": "Sheet",
    "Automatycznie": "Automatically",
    "Rodzaj papieru": "Paper type",
    "Liczba arkuszy": "Number of sheets",
    "Liczba kartek": "Number of sheets",
    "Liczba kopii": "Number of copies",
    "Liczba stron": "Number of pages",
    "Rodzaj skanowania": "Scan type",
    "Liczba skanowanych stron": "Number of scanned pages",
    "Kolorowy": "Colour",
    "Czarno-biały": "Black and white",
    "Standardowy 80 g": "Standard 80 gsm",
    "Papier kolorowy": "Coloured paper",
    "Papier etykietowy": "Label paper",
    "Papier kredowy 130 g": "130 gsm coated paper",
    "Papier kredowy 170 g": "170 gsm coated paper",
    "Papier kredowy 250 g": "250 gsm coated paper",
    "Papier kredowy 300 g": "300 gsm coated paper",
    "Papier kredowy 350 g": "350 gsm coated paper",
    "Porównanie SRA4 i SRA3": "SRA4 and SRA3 comparison",
    "Użytków/ark.": "Items/sheet",
    "Arkuszy": "Sheets",
    "Wymiar netto": "Finished size",
    "Wymiar ze spadem": "Size with bleed",
    "Spad": "Bleed",
    "Pole zadruku": "Printable area",
    "Układ": "Layout",
    "Użytków na arkuszu": "Items per sheet",
    "Potrzebne arkusze": "Required sheets",
    "Łącznie wykonanych sztuk": "Total items produced",
    "Dodatkowych sztuk": "Extra items",
    "Próg cenowy druku": "Print price tier",
    "Cena za zamówioną sztukę": "Price per ordered item",
    "Ilość": "Quantity",

    "Koszulki i odzież z nadrukiem": "Printed T-shirts and apparel",
    "Kategoria produktu": "Product category",
    "Model": "Model",
    "Rozmiar produktu": "Product size",
    "Wybierz rozmiar": "Select a size",
    "Wybierz rozmiar produktu.": "Select a product size.",
    "Dostępność wybranego rozmiaru i koloru potwierdzimy po wysłaniu zapytania.": "We will confirm availability of the selected size and colour after receiving your enquiry.",
    "Dziecięcy — podaj w uwagach": "Child size — specify in the notes",
    "Inny — podaj w uwagach": "Other — specify in the notes",
    "Różne rozmiary — podaj w uwagach": "Mixed sizes — specify in the notes",
    "Uniwersalny": "One size",
    "Rozmiar nadruku z przodu": "Front print size",
    "Rozmiar nadruku z tyłu": "Back print size",
    "Rabaty ilościowe": "Quantity discounts",
    "Same nadruki nie podlegają rabatom ilościowym.": "Print-only orders are not eligible for quantity discounts.",
    "Kolory i specyfikacja produktu ↗": "Product colours and specifications ↗",
    "Cena pierwszego nadruku": "First print price",
    "Cena bazowa za sztukę": "Base price per item",
    "Dopłata za drugi nadruk": "Additional charge for second print",
    "Łączna wartość": "Total value",
    "Rabat ilościowy": "Quantity discount",
    "Nie nalicza się": "Not applied",
    "Cena jednostkowa przed rabatem": "Unit price before discount",
    "Wartość przed rabatem": "Value before discount",
    "Rabat": "Discount",
    "Drugi nadruk rozliczony jako": "Second print billed as",
    "Brak nadruku": "No print",
    "Przód": "Front",
    "Tył": "Back",

    "Druk i oprawa prac": "Printing and document binding",
    "Druk cyfrowy A4 oraz oprawa dokumentu": "A4 digital printing and document binding",
    "Tryb druku": "Print mode",
    "Sposób zadruku": "Printing method",
    "Liczba stron jednego dokumentu": "Pages per document",
    "Liczba egzemplarzy": "Number of copies",
    "Rodzaj oprawy": "Binding type",
    "Rozmiar oprawy / spirali": "Binding / coil size",
    "Łączna liczba drukowanych stron": "Total printed pages",
    "Łączna liczba arkuszy": "Total sheets",
    "Koszt druku": "Printing cost",
    "Koszt opraw": "Binding cost",
    "Cena jednego egzemplarza": "Price per copy",
    "Format dokumentu": "Document format",
    "Cennik brutto": "Gross price list",
    "Laminowanie dokumentów folią": "Document lamination with",

    "Sposób wyboru rozmiaru": "Size selection method",
    "Wybierz format z cennika": "Choose a price-list format",
    "Wpisz własny wymiar": "Enter a custom size",
    "Dopasuj do zdjęcia": "Fit to an image or PDF",
    "Ilość obrazów": "Number of canvas prints",
    "Format obrazu": "Canvas size",
    "Proponowany format": "Suggested size",
    "Który bok podajesz?": "Which side are you entering?",
    "Szerokość": "Width",
    "Wysokość": "Height",
    "Wartość boku [cm]": "Side length [cm]",
    "Wybierz zdjęcie, aby dopasować format.": "Select an image to match a size.",
    "Podgląd": "Preview",
    "Dopasowanie rozmiaru": "Size fitting",
    "Proponowane formaty": "Suggested sizes",
    "Podaj jeden bok": "Enter one side",
    "Wybierz plik JPG / PNG / WebP": "Select a JPG / PNG / WebP file",
    "Wybierz plik PDF / JPG / PNG / WebP": "Select a PDF / JPG / PNG / WebP file",
    "Wybierz zdjęcie lub plik PDF, aby dopasować format.": "Select an image or PDF to match a size.",
    "Rozmiar pierwszej strony PDF": "First PDF page size",
    "Szerokość strony PDF [mm]": "PDF page width [mm]",
    "Wysokość strony PDF [mm]": "PDF page height [mm]",
    "Dodano do koszyka wraz z plikiem": "Added to cart with the file",
    "Format cennikowy": "Price-list format",
    "Wymiar rozliczeniowy": "Billing size",
    "Różnica proporcji": "Aspect-ratio difference",
    "Rozdzielczość pliku": "File resolution",

    "Koszyk": "Cart",
    "Koszyk jest pusty.": "Your cart is empty.",
    "Usuń": "Remove",
    "Razem brutto": "Gross total",
    "Pobierz koszyk CSV": "Download cart CSV",
    "Wyczyść koszyk": "Clear cart",
    "Formularz zamówienia": "Order enquiry form",
    "Uzupełnij dane i wyślij zapytanie bezpośrednio do Druk24.": "Enter your details and send an enquiry directly to Druk24.",
    "Imię i nazwisko / firma *": "Full name / company *",
    "np. Jan Kowalski / Firma ABC": "e.g. John Smith / ABC Ltd",
    "E-mail *": "Email *",
    "Przed wysłaniem sprawdzimy format adresu i działanie jego domeny pocztowej.": "Before sending, we will check the address format and whether its email domain is working.",
    "Telefon": "Phone",
    "Sposób odbioru": "Collection method",
    "Odbiór osobisty": "Collection in person",
    "Do ustalenia": "To be arranged",
    "Uwagi": "Notes",
    "Termin, sposób pakowania, dodatkowe informacje...": "Deadline, packaging method, additional information...",
    "Załączniki": "Attachments",
    "Dodaj pliki do zapytania": "Add files to the enquiry",
    "PDF, grafiki i pliki projektowe. Maksymalnie 5 plików i 50 MB łącznie, bez limitu rozmiaru pojedynczego pliku.": "PDFs, images and artwork files. Up to 5 files and 50 MB in total, with no per-file size limit.",
    "Nie wybrano plików.": "No files selected.",
    "Usuń plik": "Remove file",
    "Strona internetowa": "Website",
    "Zapoznałem/am się z": "I have read the",
    "polityką prywatności": "privacy policy",
    "i zgadzam się na kontakt w sprawie tej wyceny. *": "and agree to be contacted about this quote. *",
    "Wyślij zamówienie do Druk24": "Send enquiry to Druk24",
    "Tekst wiadomości do ręcznego skopiowania": "Message text for manual copying",
    "Temat wiadomości": "Message subject",
    "Treść wiadomości": "Message body",
    "Kopiuj": "Copy",
    "Dodaj do koszyka": "Add to cart",
    "Dodano do koszyka": "Added to cart",
    "Wysyłanie…": "Sending…",
    "Sprawdzanie adresu e-mail i wysyłanie wiadomości…": "Checking the email address and sending the message…",
    "Wysłano zamówienie": "Enquiry sent",
    "Skopiowano do schowka": "Copied to clipboard",

    "Edycja cen": "Price editor",
    "Zapis cen bezpośrednio na serwerze": "Save prices directly to the server",
    "Panel administracyjny": "Administration panel",
    "Hasło": "Password",
    "Otwórz edycję cen": "Open price editor",
    "Otwórz edycję wyszukiwarki": "Open search editor",
    "Nieprawidłowe hasło.": "Incorrect password.",
    "Wyszukaj kategorię lub cenę": "Search for a category or price",
    "Wyszukaj kategorię": "Search for a category",
    "Zapisz ceny na serwerze": "Save prices to server",
    "Zastosuj tylko w tej przeglądarce": "Apply only in this browser",
    "Pobierz prices.json": "Download prices.json",
    "Wczytaj prices.json": "Load prices.json",
    "Wczytaj aktualne ceny z serwera": "Load current prices from server",
    "Zablokuj panel": "Lock panel",
    "Dodawaj własne frazy i określenia klientów": "Add your own customer phrases and terms",
    "Zapisz i zastosuj": "Save and apply",
    "Pobierz search-terms.json": "Download search-terms.json",
    "Wczytaj search-terms.json": "Load search-terms.json",
    "Przywróć słownik z serwera": "Restore dictionary from server",
    "Jedna fraza w każdym wierszu. Możesz dodawać nazwy potoczne, odmiany i typowe literówki.": "Enter one phrase per line. You may add colloquial names, inflections and common misspellings.",

    "Sekret Druk24": "Druk24 secret",
    "Skrzynka zniżek Druk24": "Druk24 discount case",
    "Otwieranie działa jak losowanie skrzynki. Każda próba zużywa 1 klucz, a wylosowana nagroda zwiększa Twoją zniżkę.": "Opening works like a case draw. Each attempt uses 1 key and the prize increases your discount.",
    "Stan gry": "Game status",
    "Klucze": "Keys",
    "1 otwarcie = 1 klucz": "1 opening = 1 key",
    "Zdobyta zniżka": "Discount won",
    "Losowanie nagrody": "Prize draw",
    "Użyj klucza": "Use a key",
    "Nowa runda — 5 kluczy": "New round — 5 keys",
    "Masz 5 kluczy. Otwórz pierwszą skrzynkę.": "You have 5 keys. Open the first case.",
    "Kopiuj wynik": "Copy result",
    "Wylosowano": "You won",
    "Grafiki, nazwy, zniżki i szanse ustawisz w": "Set images, names, discounts and odds in",
    "Wynik easter egga wymaga potwierdzenia przy składaniu zamówienia.": "The easter egg result must be confirmed when placing the order.",
    "Zamknij skrzynkę": "Close case",
    "Skrzynka się otwiera...": "The case is opening...",

    "Baner powlekany 510g": "510 gsm coated banner",
    "Folia mat": "Matte self-adhesive film",
    "Folia błysk": "Gloss self-adhesive film",
    "Folia + laminat": "Film + laminate",
    "Folia OWH": "One Way Vision film",
    "Folia transparentna": "Transparent film",
    "Folia do podświetleń": "Backlit film",
    "Folia z transferem": "Film with transfer tape",
    "Folia z nadrukiem + PCV": "Printed film + PVC",
    "Plansza pianka 5 mm": "5 mm foam board",
    "Naklejki, etykiety": "Stickers and labels",
    "Naklejki laminowane": "Laminated stickers",
    "Magnesy reklamowe": "Advertising magnets",
    "Komplet naklejek taxi": "Taxi sticker set",
    "Komplet magnesy + naklejki taxi": "Taxi magnets + sticker set",
    "Identyfikator taxi": "Taxi identification sticker",
    "Cennik taxi – 2 sztuki": "Taxi price list – 2 items",
    "Notesy klejone": "Glued notepads",
    "Notesy spiralowane": "Spiral notepads",
    "Bloczki samokopiujące": "NCR pads",
    "Biuwary": "Desk pads",
    "Bez okładki": "Without cover",
    "Z okładką kredową 170 g": "With 170 gsm coated cover",
    "Oryginał + 1 kopia": "Original + 1 copy",
    "Roll-up Standard": "Roll-up Standard",
    "Roll-up Standard Black": "Roll-up Standard Black",
    "Roll-up Exclusive („łezka”)": "Roll-up Exclusive (teardrop)",
    "Wkład z wymianą": "Replacement insert with fitting",
    "X-baner": "X-banner",
    "Wielkoformatowy 24h": "Large-format 24h",
    "Sam nadruk": "Print only",
    "Koszulki bawełniane": "Cotton T-shirts",
    "Koszulki poliestrowe": "Polyester T-shirts",
    "Koszulki polo": "Polo shirts",
    "Bluzy": "Sweatshirts",
    "Torby bawełniane": "Cotton bags",
    "Worki bawełniane": "Cotton drawstring bags",
    "Czapki": "Caps",
    "Kamizelki odblaskowe": "High-visibility vests",
    "Nadruk na odzieży klienta": "Printing on customer-supplied apparel",
    "Cena samego nadruku bez odzieży": "Print price without apparel",
    "Brak": "None",
    "Nadruk standardowy": "Standard print",
    "Do 10x15 cm": "Up to 10×15 cm",
    "Do 20x30 cm": "Up to 20×30 cm",
    "Do 35x40 cm": "Up to 35×40 cm",
    "Nadruk 20x30 cm": "20×30 cm print",
    "Bindowanie – spirala metalowa": "Wire coil binding",
    "Bindowanie – spirala plastikowa": "Plastic coil binding",
    "Oprawa kanałowa twarda A4": "A4 hard channel binding",
    "Oprawa miękka zaciskowa": "Soft clamp binding",
    "Płótno": "Canvas",
    "Grube płótno poliestrowe na drewnianym blejtramie": "Heavy polyester canvas on a wooden stretcher frame",
    "Automatyczne": "Automatic",
    "Ręczne": "Manual",
    "Folia Soft Touch lub błysk": "Soft Touch or gloss lamination",
    "Foliowane błysk lub Soft Touch": "Gloss or Soft Touch laminated",
    "Złocenie lub srebrzenie + Soft Touch": "Gold or silver foil + Soft Touch",
    "Składane": "Folded",
    "Druk dwustronny: cena druku × 2. Koszt papieru jest doliczany tylko raz.": "Double-sided printing: print price × 2. The paper cost is added only once.",
    "Szerokość jednej sztuki [cm]": "Width of one item [cm]",
    "Wysokość jednej sztuki [cm]": "Height of one item [cm]",
    "Maksymalny wymiar: 160 × 300 cm, również po obróceniu.": "Maximum size: 160 × 300 cm, including when rotated.",
    "Maksymalny wymiar: 100 × 140 cm, również po obróceniu.": "Maximum size: 100 × 140 cm, including when rotated.",
    "Maksymalny wymiar pianki to 100 × 140 cm, również po obróceniu.": "The maximum foam board size is 100 × 140 cm, including when rotated.",
    "Maksymalny wymiar PCV to 160 × 300 cm, również po obróceniu.": "The maximum PVC board size is 160 × 300 cm, including when rotated.",
    "Maksymalna szerokość: 160 cm.": "Maximum width: 160 cm.",
    "Minimalna szerokość baneru to 30 cm.": "The minimum banner width is 30 cm.",
    "Maksymalna szerokość baneru lub folii to 160 cm.": "The maximum banner or film width is 160 cm.",
    "Cennik dla grubości": "Price list for thickness",
    "A6 i mniejsze": "A6 and smaller",
    "100% bawełna 145 g, dopasowany krój ze szwami bocznymi, wykończenie silikonowe, krój męski, damski i dziecięcy.": "100% cotton, 145 gsm, fitted cut with side seams, silicone finish, men's, women's and children's styles.",
    "100% bawełna 160 g, bez szwów bocznych, wykończenie silikonowe, krój męski, damski i dziecięcy.": "100% cotton, 160 gsm, tubular construction, silicone finish, men's, women's and children's styles.",
    "100% bawełna 180 g, ze szwami bocznymi, wykończenie silikonowe, krój slim-fit z dekoltem w serek, damski i męski.": "100% cotton, 180 gsm, side seams, silicone finish, slim fit with V-neck, women's and men's styles.",
    "100% bawełna 200 g, bez szwów bocznych, wykończenie silikonowe, krój unisex oversize.": "100% cotton, 200 gsm, tubular construction, silicone finish, unisex oversized cut.",
    "100% bawełna, 170 g, rozporki na końcach bocznych szwów, krój męski i damski.": "100% cotton, 170 gsm, side slits, men's and women's styles.",
    "100% bawełna, 180 g, krój z bocznymi szwami, krój męski i damski.": "100% cotton, 180 gsm, side-seam construction, men's and women's styles.",
    "100% mikropoliester 140 g, ze szwami bocznymi, szybkoschnący materiał, krój męski i damski.": "100% micro-polyester, 140 gsm, side seams, quick-drying fabric, men's and women's styles.",
    "100% poliester 130 g, ze szwami bocznymi, gładki i szybkoschnący materiał, luźniejszy krój unisex.": "100% polyester, 130 gsm, side seams, smooth quick-drying fabric, relaxed unisex cut.",
    "100% poliester 150 g, ze szwami bocznymi, szybkoschnący materiał, krój męski, damski i dziecięcy.": "100% polyester, 150 gsm, side seams, quick-drying fabric, men's, women's and children's styles.",
    "65% bawełna, 35% poliester, 200 g, z bocznymi szwami, wykończenie silikonowe, krój męski, damski i dziecięcy.": "65% cotton, 35% polyester, 200 gsm, side seams, silicone finish, men's, women's and children's styles.",
    "Okładka kredowa 170 g, środek offset 80 g, druk jednostronny, 50 kart": "170 gsm coated cover, 80 gsm offset-paper inner pages, single-sided printing, 50 sheets",
    "Bez okładki, środek offset 80 g, druk jednostronny, 50 kart": "No cover, 80 gsm offset-paper inner pages, single-sided printing, 50 sheets",
    "Oryginał + 1 kopia, 50 kompletów w bloczku": "Original + 1 copy, 50 sets per pad",
    "Kalendarz biurkowy z podkładką kartonową, 52 karty, papier offsetowy 80 g, druk jednostronny": "Desk calendar with cardboard backing, 52 sheets, 80 gsm offset paper, single-sided printing",
    "Grube płótno poliestrowe na drewnianym blejtramie": "Heavy polyester canvas on a wooden stretcher frame",
    "Laminowanie dokumentów folią": "Document lamination with",
    "zakres boków:": "side range:",
    "również po obróceniu": "including when rotated",
    "Zamówienie z kalkulatora Druk24": "Enquiry from the Druk24 calculator",
    "Dzień dobry,": "Hello,",
    "proszę o realizację poniższego zamówienia:": "please review the following order enquiry:",
    "Dane zamawiającego:": "Customer details:",
    "Imię i nazwisko / firma:": "Full name / company:",
    "Sposób odbioru:": "Collection method:",
    "Uwagi do zamówienia:": "Order notes:",
    "Proszę o potwierdzenie ceny, terminu realizacji oraz sposobu przekazania plików.": "Please confirm the price, turnaround time and file delivery method.",
    "Pozdrawiam,": "Kind regards,",
    "RAZEM BRUTTO:": "GROSS TOTAL:",
    "Bawełniany worko-plecak z nadrukiem około 20x30 cm": "Cotton drawstring backpack with an approximately 20×30 cm print",
    "Czapka typu bejsbolówka lub raperka": "Baseball or trucker cap",
    "Czapka raperka Malfini RAP 5P (snapback, płaski daszek). Szczegóły i kolor uzgodnimy mailowo.": "Malfini RAP 5P rapper-style snapback cap (flat peak). We will confirm details and colour by email.",
    "Czapka raperka (snapback)": "Rapper-style cap (snapback)",
    "Czapka dziecięca z daszkiem, fason klasyczny (bejsbolówka), Malfini 6P Kids. Szczegóły i kolor uzgodnimy mailowo.": "Children's peaked cap, classic baseball style, Malfini 6P Kids. We will confirm details and colour by email.",
    "Czapka z daszkiem, fason klasyczny (bejsbolówka). Szczegóły i kolor uzgodnimy mailowo.": "Peaked cap, classic baseball style. We will confirm details and colour by email.",
    "Czerwień purpurowa": "Magenta red",
    "Siwoszary melanż": "Grey marl",
    "Gruba bluza unisex z mieszanki bawełny i poliestru": "Heavy unisex cotton-polyester sweatshirt",
    "Kolor żółty lub pomarańczowy, rozmiary S-3XL": "Yellow or orange, sizes S–3XL",
    "Wybierz nadruk z przodu, z tyłu lub po obu stronach.": "Choose a front print, back print, or printing on both sides.",
    "Papier satynowy 135 g. Maksymalny nakład wielkoformatowy: 30 sztuk.": "135 gsm satin paper. Maximum large-format quantity: 30 items.",
    "Pianki są rozliczane wyłącznie na pełne sztuki.": "Foam boards are billed as complete items only.",
    "Pianki są rozliczane wyłącznie na pełne sztuki, a cena za sztukę zależy od liczby zamówionych plansz (tabela poniżej).": "Foam boards are billed in whole pieces only, and the price per piece depends on the number of boards ordered (see the table below).",
    "Własny wymiar jest liczony jak najmniejszy format z cennika, w którym mieści się cała plansza, również po obróceniu; większe wymiary wymagają kontaktu.": "A custom size is billed as the smallest price-list format that contains the entire board, including when rotated; larger sizes require contacting us.",
    "Własny nakład: od 1 do 100 sztuk.": "Custom quantity: from 1 to 100 items.",
    "Ceny brutto za sztukę — plansza z pianki 5 mm": "Gross price per piece — 5 mm foam board",
    "Wpisz liczbę plansz": "Enter the number of boards",
    "Wpisz poprawną ilość": "Enter a valid quantity",
    "Inne wymiary mieszczące się w formatach cennikowych są rozliczane według najmniejszego pasującego formatu; większe wymagają kontaktu.": "Other sizes fitting within listed formats are billed using the smallest matching format; larger sizes require direct contact.",
    "Kalkulator dodaje 3 mm spadu z każdej strony, uwzględnia 3 mm marginesu arkusza i porównuje układ na SRA4 oraz SRA3. Cena korzysta z aktualnego cennika druku cyfrowego.": "The calculator adds 3 mm bleed on each side, includes a 3 mm sheet margin, and compares layouts on SRA4 and SRA3. The price uses the current digital printing price list.",
    "Cena jest naliczana za każdą kopiowaną stronę.": "The price is calculated for every copied page.",
    "Cena jest taka sama dla skanów czarno-białych i kolorowych.": "The price is the same for black-and-white and colour scans.",
    "Frazy zapisane w panelu działają od razu w tej przeglądarce. Aby opublikować je dla wszystkich, pobierz search-terms.json i podmień plik data/search-terms.json na serwerze lub GitHubie.": "Phrases saved in the panel work immediately in this browser. To publish them for everyone, download search-terms.json and replace data/search-terms.json on the server or GitHub.",
    "Używany jest słownik z serwera": "The server dictionary is in use",
    "Używany jest słownik zapisany w tej przeglądarce": "The dictionary saved in this browser is in use",
    "Z okładką kredową 170 g": "With a 170 gsm coated cover",
    "Kolor dwustronny": "Full colour, double-sided",
    "Próg cenowy": "Price tier",
    "Cennik:": "Price list:",
    "Najlepsze dopasowanie": "Best match",
    "Szybko · druk cyfrowy": "Fast · digital printing",
    "Ekonomicznie · druk offsetowy": "Economical · offset printing",
    "Orientacyjnie 24–48 h": "Approx. 24–48 h",
    "Orientacyjnie 3–5 dni roboczych": "Approx. 3–5 business days",
    "Druk wielkoformatowy": "Large-format printing",
    "Formaty A2–B0 · już od 1 szt.": "Formats A2–B0 · from 1 pc",
    "+ Własna ilość": "+ Custom quantity",
    "✓ Własna ilość": "✓ Custom quantity",
    "Dostępność wybranego rozmiaru i koloru potwierdzimy po wysłaniu zamówienia.": "We confirm the availability of the selected size and colour after you send the order.",
  }));

  const phrases = [
    ["Pokaż wszystkie formaty i ceny", "Show all formats and prices"],
    ["Wpisz sumę wszystkich zamawianych sztuk (razem: rozmiary, kolory i kroje tego modelu).", "Enter the total number of all pieces you are ordering (all sizes, colours and cuts of this model together)."],
    ["Rabat naliczymy automatycznie.", "We apply the discount automatically."],
    ["Rabat przy tej ilości:", "Discount at this quantity:"],
    ["Następny próg:", "Next tier:"],
    ["Pierwszy rabat: od", "First discount from"],
    ["(najwyższy próg)", "(highest tier)"],
    ["W cenie: 1 nadruk z przodu", "Included: 1 front print"],
    ["Cennik:", "Price list:"],
    ["Ilość:", "Quantity:"],
    ["Telefon:", "Phone:"],
    ["szt./stron", "items/pages"],
    ["Własny wymiar ", "Custom size "],
    ["zostanie rozliczony jako pełny format", "will be billed as the full format"],
    ["Wpisz pełną liczbę sztuk od 1 do", "Enter a whole number of items from 1 to"],
    ["Cena zostanie obliczona z aktualnego cennika.", "The price will be calculated from the current price list."],
    ["Cena za sztukę:", "Price per piece:"],
    ["(próg:", "(tier:"],
    ["Wybrano ", "Selected "],
    ["Wybierz produkt z menu. Wszystkie obliczenia wykonywane są lokalnie w przeglądarce, na podstawie pliku", "Choose a product from the menu. All calculations are performed locally in your browser using the file"],
    ["Wybierz produkt z menu. Wszystkie obliczenia wykonywane są lokalnie w przeglądarce, na podstawie pliku data/prices.json.", "Choose a product from the menu. All calculations are performed locally in your browser using the data/prices.json file."],
    ["Grube płótno poliestrowe na drewnianym blejtramie", "Heavy polyester canvas on a wooden stretcher frame"],
    ["Laminowanie dokumentów folią", "Document lamination with"],
    ["Cennik dla grubości", "Price list for thickness"],
    ["również po obróceniu", "including when rotated"],
    ["zakres boków:", "side range:"],
    ["mikronów", "microns"],
    ["szt.", "pcs"],
    ["zł", "PLN"],
    ["W sprawie zlecenia wykraczającego poza kalkulator skontaktuj się z", "For orders outside the calculator's scope, contact"],
    ["Maksymalna wartość zamówienia przez kalkulator to", "The maximum order value through the calculator is"],
    ["Maksymalnie 10 jednakowych obrazów w jednym zamówieniu.", "A maximum of 10 identical canvas prints may be included in one order."],
    ["Minimalny wymiar:", "Minimum size:"],
    ["Maksymalny wymiar:", "Maximum size:"],
    ["Minimalne zamówienie:", "Minimum order:"],
    ["Szerokość folii:", "Film width:"],
    ["Do wymiaru produkcyjnego dodawane są 3 mm.", "3 mm is added to the production size."],
    ["Szerokość: 30–160 cm.", "Width: 30–160 cm."],
    ["Maksymalna szerokość: 160 cm.", "Maximum width: 160 cm."],
    ["Maksymalna wysokość: 10 m.", "Maximum height: 10 m."],
    ["Cena brutto:", "Gross price:"],
    ["Cena jest naliczana", "The price is calculated"],
    ["Cena jest taka sama", "The price is the same"],
    ["Cena druku", "Print price"],
    ["Koszt papieru", "Paper cost"],
    ["Format A3 kosztuje 2 razy więcej niż format A4.", "A3 costs twice as much as A4."],
    ["Cennik studencki nie dotyczy kopiowania książek.", "The student price list does not apply to book copying."],
    ["Kalkulator dodaje", "The calculator adds"],
    ["spadu z każdej strony", "bleed on each side"],
    ["marginesu arkusza", "sheet margin"],
    ["i porównuje układ na SRA4 oraz SRA3.", "and compares the layout on SRA4 and SRA3."],
    ["Cena korzysta z aktualnego cennika druku cyfrowego.", "The price uses the current digital printing price list."],
    ["Wybrany układ:", "Selected layout:"],
    ["Format polecany na podstawie ceny i liczby arkuszy:", "Recommended format based on price and sheet count:"],
    ["polecany", "recommended"],
    ["z każdej strony", "on each side"],
    ["różnica proporcji", "aspect-ratio difference"],
    ["Rozmiar z zachowaniem proporcji:", "Proportional size:"],
    ["Własny wymiar jest rozliczany według najbliższego większego formatu z cennika.", "A custom size is billed according to the next larger size in the price list."],
    ["Przyciski − i + zmieniają wymiar co 10 cm, a w polu możesz wpisać dowolną wartość.", "The − and + buttons change the size in 10 cm steps; you can type any value in the field."],
    ["Plik zostanie automatycznie dodany do załączników po dodaniu produktu do koszyka.", "The file will be attached to the order automatically when you add the product to the cart."],
    ["Pokazujemy go też w podglądzie produktu poniżej — nie trzeba go wgrywać drugi raz.", "We also show it in the product preview below — no need to upload it again."],
    ["zostanie rozliczony jako pełny format", "will be billed as the full format"],
    ["własny wymiar", "custom size"],
    ["rozliczenie jak", "billed as"],
    ["Nie można odczytać tego pliku obrazu.", "This image file could not be read."],
    ["Najpierw wybierz zdjęcie.", "Select an image first."],
    ["Najpierw wybierz zdjęcie lub plik PDF.", "Select an image or PDF first."],
    ["Wybrany plik nie jest prawidłowym plikiem PDF.", "The selected file is not a valid PDF."],
    ["Odczytywanie rozmiaru pierwszej strony PDF…", "Reading the first PDF page size…"],
    ["Nie udało się automatycznie odczytać rozmiaru strony PDF.", "The PDF page size could not be detected automatically."],
    ["Podaj rozmiar pierwszej strony", "Enter the first-page size"],
    ["domyślnie ustawiono A4.", "A4 has been selected by default."],
    ["PDF zostanie automatycznie dodany do załączników po dodaniu wyceny do koszyka.", "The PDF will be added to the attachments automatically when the quote is added to the cart."],
    ["Plik zostanie automatycznie dodany do załączników po dodaniu wyceny do koszyka.", "The file will be added to the attachments automatically when the quote is added to the cart."],
    ["Rozmiar pierwszej strony:", "First-page size:"],
    ["Obsługiwane są pliki PDF, JPG, PNG, WebP i TIFF.", "Supported formats are PDF, JPG, PNG, WebP and TIFF."],
    ["Nie udało się wybrać proponowanego formatu.", "A suggested size could not be selected."],
    ["Można dołączyć maksymalnie", "You can attach up to"],
    ["Ten typ pliku nie jest obsługiwany:", "This file type is not supported:"],
    ["Nie można odczytać rozmiaru pliku:", "The file size could not be read:"],
    ["Łączny rozmiar załączników może wynosić maksymalnie 50 MB.", "The total attachment size may not exceed 50 MB."],
    ["Podaj imię i nazwisko albo nazwę firmy.", "Enter your full name or company name."],
    ["Podaj poprawny adres e-mail.", "Enter a valid email address."],
    ["Zaznacz potwierdzenie zapoznania się z polityką prywatności.", "Confirm that you have read the privacy policy."],
    ["Serwer zwrócił nieprawidłową odpowiedź.", "The server returned an invalid response."],
    ["Nie udało się wysłać wiadomości.", "The message could not be sent."],
    ["Wiadomość została wysłana. Numer zgłoszenia:", "The message has been sent. Enquiry number:"],
    ["Potwierdzenie zostało wysłane również na podany adres e-mail.", "A confirmation was also sent to the provided email address."],
    ["Zamówienie dotarło do Druk24, ale automatyczne potwierdzenie dla klienta nie zostało wysłane. Sprawdź poprawność adresu lub skontaktuj się z nami.", "The enquiry reached Druk24, but the automatic customer confirmation was not sent. Check the email address or contact us."],
    ["Możesz nadal skopiować tekst wiadomości poniżej.", "You can still copy the message text below."],
    ["Nieobsługiwany rodzaj", "Unsupported type of"],
    ["Nie znaleziono", "Could not find"],
    ["Brak ceny dla", "No price is available for"],
    ["Brak cennika dla", "No price list is available for"],
    ["Cięcie ręczne jest doliczane automatycznie:", "Manual cutting is added automatically:"],
    ["obwód każdej sztuki × ilość ×", "perimeter of each item × quantity ×"],
    ["musi być większa od zera.", "must be greater than zero."],
    ["musi być podana w pełnych sztukach.", "must be a whole number."],
    ["Maksymalny", "Maximum"],
    ["Minimalny", "Minimum"],
    ["Maksymalna", "Maximum"],
    ["Minimalna", "Minimum"],
    ["maksymalnie", "up to"],
    ["Maksymalnie", "Up to"],
    ["powyżej", "over"],
    ["Powyżej", "Over"],
    ["Poniżej", "Below"],
    ["zł/szt.", "PLN/pc"],
    ["zł/m²", "PLN/m²"],
    ["zł/mb", "PLN/linear m"]
  ].sort((a, b) => b[0].length - a[0].length);


  const brainrotExact = new Map(Object.entries({
    "Skip to calculator": "YEET YOURSELF STRAIGHT INTO THE RIZZULATOR 🗿",
    "This application requires JavaScript to be enabled.": "JavaScript rage-quit and took the site's aura with it. Turn it on, unc, or the rizzulator stays cooked 💀",
    "Druk24 Szczecin — home page": "Druk24 Szczecin — THE MAIN CHARACTER SPAWN LOBBY 🔥",
    "Enable dark mode": "ENTER THE OHIO SHADOW REALM 🌑",
    "Enable light mode": "ESCAPE THE BASEMENT AND TOUCH DIGITAL GRASS ☀️",
    "Dark mode": "Ohio shadow realm",
    "Light mode": "Retina flashbang mode",
    "Open site menu": "Unseal the forbidden lore menu",
    "Open product menu": "Open the legendary loot wheel",
    "Main menu": "Main-character command centre",
    "Products": "Obtainable loot",
    "Home": "Main-character spawn",
    "Price list": "Financial damage leaderboard",
    "Print Calculator": "THE RIZZULATOR 67 PRO MAX",
    "About us": "Ancient squad lore",
    "Directions and contact": "Locate the print-dungeon coordinates",
    "Contact and directions": "Summon the squad or find the dungeon",
    "Contact": "Slide into the print-dungeon DMs",
    "Services": "Certified aura-farming methods",
    "Print shop": "The industrial ink dungeon",
    "Information": "Forbidden lore dump",
    "Privacy policy": "Data-hoarding lore scroll",
    "Terms and conditions": "The sacred anti-NPC commandments",
    "Online quote calculator": "Online financial-damage rizzulator 67",
    "Monday–Friday:": "Grindset Monday–Friday:",
    "Flyers and posters": "Aura leaflets and wall-mounted sigma propaganda",
    "Flyers": "Disposable aura scrolls",
    "Posters": "Wall-mounted sigma propaganda",
    "Business cards": "Pocket-sized rizz licences",
    "Stickers and labels": "Peelable aura buffs and loot tags",
    "Films and banners": "Skibidi adhesive skins and boss-size wall capes",
    "Roll-ups and X-banners": "Standing rizz totems and X-shaped aura traps",
    "Canvas prints": "Museum-grade aura farming",
    "Describe what you need": "DROP THE SIDE QUEST, UNC — LET THE SQUAD COOK",
    "E.g. business cards, stickers, place cards...": "E.g. rizz licences, aura slaps, wedding NPC nameplates...",
    "Enter a product name or briefly describe your order.": "Name the loot or explain the side quest before your attention span respawns.",
    "No category found": "BRO SEARCHED THE ENTIRE OHIO DATABASE AND FOUND NEGATIVE AURA 💀",
    "Best match:": "Highest-aura lock-on:",
    "Static version running over HTTP": "Serverless sigma build running on pure browser delusion",
    "Choose a product from the menu. All calculations are performed locally in your browser using the data/prices.json file.": "Choose your legendary loot. Your browser cooks every number locally from data/prices.json — no NPC server, no cloud wizard, just raw client-side aura.",
    "Calculators": "Rizzulators and damage simulators",
    "Prices": "Financial damage",
    "Gross": "Damage after the government Fanum tax",
    "Version": "Patch-note lore",
    "Information about sending an enquiry": "MANDATORY SIDE-QUEST LORE — READ BEFORE YOLO",
    "After adding products to the cart, you can complete the form and send an enquiry directly to Druk24. This is not a binding order with an obligation to pay, but a request about production availability, turnaround time, or possible artwork changes.": "After yoinking loot into the vault, drop your main-character lore and launch the side quest at Druk24. This is not the final boss purchase contract — it only asks whether the squad can cook it, how long the grind takes, and whether your artwork needs an aura transplant.",
    "We will contact you as soon as possible after receiving your enquiry—during opening hours, usually within 15 minutes of receiving the preliminary order email.": "Once the side quest lands, the print-dungeon squad will slide back ASAP. During grind hours this usually happens before your attention span reboots — around 15 minutes after the preliminary loot email.",
    "Enter the parameters and calculate the gross price": "FEED THE BUILD STATS AND COOK THE FINAL-BOSS DAMAGE",
    "Business cards 24h": "Pocket rizz licences 24h speedrun",
    "Flyers 24h": "Disposable aura scrolls 24h speedrun",
    "Posters 24h": "Sigma propaganda posters 24h speedrun",
    "Digital printing and copying 24h": "NPC paper-cloning factory 24h speedrun",
    "Films and banners 24h": "Skibidi skins and giant wall capes 24h speedrun",
    "Stickers": "Peelable aura buffs",
    "Roll-up": "Standing rizz totem",
    "PVC and foam boards": "Rigid sigma slabs and lightweight aura boards",
    "T-shirts and apparel": "Wearable drip-forging station",
    "Notepads and pads": "External brain storage and NPC paperwork",
    "Document binding": "Thesis armour and lore containment",
    "Lamination": "Paper force-field deployment",
    "Price editor": "Forbidden financial-damage control room",
    "Search editor": "Search-algorithm lore surgery",
    "Custom size": "Built-different aura dimensions",
    "Poster width [cm]": "Sigma-propaganda gyatt span [cm]",
    "Poster height [cm]": "Vertical rizz elevation [cm]",
    "Poster width": "Sigma-propaganda gyatt span",
    "Poster height": "Vertical rizz elevation",
    "The poster width and height must be greater than zero.": "The poster cannot have zero or negative aura dimensions, unc 💀",
    "No price list is available for the selected poster.": "This sigma poster has escaped the financial-damage database.",
    "No price list is available for the selected poster printing method.": "That ink-cooking build has no damage stats in the sacred chart.",
    "The entered poster size does not fit any format available for the selected printing method.": "That poster is too built different for every available paper arena. Reduce the gyatt span or summon the squad.",
    "A custom size is billed as the smallest standard format that contains the entire poster, including when rotated.": "A built-different poster gets Fanum-taxed as the smallest NPC format that can contain its full aura, even after the rotation jutsu.",
    "Calculate price": "COOK THE FINANCIAL DAMAGE 🔥",
    "Add to cart": "YOINK THIS LOOT INTO THE VAULT",
    "Cart": "Legendary loot vault",
    "Cart is empty.": "The legendary loot vault contains absolutely zero aura.",
    "Your cart is empty.": "Your loot vault is so empty it echoes across Ohio 💀",
    "Remove": "YEET FROM REALITY",
    "Clear cart": "NUKE THE ENTIRE LOOT TIMELINE",
    "Download cart CSV": "Yoink the sacred loot spreadsheet",
    "Order form": "Secure-the-bag side-quest portal",
    "Send enquiry": "LAUNCH THE SIDE QUEST 🚀",
    "Copy": "Yoink the forbidden text",
    "Gross price:": "Final-boss financial damage:",
    "Gross price": "Final-boss financial damage",
    "Total gross": "TOTAL DAMAGE AFTER THE FANUM TAX",
    "Total": "Final-boss damage",
    "Quantity": "Loot stack count",
    "Format": "Aura container format",
    "Material": "Crafting loot material",
    "Width [cm]": "Gyatt span [cm]",
    "Height [cm]": "Vertical rizz [cm]",
    "Width": "Gyatt span",
    "Height": "Vertical rizz",
    "Area": "Aura footprint",
    "Finish": "Final drip enchantment",
    "Print type": "Ink-cooking class",
    "Printing sides": "Number of printable faces",
    "Paper": "Processed tree loot",
    "Colour": "Chromatic aura build",
    "Price": "Financial damage",
    "Unit price": "Damage per loot unit",
    "Minimum order": "Minimum grind requirement",
    "Price tiers": "Financial-damage evolution stages",
    "Specification": "Legendary build stats",
    "Digital 24h": "Pixelmaxxed 24h speedrun",
    "Digital": "Pixelmaxxed ink cooking",
    "Offset": "Ancient offset ink ritual",
    "Single-sided": "One-faced sigma build",
    "Double-sided": "Two-faced final-boss build",
    "130 gsm paper, full colour on both sides": "130 gsm tree loot with maximum chromatic aura on both faces",
    "Flyer type": "Aura-scroll species",
    "Standard turnaround: 24h": "NPC-default grind time: 24h speedrun",
    "Material price tiers": "Crafting-loot damage brackets",
    "Any area": "Any aura footprint",
    "✓ Eyelets included": "✓ Free metal rizz holes installed",
    "Total area": "Combined aura footprint",
    "Price per m²": "Damage per square-metre aura tile",
    "Price before cutting": "Damage before the hand-slice tax",
    "Unit price before cutting": "Unit damage before the hand-slice tax",
    "Total cutting perimeter": "Combined edge-lore length",
    "Manual cutting rate": "Hand-slice tax rate",
    "Manual cutting cost": "Hand-slice financial damage",
    "Manual cutting [PLN/linear m]": "Hand-slice Fanum tax [PLN/linear m]",
    "Product type": "Loot species",
    "Width of one item [mm]": "Single loot gyatt span [mm]",
    "Height of one item [mm]": "Single loot vertical rizz [mm]",
    "Minimum number of stickers": "Minimum aura-slap swarm",
    "Number of sets / items": "Loot-pack / unit stack count",
    "Billable length": "Fanum-taxed material length",
    "Stickers per row": "Aura slaps per mewing lane",
    "Number of rows": "Mewing-lane count",
    "Total stickers produced": "Total aura slaps spawned",
    "Extra stickers": "Bonus aura slaps from the overcook",
    "Length before rounding": "Uncooked length before rounding jutsu",
    "Price per linear metre": "Damage per linear-metre grind",
    "Production size": "Factory final-form dimensions",
    "Glued and spiral notepads and NCR pads": "Glue-maxxed brain-storage slabs, spiral lore books and self-cloning NPC forms",
    "Variant": "Loot evolution",
    "Price list for the selected variant": "Damage chart for the chosen evolution",
    "Number of pads": "Brain-storage slab count",
    "Notepad quantity": "External-memory stack count",
    "135 gsm satin paper": "135 gsm satin tree loot with suspicious aura",
    "170 gsm paper, full colour on one side": "170 gsm tree loot with maximum chromatic aura on one face",
    "Width / format": "Gyatt span / aura container",
    "Gross price list per item": "Final-damage chart per loot unit",
    "The format is specified by the selected variant.": "The chosen evolution already locked the aura container. No reroll, unc.",
    "Roll-up and insert height: 200 cm.": "Standing-rizz totem and scroll elevation: 200 cm of pure vertical aura.",
    "Quantity tier": "Stack-count evolution stage",
    "5 or more items": "5+ loot units — squad buff active",
    "2–4 items": "2–4 loot units — duo/trio arc",
    "1 item": "1 lonely main-character unit",
    "Board thickness": "Sigma-slab thickness lore",
    "Size selection method": "Aura-dimension summoning method",
    "Price-list format": "NPC damage-chart format",
    "Board width [cm]": "Sigma-slab gyatt span [cm]",
    "Board height [cm]": "Sigma-slab vertical rizz [cm]",
    "5 mm foam board price list": "5 mm lightweight sigma-slab damage leaderboard",
    "Thickness": "Chunkiness level",
    "Billing format": "Fanum-tax aura container",
    "Billing method": "Financial-damage ritual",
    "Service type": "Chosen grindset class",
    "Imposition 24h": "Sheet-Tetris maxxing 24h speedrun",
    "Digital printing 24h": "Pixel ink-cooking 24h speedrun",
    "Digital printing": "Pixel ink-cooking ritual",
    "Copying and printing": "NPC paper-clone forge",
    "Book copying": "Forbidden lore duplication",
    "For students 24h": "Academic survival mode 24h",
    "For students": "Academic survival mode",
    "Scanning": "Paper-to-pixel necromancy",
    "Finished width [mm]": "Final-form gyatt span [mm]",
    "Finished height [mm]": "Final-form vertical rizz [mm]",
    "Number of finished items": "Final-form loot stack count",
    "Sheet": "Paper slab",
    "Automatically": "Let the algorithm cook",
    "Paper type": "Tree-loot species",
    "Number of sheets": "Paper-slab stack count",
    "Number of copies": "NPC clone count",
    "Number of pages": "Lore-page count",
    "Scan type": "Pixel-necromancy build",
    "Number of scanned pages": "Digitised lore-page count",
    "Black and white": "No-aura grayscale build",
    "Standard 80 gsm": "NPC-default 80 gsm tree loot",
    "Coloured paper": "Chromatic tree loot",
    "Label paper": "Loot-tag tree loot",
    "130 gsm coated paper": "130 gsm coated aura paper",
    "170 gsm coated paper": "170 gsm coated aura paper",
    "250 gsm coated paper": "250 gsm chunky coated paper",
    "300 gsm coated paper": "300 gsm boss-tier coated paper",
    "350 gsm coated paper": "350 gsm absolute-unit coated paper",
    "SRA4 and SRA3 comparison": "SRA4 vs SRA3 PAPER-ARENA DEATHMATCH",
    "Items/sheet": "Loot units per paper slab",
    "Sheets": "Paper slabs",
    "Finished size": "Final-form dimensions",
    "Size with bleed": "Dimensions after the edge sacrifice",
    "Bleed": "Edge-sacrifice zone",
    "Printable area": "Inkable aura territory",
    "Layout": "Sheet-Tetris formation",
    "Items per sheet": "Loot units spawned per paper slab",
    "Required sheets": "Paper slabs demanded by the grind",
    "Total items produced": "Total loot units spawned",
    "Extra items": "Bonus loot from the overcook",
    "Print price tier": "Ink-damage evolution stage",
    "Price per ordered item": "Damage per requested loot unit",
    "Printed T-shirts and apparel": "Wearable aura-forging and drip production",
    "Product category": "Drip class",
    "Product size": "Wearable hitbox class",
    "Select a size": "Choose the correct drip hitbox",
    "Select a product size.": "Pick a wearable hitbox before cooking the financial damage, unc 💀",
    "We will confirm availability of the selected size and colour after receiving your enquiry.": "The print-dungeon squad will verify whether that size-and-colour skin is actually in the loot pool after your enquiry lands.",
    "Child size — specify in the notes": "Mini-NPC size — drop the stats in notes",
    "Other — specify in the notes": "Built-different size — explain in notes",
    "Mixed sizes — specify in the notes": "Squad-size combo — list the hitboxes in notes",
    "One size": "Universal aura fit",
    "Model": "Chosen character skin",
    "Front print size": "Front-facing aura stamp size",
    "Back print size": "Rear aura stamp size",
    "Quantity discounts": "Stacking-W discount buffs",
    "Print-only orders are not eligible for quantity discounts.": "Ink-only side quests receive no stacking-W buff. The economy said skill issue.",
    "Product colours and specifications ↗": "Character skins, chromatic aura and build stats ↗",
    "First print price": "First aura-stamp damage",
    "Base price per item": "Base character-skin damage per unit",
    "Additional charge for second print": "Second aura-stamp Fanum tax",
    "Total value": "Combined financial destruction",
    "Quantity discount": "Stacking-W buff",
    "Not applied": "Buff denied — zero stack aura",
    "Unit price before discount": "Unit damage before the W buff",
    "Value before discount": "Timeline damage before the W buff",
    "Discount": "Aura-preservation buff",
    "Second print billed as": "Second aura stamp gets Fanum-taxed as",
    "No print": "No ink aura",
    "Front": "Front-facing aura",
    "Back": "Rear-facing aura",
    "Printing and document binding": "Ink cooking plus thesis-armour installation",
    "A4 digital printing and document binding": "A4 pixel ink cooking plus academic boss armour",
    "Print mode": "Ink-cooking stance",
    "Printing method": "Chosen ink ritual",
    "Pages per document": "Lore pages per thesis boss",
    "Binding type": "Thesis-armour class",
    "Binding / coil size": "Armour / spine upgrade size",
    "Total printed pages": "Total cooked lore pages",
    "Total sheets": "Total paper slabs sacrificed",
    "Printing cost": "Ink-cooking financial damage",
    "Binding cost": "Thesis-armour financial damage",
    "Price per copy": "Damage per NPC clone",
    "Document format": "Lore-scroll format",
    "Gross price list": "Final-boss damage chart",
    "Document lamination with": "Deploy paper force field using",
    "Choose a price-list format": "Choose an NPC format from the damage chart",
    "Enter a custom size": "Drop built-different aura dimensions",
    "Fit to an image or PDF": "Let the pixels or PDF choose their fighter",
    "Number of canvas prints": "Museum-aura clone count",
    "Canvas size": "Museum-aura dimensions",
    "Suggested size": "Algorithm-approved aura dimensions",
    "Which side are you entering?": "Which dimension is getting the main-character treatment?",
    "Side length [cm]": "Main-character side length [cm]",
    "Select an image to match a size.": "Feed the machine an image so it can perform aspect-ratio divination.",
    "Preview": "Pre-flight aura check",
    "Size fitting": "Pixel-to-canvas rizz alignment",
    "Suggested sizes": "Algorithm-certified aura containers",
    "Enter one side": "Drop one dimension and let the pixels cook",
    "Select a JPG / PNG / WebP file": "Summon a JPG / PNG / WebP pixel relic",
    "Select a PDF / JPG / PNG / WebP file": "Summon a PDF or pixel relic",
    "Select an image or PDF to match a size.": "Feed the machine an image or PDF for aspect-ratio divination.",
    "First PDF page size": "First PDF scroll dimensions",
    "PDF page width [mm]": "PDF scroll width [mm]",
    "PDF page height [mm]": "PDF scroll height [mm]",
    "Added to cart with the file": "Loot and its pixel relic secured",
    "Billing size": "Fanum-taxed canvas dimensions",
    "Aspect-ratio difference": "Pixel-rizz mismatch",
    "File resolution": "Pixel aura density",
    "Gross total": "FINAL-BOSS DAMAGE TOTAL",
    "Order enquiry form": "SECURE-THE-BAG SIDE-QUEST PORTAL",
    "Enter your details and send an enquiry directly to Druk24.": "Drop your main-character lore and fire the side quest directly into the Druk24 print dungeon.",
    "Full name / company *": "Main character / guild name *",
    "e.g. John Smith / ABC Ltd": "e.g. Sigma John / Ohio Aura Holdings",
    "Email *": "Digital pigeon address *",
    "Before sending, we will check the address format and whether its email domain is working.": "Before launch, the rizzulator checks whether your digital pigeon address has functioning aura and a real domain.",
    "Phone": "Summoning number",
    "Collection method": "Loot extraction method",
    "Collection in person": "Pull up IRL and collect the loot",
    "To be arranged": "The squad will freestyle the extraction",
    "Notes": "Extra side-quest lore",
    "Deadline, packaging method, additional information...": "Final-boss deadline, loot wrapping ritual, cursed requirements...",
    "Attachments": "Side-quest evidence and pixel relics",
    "Add files to the enquiry": "Feed artwork relics into the quest portal",
    "PDFs, images and artwork files. Up to 5 files and 50 MB in total, with no per-file size limit.": "PDFs, pixel relics and artwork artefacts. Max 5 summons and 50 MB total; one relic may consume the whole portal.",
    "No files selected.": "No pixel relics summoned. The portal is giving zero aura.",
    "Remove file": "Banish the pixel relic",
    "Website": "Anti-bot NPC trap",
    "I have read the": "My remaining brain cell has consumed the",
    "privacy policy": "data-hoarding lore scroll",
    "and agree to be contacted about this quote. *": "and permits the print-dungeon squad to summon me about this damage estimate. *",
    "Send enquiry to Druk24": "LAUNCH SIDE QUEST AT DRUK24 🚀",
    "Message text for manual copying": "Emergency carrier-pigeon message text",
    "Message subject": "Quest-scroll title",
    "Message body": "Full side-quest lore",
    "Added to cart": "MASSIVE W — loot yoinked into the vault",
    "Sending…": "The digital pigeon is locked in…",
    "Checking the email address and sending the message…": "Aura-checking the digital pigeon address and launching the quest…",
    "Enquiry sent": "SIDE QUEST DELIVERED — MASSIVE W",
    "Copied to clipboard": "Forbidden text yoinked into the shadow clipboard",
    "Save prices directly to the server": "Seal financial-damage lore directly into the NPC server",
    "Administration panel": "FORBIDDEN SIGMA CONTROL ROOM",
    "Password": "Sacred access glyph",
    "Open price editor": "Unseal the financial-damage laboratory",
    "Open search editor": "Unseal the search-lore laboratory",
    "Incorrect password.": "Wrong sacred glyph. Door said skill issue 💀",
    "Search for a category or price": "Hunt for loot or financial damage",
    "Search for a category": "Hunt for a loot class",
    "Save prices to server": "Engrave damage stats into the server monolith",
    "Apply only in this browser": "Apply only inside this local Ohio timeline",
    "Download prices.json": "Yoink the sacred prices.json damage scroll",
    "Load prices.json": "Summon a prices.json damage scroll",
    "Load current prices from server": "Summon current damage lore from the NPC server",
    "Lock panel": "Reseal the forbidden control room",
    "Add your own customer phrases and terms": "Teach the search goblin new customer dialects",
    "Save and apply": "Seal the lore and deploy the buff",
    "Download search-terms.json": "Yoink the search-goblin dictionary scroll",
    "Load search-terms.json": "Summon a search-goblin dictionary scroll",
    "Restore dictionary from server": "Resurrect the canonical server dictionary",
    "Enter one phrase per line. You may add colloquial names, inflections and common misspellings.": "Feed one incantation per line. Slang, cursed grammar and customer typos are valid search-goblin nutrition.",
    "Druk24 secret": "CLASSIFIED DRUK24 OHIO LORE",
    "Druk24 discount case": "DRUK24 COUNTER-RIZZ LOOT CRATE",
    "Opening works like a case draw. Each attempt uses 1 key and the prize increases your discount.": "Burn one sacred key, watch the loot train edge past the marker and farm wallet-protection aura.",
    "Game status": "Loot-crate aura status",
    "Keys": "Sacred crate keys",
    "1 opening = 1 key": "1 key gets sacrificed per summon",
    "Discount won": "Wallet shield acquired",
    "Prize draw": "Counter-rizz loot roll",
    "Use a key": "UNBOX THE AURA",
    "New round — 5 keys": "Respawn with 5 sacred keys",
    "You have 5 keys. Open the first case.": "Five sacred keys spawned. Unbox the first aura relic.",
    "Copy result": "Yoink the loot prophecy",
    "You won": "Loot acquired",
    "Set images, names, discounts and odds in": "Mod the skins, names, buffs and drop-rate lore in",
    "The easter egg result must be confirmed when placing the order.": "The loot prophecy is not canon until the Druk24 squad confirms it during checkout.",
    "Close case": "Escape the loot-crate dimension",
    "The case is opening...": "The loot train is edging past the sacred marker…",
    "510 gsm coated banner": "510 gsm boss-tier wall cape",
    "Matte self-adhesive film": "Matte skibidi adhesive skin",
    "Gloss self-adhesive film": "Shiny aura-maxxed adhesive skin",
    "Film + laminate": "Skibidi skin with force-field enchantment",
    "One Way Vision film": "NPC-proof one-way window camouflage",
    "Transparent film": "Ghost-mode skibidi adhesive skin",
    "Backlit film": "Glow-up film for maximum night aura",
    "Film with transfer tape": "Rizz-transfer ritual film",
    "Printed film + PVC": "Skibidi skin permanently fused to a sigma slab",
    "5 mm foam board": "5 mm lightweight sigma slab",
    "Laminated stickers": "Armoured peelable aura buffs",
    "Advertising magnets": "Magnetic advertising rizz artefacts",
    "Taxi sticker set": "Taxi side-quest aura-slap bundle",
    "Taxi magnets + sticker set": "Taxi magnetic-rizz and aura-slap mega bundle",
    "Taxi identification sticker": "Taxi identification aura passport",
    "Taxi price list – 2 items": "Taxi damage chart — 2-piece NPC compliance set",
    "Glued notepads": "Glue-maxxed external brain storage",
    "Spiral notepads": "Spiral-bound brain-extension devices",
    "NCR pads": "Self-cloning NPC paperwork slabs",
    "Desk pads": "Desk-sized weekly grind planners",
    "Without cover": "Raw-dogged without protective lore armour",
    "With a 170 gsm coated cover": "With 170 gsm coated boss armour",
    "Original + 1 copy": "Main lore scroll + one NPC clone",
    "Standard": "NPC-default evolution",
    "Standard Black": "Shadow-realm NPC evolution",
    "Exclusive (teardrop)": "Final-boss teardrop evolution",
    "Replacement insert with fitting": "Respawn scroll with installation ritual",
    "X-banner": "X-shaped aura trap",
    "Large-format 24h": "Gigachad-format 24h speedrun",
    "Print only": "Ink cooking only — bring your own drip",
    "Cotton T-shirts": "Cotton aura skins",
    "Polyester T-shirts": "Quick-dry sigma skins",
    "Polo shirts": "Corporate rizz armour",
    "Sweatshirts": "Cold-weather grindset armour",
    "Cotton bags": "Cotton loot sacks",
    "Cotton drawstring bags": "Cotton gym-arc loot sacks",
    "Caps": "Cranium drip upgrades",
    "High-visibility vests": "Construction-core glowing aura armour",
    "Printing on customer-supplied apparel": "Bring-your-own-drip ink ritual",
    "Print price without apparel": "Ink damage without the character skin",
    "None": "No aura selected",
    "Standard print": "NPC-default aura stamp",
    "Up to 10×15 cm": "Tiny aura stamp up to 10×15 cm",
    "Up to 20×30 cm": "Mid aura stamp up to 20×30 cm",
    "Up to 35×40 cm": "Boss aura stamp up to 35×40 cm",
    "20×30 cm print": "20×30 cm chest-aura stamp",
    "Wire coil binding": "Metal-spine thesis upgrade",
    "Plastic coil binding": "Budget plastic-spine upgrade",
    "A4 hard channel binding": "A4 academic final-boss armour",
    "Soft clamp binding": "Soft-lock lore containment",
    "Canvas": "Museum-aura cloth",
    "Heavy polyester canvas on a wooden stretcher frame": "Chunky polyester museum-aura cloth stretched over a wooden sigma skeleton",
    "Automatic": "Algorithm cooks unattended",
    "Manual": "Hands-on unc mode",
    "Soft Touch or gloss lamination": "Soft-Touch aura coating or shiny force field",
    "Gloss or Soft Touch laminated": "Shiny or Soft-Touch paper force field deployed",
    "Gold or silver foil + Soft Touch": "Gold/silver legendary skin plus Soft-Touch aura shield",
    "Folded": "Origami-maxxed",
    "Double-sided printing: print price × 2. The paper cost is added only once.": "Two-faced ink cooking doubles the ink damage. The tree-loot Fanum tax only hits once — rare economy W.",
    "Width of one item [cm]": "Single loot gyatt span [cm]",
    "Height of one item [cm]": "Single loot vertical rizz [cm]",
    "Maximum size: 160 × 300 cm, including when rotated.": "MAX GYATT DIMENSIONS: 160 × 300 cm, rotation jutsu accepted.",
    "Maximum size: 100 × 140 cm, including when rotated.": "MAX FOAM-SIGMA DIMENSIONS: 100 × 140 cm, rotation jutsu accepted.",
    "The maximum foam board size is 100 × 140 cm, including when rotated.": "The lightweight sigma slab caps at 100 × 140 cm. Rotation jutsu is legal; exceeding it is negative aura.",
    "The maximum PVC board size is 160 × 300 cm, including when rotated.": "The rigid sigma slab caps at 160 × 300 cm. Rotation jutsu is legal; beyond that, summon the squad.",
    "Maximum width: 160 cm.": "MAX GYATT SPAN: 160 cm.",
    "The minimum banner width is 30 cm.": "A wall cape skinnier than 30 cm has insufficient aura and gets rejected.",
    "The maximum banner or film width is 160 cm.": "Wall capes and skibidi skins cannot exceed 160 cm gyatt span.",
    "Price list for thickness": "Financial-damage chart for this chunkiness level",
    "A6 and smaller": "A6 and microscopic NPC formats",
    "side range:": "wearable skin-size range:",
    "including when rotated": "rotation jutsu included",
    "Enquiry from the Druk24 calculator": "SIDE QUEST FROM THE DRUK24 RIZZULATOR 67",
    "Hello,": "YO, PRINT WIZARDS,",
    "please review the following order enquiry:": "the main character has dropped the following legendary side quest:",
    "Customer details:": "MAIN-CHARACTER LORE:",
    "Full name / company:": "Main character / guild:",
    "Collection method:": "Loot extraction method:",
    "Order notes:": "Bonus quest lore:",
    "Please confirm the price, turnaround time and file delivery method.": "Please verify the financial damage, grind time and pixel-relic delivery ritual before the timeline gets cooked.",
    "Kind regards,": "Stay locked in and keep the aura,",
    "GROSS TOTAL:": "FINAL-BOSS DAMAGE AFTER FANUM TAX:",
    "Foam boards are billed as complete items only.": "Lightweight sigma slabs are Fanum-taxed as whole loot units only. No fractional slab rizz.",
    "Other sizes fitting within listed formats are billed using the smallest matching format; larger sizes require direct contact.": "Built-different dimensions that fit an NPC format inherit the smallest matching damage tier. Gigachad dimensions must summon the squad directly.",
    "The calculator adds 3 mm bleed on each side, includes a 3 mm sheet margin, and compares layouts on SRA4 and SRA3. The price uses the current digital printing price list.": "The rizzulator sacrifices 3 mm at every edge, respects a 3 mm paper-slab safety zone and forces SRA4 against SRA3 in a sheet-Tetris deathmatch. Damage comes from the current pixel-ink chart.",
    "The price is calculated for every copied page.": "Every duplicated lore page receives its own financial-damage stack.",
    "The price is the same for black-and-white and colour scans.": "No-aura grayscale and chromatic scans deal identical wallet damage. Rare balance patch.",
    "Phrases saved in the panel work immediately in this browser. To publish them for everyone, download search-terms.json and replace data/search-terms.json on the server or GitHub.": "Search-goblin phrases deploy instantly in this browser timeline. For global canon, yoink search-terms.json and replace data/search-terms.json on the server or GitHub monolith.",
    "The server dictionary is in use": "Canonical server search-goblin is currently cooking",
    "The dictionary saved in this browser is in use": "Local browser search-goblin has seized control",
    "Full colour, double-sided": "Maximum chromatic aura on both faces",
    "Price tier": "Financial-damage evolution stage",
    "Price list:": "Damage leaderboard:",
    "Best match": "HIGHEST-AURA LOCK-ON",
    "Brainrot mode activated 💀": "OHIO PROTOCOL 67 DEPLOYED — RIZZULATOR OVERCLOCKED, SKIBIDI CORE ONLINE, AURA IN CRITICAL CONDITION, UNC 💀🗿🔥",
    "100% cotton, 145 gsm, fitted cut with side seams, silicone finish, men's, women's and children's styles.": "100% cotton sigma weave, 145 gsm lightweight aura, fitted side-seam build, silicone glow-up finish — skins for men, women and the junior squad.",
    "100% cotton, 160 gsm, tubular construction, silicone finish, men's, women's and children's styles.": "100% cotton sigma weave, 160 gsm NPC-proof tube build, silicone glow-up finish — character skins for the whole squad.",
    "100% cotton, 180 gsm, side seams, silicone finish, slim fit with V-neck, women's and men's styles.": "100% cotton sigma weave, 180 gsm chunky aura, side-seam architecture, silicone glow-up and a V-neck mewing cut for the squad.",
    "100% cotton, 200 gsm, tubular construction, silicone finish, unisex oversized cut.": "100% cotton absolute-unit weave, 200 gsm boss armour, tubular build, silicone glow-up and oversized unisex main-character proportions.",
    "100% cotton, 170 gsm, side slits, men's and women's styles.": "100% cotton corporate-rizz weave, 170 gsm, side-slit mobility buff and character skins for men and women.",
    "100% cotton, 180 gsm, side-seam construction, men's and women's styles.": "100% cotton sigma weave, 180 gsm, reinforced side-seam lore and drip variants for men and women.",
    "100% micro-polyester, 140 gsm, side seams, quick-drying fabric, men's and women's styles.": "100% micro-polyester gym-arc tech, 140 gsm, side-seam build, sweat-deleting fabric and athlete skins for men and women.",
    "100% polyester, 130 gsm, side seams, smooth quick-drying fabric, relaxed unisex cut.": "100% polyester speedrun fabric, 130 gsm, side-seam lore, smooth sweat-evaporation buff and relaxed unisex sigma cut.",
    "100% polyester, 150 gsm, side seams, quick-drying fabric, men's, women's and children's styles.": "100% polyester gym-arc armour, 150 gsm, side-seam build, quick-dry aura and character skins for the entire squad.",
    "65% cotton, 35% polyester, 200 gsm, side seams, silicone finish, men's, women's and children's styles.": "65% cotton + 35% polyester corporate-rizz fusion, 200 gsm boss-tier weight, side seams, silicone glow-up and skins for the whole squad.",
    "Cotton drawstring backpack with an approximately 20×30 cm print": "Cotton gym-arc loot sack with an approximately 20×30 cm back-mounted aura stamp",
    "Baseball or trucker cap": "Baseball or trucker cranium-drip upgrade",
    "Heavy unisex cotton-polyester sweatshirt": "Heavy unisex cotton-polyester winter-grind boss armour",
    "Yellow or orange, sizes S–3XL": "Construction-core yellow or orange glow aura, character sizes S–3XL"
}));

  const brainrotPhrases = [
    [
        "After adding products to the cart",
        "After yoinking legendary loot into the vault"
    ],
    [
        "send an enquiry directly to Druk24",
        "launch the side quest straight into the Druk24 print dungeon"
    ],
    [
        "We will contact you as soon as possible",
        "The print-dungeon squad will slide back before the timeline gets cooked"
    ],
    [
        "during opening hours",
        "while the industrial grindset portal is open"
    ],
    [
        "usually within 15 minutes",
        "usually before your attention span respawns"
    ],
    [
        "full colour on both sides",
        "maximum chromatic aura on both faces"
    ],
    [
        "full colour on one side",
        "maximum chromatic aura on one face"
    ],
    [
        "full colour",
        "maximum chromatic aura"
    ],
    [
        "single-sided printing",
        "one-faced ink cooking"
    ],
    [
        "double-sided printing",
        "two-faced final-boss ink cooking"
    ],
    [
        "single-sided",
        "one-faced sigma build"
    ],
    [
        "double-sided",
        "two-faced final-boss build"
    ],
    [
        "custom size",
        "built-different aura dimensions"
    ],
    [
        "custom dimensions",
        "built-different aura dimensions"
    ],
    [
        "price-list format",
        "NPC damage-chart format"
    ],
    [
        "price list",
        "financial-damage leaderboard"
    ],
    [
        "turnaround time",
        "grindset completion time"
    ],
    [
        "turnaround",
        "grindset completion"
    ],
    [
        "production availability",
        "whether the cooking ritual is available"
    ],
    [
        "production",
        "industrial aura cooking"
    ],
    [
        "artwork changes",
        "pixel-relic aura surgery"
    ],
    [
        "customer-supplied",
        "bring-your-own-drip"
    ],
    [
        "customer",
        "main character"
    ],
    [
        "preliminary order",
        "beta-version side quest"
    ],
    [
        "order enquiry",
        "legendary side quest"
    ],
    [
        "order",
        "quest timeline"
    ],
    [
        "enquiry",
        "side quest"
    ],
    [
        "calculator",
        "rizzulator 67"
    ],
    [
        "printing method",
        "ink-cooking ritual"
    ],
    [
        "printing",
        "ink cooking"
    ],
    [
        "Print",
        "Cook"
    ],
    [
        "price before discount",
        "damage before the aura-preservation buff"
    ],
    [
        "price per",
        "financial damage per"
    ],
    [
        "price",
        "financial damage"
    ],
    [
        "Price",
        "Financial damage"
    ],
    [
        "gross total",
        "final-boss damage total"
    ],
    [
        "gross price",
        "final-boss financial damage"
    ],
    [
        "Gross",
        "Damage after Fanum tax"
    ],
    [
        "quantity discount",
        "stacking-W discount buff"
    ],
    [
        "quantity",
        "loot stack count"
    ],
    [
        "Quantity",
        "Loot stack count"
    ],
    [
        "total",
        "final-boss damage"
    ],
    [
        "Total",
        "Final-boss damage"
    ],
    [
        "minimum order",
        "minimum grind requirement"
    ],
    [
        "minimum",
        "minimum aura threshold"
    ],
    [
        "Minimum",
        "Minimum aura threshold"
    ],
    [
        "Maximum size",
        "MAX GYATT DIMENSIONS"
    ],
    [
        "maximum size",
        "max gyatt dimensions"
    ],
    [
        "Maximum width",
        "MAX GYATT SPAN"
    ],
    [
        "maximum width",
        "max gyatt span"
    ],
    [
        "Maximum",
        "Max aura cap"
    ],
    [
        "maximum",
        "max aura cap"
    ],
    [
        "required sheets",
        "paper slabs demanded by the grind"
    ],
    [
        "required",
        "mandatory or the aura collapses"
    ],
    [
        "Select an image",
        "Summon a pixel relic"
    ],
    [
        "Select",
        "Choose your fighter:"
    ],
    [
        "Choose",
        "Choose your fighter:"
    ],
    [
        "Enter",
        "Drop"
    ],
    [
        "No price list",
        "The sacred financial-damage leaderboard is missing"
    ],
    [
        "No price",
        "No financial-damage lore"
    ],
    [
        "No files",
        "Zero pixel relics"
    ],
    [
        "Could not find",
        "Bro searched Ohio and still could not find"
    ],
    [
        "does not fit",
        "is too built different for"
    ],
    [
        "must be greater than zero",
        "needs positive aura, not zero or debt"
    ],
    [
        "must be a whole number",
        "must be a whole loot unit — no fractional NPCs"
    ],
    [
        "not supported",
        "rejected by the sacred lore engine"
    ],
    [
        "Error",
        "MASSIVE SKILL ISSUE"
    ],
    [
        "Successfully",
        "CERTIFIED MASSIVE W:"
    ],
    [
        "Saved",
        "Lore sealed into canon"
    ],
    [
        "Save",
        "Seal into canon"
    ],
    [
        "Download",
        "Yoink"
    ],
    [
        "Upload",
        "Feed the machine"
    ],
    [
        "Delete",
        "Banish from the timeline"
    ],
    [
        "Remove",
        "Yeet from reality"
    ],
    [
        "Copied",
        "Yoinked"
    ],
    [
        "Sending",
        "Launching the digital pigeon"
    ],
    [
        "items produced",
        "loot units spawned"
    ],
    [
        "finished items",
        "final-form loot units"
    ],
    [
        "items per sheet",
        "loot units per paper slab"
    ],
    [
        "items",
        "loot units"
    ],
    [
        "item",
        "loot unit"
    ],
    [
        "copies",
        "NPC clones"
    ],
    [
        "copy",
        "NPC clone"
    ],
    [
        "pages",
        "lore pages"
    ],
    [
        "page",
        "lore page"
    ],
    [
        "sheets",
        "paper slabs"
    ],
    [
        "sheet",
        "paper slab"
    ],
    [
        "perimeter",
        "edge-lore length"
    ],
    [
        "cutting",
        "hand-slice edging ritual"
    ],
    [
        "board",
        "sigma slab"
    ],
    [
        "film",
        "skibidi adhesive skin"
    ],
    [
        "stickers",
        "peelable aura buffs"
    ],
    [
        "sticker",
        "peelable aura buff"
    ],
    [
        "poster",
        "sigma propaganda poster"
    ],
    [
        "flyer",
        "disposable aura scroll"
    ],
    [
        "business card",
        "pocket rizz licence"
    ],
    [
        "notepad",
        "external brain-storage slab"
    ],
    [
        "binding",
        "thesis armour"
    ],
    [
        "lamination",
        "paper force field"
    ],
    [
        "canvas",
        "museum-aura cloth"
    ],
    [
        "material",
        "crafting loot material"
    ],
    [
        "format",
        "aura container format"
    ],
    [
        "width",
        "gyatt span"
    ],
    [
        "height",
        "vertical rizz"
    ],
    [
        "area",
        "aura footprint"
    ],
    [
        "colour",
        "chromatic aura"
    ],
    [
        "color",
        "chromatic aura"
    ],
    [
        "discount",
        "aura-preservation buff"
    ],
    [
        "standard",
        "NPC-default"
    ],
    [
        "automatic",
        "algorithm-cooked"
    ],
    [
        "manual",
        "hands-on unc"
    ],
    [
        "server",
        "NPC server monolith"
    ],
    [
        "browser",
        "local Ohio timeline"
    ],
    [
        "file",
        "pixel relic"
    ],
    [
        "email",
        "digital pigeon message"
    ],
    [
        "phone",
        "summoning number"
    ],
    [
        "password",
        "sacred access glyph"
    ],
    [
        "PLN",
        "PLN aura coins"
    ]
].sort((a, b) => b[0].length - a[0].length);

  const compoundExact = [...exact.entries()]
    .filter(([key]) => key.length >= 8 || /[\s,;+\/()–—-]/.test(key))
    .sort((a, b) => b[0].length - a[0].length);

  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalValues = new WeakMap();
  let translating = false;
  let queued = false;

  function getLocale() {
    if (language === "en") return "en-GB";
    if (language === "brainrot") return "en-US";
    return "pl-PL";
  }

  function translateString(value) {
    const input = String(value ?? "");
    if (language !== "en" || !input) return input;
    if (input.includes("\n")) return input.split("\n").map(line => translateString(line)).join("\n");
    const leading = input.match(/^\s*/)?.[0] || "";
    const trailing = input.match(/\s*$/)?.[0] || "";
    const core = input.slice(leading.length, input.length - trailing.length || input.length);
    if (!core) return input;
    if (exact.has(core)) return leading + exact.get(core) + trailing;
    let output = core;
    for (const [from, to] of compoundExact) output = output.split(from).join(to);
    for (const [from, to] of phrases) output = output.split(from).join(to);
    output = output
      .replace(/\b(\d+)\s+rz\.\b/g, "$1 rows")
      .replace(/\b(\d+)\s+kol\.\b/g, "$1 cols")
      .replace(/\b(\d+)\s+kart\b/g, "$1 sheets")
      .replace(/\b(\d+)\s+kompletów\b/g, "$1 sets")
      .replace(/\b(\d+)\s+kopii\b/g, "$1 copies")
      .replace(/\b(\d+)\s+arkuszy\b/g, "$1 sheets")
      .replace(/\bCena\b/g, "Price")
      .replace(/\bIlość\b/g, "Quantity")
      .replace(/\bWariant\b/g, "Variant")
      .replace(/\bPapier\b/g, "Paper")
      .replace(/\bMateriał\b/g, "Material")
      .replace(/\bSzerokość\b/g, "Width")
      .replace(/\bWysokość\b/g, "Height")
      .replace(/\bŁącznie\b/g, "Total")
      .replace(/\bDodatkowych\b/g, "Extra")
      .replace(/\bWymiar\b/g, "Size")
      .replace(/\bRozmiar\b/g, "Size")
      .replace(/\bKolor\b/g, "Colour")
      .replace(/\bCzas realizacji\b/g, "Turnaround time")
      .replace(/\bOd\b/g, "From")
      .replace(/\bod\b/g, "from")
      .replace(/\bdo\b/g, "to")
      .replace(/\bsztuk\b/g, "items")
      .replace(/\bsztuki\b/g, "items")
      .replace(/\bsztuka\b/g, "item")
      .replace(/\bszt\.\b/g, "pcs")
      .replace(/\bzł\b/g, "PLN")
      .replace(/\bmb\b/g, "linear m")
      .replace(/\bDruk\b/g, "Printing")
      .replace(/\bdruk\b/g, "printing")
      .replace(/\bplik\b/g, "file")
      .replace(/\bfolia\b/g, "film")
      .replace(/\bpłyta\b/g, "board")
      .replace(/\bkolor\b/g, "colour")
      .replace(/stron(?=\s|$|[,.])/g, "pages")
      .replace(/egz\./g, "copies")
      .replace(/\bpo\b/g, "with")
      .replace(/\bCyfrowy\b/g, "Digital")
      .replace(/\bcyfrowy\b/g, "digital")
      .replace(/\bKolorowy\b/g, "Colour")
      .replace(/\bkolorowy\b/g, "colour")
      .replace(/\bJednostronny\b/g, "Single-sided")
      .replace(/\bjednostronny\b/g, "single-sided")
      .replace(/\bJednostronne\b/g, "Single-sided")
      .replace(/\bjednostronne\b/g, "single-sided")
      .replace(/\bDwustronny\b/g, "Double-sided")
      .replace(/\bdwustronny\b/g, "double-sided")
      .replace(/\bDwustronne\b/g, "Double-sided")
      .replace(/\bdwustronne\b/g, "double-sided")
      .replace(/\bNakład\b/g, "Quantity")
      .replace(/\bZadruk\b/g, "Printing sides")
      .replace(/\bMateriał\b/g, "Material")
      .replace(/\bŁączna powierzchnia\b/g, "Total area")
      .replace(/\bMinimum zamówienia\b/g, "Minimum order")
      .replace(/\bPróg cenowy\b/g, "Price tier");
    return leading + output + trailing;
  }

  function shouldSkipElement(element) {
    if (!element) return true;
    return Boolean(element.closest("script, style, code, pre, [data-no-translate]"));
  }

  function translateTextNode(node) {
    if (!node || shouldSkipElement(node.parentElement)) return;
    const current = node.nodeValue || "";
    let source = originalText.get(node);
    if (source == null) {
      source = current;
      originalText.set(node, source);
    } else if (language !== "pl" && current !== translateForLanguage(source) && current !== source) {
      source = current;
      originalText.set(node, source);
    }
    const target = translateForLanguage(source);
    if (node.nodeValue !== target) node.nodeValue = target;
  }

  function translateFromSource(source) {
    const previous = language;
    language = "en";
    const result = translateString(source);
    language = previous;
    return result;
  }

  function translateBrainrotFromSource(source) {
    const english = translateFromSource(source);
    const input = String(english ?? "");
    if (!input) return input;
    if (input.includes("\n")) return input.split("\n").map(line => translateBrainrotFromSource(line)).join("\n");
    const leading = input.match(/^\s*/)?.[0] || "";
    const trailing = input.match(/\s*$/)?.[0] || "";
    const core = input.slice(leading.length, input.length - trailing.length || input.length);
    if (!core) return input;
    if (brainrotExact.has(core)) return leading + brainrotExact.get(core) + trailing;
    let output = core;
    for (const [from, to] of brainrotPhrases) output = output.split(from).join(to);
    return leading + output + trailing;
  }

  function translateForLanguage(source, targetLanguage = language) {
    if (targetLanguage === "en") return translateFromSource(source);
    if (targetLanguage === "brainrot") return translateBrainrotFromSource(source);
    return String(source ?? "");
  }


  function translateAttributes(element) {
    if (!element || shouldSkipElement(element)) return;
    const names = ["placeholder", "aria-label", "title", "alt"];
    let stored = originalAttributes.get(element);
    if (!stored) {
      stored = {};
      originalAttributes.set(element, stored);
    }
    names.forEach(name => {
      if (!element.hasAttribute(name)) return;
      const current = element.getAttribute(name) || "";
      if (!(name in stored)) stored[name] = current;
      else if (language !== "pl" && current !== translateForLanguage(stored[name]) && current !== stored[name]) stored[name] = current;
      const target = translateForLanguage(stored[name]);
      if (element.getAttribute(name) !== target) element.setAttribute(name, target);
    });
  }

  function translateReadonlyValue(element) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
    if (!element.readOnly) return;
    const current = element.value || "";
    let source = originalValues.get(element);
    if (source == null || (current !== translateForLanguage(source) && current !== source)) {
      source = current;
      originalValues.set(element, source);
    }
    const target = translateForLanguage(source);
    if (element.value !== target) element.value = target;
  }

  function translateTree(root) {
    if (!root) return;
    translating = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) translateTextNode(root);
      if (root.nodeType === Node.ELEMENT_NODE) {
        translateAttributes(root);
        translateReadonlyValue(root);
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        else {
          translateAttributes(node);
          translateReadonlyValue(node);
        }
      }
    } finally {
      translating = false;
    }
  }

  function queueTranslate() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      translateTree(document.body);
      updateToggle();
    });
  }

  function updateToggle() {
    const button = document.getElementById("languageToggle");
    if (!button) return;
    const label = language === "pl" ? "EN" : "PL";
    const ariaLabel = language === "pl" ? "Switch language to English" : "Przełącz język na polski";
    const title = language === "pl" ? "English" : "Polski";
    if (button.textContent !== label) button.textContent = label;
    if (button.getAttribute("aria-label") !== ariaLabel) button.setAttribute("aria-label", ariaLabel);
    if (button.getAttribute("title") !== title) button.setAttribute("title", title);
  }

  function setLanguage(next, persist = true) {
    language = supported.has(next) ? next : "pl";
    document.documentElement.lang = language === "pl" ? "pl" : "en";
    document.documentElement.dataset.language = language;
    if (persist && persistentLanguages.has(language)) {
      try { localStorage.setItem(STORAGE_KEY, language); } catch {}
    }
    translateTree(document.body);
    updateToggle();
    document.dispatchEvent(new CustomEvent("drukulator:languagechange", { detail: { language } }));
  }

  function setup() {
    document.documentElement.lang = language === "pl" ? "pl" : "en";
    document.documentElement.dataset.language = language;
    const button = document.getElementById("languageToggle");
    if (button) button.addEventListener("click", () => setLanguage(language === "pl" ? "en" : "pl"));
    updateToggle();
    translateTree(document.body);

    const observer = new MutationObserver(mutations => {
      if (translating) return;
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTextNode(mutation.target);
        mutation.addedNodes.forEach(node => translateTree(node));
      }
      updateToggle();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: false });
    document.addEventListener("input", queueTranslate, true);
    document.addEventListener("change", queueTranslate, true);

    const nativeAlert = window.alert.bind(window);
    const nativeConfirm = window.confirm.bind(window);
    window.alert = message => nativeAlert(translateForLanguage(String(message)));
    window.confirm = message => nativeConfirm(translateForLanguage(String(message)));
  }

  window.DrukulatorI18n = {
    getLanguage: () => language,
    getLocale,
    translate: value => translateForLanguage(String(value ?? "")),
    setLanguage,
    refresh: queueTranslate
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
