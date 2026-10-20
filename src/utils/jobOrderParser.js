// src/utils/jobOrderParser.js
// 한글(HWP) 파일 및 텍스트/클립보드 작업전표 정밀 파서 엔진
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
    const prvEntry = XLSX.CFB.find(cfb, 'PrvText') || cfb.FileIndex.find(f => f.name && f.name.includes('PrvText'));
    
    if (!prvEntry || !prvEntry.content) {
      throw new Error('한글 파일의 본문 미리보기(PrvText) 스트림을 찾을 수 없습니다.');
    }

    // UTF-16LE 디코딩
    const decoder = new TextDecoder('utf-16le');
    const text = decoder.decode(new Uint8Array(prvEntry.content));

    return parseHwpTextWithTokens(text);
  } catch (err) {
    console.error('HWP parsing error:', err);
    throw new Error('HWP 파일을 읽는 중 오류가 발생했습니다: ' + err.message);
  }
}

/**
 * HWP PrvText 텍스트로부터 데이터 추출
 */
function parseHwpTextWithTokens(text) {
  // <태그> 토큰 분리 (빈 토큰도 보존)
  const tokens = [];
  const regex = /<([^>]*)>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[1]);
  }

  const result = {
    code_number: '',
    sales_manager: '김광일',
    receipt_date: '',
    delivery_date: '',
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
    request_note: '',
  };

  // 1. 요청사항 추출 (하단부 <<요청사항> 내용> 형태)
  const reqMatch = text.match(/<요청사항>?([^>]*)>/);
  if (reqMatch) {
    const rawReq = reqMatch[1].replace(/^[<>\s]+/, '').trim();
    if (rawReq && !rawReq.includes('원칙 : 영업자')) {
      result.request_note = rawReq;
    }
  }

  // 토큰 전체에서 요청사항 추가 검색
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].includes('요청사항')) {
      const content = tokens[i].replace(/.*요청사항[>:\s]*/, '').trim();
      if (content && !content.includes('원칙 : 영업자')) {
        result.request_note = content;
      } else if (tokens[i + 1] && !tokens[i + 1].includes('원칙 : 영업자') && tokens[i + 1].trim()) {
        result.request_note = tokens[i + 1].trim();
      }
    }
  }

  const getDirectNext = (i) => (tokens[i + 1] !== undefined ? tokens[i + 1].trim() : '');

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].trim();

    if (/코드번호/.test(t) && !result.code_number) {
      result.code_number = getDirectNext(i);
    } else if (/담\s*당/.test(t) && /김광일|박진태|국승철|강영진|이선미/.test(tokens[i + 1] || tokens[i + 2] || '')) {
      result.sales_manager = (tokens[i + 1] || tokens[i + 2]).trim();
    } else if (/회\s*장/.test(t) && !result.sales_manager) {
      result.sales_manager = getDirectNext(i);
    } else if (/접수일/.test(t)) {
      result.receipt_date = normalizeKoreanDate(getDirectNext(i));
    } else if (/납품일/.test(t)) {
      result.delivery_date = normalizeKoreanDate(getDirectNext(i));
    } else if (/발주처/.test(t)) {
      result.customer_name = getDirectNext(i);
      if (tokens[i + 2] && !/품명|규격|수량/.test(tokens[i + 2])) {
        result.dept = tokens[i + 2].trim();
      }
    } else if (/품\s*명/.test(t)) {
      result.title = getDirectNext(i);
    } else if (/규\s*격/.test(t)) {
      result.spec = getDirectNext(i);
    } else if (/면\s*수/.test(t)) {
      result.pages = getDirectNext(i).replace(/[^0-9]/g, '');
    } else if (/수\s*량/.test(t)) {
      result.quantity = getDirectNext(i).replace(/[^0-9]/g, '') || '1';
    } else if (/발주업체\s*담당자/.test(t)) {
      result.contact_person = getDirectNext(i);
    } else if (/표지작업/.test(t)) {
      result.cover_work = getDirectNext(i);
    } else if (/표지용지/.test(t)) {
      result.cover_paper = getDirectNext(i);
    } else if (/표지인쇄/.test(t)) {
      result.cover_print = getDirectNext(i);
    } else if (/코\s*팅/.test(t)) {
      result.coating = getDirectNext(i);
    } else if (/내지작업/.test(t)) {
      result.inner_work = getDirectNext(i);
    } else if (/본문용지/.test(t)) {
      result.inner_paper = getDirectNext(i);
    } else if (/내지인쇄/.test(t)) {
      result.inner_print = getDirectNext(i);
    } else if (/제\s*본/.test(t)) {
      result.binding = getDirectNext(i);
    } else if (/원\s*고/.test(t)) {
      result.manuscript = getDirectNext(i);
    } else if (/제작진행/.test(t)) {
      result.production_process = getDirectNext(i);
    } else if (/납\s*품\s*처/.test(t)) {
      result.delivery_place = getDirectNext(i);
    }

    // 전화번호 및 이메일 감지
    if (/01[016789]-\d{3,4}-\d{4}/.test(t)) {
      result.phone = t;
    }
    const em = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (em) {
      result.email = em[0];
    }
  }

  return result;
}

