// src/components/common/QuotePrintModal.jsx
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { X, Download, Printer, FileText, Stamp, CheckCircle2, ChevronRight, Layers, TableProperties, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { getLocalDateStr } from '../../utils/dateUtils';
import { COMPANY_SUPPLIERS, getCompanySupplierById } from '../../data/companySuppliers';
import { calculateSupplierQuote, calculateComparativeSummary } from '../../utils/quoteCalculations';

// 7개 회사별 템플릿 및 종합비교대조표 컴포넌트 임포트
import TemplateKyungsung from '../quoteTemplates/TemplateKyungsung';
import TemplateKSSensation from '../quoteTemplates/TemplateKSSensation';
import TemplateTheSeoul from '../quoteTemplates/TemplateTheSeoul';
import TemplateHappyTree from '../quoteTemplates/TemplateHappyTree';
import TemplateSpacePlan from '../quoteTemplates/TemplateSpacePlan';
import TemplateKSDesign from '../quoteTemplates/TemplateKSDesign';
import TemplateHappyDream from '../quoteTemplates/TemplateHappyDream';
import TemplateComparisonTable from '../quoteTemplates/TemplateComparisonTable';

// 회사별 도장/로고 localStorage 키 헬퍼
const stampKey = (id) => `company_stamp_${id}`;
const logoKey = (id) => `company_logo_${id}`;

// 모든 회사 도장/로고를 localStorage에서 로드
function loadAllStamps() {
  const m = {};
  COMPANY_SUPPLIERS.forEach((s) => {
    m[s.id] = localStorage.getItem(stampKey(s.id)) || null;
  });
  return m;
}
function loadAllLogos() {
  const m = {};
  COMPANY_SUPPLIERS.forEach((s) => {
    m[s.id] = localStorage.getItem(logoKey(s.id)) || null;
  });
  return m;
}

export default function QuotePrintModal({ quote, customer, onClose }) {
  const { user } = useGoogleAuth();
  const printRef = useRef();

  // 1: 경성문화사, 2: 케이에스센세이션, ..., 7: 행복드림, 'comparison': 종합비교대조표
  const [selectedTab, setSelectedTab] = useState(() => quote?.supplier_id || 1);

  // 회사별 도장 맵 { 1: base64|null, 2: ... }
  const [stampMap, setStampMap] = useState(loadAllStamps);
  // 회사별 로고 맵 { 1: base64|null, 2: ... }
  const [logoMap, setLogoMap] = useState(loadAllLogos);

  // 도장 관리 패널 토글
  const [showAssetPanel, setShowAssetPanel] = useState(false);

  const stampFileRef = useRef();
  const logoFileRef = useRef();

  // 현재 선택된 회사 도장/로고
  const currentStamp = selectedTab !== 'comparison' ? (stampMap[selectedTab] || null) : null;
  const currentLogo = selectedTab !== 'comparison' ? (logoMap[selectedTab] || null) : null;

  // 도장 업로드 (현재 선택된 회사에만 저장)
  const handleStampUpload = (e) => {
    const file = e.target.files[0];
    if (!file || selectedTab === 'comparison') return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      localStorage.setItem(stampKey(selectedTab), base64);
      setStampMap((prev) => ({ ...prev, [selectedTab]: base64 }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 로고 업로드 (현재 선택된 회사에만 저장)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || selectedTab === 'comparison') return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      localStorage.setItem(logoKey(selectedTab), base64);
      setLogoMap((prev) => ({ ...prev, [selectedTab]: base64 }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 도장 삭제
  const clearStamp = (id) => {
    localStorage.removeItem(stampKey(id));
    setStampMap((prev) => ({ ...prev, [id]: null }));
  };

  // 로고 삭제
  const clearLogo = (id) => {
    localStorage.removeItem(logoKey(id));
    setLogoMap((prev) => ({ ...prev, [id]: null }));
  };

  if (!quote) return null;

  const today = quote.estimate_date || quote.reg_date || getLocalDateStr();
  const todayKorean = `${today.split('-')[0]}년 ${Number(today.split('-')[1])}월 ${Number(today.split('-')[2])}일`;

  const custName = customer?.name || quote.customer_name || '거래처';
  const custDept = quote.dept || customer?.dept || '';
  const managerName = quote.sales_manager || quote.manager_name || user?.userName || user?.name || (user?.email ? user.email.split('@')[0] : '담당자');
  const estimateType = quote.estimate_type || 'print';

  // 품목 목록 파싱
  const parsedItems = useMemo(() => {
    if (Array.isArray(quote.estimate_items) && quote.estimate_items.length > 0) return quote.estimate_items;
    if (typeof quote.estimate_items === 'string' && quote.estimate_items.startsWith('[')) {
      try {
        const parsed = JSON.parse(quote.estimate_items);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        name: quote.title || '작업명',
        spec: quote.spec || '-',
        pages: 1,
        quantity: 1,
        unit: estimateType === 'print' ? '부' : '식',
        unit_price: quote.supply_price || 0,
        amount: quote.supply_price || 0,
        note: '',
      }
    ];
  }, [quote, estimateType]);

  // 현재 선택된 공급사
  const currentSupplier = useMemo(() => {
    if (selectedTab === 'comparison') return null;
    return getCompanySupplierById(selectedTab);
  }, [selectedTab]);

  // 현재 선택된 공급사의 계산 데이터
  const calcData = useMemo(() => {
    if (!currentSupplier) return null;
    return calculateSupplierQuote(parsedItems, currentSupplier, estimateType, quote);
  }, [parsedItems, currentSupplier, estimateType, quote]);

  // 7개사 전체 비교대조 데이터
  const summaryData = useMemo(() => {
    return calculateComparativeSummary(parsedItems, COMPANY_SUPPLIERS, estimateType, quote);
  }, [parsedItems, estimateType, quote]);

  // 엑셀 다운로드
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (selectedTab === 'comparison') {
      const fileName = `종합비교대조표_${custName}_${quote.title}_${today}.xlsx`;
      const rows = [
        [`■ 종합 견적 비교대조표 (7개사 총괄) - ${quote.title}`],
        [`수요기관: ${custName}`, '', `견적일자: ${todayKorean}`, '', `결제조건: ${quote.payment_terms || '검수 후 익월말 현금'}`],
        [],
        ['[ 1. 공급사별 총 견적금액 집계 및 비교 (VAT 포함) ]'],
        ['순번', '구분', '공급사명 (상호)', '대표자', '사업자등록번호', '공급가액 (소계)', '부가가치세 (10%)', '총 견적금액 (합계)', '당사 대비 차액', '당사 대비 비율', '기업 특성 및 비고'],
        ...summaryData.map((row, idx) => [
          idx + 1,
          idx === 0 ? '1_당사' : row.supplier.code,
          row.supplier.name,
          row.supplier.ceo,
          row.supplier.bizNum,
          row.supplyPrice,
          row.taxPrice,
          row.totalPrice,
          idx === 0 ? 0 : row.diff,
          idx === 0 ? '100%' : `${Math.round(row.ratio * 100)}%`,
          `${row.supplier.tag} ${row.supplier.certTag ? `(${row.supplier.certTag})` : ''}`,
        ]),
        [],
        ['[ 2. 품목별 세부 견적 단가 비교 (VAT 별도) ]'],
        ['순번', '품명', '규격', '수량', ...COMPANY_SUPPLIERS.map(s => s.shortName)],
        ...parsedItems.map((it, itemIdx) => [
          itemIdx + 1,
          it.name || quote.title,
          it.spec || '-',
          it.quantity || 1,
          ...summaryData.map(s => s.items[itemIdx]?.unit_price || 0),
        ]),
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, '종합비교대조표');
      XLSX.writeFile(workbook, fileName);
    } else {
      const fileName = `견적서_${currentSupplier.shortName}_${custName}_${quote.title}_${today}.xlsx`;
      const rows = [
        ['견  적  서', '', '', '', '', '', ''],
        [],
        [`${custName} ${custDept}`.trim(), '貴中', '', currentSupplier.name, '', `사업자번호: ${currentSupplier.bizNum} / 대표: ${currentSupplier.ceo}`],
        ['담당자', quote.client_contact_person || quote.contact_person || customer?.contact_person || '-', '', '주소', '', currentSupplier.address],
        ['작성자', currentSupplier.contactPerson || managerName, '', '전화/팩스', '', `전화: ${currentSupplier.phone} / 팩스: ${currentSupplier.fax}`],
        ['작성일', todayKorean, '', 'e-mail', '', currentSupplier.email],
        ['품  명', quote.title || '-', '', '', '', ''],
        ['금  액', `일금 ${calcData.koreanTotalPrice} 원정`, '', '', `₩ ${calcData.totalPrice.toLocaleString()} (단위:원/VAT포함)`, ''],
        [],
        ['순번', '품명', '규격', '페이지', '수량', '단가', '공급가액', '비고'],
        ...calcData.items.map((it, idx) => [
          idx + 1,
          it.name || quote.title,
          it.spec || '-',
          it.pages || 1,
          it.quantity || 1,
          it.unit_price || 0,
          it.amount || 0,
          it.note || '',
        ]),
        [],
        ['', '', '', '', '공 급 가 액', calcData.supplyPrice],
        ['', '', '', '', '부 가 세', calcData.taxPrice],
        ['', '', '', '', '합 계 금 액', calcData.totalPrice],
        ['특이사항', quote.estimate_note || '검수 후 계좌입금'],
        ['결제계좌', currentSupplier.bank || '-'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, `${currentSupplier.shortName}_견적서`);
      XLSX.writeFile(workbook, fileName);
    }
  };

  // 인쇄 및 PDF 저장 핸들러
  const handlePrint = () => {
    const yymmdd = today.split('-').map((v, i) => i === 0 ? v.slice(2) : v).join('');
    const docName = selectedTab === 'comparison'
      ? `${yymmdd} ${custName} 종합비교대조표 ${quote.title || '품명'}`
      : `${yymmdd} ${custName} ${currentSupplier.shortName} ${quote.title || '품명'} 견적서`;

    const originalTitle = document.title;
    document.title = docName;

    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 50);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* ── 1. 모달 상단 툴바 (화면 전용, 인쇄 시 숨김) ── */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 print:hidden flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                공식 견적서 인쇄 및 내보내기
              </h3>
              <span className="text-xs text-slate-500 hidden md:inline">
                (7개 회사 고유 양식 &amp; 관공서 비교대조표)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* 직인/로고 관리 버튼 */}
              <button
                onClick={() => setShowAssetPanel((v) => !v)}
                className={`flex items-center space-x-1 text-[11px] px-2.5 py-1.5 rounded-lg font-bold border transition ${
                  showAssetPanel
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
                title="회사별 직인 / 로고 관리"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>직인/로고 관리</span>
                {selectedTab !== 'comparison' && currentStamp && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="직인 등록됨" />
                )}
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>엑셀 다운로드</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>인쇄 / PDF 저장</span>
              </button>

              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── 직인/로고 관리 패널 (토글) ── */}
          {showAssetPanel && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
              <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center space-x-1">
                <Stamp className="w-3.5 h-3.5 text-rose-500" />
                <span>회사별 직인 &amp; 로고 개별 관리 (회사 탭을 선택 후 업로드하세요)</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {COMPANY_SUPPLIERS.map((s) => {
                  const sStamp = stampMap[s.id];
                  const sLogo = logoMap[s.id];
                  const isCurrentTab = selectedTab === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-2 text-center text-[10px] space-y-1.5 transition ${
                        isCurrentTab ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className={`font-bold truncate ${isCurrentTab ? 'text-sky-700' : 'text-slate-600'}`}>
                        {s.shortName}
                      </div>

                      {/* 직인 */}
                      <div className="space-y-1">
                        <div className="text-slate-400 font-semibold">직인</div>
                        {sStamp ? (
                          <div className="flex flex-col items-center space-y-1">
                            <img src={sStamp} alt="직인" className="w-10 h-10 object-contain rounded border border-slate-200" />
                            <button
                              onClick={() => clearStamp(s.id)}
                              className="text-rose-500 hover:text-rose-700 text-[9px] font-bold"
                              title="직인 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label
                            className={`cursor-pointer flex flex-col items-center py-1 rounded border border-dashed text-slate-400 hover:border-sky-400 hover:text-sky-600 transition ${
                              isCurrentTab ? 'border-sky-300 text-sky-500' : 'border-slate-300'
                            }`}
                            title={`${s.shortName} 직인 등록`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const base64 = ev.target.result;
                                  localStorage.setItem(stampKey(s.id), base64);
                                  setStampMap((prev) => ({ ...prev, [s.id]: base64 }));
                                };
                                reader.readAsDataURL(file);
                                e.target.value = '';
                              }}
                            />
                            <Upload className="w-3.5 h-3.5" />
                            <span className="text-[9px]">등록</span>
                          </label>
                        )}
                      </div>

                      {/* 로고 */}
                      <div className="space-y-1">
                        <div className="text-slate-400 font-semibold">로고</div>
                        {sLogo ? (
                          <div className="flex flex-col items-center space-y-1">
                            <img src={sLogo} alt="로고" className="w-12 h-6 object-contain rounded border border-slate-200" />
                            <button
                              onClick={() => clearLogo(s.id)}
                              className="text-rose-500 hover:text-rose-700 text-[9px] font-bold"
                              title="로고 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label
                            className={`cursor-pointer flex flex-col items-center py-1 rounded border border-dashed text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition ${
                              isCurrentTab ? 'border-emerald-300 text-emerald-500' : 'border-slate-300'
                            }`}
                            title={`${s.shortName} 로고 등록`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const base64 = ev.target.result;
                                  localStorage.setItem(logoKey(s.id), base64);
                                  setLogoMap((prev) => ({ ...prev, [s.id]: base64 }));
                                };
                                reader.readAsDataURL(file);
                                e.target.value = '';
                              }}
                            />
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="text-[9px]">등록</span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 7개 회사 선택 탭 및 종합비교대조표 토글 바 ── */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-500 flex-shrink-0 mr-1 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1" />
              발행 양식 선택:
            </span>

            {COMPANY_SUPPLIERS.map((s) => {
              const isActive = selectedTab === s.id;
              const hasStamp = !!stampMap[s.id];
              return (
                <button
                  key={`tab-${s.id}`}
                  onClick={() => setSelectedTab(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>{s.shortName}</span>
                  {s.id === 1 ? (
                    <span className="text-[10px] bg-sky-500 text-white px-1 rounded ml-1">당사</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">+{Math.round((s.rate - 1) * 100)}%</span>
                  )}
                  {hasStamp && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" title="직인 등록됨" />
                  )}
                </button>
              );
            })}

            <div className="h-5 w-[1px] bg-slate-300 mx-1 flex-shrink-0" />

            {/* 종합 비교대조표 탭 */}
            <button
              onClick={() => setSelectedTab('comparison')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition flex items-center space-x-1 ${
                selectedTab === 'comparison'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5 mr-1" />
              <span>종합 비교대조표 (관공서용)</span>
            </button>
          </div>
        </div>

        {/* ── 2. 견적서 본문 영역 (선택된 회사의 구글시트 고유 디자인 100% 렌더링) ── */}
        <div
          id="printable-quote-document"
          ref={printRef}
          className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
        >
          {selectedTab === 'comparison' ? (
            <TemplateComparisonTable
              quote={quote}
              customer={customer}
              suppliers={COMPANY_SUPPLIERS}
              summaryData={summaryData}
              todayKorean={todayKorean}
            />
          ) : selectedTab === 1 ? (
            <TemplateKyungsung
              quote={quote}
              customer={customer}
              supplier={currentSupplier}
              calcData={calcData}
              todayKorean={todayKorean}
              managerName={managerName}
              stampImage={stampMap[1]}
              logoImage={logoMap[1]}
            />
          ) : selectedTab === 2 ? (
            <TemplateKSSensation
              quote={quote}
              customer={customer}
              supplier={currentSupplier}
              calcData={calcData}
              todayKorean={todayKorean}
              managerName={managerName}
              stampImage={stampMap[2]}
              logoImage={logoMap[2]}
            />
          ) : selectedTab === 3 ? (
            <TemplateTheSeoul
              quote={quote}
              customer={customer}
              supplier={currentSupplier}
              calcData={calcData}
              todayKorean={todayKorean}
              managerName={managerName}
              stampImage={stampMap[3]}
              logoImage={logoMap[3]}
            />
          ) : selectedTab === 4 ? (
            <TemplateHappyTree
              quote={quote}
              customer={customer}
              supplier={currentSupplier}
              calcData={calcData}
              todayKorean={todayKorean}
              managerName={managerName}
              stampImage={stampMap[4]}
              logoImage={logoMap[4]}
            />
          ) : selectedTab === 5 ? (
            <TemplateSpacePlan
              quote={quote}
              customer={customer}
              supplier={currentSupplier}
              calcData={calcData}
              todayKorean={todayKorean}
              managerName={managerName}
              stampImage={stampMap[5]}
              logoImage={logoMap[5]}
            />
          ) : selectedTab === 6 ? (
            <TemplateKSDesign
              quote={quote}
              customer={customer}
              supplier={currentSupplier}
              calcData={calcData}
              todayKorean={todayKorean}
              managerName={managerName}
              stampImage={stampMap[6]}
              logoImage={logoMap[6]}
            />
          ) : (
            <TemplateHappyDream
              quote={quote}
              customer={customer}
              supplier={currentSupplier}
              calcData={calcData}
              todayKorean={todayKorean}
              managerName={managerName}
              stampImage={stampMap[7]}
              logoImage={logoMap[7]}
            />
          )}
        </div>

      </div>
    </div>
  );
}
