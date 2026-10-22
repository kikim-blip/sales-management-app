// src/utils/printCalculators/multiPartCalculator.js
/**
 * 인쇄원가 종합 계산 엔진 (표지 / 내지 / 화보 멀티파트 정밀 분리)
 * 전라남도교육청 / 조달청 / 갑우문화사 / 비피앤피 표준 인쇄원가 계산 모델 적용
 */

import { DEFAULT_STD_PRICES, DEFAULT_PAPERS } from './defaultMasterData';

/**
 * 판형(절수)별 1대당 페이지 수 (2절 매엽기 기준)
 */
export function getPagesPerSignature(cut = '국배판(A4)') {
  if (cut.includes('8절') || cut.includes('A3')) return 8;
  if (cut.includes('16절') || cut.includes('A4') || cut.includes('B5') || cut.includes('배판') || cut.includes('국판')) return 16;
  if (cut.includes('32절') || cut.includes('A5') || cut.includes('B6')) return 32;
  if (cut.includes('4절')) return 4;
  if (cut.includes('2절')) return 2;
  return 16;
}

/**
 * 인쇄물 절수(1전지당 인쇄 부수) 반환
 */
export function getCutsPerFullSheet(cut = '국배판(A4)') {
  if (cut.includes('8절') || cut.includes('A3')) return 8;
  if (cut.includes('16절') || cut.includes('A4') || cut.includes('B5') || cut.includes('배판') || cut.includes('국판')) return 16;
  if (cut.includes('32절') || cut.includes('A5') || cut.includes('B6')) return 32;
  if (cut.includes('4절')) return 4;
  if (cut.includes('2절')) return 2;
  return 16;
}

/**
 * 수량 및 색도에 따른 손지율(%) 산출
 */
export function getPartWasteRate(quantity, colorCount = 4) {
  const q = Number(quantity) || 1000;
  const c = Math.min(Math.max(1, Number(colorCount) || 4), 4) - 1;
  const waste = DEFAULT_STD_PRICES.wasteRates;
  let key = 'max';
  if (q <= 1000) key = '1000';
  else if (q <= 3000) key = '3000';
  else if (q <= 5000) key = '5000';
  else if (q <= 10000) key = '10000';
  return waste[key] ? waste[key][c] : 10;
}

/**
 * 수량 및 색도에 따른 통당 표준 인쇄 단가 (원/통)
 */
export function getPassUnitPrice(quantity, colorCount = 4) {
  const q = Number(quantity) || 1000;
  const c = Math.min(Math.max(1, Number(colorCount) || 4), 4) - 1;
  const rates = DEFAULT_STD_PRICES.offsetRates;
  let key = 'max';
  if (q <= 1000) key = '1000';
  else if (q <= 2000) key = '2000';
  else if (q <= 3000) key = '3000';
  else if (q <= 5000) key = '5000';
  else if (q <= 7000) key = '7000';
  else if (q <= 10000) key = '10000';
  else if (q <= 13000) key = '13000';
  return rates[key] ? rates[key][c] : 25;
}

/**
 * 파트(표지/본문/화보)별 단독 원가 계산
 */
