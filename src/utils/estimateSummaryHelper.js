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

/**
 * 💡 LocalStorage 가비지 컬렉션(GC):
 * 생성/수정 후 14일(기본값)이 경과한 오래된 견적 드래프트(estimate_draft_*)를 자동 삭제합니다.
 */
export function cleanExpiredEstimateDrafts(maxDays = 14) {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  const now = Date.now();
  const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('estimate_draft_')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) {
            keysToRemove.push(key);
            continue;
          }
          const draft = JSON.parse(raw);
          const timestamp = Number(draft.updatedAt || draft.savedAt || draft.createdAt || 0);
          if (!timestamp || (now - timestamp > maxAgeMs)) {
            keysToRemove.push(key);
          }
        } catch (_) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((k) => {
      localStorage.removeItem(k);
      deletedCount++;
    });

    if (deletedCount > 0) {
      console.log(`[LocalStorage GC] 14일 경과 만료 드래프트 ${deletedCount}건 자동 정리 완료.`);
    }
  } catch (e) {
    console.warn('드래프트 GC 실행 중 오류:', e);
  }
  return deletedCount;
}
