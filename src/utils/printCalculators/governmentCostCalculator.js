// src/utils/printCalculators/governmentCostCalculator.js
/**
 * 조달청(Public Procurement Service) 공인 표준 인쇄원가 계산 엔진
 * 국가를 당사자로 하는 계약에 관한 법률 시행규칙 제6조(원가계산에 의한 예정가격의 결정) 준수
 * 
 * 14단계 법정 원가 산식:
 * 1. 용지비 (표지/본문/화보별 대수, 통수, 손지율 산식)
 * 2. 조판료 (전자조판 기본단가 × 조판면수 × 조판/편집율)
 * 3. 제판비 (대수 × 인쇄면수 × 색도수 = 판수 × 공인 판당 단가, 디지털인쇄는 0원)
 * 4. 인쇄료 (기준통수 × 통당단가 × 인쇄면수 × 지질/베다/특수색 할증)
 * 5. 제본료 (부수 × 면수(100면 기본) × 면당단가 × 박엽지 할증, 낱장/포스터는 0원)
 * 6. 기타가공비 (코팅, 박, 톰슨, 접지 등 실비)
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
  // 경인쇄(마스터인쇄) 고시 기준단가 (조달청/공공 표준)
  lightPrintRates: {
    base50: {
      '8절_백상지': 16750,
      '8절_중질지': 15270,
      '8절_신문용지': 15080,
      '10절_백상지': 12150,
      '16절_백상지': 8920,
      '16절_중질지': 8120,
      '16절_신문용지': 8070,
      '25절_백상지': 5580,
      '32절_백상지': 4190,
    },
    extra10: {
      '8절': 183,
      '10절': 157,
      '16절': 101,
      '25절': 80,
      '32절': 55,
    },
    typesetDiscount: {
      '8절': 4420,
      '10절': 3500,
      '16절': 2450,
      '25절': 1530,
      '32절': 1240,
    },
    coverSheets: {
      base8_10: 5,     // 8절/10절 기본 5매
      base16_32: 3,    // 16절 이하 기본 3매
      artPaper: 2.5,   // 아트지/레자크지 가산 2.5매
      extraColor: 2.5, // 1도 초과 추가 1색도당 2.5매
      coating: 5.0,    // 코팅 가산 5.0매
    },
  },
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
 * 기준통수 및 색도수에 따른 표준 손지율(%) 산정 (조달청 공인 기준)
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
export function getGovernmentPassUnitPrice(passes = 1000, customPassTable = null) {
  const p = Math.max(1000, Number(passes) || 1000);
  const table = Array.isArray(customPassTable) && customPassTable.length > 0 ? customPassTable : GOVERNMENT_STD_RATES.passUnitPrices;
  for (const row of table) {
    if (p <= row.limit) return row.price;
  }
  return 8.50;
}

/**
 * 조달청 기준 파트별(표지, 본문, 화보) 공공 표준원가 계산
 */
