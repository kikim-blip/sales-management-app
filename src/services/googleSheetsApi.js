// src/services/googleSheetsApi.js
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

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
  if (!SPREADSHEET_ID) throw new Error('.env.local에 VITE_SPREADSHEET_ID가 설정되어 있지 않습니다.');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A2:Z?valueRenderOption=FORMATTED_VALUE`;
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
 * 시트에 새 행(Row) 쓰기 (Append API)
 */
export async function appendSheetValue(accessToken, sheetName, rowArray) {
  if (!SPREADSHEET_ID) throw new Error('.env.local에 VITE_SPREADSHEET_ID가 설정되어 있지 않습니다.');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`;

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
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '시트에 데이터를 쓰지 못했습니다.');
  }

  return await response.json();
}

/**
 * 시트 특정 행(Row) 수정 (Update API)
 */
export async function updateSheetRow(accessToken, sheetName, rowIndex, rowArray) {
  if (!SPREADSHEET_ID) throw new Error('.env.local에 VITE_SPREADSHEET_ID가 설정되어 있지 않습니다.');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A${rowIndex}:Z${rowIndex}?valueInputOption=USER_ENTERED`;

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
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '시트에 데이터 수정을 실패했습니다.');
  }

  return await response.json();
}

/**
 * 시트 특정 행(Row) 지우기 (Clear API)
 */
export async function clearSheetRow(accessToken, sheetName, rowIndex) {
  if (!SPREADSHEET_ID) throw new Error('.env.local에 VITE_SPREADSHEET_ID가 설정되어 있지 않습니다.');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A${rowIndex}:Z${rowIndex}:clear`;

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
    billing_schedule: String(row[9] || '청구완료'),
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