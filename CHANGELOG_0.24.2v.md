# Drukulator 0.24.2v

Wydanie na bazie **0.24.1v** (zawiera wszystkie jej zmiany: odzież + 16 poprawek UX, zbudowane na działającej 0.23.27).

**Nie zmieniono cen, progów rabatowych, logiki liczenia ani plików PHP.** `data/prices.json` – bez zmian względem 0.24.1v.
W `calculators.js` – bez zmian względem 0.24.1v (formatu rozliczeniowego obrazów używa istniejąca funkcja `calculateCanvasCustom`, tylko jest teraz pokazywany klientowi).

---

## 1. PCV i pianki
- Usunięty blok **„Cena brutto za wybrany wariant”** (strona PCV i pianki – to ta sama strona). Zostaje cena w pasku podsumowania niżej.
- Usunięty kod odświeżania tego bloku (`pricePreview`, `refreshPvcPricePreview`).

## 2. Roll-upy i X-bannery
- Usunięty opis **„Wybierz gotowy rozmiar produktu”** pod polem formatu.
- Z X-bannera zniknęła mała grafika (piktogram) przy formatach – wszystkie warianty wyglądają teraz tak samo (zwykłe kafelki z tekstem).

## 3. Obrazy na płótnie
### a) „Wybierz format z cennika”
- Link **„Pokaż wszystkie opcje”** zastąpiony rozwijanym **pełnym cennikiem w tabeli** („Pokaż wszystkie formaty i ceny (N)”): format, cena netto/brutto za sztukę i – przy ilości 2–10 szt. – kolumna „Razem (N szt.)”.
- Kliknięcie wiersza wybiera format, zamyka cennik i przewija do formularza.
- Bez graficzek i prostokątów (piktogramy przy formatach płótna usunięte).

### b) „Wpisz własny wymiar”
- „Podgląd produktu” pokazuje **format rozliczeniowy z cennika**, w **centymetrach** (np. wpisane 70 × 104 → na podglądzie **70 × 110 cm**), a pod spodem krótka informacja: „Wpisany wymiar 70 × 104 cm jest rozliczany jako najbliższy większy format z cennika.”
- Podgląd na płótnie i w całej sekcji używa cm zamiast mm.

### c) „Dopasuj do zdjęcia”
- Pole „Wybierz plik” (także przycisk w środku) ma **kursor „łapka”**.
- „Podaj jeden bok”: strzałki góra/dół zmieniają wartość o **10 cm** (wcześniej o 1).
- Wartość wpisana ręcznie jest **zaokrąglana w górę do pełnych 10 cm** (zakres 30–150 cm) po opuszczeniu pola / zatwierdzeniu oraz przy liczeniu. Pod polem krótka podpowiedź o tym.
- Naprawione przy okazji: na telefonie po dodaniu zdjęcia strona dostawała poziomy pasek przewijania (układ „Dopasuj do zdjęcia”).

---

## Pliki zmienione względem 0.24.1v
`index.html` (wersja zasobów `?v=0.24.2`), `js/app.js` (VERSION 0.24.2v), `js/smart-forms.js`, `js/intelligent-configurator.js`, `js/product-preview.js`, `js/i18n.js`, `assets/ux-clarity.css`, `tests/canvas_rollup_pvc_0242_browser.py` (nowy).

## Testy
Nowy test `tests/canvas_rollup_pvc_0242_browser.py` (desktop 1440 px i telefon 390 px) – przechodzi. Pozostałe testy – wyniki identyczne jak przed zmianami; 5 testów (`browser_smoke_mocked`, `compact-choices-browser`, `configurator-browser`, `configurator-regression`, `malfini_preview_browser`) nie przechodzi także na działającej 0.23.27 (nieaktualne selektory) – nie ruszane.