export function calculateGovernmentOffsetPart({
  name = '표지',
  quantity = 1000,
  paperCut = '국배판(A4)',
  pages = 4,
  blankPages = 0,
  typesetPages = 0,
  typesetRate = 0,
  typesetUnitPrice = null,
  colorCount = 4,
  isDoubleSided = true,
  paperUnitPrice = 94000,
  paperWeight = 200,
  isBetaPrint = false,
  isSpotColor = false,
  printType = '옵셋인쇄',
  masterRates = null,
}) {
  const master = masterRates || GOVERNMENT_STD_RATES;
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
      plateUnitPrice: 0,
      ctpCost: 0,
      passes: 0,
      basePasses: 0,
      passUnitPrice: 0,
      printCost: 0,
      totalCost: 0,
    };
  }

  const cuts = getGovernmentSheetCuts(paperCut);
  const isDigital = printType === '디지털인쇄';
  const isLightPrint = printType === '경인쇄' || printType === '마스터인쇄';

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

  // ⑤ 손지율(%) 계산 (디지털인쇄는 손지율 3% 고정)
  const wasteRate = isDigital ? 3.0 : getGovernmentWasteRate(basePasses, colorCount, isDoubleSided);
  const totalReams = parseFloat((netReams * (1 + wasteRate / 100)).toFixed(3));
  const wasteReams = parseFloat((totalReams - netReams).toFixed(3));

  // ⑥ 용지료 계산
  // 용지료 = 소요연수 × 연당단가
  const paperCost = Math.round(totalReams * (Number(paperUnitPrice) || 94000));

  // ⑦ 조판료 계산
  // {기본단가 × 조판면수} × (조판·편집율 %)
  const defaultTypesetPrice = name === '표지'
    ? (master.typesetUnitPrice?.cover || 25000)
    : (name === '화보' ? (master.typesetUnitPrice?.supplement || 20000) : (master.typesetUnitPrice?.body || 15390));
  const effectiveTypesetUnitPrice = Number(typesetUnitPrice) || defaultTypesetPrice;
  const tPages = Math.max(0, Number(typesetPages) || 0);
  const tRate = Math.max(0, Math.min(100, Number(typesetRate) || 0));
  const typesetCost = Math.round(effectiveTypesetUnitPrice * tPages * (tRate / 100));

  // ⑧ 인쇄판료(CTP) 계산
  // 판수 = 대수 × 인쇄면(단면 1 / 양면 2) × 색도수
  // ★ 중요: 디지털 인쇄는 무판 인쇄이므로 CTP 판수 = 0판, 비용 = 0원!
  const sides = isDoubleSided ? 2 : 1;
  let plates = 0;
  let plateUnitPrice = 0;
  let ctpCost = 0;

  if (isDigital) {
    plates = 0;
    plateUnitPrice = 0;
    ctpCost = 0;
  } else if (isLightPrint) {
    // 경인쇄는 마스터 페이퍼 제판비 (기본 2,500원)
    plates = Math.max(1, Math.round(signatures * sides * (colorCount || 1)));
    plateUnitPrice = master.platePrices?.['마스터'] || 2500;
    ctpCost = Math.round(plates * plateUnitPrice);
  } else {
    // 옵셋인쇄 CTP 판비
    plates = Math.max(1, Math.round(signatures * sides * colorCount));
    plateUnitPrice = cuts <= 8
      ? (master.platePrices?.['4×6 2절'] || 17500)
      : (master.platePrices?.['국2절'] || 17500);
    ctpCost = Math.round(plates * plateUnitPrice);
  }

  // ⑨ 인쇄료 계산
  let printCost = 0;
  let passUnitPrice = 0;
  let weightSurcharge = 1.0;
  let totalSurcharge = 1.0;

  if (isDigital) {
    // 디지털인쇄: 장당(페이지당) 출력비 (A4 기준 원색: 기본 120원, 단색: 기본 35원)
    const digitalUnitRate = colorCount >= 3
      ? (master.digitalUnitPrice?.color || 120)
      : (master.digitalUnitPrice?.mono || 35);
    passUnitPrice = digitalUnitRate;
    const totalPrintedSheets = (qty * printedPages) / 2;
    printCost = Math.round(totalPrintedSheets * digitalUnitRate);
  } else {
    passUnitPrice = getGovernmentPassUnitPrice(basePasses, master.passUnitPrices);
    // 지질할증: 150g/㎡ 이상 후지 30% 가산 (할증 1.3)
    weightSurcharge = Number(paperWeight) >= 150 ? 1.3 : 1.0;
    if (Number(paperWeight) <= 50) weightSurcharge = 1.3; // 박엽지 30% 할증

    // 경인쇄는 베다/특수색 할증 제외
    const betaSurcharge = (!isLightPrint && isBetaPrint) ? 1.6 : 1.0;
    const spotSurcharge = (!isLightPrint && isSpotColor) ? 2.0 : 1.0;
    totalSurcharge = weightSurcharge * betaSurcharge * spotSurcharge;

    printCost = Math.round(basePasses * (passUnitPrice * sides) * totalSurcharge);
  }

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
 * 경인쇄(마스터인쇄) 조달청 공공 표준 원가 산출 엔진
 * (조달청 및 공공기관 유인물 표준 인쇄원가 계산 기준 준수)
 */
