// src/utils/printCalculators/bindingCalculator.js
/**
 * 제본비 계산기 (무선 / 중철 / 양장 / 스프링)
 */

import { DEFAULT_STD_PRICES } from './defaultMasterData';

export function calculateBinding({
  bindingType = '무선제본',
  coverPages = 4,
  bodyPages = 100,
  quantity = 1000,
  paperSize = '국배판', // A4
  coefficient = 0.8,
  basePrice = 130,      // 부당 기본단가
  baseFee = null,       // 제본 공정 기본료 (예: 200,000원)
  unitPrice = null,     // 부당 직접 입력 단가
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const totalPages = (Number(coverPages) || 4) + (Number(bodyPages) || 0);

  let amount = 0;
  let stdAmount = 0;
  let finalUnitPrice = 0;
  let formula = '';
  let effectiveBaseFee = baseFee !== null && baseFee !== undefined ? Number(baseFee) : (bindingType.includes('무선') ? DEFAULT_STD_PRICES.bindingBaseFee : 0);

  // 판형별 면당 표준가 조회
  const rates = DEFAULT_STD_PRICES.bindingRates[paperSize] || DEFAULT_STD_PRICES.bindingRates['국배판'];
  const stdPageRate = rates ? rates[0] : 1.5; // 무사무선철 기준 면당 단가

  if (unitPrice !== null && unitPrice !== undefined && unitPrice > 0) {
    // 직접 입력된 부당 단가
    finalUnitPrice = Number(unitPrice);
    amount = Math.round(finalUnitPrice * qty + effectiveBaseFee);
    stdAmount = Math.round(stdPageRate * totalPages * qty + effectiveBaseFee);
    formula = `${qty.toLocaleString()}부 × ${finalUnitPrice.toLocaleString()}원${effectiveBaseFee > 0 ? ` + 기본료 ${effectiveBaseFee.toLocaleString()}원` : ''}`;
  } else if (bindingType.includes('중철')) {
    // 중철: 1부당 80~150원 (페이지 수에 비례)
    const perBook = Math.max(60, Math.round(totalPages * 3.5));
    finalUnitPrice = perBook;
    effectiveBaseFee = effectiveBaseFee > 0 ? effectiveBaseFee : 50000;
    amount = Math.round(finalUnitPrice * qty + effectiveBaseFee);
    stdAmount = amount;
    formula = `중철: ${qty.toLocaleString()}부 × ${finalUnitPrice.toLocaleString()}원 + 기본 ${effectiveBaseFee.toLocaleString()}원`;
  } else if (bindingType.includes('양장') || bindingType.includes('하드커버')) {
    // 양장: 싸바리/하드커버 부당 2,500 ~ 4,000원
    const perBook = 3000 + Math.round(totalPages * 2);
    finalUnitPrice = perBook;
    effectiveBaseFee = effectiveBaseFee > 0 ? effectiveBaseFee : 150000;
    amount = Math.round(finalUnitPrice * qty + effectiveBaseFee);
    stdAmount = amount;
    formula = `양장: ${qty.toLocaleString()}부 × ${finalUnitPrice.toLocaleString()}원 + 기본 ${effectiveBaseFee.toLocaleString()}원`;
  } else {
    // 무선제본 공식: {(표지면수 * 2) + 본문면수} * 계수 + 기본단가
    const coef = Number(coefficient) || 0.8;
    const base = Number(basePrice) || 130;
    const calcPages = (Number(coverPages) * 2) + Number(bodyPages);
    finalUnitPrice = Math.round(calcPages * coef + base);
    amount = Math.round(finalUnitPrice * qty + effectiveBaseFee);
    stdAmount = Math.round(stdPageRate * totalPages * qty + effectiveBaseFee);
    formula = `[{(표지${coverPages}×2)+본문${bodyPages}}×${coef}+${base}] = 부당 ${finalUnitPrice}원 × ${qty.toLocaleString()}부 + 기본료 ${effectiveBaseFee.toLocaleString()}원`;
  }

  const marginRate = stdAmount > 0 ? Math.round(((amount - stdAmount) / stdAmount) * 100) : 0;

  return {
    bindingType,
    paperSize,
    totalPages,
    quantity: qty,
    unitPrice: finalUnitPrice,
    baseFee: effectiveBaseFee,
    amount,
    stdAmount,
    marginRate,
    formula,
  };
}
