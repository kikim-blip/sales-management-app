// src/utils/quoteCalculations.js
// 견적서 및 비교견적서 금액/단가 자동 계산 유틸리티
import { COMPANY_SUPPLIERS } from '../data/companySuppliers.js';

// 숫자를 한글 금액 표기(일백삼십이만 원정)로 변환
export function numberToKoreanWon(num) {
  if (!num || isNaN(num) || num === 0) return '영';
  const units = ['', '만', '억', '조'];
  const smallUnits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const digitUnits = ['', '십', '백', '천'];

  let result = '';
  let unitIndex = 0;
  let n = Math.floor(Math.abs(num));

  while (n > 0) {
    const chunk = n % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      let temp = chunk;
      for (let i = 0; i < 4; i++) {
        const digit = temp % 10;
        if (digit > 0) {
          chunkStr = smallUnits[digit] + digitUnits[i] + chunkStr;
        }
        temp = Math.floor(temp / 10);
      }
      result = chunkStr + units[unitIndex] + ' ' + result;
    }
    unitIndex++;
    n = Math.floor(n / 10000);
  }

  return result.trim();
}

/**
 * 💡 메인 발행사(baseSupplierId) 기준 특정 공급사의 상대 할증률 산출
 * - 메인 발행사 본인: 1.0 (0% 할증, 기준 금액 100% 원본 유지)
 * - 비교사: 해당 업체의 고유 할증률 적용
 *   (단, 경성문화사(id:1)가 비교사일 경우, 메인 업체의 원래 할증률 또는 기본 1.08 적용)
 */
export function getRelativeSupplierRate(supplierId, baseSupplierId = 1) {
  const sId = Number(supplierId);
  const bId = Number(baseSupplierId || 1);

  if (sId === bId) return 1.0;

  const target = COMPANY_SUPPLIERS.find((s) => s.id === sId);
  const base = COMPANY_SUPPLIERS.find((s) => s.id === bId);

  if (sId === 1) {
    // 경성문화사가 비교견적사로 참여하는 경우 메인 업체의 원래 할증률(예: 케이에스센세이션 1.08)을 부여
    return (base && base.rate && base.rate > 1.0) ? base.rate : 1.08;
  }

  return target?.rate || 1.08;
}

/**
 * 특정 공급사(회사) 기준으로 품목 및 합계 계산 (공급가액 절사 완벽 지원)
 * @param {Array} rawItems 원본 품목 목록 (당사 기준)
 * @param {Object} supplier 회사 정보 ({ id, rate, ... })
 * @param {String} estimateType 'print' | 'general'
 * @param {Object} quote 저장된 견적서/매출 객체 (절사 정보 포함)
 * @param {Number|null} baseSupplierId 메인 발행사 ID (선택된 공급사, 기본값 quote.supplier_id || 1)
 */
