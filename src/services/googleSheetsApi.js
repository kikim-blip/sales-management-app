// src/services/googleSheetsApi.js
const DEFAULT_TEMPLATE_SHEET_NAMES = ['작업전표양식', '작업전표 양식', '작업전표_양식', '작업전표 엑셀 양식', '작업전표 엑셀양식', 'Sheet1'];

function handleGoogleAuthFailure(response, fallbackMessage) {
  if (response?.status === 401 || response?.status === 403) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('google-auth-expired'));
    }
    throw new Error('Google 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
  }

  if (fallbackMessage) {
    throw new Error(fallbackMessage);
  }
}

async function getSpreadsheetSheetNames(accessToken, spreadsheetId) {
  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const response = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      handleGoogleAuthFailure(response, '구글 스프레드시트 메타 정보를 불러오지 못했습니다.');
      return [];
    }
    const meta = await response.json();
    const names = Array.isArray(meta?.sheets) ? meta.sheets.map((sheet) => sheet?.properties?.title).filter(Boolean) : [];

    return names;
  } catch (error) {
    console.warn('스프레드시트 메타 정보 로드 실패:', error);
    return [];
  }
}

function resolveSpreadsheetId() {
  const envId = import.meta.env?.VITE_SPREADSHEET_ID;
  const runtimeValues = [
    envId,
    typeof window !== 'undefined' ? window.__GOOGLE_SPREADSHEET_ID__ : undefined,
    typeof window !== 'undefined' ? window.localStorage?.getItem('google_spreadsheet_id') : undefined,
    typeof window !== 'undefined' ? window.sessionStorage?.getItem('google_spreadsheet_id') : undefined,
    typeof document !== 'undefined' ? document.body?.dataset?.spreadsheetId : undefined,
  ];

  return runtimeValues.find((value) => typeof value === 'string' && value.trim())?.trim();
}

function resolveTemplateSheetName(sheetName, spreadsheetNames = []) {
  const normalizedExistingNames = spreadsheetNames
    .map((name) => String(name).trim())
    .filter(Boolean);

  const preferred = normalizedExistingNames.filter((name) => {
    const text = name.toLowerCase();
    return text.includes('작업전표') || text.includes('template') || text.includes('양식');
  });

  const candidateNames = [
    sheetName,
    ...preferred,
    ...DEFAULT_TEMPLATE_SHEET_NAMES,
    ...DEFAULT_TEMPLATE_SHEET_NAMES.map((name) => name.trim()),
  ].filter(Boolean);

  return [...new Set(candidateNames)];
}

const SPREADSHEET_ID = resolveSpreadsheetId();

/**
 * Excel/Sheets serial number date formatting helper
 */
export function formatSheetDate(val) {
  if (!val && val !== 0) return '';
  if (typeof val === 'number') {
    // Excel/Sheets serial date number (e.g. 40232 -> 2010-02-23)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val);
}

export function formatSheetTime(val) {
  if (!val && val !== 0) return '';
  if (typeof val === 'number') {
    // Fraction of a day (e.g. 0.58333 -> 14:00)
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mins = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
  }
  return String(val);
}

export async function getSheetValues(accessToken, sheetName) {
  const spreadsheetId = resolveSpreadsheetId();
  if (!spreadsheetId) throw new Error('구글 스프레드시트 ID가 설정되지 않았습니다. 관리자에게 VITE_SPREADSHEET_ID를 배포 환경에 추가해 주세요.');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A2:Z?valueRenderOption=FORMATTED_VALUE`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '구글 시트 데이터를 불러오지 못했습니다.');
  }
  const data = await response.json();
  return data.values || [];
}

/**
 * 💡 구글 시트 5개 탭을 1회 호출로 일괄 조회 (API Rate Limit Quota 초과 방지)
 */
export async function batchGetSheetValues(accessToken, sheetNames) {
  const spreadsheetId = resolveSpreadsheetId();
  if (!spreadsheetId) throw new Error('구글 스프레드시트 ID가 설정되지 않았습니다. 관리자에게 VITE_SPREADSHEET_ID를 배포 환경에 추가해 주세요.');
  const rangeParams = sheetNames.map(name => `ranges=${encodeURIComponent(name)}!A2:Z`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeParams}&valueRenderOption=FORMATTED_VALUE`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '구글 시트 데이터를 불러오지 못했습니다.');
  }
  const data = await response.json();
  const result = {};
  sheetNames.forEach((name, idx) => {
    result[name] = data.valueRanges?.[idx]?.values || [];
  });
  return result;
}

