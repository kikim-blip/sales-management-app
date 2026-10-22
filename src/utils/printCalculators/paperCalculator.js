// src/utils/printCalculators/paperCalculator.js
/**
 * 용지대 계산기
 * 부수, 페이지수, 절수(국전/4×6), 손지율 기반 소요 연수(R) 및 용지 금액 산출
 */

import { DEFAULT_PAPERS } from './defaultMasterData';

/**
 * 소요 연수 계산
 * 1연 = 전지 500매
 * 전지 1매에서 나오는 페이지 수 = 절수 × 2 (양면)
 * 정미 연수 = (부수 × 페이지수) / (절수 × 2 × 500)
 * 총 소요 연수 = 정미 연수 × (1 + 손지율/100)
 */
export function calculatePaperReam({
  quantity = 1000,
  pages = 16,
  cutDivision = 16, // 16절, 8절, 4절, 2절, 전지(1)
  wasteRate = 10,   // 손지율 (%)
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const pgs = Math.max(1, Number(pages) || 1);
  const cuts = Math.max(1, Number(cutDivision) || 16);
  const waste = Math.max(0, Number(wasteRate) || 0);

  // 전지 1매당 페이지 수 (양면 인쇄 기준)
  const pagesPerFullSheet = cuts * 2;
  // 정미 전지 매수
  const netSheets = (qty * pgs) / pagesPerFullSheet;
  // 정미 연수
  const netReams = netSheets / 500;
  // 손지 포함 총 연수
  const totalReams = netReams * (1 + waste / 100);

  return {
    netSheets: Math.ceil(netSheets),
    netReams: parseFloat(netReams.toFixed(3)),
    totalReams: parseFloat(totalReams.toFixed(3)),
    wasteReams: parseFloat((totalReams - netReams).toFixed(3)),
  };
}

/**
 * 용지 비용 계산
 */
export function calculatePaperCost({
  paperId = null,
  paperName = '스노우지',
  weight = 100,
  sizeName = '국전지',
  reams = 1,
  unitPrice = null,
  quantity = 1000,
  pages = 16,
  cutDivision = 16,
  wasteRate = 10,
  autoCalcReams = true,
}) {
  // 기본 용지 단가 매칭
  let matchedPaper = null;
  if (paperId) {
    matchedPaper = DEFAULT_PAPERS.find(p => p.id === paperId);
  }
  if (!matchedPaper) {
    matchedPaper = DEFAULT_PAPERS.find(p => p.name === paperName && p.weight === Number(weight) && p.sizeName === sizeName) || DEFAULT_PAPERS[0];
  }

  const pricePerReam = unitPrice !== null && unitPrice !== undefined ? Number(unitPrice) : (matchedPaper?.unitPrice || 50000);

  let finalReams = Number(reams) || 1;
  let reamDetail = null;

  if (autoCalcReams) {
    reamDetail = calculatePaperReam({ quantity, pages, cutDivision, wasteRate });
    finalReams = reamDetail.totalReams;
  }

  const amount = Math.round(finalReams * pricePerReam);

  return {
    paperName: matchedPaper?.name || paperName,
    weight: matchedPaper?.weight || weight,
    sizeName: matchedPaper?.sizeName || sizeName,
    unitPrice: pricePerReam,
    reams: finalReams,
    amount,
    reamDetail,
    formula: `${finalReams.toFixed(2)}R × ${pricePerReam.toLocaleString()}원 = ${amount.toLocaleString()}원`,
  };
}
