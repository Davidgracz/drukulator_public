# Drukulator 0.26.13v

**Podgląd 3D wizytówki: klient wgrywa przód i tył projektu i obraca kartę z każdej strony.** Zmiana jest czysto dodatkowa — **ceny, formularze, koszyk i `send-order.php` bez zmian** (w `app.js` zmieniony jest tylko numer wersji).

---

## 1. Podgląd 3D na stronie „Wizytówki 24h”
Pod formularzem (nad dotychczasowym „Podglądem wydruku”) jest nowy zwijany panel **„◈ Podgląd 3D wizytówki”**.

- **Dwa pola: Przód i Tył.** Plik można wybrać albo przeciągnąć na pole (lub na samą kartę). Dwa pliki upuszczone naraz trafiają na przód i tył.
- **PDF z dwiema stronami** (strona 1 = przód, strona 2 = tył) wypełnia obie strony jednym plikiem. Obsługiwane formaty: JPG, PNG, WebP i PDF, do 50 MB.
- **Obracanie:** przeciąganie myszką (z lekką bezwładnością), na telefonie przesunięcie palcem w poziomie, klawiatura (strzałki, Enter = druga strona), podwójne kliknięcie odwraca kartę. Przyciski **Przód / Tył / Skos / Pionowo–Poziomo**.
- **Wygląd:** karta ma grubość, cień pod spodem i połysk zależny od wybranego wykończenia (bez folii = matowo, folia = z połyskiem). Dla złocenia, srebrzenia i lakieru UV 3D panel uczciwie informuje, że tych efektów nie odwzorowuje.
- **Format i orientacja** biorą się z pola „Format” (90×50, 85×55 mm). Plik w pionie automatycznie ustawia kartę pionowo.
- **Spad:** plik ze spadem 1,5 mm (np. 93×53 mm) jest wykrywany automatycznie i na podglądzie obcinany do formatu netto (można to przełączyć ręcznie).
- **Kontrola pliku:** orientacyjne DPI przy tym formacie, ostrzeżenie o niedopasowanych proporcjach (z opcją „Wypełnij format”), komunikat o nieobsługiwanym pliku.
- **Zadruk jednostronny:** tył bez pliku jest biały; jeśli klient wgra tył, a w formularzu jest „Jednostronne”, dostaje ostrzeżenie, że wycena nie obejmuje druku tyłu.
- Tryb ciemny, wersja angielska i telefon obsługiwane.

## 2. Jak to działa technicznie
- **Bez bibliotek 3D i bez wysyłania plików.** Karta to transformacje CSS 3D; pliki zostają w przeglądarce klienta (tak jak w „Podglądzie wydruku” — aby dołączyć projekt do zamówienia, klient wybiera go w koszyku).
- **PDF renderuje pdf.js 6.2.108 (wersja „legacy”, Apache-2.0)** z `assets/vendor/pdfjs/`. Ładuje się dopiero przy pierwszym wgranym PDF-ie, więc strona nie jest cięższa dla osób, które wgrywają JPG/PNG. Pliki mają rozszerzenie `.js` (nie `.mjs`), bo część hostingów nie serwuje `.mjs` z typem JavaScript.
- Moduł ma publiczne API `window.Druk24Card3D` (`getFiles()`, `open()`, `setFiles(przód, tył)`) — na wypadek, gdyby pliki z podglądu miały trafiać do zamówienia.

## Założenia
- Podgląd włączony jest **tylko dla wizytówek**. Na innych produktach (np. ulotki) wystarczy dopisać wpis do tablicy `PRODUCTS` na górze `js/card-3d-preview.js` (id pola formatu, opcjonalnie pól „Zadruk” i „Wykończenie”).
- Grubość karty jest na podglądzie powiększona dla czytelności; kolory na ekranie mogą różnić się od druku.
- Dotychczasowy „Podgląd wydruku” (schemat ze spadami i własnym polem na plik) zostaje bez zmian, więc na stronie wizytówek są teraz dwa pola na plik do podglądu. Jeśli to ma być jedno, można ukryć stare pole.
- Pliki wgrane w podglądzie **nie** są automatycznie dołączane do zamówienia.

## Pliki
- **Nowe:** `js/card-3d-preview.js`, `assets/card-3d-preview.css`, `assets/vendor/pdfjs/` (`pdf.min.js`, `pdf.worker.min.js`, `LICENSE.txt`, `README.txt`), `tests/card_3d_02613_browser.py`.
- **Zmienione:** `index.html` (nowy CSS i JS, numer wersji), `js/app.js` (tylko `VERSION`).
- **Bez zmian:** wszystkie pliki PHP, `data/prices.json`, `js/calculators.js`, `js/i18n.js` i pozostałe pliki front-endu. Baza danych bez zmian.
- **Testy:** nowy `card_3d_02613_browser.py` (panel tylko na wizytówkach, wgranie przodu i tyłu, obracanie, orientacja, ostrzeżenia).