/**
 * 시트에 새 행(Row) 쓰기 (Append API)
 */
export async function appendSheetValue(accessToken, sheetName, rowArray) {
  const spreadsheetId = resolveSpreadsheetId();
  if (!spreadsheetId) throw new Error('구글 스프레드시트 ID가 설정되지 않았습니다. 관리자에게 VITE_SPREADSHEET_ID를 배포 환경에 추가해 주세요.');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowArray],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      handleGoogleAuthFailure(response, errorData.error?.message || 'Google 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    throw new Error(errorData.error?.message || '시트에 데이터를 쓰지 못했습니다.');
  }

  return await response.json();
}

/**
 * 시트 특정 행(Row) 수정 (Update API)
 */
export async function updateSheetRow(accessToken, sheetName, rowIndex, rowArray) {
  const spreadsheetId = resolveSpreadsheetId();
  if (!spreadsheetId) throw new Error('구글 스프레드시트 ID가 설정되지 않았습니다. 관리자에게 VITE_SPREADSHEET_ID를 배포 환경에 추가해 주세요.');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A${rowIndex}:Z${rowIndex}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowArray],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      handleGoogleAuthFailure(response, errorData.error?.message || 'Google 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    throw new Error(errorData.error?.message || '시트에 데이터 수정을 실패했습니다.');
  }

  return await response.json();
}

/**
 * 💡 구글 시트 DB의 [작업전표양식] 탭에 코드번호를 반영하여 VLOOKUP 수식을 자동 평가시키고,
 * 구글 시트 DB에 작성된 [작업전표양식] 탭의 셀 행렬 데이터를 그대로 100% 1:1 라이브로 불러옵니다!
 */
export async function syncAndFetchTemplateSheet(accessToken, codeNumber) {
  const spreadsheetId = resolveSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error('구글 스프레드시트 ID가 설정되지 않았습니다. 관리자에게 VITE_SPREADSHEET_ID를 배포 환경에 추가해 주세요.');
  }

  const spreadsheetNames = await getSpreadsheetSheetNames(accessToken, spreadsheetId);
  const candidateSheetNames = resolveTemplateSheetName('작업전표양식', spreadsheetNames);
  let lastError = null;

  for (const sheetName of candidateSheetNames) {
    try {
      await updateSheetRow(accessToken, sheetName, 1, ['코드번호', codeNumber]);
    } catch (e) {
      console.warn(`${sheetName} 시트 업데이트 시도 실패:`, e);
      lastError = e;
      continue;
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z40?valueRenderOption=FORMATTED_VALUE`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          handleGoogleAuthFailure(response, errorData.error?.message || `${sheetName} 시트를 불러오지 못했습니다.`);
        }
        throw new Error(errorData.error?.message || `${sheetName} 시트를 불러오지 못했습니다.`);
      }

      const data = await response.json();
      const rows = data.values || [];
      if (rows.length > 0) return rows;
      return [];
    } catch (e) {
      lastError = e;
      console.warn(`${sheetName} 시트 로딩 실패, 다음 시트 후보를 시도합니다:`, e);
    }
  }

  if (lastError) {
    throw new Error(lastError.message || '구글 시트의 작업전표 템플릿 데이터를 읽지 못했습니다.');
  }

  throw new Error('작업전표 양식 시트를 찾지 못했습니다. 시트 이름이 "작업전표양식" 또는 "작업전표 양식"인지 확인해 주세요.');
}

/**
 * 시트 특정 행(Row) 지우기 (Clear API)
 */
export async function clearSheetRow(accessToken, sheetName, rowIndex) {
  const spreadsheetId = resolveSpreadsheetId();
  if (!spreadsheetId) throw new Error('구글 스프레드시트 ID가 설정되지 않았습니다. 관리자에게 VITE_SPREADSHEET_ID를 배포 환경에 추가해 주세요.');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A${rowIndex}:Z${rowIndex}:clear`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '시트 행 삭제를 실패했습니다.');
  }

  return await response.json();
}

