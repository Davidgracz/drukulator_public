(function (global) {
  "use strict";

  const NO_PRINT = "Brak";
  // 0.24.0: klient wybiera konkretną folię. Obie etykiety folii korzystają z tego samego
  // wiersza cennika, więc ceny i sposób liczenia pozostają bez zmian.
  const DIGITAL_FINISH_KEYS = {
    "Standard": "standard",
    "Folia Soft Touch": "folia_soft_touch_lub_blysk",
    "Folia błyszcząca": "folia_soft_touch_lub_blysk"
  };
  const OFFSET_FINISH_KEYS = {
    "Standard dwustronne": "standard_dwustronne",
    "Foliowane — Soft Touch": "foliowane_blysk_lub_soft_touch",
    "Foliowane — błysk": "foliowane_blysk_lub_soft_touch",
    "Złocenie lub srebrzenie + Soft Touch": "zlocenie_lub_srebrzenie_plus_soft_touch",
    "Lakier UV 3D + Soft Touch": "lakier_uv_3d_plus_soft_touch"
  };
  const SIDE_KEYS = { "Jednostronne": "jednostronne", "Dwustronne": "dwustronne" };
  const CONTACT_EMAIL = "biuro@druk24.szczecin.pl";
  const LIMIT_CONTACT = `W sprawie zlecenia wykraczającego poza kalkulator skontaktuj się z ${CONTACT_EMAIL}.`;

  function throwLimit(message) {
    throw new Error(`${message} ${LIMIT_CONTACT}`);
  }

  function assertWholeQuantity(value, label = "Ilość") {
    assertPositive(value, label);
    if (!Number.isInteger(Number(value))) throwLimit(`${label} musi być podana w pełnych sztukach.`);
  }

  function assertPositive(value, label) {
    if (!(Number(value) > 0)) throw new Error(`${label} musi być większa od zera.`);
  }

  function round2(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function calculateManualCutting(prices, widthCm, heightCm, quantity) {
    assertPositive(widthCm, "Szerokość");
    assertPositive(heightCm, "Wysokość");
    assertWholeQuantity(quantity);
    const cuttingRate = Number(prices?.meta?.ciecie_reczne_cena_mb ?? 5);
    const perimeterOneM = 2 * (Number(widthCm) + Number(heightCm)) / 100;
    const totalPerimeterM = perimeterOneM * Number(quantity);
    return {
      cuttingRate,
      perimeterOneM,
      totalPerimeterM,
      cuttingCost: round2(totalPerimeterM * cuttingRate)
    };
  }

  function calculateOptionalManualCutting(prices, productData, widthCm, heightCm, quantity, defaultEnabled = false) {
    const cuttingEnabled = typeof productData?.doliczaj_ciecie_reczne === "boolean"
      ? productData.doliczaj_ciecie_reczne
      : Boolean(defaultEnabled);

    if (cuttingEnabled) {
      return { cuttingEnabled: true, ...calculateManualCutting(prices, widthCm, heightCm, quantity) };
    }

    return {
      cuttingEnabled: false,
      cuttingRate: Number(prices?.meta?.ciecie_reczne_cena_mb ?? 5),
      perimeterOneM: 0,
      totalPerimeterM: 0,
      cuttingCost: 0
    };
  }

  function getBannerPricePerM2(totalArea, material, bannerData, prices) {
    assertPositive(totalArea, "Łączna powierzchnia");
    const data = bannerData || prices.banery[material];
    const tiers = data.progi_cenowe || [];
    for (const tier of tiers) {
      if (tier.maks_m2 == null || totalArea <= Number(tier.maks_m2)) return Number(tier.cena_m2);
    }
    return Number(data.cena_m2);
  }

  function calculateBanner(prices, widthCm, heightCm, quantity, material) {
    assertPositive(widthCm, "Szerokość");
    assertPositive(heightCm, "Wysokość");
    assertWholeQuantity(quantity);
    const isFilm = /^Folia\b/i.test(String(material));
    const shortSide = Math.min(Number(widthCm), Number(heightCm));
    const longSide = Math.max(Number(widthCm), Number(heightCm));
    const maxShortSide = /laminat/i.test(String(material)) ? 135 : 160;
    if (!isFilm && shortSide < 30) throwLimit("Minimalny krótszy bok baneru to 30 cm.");
    if (shortSide > maxShortSide) throwLimit(`Maksymalny krótszy bok dla tego materiału to ${maxShortSide} cm.`);
    if (longSide > 1000) throwLimit("Maksymalny dłuższy bok baneru lub folii to 10 m.");
    const data = prices.banery[material];
    const areaOne = Number(widthCm) / 100 * Number(heightCm) / 100;
    const totalArea = areaOne * Number(quantity);
    const unitPrice = getBannerPricePerM2(totalArea, material, data, prices);
    const minimumOrder = Number(data.minimum_zamowienia || 0);
    const materialPrice = round2(Math.max(totalArea * unitPrice, minimumOrder));
    const cutting = {
      cuttingRate: Number(prices?.meta?.ciecie_reczne_cena_mb ?? 5),
      perimeterOneM: 0,
      totalPerimeterM: 0,
      cuttingCost: 0
    };
    return {
      price: materialPrice,
      materialPrice, areaOne, totalArea, unitPrice, minimumOrder, ...cutting
    };
  }

  function calculateBusinessCards(prices, printType, finish, quantity, sides) {
    const q = String(quantity);
    let value;
    if (printType === "Cyfrowy 24h") {
      value = prices.wizytowki.cyfrowe[DIGITAL_FINISH_KEYS[finish]][q][SIDE_KEYS[sides]];
    } else if (printType === "Offsetowy") {
      value = prices.wizytowki.offsetowe[OFFSET_FINISH_KEYS[finish]][q];
    } else throw new Error("Nieobsługiwany rodzaj druku.");
    return round2(value);
  }

  function calculateFlyers(prices, printType, variant, formatName, quantity) {
    assertPositive(quantity, "Nakład");
    return round2(prices.ulotki[printType][variant][formatName][String(quantity)]);
  }

  function roundUpToStep(value, step) {
    return Math.ceil((Number(value) / Number(step)) - 1e-9) * Number(step);
  }

  function getStickerPricePerLinearMeter(billedLengthM, productData) {
    assertPositive(billedLengthM, "Długość rozliczeniowa");
    const tiers = productData.progi_cenowe_mb || [];
    for (const tier of tiers) {
      if (tier.maks_mb == null || billedLengthM <= Number(tier.maks_mb)) {
        return Number(tier.cena_mb);
      }
    }
    return Number(productData.cena_m2);
  }

  function calculateStickers(prices, productType, quantity, widthMm, heightMm) {
    assertWholeQuantity(quantity);
    const data = prices.naklejki;
    if (Object.prototype.hasOwnProperty.call(data.powierzchniowe, productType)) {
      assertPositive(widthMm, "Szerokość");
      assertPositive(heightMm, "Wysokość");
      if (Number(widthMm) < 30 || Number(heightMm) < 30) throwLimit("Minimalny wymiar naklejki to 30 × 30 mm.");
      if (Number(widthMm) > 500 || Number(heightMm) > 500) throwLimit("Maksymalny wymiar naklejki to 500 × 500 mm.");
      const product = data.powierzchniowe[productType];
      const marginMm = 3;
      const maxPrintWidthMm = 1000;
      const rollWidthMm = 1000;
      const productionWidthMm = Number(widthMm) + marginMm;
      const productionHeightMm = Number(heightMm) + marginMm;
      if (productionWidthMm > maxPrintWidthMm) {
        throw new Error("Naklejka po dodaniu 3 mm przekracza maksymalną szerokość folii 1000 mm.");
      }
      const stickersPerRow = Math.floor(maxPrintWidthMm / productionWidthMm);
      if (stickersPerRow < 1) throw new Error("Na szerokości 1000 mm nie mieści się ani jedna naklejka.");
      const rows = Math.ceil(Number(quantity) / stickersPerRow);
      const totalStickers = stickersPerRow * rows;
      const extraStickers = totalStickers - Number(quantity);
      const baseLengthM = rows * productionHeightMm / 1000;
      const minimumM2 = Number(product.minimum_m2);
      const rollWidthM = rollWidthMm / 1000;
      const minimumLengthM = minimumM2 / rollWidthM;
      const requiredLengthM = Math.max(baseLengthM, minimumLengthM);
      const billedLengthM = roundUpToStep(requiredLengthM, 0.1);
      const pricePerLinearMeter = getStickerPricePerLinearMeter(billedLengthM, product);
      return {
        price: round2(billedLengthM * pricePerLinearMeter),
        pricePerLinearMeter,
        baseLengthM,
        billedLengthM,
        minimumLengthM,
        productionWidthMm,
        productionHeightMm,
        stickersPerRow,
        rows,
        totalStickers,
        extraStickers,
        layoutWidthMm: stickersPerRow * productionWidthMm,
        actualAreaM2: Number(widthMm) * Number(heightMm) * Number(quantity) / 1_000_000,
        productionAreaM2: productionWidthMm * productionHeightMm * totalStickers / 1_000_000
      };
    }
    if (Object.prototype.hasOwnProperty.call(data.taxi, productType)) {
      const unitPrice = Number(data.taxi[productType].cena_sztuki);
      return { price: round2(unitPrice * Number(quantity)), unitPrice };
    }
    throw new Error("Nieobsługiwany rodzaj produktu.");
  }

  function calculateNotepads(prices, productType, variant, formatName, quantity) {
    assertWholeQuantity(quantity, "Nakład");
    const variantData = prices.notesy_i_bloczki?.[productType]?.warianty?.[variant];
    if (!variantData) throw new Error("Nie znaleziono wybranego wariantu notesu lub bloczka.");
    const formatPrices = variantData.formaty?.[formatName];
    if (!formatPrices) throw new Error("Nie znaleziono wybranego formatu.");
    const price = formatPrices[String(quantity)];
    if (price == null) throw new Error("Brak ceny dla wybranego nakładu.");
    return {
      price: round2(price),
      unitPrice: round2(Number(price) / Number(quantity)),
      description: String(variantData.opis || "")
    };
  }

  function calculateCatalogProduct(catalogRoot, productType, variant, formatName, quantity) {
    assertWholeQuantity(quantity, "Nakład");
    const variantData = catalogRoot?.[productType]?.warianty?.[variant];
    if (!variantData) throw new Error("Nie znaleziono wybranego wariantu produktu.");
    const formatPrices = variantData.formaty?.[formatName];
    if (!formatPrices) throw new Error("Nie znaleziono wybranego formatu.");
    const price = formatPrices[String(quantity)];
    if (price == null) throw new Error("Brak ceny dla wybranego nakładu.");
    return {
      price: round2(Number(price)),
      unitPrice: round2(Number(price) / Number(quantity)),
      description: String(variantData.opis || "")
    };
  }

  const POSTER_FORMAT_DIMENSIONS_CM = {
    A4: { widthCm: 21, heightCm: 29.7 },
    A3: { widthCm: 29.7, heightCm: 42 },
    A2: { widthCm: 42, heightCm: 59 },
    A1: { widthCm: 59, heightCm: 84 },
    A0: { widthCm: 84, heightCm: 120 },
    B2: { widthCm: 50, heightCm: 70 },
    B1: { widthCm: 70, heightCm: 100 },
    B0: { widthCm: 100, heightCm: 140 }
  };

  function getPosterFormatDimensions(formatName) {
    const dimensions = POSTER_FORMAT_DIMENSIONS_CM[formatName];
    return dimensions ? { ...dimensions } : null;
  }

  function findPosterBillingFormat(prices, printType, widthCm, heightCm) {
    assertPositive(widthCm, "Szerokość plakatu");
    assertPositive(heightCm, "Wysokość plakatu");
    const root = prices.plakaty?.[printType];
    if (!root) throw new Error("Brak cennika dla wybranego rodzaju plakatu.");

    const requestedWidth = Number(widthCm);
    const requestedHeight = Number(heightCm);
    const candidates = Object.keys(root).map(formatName => {
      const dimensions = getPosterFormatDimensions(formatName);
      if (!dimensions) return null;
      const fitsNormally = requestedWidth <= dimensions.widthCm && requestedHeight <= dimensions.heightCm;
      const fitsRotated = requestedWidth <= dimensions.heightCm && requestedHeight <= dimensions.widthCm;
      return {
        formatName,
        ...dimensions,
        areaCm2: dimensions.widthCm * dimensions.heightCm,
        rotated: !fitsNormally && fitsRotated,
        contains: fitsNormally || fitsRotated
      };
    }).filter(Boolean);

    const containing = candidates
      .filter(item => item.contains)
      .sort((a, b) => a.areaCm2 - b.areaCm2 || a.widthCm - b.widthCm || a.heightCm - b.heightCm);

    if (!containing.length) {
      throwLimit("Podany wymiar plakatu nie mieści się w żadnym formacie dostępnym dla wybranego rodzaju druku.");
    }
    return { ...containing[0], billingMethod: "Najmniejszy standardowy format mieszczący podany wymiar" };
  }

  function calculatePosters(prices, printType, formatName, quantity) {
    assertWholeQuantity(quantity);
    const root = prices.plakaty[printType];
    if (!root || !root[formatName]) throw new Error("Brak cennika dla wybranego plakatu.");

    if (printType === "Wielkoformatowy 24h") {
      if (Number(quantity) > 30) throwLimit("Maksymalny nakład plakatów wielkoformatowych w kalkulatorze to 30 sztuk.");
      const tier = getQuantityUnitPrice(quantity, root[formatName].progi_ilosciowe);
      const unitPrice = Number(tier.cena_sztuki);
      return { price: round2(unitPrice * Number(quantity)), unitPrice };
    }

    const price = root[formatName][String(quantity)];
    if (price == null) throw new Error("Brak ceny dla wybranego nakładu.");
    return round2(price);
  }

  function calculatePosterCustom(prices, printType, widthCm, heightCm, quantity) {
    const billing = findPosterBillingFormat(prices, printType, widthCm, heightCm);
    const calculated = calculatePosters(prices, printType, billing.formatName, quantity);
    if (calculated && typeof calculated === "object") return { ...calculated, billing };
    const price = Number(calculated);
    return { price: round2(price), unitPrice: round2(price / Number(quantity)), billing };
  }

  function getQuantityUnitPrice(quantity, tiers) {
    assertPositive(quantity, "Ilość");
    const sorted = [...(tiers || [])].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
    let selected = null;
    for (const tier of sorted) {
      if (Number(quantity) >= Number(tier.min_szt)) selected = tier;
    }
    if (!selected) throw new Error("Nie znaleziono progu cenowego dla wybranej ilości.");
    return selected;
  }

  function calculateRollup(prices, productType, size, quantity) {
    assertPositive(quantity, "Ilość");
    const data = prices.rollup[productType]?.[size];
    if (!data) throw new Error("Nie znaleziono wybranego wariantu roll-upu.");
    const tier = getQuantityUnitPrice(Number(quantity), data.progi_ilosciowe);
    const unitPrice = Number(tier.cena_sztuki);
    return { price: round2(unitPrice * Number(quantity)), unitPrice, tierMinQuantity: Number(tier.min_szt) };
  }

  function getPvcPricePerM2(totalArea, thicknessData) {
    assertPositive(totalArea, "Łączna powierzchnia");
    const tiers = thicknessData?.progi_cenowe_m2 || [];
    for (const tier of tiers) {
      if (tier.maks_m2 == null) return Number(tier.cena_m2);
      const max = Number(tier.maks_m2);
      const matches = tier.maks_wlacznie === false ? totalArea < max : totalArea <= max;
      if (matches) return Number(tier.cena_m2);
    }
    throw new Error("Nie znaleziono progu cenowego PCV.");
  }

  function calculatePvc(prices, widthCm, heightCm, quantity, productType, thickness) {
    assertPositive(widthCm, "Szerokość");
    assertPositive(heightCm, "Wysokość");
    assertWholeQuantity(quantity);
    const shorterSide = Math.min(Number(widthCm), Number(heightCm));
    const longerSide = Math.max(Number(widthCm), Number(heightCm));
    if (shorterSide > 160 || longerSide > 300) throwLimit("Maksymalny wymiar PCV to 160 × 300 cm, również po obróceniu.");
    const data = prices.pvc[productType];
    const thicknessData = data?.grubosci?.[thickness];
    if (!thicknessData) throw new Error("Nie znaleziono wybranej grubości płyty.");
    const totalArea = Number(widthCm) / 100 * Number(heightCm) / 100 * Number(quantity);
    const unitPrice = getPvcPricePerM2(totalArea, thicknessData);
    const minimumOrder = Number(data.minimum_zamowienia || 0);
    const materialPrice = round2(Math.max(totalArea * unitPrice, minimumOrder));
    const cutting = calculateOptionalManualCutting(prices, data, widthCm, heightCm, quantity, true);
    return {
      price: round2(materialPrice + cutting.cuttingCost),
      materialPrice, totalArea, unitPrice, minimumOrder, ...cutting
    };
  }

  function getFoamBoardFormats(prices, productType) {
    const formats = prices.pvc?.[productType]?.formaty;
    if (!formats) throw new Error("Nie znaleziono cennika plansz z pianki.");
    return formats;
  }

  function calculateFoamBoardStandard(prices, productType, formatName, quantity) {
    assertWholeQuantity(quantity);
    const format = getFoamBoardFormats(prices, productType)[formatName];
    if (!format) throw new Error("Nie znaleziono wybranego formatu planszy.");
    const unitPrice = Number(format.cena_sztuki);
    const materialPrice = round2(unitPrice * Number(quantity));
    const productData = prices.pvc?.[productType];
    const cutting = calculateOptionalManualCutting(prices, productData, Number(format.szerokosc_cm), Number(format.wysokosc_cm), quantity, false);
    return {
      price: round2(materialPrice + cutting.cuttingCost),
      materialPrice, unitPrice, formatName, ...cutting
    };
  }

  function findFoamBoardBillingFormat(prices, productType, widthCm, heightCm) {
    assertPositive(widthCm, "Szerokość planszy");
    assertPositive(heightCm, "Wysokość planszy");
    const requestedWidth = Number(widthCm);
    const requestedHeight = Number(heightCm);
    const candidates = Object.entries(getFoamBoardFormats(prices, productType)).map(([formatName, format]) => {
      const formatWidth = Number(format.szerokosc_cm);
      const formatHeight = Number(format.wysokosc_cm);
      const fitsNormally = requestedWidth <= formatWidth && requestedHeight <= formatHeight;
      const fitsRotated = requestedWidth <= formatHeight && requestedHeight <= formatWidth;
      return {
        formatName,
        widthCm: formatWidth,
        heightCm: formatHeight,
        price: Number(format.cena_sztuki),
        areaCm2: formatWidth * formatHeight,
        rotated: !fitsNormally && fitsRotated,
        contains: fitsNormally || fitsRotated
      };
    });
    const containing = candidates.filter(item => item.contains).sort((a, b) => a.areaCm2 - b.areaCm2 || a.price - b.price);
    if (!containing.length) throwLimit("Dla podanego wymiaru pianki nie ma ceny automatycznej w cenniku.");
    return { ...containing[0], billingMethod: "Najmniejszy format z cennika mieszczący podany wymiar" };
  }

  function calculateFoamBoardCustom(prices, productType, widthCm, heightCm, quantity) {
    assertWholeQuantity(quantity);
    const shorterSide = Math.min(Number(widthCm), Number(heightCm));
    const longerSide = Math.max(Number(widthCm), Number(heightCm));
    if (shorterSide > 100 || longerSide > 140) throwLimit("Maksymalny wymiar pianki to 100 × 140 cm, również po obróceniu.");
    const billing = findFoamBoardBillingFormat(prices, productType, widthCm, heightCm);
    const materialPrice = round2(billing.price * Number(quantity));
    const productData = prices.pvc?.[productType];
    const cutting = calculateOptionalManualCutting(prices, productData, widthCm, heightCm, quantity, false);
    return {
      price: round2(materialPrice + cutting.cuttingCost),
      materialPrice, unitPrice: billing.price, billing, ...cutting
    };
  }

  function fitItemsInLine(availableMm, itemMm, gapMm) {
    if (availableMm <= 0 || itemMm <= 0) return 0;
    return Math.max(0, Math.floor((Number(availableMm) + Number(gapMm) + 1e-9) / (Number(itemMm) + Number(gapMm))));
  }

  function getBestSheetLayout(usableWidthMm, usableHeightMm, itemWidthMm, itemHeightMm, gapMm = 0) {
    const orientations = [
      { name: "bez obrotu", width: Number(itemWidthMm), height: Number(itemHeightMm) },
      { name: "obrócone 90°", width: Number(itemHeightMm), height: Number(itemWidthMm) }
    ];
    const candidates = [];

    const perRow = orientations.map(item => fitItemsInLine(usableWidthMm, item.width, gapMm));
    const maxRows = orientations.map(item => fitItemsInLine(usableHeightMm, item.height, gapMm));

    for (let rowsA = 0; rowsA <= maxRows[0]; rowsA += 1) {
      for (let rowsB = 0; rowsB <= maxRows[1]; rowsB += 1) {
        const rowCount = rowsA + rowsB;
        if (!rowCount) continue;
        const usedHeight = rowsA * orientations[0].height + rowsB * orientations[1].height + Math.max(0, rowCount - 1) * Number(gapMm);
        if (usedHeight > Number(usableHeightMm) + 1e-9) continue;
        const count = rowsA * perRow[0] + rowsB * perRow[1];
        if (!count) continue;
        const mixed = rowsA > 0 && rowsB > 0;
        const description = mixed
          ? `Układ mieszany: ${rowsA} rz. bez obrotu + ${rowsB} rz. obróconych`
          : rowsA > 0
            ? `${rowsA} rz. bez obrotu`
            : `${rowsB} rz. obróconych 90°`;
        candidates.push({ count, description, mixed, method: "rows" });
      }
    }

    const perColumn = orientations.map(item => fitItemsInLine(usableHeightMm, item.height, gapMm));
    const maxColumns = orientations.map(item => fitItemsInLine(usableWidthMm, item.width, gapMm));

    for (let columnsA = 0; columnsA <= maxColumns[0]; columnsA += 1) {
      for (let columnsB = 0; columnsB <= maxColumns[1]; columnsB += 1) {
        const columnCount = columnsA + columnsB;
        if (!columnCount) continue;
        const usedWidth = columnsA * orientations[0].width + columnsB * orientations[1].width + Math.max(0, columnCount - 1) * Number(gapMm);
        if (usedWidth > Number(usableWidthMm) + 1e-9) continue;
        const count = columnsA * perColumn[0] + columnsB * perColumn[1];
        if (!count) continue;
        const mixed = columnsA > 0 && columnsB > 0;
        const description = mixed
          ? `Układ mieszany: ${columnsA} kol. bez obrotu + ${columnsB} kol. obróconych`
          : columnsA > 0
            ? `${columnsA} kol. bez obrotu`
            : `${columnsB} kol. obróconych 90°`;
        candidates.push({ count, description, mixed, method: "columns" });
      }
    }

    candidates.sort((a, b) => b.count - a.count || Number(a.mixed) - Number(b.mixed) || a.description.length - b.description.length);
    return candidates[0] || null;
  }

  function calculateDigitalSheetVariant(pricesRoot, sheetFormat, widthMm, heightMm, quantity, paperType, colorMode, sideMode) {
    const digital = pricesRoot.druk_cyfrowy_i_ksero;
    const imposition = digital.arkuszowanie;
    const sheet = imposition?.formaty_arkuszy?.[sheetFormat];
    if (!sheet) throw new Error(`Nie znaleziono konfiguracji arkusza ${sheetFormat}.`);

    const bleedMm = Number(imposition.domyslny_spad_mm ?? 3);
    const gapMm = Number(imposition.odstep_miedzy_uzytkami_mm ?? 0);
    const marginMm = Number(imposition.margines_arkusza_mm ?? 3);
    const productionWidthMm = Number(widthMm) + bleedMm * 2;
    const productionHeightMm = Number(heightMm) + bleedMm * 2;
    const usableWidthMm = Number(sheet.szerokosc_mm) - marginMm * 2;
    const usableHeightMm = Number(sheet.wysokosc_mm) - marginMm * 2;

    const layout = getBestSheetLayout(usableWidthMm, usableHeightMm, productionWidthMm, productionHeightMm, gapMm);
    if (!layout || layout.count < 1) {
      throw new Error(`Wymiar ${productionWidthMm} × ${productionHeightMm} mm po spadzie nie mieści się na arkuszu ${sheetFormat}.`);
    }

    const sheets = Math.ceil(Number(quantity) / layout.count);
    const totalPieces = sheets * layout.count;
    const extraPieces = totalPieces - Number(quantity);
    const priceResult = calculateDigital(
      pricesRoot,
      "Druk cyfrowy",
      colorMode,
      sheets,
      sheet.format_rozliczeniowy,
      paperType,
      sideMode
    );

    return {
      sheetFormat,
      sheetWidthMm: Number(sheet.szerokosc_mm),
      sheetHeightMm: Number(sheet.wysokosc_mm),
      usableWidthMm,
      usableHeightMm,
      billingFormat: sheet.format_rozliczeniowy,
      netWidthMm: Number(widthMm),
      netHeightMm: Number(heightMm),
      productionWidthMm,
      productionHeightMm,
      bleedMm,
      marginMm,
      gapMm,
      piecesPerSheet: layout.count,
      layoutDescription: layout.description,
      sheets,
      totalPieces,
      extraPieces,
      price: priceResult.price,
      tier: priceResult.tier,
      basePrice: priceResult.basePrice,
      paperSurcharge: priceResult.paperSurcharge,
      pricePerOrderedPiece: round2(priceResult.price / Number(quantity))
    };
  }

  function calculateDigitalImposition(pricesRoot, widthMm, heightMm, quantity, paperType, colorMode, sideMode, sheetChoice = "Automatycznie") {
    assertPositive(widthMm, "Szerokość netto");
    assertPositive(heightMm, "Wysokość netto");
    assertPositive(quantity, "Liczba gotowych sztuk");

    const imposition = pricesRoot.druk_cyfrowy_i_ksero.arkuszowanie;
    if (!imposition?.formaty_arkuszy) throw new Error("Brakuje konfiguracji arkuszowania w prices.json.");

    const comparisons = [];
    const errors = [];
    for (const sheetFormat of Object.keys(imposition.formaty_arkuszy)) {
      try {
        comparisons.push(calculateDigitalSheetVariant(pricesRoot, sheetFormat, widthMm, heightMm, quantity, paperType, colorMode, sideMode));
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (!comparisons.length) throw new Error(errors[0] || "Podany format nie mieści się na żadnym arkuszu.");

    const ranked = [...comparisons].sort((a, b) => a.price - b.price || a.sheets - b.sheets || b.piecesPerSheet - a.piecesPerSheet);
    const recommended = ranked[0];
    const selected = sheetChoice === "Automatycznie"
      ? recommended
      : comparisons.find(item => item.sheetFormat === sheetChoice);

    if (!selected) throw new Error(`Podany format nie mieści się na arkuszu ${sheetChoice}.`);

    return {
      ...selected,
      comparisons,
      recommendedFormat: recommended.sheetFormat,
      isRecommended: selected.sheetFormat === recommended.sheetFormat
    };
  }

  function getQuantityTier(quantity) {
    assertPositive(quantity, "Ilość");
    if (quantity <= 20) return "1-20";
    if (quantity <= 100) return "21-100";
    if (quantity <= 500) return "101-500";
    return "501+";
  }

  function calculateDigital(pricesRoot, service, colorMode, quantity, formatName = "A4", paperType = "Standardowy 80 g", sideMode = "Jednostronny") {
    assertPositive(quantity, "Ilość");
    const prices = pricesRoot.druk_cyfrowy_i_ksero;
    let total;
    if (service === "Druk cyfrowy" || service === "Ksero i druk") {
      const servicePrices = service === "Druk cyfrowy" ? prices.druk_cyfrowy : prices.ksero_i_druk;
      const sideMultiplier = service === "Druk cyfrowy" ? Number(prices.mnozniki_zadruku[sideMode]) : 1;
      const formatMultiplier = Number(prices.mnozniki_formatu[formatName]);
      const printUnits = Number(quantity) * sideMultiplier * formatMultiplier;
      const tier = getQuantityTier(printUnits);
      const basePrice = Number(servicePrices[colorMode][tier]);
      const paperSurcharge = Number(prices.doplaty_do_papieru[paperType]);
      const printTotal = basePrice * printUnits;
      const paperUnits = Number(quantity) * formatMultiplier;
      const paperTotal = paperSurcharge * paperUnits;
      total = printTotal + paperTotal;
      return { price: round2(total), tier, printUnits, paperUnits, basePrice, paperSurcharge };
    }
    if (service === "Ksero książki") total = Number(prices.ksero_ksiazki[colorMode]) * Number(quantity);
    else if (service === "Dla studentów") total = Number(prices.dla_studentow[colorMode][formatName]) * Number(quantity);
    else if (service === "Skanowanie") total = Number(prices.skanowanie[colorMode]) * Number(quantity);
    else throw new Error("Nieobsługiwany rodzaj usługi.");
    return { price: round2(total) };
  }

  function getApparelDiscount(quantity, discounts) {
    assertPositive(quantity, "Ilość");
    const tiers = [...(discounts.progi_ilosciowe || [])].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
    let discount = 0;
    for (const tier of tiers) {
      if (Number(quantity) >= Number(tier.min_szt)) discount = Number(tier.rabat_proc);
    }
    return discount;
  }

  function normalizeSize(value) {
    return String(value).toLowerCase().replaceAll(" ", "").replaceAll("×", "x");
  }

  function findPrintOnlySize(selectedSize, printOnlyPrices) {
    if (Object.prototype.hasOwnProperty.call(printOnlyPrices, selectedSize)) return selectedSize;
    const normalized = normalizeSize(selectedSize);
    for (const dimension of ["10x15", "20x30", "35x40"]) {
      if (normalized.includes(dimension)) {
        const found = Object.keys(printOnlyPrices).find(key => normalizeSize(key).includes(dimension));
        if (found) return found;
      }
    }
    if (normalized.includes("standard")) {
      return Object.keys(printOnlyPrices).sort((a, b) => Number(printOnlyPrices[a]) - Number(printOnlyPrices[b]))[0];
    }
    throw new Error(`Nie można dopasować ceny dodatkowego nadruku dla wariantu: ${selectedSize}.`);
  }

  function calculateApparel(prices, category, product, front, back, quantity) {
    assertWholeQuantity(quantity);
    const root = prices.odziez_z_nadrukiem;
    const productData = root.produkty[category]?.[product];
    if (!productData) throw new Error("Nie znaleziono wybranego produktu.");
    const selected = [];
    if (front && front !== NO_PRINT) selected.push({ side: "Przód", size: front });
    if (back && back !== NO_PRINT) selected.push({ side: "Tył", size: back });
    if (!selected.length) throw new Error("Wybierz przynajmniej jeden nadruk.");

    const printOnlyPrices = root.produkty["Sam nadruk"]?.["Nadruk na odzieży klienta"]?.ceny || {};
    const isPrintOnly = category === "Sam nadruk";
    const garmentPrice = productData.cena_odziezy;
    const isGarmentPlusPrint = garmentPrice !== undefined && garmentPrice !== null;
    const isSinglePrintIncluded = Boolean(productData.nadruk_w_cenie);
    let garmentUnitPrice = 0;
    let firstPrintPrice = 0;
    let extraPrintPrice = 0;
    let baseUnitPrice = 0;
    let matchedSize = null;

    if (isSinglePrintIncluded) {
      if (selected.length > 1) throw new Error("Ten produkt obejmuje tylko jeden nadruk.");
      baseUnitPrice = Number(productData.ceny?.[selected[0].size]);
      if (!Number.isFinite(baseUnitPrice)) throw new Error("Nie znaleziono ceny produktu z nadrukiem.");
    } else if (isGarmentPlusPrint || isPrintOnly) {
      if (isGarmentPlusPrint) {
        garmentUnitPrice = Number(garmentPrice);
        if (!Number.isFinite(garmentUnitPrice) || garmentUnitPrice < 0) throw new Error("Nieprawidłowa cena odzieży.");
      }
      const printPrices = selected.map(({size}) => {
        const matched = findPrintOnlySize(size, printOnlyPrices);
        const price = Number(printOnlyPrices[matched]);
        if (!Number.isFinite(price) || price < 0) throw new Error("Nieprawidłowa cena nadruku.");
        return {price, matched};
      });
      firstPrintPrice = printPrices[0].price;
      extraPrintPrice = printPrices[1]?.price || 0;
      matchedSize = printPrices[1]?.matched || null;
      baseUnitPrice = garmentUnitPrice + firstPrintPrice;
    } else {
      // Compatibility with old custom apparel products that use combined size prices.
      baseUnitPrice = Number(productData.ceny?.[selected[0].size]);
      if (!Number.isFinite(baseUnitPrice)) throw new Error("Nie znaleziono ceny wybranego rozmiaru nadruku.");
      if (selected.length > 1) {
        matchedSize = findPrintOnlySize(selected[1].size, printOnlyPrices);
        extraPrintPrice = Number(printOnlyPrices[matchedSize]);
      }
    }

    const unitPrice = baseUnitPrice + extraPrintPrice;
    const priceBeforeDiscount = unitPrice * Number(quantity);
    const discountPercent = isPrintOnly ? 0 : getApparelDiscount(Number(quantity), root.rabaty || {});
    const discountAmount = priceBeforeDiscount * discountPercent / 100;
    return {
      price: round2(priceBeforeDiscount - discountAmount),
      unitPrice: round2(unitPrice),
      discountedUnitPrice: round2(unitPrice * (1 - discountPercent / 100)),
      baseUnitPrice: round2(baseUnitPrice),
      garmentUnitPrice: round2(garmentUnitPrice),
      firstPrintPrice: round2(firstPrintPrice),
      extraPrintPrice: round2(extraPrintPrice),
      priceBeforeDiscount: round2(priceBeforeDiscount),
      discountPercent,
      discountAmount: round2(discountAmount),
      extraPrintMatchedSize: matchedSize
    };
  }

  function calculateWorkBinding(prices, pagesPerCopy, copies, colorMode, sideMode, bindingType, bindingVariant) {
    assertPositive(pagesPerCopy, "Liczba stron");
    assertPositive(copies, "Liczba egzemplarzy");
    const totalPrintedPages = Number(pagesPerCopy) * Number(copies);
    const tier = getQuantityTier(totalPrintedPages);
    const printPricePerPage = Number(prices.druk_cyfrowy_i_ksero.druk_cyfrowy[colorMode][tier]);
    const printTotal = totalPrintedPages * printPricePerPage;
    const sheetsPerCopy = sideMode === "Dwustronny" ? Math.ceil(Number(pagesPerCopy) / 2) : Number(pagesPerCopy);
    const totalSheets = sheetsPerCopy * Number(copies);
    const bindingPricePerCopy = Number(prices.oprawa_prac.rodzaje_opraw[bindingType][bindingVariant]);
    const bindingTotal = bindingPricePerCopy * Number(copies);
    const price = printTotal + bindingTotal;
    return { price: round2(price), totalPrintedPages, tier, printPricePerPage, printTotal: round2(printTotal), sheetsPerCopy, totalSheets, bindingPricePerCopy, bindingTotal: round2(bindingTotal), pricePerCopy: round2(price / Number(copies)) };
  }

  function calculateLamination(prices, formatName, quantity) {
    assertPositive(quantity, "Ilość");
    const unitPrice = Number(prices.laminowanie.formaty[formatName]);
    return { price: round2(unitPrice * Number(quantity)), unitPrice, foilMicrons: Number(prices.laminowanie.folia_mikrony || 80) };
  }

  function parseCanvasFormat(formatKey) {
    const match = String(formatKey).match(/^\s*(\d+)\s*[x×]\s*(\d+)\s*$/);
    if (!match) throw new Error(`Nieprawidłowy format obrazu: ${formatKey}.`);
    return [Number(match[1]), Number(match[2])];
  }

  function getCanvasSuggestions(prices, imageWidth, imageHeight, minimumResults = 8) {
    assertPositive(imageWidth, "Szerokość obrazu");
    assertPositive(imageHeight, "Wysokość obrazu");
    const ratio = Number(imageWidth) / Number(imageHeight);
    const landscape = imageWidth > imageHeight;
    const portrait = imageHeight > imageWidth;
    const candidates = Object.entries(prices.obrazy_na_plotnie.formaty).map(([key, price]) => {
      const [a, b] = parseCanvasFormat(key);
      const small = Math.min(a, b), large = Math.max(a, b);
      const width = landscape ? large : portrait ? small : a;
      const height = landscape ? small : portrait ? large : b;
      const formatRatio = width / height;
      return { formatKey: key, displayWidthCm: width, displayHeightCm: height, price: Number(price), ratioErrorPercent: Math.abs(formatRatio - ratio) / ratio * 100, areaCm2: width * height };
    }).sort((a, b) => a.ratioErrorPercent - b.ratioErrorPercent || a.areaCm2 - b.areaCm2);
    if (!candidates.length) return [];
    const best = candidates[0].ratioErrorPercent;
    const bestMatches = candidates.filter(c => Math.abs(c.ratioErrorPercent - best) < 1e-9);
    return bestMatches.length >= 3 ? bestMatches : candidates.slice(0, Math.max(minimumResults, bestMatches.length));
  }

  function calculateProportionalCanvasSize(prices, imageWidth, imageHeight, knownSide, knownValueCm) {
    assertPositive(imageWidth, "Szerokość obrazu");
    assertPositive(imageHeight, "Wysokość obrazu");
    assertPositive(knownValueCm, "Podany wymiar");
    const ratio = Number(imageWidth) / Number(imageHeight);
    let width, height;
    if (knownSide === "Szerokość") { width = Number(knownValueCm); height = width / ratio; }
    else if (knownSide === "Wysokość") { height = Number(knownValueCm); width = height * ratio; }
    else throw new Error("Wybierz, czy podajesz szerokość czy wysokość.");
    width = Math.round(width * 10) / 10;
    height = Math.round(height * 10) / 10;
    const minSide = Number(prices.obrazy_na_plotnie.minimalny_bok_cm || 30);
    const maxSide = Number(prices.obrazy_na_plotnie.maksymalny_bok_cm || 150);
    if (Math.max(width, height) > maxSide) throwLimit(`Po zachowaniu proporcji najdłuższy bok ma ${Math.max(width, height).toFixed(1)} cm. Maksymalny bok to ${maxSide} cm.`);
    if (Math.min(width, height) < minSide) throwLimit(`Po zachowaniu proporcji krótszy bok ma ${Math.min(width, height).toFixed(1)} cm. Minimalny bok to ${minSide} cm.`);
    return { widthCm: width, heightCm: height };
  }

  function findCanvasBillingFormat(prices, widthCm, heightCm) {
    const requestedArea = Number(widthCm) * Number(heightCm);
    const candidates = [];
    for (const [key, price] of Object.entries(prices.obrazy_na_plotnie.formaty)) {
      const [a, b] = parseCanvasFormat(key);
      const orientations = [[a, b], [b, a]];
      for (const [w, h] of orientations) {
        const area = w * h;
        candidates.push({ formatKey: key, displayWidthCm: w, displayHeightCm: h, price: Number(price), areaCm2: area, areaDifference: Math.abs(area - requestedArea), dimensionDifference: Math.abs(w - widthCm) + Math.abs(h - heightCm), contains: w >= widthCm && h >= heightCm });
      }
    }
    const containing = candidates.filter(c => c.contains).sort((a, b) => a.areaCm2 - b.areaCm2 || a.dimensionDifference - b.dimensionDifference || a.price - b.price);
    if (containing.length) return { ...containing[0], billingMethod: "Najbliższy większy format z cennika" };
    candidates.sort((a, b) => a.dimensionDifference - b.dimensionDifference || a.areaDifference - b.areaDifference || a.price - b.price);
    return { ...candidates[0], billingMethod: "Najbliższy dostępny format z cennika" };
  }

  function calculateCanvasStandard(prices, formatKey, quantity) {
    assertWholeQuantity(quantity);
    if (Number(quantity) > 10) throwLimit("Maksymalna liczba jednakowych obrazów w jednym zamówieniu to 10 sztuk.");
    const unitPrice = Number(prices.obrazy_na_plotnie.formaty[formatKey]);
    return { price: round2(unitPrice * Number(quantity)), unitPrice };
  }

  function calculateCanvasCustom(prices, widthCm, heightCm, quantity) {
    assertPositive(widthCm, "Szerokość obrazu");
    assertPositive(heightCm, "Wysokość obrazu");
    assertWholeQuantity(quantity);
    if (Number(quantity) > 10) throwLimit("Maksymalna liczba jednakowych obrazów w jednym zamówieniu to 10 sztuk.");
    const minSide = Number(prices.obrazy_na_plotnie.minimalny_bok_cm || 30);
    const maxSide = Number(prices.obrazy_na_plotnie.maksymalny_bok_cm || 150);
    if (Math.min(Number(widthCm), Number(heightCm)) < minSide) throwLimit(`Minimalny bok obrazu to ${minSide} cm.`);
    if (Math.max(Number(widthCm), Number(heightCm)) > maxSide) throwLimit(`Maksymalny bok obrazu to ${maxSide} cm.`);
    const billing = findCanvasBillingFormat(prices, Number(widthCm), Number(heightCm));
    return { price: round2(billing.price * Number(quantity)), unitPrice: billing.price, billing };
  }

  function calculateWedding(prices, productType, variant, formatName, quantity) {
    assertWholeQuantity(quantity);
    const root = prices?.sluby_wesela_imprezy;
    const product = root?.[productType];
    if (!product) throw new Error("Nie znaleziono wybranego produktu ślubnego.");
    const variantData = product.warianty?.[variant];
    if (!variantData) throw new Error("Nie znaleziono wybranego wariantu.");
    const formatData = variantData?.[formatName];
    if (formatData == null) throw new Error("Nie znaleziono wybranego formatu.");

    if (product.tryb === "pakiet") {
      const price = Number(formatData[String(quantity)]);
      if (!Number.isFinite(price)) throw new Error("Dla tego nakładu nie ma ceny w cenniku.");
      return { price: round2(price), unitPrice: round2(price / Number(quantity)), mode: "pakiet" };
    }

    const unitPrice = Number(formatData);
    if (!Number.isFinite(unitPrice)) throw new Error("Nie znaleziono ceny wybranego formatu.");
    return { price: round2(unitPrice * Number(quantity)), unitPrice: round2(unitPrice), mode: "sztuka" };
  }

  global.Calculators = {
    NO_PRINT, DIGITAL_FINISH_KEYS, OFFSET_FINISH_KEYS,
    getBannerPricePerM2, calculateManualCutting, calculateOptionalManualCutting, calculateBanner, calculateBusinessCards, calculateFlyers,
    getStickerPricePerLinearMeter, calculateStickers, calculateNotepads, calculateCatalogProduct,
    getPosterFormatDimensions, findPosterBillingFormat, calculatePosters, calculatePosterCustom, calculateRollup, calculatePvc, calculateFoamBoardStandard, calculateFoamBoardCustom, calculateDigital, calculateDigitalImposition, calculateApparel, calculateWorkBinding,
    calculateLamination, getCanvasSuggestions, calculateProportionalCanvasSize, calculateCanvasStandard, calculateCanvasCustom, calculateWedding,
    getQuantityTier, roundUpToStep
  };
})(window);
