// src/utils/jobOrderParser.js
// 한글(HWP) 파일 및 텍스트/클립보드 작업전표 자동 파서 엔진
import * as XLSX from 'xlsx';

// 한글 날짜 정규화: "2026년 10 월 19 일" -> "2026-10-19"
export function normalizeKoreanDate(str) {
  if (!str) return '';
  const m = str.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  const m2 = str.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (m2) {
    return `${m2[1]}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`;
  }
  return str.trim();
}

/**
 * 📄 1. HWP 파일 (ArrayBuffer / File) 파싱
 */
export async function parseHwpJobOrder(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  try {
    const cfb = XLSX.CFB.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const prvEntry = XLSX.CFB.find(cfb, 'PrvText') || cfb.FileIndex.find(f => f.name.includes('PrvText'));
    
    if (!prvEntry || !prvEntry.content) {
      throw new Error('한글 파일의 본문 미리보기(PrvText) 스트림을 찾을 수 없습니다.');
    }

    // UTF-16LE 디코딩
    const decoder = new TextDecoder('utf-16le');
    const text = decoder.decode(new Uint8Array(prvEntry.content));

    // <태그> 토큰 분리
    const rawTokens = [];
    const regex = /<([^>]*)>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const val = match[1].trim();
      if (val.length > 0) {
        rawTokens.push(val);
      }
    }

    return extractDataFromTokens(rawTokens);
  } catch (err) {
    console.error('HWP parsing error:', err);
    throw new Error('HWP 파일을 읽는 중 오류가 발생했습니다: ' + err.message);
  }
}

/**
 * 📋 2. 텍스트 / 클립보드 붙여넣기 내용 파싱
 */
export function parseTextJobOrder(rawText) {
  if (!rawText) return {};

  const cleanText = rawText.replace(/\r/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  // 탭이나 띄어쓰기로 쪼갠 토큰 목록도 준비
  const tokens = [];
  lines.forEach(l => {
    l.split(/[\t|]/).forEach(t => {
      const trimmed = t.trim();
      if (trimmed) tokens.push(trimmed);
    });
  });

  // HWP 형식 태그가 포함되어 있는 경우 태그 추출
  if (rawText.includes('<') && rawText.includes('>')) {
    const rawTokens = [];
    const regex = /<([^>]*)>/g;
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      const val = match[1].trim();
      if (val) rawTokens.push(val);
    }
    if (rawTokens.length > 5) {
      return extractDataFromTokens(rawTokens);
    }
  }

  // 일반 줄바꿈 텍스트에서 키워드 기반 파싱
  return extractDataFromTextLines(cleanText, lines, tokens);
}

/**
 * 토큰 배열로부터 1:1 정확 매칭
 */
