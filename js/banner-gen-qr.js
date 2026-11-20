/* Drukulator 0.26.14v — mały, samodzielny generator kodów QR (ISO/IEC 18004, tryb bajtowy, korekcja M, wersje 1–12).
 * Bez zewnętrznych bibliotek i bez wysyłania danych. Używany przez generator banerów (Dodatki → Kod QR).
 * API: Druk24QR.encode(text, ecl = 'M') → { size, version, get(x, y) } ; Druk24QR.MAX_BYTES */
(() => {
  'use strict';
  const MAX_VERSION = 12;
  // Tabele z normy (indeks = wersja; wartość 0 pomijana).
  const ECC_PER_BLOCK = {
    L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24],
    M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22],
    Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26],
    H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28]
  };
  const NUM_BLOCKS = {
    L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4],
    M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8],
    Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10],
    H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11]
  };
  const FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  function rawModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  const dataCodewords = (ver, ecl) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver] * NUM_BLOCKS[ecl][ver];

  // ---- GF(256) / Reed–Solomon ----
  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function rsDivisor(deg) {
    const res = new Array(deg).fill(0); res[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) { res[j] = gfMul(res[j], root); if (j + 1 < deg) res[j] ^= res[j + 1]; }
      root = gfMul(root, 2);
    }
    return res;
  }
  function rsRemainder(data, divisor) {
    const res = divisor.map(() => 0);
    for (const b of data) {
      const factor = b ^ res.shift(); res.push(0);
      divisor.forEach((coef, i) => { res[i] ^= gfMul(coef, factor); });
    }
    return res;
  }

  function addEccAndInterleave(data, ver, ecl) {
    const nb = NUM_BLOCKS[ecl][ver], eccLen = ECC_PER_BLOCK[ecl][ver];
    const raw = Math.floor(rawModules(ver) / 8);
    const shortBlocks = nb - raw % nb, shortLen = Math.floor(raw / nb);
    const blocks = []; const div = rsDivisor(eccLen);
    for (let i = 0, k = 0; i < nb; i++) {
      const dat = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1)); k += dat.length;
      const ecc = rsRemainder(dat, div);
      if (i < shortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const out = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= shortBlocks) out.push(b[i]); });
    return out;
  }

  function alignPositions(ver) {
    if (ver === 1) return [];
    const n = Math.floor(ver / 7) + 2;
    const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const res = [6];
    for (let pos = ver * 4 + 10; res.length < n; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  const bit = (x, i) => ((x >>> i) & 1) !== 0;

  function build(ver, ecl, codewords) {
    const size = ver * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, dark) => { modules[y][x] = dark; fn[y][x] = true; };

    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const ap = alignPositions(ver);
    ap.forEach((px, i) => ap.forEach((py, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const drawFormat = mask => {
      const data = (FORMAT_BITS[ecl] << 3) | mask;
      let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits = ((data << 10) | rem) ^ 0x5412;
      for (let i = 0; i <= 5; i++) set(8, i, bit(bits, i));
      set(8, 7, bit(bits, 6)); set(8, 8, bit(bits, 7)); set(7, 8, bit(bits, 8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(bits, i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(bits, i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(bits, i));
      set(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const bits = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const a = size - 11 + (i % 3), b = Math.floor(i / 3);
        set(a, b, bit(bits, i)); set(b, a, bit(bits, i));
      }
    }
    // dane w zygzaku
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && i < codewords.length * 8) { modules[y][x] = bit(codewords[i >>> 3], 7 - (i & 7)); i++; }
      }
    }
    const applyMask = mask => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        let inv;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!fn[y][x] && inv) modules[y][x] = !modules[y][x];
      }
    };
    const penalty = () => {
      let score = 0;
      const lines = [];
      for (let y = 0; y < size; y++) lines.push(modules[y]);
      for (let x = 0; x < size; x++) lines.push(modules.map(row => row[x]));
      const pA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      for (const line of lines) {
        let run = 1;
        for (let k = 1; k <= size; k++) {
          if (k < size && line[k] === line[k - 1]) run++;
          else { if (run >= 5) score += 3 + (run - 5); run = 1; }
        }
        for (let k = 0; k + 11 <= size; k++) {
          let a = true, b = true;
          for (let t = 0; t < 11 && (a || b); t++) { const v = line[k + t] ? 1 : 0; if (v !== pA[t]) a = false; if (v !== pB[t]) b = false; }
          if (a || b) score += 40;
        }
      }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
      }
      let dark = 0; for (const row of modules) for (const c of row) if (c) dark++;
      const total = size * size;
      score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return score;
    };
    let best = 0, bestScore = Infinity;
    for (let m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      const s = penalty();
      if (s < bestScore) { bestScore = s; best = m; }
      applyMask(m); // XOR cofa maskę
    }
    applyMask(best); drawFormat(best);
    return { size, modules };
  }

  function encode(text, ecl = 'M') {
    const bytes = Array.from(new TextEncoder().encode(String(text)));
    let ver = 0;
    for (let v = 1; v <= MAX_VERSION; v++) {
      const ccBits = v < 10 ? 8 : 16;
      if (4 + ccBits + bytes.length * 8 <= dataCodewords(v, ecl) * 8) { ver = v; break; }
    }
    if (!ver) throw new Error('QR: tekst jest za długi');
    const bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(0x4, 4); push(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(b => push(b, 8));
    const cap = dataCodewords(ver, ecl) * 8;
    push(0, Math.min(4, cap - bits.length));
    push(0, (8 - bits.length % 8) % 8);
    for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);
    const data = new Array(bits.length / 8).fill(0);
    bits.forEach((b, i) => { data[i >>> 3] |= b << (7 - (i & 7)); });
    const { size, modules } = build(ver, ecl, addEccAndInterleave(data, ver, ecl));
    return { size, version: ver, get: (x, y) => x >= 0 && y >= 0 && x < size && y < size && modules[y][x] };
  }

  window.Druk24QR = { encode, MAX_BYTES: Math.floor(dataCodewords(MAX_VERSION, 'M') - 3) };
})();
