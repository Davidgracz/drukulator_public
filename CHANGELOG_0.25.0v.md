# Drukulator 0.25.0v

Wersja złożona na życzenie: **układ i wygląd jak w 0.23.x (Twoja paczka 0.23.25v), strona „Koszulki i odzież” z najnowszej wersji (0.24.9v), a poprawki zgłoszone po 0.23.27v zostają.**

**Nie zmieniono cen, progów rabatowych, logiki liczenia ani plików PHP.** W `data/prices.json` zmienione są tylko dane odzieży z 0.24.x (kamizelki: „Brixton Flash” 40 zł i „Malfini Rimeck” 50 zł; tekst opisu czapki raperki). Jedyna zmiana w `calculators.js`: limit ręcznej ilości plakatów wielkoformatowych 100 → 30 szt.

---

## 1. Wygląd i układ — jak w 0.23.x
Wszystkie strony (Start, wizytówki, ulotki, plakaty, druk cyfrowy, banery, naklejki, roll-upy, PCV i pianki, obrazy na płótnie, notesy, koperty, kalendarze, oprawa, laminowanie, restauracje, śluby, nieruchomości, koszyk) wyglądają i działają jak w 0.23.x:
- pasek „Twoje zamówienie” u góry, numerowany nagłówek „01 Parametry zamówienia”, „Technologia druku BETA”, kroki „Ustaw parametry / Sprawdź cenę / Dodaj do koszyka”, komunikat „Wybierz parametry, a cena zaktualizuje się przy dodawaniu do koszyka”,
- nazwy z „24h” (Wizytówki 24h, Ulotki 24h, Plakaty 24h) i plakietki 24h w menu i na Starcie,
- numer wersji w menu bocznym (0.25.0v),
- strona główna bez zmian względem 0.23.27.

Wróciły więc (z 0.24.x usunięte): stały pasek ceny i „Zadzwoń” na telefonie, cena za sztukę przy cenie, nowe słownictwo („Ile stron zadrukować”, „Ilość sztuk” zamiast „Nakład” itd.), jeden przycisk „Produkty”, uproszczona strona główna / pomoc, rozdzielone nazwy folii („Folia Soft Touch” / „Folia błyszcząca”), lista kontrolna w podglądzie pliku i dołączanie pliku z podglądu do zamówienia, „Cena łączna / różnica” na kafelkach, arkusz `ux-clarity.css` z regułami czytelności (zostały w nim tylko reguły dla odzieży i płócien).
Zostają też zmiany z 0.23.26 i 0.23.27 (zgłoszone wcześniej): układ PCV i pianek, podpowiedź nad polem naklejek, 7 formatów płócien na starcie.

## 2. Koszulki i odzież — z 0.24.9v
Cała strona jak w 0.24.9v: krój tylko w opisie („Koszulka bawełniana · 160 g · unisex” + „Dostępne kroje: …”), bez przycisków kroju i bez kroju w zamówieniu, dwie kamizelki (Brixton Flash 40 zł, Malfini Rimeck 50 zł), czapka raperka Malfini RAP 5P (7 kolorów), czapki i torby tylko z przodu, podpowiedź o łącznej ilości i rabacie, ceny modeli pod nazwą, przyciski nadruków z opcją „Brak”.

## 3. Poprawki zgłoszone po 0.23.27v — zostają
- **Plakaty:** cena 575 zł za 500 szt. A3 (offset) widoczna pod formatem; ilości w druku wielkoformatowym 1, 3, 6, 10, 20 — same liczby, bez cen za sztukę; własna ilość maks. 30 szt. (też w kalkulatorze) i tylko w druku wielkoformatowym; plakietka 24h przy „Druk wielkoformatowy”; ceny przy formatach zostają.
- **Naklejki, magnesy:** etykieta „Ilość sztuk” (zamiast „Liczba naklejek”).
- **Faktyczne ceny zamiast „+/−”:** karty „Porównaj warianty” (łączna cena i cena za sztukę, bez różnic), zdania pod wyceną („200 szt. za 150,00 zł zamiast 100 szt. za 90,00 zł”, „… zł za całe zamówienie (obecnie … zł)”), kafelki opcji z kwotą całego zamówienia.
- **Kafelki ilości:** bez żadnych cen (ani sumy, ani „za sztukę”); kwoty tylko przy formatach i innych opcjach.
- **PCV i pianki:** usunięty zdublowany blok „Cena brutto za wybrany wariant”; kafelki formatów pianki bez rozmiarów w mm, z niebieską ceną za sztukę z cennika; podgląd w cm.
- **Roll-upy i X-bannery:** bez opisu „Wybierz gotowy rozmiar produktu” i bez grafik przy formatach.
- **Obrazy na płótnie:** pełny cennik pod „Pokaż wszystkie formaty i ceny” (klik w wiersz wybiera format); podgląd własnego wymiaru w cm z formatem rozliczeniowym; „Podaj jeden bok” zmienia się co 10 cm i zaokrągla w górę; kursor „łapka” przy wyborze pliku; brak poziomego paska na telefonie po dodaniu zdjęcia.
- Tłumaczenia EN nowych tekstów (odzież, płótna, plakaty).

## Pliki
Podstawa: pliki z działającej 0.23.27v (`index.html`, wszystkie arkusze CSS, `intelligent-search.js`, `quote-interpreter.js`, `frontend-refresh.js`, `checkout-experience.js`, PHP — bez zmian), a na nich:
- `js/app.js` (VERSION 0.25.0v), `js/smart-forms.js`, `js/intelligent-configurator.js`, `js/variant-comparison.js`, `js/product-preview.js`, `js/calculators.js` (tylko limit 30 szt.), `js/i18n.js`, `js/malfini-preview.js`, `data/prices.json` (odzież),
- `assets/malfini-preview.css`, `assets/order-experience-239.css`, `assets/ux-clarity.css` (odchudzony), `assets/malfini/README.md`,
- `index.html` (wersja zasobów `?v=0.25.0`, dodany arkusz `ux-clarity.css`).

## Testy
Przechodzą wszystkie testy z paczki oprócz tych samych pięciu, które nie przechodziły już na 0.23.27v (nieaktualne selektory): `browser_smoke_mocked`, `compact-choices-browser`, `configurator-browser`, `configurator-regression`, `malfini_preview_browser`.
Nowy test `tests/merge_0250_browser.py` (wygląd 0.23.x + odzież + poprawki). Test `home_restored_0244_browser.py` usunięty (dotyczył strony głównej z 0.24.4). Testy `variant-comparison` i `option_prices_0248` dostosowane do układu 0.23.x.
Przejście po 19 stronach (komputer 1300 px i telefon 390 px, PL i EN): bez błędów JS. Poziomy pasek przewijania na telefonie na stronie „Koperty, teczki i papier firmowy” występuje także w 0.23.25v (nie ruszane).

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5 — przeglądarka potrafi przez kilka godzin trzymać starą kopię `index.html`.
