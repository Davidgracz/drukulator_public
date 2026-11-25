/* Drukulator 0.26.24v — minimalny zapis PDF z obrazami JPEG (strona = fizyczny rozmiar projektu).
 * Bez bibliotek. Dla stron większych niż 14 400 pt (limit Acrobata, ~508 cm) ustawia /UserUnit, czyli plik jest w skali 1:k.
 * API: Druk24PDF.fromJpeg({ jpeg: Uint8Array, wPx, hPx, wCm, hCm, title }) → { bytes: Uint8Array, scale }
 *      Druk24PDF.fromJpegPages({ pages: [{ jpeg, wPx, hPx }], wMm, hMm, bleedMm, title, creator }) → { bytes: Uint8Array }
 *        (0.26.24v, wizytówki: kilka stron o tym samym rozmiarze; MediaBox = format ze spadem, TrimBox = format netto, BleedBox = MediaBox) */
(() => {
  'use strict';
  const PT_PER_CM = 72 / 2.54;
  const asciiTitle = s => String(s || 'Baner').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .replace(/[^\x20-\x7e]/g, '').replace(/[()\\]/g, '').slice(0, 80) || 'Baner';

  function fromJpeg({ jpeg, wPx, hPx, wCm, hCm, title }) {
    const enc = new TextEncoder();
    let wPt = wCm * PT_PER_CM, hPt = hCm * PT_PER_CM;
    const scale = Math.max(1, Math.ceil(Math.max(wPt, hPt) / 14400));
    wPt /= scale; hPt /= scale;
    const f = n => (Math.round(n * 100) / 100).toString();
    const parts = []; let offset = 0; const xref = [];
    const push = d => { const b = typeof d === 'string' ? enc.encode(d) : d; parts.push(b); offset += b.length; };
    const begin = n => { xref[n] = offset; push(`${n} 0 obj\n`); };
    const end = () => push('endobj\n');

    push('%PDF-1.4\n%âãÏÓ\n');
    begin(1); push('<< /Type /Catalog /Pages 2 0 R >>\n'); end();
    begin(2); push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n'); end();
    begin(3);
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(wPt)} ${f(hPt)}] /Resources << /XObject << /Im0 5 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 4 0 R${scale > 1 ? ` /UserUnit ${scale}` : ''} >>\n`);
    end();
    const content = `q ${f(wPt)} 0 0 ${f(hPt)} 0 0 cm /Im0 Do Q\n`;
    begin(4); push(`<< /Length ${content.length} >>\nstream\n${content}endstream\n`); end();
    begin(5);
    push(`<< /Type /XObject /Subtype /Image /Width ${wPx} /Height ${hPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    push(jpeg); push('\nendstream\n'); end();
    begin(6); push(`<< /Title (${asciiTitle(title)}) /Creator (Drukulator - generator banerow Druk24) /Producer (Druk24) >>\n`); end();
    const xrefAt = offset;
    push('xref\n0 7\n0000000000 65535 f \n');
    for (let i = 1; i <= 6; i++) push(`${String(xref[i]).padStart(10, '0')} 00000 n \n`);
    push(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

    const out = new Uint8Array(offset); let p = 0;
    for (const b of parts) { out.set(b, p); p += b.length; }
    return { bytes: out, scale };
  }

  // Wiele stron (np. awers i rewers wizytówki). wMm × hMm to format netto; spad bleedMm z każdej strony jest wliczony w stronę (MediaBox),
  // a TrimBox wskazuje format po przycięciu — tak, jak oczekuje drukarnia.
  function fromJpegPages({ pages, wMm, hMm, bleedMm, title, creator }) {
    if (!Array.isArray(pages) || !pages.length) throw new Error('PDF: brak stron');
    const enc = new TextEncoder(), PT_PER_MM = 72 / 25.4, b = Math.max(0, Number(bleedMm) || 0);
    const f = n => (Math.round(n * 100) / 100).toString();
    const wPt = (wMm + 2 * b) * PT_PER_MM, hPt = (hMm + 2 * b) * PT_PER_MM, bPt = b * PT_PER_MM;
    const n = pages.length, parts = []; let offset = 0; const xref = [];
    const push = d => { const x = typeof d === 'string' ? enc.encode(d) : d; parts.push(x); offset += x.length; };
    const begin = k => { xref[k] = offset; push(`${k} 0 obj\n`); };
    const end = () => push('endobj\n');
    const pageObj = i => 3 + 3 * i, contentObj = i => 4 + 3 * i, imageObj = i => 5 + 3 * i, infoObj = 3 + 3 * n;

    push('%PDF-1.4\n%âãÏÓ\n');
    begin(1); push('<< /Type /Catalog /Pages 2 0 R >>\n'); end();
    begin(2); push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] /Count ${n} >>\n`); end();
    const box = `[${f(bPt)} ${f(bPt)} ${f(wPt - bPt)} ${f(hPt - bPt)}]`;
    pages.forEach((pg, i) => {
      begin(pageObj(i));
      push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(wPt)} ${f(hPt)}] /BleedBox [0 0 ${f(wPt)} ${f(hPt)}] /TrimBox ${box} /Resources << /XObject << /Im0 ${imageObj(i)} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentObj(i)} 0 R >>\n`);
      end();
      const content = `q ${f(wPt)} 0 0 ${f(hPt)} 0 0 cm /Im0 Do Q\n`;
      begin(contentObj(i)); push(`<< /Length ${content.length} >>\nstream\n${content}endstream\n`); end();
      begin(imageObj(i));
      push(`<< /Type /XObject /Subtype /Image /Width ${pg.wPx} /Height ${pg.hPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n`);
      push(pg.jpeg); push('\nendstream\n'); end();
    });
    begin(infoObj); push(`<< /Title (${asciiTitle(title)}) /Creator (${asciiTitle(creator || 'Drukulator - generator wizytowek Druk24')}) /Producer (Druk24) >>\n`); end();
    const xrefAt = offset, total = infoObj + 1;
    push(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let i = 1; i < total; i++) push(`${String(xref[i]).padStart(10, '0')} 00000 n \n`);
    push(`trailer\n<< /Size ${total} /Root 1 0 R /Info ${infoObj} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

    const out = new Uint8Array(offset); let p = 0;
    for (const x of parts) { out.set(x, p); p += x.length; }
    return { bytes: out, pages: n };
  }

  window.Druk24PDF = { fromJpeg, fromJpegPages };
})();
