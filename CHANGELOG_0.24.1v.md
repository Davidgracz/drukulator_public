# Drukulator 0.24.1v

Wydanie zbudowane na **działającej wersji 0.23.27** (wszystkie jej zmiany zachowane). Zawiera dwie części:

- **A. Odzież (nowe)** — zmiany zgłoszone w zamówieniu: krój koszulek, bez pola nadruku pod wizualizacją, dwie kamizelki, czapki i torby tylko z przodu, informacja o rabacie przy ilości.
- **B. Czytelność dla klienta (16 poprawek UX)** — przeniesione z wersji 0.24.0 na bazę 0.23.27.

**Nie zmieniono cen istniejących produktów, progów rabatowych, logiki liczenia (`calculateApparel` itd.) ani plików PHP.**
Jedyne zmiany w danych cennika: kamizelka „Kamizelka odblaskowa” (40 zł) zmienia nazwę na „Brixton Flash” (ta sama cena) oraz dodano „Malfini Rimeck” — 50 zł (cena podana w zamówieniu).
Jedyna zmiana w `calculators.js` to rozdzielenie jednej etykiety folii na dwie (obie wskazują ten sam wiersz cennika) — część B.

---

## A. Koszulki i odzież

1. **Wybór kroju w „Podglądzie produktu”** — zamiast stałego napisu „Koszulka męska” klient wybiera krój przyciskami:
   Męska / Damska / Dziecięca albo tylko Męska / Damska — zależnie od modelu (wg opisów w cenniku):
   - Basic 160 g, Classic New 145 g, Fantasy 150 g, Pique Polo 200 g — męska, damska, dziecięca,
   - Slim Fit V-neck 180 g, Chance 140 g, Cotton 170 g, Single Jersey 180 g, Cape — męska, damska,
   - Heavy New 200 g, Pixel 130 g, Essential — Unisex (jedna, stała wartość),
   - Trendy Zipper — brak informacji o kroju w cenniku, więc bez wyboru.
   Wybrany krój trafia do opisu zamówienia, do szczegółów w koszyku („Krój (preferencja)”) i do danych zamówienia (`meta.cut`). Krój **nie zmienia ceny**.
   Zdjęcia są jedne dla modelu (krój męski / unisex) — przy innym kroju pojawia się krótka uwaga, że zdjęcie jest poglądowe, a kolory są te same.
2. **Usunięte pole nadruku pod wizualizacją** — znikają przeciągany prostokąt na zdjęciu oraz „Pokaż obszar nadruku”, „Wyśrodkuj pole” i opis pod miniaturami. Pod zdjęciem zostają miniatury ujęć (Przód / Profil / Tył), a w panelu obok — krój i **kolor**.
   Pola formularza „Nadruk z przodu / z tyłu” zostają, bo od nich zależy cena.
3. **Ilość sztuk** — pod polem: „Wpisz sumę wszystkich zamawianych sztuk (razem: rozmiary, kolory i kroje tego modelu). Rabat naliczymy automatycznie.” oraz na żywo: aktualny próg rabatu i następny (np. „Rabat przy tej ilości: 10%. Następny próg: 20 szt. — 15%.”).
   To tylko informacja — rabat nadal liczy dotychczasowa logika (progi z `prices.json`: 6/5%, 10/10%, 20/15%, 30/20%, 50/25%, osobno dla każdej pozycji w koszyku). Przy „Sam nadruk” podpowiedź mówi, że rabatu nie ma. Pole „Dodatkowy opis” podpowiada podział na rozmiary i kolory.
4. **Kamizelki odblaskowe — dwa modele**, pokazane i opisane jak koszulki (podgląd, miniatury, kolor, dane techniczne):
   - **Brixton Flash** (AFK4, Polstar) — 40 zł, rozmiary S–3XL, 100% poliester 120 g/m², EN ISO 20471 kl. 2, żółty / pomarańczowy; zdjęcia ze strony polstar.com.pl (przód, ujęcie z boku, tył — dla obu kolorów).
   - **Malfini Rimeck HV Bright** (9V3) — 50 zł, tylko rozmiary M i 2XL, 100% poliester 120 g/m², EN ISO 20471 kl. 2, żółty / pomarańczowy; zdjęcia z katalogu Malfini (jak dotąd).
   Kolor wybiera się w podglądzie (dwa pola koloru) — usunięto osobną listę „Kolor kamizelki”. Cena nadruku w cenie i wybór „Przód / Tył” bez zmian.
5. **Czapki** — jeden wybór: nadruk z przodu. Brak wyboru „Przód / Tył”, w podglądzie tylko ujęcia Przód i Profil (bez tyłu). Cena bez zmian.
6. **Torby i worki** — jak czapki: tylko przód, bez tyłu. Ceny bez zmian.

### Zdjęcia kamizelki Brixton Flash
Zdjęcia są ładowane bezpośrednio z polstar.com.pl (sprawdzone z domeny druk24.szczecin.pl) — pełne zdjęcie w podglądzie, miniatury „thumb_” w przyciskach ujęć.
Jeśli się nie wczytają, wyświetli się lokalna kopia `assets/malfini/AFK4-{yellow|orange}-{front|side|back}.webp` (jeśli ją dodasz), a w ostateczności wizualizacja poglądowa.
Zalecane: zapisać zdjęcia lokalnie za zgodą Polstar (patrz `assets/malfini/README.md`).

