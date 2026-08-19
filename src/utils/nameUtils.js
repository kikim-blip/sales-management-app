// src/utils/nameUtils.js
// 구글 계정 이름 (예: "대원 강", "Daewon Kang")을 사원 DB의 정식 한국어 성명 ("강대원")으로 정규화하는 유틸리티

export const normalizeStaffName = (name, staffs = []) => {
  if (!name || typeof name !== 'string') return '';
  const raw = name.trim();
  if (!raw) return '';

  const compact = raw.replace(/\s+/g, '');

  // 1. 강대원 대표 이명 매칭 (대원강, 강대원, DaewonKang 등)
  if (compact === '대원강' || compact === '강대원' || compact.toLowerCase().includes('daewon') || compact.toLowerCase().includes('kdw')) {
    return '강대원';
  }

  // 2. 김광일 대표 이명 매칭 (광일김, 김광일, KwangilKim 등)
  if (compact === '광일김' || compact === '김광일' || compact.toLowerCase().includes('kwangil') || compact.toLowerCase().includes('richkikim')) {
    return '김광일';
  }

  // 3. 사원 DB 목록에서 이메일 / 이름 매칭
  if (Array.isArray(staffs) && staffs.length > 0) {
    const matched = staffs.find(s => {
      const sName = (s.userName || s.name || '').trim();
      const sCompact = sName.replace(/\s+/g, '');
      const sEmail = (s.email || '').toLowerCase().trim();

      if (sCompact === compact) return true;
      if (raw.includes('@') && sEmail === raw.toLowerCase()) return true;
      return false;
    });
    if (matched) return matched.userName || matched.name;
  }

  return raw;
};
