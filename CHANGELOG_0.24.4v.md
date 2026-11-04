# Drukulator 0.24.4v

Wydanie na bazie **0.24.3v** (zawiera wszystkie jej zmiany: odzież, raperka RAP 5P, pianki, PCV, roll-upy, płótna, poprawki UX).

**Jedyna zmiana: strona główna (Start) wraca do wyglądu z 0.23.27.** Nie zmieniono cen, logiki liczenia ani plików PHP.

## Strona główna jak w 0.23.27
Przywrócone na Starcie:
- tekst na górze: „Wybierz produkt, sprawdź cenę i dodaj go do koszyka. Jeśli potrzebujesz pomocy z parametrami, skorzystaj z asystenta.”,
- chipy **„Popularne:”** (Wizytówki, Ulotki, Naklejki, Banery, Koszulki),
- dwa przyciski pomocy: **„Uruchom asystenta zamówień”** (BEZ AI) i **„Nie wiem, czego potrzebuję”**,
- karta „To naprawdę proste” (3 kroki: Wybierz produkt / Albo wpisz wszystko jednym zdaniem / Zobacz cenę) z ramką „Wymaga potwierdzenia drukarni.”,
- 4 kafelki informacyjne na dole („Ceny brutto”, „Weryfikacja przez drukarnię”, „Pliki do zapytania”, „Bez obowiązku zapłaty”),
- plakietki **24h** przy Wizytówkach, Ulotkach i Plakatach na kafelkach i w wynikach wyszukiwarki,
- pasek **„Twoje zamówienie”** u góry (pusty koszyk) — widoczny tylko na Starcie; na stronach produktów pusty pasek nadal jest ukryty.

Usunięte (nieużywane): reguły CSS „8. Strona główna” z `assets/ux-clarity.css`.

## Bez zmian (zostaje z 0.24.x)
Menu „Produkty” na telefonie, stały pasek ceny, jednolite słownictwo na stronach produktów, kroki „Ustaw parametry → Dodaj do koszyka → Wyślij zamówienie” na stronach produktów, wszystkie poprawki z 0.24.1–0.24.3.
Na telefonie pusty ciemny pasek „Koszyk 0 pozycji” na Starcie pozostaje ukryty (część nowego paska ceny).
Tekst w pasku „Twoje zamówienie” to nadal „Dodaj produkt do koszyka” (jednolite słownictwo; w 0.23.27 było „…aby przygotować zapytanie”).

## Pliki zmienione względem 0.24.3v
`index.html` (wersja zasobów `?v=0.24.4`), `js/app.js` (VERSION 0.24.4v; `renderHome` z 0.23.27, `format24hLabel(text, keepBadge)`), `js/frontend-refresh.js` (chipy „Popularne”), `assets/ux-clarity.css`, `tests/home_restored_0244_browser.py` (nowy).

## Testy
Nowy test `tests/home_restored_0244_browser.py` (1440 px i 390 px) – przechodzi. Pozostałe – wyniki jak w 0.24.3v (te same 5 testów nie przechodzi także na działającej 0.23.27). Tekst strony głównej (PL i EN) porównany z 0.23.27: jedyna różnica to tekst w pasku „Twoje zamówienie”.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5 – przeglądarka potrafi przez kilka godzin trzymać starą kopię `index.html`.
