// src/utils/printCalculators/governmentCostCalculator.js
/**
 * 조달청 및 전라남도교육청(print.jne.go.kr) 공인 표준 인쇄원가 계산 엔진
 * 국가를 당사자로 하는 계약에 관한 법률 시행규칙 제6조(원가계산에 의한 예정가격의 결정) 준수
 * 
 * 14단계 법정 원가 산식:
 * 1. 용지비 (표지/본문/화보별 대수, 통수, 손지율 산식)
 * 2. 조판료 (전자조판 기본단가 × 조판면수 × 조판/편집율)
 * 3. 제판비 (대수 × 인쇄면수 × 색도수 = 판수 × 공인 판당 단가)
 * 4. 인쇄료 (기준통수 × 통당단가 × 인쇄면수 × 지질/베다/특수색 할증)
 * 5. 제본료 (부수 × 면수(100면 기본) × 면당단가 × 박엽지 할증)
 * 6. 기타가공비 (코팅, 박, 톰슨 등 실비)
 * 7. 소계 (순제조원가 = 1+2+3+4+5+6)
 * 8. 일반관리비 (순제조원가의 5% ~ 6%, 최대 14% 한도)
 * 9. 계 (소계 + 일반관리비)
 * 10. 이윤 (★법정산식: 용지대를 제외한 (계 - 용지비)의 10%, 최대 25% 한도)
 * 11. 공급가액 (계 + 이윤)
 * 12. 부가가치세 (공급가액의 10%)
 * 13. 합계 (예정가격 = 공급가액 + 부가가치세)
 * 14. 계약금액 / 낙찰금액 (합계 × 낙찰하한율 88%, 천원 단위 이하 절사)
 */

export const GOVERNMENT_STD_RATES = {
  // CTP 판비 (조달청 공인 단가)
  platePrices: {
    '국2절': 17500,
    '4×6 2절': 17500,
    '국4절': 12500,
    '4×6 4절': 12500,
    '마스터': 2500,
  },
  // 조판료 (면당 기본단가)
  typesetUnitPrice: {
    cover: 25000,
    body: 15390,
    supplement: 20000,
  },
  // 통수별 통당 인쇄 기본단가 (국2절/4×6 2절 매엽기 기준, 1도 기준)
  passUnitPrices: [
    { limit: 1000, price: 14.71 },
    { limit: 2000, price: 13.50 },
    { limit: 3000, price: 12.20 },
    { limit: 5000, price: 11.00 },
    { limit: 10000, price: 9.80 },
    { limit: 99999999, price: 8.50 },
  ],
  // 제본단가 (무사무선 면당 기준단가)
  bindingUnitPrice: {
    perfect: 0.825, // 무사무선 면당
    saddle: 0.650,  // 중철 면당
    hardcover: 3.500,// 양장 면당
    spring: 850,    // 스프링 부당
  },
  // 공공 법정 가산율 기본값
  defaultManageRate: 5,   // 일반관리비율 5% (최대 14%)
  defaultProfitRate: 10,  // 이윤율 10% (최대 25%)
  defaultContractRate: 88,// 낙찰하한율/사정율 88%
};

/**
 * 절수별 전지 1매당 절수 (절수)
 */
export function getGovernmentSheetCuts(cutName = '국배판(A4)') {
  if (cutName.includes('8절') || cutName.includes('A3')) return 8;
  if (cutName.includes('16절') || cutName.includes('A4') || cutName.includes('B5') || cutName.includes('배판') || cutName.includes('국판')) return 16;
  if (cutName.includes('32절') || cutName.includes('A5') || cutName.includes('B6')) return 32;
  if (cutName.includes('4절')) return 4;
  if (cutName.includes('2절')) return 2;
  return 16;
}

/**
 * 기준통수 및 색도수에 따른 표준 손지율(%) 산정 (전남교육청 기준)
 */