export function calculateGovernmentLightPrint({
  quantity = 1000,
  paperCut = '국배판(A4)',
  cover = {},
  body = {},
  options = {},
  masterRates = null,
}) {
  const master = masterRates || GOVERNMENT_STD_RATES;
  const lightRates = master.lightPrintRates || GOVERNMENT_STD_RATES.lightPrintRates;
  const qty = Math.max(1, Number(quantity) || 1000);

  // 1. 절수 파악 (8절, 10절, 16절, 25절, 32절)
  let cutKey = '16절';
  if (paperCut.includes('8절') || paperCut.includes('A3') || paperCut.includes('B4') || paperCut.includes('타블로이드')) {
    cutKey = '8절';
  } else if (paperCut.includes('10절')) {
    cutKey = '10절';
  } else if (paperCut.includes('25절')) {
    cutKey = '25절';
  } else if (paperCut.includes('32절') || paperCut.includes('A5') || paperCut.includes('B6')) {
    cutKey = '32절';
  } else {
    cutKey = '16절';
  }

  // 2. 50부 초과 10부마다 스텝 계산
  const extraSteps = qty >= 50 ? Math.floor((qty - 50) / 10) : 0;

  // 3. 표지 요금 계산
  // - 표지는 8절 백상지 기준단가 및 10부당 단가 적용
  const coverBasePrice50 = Number(lightRates?.base50?.['8절_백상지']) || 16750;
  const coverExtra10Price = Number(lightRates?.extra10?.['8절']) || 183;

  // 표지 기본매수: 8절/10절 5매, 16절/25절/32절 3매
  const baseCoverSheets = (cutKey === '8절' || cutKey === '10절')
    ? Number(lightRates?.coverSheets?.base8_10 ?? 5)
    : Number(lightRates?.coverSheets?.base16_32 ?? 3);

  // 아트지/레자크지 가산 2.5매
  const coverPaper = cover.paperName || '아트지';
  const isArtOrLeather = coverPaper.includes('아트') || coverPaper.includes('스노우') || coverPaper.includes('랑데뷰') || coverPaper.includes('아르떼') || coverPaper.includes('레자크');
  const artSheets = isArtOrLeather ? Number(lightRates?.coverSheets?.artPaper ?? 2.5) : 0;

  // 색도 가산: 기본 1도 외 추가 1도당 2.5매
  const colorCount = Number(cover.colorCount) || (cover.color === '4도' ? 4 : cover.color === '2도' ? 2 : 1);
  const extraColors = Math.max(0, colorCount - 1);
  const extraColorSheets = extraColors * Number(lightRates?.coverSheets?.extraColor ?? 2.5);

  // 코팅 가산 5.0매
  const hasCoating = Boolean(options.hasCoating);
  const coatingSheets = hasCoating ? Number(lightRates?.coverSheets?.coating ?? 5.0) : 0;

  const extraSheets = artSheets + extraColorSheets + coatingSheets;
  const totalCoverSheets = baseCoverSheets + extraSheets;

  const cover50Cost = Math.round(coverBasePrice50 * totalCoverSheets);
  const cover10Cost = Math.round(coverExtra10Price * extraSteps * totalCoverSheets);
  const totalCoverCost = cover50Cost + cover10Cost;

  // 산출내역 설명 텍스트
  const extraParts = [];
  if (artSheets > 0) extraParts.push(`${artSheets}매(${coverPaper})`);
  if (extraColorSheets > 0) extraParts.push(`(${extraColors}색도×${lightRates?.coverSheets?.extraColor ?? 2.5}매)`);
  if (coatingSheets > 0) extraParts.push(`${coatingSheets}매(코팅)`);
  const extraSheetsDesc = extraParts.length > 0 ? extraParts.join('+') : '0매(추가없음)';

  // 4. 본문 요금 계산
  const bodyPaper = (body.paperName || '백상지').includes('신문') ? '신문용지' : (body.paperName || '').includes('중질') ? '중질지' : '백상지';
  const bodyKey = `${cutKey}_${bodyPaper}`;
  const bodyBasePrice50 = Number(lightRates?.base50?.[bodyKey]) || Number(lightRates?.base50?.[`${cutKey}_백상지`]) || (cutKey === '8절' ? 15370 : 8920);
  const bodyExtra10Price = Number(lightRates?.extra10?.[cutKey]) || (cutKey === '8절' ? 183 : 101);

  const bodyPages = Math.max(0, Number(body.pages) || 64);
  const body50Cost = Math.round(bodyBasePrice50 * bodyPages);
  const body10Cost = Math.round(bodyExtra10Price * extraSteps * bodyPages);
  const totalBodyCost = body50Cost + body10Cost;

  // 5. 기본사항 소계
  const basicTotal = totalCoverCost + totalBodyCost;

  // 6. 계산가감: 조판생략 감액
  // 사용자가 한글/PDF/디스켓 등 파일을 제공한 경우 조판생략 감액 적용 (기본값: true)
  const hasTypesetDiscount = options.hasTypesetDiscount ?? true;
  const unitDiscount = Number(lightRates?.typesetDiscount?.[cutKey]) || 2450;
  const typesetDiscountCost = hasTypesetDiscount ? Math.round(unitDiscount * bodyPages) : 0;
  const discountAmount = -typesetDiscountCost;

  // 7. 기타추가
  const extraCost = Number(options.extraCost || 0);

  // 8. 소계 (공급가액 = 1.기본사항 + 2.계산가감 + 3.기타추가)
  const subtotal = Math.max(0, basicTotal + discountAmount + extraCost);

  // 9. 부가가치세 (소계의 10%)
  const vat = Math.round(subtotal * 0.1);

  // 10. 합계 (예정가격 = 소계 + 부가세)
  const targetTotal = subtotal + vat;

  // 11. 계약금액 (천원단위 이하 절사)
  const contractAmount = Math.floor(targetTotal / 1000) * 1000;
  const perBookTargetPrice = Math.round(targetTotal / qty);
  const perBookContractPrice = Math.round(contractAmount / qty);

  return {
    isLightPrint: true,
    printType: '경인쇄',
    cutKey,
    qty,
    extraSteps,
    // 표지
    coverBasePrice50,
    coverExtra10Price,
    baseCoverSheets,
    artSheets,
    extraColorSheets,
    coatingSheets,
    extraSheets,
    totalCoverSheets,
    extraSheetsDesc,
    cover50Cost,
    cover10Cost,
    totalCoverCost,
    // 본문
    bodyPages,
    bodyPaper,
    bodyBasePrice50,
    bodyExtra10Price,
    body50Cost,
    body10Cost,
    totalBodyCost,
    // 기본사항 합계
    basicTotal,
    // 계산가감
    hasTypesetDiscount,
    unitDiscount,
    typesetDiscountCost,
    discountAmount,
    // 기타추가
    extraCost,
    // 총계
    subtotal,
    step11_supplyPrice: subtotal,
    vat,
    step12_vat: vat,
    targetTotal,
    step13_targetTotal: targetTotal,
    contractAmount,
    step14_contractAmount: contractAmount,
    perBookTargetPrice,
    perBookContractPrice,
  };
}

