# Drukulator (Druk24 Szczecin)

Kalkulator cen druku online dla Druk24 Szczecin: wizytówki, ulotki, plakaty, banery, naklejki, roll-upy, PCV i pianki,
obrazy na płótnie, odzież z nadrukiem i inne. Aplikacja działa w przeglądarce (czysty HTML/CSS/JS, bez kroku budowania)
i jest osadzona w WordPressie pod adresem `/drukulator/`; zamówienia, wgrywanie plików i panel pracowników obsługują pliki PHP.

**Bieżąca wersja: 0.26.1v** — zobacz `CHANGELOG_0.26.1v.md` (każde wydanie ma własny plik `CHANGELOG_*.md`).

## Struktura

| Ścieżka | Zawartość |
|---|---|
| `index.html` | Strona aplikacji; zasoby mają `?v=<wersja>` do odświeżania pamięci podręcznej |
| `js/app.js` | Główna logika: strony produktów, koszyk, zamówienie |
| `js/calculators.js` | Reguły liczenia cen (wszystkie ceny pochodzą z `data/prices.json`) |
| `js/*.js` | Nakładki: formularze, podgląd produktu, odzież Malfini, konfigurator, tłumaczenia (`i18n.js`) |
| `data/prices.json` | **Cennik** — źródło wszystkich cen i progów rabatowych |
| `data/search-terms.json`, `data/case-items.json` | Słownik wyszukiwarki, przykłady |
| `assets/` | Style, grafiki, instrukcje zdjęć produktów |
| `*.php` | Backend (WordPress): `send-order.php`, `upload-files.php`, `save-prices.php`, panel pracowników, monitoring |
| `tests/` | Testy (Playwright/Python i Node) |

## Testy

```bash
python3 tests/foam_caps_0243_browser.py          # przykład: test z Playwright (wymaga chromium)
node tests/apparel_02318.test.cjs                # przykład: test Node
```

Część starszych testów (`browser_smoke_mocked`, `compact-choices-browser`, `configurator-browser`, `configurator-regression`,
`malfini_preview_browser`) ma nieaktualne selektory i nie przechodzi także na wersji 0.23.27.

## Uwagi

- **Plik `staff-auth-lib.php` w tym repozytorium ma usunięty domyślny hash „bramki” panelu pracowników**
  (`D24_STAFF_DEFAULT_GATE_HASH = ''`). **Nie nadpisuj nim pliku na serwerze** — zostaw wersję wdrożoną; w repo pozostaje
  tylko wersja bez sekretu.
- Zdjęcia produktów Malfini i Polstar są ładowane bezpośrednio z serwisów dostawców — patrz `assets/malfini/README.md`
  (prawa do zdjęć, lokalne kopie zapasowe).
- Ceny i logika liczenia zmieniane są wyłącznie po uzgodnieniu; plik `data/prices.json` jest źródłem prawdy.
- Repozytorium nie ma pliku licencji — wszystkie prawa zastrzeżone, dopóki właściciel nie wybierze licencji.
