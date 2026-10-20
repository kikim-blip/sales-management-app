// src/utils/estimateExcelParser.js
// 기존 엑셀 견적서(.xlsx, .xls) 및 클립보드/텍스트/PDF 표 스마트 파서
import * as XLSX from 'xlsx';

/**
 * 엑셀/텍스트/CSV/클립보드 견적 파일 통합 파서
 */
export async function parseEstimateFile(file) {
  if (!file) throw new Error('파일이 제공되지 않았습니다.');

  const fileName = (file.name || '').toLowerCase();

  // 1. 엑셀 파일 (.xlsx, .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseEstimateExcelFile(file);
  }

  // 2. CSV 또는 일반 텍스트 파일 (.csv, .txt, .tsv)
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.tsv')) {
    const text = await file.text();
    return parseEstimateClipboardText(text, file.name);
  }

  // 3. PDF 파일 (.pdf)
  if (fileName.endsWith('.pdf')) {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawStr = textDecoder.decode(bytes);

      const matches = [];
      const regex = /\(([^)]+)\)\s*Tj/g;
      let m;
      while ((m = regex.exec(rawStr)) !== null) {
        if (m[1] && m[1].trim()) matches.push(m[1].trim());
      }

      if (matches.length > 5) {
        const reconstructed = matches.join('\t');
        if (/(품명|품목|작업명|규격|수량|단가|금액)/.test(reconstructed)) {
          const res = parseEstimateClipboardText(reconstructed, file.name);
          if (res.items && res.items.length > 0) return res;
        }
      }
    } catch (e) {
      console.warn('PDF stream text extraction fallback:', e);
    }

    throw new Error(
      'PDF 파일은 보안 및 서식 특성상 직접 표 추출이 제한될 수 있습니다.\n\n' +
      '💡 가장 편리한 방법:\n' +
      'PDF 뷰어에서 견적서의 품목 표 부분을 마우스로 드래그 복사(Ctrl+C)하신 뒤, ' +
      '견적서 창 아무 곳에서 [Ctrl+V (붙여넣기)]하시면 품목들이 자동으로 즉시 채워집니다!'
    );
  }

  // 기본 fallback: 엑셀 파싱 시도 후 실패 시 텍스트 파싱
  try {
    return await parseEstimateExcelFile(file);
  } catch {
    const text = await file.text();
    return parseEstimateClipboardText(text, file.name || '파일');
  }
}

/**
 * 엑셀 파일(ArrayBuffer / File)에서 견적 품목 테이블 자동 추출
 */
export async function parseEstimateExcelFile(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  try {
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const sheetName = wb.SheetNames.find(n => n.includes('견적') || n.includes('내역') || n.includes('품목')) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    return extractItemsFromRows(rows, sheetName);
  } catch (err) {
    console.error('Excel quote parse error:', err);
    throw new Error('엑셀 견적서 분석 중 오류가 발생했습니다: ' + err.message);
  }
}

/**
 * 클립보드 텍스트(표 복사본)에서 품목 테이블 자동 추출
 */
export function parseEstimateClipboardText(rawText, sourceName = '클립보드/텍스트') {
  if (!rawText) return { items: [] };

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { items: [] };

  const isTsv = lines.some(l => l.includes('\t'));
  const isCsv = !isTsv && lines.some(l => l.includes(','));

  const rows = lines.map(line => {
    if (isTsv) {
      return line.split('\t').map(c => c.trim());
    } else if (isCsv) {
      return line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    } else {
      // 2개 이상의 공백 또는 탭으로 구분
      return line.split(/\s{2,}|\t/).map(c => c.trim());
    }
  });

  return extractItemsFromRows(rows, sourceName);
}

/**
 * 행렬(2D Array) 데이터에서 견적 테이블 헤더 및 데이터 행 추출
 */
function extractItemsFromRows(rows, sourceName = '') {
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
        tempMap.name = idx;
        hasName = true;
      } else if (/^(규격|사양|크기|사이즈)$/.test(val)) {
        tempMap.spec = idx;
        hasOther = true;
      } else if (/^(페이지|면수|쪽|쪽수|p)$/i.test(val)) {
        tempMap.pages = idx;
        hasOther = true;
      } else if (/^(수량|부수)$/.test(val)) {
        tempMap.quantity = idx;
        hasOther = true;
      } else if (/^(단위)$/.test(val)) {
        tempMap.unit = idx;
        hasOther = true;
      } else if (/^(단가|단가\(원\))$/.test(val)) {
        tempMap.unit_price = idx;
        hasOther = true;
      } else if (/^(금액|공급가액|공급가|합계금액)$/.test(val)) {
        tempMap.amount = idx;
        hasOther = true;
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
    if (/^(소계|합계|합계금액|총계|총합계|부가세|부가가치세|세액|결제조건|유효기간|견적조건)$/.test(firstCell)) {
      break;
    }

    const name = String(row[colMap.name] || '').trim();
    if (!name || name === '0' || name === '-' || name.toLowerCase() === 'null') continue;

    const spec = colMap.spec !== -1 ? String(row[colMap.spec] || '').trim() : '';
    const pages = colMap.pages !== -1 && row[colMap.pages] !== undefined ? String(row[colMap.pages]).replace(/[^0-9]/g, '') : '';
    const quantity = colMap.quantity !== -1 && row[colMap.quantity] !== undefined
      ? Number(String(row[colMap.quantity]).replace(/[^0-9]/g, '')) || 1
      : 1;
    const unit = colMap.unit !== -1 ? String(row[colMap.unit] || '').trim() : (pages ? '부' : '식');
    
    let unit_price = colMap.unit_price !== -1 ? Number(String(row[colMap.unit_price] || '0').replace(/[^0-9.-]/g, '')) || 0 : 0;
    let amount = colMap.amount !== -1 && row[colMap.amount] !== undefined
      ? Number(String(row[colMap.amount]).replace(/[^0-9.-]/g, '')) || 0
      : 0;

    // 단가 또는 금액 상호 보완
    if (amount === 0 && unit_price > 0) {
      amount = pages ? Number(pages) * quantity * unit_price : quantity * unit_price;
    } else if (unit_price === 0 && amount > 0 && quantity > 0) {
      unit_price = pages && Number(pages) > 0 ? Math.round(amount / (Number(pages) * quantity)) : Math.round(amount / quantity);
    }

    const note = colMap.note !== -1 ? String(row[colMap.note] || '').trim() : '';

    items.push({
      id: `imported-item-${Date.now()}-${r}`,
      name,
      spec,
      pages,
      quantity,
      unit,
      unit_price,
      amount,
      note,
    });
  }

  return { items, sourceName };
}