/**
 * 조달청 공공 표준 인쇄원가 종합 계산 (14단계 법정 산식)
 */
export function calculateGovernmentCost({
  general = {},
  cover = {},
  body = {},
  supplement = {},
  options = {},
  rates = {},
}) {
  const master = rates.masterRates || GOVERNMENT_STD_RATES;
  const qty = Math.max(1, Number(general.quantity) || 1000);
  const paperCut = general.paperCut || '국배판(A4)';
  const printType = general.printType || '옵셋인쇄'; // '옵셋인쇄' | '경인쇄' | '디지털인쇄'
  const printCategory = general.printCategory || '책자';
  const isLightPrint = printType === '경인쇄' || printType === '마스터인쇄';
  const isDigital = printType === '디지털인쇄';

  // 가산율 설정 (사용자 정의 또는 법정 기본값)
  const manageRate = Number(rates.manageRate ?? master.defaultManageRate ?? 5); // 기본 5%
  const profitRate = Number(rates.profitRate ?? master.defaultProfitRate ?? 10); // 기본 10%
  const contractRate = Number(rates.contractRate ?? master.defaultContractRate ?? 88); // 기본 88%

  // 인쇄물 종류에 따른 본문/화보 포함 여부 (리플렛, 포스터, 전단은 본문/화보 제외)
  const isSingleLeaf = printCategory === '리플렛' || printCategory === '포스터' || printCategory === '전단';

  // 1. 표지 (또는 리플렛/포스터 본체) 계산
  const coverCalc = calculateGovernmentOffsetPart({
    name: isSingleLeaf ? (printCategory === '리플렛' ? '리플렛' : '포스터/전단') : '표지',
    quantity: qty,
    paperCut,
    pages: cover.pages ?? (isSingleLeaf ? (printCategory === '리플렛' ? 6 : 1) : 4),
    blankPages: cover.blankPages || 0,
    typesetPages: cover.typesetPages ?? 1,
    typesetRate: cover.typesetRate ?? 0,
    typesetUnitPrice: cover.typesetUnitPrice || master.typesetUnitPrice?.cover || 25000,
    colorCount: cover.colorCount || 4,
    isDoubleSided: isSingleLeaf && printCategory === '포스터' ? false : (cover.isDoubleSided ?? (isSingleLeaf ? true : false)),
    paperUnitPrice: cover.paperUnitPrice || 94000,
    paperWeight: cover.paperWeight || (isSingleLeaf ? 150 : 200),
    isBetaPrint: isDigital ? false : (options.isBetaPrint || false),
    isSpotColor: isDigital ? false : (options.isSpotColor || false),
    printType,
    masterRates: master,
  });

  // 2. 본문 계산 (책자, 화보집만 적용)
  const bodyCalc = (!isSingleLeaf) ? calculateGovernmentOffsetPart({
    name: '본문',
    quantity: qty,
    paperCut,
    pages: body.pages ?? 64,
    blankPages: body.blankPages || 0,
    typesetPages: body.typesetPages ?? 0,
    typesetRate: body.typesetRate ?? 0,
    typesetUnitPrice: body.typesetUnitPrice || master.typesetUnitPrice?.body || 15390,
    colorCount: isLightPrint ? 1 : (body.colorCount || 1),
    isDoubleSided: body.isDoubleSided ?? true,
    paperUnitPrice: body.paperUnitPrice || 46136,
    paperWeight: body.paperWeight || 80,
    isBetaPrint: (isDigital || isLightPrint) ? false : (options.isBetaPrint || false),
    isSpotColor: (isDigital || isLightPrint) ? false : (options.isSpotColor || false),
    printType,
    masterRates: master,
  }) : {
    name: '본문',
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
    plateUnitPrice: 0,
    ctpCost: 0,
    passes: 0,
    basePasses: 0,
    passUnitPrice: 0,
    printCost: 0,
    totalCost: 0,
  };

  // ── 경인쇄(마스터인쇄) 전용 조달 공공 산식 분기 ──
  if (isLightPrint && !isSingleLeaf) {
    const light = calculateGovernmentLightPrint({
      quantity: qty,
      paperCut,
      cover: {
        paperName: cover.paperName || '아트지',
        colorCount: cover.colorCount || 4,
        color: cover.color || '4도',
      },
      body: {
        paperName: body.paperName || '백상지',
        pages: body.pages ?? 64,
      },
      options: {
        hasCoating: options.hasCoating,
        hasTypesetDiscount: options.hasTypesetDiscount,
        extraCost: options.extraCost,
      },
      masterRates: master,
    });

    const totalPages = (cover.pages ?? 4) + (body.pages ?? 64);

    return {
      quantity: qty,
      totalPages,
      printType: '경인쇄',
      bindingType: general.bindingType || '무사무선',
      paperCut,
      isLightPrint: true,
      lightReport: light,

      // 파트별 세부 데이터 (규격서 및 공통 표에서 참조)
      coverCalc,
      bodyCalc,
      supplementCalc: null,

      // 경인쇄 전용 요금 집계
      light_basicTotal: light.basicTotal,
      light_totalCoverCost: light.totalCoverCost,
      light_totalBodyCost: light.totalBodyCost,
      light_discountAmount: light.discountAmount,
      light_typesetDiscountCost: light.typesetDiscountCost,
      light_unitDiscount: light.unitDiscount,
      light_extraCost: light.extraCost,

      // 14단계 호환 필드 (총액 일치)
      step1_paperCost: 0,
      step2_typesetCost: 0,
      step3_ctpCost: 0,
      step4_printCost: light.basicTotal,
      step5_bindingCost: 0,
      step6_extraCost: light.discountAmount + light.extraCost,
      step7_subtotal: light.subtotal,
      step8_manageCost: 0,
      manageRate: 0,
      step9_manufacturingTotal: light.subtotal,
      step10_profitCost: 0,
      profitRate: 0,
      profitBase: 0,
      step11_supplyPrice: light.subtotal,
      step12_vat: light.vat,
      step13_targetTotal: light.targetTotal,
      step14_contractAmount: light.contractAmount,
      contractRate: 100,

      // 권당 단가
      perBookTargetPrice: light.perBookTargetPrice,
      perBookContractPrice: light.perBookContractPrice,
    };
  }

  // 3. 화보/부속 계산 (책자/화보집 옵션 시)
  let supplementCalc = null;
  if (!isSingleLeaf && !isLightPrint && options.hasSupplement && (Number(supplement.pages) || 0) > 0) {
    supplementCalc = calculateGovernmentOffsetPart({
      name: '화보',
      quantity: qty,
      paperCut,
      pages: supplement.pages || 8,
      blankPages: supplement.blankPages || 0,
      typesetPages: supplement.typesetPages ?? 0,
      typesetRate: supplement.typesetRate ?? 0,
      typesetUnitPrice: supplement.typesetUnitPrice || master.typesetUnitPrice?.supplement || 20000,
      colorCount: supplement.colorCount || 4,
      isDoubleSided: supplement.isDoubleSided ?? true,
      paperUnitPrice: supplement.paperUnitPrice || 75000,
      paperWeight: supplement.paperWeight || 120,
      isBetaPrint: isDigital ? false : (options.isBetaPrint || false),
      isSpotColor: isDigital ? false : (options.isSpotColor || false),
      printType,
      masterRates: master,
    });
  }

  // ── 1. 용지료 합계 ──
  const totalPaperCost = coverCalc.paperCost + bodyCalc.paperCost + (supplementCalc ? supplementCalc.paperCost : 0);

  // ── 2. 조판료 합계 ──
  const totalTypesetCost = coverCalc.typesetCost + bodyCalc.typesetCost + (supplementCalc ? supplementCalc.typesetCost : 0);

  // ── 3. 인쇄판료(CTP) 합계 (디지털인쇄는 0원) ──
  const totalCtpCost = isDigital ? 0 : (coverCalc.ctpCost + bodyCalc.ctpCost + (supplementCalc ? supplementCalc.ctpCost : 0));

  // ── 4. 인쇄료 합계 ──
  let totalPrintCost = 0;
  if (isLightPrint && !isSingleLeaf) {
    // 경인쇄 표준 산식
    const extraColors = ((cover.colorCount || 4) - 1) * 2.5;
    const cover50Cost = Math.round(13240 * (3 + Math.max(0, extraColors)));
    const coverAddSteps = Math.max(0, Math.ceil((qty - 50) / 10));
    const coverAddCost = Math.round(coverAddSteps * 170 * 3);
    const lightCoverCost = cover50Cost + coverAddCost;

    const bodyHalfPages = Math.ceil((body.pages ?? 64) / 2);
    const body50Cost = Math.round(bodyHalfPages * 6800);
    const bodyAddCost = Math.round(coverAddSteps * 90 * bodyHalfPages);
    const lightBodyCost = body50Cost + bodyAddCost;

    totalPrintCost = lightCoverCost + lightBodyCost;
  } else {
    totalPrintCost = coverCalc.printCost + bodyCalc.printCost + (supplementCalc ? supplementCalc.printCost : 0);
  }

  // ── 5. 제본료 계산 ──
  const totalPages = coverCalc.pages + bodyCalc.pages + (supplementCalc ? supplementCalc.pages : 0);
  const bindingType = general.bindingType || '무사무선';
  let bindingCost = 0;
  let bindingUnitRate = master.bindingUnitPrice?.perfect || 0.825; // 0.825원

  if (printCategory === '포스터' || printCategory === '전단') {
    // 포스터 및 전단: 제본 없음, 기본 재단비만 적용
    bindingCost = master.finishingUnitPrice?.cutSingle || 15000;
  } else if (printCategory === '리플렛') {
    // 리플렛: 접지 형태별 가공비
    const foldType = general.foldType || '3단 접지';
    const fold2Rate = master.finishingUnitPrice?.fold2 || 12;
    const fold3Rate = master.finishingUnitPrice?.fold3 || 18;
    const fold4Rate = master.finishingUnitPrice?.fold4 || 24;
    const foldGateRate = master.finishingUnitPrice?.foldGate || 30;
    const foldBaseFee = master.finishingUnitPrice?.foldBase || 25000;

    const foldRate = foldType.includes('4단') ? fold4Rate : foldType.includes('2단') ? fold2Rate : foldType.includes('대문') || foldType.includes('병풍') ? foldGateRate : fold3Rate;
    bindingCost = Math.max(foldBaseFee, Math.round(qty * foldRate));
  } else if (bindingType.includes('중철')) {
    bindingUnitRate = master.bindingUnitPrice?.saddle || 0.650;
    const calcPages = Math.max(16, totalPages);
    bindingCost = Math.round(qty * calcPages * bindingUnitRate);
  } else if (bindingType.includes('양장')) {
    const hardcoverRate = master.bindingUnitPrice?.hardcover || 3.500;
    bindingCost = Math.round(qty * (totalPages * 0.825 + 2500));
  } else if (bindingType.includes('스프링')) {
    bindingCost = Math.round(qty * (master.bindingUnitPrice?.spring || 850));
  } else {
    // 무사무선철: 부수 × 면수(100면 이하는 100면으로 계산) × 면당단가 × 할증율
    const calcPages = Math.max(100, totalPages);
    const bodyWeight = Number(body.paperWeight) || 80;
    const thinSurcharge = bodyWeight <= 50 ? 1.3 : 1.0;
    bindingCost = Math.round(qty * calcPages * bindingUnitRate * thinSurcharge);
  }

  // ── 6. 기타추가 (코팅, 박, 톰슨 등) ──
  let coatingCost = 0;
  if (options.hasCoating) {
    const isGloss = (options.coatingType || '').includes('유광');
    const coatingRate = isGloss
      ? (master.finishingUnitPrice?.glossLami || 42000)
      : (master.finishingUnitPrice?.matteLami || 48000);
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
