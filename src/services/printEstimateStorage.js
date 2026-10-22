// src/services/printEstimateStorage.js
import * as XLSX from 'xlsx';
import {
  DEFAULT_PAPERS,
  DEFAULT_PROCESSES,
  DEFAULT_STD_PRICES,
} from '../utils/printCalculators/defaultMasterData';

const STORAGE_KEYS = {
  ESTIMATES: 'pe_estimates_v1',
  PAPERS: 'pe_papers_v1',
  PROCESSES: 'pe_processes_v1',
  STD_PRICES: 'pe_std_prices_v1',
};

// ─── 견적서 CRUD & 버전 관리 ───────────────────────────────────

export function getEstimates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ESTIMATES);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to load estimates:', e);
    return [];
  }
}

export function saveEstimate(data) {
  const list = getEstimates();
  const now = new Date().toISOString();

  let savedItem = null;

  if (data.id) {
    // 기존 견적서 업데이트
    const idx = list.findIndex(e => e.id === data.id);
    if (idx !== -1) {
      savedItem = {
        ...list[idx],
        ...data,
        updatedAt: now,
      };
      list[idx] = savedItem;
    }
  }

  if (!savedItem) {
    // 신규 생성
    const year = new Date().getFullYear().toString().slice(2);
    const count = list.length + 1;
    const estimateNo = data.estimateNo || `EST-${year}${String(count).padStart(4, '0')}`;
    const groupId = data.groupId || `GRP-${Date.now()}`;

    savedItem = {
      ...data,
      id: `est_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      groupId,
      estimateNo,
      version: data.version || 1,
      isFinal: data.isFinal || false,
      status: data.status || '작성중',
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(savedItem);
  }

  localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(list));
  return savedItem;
}

export function createEstimateVersion(parentEstimateId, updatedData = {}) {
  const list = getEstimates();
  const parent = list.find(e => e.id === parentEstimateId);
  if (!parent) throw new Error('Parent estimate not found');

  const now = new Date().toISOString();
  const nextVersion = (parent.version || 1) + 1;
  const newEstimateNo = `${parent.estimateNo.replace(/-V\d+$/, '')}-V${nextVersion}`;

  const newVersionItem = {
    ...parent,
    ...updatedData,
    id: `est_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    groupId: parent.groupId || parent.id,
    parentVersionId: parent.id,
    estimateNo: newEstimateNo,
    version: nextVersion,
    isFinal: false,
    status: '작성중',
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(newVersionItem);
  localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(list));
  return newVersionItem;
}

export function setFinalEstimate(estimateId) {
  const list = getEstimates();
  const target = list.find(e => e.id === estimateId);
  if (!target) return null;

  const targetGroupId = target.groupId || target.id;
  list.forEach(e => {
    if ((e.groupId || e.id) === targetGroupId) {
      e.isFinal = e.id === estimateId;
      if (e.id === estimateId) {
        e.status = '확정';
      }
    }
  });

  localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(list));
  return target;
}

export function deleteEstimate(estimateId) {
  const list = getEstimates();
  const next = list.filter(e => e.id !== estimateId);
  localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(next));
  return true;
}

// ─── 마스터 데이터 관리 (용지, 공정, 표준단가) ──────────────────

export function getMasterPapers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAPERS);
    if (!raw) return DEFAULT_PAPERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PAPERS;
  } catch (e) {
    return DEFAULT_PAPERS;
  }
}

export function saveMasterPaper(paper) {
  const papers = getMasterPapers();
  if (paper.id) {
    const idx = papers.findIndex(p => p.id === paper.id);
    if (idx !== -1) papers[idx] = { ...papers[idx], ...paper };
    else papers.push(paper);
  } else {
    papers.push({ ...paper, id: `P_${Date.now()}` });
  }
  localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
  return papers;
}

export function deleteMasterPaper(paperId) {
  const papers = getMasterPapers().filter(p => p.id !== paperId);
  localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
  return papers;
}

export function getMasterProcesses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROCESSES);
    if (!raw) return DEFAULT_PROCESSES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROCESSES;
  } catch (e) {
    return DEFAULT_PROCESSES;
  }
}

export function saveMasterProcess(processItem) {
  const procs = getMasterProcesses();
  if (processItem.id) {
    const idx = procs.findIndex(p => p.id === processItem.id);
    if (idx !== -1) procs[idx] = { ...procs[idx], ...processItem };
    else procs.push(processItem);
  } else {
    procs.push({ ...processItem, id: `PR_${Date.now()}` });
  }
  localStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(procs));
  return procs;
}

export function deleteMasterProcess(processId) {
  const procs = getMasterProcesses().filter(p => p.id !== processId);
  localStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(procs));
  return procs;
}