export function getGovernmentWasteRate(passCount, colorCount = 4, isDoubleSided = true) {
  const passes = Math.max(1000, Number(passCount) || 1000);
  const colors = Number(colorCount) || 4;
  const isDouble = Boolean(isDoubleSided);

  if (passes <= 1000) {
    if (colors === 1) return isDouble ? 7.0 : 5.0;
    if (colors === 2) return isDouble ? 9.0 : 7.0;
    if (colors === 3) return isDouble ? 11.0 : 9.0;
    if (colors >= 4) return isDouble ? 14.0 : 12.0;
  } else if (passes <= 2000) {
    if (colors === 1) return isDouble ? 5.5 : 4.0;
    if (colors === 2) return isDouble ? 7.0 : 5.5;
    if (colors === 3) return isDouble ? 8.5 : 7.0;
    if (colors >= 4) return isDouble ? 11.0 : 9.5;
  } else if (passes <= 5000) {
    if (colors === 1) return isDouble ? 4.5 : 3.0;
    if (colors === 2) return isDouble ? 5.5 : 4.0;
    if (colors === 3) return isDouble ? 6.5 : 5.0;
    if (colors >= 4) return isDouble ? 8.5 : 7.0;
  } else {
    // 5000통 초과
    if (colors === 1) return isDouble ? 3.5 : 2.5;
    if (colors === 2) return isDouble ? 4.5 : 3.5;
    if (colors === 3) return isDouble ? 5.5 : 4.5;
    if (colors >= 4) return isDouble ? 7.0 : 6.0;
  }
  return 10.0;
}

/**
 * 기준통수에 따른 통당 단가 반환
 */
export function getGovernmentPassUnitPrice(passes = 1000) {
  const p = Math.max(1000, Number(passes) || 1000);
  for (const row of GOVERNMENT_STD_RATES.passUnitPrices) {
    if (p <= row.limit) return row.price;
  }
  return 8.50;
}

/**
 * 옵셋인쇄 - 파트별(표지, 본문, 화보) 공공 표준원가 계산
 */
