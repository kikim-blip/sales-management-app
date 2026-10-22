// src/utils/printCalculators/printCalculator.js
/**
 * 인쇄비 계산기 (오프셋 / 윤전 / 디지털)
 * 연수(R) 및 통수 기반 색도별 표준 단가 및 손지율 적용
 */

import { DEFAULT_STD_PRICES } from './defaultMasterData';

export function getPrintStandardRate(quantity, colorCount = 4) {
  const rates = DEFAULT_STD_PRICES.offsetRates;
  let tierKey = 'max';

  if (quantity <= 1000) tierKey = '1000';
  else if (quantity <= 2000) tierKey = '2000';
  else if (quantity <= 3000) tierKey = '3000';
  else if (quantity <= 5000) tierKey = '5000';
  else if (quantity <= 7000) tierKey = '7000';
  else if (quantity <= 10000) tierKey = '10000';
  else if (quantity <= 13000) tierKey = '13000';

  const row = rates[tierKey] || rates['max'];
  const colorIndex = Math.min(Math.max(1, colorCount), 4) - 1;
  return row[colorIndex] || row[0];
}

export function getWasteRate(quantity, colorCount = 4) {
  const waste = DEFAULT_STD_PRICES.wasteRates;
  let tierKey = 'max';

  if (quantity <= 1000) tierKey = '1000';
  else if (quantity <= 3000) tierKey = '3000';
  else if (quantity <= 5000) tierKey = '5000';
  else if (quantity <= 10000) tierKey = '10000';

  const row = waste[tierKey] || waste['max'];
  const colorIndex = Math.min(Math.max(1, colorCount), 4) - 1;
  return row[colorIndex] || row[0];
}

/**
 * 인쇄비 계산
 * @param {Object} params
 * @param {number} params.reamCount - 소요 연수 (R)
 * @param {number} params.colorCount - 색도 (1도 ~ 8도)
 * @param {number} params.quantity - 부수
 * @param {number} params.unitPrice - 연당 또는 통당 적용 단가
 * @param {string} params.calcMode - 'ream' (연당 단가 계산) 또는 'pass' (통당 단가 계산)
 */
export function calculatePrint({
  reamCount = 1,
  colorCount = 4,
  quantity = 1000,
  unitPrice = null,
  calcMode = 'ream', // 'ream' or 'pass'
  paperSize = '국전',
}) {
  const r = Math.max(0, Number(reamCount) || 0);
  const colors = Math.max(1, Number(colorCount) || 1);
  const qty = Math.max(1, Number(quantity) || 1);

  // 표준 통당 단가 (1통 = 1면 1회 인쇄)
  const stdPassRate = getPrintStandardRate(qty, Math.min(colors, 4));
  // 1연 = 500매 = 500통 (2절 기준)
  const stdReamPrice = Math.round(stdPassRate * 500);

  let price = unitPrice !== null && unitPrice !== undefined ? Number(unitPrice) : (calcMode === 'pass' ? stdPassRate : stdReamPrice);
  let amount = 0;
  let stdAmount = 0;
  let formula = '';

  if (calcMode === 'pass') {
    const totalPasses = Math.round(r * 500 * (colors > 4 ? 2 : 1));
    amount = Math.round(totalPasses * price);
    stdAmount = Math.round(totalPasses * stdPassRate);
    formula = `${r.toFixed(2)}R × 500통 × ${price.toLocaleString()}원`;
  } else {
    // 연당 인쇄비 계산: 연수 × 연당단가 × 색도계수(도수/4)
    const factor = colors <= 4 ? 1 : 2; // 양면인 경우 2배
    amount = Math.round(r * price * factor);
    stdAmount = Math.round(r * stdReamPrice * factor);
    formula = `${r.toFixed(2)}R × ${price.toLocaleString()}원${factor > 1 ? ' (양면 ×2)' : ''}`;
  }

  const marginRate = stdAmount > 0 ? Math.round(((amount - stdAmount) / stdAmount) * 100) : 0;

  return {
    reamCount: r,
    colorCount: colors,
    quantity: qty,
    calcMode,
    unitPrice: price,
    stdPrice: calcMode === 'pass' ? stdPassRate : stdReamPrice,
    amount,
    stdAmount,
    marginRate,
    formula,
    wasteRate: getWasteRate(qty, Math.min(colors, 4)),
  };
}
