/* Drukulator 0.26.14v — minimalny zapis PDF z jednym obrazem JPEG (strona = fizyczny rozmiar banera).
 * Bez bibliotek. Dla stron większych niż 14 400 pt (limit Acrobata, ~508 cm) ustawia /UserUnit, czyli plik jest w skali 1:k.
 * API: Druk24PDF.fromJpeg({ jpeg: Uint8Array, wPx, hPx, wCm, hCm, title }) → { bytes: Uint8Array, scale } */
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

  window.Druk24PDF = { fromJpeg };
})();
