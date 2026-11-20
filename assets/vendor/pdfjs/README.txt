pdf.js (Mozilla) 6.2.108 — wersja "legacy" (starsze przeglądarki), licencja Apache-2.0 (LICENSE.txt).
Pliki pdf.min.js i pdf.worker.min.js to niezmienione pliki pdf.min.mjs / pdf.worker.min.mjs z paczki pdfjs-dist/legacy/build,
zapisane z rozszerzeniem .js, bo część hostingów nie serwuje .mjs z typem JavaScript.
Ładowane są dopiero wtedy, gdy klient wgra PDF do podglądu 3D wizytówki (js/card-3d-preview.js).
