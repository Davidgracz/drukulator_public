# Drukulator 0.23.11v — poprawki plakatów

Aktualizacja pełnej wersji 0.23.10v. Zmiany dotyczą wyłącznie interfejsu i wyboru wariantów kalkulatora **Plakaty 24h**.

- Trzy widoczne technologie druku: **Cyfrowy 24h**, **Offsetowy**, **Wielkoformatowy 24h**. Trzeci wariant korzysta z istniejących cen wielkoformatowych.
- Usunięty duplikat wyboru technologii w formularzu plakatów; pozostaje jeden zestaw dużych przycisków.
- Nakład wybierany przyciskami, analogicznie do ulotek, zamiast widocznej listy rozwijanej. Dla technologii cyfrowej i offsetowej przyciski odpowiadają dokładnie nakładom zapisanym w cenniku.
- Dla technologii wielkoformatowej domyślny nakład **30 sztuk**. Podstawowe przyciski: **1, 2, 3, 5, 10, 15, 20, 30**; pozostałe ilości od 1 do 30 są dostępne po kliknięciu „Pokaż wszystkie opcje”. Są to nadal przyciski, nie lista.
- Zmiana technologii oraz formatu odświeża dozwolone nakłady i ich ceny. Po powrocie do wielkoformatowego przywracane jest 30 szt.
- Utrzymano dotychczasowy mechanizm cenników, przeliczania cen, koszyka i wysyłania zamówień. Bez modyfikacji `data/prices.json`.

## Wgranie na serwer

Wykonaj kopię obecnego katalogu `/drukulator/`, rozpakuj wszystkie pliki ZIP w tym katalogu, nadpisz stare pliki i odśwież cache przeglądarki/hostingu.

## Kontrola

Testy lokalne: interakcje w przeglądarce dla trzech technologii, liczby sztuk i cen, zmiany technologii/formatu, wyświetlanie na szerokości 375 px. Test `tests/posters_02311_browser.test.py` uruchamiany na lokalnych, mockowanych danych. Rzeczywiste wysłanie zamówienia na hostingu nie było testowane.