export function calculateSupplierQuote(rawItems, supplier, estimateType = 'print', quote = null, baseSupplierId = null) {
  if (!supplier) return { items: [], rawSupplyPrice: 0, supplyPrice: 0, taxPrice: 0, totalPrice: 0 };

  const effectiveBaseId = baseSupplierId !== null && baseSupplierId !== undefined
    ? Number(baseSupplierId)
    : Number(quote?.supplier_id || 1);

  const isBaseCompany = Number(supplier.id) === effectiveBaseId;
  const effectiveRate = isBaseCompany ? 1.0 : getRelativeSupplierRate(supplier.id, effectiveBaseId);

  let totalRawSupplyPrice = 0;

  const items = (rawItems || []).map((it) => {
    const pages = it.pages !== undefined && it.pages !== '' && !isNaN(Number(it.pages)) && Number(it.pages) > 0
      ? Number(it.pages)
      : 0;
    const quantity = Number(it.quantity) || 1;
    const baseUnitPrice = Number(it.unit_price) || 0;

    // 100원 단위 반올림: ROUND(단가 * 할증률, -2)
    const unitPrice = isBaseCompany
      ? baseUnitPrice
      : (it[`unit_price_${supplier.id}`] !== undefined
          ? Number(it[`unit_price_${supplier.id}`])
          : Math.round((baseUnitPrice * effectiveRate) / 100) * 100);

    // 금액 계산: 페이지가 있으면 (페이지 * 부수 * 단가) 또는 (부수 * 단가)
    const amount = (estimateType === 'print' && pages > 0)
      ? pages * quantity * unitPrice
      : quantity * unitPrice;

    totalRawSupplyPrice += amount;

    return {
      ...it,
      pages,
      quantity,
      unit_price: unitPrice,
      amount,
    };
  });

  // 💡 공급가액 절사(만/천/백/십 단위) 계산
  let finalSupplyPrice = totalRawSupplyPrice;

  if (isBaseCompany && quote && quote.supply_price !== undefined && Number(quote.supply_price) > 0) {
    // 메인 발행사 건이고 저장된 공급가액이 있는 경우 최우선 반영
    finalSupplyPrice = Number(quote.supply_price);
  } else if (isBaseCompany && quote && quote.discount_unit === 'custom' && quote.custom_supply_price) {
    finalSupplyPrice = Number(quote.custom_supply_price) || totalRawSupplyPrice;
  } else if (quote && quote.discount_unit && Number(quote.discount_unit) > 0) {
    const unit = Number(quote.discount_unit);
    finalSupplyPrice = Math.floor(totalRawSupplyPrice / unit) * unit;
  }

  const taxPrice = Math.round(finalSupplyPrice * 0.1);
  const totalPrice = finalSupplyPrice + taxPrice;

  return {
    items,
    rawSupplyPrice: totalRawSupplyPrice,
    supplyPrice: finalSupplyPrice,
    discountAmount: totalRawSupplyPrice - finalSupplyPrice,
    taxPrice,
    totalPrice,
    koreanTotalPrice: numberToKoreanWon(totalPrice),
    rate: effectiveRate,
    isBaseCompany,
  };
}

/**
 * 종합비교대조표용 7개사 전체 견적 집계 (메인 발행사 1번 행 배치 및 상대 비교)
 */
export function calculateComparativeSummary(rawItems, suppliers, estimateType = 'print', quote = null, baseSupplierId = null) {
  const effectiveBaseId = baseSupplierId !== null && baseSupplierId !== undefined
    ? Number(baseSupplierId)
    : Number(quote?.supplier_id || 1);

  const supplierList = suppliers && suppliers.length > 0 ? suppliers : COMPANY_SUPPLIERS;
  const mainSupplier = supplierList.find((s) => s.id === effectiveBaseId) || supplierList[0];
  const baseCalc = calculateSupplierQuote(rawItems, mainSupplier, estimateType, quote, effectiveBaseId);
  const baseTotal = baseCalc.totalPrice;

  // 메인 발행사를 1번 행(Row)으로 정렬하고, 나머지 공급사를 뒤에 배치
  const sortedSuppliers = [
    mainSupplier,
    ...supplierList.filter((s) => s.id !== effectiveBaseId),
  ].filter(Boolean);

  return sortedSuppliers.map((sup) => {
    const isBase = sup.id === effectiveBaseId;
    const calc = isBase ? baseCalc : calculateSupplierQuote(rawItems, sup, estimateType, quote, effectiveBaseId);
    const diff = calc.totalPrice - baseTotal;
    const ratio = baseTotal > 0 ? (calc.totalPrice / baseTotal) : 1;

    return {
      supplier: sup,
      isBase,
      rawSupplyPrice: calc.rawSupplyPrice,
      supplyPrice: calc.supplyPrice,
      taxPrice: calc.taxPrice,
      totalPrice: calc.totalPrice,
      discountAmount: calc.discountAmount,
      diff,
      ratio,
      koreanTotalPrice: calc.koreanTotalPrice,
      items: calc.items,
      rate: calc.rate,
    };
  });
}