export function calculateGovernmentOffsetPart({
  name = '표지',
  quantity = 1000,
  paperCut = '국배판(A4)',
  pages = 4,
  blankPages = 0,
  typesetPages = 0,
  typesetRate = 0,
  typesetUnitPrice = 15390,
  colorCount = 4,
  isDoubleSided = true,
  paperUnitPrice = 94000,
  paperWeight = 200,
  isBetaPrint = false,
  isSpotColor = false,
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const actualPages = Math.max(0, Number(pages) || 0);
  const printedPages = Math.max(0, actualPages - (Number(blankPages) || 0));

  if (actualPages === 0) {
    return {
      name,
      pages: 0,
      printedPages: 0,
      cuts: 16,
      signatures: 0,
      netReams: 0,
      wasteRate: 0,
      wasteReams: 0,
      totalReams: 0,
      paperCost: 0,
      typesetCost: 0,
      plates: 0,
      ctpCost: 0,
      passes: 0,
      basePasses: 0,
      passUnitPrice: 0,
      printCost: 0,
      totalCost: 0,
    };
  }

  const cuts = getGovernmentSheetCuts(paperCut);

  // ① 소요량(연수) 계산
  // 소요량 = {부수 × (면수 / 장당 2면)} / {500매 × 절수}
  const netReams = parseFloat(((qty * (actualPages / 2)) / (500 * cuts)).toFixed(4));

  // ② 대수(Signatures) 계산
  // 대수 = {총면수 / (전지절수 × 대당 2면)} × 2절지 (1대 미만은 1대로 올림)
  let rawSignatures = (actualPages / (cuts * 2)) * 2;
  const signatures = Math.max(1, Math.ceil(rawSignatures));

  // ③ 통수(Passes) 계산
  // 통수 = 소요량(연) × 500매 × 2절
  const passes = Math.round(netReams * 500 * 2);

  // ④ 기준통수 계산
  // 기준통수 = 통수 / 대수 (1,000통 미만은 1,000통으로 계산)
  const basePasses = Math.max(1000, Math.round(passes / signatures));

  // ⑤ 손지율(%) 계산
  const wasteRate = getGovernmentWasteRate(basePasses, colorCount, isDoubleSided);
  const totalReams = parseFloat((netReams * (1 + wasteRate / 100)).toFixed(3));
  const wasteReams = parseFloat((totalReams - netReams).toFixed(3));

  // ⑥ 용지료 계산
  // 용지료 = 소요연수 × 연당단가
  const paperCost = Math.round(totalReams * (Number(paperUnitPrice) || 94000));

  // ⑦ 조판료 계산
  // {기본단가 × 조판면수} × (조판·편집율 %)
  const tPages = Math.max(0, Number(typesetPages) || 0);
  const tRate = Math.max(0, Math.min(100, Number(typesetRate) || 0));
  const typesetCost = Math.round((Number(typesetUnitPrice) || 15390) * tPages * (tRate / 100));

  // ⑧ 인쇄판료(CTP) 계산
  // 판수 = 대수 × 인쇄면(단면 1 / 양면 2) × 색도수
  const sides = isDoubleSided ? 2 : 1;
  const plates = Math.max(1, Math.round(signatures * sides * colorCount));
  const plateUnitPrice = cuts <= 8 ? GOVERNMENT_STD_RATES.platePrices['4×6 2절'] : GOVERNMENT_STD_RATES.platePrices['국2절'];
  const ctpCost = Math.round(plates * plateUnitPrice);

  // ⑨ 인쇄료 계산
  // 기준통수 × {통당단가 × 인쇄면(단면 1 / 양면 2)} × 할증율
  const passUnitPrice = getGovernmentPassUnitPrice(basePasses);
  
  // 지질할증: 150g/㎡ 이상 후지 30% 가산 (할증 1.3)
  let weightSurcharge = Number(paperWeight) >= 150 ? 1.3 : 1.0;
  if (Number(paperWeight) <= 50) weightSurcharge = 1.3; // 박엽지 30% 할증

  // 베다할증(솔리드 바탕) 60% 가산 (1.6)
  const betaSurcharge = isBetaPrint ? 1.6 : 1.0;
  // 특수별색 100% 가산 (2.0)
  const spotSurcharge = isSpotColor ? 2.0 : 1.0;
  const totalSurcharge = weightSurcharge * betaSurcharge * spotSurcharge;

  const printCost = Math.round(basePasses * (passUnitPrice * sides) * totalSurcharge);

  const totalCost = paperCost + typesetCost + ctpCost + printCost;

  return {
    name,
    pages: actualPages,
    printedPages,
    cuts,
    signatures,
    netReams,
    wasteRate,
    wasteReams,
    totalReams,
    paperCost,
    typesetCost,
    typesetPages: tPages,
    typesetRate: tRate,
    typesetUnitPrice,
    plates,
    plateUnitPrice,
    ctpCost,
    passes,
    basePasses,
    passUnitPrice,
    sides,
    weightSurcharge,
    totalSurcharge,
    printCost,
    totalCost,
  };
}

/**
 * 조달청 및 교육청 표준 인쇄원가 종합 계산 (14단계 법정 산식)
 */
export function calculateGovernmentCost({
  general = {},
  cover = {},
  body = {},
  supplement = {},
  options = {},
  rates = {},
}) {
  const qty = Math.max(1, Number(general.quantity) || 1000);
  const paperCut = general.paperCut || '국배판(A4)';
  const printType = general.printType || '옵셋인쇄'; // '옵셋인쇄' | '경인쇄' | '마스터인쇄'
  const isLightPrint = printType === '경인쇄' || printType === '마스터인쇄';

  // 가산율 설정 (사용자 정의 또는 법정 기본값)
  const manageRate = Number(rates.manageRate ?? GOVERNMENT_STD_RATES.defaultManageRate); // 기본 5%
  const profitRate = Number(rates.profitRate ?? GOVERNMENT_STD_RATES.defaultProfitRate); // 기본 10%
  const contractRate = Number(rates.contractRate ?? GOVERNMENT_STD_RATES.defaultContractRate); // 기본 88%

  // 1. 표지 계산
  const coverCalc = calculateGovernmentOffsetPart({
    name: '표지',
    quantity: qty,
    paperCut,
    pages: cover.pages ?? 4,
    blankPages: cover.blankPages || 0,
    typesetPages: cover.typesetPages ?? 1,
    typesetRate: cover.typesetRate ?? 0,
    typesetUnitPrice: cover.typesetUnitPrice || GOVERNMENT_STD_RATES.typesetUnitPrice.cover,
    colorCount: cover.colorCount || 4,
    isDoubleSided: cover.isDoubleSided ?? false,
    paperUnitPrice: cover.paperUnitPrice || 94000,
    paperWeight: cover.paperWeight || 200,
    isBetaPrint: options.isBetaPrint || false,
    isSpotColor: options.isSpotColor || false,
  });

  // 2. 본문 계산
  const bodyCalc = calculateGovernmentOffsetPart({
    name: '본문',
    quantity: qty,
    paperCut,
    pages: body.pages ?? 64,
    blankPages: body.blankPages || 0,
    typesetPages: body.typesetPages ?? 0,
    typesetRate: body.typesetRate ?? 0,
    typesetUnitPrice: body.typesetUnitPrice || GOVERNMENT_STD_RATES.typesetUnitPrice.body,
    colorCount: body.colorCount || 1,
    isDoubleSided: body.isDoubleSided ?? true,
    paperUnitPrice: body.paperUnitPrice || 46136,
    paperWeight: body.paperWeight || 80,
    isBetaPrint: options.isBetaPrint || false,
    isSpotColor: options.isSpotColor || false,
  });

  // 3. 화보/부속 계산 (옵션 시)
  let supplementCalc = null;
  if (options.hasSupplement && (Number(supplement.pages) || 0) > 0) {
    supplementCalc = calculateGovernmentOffsetPart({
      name: '화보',
      quantity: qty,
      paperCut,
      pages: supplement.pages || 8,
      blankPages: supplement.blankPages || 0,
      typesetPages: supplement.typesetPages ?? 0,
      typesetRate: supplement.typesetRate ?? 0,
      typesetUnitPrice: supplement.typesetUnitPrice || GOVERNMENT_STD_RATES.typesetUnitPrice.supplement,
      colorCount: supplement.colorCount || 4,
      isDoubleSided: supplement.isDoubleSided ?? true,
      paperUnitPrice: supplement.paperUnitPrice || 75000,
      paperWeight: supplement.paperWeight || 120,
      isBetaPrint: options.isBetaPrint || false,
      isSpotColor: options.isSpotColor || false,
    });
  }

  // ── 1. 용지료 합계 ──
  const totalPaperCost = coverCalc.paperCost + bodyCalc.paperCost + (supplementCalc ? supplementCalc.paperCost : 0);

  // ── 2. 조판료 합계 ──
  const totalTypesetCost = coverCalc.typesetCost + bodyCalc.typesetCost + (supplementCalc ? supplementCalc.typesetCost : 0);

  // ── 3. 인쇄판료(CTP) 합계 ──
  const totalCtpCost = coverCalc.ctpCost + bodyCalc.ctpCost + (supplementCalc ? supplementCalc.ctpCost : 0);

  // ── 4. 인쇄료 합계 ──
  let totalPrintCost = 0;
  if (isLightPrint) {
    // 경인쇄 표준 산식 (jne.go.kr 기준)
    // 표지: 50부까지 기본 13,240원 × {3매 + 추가색도(4색도×2.5매)} = 205,220원 + 10부마다 170원×3매
    const extraColors = (cover.colorCount || 4) * 2.5;
    const cover50Cost = Math.round(13240 * (3 + extraColors));
    const coverAddSteps = Math.max(0, Math.ceil((qty - 50) / 10));
    const coverAddCost = Math.round(coverAddSteps * 170 * 3);
    const lightCoverCost = cover50Cost + coverAddCost;

    // 본문: 면당 50부까지 6,800원 + 10부마다 90원
    const bodyHalfPages = Math.ceil((body.pages ?? 64) / 2);
    const body50Cost = Math.round(bodyHalfPages * 6800);
    const bodyAddCost = Math.round(coverAddSteps * 90 * bodyHalfPages);
    const lightBodyCost = body50Cost + bodyAddCost;

    totalPrintCost = lightCoverCost + lightBodyCost;
  } else {
    totalPrintCost = coverCalc.printCost + bodyCalc.printCost + (supplementCalc ? supplementCalc.printCost : 0);
  }

  // ── 5. 제본료 계산 (무사무선 표준 기준) ──
  const totalPages = coverCalc.pages + bodyCalc.pages + (supplementCalc ? supplementCalc.pages : 0);
  const bindingType = general.bindingType || '무사무선';
  let bindingCost = 0;
  let bindingUnitRate = GOVERNMENT_STD_RATES.bindingUnitPrice.perfect; // 0.825원

  if (general.printCategory === '포스터' || general.printCategory === '전단') {
    bindingCost = 15000;
  } else if (bindingType.includes('중철')) {
    bindingUnitRate = GOVERNMENT_STD_RATES.bindingUnitPrice.saddle;
    const calcPages = Math.max(16, totalPages);
    bindingCost = Math.round(qty * calcPages * bindingUnitRate);
  } else if (bindingType.includes('양장')) {
    bindingCost = Math.round(qty * (totalPages * 0.825 + 2500));
  } else if (bindingType.includes('스프링')) {
    bindingCost = Math.round(qty * GOVERNMENT_STD_RATES.bindingUnitPrice.spring);
  } else {
    // 무사무선철: 부수 × 면수(100면 이하는 100면으로 계산) × 0.825원 × 할증율
    const calcPages = Math.max(100, totalPages);
    const bodyWeight = Number(body.paperWeight) || 80;
    const thinSurcharge = bodyWeight <= 50 ? 1.3 : 1.0;
    bindingCost = Math.round(qty * calcPages * bindingUnitRate * thinSurcharge);
  }

  // ── 6. 기타추가 (코팅, 박, 톰슨 등) ──
  let coatingCost = 0;
  if (options.hasCoating) {
    const coatingRate = (options.coatingType || '').includes('유광') ? 42000 : 48000;
    coatingCost = Math.round(coverCalc.totalReams * coatingRate);
  }
  const foilCost = options.hasFoil ? (Number(options.foilCost) || 120000) : 0;
  const diecutCost = options.hasDiecut ? (Number(options.diecutCost) || 200000) : 0;
  const totalExtraCost = coatingCost + foilCost + diecutCost;

  // ── 7. 소계 (순제조원가) = 1 + 2 + 3 + 4 + 5 + 6 ──
  const subtotal = totalPaperCost + totalTypesetCost + totalCtpCost + totalPrintCost + bindingCost + totalExtraCost;

  // ── 8. 일반관리비 = 7 × 일반관리비율(5%) (최대 14% 한도) ──
  const generalManageCost = Math.round(subtotal * (manageRate / 100));

  // ── 9. 계 = 7 + 8 ──
  const manufacturingTotal = subtotal + generalManageCost;

  // ── 10. 이윤 = (9 - 1) × 이윤율(10%) ──
  // ★ 국가계약법 시행규칙 제6조: 용지비(재료비)를 공제한 순가공비 + 일반관리비에 대해서만 이윤 적용!
  const profitBase = Math.max(0, manufacturingTotal - totalPaperCost);
  const profitCost = Math.round(profitBase * (profitRate / 100));

  // ── 11. 공급가액 = 9 + 10 ──
  const supplyPrice = manufacturingTotal + profitCost;

  // ── 12. 부가가치세 = 11 × 10% ──
  const vat = Math.round(supplyPrice * 0.1);

  // ── 13. 합계 (예정가격) = 11 + 12 ──
  const targetTotal = supplyPrice + vat;

  // ── 14. 계약금액 / 낙찰금액 = 13 × 낙찰하한율(88%) (천원단위 이하 절사) ──
  const rawContractAmount = targetTotal * (contractRate / 100);
  const contractAmount = Math.floor(rawContractAmount / 1000) * 1000;

  // 권당 단가
  const perBookTargetPrice = qty > 0 ? Math.round(targetTotal / qty) : 0;
  const perBookContractPrice = qty > 0 ? Math.round(contractAmount / qty) : 0;

  return {
    quantity: qty,
    totalPages,
    printType,
    bindingType,
    paperCut,

    // 파트별 세부 데이터
    coverCalc,
    bodyCalc,
    supplementCalc,

    // 14단계 법정 원가 집계
    step1_paperCost: totalPaperCost,
    step2_typesetCost: totalTypesetCost,
    step3_ctpCost: totalCtpCost,
    step4_printCost: totalPrintCost,
    step5_bindingCost: bindingCost,
    step6_extraCost: totalExtraCost,
    step7_subtotal: subtotal,               // 순제조원가
    step8_manageCost: generalManageCost,    // 일반관리비
    manageRate,
    step9_manufacturingTotal: manufacturingTotal, // 계
    step10_profitCost: profitCost,          // 이윤
    profitRate,
    profitBase,                             // 이윤 산정기준액 (계 - 용지료)
    step11_supplyPrice: supplyPrice,        // 공급가액
    step12_vat: vat,                        // 부가가치세
    step13_targetTotal: targetTotal,        // 합계금액 (예정가격)
    step14_contractAmount: contractAmount,  // 계약금액 (낙찰하한율 적용 및 천원단위 절사)
    contractRate,

    // 단가
    perBookTargetPrice,
    perBookContractPrice,

    // 기타 비용 상세
    coatingCost,
    foilCost,
    diecutCost,
  };
}
