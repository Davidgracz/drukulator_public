# Drukulator 0.24.3v

Wydanie na bazie **0.24.2v** (zawiera wszystkie jej zmiany).

**Nie zmieniono cen, progów rabatowych, logiki liczenia ani plików PHP.** Ceny pianek i czapek w `data/prices.json` – bez zmian (zmieniony tylko tekst opisu czapki raperki).

---

## 1. Czapka raperka = Malfini RAP 5P 301 (zamiast Trucker 5P 311)
Poprzednio „Czapka raperka” była pokazywana jako model Trucker 5P (kod 311) – to był błąd. Teraz:
- Podgląd produktu pokazuje **Malfini RAP 5P (kod 301)**: czapka raperka snapback, twill 100% bawełna, rozmiar uniwersalny.
- **7 kolorów z katalogu Malfini** (nazwy jak w sklepie): Biały, Czarny, Granatowy, Chabrowy, Czerwony, Siwoszary melanż, Czerwień purpurowa.
- Zdjęcia (przód i profil) są ładowane ze sklepu Malfini dla wybranego koloru (adresy `…/image/product/301/301_<kolor>_<ujęcie>…`).
- Link „Zobacz produkt w katalogu Malfini” prowadzi do https://shop.malfini.com/pl/pl/product/rap-5p-301.
- Naprawione przy okazji: lista kolorów czapek była na sztywno jedna dla wszystkich czapek – teraz każdy model czapki ma własną (bejsbolówka 305 bez zmian: 4 kolory).
- Opis w cenniku: „Czapka raperka Malfini RAP 5P (snapback, płaski daszek). Szczegóły i kolor uzgodnimy mailowo.” (cena 55 zł bez zmian).

## 2. Pianki (strona „PCV i pianki” → Plansza pianka 5 mm)
- Z kafelków formatów **zniknęły rozmiary w mm** (np. „297 × 420 mm”, które w dodatku nie zgadzały się z nazwą formatu w cm).
- Zamiast nich pod nazwą formatu jest **cena za sztukę z cennika** (brutto), w niebieskim kolorze jak w innych miejscach: np. A3 50,00 zł/szt., A2 55,00 zł/szt., A1 90,00 zł/szt., B2 65,00 zł/szt., B1 120,00 zł/szt., B0 220,00 zł/szt.
- „Podgląd produktu” (panel „Plik i podgląd projektu”) na stronie PCV i pianki podaje rozmiar w **cm** (np. 70 × 100 cm; wcześniej w mm).

---

## Pliki zmienione względem 0.24.2v
`index.html` (wersja zasobów `?v=0.24.3`), `js/app.js` (VERSION 0.24.3v), `js/smart-forms.js`, `js/malfini-preview.js`, `js/product-preview.js`, `js/i18n.js`, `data/prices.json` (tylko tekst `opis` czapki raperki), `tests/foam_caps_0243_browser.py` (nowy).

## Testy
Nowy test `tests/foam_caps_0243_browser.py` (desktop 1440 px i telefon 390 px) – przechodzi. Pozostałe testy – wyniki identyczne jak w 0.24.2v (te same 5 testów nie przechodzi także na działającej 0.23.27: `browser_smoke_mocked`, `compact-choices-browser`, `configurator-browser`, `configurator-regression`, `malfini_preview_browser`).
