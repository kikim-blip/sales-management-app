// src/utils/estimateExcelParser.js
// 기존 엑셀 견적서(.xlsx, .xls) 및 클립보드/텍스트/PDF 표 스마트 파서
import * as XLSX from 'xlsx';

/**
 * 엑셀 워크북 정보만 먼저 읽어서 시트 목록 반환 (시트 선택용)
 * returns { sheetNames: string[], workbook: XLSX.WorkBook }
 */
export async function readExcelWorkbook(file) {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  return { sheetNames: wb.SheetNames, workbook: wb };
}

/**
 * 이미 읽은 workbook에서 특정 시트를 파싱
 */
export function parseSheetFromWorkbook(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`시트 "${sheetName}"를 찾을 수 없습니다.`);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return extractItemsFromRows(rows, sheetName);
}

/**
 * 엑셀/텍스트/CSV/클립보드 견적 파일 통합 파서
 * - 엑셀 시트가 1개이면 바로 파싱
 * - 시트가 2개 이상이면 sheetNames와 workbook을 반환해서 호출 쪽에서 선택하게 함
 */
export async function parseEstimateFile(file) {
  if (!file) throw new Error('파일이 제공되지 않았습니다.');

  const fileName = (file.name || '').toLowerCase();

  // 1. 엑셀 파일 (.xlsx, .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // 시트가 여러 개면 선택 필요 플래그 반환
    if (wb.SheetNames.length > 1) {
      return {
        needSheetSelect: true,
        sheetNames: wb.SheetNames,
        workbook: wb,
        items: null,
        sourceName: file.name,
      };
    }

    // 시트가 1개면 바로 파싱
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const result = extractItemsFromRows(rows, sheetName);
    return { ...result, needSheetSelect: false };
  }

  // 2. CSV 또는 일반 텍스트 파일
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.tsv')) {
    const text = await file.text();
    return { ...parseEstimateClipboardText(text, file.name), needSheetSelect: false };
  }

  // 3. PDF 파일 - 안내 메시지
  if (fileName.endsWith('.pdf')) {
    throw new Error(
      'PDF 파일은 보안·서식 특성상 직접 표 추출이 제한됩니다.\n\n' +
      '💡 PDF 뷰어에서 견적 품목 표를 드래그 복사(Ctrl+C)하신 후,\n' +
      '이 창에서 Ctrl+V 붙여넣기를 하시면 자동으로 품목이 채워집니다!'
    );
  }

  // 기본 fallback: 엑셀 파싱 시도
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    if (wb.SheetNames.length > 1) {
      return { needSheetSelect: true, sheetNames: wb.SheetNames, workbook: wb, items: null, sourceName: file.name };
    }
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return { ...extractItemsFromRows(rows, sheetName), needSheetSelect: false };
  } catch {
    const text = await file.text();
    return { ...parseEstimateClipboardText(text, file.name || '파일'), needSheetSelect: false };
  }
}

/**
 * 엑셀 파일(ArrayBuffer / File)에서 견적 품목 테이블 자동 추출 (단일 시트)
 */