function extractDataFromTokens(tokens) {
  const data = {
    code_number: '',
    sales_manager: '',
    receipt_date: '',
    delivery_date: '',
    reg_date: '',
    customer_name: '',
    dept: '',
    title: '',
    spec: '',
    pages: '',
    quantity: '1',
    contact_person: '',
    phone: '',
    email: '',
    cover_work: '',
    cover_paper: '',
    cover_print: '',
    coating: '',
    inner_work: '',
    inner_paper: '',
    inner_print: '',
    binding: '',
    manuscript: '',
    production_process: '',
    delivery_place: '',
    note: '',
  };

  const getNextVal = (idx, maxStep = 2) => {
    for (let j = idx + 1; j <= idx + maxStep && j < tokens.length; j++) {
      if (tokens[j] && !tokens[j].startsWith('<')) {
        return tokens[j];
      }
    }
    return '';
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // 1. 코드번호
    if (/코드번호/.test(t) && !data.code_number) {
      data.code_number = getNextVal(i);
    }
    // 2. 담당자(영업)
    else if (/담\s*당/.test(t) && /김광일|박진태|국승철|강영진|이선미/.test(tokens[i + 1] || tokens[i + 2] || tokens[i + 3] || '')) {
      data.sales_manager = tokens[i + 1] || tokens[i + 2] || tokens[i + 3] || '';
    } else if (/회\s*장/.test(t) && !data.sales_manager) {
      data.sales_manager = getNextVal(i);
    }
    // 3. 접수일 & 납품일
    else if (/접수일/.test(t)) {
      data.receipt_date = normalizeKoreanDate(getNextVal(i));
      data.reg_date = data.receipt_date;
    } else if (/납품일/.test(t)) {
      data.delivery_date = normalizeKoreanDate(getNextVal(i));
    }
    // 4. 발주처 & 부서
    else if (/발주처/.test(t)) {
      data.customer_name = tokens[i + 1] || '';
      // 만약 그 다음 토큰이 부서명이면
      if (tokens[i + 2] && !/품명|규격|수량/.test(tokens[i + 2])) {
        data.dept = tokens[i + 2];
      }
    }
    // 5. 품명
    else if (/품\s*명/.test(t)) {
      data.title = getNextVal(i);
    }
    // 6. 규격
    else if (/규\s*격/.test(t)) {
      data.spec = getNextVal(i);
    }
    // 7. 면수
    else if (/면\s*수/.test(t)) {
      const val = getNextVal(i);
      data.pages = val.replace(/[^0-9]/g, '');
    }
    // 8. 수량
    else if (/수\s*량/.test(t)) {
      const val = getNextVal(i);
      data.quantity = val.replace(/[^0-9]/g, '') || '1';
    }
    // 9. 발주업체 담당자
    else if (/발주업체\s*담당자/.test(t)) {
      data.contact_person = getNextVal(i);
    }
    // 10. 연락처 (010-XXXX-XXXX)
    else if (/01[016789]-\d{3,4}-\d{4}/.test(t)) {
      data.phone = t;
    }
    // 11. 이메일
    else if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(t)) {
      const em = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (em) data.email = em[0];
    }
    // 12. 공정 세부
    else if (/표지작업/.test(t)) data.cover_work = getNextVal(i);
    else if (/표지용지/.test(t)) data.cover_paper = getNextVal(i);
    else if (/표지인쇄/.test(t)) data.cover_print = getNextVal(i);
    else if (/코\s*팅/.test(t)) data.coating = getNextVal(i);
    else if (/내지작업/.test(t)) data.inner_work = getNextVal(i);
    else if (/본문용지/.test(t)) data.inner_paper = getNextVal(i);
    else if (/내지인쇄/.test(t)) data.inner_print = getNextVal(i);
    else if (/제\s*본/.test(t)) data.binding = getNextVal(i);
    else if (/원\s*고/.test(t)) data.manuscript = getNextVal(i);
    else if (/제작진행/.test(t)) data.production_process = getNextVal(i);
    else if (/납\s*품\s*처/.test(t)) data.delivery_place = getNextVal(i);
    else if (/요청사항/.test(t)) {
      const next = getNextVal(i);
      if (next && !next.includes('원칙 : 영업자')) {
        data.note = next;
      }
    }
  }

  return data;
}

/**
 * 일반 줄바꿈 텍스트로부터 정규식 키워드 파싱
 */
function extractDataFromTextLines(fullText, lines, tokens) {
  const data = {
    code_number: '',
    sales_manager: '',
    receipt_date: '',
    delivery_date: '',
    reg_date: '',
    customer_name: '',
    dept: '',
    title: '',
    spec: '',
    pages: '',
    quantity: '1',
    contact_person: '',
    phone: '',
    email: '',
    cover_work: '',
    cover_paper: '',
    cover_print: '',
    coating: '',
    inner_work: '',
    inner_paper: '',
    inner_print: '',
    binding: '',
    manuscript: '',
    production_process: '',
    delivery_place: '',
    note: '',
  };

  // 정규식 매칭 헬퍼
  const matchPattern = (pattern) => {
    const m = fullText.match(pattern);
    return m ? m[1].trim() : '';
  };

  data.code_number = matchPattern(/코드번호\s*[:：]?\s*([0-9A-Za-z-]+)/);
  data.sales_manager = matchPattern(/담당\s*[:：]?\s*([가-힣]{2,4})/);
  data.receipt_date = normalizeKoreanDate(matchPattern(/접수일\s*[:：]?\s*([0-9년월일\s.-]+)/));
  data.delivery_date = normalizeKoreanDate(matchPattern(/납품일\s*[:：]?\s*([0-9년월일\s.-]+)/));
  data.customer_name = matchPattern(/발주처\s*[:：]?\s*([^\n\t]+)/);
  data.title = matchPattern(/품\s*명\s*[:：]?\s*([^\n\t]+)/);
  data.spec = matchPattern(/규\s*격\s*[:：]?\s*([^\n\t]+)/);
  data.quantity = (matchPattern(/수\s*량\s*[:：]?\s*([0-9,]+)/) || '1').replace(/[^0-9]/g, '');
  data.contact_person = matchPattern(/담당자\s*[:：]?\s*([가-힣]{2,4}[^\n\t]*)/);
  
  const phoneMatch = fullText.match(/01[016789]-\d{3,4}-\d{4}/);
  if (phoneMatch) data.phone = phoneMatch[0];

  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.email = emailMatch[0];

  data.binding = matchPattern(/제\s*본\s*[:：]?\s*([^\n\t]+)/);
  data.cover_paper = matchPattern(/표지용지\s*[:：]?\s*([^\n\t]+)/);
  data.inner_paper = matchPattern(/본문용지\s*[:：]?\s*([^\n\t]+)/);
  data.coating = matchPattern(/코\s*팅\s*[:：]?\s*([^\n\t]+)/);

  return data;
}
