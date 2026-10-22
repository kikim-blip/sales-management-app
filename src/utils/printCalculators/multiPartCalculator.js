// src/utils/printCalculators/multiPartCalculator.js
/**
 * 인쇄원가 종합 계산 엔진 (표지 / 내지 / 화보 멀티파트 정밀 분리)
 * - 비피앤피(bp&p) / 갑우문화사 실무 견적 시스템 (kkch1012/PrintEstimate) 정밀 공식 완전 구현
 * - 6대 공정 카테고리: PREPRESS, PRINT, BINDING, FINISHING, PAPER, OTHER
 * - CTP 고정 단가(6,500원), 무선 실무 4종 산식(단본/2탑/날개/책속책), 댐지대, 용지대 포함/사급 토글, 후가공 정밀 단가, 편차율(%) 산출
 */

import { DEFAULT_STD_PRICES, DEFAULT_PAPERS } from './defaultMasterData';

/**
 * 판형(절수)별 1대당 페이지 수 (2절 매엽기 기준)
 */
export function getPagesPerSignature(cut = '국배판(A4)') {
  if (cut.includes('8절') || cut.includes('A3') || cut.includes('B4') || cut.includes('타블로이드')) return 8;
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
  if (cut.includes('8절') || cut.includes('A3') || cut.includes('B4') || cut.includes('타블로이드')) return 8;
  if (cut.includes('16절') || cut.includes('A4') || cut.includes('B5') || cut.includes('배판') || cut.includes('국판')) return 16;
  if (cut.includes('32절') || cut.includes('A5') || cut.includes('B6')) return 32;
  if (cut.includes('4절')) return 4;
  if (cut.includes('2절')) return 2;
  return 16;
}

/**
 * 수량 및 색도에 따른 공인 손지율(%) 산출
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
  return waste[key] ? waste[key][c] : 6.3;
}

/**
 * 수량 및 색도에 따른 통당 표준 인쇄 단가 (원/통, 4×6 2절 단면 기준)
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
  return rates[key] ? rates[key][c] : 24.40;
}

/**
 * 표준단가 대비 편차율(%) 계산: ((실제단가 - 표준단가) / 표준단가) * 100
 */
export function calculateDeviation(actualPrice, stdPrice) {
  if (!stdPrice || stdPrice === 0) return 0;
  return Math.round(((actualPrice - stdPrice) / stdPrice) * 100);
}

/**
 * 댐지대(출판사 정합비) 계산: 부수 ÷ 7.5 × 110원
 */
export function calculateDamjiCost(quantity) {
  const qty = Math.max(0, Number(quantity) || 0);
  return Math.round(Math.round(qty / 7.5) * 110);
}

/**
 * 파트(표지/본문/화보/해설)별 단독 원가 계산
 */
export function calculatePartCost({
  name = '표지',
  quantity = 1000,
  paperCut = '국배판(A4)',
  pages = 4,              // 인쇄 총 면수
  blankPages = 0,         // 백면
  typesetPages = 0,       // 조판/편집 면수
  typesetRate = 0,        // 조판/편집율 (%)
  typesetUnitPrice = 15000,// 조판 면당 기본단가
  colorCount = 4,         // 도수
  isDoubleSided = true,   // 양면 인쇄 여부
  paperUnitPrice = 85000, // 연당 단가 (원/R)
  ctpUnitPrice = 6500,    // CTP 판당 단가 (실무 견적: 6,500원)
  includePaper = true,    // 용지대 포함 여부 (false 시 0원 처리)
  customReams = null,     // 수기 연수
  isBetaPrint = false,    // 전면 베다 인쇄 여부 (할증 60% 또는 15%)
  isSpotColor = false,    // 특수 별색 여부
  isHeavyOrThin = false,  // 후지/박엽지 여부
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const actualPages = Math.max(0, Number(pages) || 0);
  const printedPages = Math.max(0, actualPages - (Number(blankPages) || 0));

  if (actualPages === 0) {
    return {
      name,
      pages: 0,
      printedPages: 0,
      blankPages: 0,
      signatures: 0,
      totalPlates: 0,
      effectiveColors: 0,
      wasteRate: 0,
      netReams: 0,
      totalReams: 0,
      paperCost: 0,
      printCost: 0,
      ctpCost: 0,
      ctpStdCost: 0,
      ctpDeviation: 0,
      typesetCost: 0,
      totalCost: 0,
    };
  }

  const cuts = getCutsPerFullSheet(paperCut);
  const pagesPerSig = getPagesPerSignature(paperCut);

  // 1. 소요 대수(Signatures) 계산
  let signatures = 1;
  if (name.includes('본문') || name.includes('내지') || name.includes('해설')) {
    signatures = Math.max(1, Math.ceil((actualPages / pagesPerSig) * 2) / 2); // 0.5대 단위 반올림
  } else {
    signatures = actualPages <= 4 ? 1 : Math.ceil(actualPages / 4);
  }

  // 2. CTP 판수 및 제판비 계산 (PrintEstimate 공식: 대수 × 판수(1) × 색도 × 6,500원)
  const effectiveColors = Number(colorCount) || (isDoubleSided ? 8 : 4);
  const totalPlates = Math.max(1, Math.round(signatures * effectiveColors));
  const effectiveCtpUnitPrice = Number(ctpUnitPrice) || 6500;
  const ctpCost = Math.round(totalPlates * effectiveCtpUnitPrice);

  // 표준 CTP 단가 (협동조합 기준: 국2절 10,618원, 4×6 2절 15,286원)
  const isKuk = paperCut.includes('국');
  const ctpStdUnitPrice = isKuk ? 10618 : 15286;
  const ctpStdCost = Math.round(totalPlates * ctpStdUnitPrice);
  const ctpDeviation = calculateDeviation(effectiveCtpUnitPrice, ctpStdUnitPrice);

  // 3. 소요 연수(R) 및 용지비 계산
  const pagesPerFullSheet = cuts * 2;
  const netSheets = (qty * actualPages) / pagesPerFullSheet;
  const netReams = netSheets / 500;
  const wasteRate = getPartWasteRate(qty, Math.min(4, effectiveColors));
  const totalReams = customReams ? Number(customReams) : parseFloat((netReams * (1 + wasteRate / 100)).toFixed(3));
  
  // 용지비: includePaper가 false면 0원(거래처 입고/사급)
  const paperCost = includePaper ? Math.round(totalReams * (Number(paperUnitPrice) || 50000)) : 0;

  // 4. 인쇄비 계산 (통수 및 연당 단가)
  let printCost = 0;
  const betaMultiplier = isBetaPrint ? 1.6 : 1.0;
  const spotMultiplier = isSpotColor ? 1.5 : 1.0;
  const paperWeightMultiplier = isHeavyOrThin ? 1.3 : 1.0;

  // 1연당 단면 4도 기본인쇄비 약 30,000원, 양면 8도 약 55,000원 (통당단가 고려)
  const passUnitPrice = getPassUnitPrice(qty, Math.min(4, effectiveColors));
  // 통수 = 연수 * 500매 * (양면이면 2통)
  const totalPasses = totalReams * 500 * (isDoubleSided ? 2 : 1);
  const offsetCost = totalPasses * passUnitPrice * (Math.min(4, effectiveColors) / 4);
  const baseReamPrintRate = effectiveColors <= 4 ? 30000 : 55000;
  const reamPrintCost = totalReams * baseReamPrintRate;

  // 실무에서는 연당 인쇄비와 통수 인쇄비 중 합리적인 값 적용
  const rawPrintCost = Math.max(offsetCost, reamPrintCost);
  printCost = Math.round(rawPrintCost * betaMultiplier * spotMultiplier * paperWeightMultiplier);

  // 5. 조판 및 편집료
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
    includePaper,
    paperCost,
    paperUnitPrice: Number(paperUnitPrice) || 0,
    printCost,
    ctpCost,
    ctpStdCost,
    ctpUnitPrice: effectiveCtpUnitPrice,
    ctpStdUnitPrice,
    ctpDeviation,
    typesetCost,
    totalCost,
  };
}

