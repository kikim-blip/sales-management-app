// src/utils/estimateSummaryHelper.js
/**
 * 견적 품목 배열을 AppSheet / 구글 시트 및 단일 셀에 최적화된
 * 사람이 읽기 쉬운 요약 문자열(summary_text)로 변환합니다.
 * 예: "내지(출력/칼라) A4 128p 10부 외 1건"
 */
export function generateEstimateSummary(items, defaultTitle = '') {
  if (!items) return defaultTitle;
  let list = items;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch (_) {
      return defaultTitle;
    }
  }
  if (!Array.isArray(list) || list.length === 0) return defaultTitle;

  const first = list[0];
  const name = first.name || defaultTitle || '작업 품목';
  const spec = first.spec ? ` ${first.spec}` : '';
  const pages = (first.pages !== '' && !isNaN(Number(first.pages)) && Number(first.pages) > 0) ? ` ${first.pages}p` : '';
  const qty = (first.quantity !== '' && !isNaN(Number(first.quantity)) && Number(first.quantity) > 0)
    ? ` ${Number(first.quantity).toLocaleString()}${first.unit || '부'}`
    : '';

  const firstSummary = `${name}${spec}${pages}${qty}`.trim();

  if (list.length === 1) return firstSummary;
  return `${firstSummary} 외 ${list.length - 1}건`;
}

/**
 * AppSheet 및 구글 시트 단일 셀에 보관할 수 있도록
 * 견적 품목 배열을 안전한 JSON 문자열로 직렬화합니다.
 */
export function serializeEstimateItemsForSheet(items) {
  if (!items) return '[]';
  if (typeof items === 'string') {
    try {
      JSON.parse(items);
      return items;
    } catch (_) {
      return '[]';
    }
  }
  if (!Array.isArray(items)) return '[]';
  return JSON.stringify(items);
}

/**
 * 구글 시트 / D1 / LocalStorage로부터 넘어온 데이터를 견적 품목 배열로 안전하게 역직렬화합니다.
 */
export function deserializeEstimateItems(val, fallbackTitle = '') {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (_) {}
  }
  return [];
}