export function parseCustomers(rows) {
  return rows.map((row) => ({
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    dept: String(row[2] || ''),
    contact_person: String(row[3] || ''),
    phone: String(row[4] || ''),
    email: String(row[5] || ''),
    sales_manager: String(row[6] || ''),
  }));
}

export function parseSales(rows) {
  return rows.map((row) => ({
    id: String(row[0] || ''),
    reg_date: formatSheetDate(row[1]),
    receipt_date: formatSheetDate(row[2]),
    delivery_date: formatSheetDate(row[3]),
    delivery_time: formatSheetTime(row[4]),
    customer_id: String(row[5] || ''),
    title: String(row[6] || ''),
    content: String(row[7] || ''),
    note: String(row[8] || ''),
    billing_schedule: String(row[9] || '진행중'),

    type: String(row[10] || '매출'),
    supply_price: Number(String(row[11]).replace(/[^0-9.-]+/g, '')) || 0,
    tax: Number(String(row[12]).replace(/[^0-9.-]+/g, '')) || 0,
    total_price: Number(String(row[13]).replace(/[^0-9.-]+/g, '')) || 0,
    calendar_synced: row[14] === true || row[14] === 'true' || row[14] === 'Y' || row[14] === '등록완료',
    superthread_synced: row[15] === true || row[15] === 'true' || row[15] === 'Y' || row[15] === 'ST등록완료',
  }));
}

export function parsePayments(rows) {
  return rows.map((row) => ({
    id: String(row[0] || ''),
    payment_date: formatSheetDate(row[1]),
    customer_id: String(row[2] || ''),
    amount: Number(String(row[3]).replace(/[^0-9.-]+/g, '')) || 0,
    method: String(row[4] || '계좌이체'),
  }));
}

export function parseStaffs(rows) {
  return rows
    .map((row) => ({
      userCode: String(row[0] || ''),
      userName: String(row[1] || ''),
      companyCode: String(row[2] || ''),
      email: String(row[3] || '').trim().toLowerCase(),
      dept: String(row[4] || ''),
      position: String(row[5] || '담당자'),
      team: String(row[6] || row[4] || ''),
      role: String(row[7] || '일반사원'),
      status: String(row[8] || '승인완료'),
    }))
    .filter((s) => s.userName || s.userCode || s.email);
}

export function parseJobOrders(rows) {
  return rows.map((row) => ({
    id: String(row[0] || ''),
    code_number: String(row[0] || ''),
    manager_name: String(row[1] || ''),
    receipt_date: formatSheetDate(row[2]),
    delivery_date: formatSheetDate(row[3]),
    delivery_time: String(row[4] || ''),
    customer_id: String(row[5] || ''),
    dept: String(row[6] || ''),
    title: String(row[7] || ''),
    spec: String(row[8] || ''),
    pages: String(row[9] || ''),
    duplex: String(row[10] || ''),
    quantity: Number(String(row[11]).replace(/[^0-9.-]+/g, '')) || 0,
    estimated_price: Number(String(row[12]).replace(/[^0-9.-]+/g, '')) || 0,
    client_contact_person: String(row[13] || ''),
    client_phone: String(row[14] || ''),
    client_email: String(row[15] || ''),
    email_receipt_time: String(row[16] || ''),
    cover_job: String(row[17] || ''),
    cover_paper: String(row[18] || ''),
    cover_print: String(row[19] || ''),
    coating: String(row[20] || ''),
    inner_job: String(row[21] || ''),
    inner_paper: String(row[22] || ''),
    inner_print: String(row[23] || ''),
    interleaf_paper: String(row[24] || ''),
    binding: String(row[25] || ''),
    draft_email: String(row[26] || ''),
    draft_group: String(row[27] || ''),
    mail_sender: String(row[28] || ''),
    cover_proof_date: formatSheetDate(row[29]),
    inner_proof_date: formatSheetDate(row[30]),
    proof_method: String(row[31] || ''),
    planning: String(row[32] || ''),
    photography: String(row[33] || ''),
    illustration: String(row[34] || ''),
    copyright_web: String(row[35] || ''),
    production_progress: String(row[36] || ''),
    delivery_destination: String(row[37] || ''),
    cover_related: String(row[38] || ''),
    inner_related: String(row[39] || ''),
    request_note: String(row[40] || ''),
    editor_name: String(row[41] || ''),
    designer_name: String(row[42] || ''),
    status: '의뢰접수',
  }));
}