/**
 * 6대 공정 카테고리별 전체 인쇄원가 종합 계산 엔진
 * (PREPRESS, PRINT, BINDING, FINISHING, PAPER, OTHER)
 */
export function calculateFullCost({
  general = {},
  cover = {},
  body = {},
  supplement = {},
  body2 = {},      // 2탑 제본용 해설 본문
  cover2 = {},     // 2탑 제본용 해설 표지
  ad = {},         // 무선날개용 광고면
  innerCover = {}, // 책속책용 속표지
  innerBody = {},  // 책속책용 속본문
  options = {},
  extra = {},
  customItems = [],
}) {
  const qty = Math.max(1, Number(general.quantity) || 1000);
  const paperCut = general.paperCut || '국배판(A4)';
  const includePaper = general.includePaper !== undefined ? general.includePaper : true;
  const ctpUnitPrice = Number(general.ctpUnitPrice) || 6500;

  // ── 1. 각 파트별 계산 ──
  // 표지
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
    paperUnitPrice: cover.paperUnitPrice || 94000,
    ctpUnitPrice,
    includePaper,
    isBetaPrint: options.isBetaPrint || false,
    isSpotColor: options.isSpotColor || false,
    isHeavyOrThin: (cover.paperWeight >= 150 || cover.paperWeight <= 50),
  });

  // 본문
  const bodyCalc = calculatePartCost({
    name: '본문',
    quantity: qty,
    paperCut,
    pages: body.pages ?? 64,
    blankPages: body.blankPages || 0,
    typesetPages: body.typesetPages || 0,
    typesetRate: body.typesetRate || 0,
    typesetUnitPrice: body.typesetUnitPrice || 15000,
    colorCount: body.colorCount || 1,
    isDoubleSided: body.isDoubleSided ?? true,
    paperUnitPrice: body.paperUnitPrice || 46136,
    ctpUnitPrice,
    includePaper,
    isBetaPrint: options.isBetaPrint || false,
    isSpotColor: options.isSpotColor || false,
    isHeavyOrThin: (body.paperWeight >= 150 || body.paperWeight <= 50),
  });

  // 화보/부속
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
      paperUnitPrice: supplement.paperUnitPrice || 57000,
      ctpUnitPrice,
      includePaper,
      isBetaPrint: options.isBetaPrint || false,
      isSpotColor: options.isSpotColor || false,
    });
  }

  // 2탑용 해설 (옵션)
  let body2Calc = null;
  if ((Number(body2.pages) || 0) > 0) {
    body2Calc = calculatePartCost({
      name: '해설본문',
      quantity: qty,
      paperCut,
      pages: body2.pages || 0,
      blankPages: body2.blankPages || 0,
      typesetPages: body2.typesetPages || 0,
      typesetRate: body2.typesetRate || 0,
      typesetUnitPrice: body2.typesetUnitPrice || 15000,
      colorCount: body2.colorCount || 1,
      isDoubleSided: body2.isDoubleSided ?? true,
      paperUnitPrice: body2.paperUnitPrice || 46136,
      ctpUnitPrice,
      includePaper,
    });
  }

  // ── 2. 제본비 계산 (비피앤피 / 갑우문화사 실무 4종 산식) ──
  const bindingType = general.bindingType || '무선제본';
  const bindingDetailType = general.bindingDetailType || (
    bindingType.includes('2탑') ? '무선 2탑 제본' :
    bindingType.includes('날개') ? '무선날개제본' :
    bindingType.includes('책속책') ? '책속책제본' :
    bindingType.includes('중철') ? '중철제본' :
    bindingType.includes('양장') ? '양장제본' : '무선제본'
  );

  let bindingUnitPrice = 0;
  let bindingCost = 0;
  let bindingFormula = '';
  const wirelessBaseFee = general.bindingBaseFee !== undefined ? Number(general.bindingBaseFee) : (qty < 500 ? 100000 : 200000);

  const totalPages = coverCalc.pages + bodyCalc.pages +
    (supplementCalc ? supplementCalc.pages : 0) +
    (body2Calc ? body2Calc.pages : 0);

  if (general.printCategory === '포스터' || general.printCategory === '전단') {
    bindingUnitPrice = 0;
    bindingCost = 15000; // 재단비
    bindingFormula = '포스터/전단 재단 기본 15,000원';
  } else if (bindingDetailType === '무선 2탑 제본' || bindingType.includes('2탑')) {
    // [{(표지1+표지2)*2} + 본문1 + 본문2] × 0.8 + 130원 × 부수 + 기본료 200,000원
    const coef = Number(general.bindingCoefficient) || 0.8;
    const base = Number(general.bindingBasePrice) || 130;
    const cp1 = coverCalc.pages;
    const cp2 = Number(cover2.pages) || 4;
    const bp1 = bodyCalc.pages;
    const bp2 = Number(body2.pages) || 0;
    const calcPages = ((cp1 + cp2) * 2) + bp1 + bp2;
    bindingUnitPrice = parseFloat((calcPages * coef + base).toFixed(2));
    bindingCost = Math.round(bindingUnitPrice * qty + wirelessBaseFee);
    bindingFormula = `[{(표지${cp1}+해설표지${cp2})×2}+본문${bp1}+해설${bp2}]×${coef}+${base} = ${bindingUnitPrice}원/부 × ${qty.toLocaleString()}부 + 기본료 ${wirelessBaseFee.toLocaleString()}원`;
  } else if (bindingDetailType === '무선날개제본' || bindingType.includes('날개')) {
    // {(표지+광고)*2} + 본문 × 0.45 + 30원 × 부수 + 기본료 200,000원
    const coef = Number(general.bindingCoefficient) || 0.45;
    const base = Number(general.bindingBasePrice) || 30;
    const cp = coverCalc.pages;
    const adP = Number(ad.pages) || 2;
    const bp = bodyCalc.pages;
    const wingPart = (cp + adP) * 2;
    bindingUnitPrice = parseFloat((wingPart + (bp * coef) + base).toFixed(2));
    bindingCost = Math.round(bindingUnitPrice * qty + wirelessBaseFee);
    bindingFormula = `{(표지${cp}+광고${adP})×2}+본문${bp}×${coef}+${base} = ${bindingUnitPrice}원/부 × ${qty.toLocaleString()}부 + 기본료 ${wirelessBaseFee.toLocaleString()}원`;
  } else if (bindingDetailType === '책속책제본' || bindingType.includes('책속책')) {
    // [{(표지합)*2} + 본문 + 책속본문] × 0.35 + 35원 × 부수 + 기본료 200,000원
    const coef = Number(general.bindingCoefficient) || 0.35;
    const base = Number(general.bindingBasePrice) || 35;
    const cp1 = coverCalc.pages;
    const cp2 = Number(innerCover.pages) || 4;
    const bp1 = bodyCalc.pages;
    const bp2 = Number(innerBody.pages) || 0;
    const calcPages = ((cp1 + cp2) * 2) + bp1 + bp2;
    bindingUnitPrice = parseFloat((calcPages * coef + base).toFixed(2));
    bindingCost = Math.round(bindingUnitPrice * qty + wirelessBaseFee);
    bindingFormula = `[{(표지${cp1}+속표지${cp2})×2}+본문${bp1}+속본문${bp2}]×${coef}+${base} = ${bindingUnitPrice}원/부 × ${qty.toLocaleString()}부 + 기본료 ${wirelessBaseFee.toLocaleString()}원`;
  } else if (bindingDetailType.includes('중철') || bindingType.includes('중철')) {
    bindingUnitPrice = Math.max(70, Math.round(totalPages * 3.2));
    const saddleBaseFee = 40000;
    bindingCost = Math.round(bindingUnitPrice * qty + saddleBaseFee);
    bindingFormula = `중철: 총 ${totalPages}p × 부당 ${bindingUnitPrice}원 + 기본료 ${saddleBaseFee.toLocaleString()}원`;
  } else if (bindingDetailType.includes('양장') || bindingType.includes('양장') || bindingType.includes('하드커버')) {
    bindingUnitPrice = 2800 + Math.round(totalPages * 2);
    const hardcoverBaseFee = 200000;
    bindingCost = Math.round(bindingUnitPrice * qty + hardcoverBaseFee);
    bindingFormula = `양장: 부당 ${bindingUnitPrice}원 × ${qty.toLocaleString()}부 + 기본료 ${hardcoverBaseFee.toLocaleString()}원`;
  } else {
    // 일반 무선제본 (단본): [{(표지*2) + 본문} × 0.8 + 130원] × 부수 + 기본료 200,000원
    const coef = Number(general.bindingCoefficient) || 0.8;
    const base = Number(general.bindingBasePrice) || 130;
    const calcPages = (coverCalc.pages * 2) + bodyCalc.pages + (supplementCalc ? supplementCalc.pages : 0);
    bindingUnitPrice = parseFloat((calcPages * coef + base).toFixed(2));
    bindingCost = Math.round(bindingUnitPrice * qty + wirelessBaseFee);
    bindingFormula = `[{(표지${coverCalc.pages}×2)+본문${bodyCalc.pages}}×${coef}+${base}] = ${bindingUnitPrice}원/부 × ${qty.toLocaleString()}부 + 기본료 ${wirelessBaseFee.toLocaleString()}원`;
  }

  // 본문 100g 이상 또는 60g 이하 시 제본비 30% 할증
  if (body.paperWeight >= 100 || body.paperWeight <= 60) {
    bindingCost = Math.round(bindingCost * 1.3);
    bindingFormula += ' (지중할증 +30% 적용)';
  }

  // 댐지대 (출판사 정합비)
  const hasDamji = general.hasDamji || options.hasDamji || false;
  const damjiCost = hasDamji ? calculateDamjiCost(qty) : 0;

  // ── 3. 후가공비 계산 (비피앤피 / 갑우문화사 실제 단가 반영) ──
  // 표지 코팅
  let coatingCost = 0;
  let coatingFormula = '';
  const coatingType = options.coatingType || (options.hasCoating ? '무광코팅' : '없음');
  if (coatingType !== '없음') {
    let ratePerReam = 57000; // 4x6 무광 기본 57,000원
    if (coatingType.includes('유광')) {
      ratePerReam = paperCut.includes('국') ? 40000 : 48000;
    } else if (coatingType.includes('무광')) {
      ratePerReam = paperCut.includes('국') ? 46000 : 57000;
    } else if (coatingType.includes('UV') && !coatingType.includes('부분')) {
      ratePerReam = paperCut.includes('국') ? 33000 : 40530;
    } else if (coatingType.includes('부분UV')) {
      ratePerReam = paperCut.includes('국') ? 34000 : 42980;
    } else if (coatingType.includes('엠보')) {
      ratePerReam = paperCut.includes('국') ? 80000 : 100000;
    }
    coatingCost = Math.max(35000, Math.round(coverCalc.totalReams * ratePerReam));
    coatingFormula = `${coverCalc.totalReams.toFixed(2)}R × ${ratePerReam.toLocaleString()}원`;
  }

  // 박 가공 (홀박, 열박)
  const hasHoloFoil = options.hasHoloFoil || options.foilType === '홀박';
  const holoFoilCost = hasHoloFoil ? Math.round(qty * (Number(options.holoFoilUnitPrice) || 30)) : 0;

  const hasHotFoil = options.hasHotFoil || options.hasFoil || false;
  const hotFoilBasePrice = Number(options.hotFoilBasePrice) || 100000;
  const hotFoilUnitPrice = Number(options.hotFoilUnitPrice) || 0;
  const hotFoilCost = hasHotFoil ? Math.round(hotFoilBasePrice + (qty * hotFoilUnitPrice)) : 0;

  // 판대 (목형, 동판, 수지판)
  const hasDie = options.hasDiecut || options.hasDie || false; // 목형
  const dieCost = hasDie ? (Number(options.dieCost) || 200000) : 0;

  const hasCopper = options.hasCopper || false; // 동판
  const copperCost = hasCopper ? (Number(options.copperCost) || 35000) : 0;

  const hasResin = options.hasResin || false; // 수지판
  const resinCost = hasResin ? (Number(options.resinCost) || 60000) : 0;

  // 톰슨 가공 (도무송 타발: 26,000원/R)
  const hasThomson = options.hasThomson || false;
  const thomsonCost = hasThomson ? Math.max(30000, Math.round(coverCalc.totalReams * (Number(options.thomsonUnitPrice) || 26000))) : 0;

  // 에폭시 / 미니필라스
  const hasEpoxy = options.hasEpoxy || false;
  const epoxyCost = hasEpoxy ? Math.round(qty * (Number(options.epoxyUnitPrice) || 130)) : 0;

  const hasMinipillar = options.hasMinipillar || false;
  const minipillarCost = hasMinipillar ? Math.round(qty * (Number(options.minipillarUnitPrice) || 95)) : 0;

  const totalFinishingCost = coatingCost + holoFoilCost + hotFoilCost + dieCost + copperCost + resinCost + thomsonCost + epoxyCost + minipillarCost;

  // ── 4. 기타 및 운송비 (비피앤피 실제 기준) ──
  const deliveryCost = Number(extra.deliveryCost ?? 50000);
  const packagingCost = Number(extra.packagingCost ?? (Math.ceil(qty / 50) * 1000));
  const hasStickerMerge = options.hasStickerMerge || false;
  const stickerMergeCost = hasStickerMerge ? Math.round(qty * 10) : 0;
  const discountOrAdd = Number(extra.discountOrAdd || 0);

  // ── 5. 6대 공정 섹션별 명세 리스트 빌드 (PrintEstimate 구조) ──

  // 1) 기획/제판 (PREPRESS)
  const prepressItems = [
    {
      id: 'prepress_cover',
      name: '표지 CTP 출력',
      spec: `${coverCalc.signatures}대 × ${coverCalc.effectiveColors}도 (${coverCalc.totalPlates}판)`,
      quantity: coverCalc.totalPlates,
      unit: '판',
      unitPrice: coverCalc.ctpUnitPrice,
      amount: coverCalc.ctpCost,
      stdPrice: coverCalc.ctpStdUnitPrice,
      deviation: coverCalc.ctpDeviation,
      formula: `${coverCalc.signatures}대 × 1판 × ${coverCalc.effectiveColors}도 × ${coverCalc.ctpUnitPrice.toLocaleString()}원`,
    }
  ];

  if (bodyCalc.pages > 0) {
    prepressItems.push({
      id: 'prepress_body',
      name: '본문 CTP 출력',
      spec: `${bodyCalc.signatures}대 × ${bodyCalc.effectiveColors}도 (${bodyCalc.totalPlates}판)`,
      quantity: bodyCalc.totalPlates,
      unit: '판',
      unitPrice: bodyCalc.ctpUnitPrice,
      amount: bodyCalc.ctpCost,
      stdPrice: bodyCalc.ctpStdUnitPrice,
      deviation: bodyCalc.ctpDeviation,
      formula: `${bodyCalc.signatures}대 × 1판 × ${bodyCalc.effectiveColors}도 × ${bodyCalc.ctpUnitPrice.toLocaleString()}원`,
    });
  }

  if (supplementCalc && supplementCalc.pages > 0) {
    prepressItems.push({
      id: 'prepress_supp',
      name: '화보 CTP 출력',
      spec: `${supplementCalc.signatures}대 × ${supplementCalc.effectiveColors}도 (${supplementCalc.totalPlates}판)`,
      quantity: supplementCalc.totalPlates,
      unit: '판',
      unitPrice: supplementCalc.ctpUnitPrice,
      amount: supplementCalc.ctpCost,
      stdPrice: supplementCalc.ctpStdUnitPrice,
      deviation: supplementCalc.ctpDeviation,
      formula: `${supplementCalc.signatures}대 × 1판 × ${supplementCalc.effectiveColors}도 × ${supplementCalc.ctpUnitPrice.toLocaleString()}원`,
    });
  }

  if (body2Calc && body2Calc.pages > 0) {
    prepressItems.push({
      id: 'prepress_body2',
      name: '해설본문 CTP 출력',
      spec: `${body2Calc.signatures}대 × ${body2Calc.effectiveColors}도 (${body2Calc.totalPlates}판)`,
      quantity: body2Calc.totalPlates,
      unit: '판',
      unitPrice: body2Calc.ctpUnitPrice,
      amount: body2Calc.ctpCost,
      stdPrice: body2Calc.ctpStdUnitPrice,
      deviation: body2Calc.ctpDeviation,
      formula: `${body2Calc.signatures}대 × 1판 × ${body2Calc.effectiveColors}도 × ${body2Calc.ctpUnitPrice.toLocaleString()}원`,
    });
  }

  if (coverCalc.typesetCost > 0 || bodyCalc.typesetCost > 0) {
    const totalTypesetAmount = coverCalc.typesetCost + bodyCalc.typesetCost;
    prepressItems.push({
      id: 'prepress_typeset',
      name: '기획 조판 및 전자편집료',
      spec: `표지 ${cover.typesetPages || 0}p + 본문 ${body.typesetPages || 0}p`,
      quantity: 1,
      unit: '식',
      unitPrice: totalTypesetAmount,
      amount: totalTypesetAmount,
      stdPrice: totalTypesetAmount,
      deviation: 0,
      formula: '조판면수 × 면당단가 × 편집율',
    });
  }

  // 2) 인쇄 (PRINT)
  const printItems = [
    {
      id: 'print_cover',
      name: `표지 인쇄 (${cover.colorCount || 4}도 ${cover.isDoubleSided ? '양면' : '단면'})`,
      spec: `${coverCalc.totalReams.toFixed(2)}R (손지율 ${coverCalc.wasteRate}%)`,
      quantity: parseFloat(coverCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: Math.round(coverCalc.printCost / Math.max(0.01, coverCalc.totalReams)),
      amount: coverCalc.printCost,
      stdPrice: Math.round(coverCalc.printCost / Math.max(0.01, coverCalc.totalReams)),
      deviation: 0,
      formula: `${coverCalc.totalReams.toFixed(2)}R × 인쇄비`,
    }
  ];

  if (bodyCalc.pages > 0) {
    printItems.push({
      id: 'print_body',
      name: `본문 인쇄 (${body.colorCount || 1}도 ${body.isDoubleSided ? '양면' : '단면'})`,
      spec: `${bodyCalc.totalReams.toFixed(2)}R (손지율 ${bodyCalc.wasteRate}%)`,
      quantity: parseFloat(bodyCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: Math.round(bodyCalc.printCost / Math.max(0.01, bodyCalc.totalReams)),
      amount: bodyCalc.printCost,
      stdPrice: Math.round(bodyCalc.printCost / Math.max(0.01, bodyCalc.totalReams)),
      deviation: 0,
      formula: `${bodyCalc.totalReams.toFixed(2)}R × 인쇄비`,
    });
  }

  if (supplementCalc && supplementCalc.pages > 0) {
    printItems.push({
      id: 'print_supp',
      name: `화보 인쇄 (${supplement.colorCount || 4}도)`,
      spec: `${supplementCalc.totalReams.toFixed(2)}R`,
      quantity: parseFloat(supplementCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: Math.round(supplementCalc.printCost / Math.max(0.01, supplementCalc.totalReams)),
      amount: supplementCalc.printCost,
      stdPrice: Math.round(supplementCalc.printCost / Math.max(0.01, supplementCalc.totalReams)),
      deviation: 0,
      formula: `${supplementCalc.totalReams.toFixed(2)}R × 인쇄비`,
    });
  }

  if (body2Calc && body2Calc.pages > 0) {
    printItems.push({
      id: 'print_body2',
      name: `해설본문 인쇄 (${body2.colorCount || 1}도)`,
      spec: `${body2Calc.totalReams.toFixed(2)}R`,
      quantity: parseFloat(body2Calc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: Math.round(body2Calc.printCost / Math.max(0.01, body2Calc.totalReams)),
      amount: body2Calc.printCost,
      stdPrice: Math.round(body2Calc.printCost / Math.max(0.01, body2Calc.totalReams)),
      deviation: 0,
      formula: `${body2Calc.totalReams.toFixed(2)}R × 인쇄비`,
    });
  }

  // 3) 제본 (BINDING)
  const bindingItems = [
    {
      id: 'binding_main',
      name: `${bindingDetailType} (${general.bindingDirection || '좌철'})`,
      spec: `총 ${totalPages}p × ${qty.toLocaleString()}부`,
      quantity: qty,
      unit: '부',
      unitPrice: bindingUnitPrice,
      amount: bindingCost,
      stdPrice: bindingUnitPrice,
      deviation: 0,
      formula: bindingFormula,
    }
  ];

  if (hasDamji && damjiCost > 0) {
    bindingItems.push({
      id: 'binding_damji',
      name: '출판사 제본 댐지대 (정합비)',
      spec: `부수 ÷ 7.5 × 110원 (${Math.round(qty / 7.5).toLocaleString()}부 기준)`,
      quantity: Math.round(qty / 7.5),
      unit: '부',
      unitPrice: 110,
      amount: damjiCost,
      stdPrice: 110,
      deviation: 0,
      formula: `${qty.toLocaleString()}부 ÷ 7.5 × 110원 = ${damjiCost.toLocaleString()}원`,
    });
  }

  // 4) 후가공 (FINISHING)
  const finishingItems = [];
  if (coatingType !== '없음' && coatingCost > 0) {
    finishingItems.push({
      id: 'finish_coating',
      name: `표지 ${coatingType}`,
      spec: `${coverCalc.totalReams.toFixed(2)}R`,
      quantity: parseFloat(coverCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: Math.round(coatingCost / Math.max(0.01, coverCalc.totalReams)),
      amount: coatingCost,
      stdPrice: Math.round(coatingCost / Math.max(0.01, coverCalc.totalReams)),
      deviation: 0,
      formula: coatingFormula,
    });
  }
  if (hasHoloFoil && holoFoilCost > 0) {
    finishingItems.push({
      id: 'finish_holo_foil',
      name: '홀박 가공 (홀로그램박)',
      spec: `${qty.toLocaleString()}부 × 30원`,
      quantity: qty,
      unit: '부',
      unitPrice: Number(options.holoFoilUnitPrice) || 30,
      amount: holoFoilCost,
      stdPrice: 30,
      deviation: 0,
      formula: `${qty.toLocaleString()}부 × 30원 = ${holoFoilCost.toLocaleString()}원`,
    });
  }
  if (hasHotFoil && hotFoilCost > 0) {
    finishingItems.push({
      id: 'finish_hot_foil',
      name: '열박 가공 (금박/은박/먹박)',
      spec: `기본 ${hotFoilBasePrice.toLocaleString()}원 + 부당가`,
      quantity: 1,
      unit: '식',
      unitPrice: hotFoilCost,
      amount: hotFoilCost,
      stdPrice: hotFoilCost,
      deviation: 0,
      formula: `기본 ${hotFoilBasePrice.toLocaleString()}원 + (${qty}부 × ${hotFoilUnitPrice}원)`,
    });
  }
  if (hasDie && dieCost > 0) {
    finishingItems.push({
      id: 'finish_die',
      name: '톰슨 목형대 제작',
      spec: '타발 목형 1조',
      quantity: 1,
      unit: 'EA',
      unitPrice: dieCost,
      amount: dieCost,
      stdPrice: 200000,
      deviation: 0,
      formula: '목형 제작비 200,000원',
    });
  }
  if (hasCopper && copperCost > 0) {
    finishingItems.push({
      id: 'finish_copper',
      name: '형압 동판대 제작',
      spec: '양각/음각 동판',
      quantity: 1,
      unit: '개',
      unitPrice: copperCost,
      amount: copperCost,
      stdPrice: 35000,
      deviation: 0,
      formula: '동판 제작비 35,000원',
    });
  }
  if (hasResin && resinCost > 0) {
    finishingItems.push({
      id: 'finish_resin',
      name: '수지판대 제작',
      spec: '수지판 1EA',
      quantity: 1,
      unit: '개',
      unitPrice: resinCost,
      amount: resinCost,
      stdPrice: 60000,
      deviation: 0,
      formula: '수지판 제작비 60,000원',
    });
  }
  if (hasThomson && thomsonCost > 0) {
    finishingItems.push({
      id: 'finish_thomson',
      name: '톰슨(도무송) 타발 가공',
      spec: `${coverCalc.totalReams.toFixed(2)}R`,
      quantity: parseFloat(coverCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: Number(options.thomsonUnitPrice) || 26000,
      amount: thomsonCost,
      stdPrice: 26000,
      deviation: 0,
      formula: `${coverCalc.totalReams.toFixed(2)}R × 26,000원 = ${thomsonCost.toLocaleString()}원`,
    });
  }
  if (hasEpoxy && epoxyCost > 0) {
    finishingItems.push({
      id: 'finish_epoxy',
      name: '에폭시 입체 코팅',
      spec: `${qty.toLocaleString()}장 × 130원`,
      quantity: qty,
      unit: '장',
      unitPrice: Number(options.epoxyUnitPrice) || 130,
      amount: epoxyCost,
      stdPrice: 130,
      deviation: 0,
      formula: `${qty.toLocaleString()}장 × 130원 = ${epoxyCost.toLocaleString()}원`,
    });
  }
  if (hasMinipillar && minipillarCost > 0) {
    finishingItems.push({
      id: 'finish_minipillar',
      name: '미니필라스 후가공',
      spec: `${qty.toLocaleString()}장 × 95원`,
      quantity: qty,
      unit: '장',
      unitPrice: Number(options.minipillarUnitPrice) || 95,
      amount: minipillarCost,
      stdPrice: 95,
      deviation: 0,
      formula: `${qty.toLocaleString()}장 × 95원 = ${minipillarCost.toLocaleString()}원`,
    });
  }

  // 5) 용지대 (PAPER)
  const paperItems = [];
  if (includePaper) {
    paperItems.push({
      id: 'paper_cover',
      name: `표지 용지 (${cover.paperName || '아트지'} ${cover.paperWeight || 200}g)`,
      spec: `${coverCalc.totalReams.toFixed(2)}R`,
      quantity: parseFloat(coverCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: coverCalc.paperUnitPrice,
      amount: coverCalc.paperCost,
      stdPrice: coverCalc.paperUnitPrice,
      deviation: 0,
      formula: `${coverCalc.totalReams.toFixed(2)}R × ${coverCalc.paperUnitPrice.toLocaleString()}원`,
    });

    if (bodyCalc.pages > 0) {
      paperItems.push({
        id: 'paper_body',
        name: `본문 용지 (${body.paperName || '백상지'} ${body.paperWeight || 80}g)`,
        spec: `${bodyCalc.totalReams.toFixed(2)}R`,
        quantity: parseFloat(bodyCalc.totalReams.toFixed(2)),
        unit: 'R',
        unitPrice: bodyCalc.paperUnitPrice,
        amount: bodyCalc.paperCost,
        stdPrice: bodyCalc.paperUnitPrice,
        deviation: 0,
        formula: `${bodyCalc.totalReams.toFixed(2)}R × ${bodyCalc.paperUnitPrice.toLocaleString()}원`,
      });
    }

    if (supplementCalc && supplementCalc.pages > 0) {
      paperItems.push({
        id: 'paper_supp',
        name: `화보 용지 (${supplement.paperName || '스노우지'} ${supplement.paperWeight || 120}g)`,
        spec: `${supplementCalc.totalReams.toFixed(2)}R`,
        quantity: parseFloat(supplementCalc.totalReams.toFixed(2)),
        unit: 'R',
        unitPrice: supplementCalc.paperUnitPrice,
        amount: supplementCalc.paperCost,
        stdPrice: supplementCalc.paperUnitPrice,
        deviation: 0,
        formula: `${supplementCalc.totalReams.toFixed(2)}R × ${supplementCalc.paperUnitPrice.toLocaleString()}원`,
      });
    }
  } else {
    paperItems.push({
      id: 'paper_supplied',
      name: '용지대 (거래처 사급/입고)',
      spec: '거래처에서 직접 용지 입고 제공',
      quantity: 1,
      unit: '식',
      unitPrice: 0,
      amount: 0,
      stdPrice: 0,
      deviation: 0,
      formula: '거래처 입고(사급) 0원 처리',
    });
  }

  // 6) 기타 (OTHER)
  const otherItems = [];
  if (deliveryCost > 0) {
    otherItems.push({
      id: 'other_delivery',
      name: '물류/용달 납품 배송비',
      spec: '지정 장소 직납',
      quantity: 1,
      unit: '식',
      unitPrice: deliveryCost,
      amount: deliveryCost,
      stdPrice: deliveryCost,
      deviation: 0,
      formula: `납품 배송비 ${deliveryCost.toLocaleString()}원`,
    });
  }
  if (packagingCost > 0) {
    const boxCount = Math.ceil(qty / 50);
    otherItems.push({
      id: 'other_packaging',
      name: '밴딩 및 박스 포장비',
      spec: `${boxCount} BOX (박스당 1,000원)`,
      quantity: boxCount,
      unit: '박스',
      unitPrice: 1000,
      amount: packagingCost,
      stdPrice: 1000,
      deviation: 0,
      formula: `${boxCount}박스 × 1,000원 = ${packagingCost.toLocaleString()}원`,
    });
  }
  if (hasStickerMerge && stickerMergeCost > 0) {
    otherItems.push({
      id: 'other_sticker_merge',
      name: '스티커 정합대',
      spec: `${qty.toLocaleString()}부 × 10원`,
      quantity: qty,
      unit: '부',
      unitPrice: 10,
      amount: stickerMergeCost,
      stdPrice: 10,
      deviation: 0,
      formula: `${qty.toLocaleString()}부 × 10원 = ${stickerMergeCost.toLocaleString()}원`,
    });
  }
  if (discountOrAdd !== 0) {
    otherItems.push({
      id: 'other_discount',
      name: extra.discountReason || '조정 가감금액',
      spec: '합의 단가 조정',
      quantity: 1,
      unit: '식',
      unitPrice: discountOrAdd,
      amount: discountOrAdd,
      stdPrice: discountOrAdd,
      deviation: 0,
      formula: `가감조정 ${discountOrAdd.toLocaleString()}원`,
    });
  }

  // 7) 커스텀 추가 항목 분류 병합
  if (Array.isArray(customItems) && customItems.length > 0) {
    customItems.forEach(item => {
      const cat = (item.category || 'OTHER').toUpperCase();
      const targetItem = {
        id: item.id || `custom_${Date.now()}_${Math.random()}`,
        name: item.name || '추가 항목',
        spec: item.spec || '',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || '건',
        unitPrice: Number(item.unitPrice) || 0,
        amount: Number(item.amount) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)),
        stdPrice: Number(item.stdPrice) || Number(item.unitPrice) || 0,
        deviation: calculateDeviation(Number(item.unitPrice) || 0, Number(item.stdPrice) || Number(item.unitPrice) || 0),
        formula: `${Number(item.quantity) || 1}${item.unit || '건'} × ${(Number(item.unitPrice) || 0).toLocaleString()}원`,
        isCustom: true,
      };

      if (cat === 'PREPRESS') prepressItems.push(targetItem);
      else if (cat === 'PRINT') printItems.push(targetItem);
      else if (cat === 'BINDING') bindingItems.push(targetItem);
      else if (cat === 'FINISHING') finishingItems.push(targetItem);
      else if (cat === 'PAPER') paperItems.push(targetItem);
      else otherItems.push(targetItem);
    });
  }

  // ── 6. 각 섹션 소계 산출 ──
  const prepressTotal = prepressItems.reduce((sum, item) => sum + item.amount, 0);
  const printTotal = printItems.reduce((sum, item) => sum + item.amount, 0);
  const bindingTotal = bindingItems.reduce((sum, item) => sum + item.amount, 0);
  const finishingTotal = finishingItems.reduce((sum, item) => sum + item.amount, 0);
  const paperTotal = includePaper ? paperItems.reduce((sum, item) => sum + item.amount, 0) : 0;
  const otherTotal = otherItems.reduce((sum, item) => sum + item.amount, 0);

  const subtotal = prepressTotal + printTotal + bindingTotal + finishingTotal + paperTotal + otherTotal;
  const vat = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + vat;
  const perBookPrice = qty > 0 ? Math.round(totalAmount / qty) : 0;

  // 표준가 대비 총 마진율 분석
  const prepressStdTotal = prepressItems.reduce((sum, item) => sum + (item.stdPrice * item.quantity), 0);
  const totalStdBase = prepressStdTotal + printTotal + bindingTotal + finishingTotal + paperTotal + otherTotal;
  const overallMarginRate = totalStdBase > 0 ? Math.round(((subtotal - totalStdBase) / totalStdBase) * 100) : 0;

  // 전체 통합 품목 배열
  const allItems = [
    ...prepressItems.map(i => ({ ...i, category: 'PREPRESS', categoryTitle: '1. 기획/제판 (PREPRESS)' })),
    ...printItems.map(i => ({ ...i, category: 'PRINT', categoryTitle: '2. 인쇄 (PRINT)' })),
    ...bindingItems.map(i => ({ ...i, category: 'BINDING', categoryTitle: '3. 제본 (BINDING)' })),
    ...finishingItems.map(i => ({ ...i, category: 'FINISHING', categoryTitle: '4. 후가공 (FINISHING)' })),
    ...paperItems.map(i => ({ ...i, category: 'PAPER', categoryTitle: '5. 용지대 (PAPER)' })),
    ...otherItems.map(i => ({ ...i, category: 'OTHER', categoryTitle: '6. 기타 (OTHER)' })),
  ];

  return {
    quantity: qty,
    totalPages,
    includePaper,
    hasDamji,
    damjiCost,

    // 파트별 세부 연산 객체
    coverCalc,
    bodyCalc,
    supplementCalc,
    body2Calc,

    // 6대 섹션
    sections: {
      prepress: {
        title: '1. 기획/제판 (PREPRESS)',
        category: 'PREPRESS',
        items: prepressItems,
        total: prepressTotal,
      },
      print: {
        title: '2. 인쇄 (PRINT)',
        category: 'PRINT',
        items: printItems,
        total: printTotal,
      },
      binding: {
        title: '3. 제본 (BINDING)',
        category: 'BINDING',
        items: bindingItems,
        total: bindingTotal,
        formula: bindingFormula,
      },
      finishing: {
        title: '4. 후가공 (FINISHING)',
        category: 'FINISHING',
        items: finishingItems,
        total: finishingTotal,
      },
      paper: {
        title: '5. 용지대 (PAPER)',
        category: 'PAPER',
        items: paperItems,
        total: paperTotal,
      },
      other: {
        title: '6. 기타 (OTHER)',
        category: 'OTHER',
        items: otherItems,
        total: otherTotal,
      },
    },

    // 소계
    prepressTotal,
    printTotal,
    bindingTotal,
    finishingTotal,
    paperTotal,
    otherTotal,

    // 종합 금액
    subtotal,
    vat,
    totalAmount,
    perBookPrice,
    overallMarginRate,

    // 전체 품목 리스트
    allItems,

    // 이전 버전 호환 필드
    totalPaperCost: paperTotal,
    totalPrintCost: printTotal,
    totalCtpCost: prepressTotal,
    totalTypesetCost: coverCalc.typesetCost + bodyCalc.typesetCost,
    bindingCost,
    bindingUnitPrice,
    coatingCost,
    totalFinishingCost,
    deliveryCost,
    packagingCost,
    discountOrAdd,
  };
}