export function calculatePartCost({
  name = '표지',
  quantity = 1000,
  paperCut = '국배판(A4)',
  pages = 4,              // 인쇄 총 면수
  blankPages = 0,         // 인쇄되지 않는 면 (백면)
  typesetPages = 0,       // 조판/편집 면수
  typesetRate = 0,        // 조판/편집율 (%)
  typesetUnitPrice = 15000,// 조판 면당 기본단가
  colorCount = 4,         // 도수 (1도, 2도, 4도, 8도 등)
  isDoubleSided = true,   // 양면 인쇄 여부
  paperUnitPrice = 85000, // 연당 단가 (원/R)
  ctpUnitPrice = 6500,    // CTP 판당 단가
  customReams = null,     // 수기 연수
  isBetaPrint = false,    // 베다 인쇄 여부 (할증 15%)
  isSpotColor = false,    // 특수 별색 여부
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const actualPages = Math.max(0, Number(pages) || 0);
  const printedPages = Math.max(0, actualPages - (Number(blankPages) || 0));

  if (actualPages === 0) {
    return {
      name,
      pages: 0,
      reams: 0,
      plates: 0,
      signatures: 0,
      paperCost: 0,
      printCost: 0,
      ctpCost: 0,
      typesetCost: 0,
      totalCost: 0,
    };
  }

  const cuts = getCutsPerFullSheet(paperCut);
  const pagesPerSig = getPagesPerSignature(paperCut);

  // 1. 소요 대수(Signatures) 계산
  // 표지는 통상 1대, 본문은 본문면수 / 대당페이지수
  let signatures = 1;
  if (name.includes('본문') || name.includes('내지')) {
    signatures = Math.max(1, Math.ceil((actualPages / pagesPerSig) * 2) / 2); // 0.5대 단위 반올림
  } else {
    signatures = actualPages <= 4 ? 1 : Math.ceil(actualPages / 4);
  }

  // 2. CTP 판수 및 제판비 계산
  // 판수 = 대수 × 도수 (양면 4도/4도인 경우 도수는 8 또는 앞뒤 각각 4도 = 8판)
  const effectiveColors = Number(colorCount) || (isDoubleSided ? 8 : 4);
  const totalPlates = Math.max(1, Math.round(signatures * effectiveColors));
  const ctpCost = Math.round(totalPlates * (Number(ctpUnitPrice) || 6500));

  // 3. 소요 연수(R) 및 용지비 계산
  // 전지 1매당 페이지수 = 절수 × 2 (양면 인쇄 기준)
  const pagesPerFullSheet = cuts * 2;
  const netSheets = (qty * actualPages) / pagesPerFullSheet;
  const netReams = netSheets / 500;
  const wasteRate = getPartWasteRate(qty, effectiveColors > 4 ? 4 : effectiveColors);
  const totalReams = customReams ? Number(customReams) : parseFloat((netReams * (1 + wasteRate / 100)).toFixed(3));
  const paperCost = Math.round(totalReams * (Number(paperUnitPrice) || 50000));

  // 4. 인쇄비 계산 (통수 및 통당단가)
  // 통수 = 연수 × 500통 × (양면 인쇄 시 ×2)
  const passUnitPrice = getPassUnitPrice(qty, effectiveColors > 4 ? 4 : effectiveColors);
  let printCost = 0;
  const betaMultiplier = isBetaPrint ? 1.15 : 1.0;
  const spotMultiplier = isSpotColor ? 1.2 : 1.0;

  // 연당 인쇄비 계산식 (한국 표준: 연수 × 연당 기본인쇄비 or 통수단가)
  // 1연당 단면 4도 기본인쇄비 약 30,000원, 양면 8도 약 60,000원
  const baseReamPrintRate = effectiveColors <= 4 ? 30000 : 55000;
  printCost = Math.round(totalReams * baseReamPrintRate * betaMultiplier * spotMultiplier);

  // 5. 조판 및 편집료
  // 조판면수 × 면당단가 × (조판편집율 / 100)
  const tPages = Number(typesetPages) || 0;
  const tRate = Math.max(0, Math.min(100, Number(typesetRate) || 0));
  const typesetCost = Math.round(tPages * (Number(typesetUnitPrice) || 15000) * (tRate / 100));

  const totalCost = paperCost + printCost + ctpCost + typesetCost;

  return {
    name,
    pages: actualPages,
    printedPages,
    blankPages: Number(blankPages) || 0,
    signatures,
    totalPlates,
    effectiveColors,
    wasteRate,
    netReams: parseFloat(netReams.toFixed(3)),
    totalReams,
    paperCost,
    printCost,
    ctpCost,
    typesetCost,
    totalCost,
  };
}

/**
 * 전체 인쇄원가 계산 (표지 + 본문 + 화보 + 제본 + 후가공 + 기타)
 */
export function calculateFullCost({
  general = {},
  cover = {},
  body = {},
  supplement = {},
  options = {},
  extra = {},
}) {
  const qty = Math.max(1, Number(general.quantity) || 1000);
  const paperCut = general.paperCut || '국배판(A4)';

  // 1. 표지 계산
  const coverCalc = calculatePartCost({
    name: '표지',
    quantity: qty,
    paperCut,
    pages: cover.pages ?? 4,
    blankPages: cover.blankPages || 0,
    typesetPages: cover.typesetPages || 0,
    typesetRate: cover.typesetRate || 0,
    typesetUnitPrice: cover.typesetUnitPrice || 25000,
    colorCount: cover.colorCount || 4,
    isDoubleSided: cover.isDoubleSided ?? false,
    paperUnitPrice: cover.paperUnitPrice || 85000,
    ctpUnitPrice: general.ctpUnitPrice || 6500,
    isBetaPrint: options.isBetaPrint || false,
    isSpotColor: options.isSpotColor || false,
  });

  // 2. 본문(내지) 계산
  const bodyCalc = calculatePartCost({
    name: '본문',
    quantity: qty,
    paperCut,
    pages: body.pages ?? 32,
    blankPages: body.blankPages || 0,
    typesetPages: body.typesetPages || 0,
    typesetRate: body.typesetRate || 0,
    typesetUnitPrice: body.typesetUnitPrice || 15000,
    colorCount: body.colorCount || (general.printType === '경인쇄' ? 1 : 1),
    isDoubleSided: body.isDoubleSided ?? true,
    paperUnitPrice: body.paperUnitPrice || 47000,
    ctpUnitPrice: general.ctpUnitPrice || 6500,
    isBetaPrint: options.isBetaPrint || false,
    isSpotColor: options.isSpotColor || false,
  });

  // 3. 화보/간지/부속 (옵션 활성화 시)
  let supplementCalc = null;
  if (options.hasSupplement && (Number(supplement.pages) || 0) > 0) {
    supplementCalc = calculatePartCost({
      name: '화보/부속',
      quantity: qty,
      paperCut,
      pages: supplement.pages || 4,
      blankPages: supplement.blankPages || 0,
      typesetPages: supplement.typesetPages || 0,
      typesetRate: supplement.typesetRate || 0,
      typesetUnitPrice: supplement.typesetUnitPrice || 20000,
      colorCount: supplement.colorCount || 4,
      isDoubleSided: supplement.isDoubleSided ?? true,
      paperUnitPrice: supplement.paperUnitPrice || 110000,
      ctpUnitPrice: general.ctpUnitPrice || 6500,
      isBetaPrint: options.isBetaPrint || false,
      isSpotColor: options.isSpotColor || false,
    });
  }

  // 4. 제본비 계산
  const totalPages = coverCalc.pages + bodyCalc.pages + (supplementCalc ? supplementCalc.pages : 0);
  const bindingType = general.bindingType || '무사무선';
  let bindingCost = 0;
  let bindingUnitPrice = 0;

  if (general.printCategory === '포스터' || general.printCategory === '전단') {
    // 포스터/전단은 제본비 0원 (재단비 15,000원 기본)
    bindingCost = 15000;
  } else if (bindingType.includes('중철')) {
    // 중철: 페이지수 비례 부당 70~150원
    bindingUnitPrice = Math.max(70, Math.round(totalPages * 3.2));
    bindingCost = Math.round(bindingUnitPrice * qty + 40000); // 기본 4만원
  } else if (bindingType.includes('양장') || bindingType.includes('하드커버')) {
    // 양장: 부당 2,800 ~ 4,500원
    bindingUnitPrice = 2800 + Math.round(totalPages * 2);
    bindingCost = Math.round(bindingUnitPrice * qty + 200000);
  } else {
    // 무선제본 공식: {(표지면수*2) + 본문면수 + 화보면수} × 0.8 + 130원 + 기본료 200,000원
    const coef = 0.8;
    const base = 130;
    const calcPages = (coverCalc.pages * 2) + bodyCalc.pages + (supplementCalc ? supplementCalc.pages : 0);
    bindingUnitPrice = Math.round(calcPages * coef + base);
    const baseFee = qty < 500 ? 100000 : 200000;
    bindingCost = Math.round(bindingUnitPrice * qty + baseFee);
  }

  // 5. 후가공비 계산
  // 표지 코팅
  let coatingCost = 0;
  const coatingType = options.coatingType || (options.hasCoating ? '무광코팅' : '없음');
  if (coatingType !== '없음') {
    // 표지 소요 연수 기준 (기본 1R = 약 46,000~57,000원)
    const coatingRatePerReam = coatingType.includes('유광') ? 42000 : 48000;
    coatingCost = Math.max(35000, Math.round(coverCalc.totalReams * coatingRatePerReam));
  }

  // 박/형압/톰슨/기타 후가공
  const foilCost = options.hasFoil ? (Number(options.foilCost) || 120000) : 0;
  const diecutCost = options.hasDiecut ? (Number(options.diecutCost) || 220000) : 0;
  const totalFinishingCost = coatingCost + foilCost + diecutCost;

  // 6. 기타 운송비 / 가감금액
  const deliveryCost = Number(extra.deliveryCost ?? 50000);
  const packagingCost = Number(extra.packagingCost ?? (Math.ceil(qty / 50) * 1000));
  const discountOrAdd = Number(extra.discountOrAdd || 0);

  // ─── 부문별 총 집계 ──────────────────────────────────────────
  const totalPaperCost = coverCalc.paperCost + bodyCalc.paperCost + (supplementCalc ? supplementCalc.paperCost : 0);
  const totalPrintCost = coverCalc.printCost + bodyCalc.printCost + (supplementCalc ? supplementCalc.printCost : 0);
  const totalCtpCost = coverCalc.ctpCost + bodyCalc.ctpCost + (supplementCalc ? supplementCalc.ctpCost : 0);
  const totalTypesetCost = coverCalc.typesetCost + bodyCalc.typesetCost + (supplementCalc ? supplementCalc.typesetCost : 0);

  const subtotal = totalPaperCost + totalPrintCost + totalCtpCost + totalTypesetCost + bindingCost + totalFinishingCost + deliveryCost + packagingCost + discountOrAdd;
  const vat = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + vat;
  const perBookPrice = qty > 0 ? Math.round(totalAmount / qty) : 0;

  return {
    quantity: qty,
    totalPages,
    coverCalc,
    bodyCalc,
    supplementCalc,
    bindingCost,
    bindingUnitPrice,
    coatingCost,
    totalFinishingCost,
    totalPaperCost,
    totalPrintCost,
    totalCtpCost,
    totalTypesetCost,
    deliveryCost,
    packagingCost,
    discountOrAdd,
    subtotal,
    vat,
    totalAmount,
    perBookPrice,
  };
}