export function getMasterStdPrices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STD_PRICES);
    if (!raw) return DEFAULT_STD_PRICES;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : DEFAULT_STD_PRICES;
  } catch (e) {
    return DEFAULT_STD_PRICES;
  }
}

export function saveMasterStdPrices(newPrices) {
  localStorage.setItem(STORAGE_KEYS.STD_PRICES, JSON.stringify(newPrices));
  return newPrices;
}

export function resetMasterDataToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.PAPERS);
  localStorage.removeItem(STORAGE_KEYS.PROCESSES);
  localStorage.removeItem(STORAGE_KEYS.STD_PRICES);
  return {
    papers: DEFAULT_PAPERS,
    processes: DEFAULT_PROCESSES,
    stdPrices: DEFAULT_STD_PRICES,
  };
}

// ─── 엑셀 내보내기 ──────────────────────────────────────────

export function exportEstimatesToExcel(estimates = []) {
  const rows = estimates.map((item, index) => ({
    'No': index + 1,
    '견적번호': item.estimateNo || '',
    '계산모드': item.costingMode === 'GOVERNMENT' ? '조달청 공공 표준원가' : '사기업 실무견적',
    '버전': `${item.version || 1}차${item.isFinal ? ' (최종확정)' : ''}`,
    '거래처명': item.clientName ? `${item.clientName}${item.clientDept ? ` (${item.clientDept})` : ''}` : '',
    '담당자': item.contactName || '',
    '품명': item.productName || '',
    '규격': `${item.sizeWidth || 0}×${item.sizeHeight || 0}mm (${item.paperCut || '국16절'})`,
    '수량': `${(item.quantity || 0).toLocaleString()} ${item.unit || '부'}`,
    '페이지': `${item.pages || 0}p`,
    '색도': item.colors || '4도/4도',
    '제본': item.bindingType || '무선제본',
    '공급가액': item.subtotal || 0,
    '부가세': item.vat || 0,
    '총 견적액': item.totalAmount || 0,
    '부당 단가': item.unitPrice || 0,
    '상태': item.status || '작성중',
    '작성일': item.createdAt ? item.createdAt.slice(0, 10) : '',
    '작성자': item.authorName || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
    { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 8 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
    { wch: 10 }, { wch: 12 }, { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '견적목록');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `인쇄견적목록_${dateStr}.xlsx`);
}

export function exportEstimateDetailToExcel(estimate) {
  const workbook = XLSX.utils.book_new();

  // 1. 기본 정보 시트
  const summaryRows = [
    ['인쇄 견적서'],
    [],
    ['견적번호', estimate.estimateNo, '작성일자', estimate.createdAt ? estimate.createdAt.slice(0, 10) : ''],
    ['계산모드', estimate.costingMode === 'GOVERNMENT' ? '조달청 공공 표준원가' : '사기업 실무견적', '버전', `${estimate.version || 1}차${estimate.isFinal ? ' (최종)' : ''}`],
    ['거래처명', estimate.clientName ? `${estimate.clientName}${estimate.clientDept ? ` (${estimate.clientDept})` : ''}` : '', '담당자', estimate.contactName || ''],
    ['품명', estimate.productName, '제본방식', estimate.bindingType || ''],
    ['수량', `${(estimate.quantity || 0).toLocaleString()} ${estimate.unit || '부'}`, '부당 단가', `${(estimate.unitPrice || 0).toLocaleString()}원`],
    ['규격', `${estimate.sizeWidth || 0}×${estimate.sizeHeight || 0}mm`, '절수', estimate.paperCut || ''],
    ['페이지', `${estimate.pages || 0}면`, '색도', estimate.colors || ''],
    ['용지종류', estimate.paperType || '', '비고', estimate.notes || ''],
    [],
    ['공급가액', estimate.subtotal || 0],
    ['부가가치세 (10%)', estimate.vat || 0],
    ['총 견적금액', estimate.totalAmount || 0],
    [],
    ['비고/특이사항', estimate.notes || ''],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, '견적요약');

  // 2. 공정별 세부 항목 시트
  const itemRows = [
    ['구분', '공정/항목명', '규격/세부사양', '수량', '단위', '단가', '금액', '산출식'],
  ];

  if (Array.isArray(estimate.items) && estimate.items.length > 0) {
    estimate.items.forEach(it => {
      itemRows.push([
        it.category || '',
        it.name || '',
        it.spec || '',
        it.quantity || 0,
        it.unit || '',
        it.unitPrice || 0,
        it.amount || 0,
        it.formula || '',
      ]);
    });
  }

  const detailSheet = XLSX.utils.aoa_to_sheet(itemRows);
  detailSheet['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
    { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(workbook, detailSheet, '공정세부내역');

  const cleanNo = (estimate.estimateNo || '견적서').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  XLSX.writeFile(workbook, `견적서_${cleanNo}.xlsx`);
}
