# Drukulator 0.26.4v

**Papier firmowy: ceny na kafelkach formatu i nowy format A5. „Kod rabatowy” zamiast „kodu promocyjnego” wszędzie, stałe okienko na kod w formularzu zamówienia oraz większa suma „Razem — brutto”.** Poprawki do 0.26.3v. **Zmieniły się pliki PHP (tylko teksty) — wgraj je razem z resztą paczki.** Baza danych bez zmian.

---

## 1. Papier firmowy: ceny widać na kafelkach formatu
Do tej pory papier firmowy miał jeden format (A4), a kalkulator pokazuje ceny na kafelkach wyboru dopiero wtedy, gdy jest z czego wybierać — dlatego cen nie było widać. Teraz są **dwa formaty** i przy każdym stoi cena dla aktualnie wybranego nakładu (jak w innych produktach: format „A4 · 210 × 297 mm · 280,00 zł”, „A5 · 148 × 210 mm · 190,00 zł”). Po zmianie nakładu ceny na kafelkach zmieniają się razem z nim.

| Nakład | A4 | A5 (nowy) |
|---|---|---|
| 500 szt. | 280 zł | 190 zł |
| 1000 szt. | 330 zł | 230 zł |
| 2500 szt. | 460 zł | 280 zł |

Opis produktu: „Papier firmowy w formacie A4 lub A5, preprint 90 g, druk kolorowy jednostronny.” (po angielsku: „Letterhead paper in A4 or A5, 90 gsm preprint, single-sided colour printing.”).

**Cennik:** `data/prices.json` → `papier_firmowy` → `preprint_90g_kolor_jednostronny` ma teraz `A4` (500/1000/2500 = 280/330/460) i `A5` (190/230/280) i można go zmieniać w edytorze cen. Cenniki zapisane wcześniej na serwerze lub w przeglądarce są przy wczytaniu **uzupełniane**: jeśli A4 ma jeszcze stare ceny domyślne (350 / 545 / 715 zł), zostają zamienione na nowe; brakujące A5 jest dopisane; **własne, inne ceny A4 nie są nadpisywane**.

## 2. Nazwa „kod rabatowy” wszędzie
Wszędzie tam, gdzie było „kod promocyjny”, jest teraz **„kod rabatowy”**:
- koszyk i formularz zamówienia (etykiety, komunikaty, tekst zamówienia „KOD RABATOWY …”, plik CSV, powiadomienia),
- mail i zlecenie dla pracowni („Kod rabatowy …”), komunikaty serwera,
- panel pracowniczy (zakładka „Kody rabatowe”, „Nowy kod rabatowy”, nazwa uprawnienia „Kody rabatowe (tworzenie i edycja)”, wpisy w dzienniku),
- wersja angielska: „discount code” zamiast „promo code”.

Nazwy techniczne (pola w bazie, klucz uprawnienia `promo_manage`, nazwy plików `promo-*.php`) zostały bez zmian, więc nic w bazie ani w uprawnieniach pracowników nie trzeba poprawiać.

## 3. Okienko na kod rabatowy w formularzu zamówienia
- **Po prawej stronie (w podsumowaniu koszyka) zostaje rozwijanie „Masz kod rabatowy?”** — dokładnie jak było.
- **Nowe: stałe okienko „Kod rabatowy”** w kroku „Wyślij zamówienie”, tuż nad linią „Razem — brutto”: pole, przycisk „Zastosuj” i komunikat — **bez rozwijania**, zawsze widoczne.
- Oba miejsca są jednym kodem: kod wpisany w okienku pojawia się po prawej i odwrotnie; zastosowany kod, rozpisanie „Produkty brutto / Kod rabatowy / Produkty po zniżce” oraz przycisk „Usuń kod” widać w obu, a suma po zniżce jest wszędzie taka sama. Klawisz Enter w polu zatwierdza kod. Wpisywanie danych w formularzu nie kasuje kodu, który ktoś już wpisał, ale jeszcze nie zatwierdził.

## 4. „Razem — brutto” bez słowa „obecnie”, większa suma
Etykieta nad przyciskiem wysyłki brzmi teraz **„Razem — brutto”** (z wybraną dostawą: „Razem z dostawą — brutto”); słowo „obecnie” zostało usunięte (po angielsku „Total incl. VAT” / „Total incl. VAT and delivery”). **Kwota po prawej jest wyraźnie większa** — od 28 px na telefonie do ok. 38 px na komputerze (wcześniej 16 px), pogrubiona i w jednej linii.

## Pliki
- **Zmienione (front-end):** `js/app.js` (0.26.4v: migracja cennika papieru firmowego, opis produktu, okienko kodu rabatowego, nazwy), `js/i18n.js`, `assets/ux-clarity.css`, `index.html` (`?v=0.26.4`), `data/prices.json`.
- **Zmienione (PHP — tylko teksty):** `send-order.php`, `promo-lib.php`, `promo-validate.php`, `staff-api.php`, `staff-panel.php`, `staff-auth-lib.php`.
- **Testy:** nowy `letterhead_0264_browser.py` (ceny i formaty papieru firmowego, wycena, migracja starego cennika, opis EN); rozszerzony `promo_0260_browser.py` (okienko w formularzu: stałe, nad sumą, synchronizacja z blokiem po prawej, Enter, usuwanie, EN, rozmiar sumy, brak słowa „promocyjny”); zaktualizowane `promo_0260.py`, `promo_staff_0260_browser.py`, `home_checkout_02316_browser.py`, `merge_0250_browser.py`.

## Wgrywanie
Wgraj całą paczkę, **łącznie z plikami PHP** (zmieniły się teksty komunikatów, maili i panelu pracowniczego). Jeśli na serwerze edytowano `data/prices.json` i nie chcesz go nadpisywać, **zostaw swój plik** — kalkulator sam dopisze A5 i zamieni stare ceny A4 papieru firmowego (jeśli były domyślne). Odśwież stronę klawiszami Ctrl+F5.

## Przyjęte założenia (do potwierdzenia)
1. Ceny papieru firmowego pokazują się **na kafelkach formatu** („tam gdzie zwykle”); kafelki nakładu (500 / 1000 / 2500) nie mają cen, jak w pozostałych produktach.
2. **Okienko na kod jest dodatkowe** — rozwijane „Masz kod rabatowy?” po prawej zostaje bez zmian, a nowe okienko stoi nad „Razem — brutto”; oba działają na jednym kodzie.
3. Zmiana nazwy dotyczy też maili, zlecenia dla pracowni i panelu pracowniczego (nie tylko tego, co widzi klient).
4. Stare domyślne ceny A4 papieru firmowego (350 / 545 / 715 zł) są zamieniane na nowe; ceny ustawione przez Was na inne wartości zostają.