/**
 * 📋 2. 텍스트 / 클립보드 붙여넣기 내용 파싱
 */
export function parseTextJobOrder(rawText) {
  if (!rawText) return {};

  if (rawText.includes('<') && rawText.includes('>')) {
    return parseHwpTextWithTokens(rawText);
  }

  const cleanText = rawText.replace(/\r/g, '\n');

  const matchPattern = (pattern) => {
    const m = cleanText.match(pattern);
    return m ? m[1].trim() : '';
  };

  const data = {
    code_number: matchPattern(/코드번호\s*[:：]?\s*([0-9A-Za-z-]+)/),
    sales_manager: matchPattern(/담당\s*[:：]?\s*([가-힣]{2,4})/) || '김광일',
    receipt_date: normalizeKoreanDate(matchPattern(/접수일\s*[:：]?\s*([0-9년월일\s.-]+)/)),
    delivery_date: normalizeKoreanDate(matchPattern(/납품일\s*[:：]?\s*([0-9년월일\s.-]+)/)),
    customer_name: matchPattern(/발주처\s*[:：]?\s*([^\n\t]+)/),
    dept: matchPattern(/부\s*서\s*[:：]?\s*([^\n\t]+)/),
    title: matchPattern(/품\s*명\s*[:：]?\s*([^\n\t]+)/),
    spec: matchPattern(/규\s*격\s*[:：]?\s*([^\n\t]+)/),
    pages: '',
    quantity: (matchPattern(/수\s*량\s*[:：]?\s*([0-9,]+)/) || '1').replace(/[^0-9]/g, ''),
    contact_person: matchPattern(/담당자\s*[:：]?\s*([가-힣]{2,4}[^\n\t]*)/),
    phone: '',
    email: '',
    cover_work: matchPattern(/표지작업\s*[:：]?\s*([^\n\t]+)/),
    cover_paper: matchPattern(/표지용지\s*[:：]?\s*([^\n\t]+)/),
    cover_print: matchPattern(/표지인쇄\s*[:：]?\s*([^\n\t]+)/),
    coating: matchPattern(/코\s*팅\s*[:：]?\s*([^\n\t]+)/),
    inner_work: matchPattern(/내지작업\s*[:：]?\s*([^\n\t]+)/),
    inner_paper: matchPattern(/본문용지\s*[:：]?\s*([^\n\t]+)/),
    inner_print: matchPattern(/내지인쇄\s*[:：]?\s*([^\n\t]+)/),
    binding: matchPattern(/제\s*본\s*[:：]?\s*([^\n\t]+)/),
    manuscript: matchPattern(/원\s*고\s*[:：]?\s*([^\n\t]+)/),
    production_process: matchPattern(/제작진행\s*[:：]?\s*([^\n\t]+)/),
    delivery_place: matchPattern(/납\s*품\s*처\s*[:：]?\s*([^\n\t]+)/),
    request_note: matchPattern(/요청사항\s*[:：]?\s*([^\n\r]+)/),
  };

  const phoneMatch = cleanText.match(/01[016789]-\d{3,4}-\d{4}/);
  if (phoneMatch) data.phone = phoneMatch[0];

  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.email = emailMatch[0];

  return data;
}
