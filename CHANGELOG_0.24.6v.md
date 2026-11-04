# Drukulator 0.24.6v

Wydanie na bazie **0.24.5v** (zawiera wszystkie jej zmiany).

**Nie zmieniono cen, logiki liczenia ani plików PHP.** Zmiana dotyczy tylko podglądu odzieży (strona „Koszulki i odzież”).

## Opis pod nazwą modelu w podglądzie produktu
Pod nazwą modelu (np. „Basic 129”) zamiast „Koszulka bawełniana · krój dziecięcy” (tekst zmieniał się po kliknięciu kroju) jest teraz stały opis:
- **linia opisu:** rodzaj · gramatura · unisex – np. **„Koszulka bawełniana · 160 g · unisex”**;
- **linia „Dostępne kroje: …”** dla modeli z wyborem kroju – np. Basic: **„Dostępne kroje: męski, damski i dziecięcy”**; modele z kroją męską i damską: „Dostępne kroje: męski i damski”.

Zasady:
- „unisex” w opisie mają: **Basic** (jak w wytycznych właściciela) oraz modele, które mają tylko krój unisex (Heavy New, Pixel, Essential, kamizelka Malfini Rimeck). Pozostałe modele z wyborem kroju pokazują tylko dostępne kroje.
- Gramatura w opisie jest przy koszulkach, polo, bluzach i kamizelkach; przy czapkach i torbach opis bez zmian (np. „Czapka bejsbolówka”, „Torba bawełniana”).
- Przyciski wyboru kroju (Męska / Damska / Dziecięca), uwaga o zdjęciach poglądowych i zapis wybranego kroju w zamówieniu działają jak dotąd.

## Pliki zmienione względem 0.24.5v
`index.html` (wersja zasobów `?v=0.24.6`), `js/app.js` (VERSION 0.24.6v), `js/malfini-preview.js`, `assets/malfini-preview.css`, `tests/malfini_preview_unit.py`.

## Testy
`tests/malfini_preview_unit.py` (zaktualizowany: nowy opis i linia dostępnych krojów, desktop 1440 px i telefon 390 px) – przechodzi. Pozostałe testy – wyniki jak w 0.24.5v (te same 5 testów przeglądarkowych nie przechodzi także na działającej 0.23.27). Przegląd wszystkich stron: bez błędów.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5 – przeglądarka potrafi przez kilka godzin trzymać starą kopię `index.html`.
