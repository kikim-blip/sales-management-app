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
    return { diffDays, label: `🔥 납품 임박 (D-${diffDays})`, color: 'bg-sky-500 text-white border-sky-600 font-bold' };
  }
  return { diffDays, label: `📅 D-${diffDays}`, color: 'bg-slate-100 text-slate-700 border-slate-200' };
}

/**
 * 한국 표준시(KST, Asia/Seoul) 기준의 일시 문자열을 생성합니다.
 * 서버 환경(UTC 등)에 무관하게 항상 정확한 한국 시간(오전/오후)을 출력합니다.
 * 예: "2026. 10. 22. 오후 5:48:37"
 */
export function getKoreanTimestamp(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * 한국어 일시 문자열("2026. 10. 21. 오전 8:48:37" 등) 및 다양한 날짜 포맷을 안전하게 Date 객체로 파싱합니다.
 */
export function parseKoreanDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  const str = String(dateStr).trim();
  const m = str.match(/(\d{4})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    let hour = m[5] !== undefined ? Number(m[5]) : 0;
    const minute = m[6] !== undefined ? Number(m[6]) : 0;
    const second = m[7] !== undefined ? Number(m[7]) : 0;
    const ampm = m[4];
    if (ampm === '오후' && hour < 12) hour += 12;
    if (ampm === '오전' && hour === 12) hour = 0;
    return new Date(year, month, day, hour, minute, second);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