export async function parseEstimateExcelFile(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const sheetName = wb.SheetNames.find(n => n.includes('견적') || n.includes('내역') || n.includes('품목')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return extractItemsFromRows(rows, sheetName);
}

/**
 * 클립보드 텍스트(표 복사본)에서 품목 테이블 자동 추출
 */
export function parseEstimateClipboardText(rawText, sourceName = '클립보드/텍스트') {
  if (!rawText) return { items: [], needSheetSelect: false };

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { items: [], needSheetSelect: false };

  const isTsv = lines.some(l => l.includes('\t'));
  const isCsv = !isTsv && lines.some(l => l.includes(','));

  const rows = lines.map(line => {
    if (isTsv) return line.split('\t').map(c => c.trim());
    if (isCsv) return line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    return line.split(/\s{2,}|\t/).map(c => c.trim());
  });

  return { ...extractItemsFromRows(rows, sourceName), needSheetSelect: false };
}

/**
 * 행렬(2D Array) 데이터에서 견적 테이블 헤더 및 데이터 행 추출
 */
export function extractItemsFromRows(rows, sourceName = '') {
  let headerRowIdx = -1;
  let colMap = { name: -1, spec: -1, pages: -1, quantity: -1, unit: -1, unit_price: -1, amount: -1, note: -1 };

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length < 2) continue;

    let hasName = false;
    let hasOther = false;
    let tempMap = { name: -1, spec: -1, pages: -1, quantity: -1, unit: -1, unit_price: -1, amount: -1, note: -1 };

    row.forEach((cVal, idx) => {
      const val = String(cVal || '').replace(/\s+/g, '');
      if (/^(품명|품목|작업명|내용|항목|품목명|건명|내역|품명및규격)$/.test(val) && tempMap.name === -1) {
        tempMap.name = idx; hasName = true;
      } else if (/^(규격|사양|크기|사이즈)$/.test(val)) {
        tempMap.spec = idx; hasOther = true;
      } else if (/^(페이지|면수|쪽|쪽수|p)$/i.test(val)) {
        tempMap.pages = idx; hasOther = true;
      } else if (/^(수량|부수)$/.test(val)) {
        tempMap.quantity = idx; hasOther = true;
      } else if (/^(단위)$/.test(val)) {
        tempMap.unit = idx; hasOther = true;
      } else if (/^(단가|단가\(원\))$/.test(val)) {
        tempMap.unit_price = idx; hasOther = true;
      } else if (/^(금액|공급가액|공급가|합계금액)$/.test(val)) {
        tempMap.amount = idx; hasOther = true;
      } else if (/^(비고|특이사항|메모)$/.test(val)) {
        tempMap.note = idx;
      }
    });

    if (hasName && hasOther) {
      headerRowIdx = r;
      colMap = tempMap;
      break;
    }
  }

  if (headerRowIdx === -1 || colMap.name === -1) {
    throw new Error('시트/텍스트에서 [품명/규격/수량/단가/금액]이 포함된 견적 테이블 헤더 행을 찾지 못했습니다.');
  }

  const items = [];
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[colMap.name] || row[0] || '').replace(/\s+/g, '');
    if (/^(소계|합계|합계금액|총계|총합계|부가세|부가가치세|세액|결제조건|유효기간|견적조건)$/.test(firstCell)) break;

    const name = String(row[colMap.name] || '').trim();
    if (!name || name === '0' || name === '-' || name.toLowerCase() === 'null') continue;

    const spec = colMap.spec !== -1 ? String(row[colMap.spec] || '').trim() : '';
    const pages = colMap.pages !== -1 && row[colMap.pages] !== undefined ? String(row[colMap.pages]).replace(/[^0-9]/g, '') : '';
    const quantity = colMap.quantity !== -1 && row[colMap.quantity] !== undefined
      ? Number(String(row[colMap.quantity]).replace(/[^0-9]/g, '')) || 1 : 1;
    const unit = colMap.unit !== -1 ? String(row[colMap.unit] || '').trim() : (pages ? '부' : '식');
    let unit_price = colMap.unit_price !== -1 ? Number(String(row[colMap.unit_price] || '0').replace(/[^0-9.-]/g, '')) || 0 : 0;
    let amount = colMap.amount !== -1 && row[colMap.amount] !== undefined
      ? Number(String(row[colMap.amount]).replace(/[^0-9.-]/g, '')) || 0 : 0;

    if (amount === 0 && unit_price > 0) {
      amount = pages ? Number(pages) * quantity * unit_price : quantity * unit_price;
    } else if (unit_price === 0 && amount > 0 && quantity > 0) {
      unit_price = pages && Number(pages) > 0
        ? Math.round(amount / (Number(pages) * quantity))
        : Math.round(amount / quantity);
    }

    const note = colMap.note !== -1 ? String(row[colMap.note] || '').trim() : '';
    items.push({ id: `imported-item-${Date.now()}-${r}`, name, spec, pages, quantity, unit, unit_price, amount, note });
  }

  return { items, sourceName };
}
