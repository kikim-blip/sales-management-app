// src/utils/printCalculators/prepressCalculator.js
/**
 * 제판비 (CTP) 계산기
 * 공식: 비용 = 대수 × 판수 × 색도 × 판당 단가
 * 예: 17대 × 1판 × 8도 × 6,500원 = 884,000원
 */

import { DEFAULT_STD_PRICES } from './defaultMasterData';

export function calculatePrepress({
  plateCount = 1,       // 대수
  platePerForm = 1,     // 대당 판수 (보통 1)
  colorCount = 4,       // 도수 (단면 4도, 양면 8도 등)
  unitPrice = null,     // 판당 단가 (null 시 기본값)
  specKey = 'CTP_COMMON',
}) {
  const stdInfo = DEFAULT_STD_PRICES.ctp[specKey] || DEFAULT_STD_PRICES.ctp['CTP_COMMON'];
  const stdPrice = stdInfo.unitPrice;
  const price = unitPrice !== null && unitPrice !== undefined ? Number(unitPrice) : stdPrice;

  const totalPlates = Math.max(0, Number(plateCount) || 0) * Math.max(1, Number(platePerForm) || 1) * Math.max(1, Number(colorCount) || 1);
  const amount = Math.round(totalPlates * price);
  const stdAmount = Math.round(totalPlates * stdPrice);

  const marginRate = stdPrice > 0 ? Math.round(((price - stdPrice) / stdPrice) * 100) : 0;
  const formula = `${plateCount}대 × ${platePerForm}판 × ${colorCount}도 × ${price.toLocaleString()}원`;

  return {
    plateCount,
    platePerForm,
    colorCount,
    totalPlates,
    unitPrice: price,
    stdPrice,
    amount,
    stdAmount,
    marginRate,
    formula,
  };
}

/**
 * 표지 / 본문 / 간지 등 파트별 합산 제판비 계산
 */
export function calculatePrepressGroup(parts = [], defaultUnitPrice = 6500) {
  let totalPlates = 0;
  let totalAmount = 0;
  let totalStdAmount = 0;
  const formulas = [];

  parts.forEach(p => {
    if (!p.active && p.active !== undefined) return;
    const res = calculatePrepress({
      plateCount: p.plateCount || 1,
      platePerForm: p.platePerForm || 1,
      colorCount: p.colorCount || 4,
      unitPrice: p.unitPrice ?? defaultUnitPrice,
      specKey: p.specKey || 'CTP_COMMON',
    });
    totalPlates += res.totalPlates;
    totalAmount += res.amount;
    totalStdAmount += res.stdAmount;
    if (p.name) {
      formulas.push(`${p.name}: ${res.formula} = ${res.amount.toLocaleString()}원`);
    }
  });

  return {
    totalPlates,
    amount: totalAmount,
    stdAmount: totalStdAmount,
    marginRate: totalStdAmount > 0 ? Math.round(((totalAmount - totalStdAmount) / totalStdAmount) * 100) : 0,
    formulaList: formulas,
  };
}
