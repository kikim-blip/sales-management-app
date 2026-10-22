// src/utils/printCalculators/finishingCalculator.js
/**
 * 후가공비 계산기 (코팅, 박, 톰슨, 에폭시, 접지, 오시 등)
 */

import { DEFAULT_STD_PRICES } from './defaultMasterData';

export function calculateFinishingItem({
  type = '무광코팅_국전지',
  quantity = 1,
  unitPrice = null,
  baseFee = 0,
}) {
  const stdInfo = DEFAULT_STD_PRICES.finishing[type] || {
    name: type,
    unitPrice: 50000,
    unit: '건',
    stdPrice: 50000,
  };

  const stdPrice = stdInfo.stdPrice || stdInfo.unitPrice;
  const price = unitPrice !== null && unitPrice !== undefined ? Number(unitPrice) : stdInfo.unitPrice;
  const qty = Number(quantity) || 1;
  const base = Number(baseFee) || 0;

  const amount = Math.round(price * qty + base);
  const stdAmount = Math.round(stdPrice * qty + base);
  const marginRate = stdAmount > 0 ? Math.round(((amount - stdAmount) / stdAmount) * 100) : 0;

  return {
    type,
    name: stdInfo.name,
    unit: stdInfo.unit,
    quantity: qty,
    unitPrice: price,
    stdPrice,
    baseFee: base,
    amount,
    stdAmount,
    marginRate,
    formula: `${qty.toLocaleString()}${stdInfo.unit} × ${price.toLocaleString()}원${base > 0 ? ` + 기본 ${base.toLocaleString()}원` : ''}`,
  };
}

export function calculateFinishingGroup(items = []) {
  let totalAmount = 0;
  let totalStdAmount = 0;
  const processedItems = [];

  items.forEach(item => {
    if (!item.enabled && item.enabled !== undefined) return;
    const res = calculateFinishingItem(item);
    totalAmount += res.amount;
    totalStdAmount += res.stdAmount;
    processedItems.push(res);
  });

  return {
    items: processedItems,
    amount: totalAmount,
    stdAmount: totalStdAmount,
    marginRate: totalStdAmount > 0 ? Math.round(((totalAmount - totalStdAmount) / totalStdAmount) * 100) : 0,
  };
}
