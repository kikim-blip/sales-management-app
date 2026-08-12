// src/services/googleSheetsApi.js
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

export async function getSheetValues(accessToken, sheetName) {
  if (!SPREADSHEET_ID) throw new Error('.env.local에 VITE_SPREADSHEET_ID가 설정되어 있지 않습니다.');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A2:Z?valueRenderOption=UNFORMATTED_VALUE`;
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

export function parseCustomers(rows) {
  return rows.map((row) => ({
    id: row[0] || '',
    name: row[1] || '',
    dept: row[2] || '',
    contact_person: row[3] || '',
    phone: row[4] || '',
  }));
}

export function parseSales(rows) {
  return rows.map((row) => ({
    id: row[0] || '',
    reg_date: row[1] || '',
    receipt_date: row[2] || '',
    delivery_date: row[3] || '',
    delivery_time: row[4] || '',
    customer_id: row[5] || '',
    title: row[6] || '',
    content: row[7] || '',
    note: row[8] || '',
    billing_schedule: row[9] || '',
    type: row[10] || '매출',
    supply_price: Number(row[11]) || 0,
    tax: Number(row[12]) || 0,
    total_price: Number(row[13]) || 0,
    calendar_synced: row[14] === true || row[14] === 'true' || row[14] === 'Y',
    superthread_synced: row[15] === true || row[15] === 'true' || row[15] === 'Y',
  }));
}

export function parsePayments(rows) {
  return rows.map((row) => ({
    id: row[0] || '',
    payment_date: row[1] || '',
    customer_id: row[2] || '',
    amount: Number(row[3]) || 0,
    method: row[4] || '',
  }));
}