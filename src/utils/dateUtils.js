// src/utils/dateUtils.js

/**
 * 로컬 타임존(한국 표준시 등) 기준의 'YYYY-MM-DD' 문자열을 반환합니다.
 * toISOString()의 UTC 시차로 인해 오전 9시 이전에 전날로 표기되는 문제를 완벽 방지합니다.
 */
export function getLocalDateStr(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 납품 예정일(YYYY-MM-DD)과 오늘 날짜 간의 D-Day를 순수 일자(자정 기준)로 정확히 계산합니다.
 */
export function calculateDDay(deliveryDateStr, baseDateStr = null) {
  if (!deliveryDateStr) {
    return { diffDays: 999, label: '일정미정', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }

  const targetDatePart = String(deliveryDateStr).trim().substring(0, 10);
  const todayDatePart = baseDateStr || getLocalDateStr();

  const [tY, tM, tD] = targetDatePart.split('-').map(Number);
  const [nY, nM, nD] = todayDatePart.split('-').map(Number);

  if (!tY || !tM || !tD) {
    return { diffDays: 999, label: '일정미정', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }

  const targetUtc = Date.UTC(tY, tM - 1, tD);
  const nowUtc = Date.UTC(nY, nM - 1, nD);
  const diffDays = Math.round((targetUtc - nowUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { diffDays, label: `⚠️ 납품 지연 (D+${Math.abs(diffDays)})`, color: 'bg-rose-600 text-white border-rose-700 animate-pulse' };
  }
  if (diffDays === 0) {
    return { diffDays, label: '🚨 오늘 납품 (D-DAY)', color: 'bg-rose-500 text-white border-rose-600 font-black animate-bounce' };
  }
  if (diffDays === 1) {
    return { diffDays, label: '⚡ 내일 납품 (D-1)', color: 'bg-amber-500 text-white border-amber-600 font-bold' };
  }
  if (diffDays <= 3) {
    return { diffDays, label: `🔥 긴급 임박 (D-${diffDays})`, color: 'bg-sky-500 text-white border-sky-600 font-bold' };
  }
  return { diffDays, label: `📅 D-${diffDays}`, color: 'bg-slate-100 text-slate-700 border-slate-200' };
}