---

## B. Czytelność dla klienta (z 0.24.0, przeniesione na 0.23.27)

### Priorytet 1 — decyzja i cena
1. **Stały pasek ceny (telefon)** — cena brutto, cena za sztukę i „Dodaj do koszyka” zawsze na dole ekranu; pod spodem „Zadzwoń” i mały przycisk koszyka. Na komputerze cena jest w bloku przy formularzu („w tym VAT”, cena za sztukę).
2. **Jednolite słownictwo** — „zamówienie” zamiast mieszanki „zapytanie / zamówienie / wycena”; informacja, że wysłanie nie jest zakupem i nie uruchamia produkcji, na górze strony głównej.
3. **Wybór ilości** — każda ilość pokazuje cenę łączną i za sztukę; bez zdublowanych „chipów”; w porównaniu wariantów jedna czynność na kartę, do koszyka dodaje jeden stały przycisk; „Potrzebujesz innej ilości? Zadzwoń lub napisz”.
4. **Technologia druku** — usunięto zdublowane pole „Rodzaj druku” (zostaje decyzja „Szybko czy ekonomicznie?”; natywne pole zostaje w kodzie).
5. **Ceny opcji** — wybrana opcja pokazuje cenę łączną, pozostałe różnicę (+30,00 zł / bez dopłaty).
6. **Wykończenie** — „Folia Soft Touch lub błysk” rozdzielone na „Folia Soft Touch” i „Folia błyszcząca” (offset analogicznie); ceny bez zmian.

### Priorytet 2 — prostszy język i ścieżka
7. **Plik i podgląd** — plik wybrany w podglądzie jest dołączany do zamówienia po dodaniu do koszyka; lista kontrolna przygotowania pliku.
8. **Żargon** — „Zadruk” → „Ile stron zadrukować”, „Nakład” → „Ilość sztuk”, „Spad/Netto” → „margines na docięcie”, „Uruchom asystenta zamówień / BEZ AI” → „Pomóż mi wybrać”, poprawione odmiany.
9. **Strona główna** — jeden układ kafelków, jeden przycisk pomocy, bez zdublowanych skrótów i paska „zaufania”.
10. **Kroki** — „Ustaw parametry → Dodaj do koszyka → Wyślij zamówienie”.
11. **Puste okienko „Twoje zamówienie”** — ukryte, dopóki koszyk jest pusty.
12. **Menu** — jeden podpisany przycisk „Produkty” (po przewinięciu zmniejsza się do ikony); poprawione etykiety ARIA.

### Priorytet 3 — porządki
13. Komunikat o potwierdzeniu ceny i terminu przez drukarnię — jeden raz, przy cenie.
14. Czytelność: tekst pomocniczy min. 14 px, pola formularzy 16 px, cele dotyku min. 44 px, kolory zgodne z WCAG AA.
15. Numer wersji niewidoczny dla klientów (zostaje w `data-drukulator-version` na `<html>`).
16. Stały kontakt „Zadzwoń 91 831 47 47” przy pasku ceny (telefon), w polu „Inna ilość” i na stronie głównej.

Dodatkowo: tabele progów cenowych na telefonie przewijają się wewnątrz siebie; komunikat „Dodano do koszyka” nie nachodzi na pasek ceny; tłumaczenia EN nowych tekstów (`i18n.js`).

---

## Pliki
Nowy: `assets/ux-clarity.css`.
Zmienione: `index.html`, `data/prices.json` (tylko sekcja „Kamizelki odblaskowe”), `js/app.js`, `js/malfini-preview.js`, `js/smart-forms.js`, `js/calculators.js`, `js/checkout-experience.js`, `js/frontend-refresh.js`, `js/i18n.js`, `js/intelligent-configurator.js`, `js/product-preview.js`, `js/variant-comparison.js`, `assets/malfini-preview.css`, `assets/malfini/README.md`.
Testy dostosowane: `apparel_02318.test.cjs`, `apparel_02318_browser.py`, `malfini_photos_02322.test.cjs`, `malfini_preview_unit.py`, `malfini_preview_browser.py`, `variant-comparison-browser.test.py`.
Wersje zasobów: `?v=0.24.1`.

## Testy
- Przechodzą: `apparel_02318`, `apparel_02318_browser`, `apparel_02325_buttons_browser`, `apparel_02326_layout_browser`, `malfini_photos_02322`, `malfini_preview_unit`, `new_catalog_02313`, `checkout_limits_02310`, `quote-interpreter`, `forms_02317_browser`, `home_checkout_02316_browser`, `posters_02311/02312`, `variant-comparison-browser`.
- Nie przechodziły już w 0.23.27 (to samo miejsce awarii przed i po zmianach; nie naprawiano): `browser_smoke_mocked`, `compact-choices-browser`, `configurator-browser`, `configurator-regression`, `malfini_preview_browser`.
- Ręcznie: 18 stron produktowych na 390 px bez błędów JS; dodanie do koszyka z każdej nowej opcji odzieży (koszulka — krój damski, czerwona, 12 szt. = 594,00 zł; Brixton Flash pomarańczowa 40,00 zł; Rimeck 10 szt. = 450,00 zł; czapka i torba tylko przód).
