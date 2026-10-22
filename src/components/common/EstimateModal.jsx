// src/components/common/EstimateModal.jsx
import React, { useState } from 'react';
import { X, Plus, Trash2, Calculator, Printer, Save, FileText, CheckCircle2, Layers, BookOpen, Package, Building2, Scissors, Upload, FileSpreadsheet, Sparkles, ChevronDown, RefreshCw, Globe, AlertTriangle } from 'lucide-react';
import { getLocalDateStr } from '../../utils/dateUtils';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { COMPANY_SUPPLIERS } from '../../data/companySuppliers';
import { parseEstimateFile, parseEstimateClipboardText, parseSheetFromWorkbook } from '../../utils/estimateExcelParser';
import { generateEstimateSummary, serializeEstimateItemsForSheet, cleanExpiredEstimateDrafts } from '../../utils/estimateSummaryHelper';

export default function EstimateModal({ sale, customer, onClose, onSave, onPrint }) {
  const { toggleCalc, showCalc } = useData();
  const { toast } = useToast();
  if (!sale) return null;

  const todayStr = getLocalDateStr();

  const draftKey = `estimate_draft_${sale.code_number || sale.id}`;

  // 모달 진입 시 만료된 오래된 드래프트(14일 경과) 자동 청소
  React.useEffect(() => {
    cleanExpiredEstimateDrafts(14);
  }, []);

  // 로컬 드래프트 복원 헬퍼
  const loadSavedDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };
  const savedDraft = loadSavedDraft();

  // 💡 동시성 제어 (Conflict Resolution) 타임스탬프 계산
  const parseTimestamp = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).trim();
    if (!str) return 0;
    const isoStr = str.includes('T') ? str : str.replace(' ', 'T');
    const t = new Date(isoStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  const dbTimestamp = parseTimestamp(sale.updated_at || sale.created_at);
  const draftTimestamp = savedDraft?.updatedAt ? Number(savedDraft.updatedAt) : 0;

  // 💡 DB의 updated_at이 로컬 캐시보다 최신인 경우:
  // 다른 PC나 모바일에서 저장된 최신 DB 데이터가 존재하므로 오래된 로컬 캐시를 무시하고 최신 DB를 우선 적용(Stale Data 방지)
  const isDbNewer = dbTimestamp > 0 && draftTimestamp > 0 && dbTimestamp > draftTimestamp;
  const isDraftValidAndNewer = !!savedDraft && !isDbNewer;

  const [syncStatus, setSyncStatus] = useState(
    isDbNewer
      ? 'SYNCED_FROM_DB'
      : (isDraftValidAndNewer ? 'RESTORED_FROM_LOCAL_DRAFT' : null)
  );

  // 발행 회사 선택 (기본: 1_당사 주식회사 경성문화사)
  const [supplierId, setSupplierId] = useState(
    isDraftValidAndNewer ? (savedDraft?.supplierId || sale.supplier_id || 1) : (sale.supplier_id || 1)
  );

  // 기존에 저장된 estimate_type이 있으면 불러오고 없으면 기본 'print' (인쇄제작형)
  const [estimateType, setEstimateType] = useState(
    isDraftValidAndNewer ? (savedDraft?.estimateType || sale.estimate_type || 'print') : (sale.estimate_type || 'print')
  );

  // DB에 저장된 품목 파싱 헬퍼
  const parseDbItems = () => {
    if (Array.isArray(sale.estimate_items) && sale.estimate_items.length > 0) {
      return sale.estimate_items.map(it => ({
        ...it,
        pages: it.pages !== undefined ? it.pages : '',
        quantity: it.quantity !== undefined ? it.quantity : 1,
        unit: it.unit || (sale.estimate_type === 'general' ? '식' : '부'),
      }));
    }
    if (typeof sale.estimate_items === 'string' && sale.estimate_items.startsWith('[')) {
      try {
        const parsed = JSON.parse(sale.estimate_items);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(it => ({
            ...it,
            pages: it.pages !== undefined ? it.pages : '',
            quantity: it.quantity !== undefined ? it.quantity : 1,
            unit: it.unit || (sale.estimate_type === 'general' ? '식' : '부'),
          }));
        }
      } catch (e) {}
    }
    return null;
  };

  // 기존에 저장된 estimate_items가 있으면 파싱하거나 로컬 드래프트 또는 특수 복원 행 생성
  const getInitialItems = () => {
    // 1. 만약 다른 기기에서 저장된 최신 DB 데이터가 있다면 최우선 적용 (동시성 보호)
    if (isDbNewer) {
      const fromDb = parseDbItems();
      if (fromDb && fromDb.length > 0) return fromDb;
    }

    // 2. 이 기기에서 작업 중이던 최신 드래프트가 있다면 복원
    if (isDraftValidAndNewer && savedDraft?.items && Array.isArray(savedDraft.items) && savedDraft.items.length > 0) {
      return savedDraft.items;
    }

    // 3. DB에 저장된 품목이 있다면 적용
    const fromDb = parseDbItems();
    if (fromDb && fromDb.length > 0) return fromDb;

    // 4. 기본 초기 행 (기존 작업명 및 공급가액 반영)
    return [
      {
        id: 'item-1',
        name: sale.title || '작업 품목',
        spec: sale.spec || '',
        pages: '',
        quantity: 1,
        unit: '부',
        unit_price: Number(sale.supply_price) || 0,
        amount: Number(sale.supply_price) || 0,
        note: '',
      }
    ];
  };

  const [items, setItems] = useState(getInitialItems());
  const [includeVat, setIncludeVat] = useState(
    isDraftValidAndNewer && savedDraft?.includeVat !== undefined ? savedDraft.includeVat : true
  );
  const [estimateDate, setEstimateDate] = useState(
    isDraftValidAndNewer && savedDraft?.estimateDate ? savedDraft.estimateDate : (sale.estimate_date || sale.reg_date || todayStr)
  );
  const [validDays, setValidDays] = useState(
    isDraftValidAndNewer && savedDraft?.validDays !== undefined ? savedDraft.validDays : (sale.valid_days || '')
  );
  const [paymentTerms, setPaymentTerms] = useState(
    isDraftValidAndNewer && savedDraft?.paymentTerms !== undefined ? savedDraft.paymentTerms : (sale.payment_terms || '')
  );
  const [estimateNote, setEstimateNote] = useState(
    isDraftValidAndNewer && savedDraft?.estimateNote !== undefined ? savedDraft.estimateNote : (sale.estimate_note || '')
  );
  const [saving, setSaving] = useState(false);

  // 💡 담당자 정보:
  const explicitContactPerson = sale.client_contact_person !== undefined
    ? sale.client_contact_person
    : (sale.contact_person !== undefined ? sale.contact_person : null);

  const initialContactPerson = explicitContactPerson !== null
    ? explicitContactPerson
    : (customer?.contact_person || '');

  const initialContactPhone = sale.client_phone || sale.phone || customer?.phone || customer?.mobile || '';

  const initialContactEmail = sale.client_email || sale.email || customer?.email || '';

  // 💡 견적서에 담당자 표기 여부 (체크 해제 시 견적서에 담당자명 인쇄/표기 제외)
  // D1 DB의 show_contact_on_estimate 영구 컬럼과 양방향 연동
  const initialShowContact = isDraftValidAndNewer && savedDraft?.showContactPerson !== undefined
    ? savedDraft.showContactPerson
    : (sale.show_contact_on_estimate !== undefined
        ? (sale.show_contact_on_estimate === 1 || sale.show_contact_on_estimate === true)
        : (sale.hide_contact_person !== undefined ? !sale.hide_contact_person : true));

  const [showContactPerson, setShowContactPerson] = useState(initialShowContact);
  const [contactPerson, setContactPerson] = useState(
    isDraftValidAndNewer && savedDraft?.contactPerson !== undefined ? savedDraft.contactPerson : initialContactPerson
  );
  const [contactPhone, setContactPhone] = useState(
    isDraftValidAndNewer && savedDraft?.contactPhone !== undefined ? savedDraft.contactPhone : initialContactPhone
  );
  const [contactEmail, setContactEmail] = useState(
    isDraftValidAndNewer && savedDraft?.contactEmail !== undefined ? savedDraft.contactEmail : initialContactEmail
  );

  // 💡 공급가액 절사 단위
  const defaultDiscountUnit = 0;
  const [discountUnit, setDiscountUnit] = useState(
    isDraftValidAndNewer && savedDraft?.discountUnit !== undefined
      ? savedDraft.discountUnit
      : (sale.discount_unit !== undefined ? sale.discount_unit : defaultDiscountUnit)
  );
  const [customSupplyPrice, setCustomSupplyPrice] = useState(
    isDraftValidAndNewer && savedDraft?.customSupplyPrice !== undefined ? savedDraft.customSupplyPrice : (sale.custom_supply_price || '')
  );
  const [isExcelDragging, setIsExcelDragging] = useState(false);
  const [excelImporting, setExcelImporting] = useState(false);
  const excelFileInputRef = React.useRef(null);

  // 💡 서버 원본 데이터로 강제 롤백 (임시작성본 취소) 핸들러
  const handleRevertToDb = () => {
    if (confirm('로컬 임시 작성본을 버리고 서버(DB)에 저장된 원본 데이터로 되돌리시겠습니까?')) {
      localStorage.removeItem(draftKey);
      const dbItems = parseDbItems();
      if (dbItems && dbItems.length > 0) {
        setItems(dbItems);
      } else {
        setItems([
          {
            id: 'item-1',
            name: sale.title || '작업 품목',
            spec: sale.spec || '',
            pages: '',
            quantity: 1,
            unit: '부',
            unit_price: Number(sale.supply_price) || 0,
            amount: Number(sale.supply_price) || 0,
            note: '',
          }
        ]);
      }
      setSupplierId(sale.supplier_id || 1);
      setEstimateType(sale.estimate_type || 'print');
      setEstimateDate(sale.estimate_date || sale.reg_date || todayStr);
      setValidDays(sale.valid_days || '');
      setPaymentTerms(sale.payment_terms || '');
      setEstimateNote(sale.estimate_note || '');
      setShowContactPerson(
        sale.show_contact_on_estimate !== undefined
          ? (sale.show_contact_on_estimate === 1 || sale.show_contact_on_estimate === true)
          : (sale.hide_contact_person !== undefined ? !sale.hide_contact_person : true)
      );
      setDiscountUnit(sale.discount_unit !== undefined ? sale.discount_unit : 0);
      setCustomSupplyPrice(sale.custom_supply_price || '');
      setSyncStatus('SYNCED_FROM_DB');
      toast.info('서버의 원본 데이터로 초기화되었습니다.');
    }
  };

  // 💡 작성 중인 견적서 실시간 로컬 드래프트 보관 (새로고침, 탭 닫힘, 모달 닫힘 시에도 유실 방지)
  React.useEffect(() => {
    try {
      const draftData = {
        supplierId,
        estimateType,
        items,
        includeVat,
        estimateDate,
        validDays,
        paymentTerms,
        estimateNote,
        contactPerson,
        contactPhone,
        contactEmail,
        showContactPerson,
        discountUnit,
        customSupplyPrice,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch (e) {
      // ignore
    }
  }, [
    draftKey, supplierId, estimateType, items, includeVat, estimateDate,
    validDays, paymentTerms, estimateNote, contactPerson, contactPhone,
    contactEmail, showContactPerson, discountUnit, customSupplyPrice
  ]);

  // 시트 선택 팝업 상태
  const [sheetSelectState, setSheetSelectState] = useState(null); // { sheetNames, workbook }

  // 💡 엑셀 / 파일 견적서 처리
  const handleExcelFile = async (file) => {
    if (!file) return;
    setExcelImporting(true);
    try {
      const result = await parseEstimateFile(file);

      // 시트가 여러 개이면 선택 팝업 표시
      if (result.needSheetSelect) {
        setSheetSelectState({ sheetNames: result.sheetNames, workbook: result.workbook, fileName: file.name });
        return;
      }

      const { items: newItems, sourceName } = result;
      if (!newItems || newItems.length === 0) {
        alert('파일에서 유효한 견적 품목을 찾지 못했습니다.');
        return;
      }
      setItems(newItems);
      alert(`[${file.name || sourceName}]에서 총 ${newItems.length}개의 품목을 불러왔습니다!`);
    } catch (err) {
      alert(err.message || '견적 파일 분석 오류');
    } finally {
      setExcelImporting(false);
      if (excelFileInputRef.current) excelFileInputRef.current.value = '';
    }
  };

  // 시트 선택 확정
  const handleSheetSelected = (sheetName) => {
    if (!sheetSelectState) return;
    try {
      const { items: newItems } = parseSheetFromWorkbook(sheetSelectState.workbook, sheetName);
      if (!newItems || newItems.length === 0) {
        alert(`"${sheetName}" 시트에서 유효한 견적 품목을 찾지 못했습니다.`);
        return;
      }
      setItems(newItems);
      alert(`"${sheetName}" 시트에서 ${newItems.length}개의 품목을 불러왔습니다!`);
    } catch (err) {
      alert(err.message || '시트 파싱 오류');
    } finally {
      setSheetSelectState(null);
    }
  };

  // 💡 클립보드(Ctrl+V) 표 붙여넣기 리스너
  React.useEffect(() => {
    const handlePaste = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      const text = e.clipboardData?.getData('text');
      if (text && text.includes('\t')) {
        try {
          const { items: pastedItems } = parseEstimateClipboardText(text);
          if (pastedItems && pastedItems.length > 0) {
            setItems(pastedItems);
            alert(`붙여넣은 표에서 ${pastedItems.length}개의 품목을 자동으로 반영했습니다!`);
          }
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // 품목 항목 수정
  const handleItemChange = (index, field, value) => {
    const nextItems = [...items];
    const item = { ...nextItems[index], [field]: value };

    // 단가 또는 수량/페이지 변경 시 공급가액 자동 계산
    if (field === 'pages' || field === 'quantity' || field === 'unit_price') {
      const p = item.pages !== '' && !isNaN(Number(item.pages)) && Number(item.pages) > 0 ? Number(item.pages) : 1;
      const q = Number(item.quantity) || 0;
      const u = Number(item.unit_price) || 0;

      if (estimateType === 'print' || (item.pages !== '' && Number(item.pages) > 0)) {
        // 인쇄형: 페이지 * 부수 * 단가
        item.amount = p * q * u;
      } else {
        // 일반 물품형: 수량 * 단가
        item.amount = q * u;
      }
    }

    nextItems[index] = item;
    setItems(nextItems);
  };

  // 탭 전환 시 전체 행 공급가액 재계산
  const handleTemplateTypeChange = (newType) => {
    setEstimateType(newType);
    const updated = items.map(item => {
      const p = item.pages !== '' && !isNaN(Number(item.pages)) && Number(item.pages) > 0 ? Number(item.pages) : 1;
      const q = Number(item.quantity) || 0;
      const u = Number(item.unit_price) || 0;
      const amount = (newType === 'print' || (item.pages !== '' && Number(item.pages) > 0))
        ? p * q * u
        : q * u;
      return {
        ...item,
        unit: item.unit || (newType === 'print' ? '부' : '식'),
        amount,
      };
    });
    setItems(updated);
  };

  // 품목 행 추가
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: '',
        spec: '',
        pages: '',
        quantity: 1,
        unit: estimateType === 'print' ? '부' : '개',
        unit_price: 0,
        amount: 0,
        note: '',
      }
    ]);
  };

  // 품목 행 삭제
  const handleDeleteItem = (index) => {
    if (items.length <= 1) {
      alert('최소 1개 이상의 품목이 필요합니다.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // 💡 공급가액 및 절사(원/십/백/천/만 단위) 계산
  // discountUnit은 숫자(0/100/1000/10000) 또는 'custom' 문자열
  const rawSupplyPrice = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const finalSupplyPrice = (() => {
    if (discountUnit === 'custom') {
      const parsed = Number(customSupplyPrice);
      return !isNaN(parsed) && parsed >= 0 ? parsed : rawSupplyPrice;
    }
    // Number() 변환으로 '1000' 같은 문자열도 처리
    const unit = Number(discountUnit);
    if (unit > 0) {
      return Math.floor(rawSupplyPrice / unit) * unit;
    }
    return rawSupplyPrice;
  })();

  const discountAmount = rawSupplyPrice - finalSupplyPrice;
  const totalTax = includeVat ? Math.round(finalSupplyPrice * 0.1) : 0;
  const totalPrice = finalSupplyPrice + totalTax;
  const totalSupplyPrice = finalSupplyPrice;

  // 견적서 저장 및 매출액 반영
  const handleSave = async () => {
    try {
      setSaving(true);
      const summaryText = generateEstimateSummary(items, sale.title || '견적 품목');
      const serializedItems = serializeEstimateItemsForSheet(items);

      const updatedPayload = {
        ...sale,
        supplier_id: supplierId,
        contact_person: showContactPerson ? contactPerson : '',
        client_contact_person: showContactPerson ? contactPerson : '',
        phone: showContactPerson ? contactPhone : '',
        client_phone: showContactPerson ? contactPhone : '',
        email: contactEmail,
        client_email: contactEmail,
        show_contact_person: showContactPerson,
        hide_contact_person: !showContactPerson,
        show_contact_on_estimate: showContactPerson ? 1 : 0,
        summary_text: summaryText,
        raw_supply_price: rawSupplyPrice,
        supply_price: finalSupplyPrice,
        discount_unit: discountUnit,
        discount_amount: discountAmount,
        custom_supply_price: discountUnit === 'custom' ? customSupplyPrice : null,
        tax: totalTax,
        total_price: totalPrice,
        estimate_type: estimateType,
        estimate_date: estimateDate,
        valid_days: validDays,
        payment_terms: paymentTerms,
        estimate_note: estimateNote,
        estimate_items: serializedItems,
      };

      if (onSave) {
        await onSave(updatedPayload);
      }
      toast.success(`[${sale.code_number || sale.title || '견적서'}] 저장이 완료되었습니다!`);
      onClose();
    } catch (err) {
      toast.error('견적서 저장 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const custName = customer?.name || sale.customer_name || sale.client_name || sale.customer_id || '고객사 미지정';
  const custDept = sale.dept || sale.client_dept || customer?.dept || '';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 모달 상단 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black border border-sky-400/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center space-x-2">
                <span>견적서 작성 및 단가 산출</span>
                <span className="text-xs font-mono font-bold bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  {sale.code_number || sale.id}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                인쇄·출력 제작형(페이지×부수×단가) 또는 일반 물품형(수량×단가)으로 견적을 산출합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleCalc}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                showCalc
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white'
              }`}
              title="팝업 계산기 열기/닫기"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>계산기</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 🔄 동시성 제어 (Conflict Resolution) 및 캐시 검증 알림 배너 ── */}
        {syncStatus === 'SYNCED_FROM_DB' && (
          <div className="bg-sky-50 px-6 py-2 border-b border-sky-200 flex items-center justify-between text-xs text-sky-800 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-sky-600 animate-pulse" />
              <span className="font-bold">🌐 최신 DB 동기화:</span>
              <span>다른 기기 또는 서버에서 수정된 최신 데이터가 성공적으로 반영되었습니다.</span>
            </div>
            <span className="text-[10px] text-sky-600 font-mono">
              DB 갱신: {sale.updated_at || '최신'}
            </span>
          </div>
        )}
        {syncStatus === 'RESTORED_FROM_LOCAL_DRAFT' && (
          <div className="bg-amber-50 px-6 py-2 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-bold">💾 임시작성본 복원:</span>
              <span>이 기기에서 작업 중이던 내용이 복원되었습니다.</span>
            </div>
            <button
              type="button"
              onClick={handleRevertToDb}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-[11px] font-bold text-amber-900 transition"
              title="로컬 임시작성을 취소하고 서버 DB의 원본 데이터로 되돌립니다."
            >
              <RefreshCw className="w-3 h-3 text-amber-800" />
              <span>서버 원본으로 초기화</span>
            </button>
          </div>
        )}

        {/* 모달 본문 영역 */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* ── 🌟 견적서 발행 공급사(회사) 선택 바 (7개사) ── */}
          <div className="bg-sky-50/50 p-3 rounded-2xl border border-sky-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">발행 회사 (공급사 선택)</span>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="font-black text-slate-900 text-sm bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  {COMPANY_SUPPLIERS.map((s) => (
                    <option key={`sup-opt-${s.id}`} value={s.id}>
                      {s.name} {s.id === 1 ? '(당사)' : `(${s.tag})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 font-medium">
                사업자번호: <strong className="text-slate-800 font-mono">{COMPANY_SUPPLIERS.find(s => s.id === supplierId)?.bizNum}</strong>
              </span>
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 font-medium">
                대표: <strong className="text-slate-800">{COMPANY_SUPPLIERS.find(s => s.id === supplierId)?.ceo}</strong>
              </span>
              <span className={`px-2 py-1 rounded-lg font-bold text-[11px] ${
                supplierId === 1 ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {supplierId === 1 ? '기준 단가 (100%)' : `비교견적 단가 (+${Math.round((COMPANY_SUPPLIERS.find(s => s.id === supplierId)?.rate - 1) * 100)}%)`}
              </span>
            </div>
          </div>

          {/* ── 🌟 견적서 양식 선택 탭 (인쇄출력 제작형 vs 일반 물품용역형) ── */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between gap-2 border border-slate-200">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => handleTemplateTypeChange('print')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  estimateType === 'print'
                    ? 'bg-sky-600 text-white shadow-sky-500/20 font-black'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>📖 인쇄·출력 제작형 (페이지 × 부수 × 단가)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleTemplateTypeChange('general')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  estimateType === 'general'
                    ? 'bg-sky-600 text-white shadow-sky-500/20 font-black'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>📦 일반 물품·용역형 (수량 × 단위 × 단가)</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center text-[11px] text-slate-500 font-semibold px-2">
              {estimateType === 'print' ? '계산식: 페이지 × 부수 × 단가 = 공급가액' : '계산식: 수량 × 단가 = 공급가액'}
            </div>
          </div>

          {/* 1. 견적 기본 정보 요약 박스 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-bold">수신 거래처</span>
              <strong className="text-slate-800 text-sm block truncate" title={`${custName} ${custDept ? `(${custDept})` : ''}`}>
                {custName} {custDept ? `(${custDept})` : ''}
              </strong>
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-400 font-bold">고객 담당자</span>
                <label className="flex items-center space-x-1 cursor-pointer text-[10px] text-slate-500 hover:text-sky-600 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={showContactPerson}
                    onChange={(e) => setShowContactPerson(e.target.checked)}
                    className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>견적서 표기</span>
                </label>
              </div>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder={showContactPerson ? "담당자명 입력" : "견적서 표기 제외됨"}
                disabled={!showContactPerson}
                className={`w-full p-1.5 border rounded-lg text-xs font-bold transition ${
                  showContactPerson
                    ? 'border-slate-300 text-slate-800 bg-white focus:ring-1 focus:ring-sky-500'
                    : 'border-slate-200 text-slate-400 bg-slate-100 placeholder:italic'
                }`}
                title={showContactPerson ? "견적서에 표기될 고객 담당자명" : "체크박스가 해제되어 견적서에 고객 담당자명이 표기되지 않고 발주처명만 표기됩니다."}
              />
              {!showContactPerson && (
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                  ※ 견적서에 담당자명 없이 발주처명만 인쇄됩니다.
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-bold">담당자 연락처</span>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="연락처"
                className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-bold">작업명 / 영업담당자</span>
              <div className="truncate font-bold text-slate-800" title={sale.title}>
                {sale.title || '작업명 미지정'}
              </div>
              <span className="text-[11px] text-rose-600 font-bold block">
                영업: {sale.sales_manager || sale.manager_name || '담당자'}
              </span>
            </div>
          </div>

          {/* 2. 견적서 설정 (견적일자, 유효기간, 결제조건) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">견적 발행일자</label>
              <input
                type="date"
                value={estimateDate}
                onChange={e => setEstimateDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">견적 유효기간</label>
              <input
                type="text"
                placeholder="예: 견적 후 30일간"
                value={validDays}
                onChange={e => setValidDays(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">결제 조건</label>
              <input
                type="text"
                placeholder="예: 납품 후 100% 현금/계좌이체"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* 3. 품목별 단가 산출 테이블 */}
          <div className="space-y-2">
            {/* 헤더 바: 드래그 드롭 + 버튼 통합 (1줄 슬림 배치) */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsExcelDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsExcelDragging(false); }}
              onDrop={(e) => {
                e.preventDefault(); setIsExcelDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleExcelFile(file);
              }}
              className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 border-dashed transition ${
                isExcelDragging
                  ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300/40'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
              }`}
            >
              {/* 왼쪽: 제목 */}
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-1.5 flex-shrink-0">
                <span>📋 견적 세부 품목 명세서</span>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {estimateType === 'print' ? '인쇄·출력 제작 모드' : '일반 물품·용역 모드'}
                </span>
                <span className="text-xs font-normal text-slate-400">({items.length}개 품목)</span>
              </h3>
              {/* 오른쪽: 버튼 그룹 */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <input
                  type="file"
                  ref={excelFileInputRef}
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleExcelFile(file); }}
                  accept=".xlsx,.xls,.csv,.txt,.tsv,.pdf"
                  className="hidden"
                />
                {isExcelDragging ? (
                  <span className="text-xs font-bold text-emerald-700 animate-pulse">📂 파일을 여기에 드롭하세요!</span>
                ) : (
                  <span className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-1">
                    <Upload className="w-3 h-3 inline" />
                    <span>드래그 드롭 또는</span>
                    <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] shadow-xs">Ctrl+V</kbd>
                    <span>지원</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => excelFileInputRef.current?.click()}
                  disabled={excelImporting}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  title="엑셀/CSV 견적서 불러오기"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{excelImporting ? '분석 중...' : '불러오기'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold hover:bg-sky-100 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>품목 추가</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5 min-w-[140px]">품명 / 작업명 *</th>
                    <th className="p-2.5 min-w-[110px]">규격 / 사양</th>
                    
                    {/* 인쇄 제작형일 때 페이지 컬럼 노출 */}
                    {estimateType === 'print' && (
                      <th className="p-2.5 w-20 text-center bg-sky-50/70 text-sky-900 border-x border-sky-100">
                        페이지 (P)
                      </th>
                    )}

                    <th className="p-2.5 w-20 text-center">
                      {estimateType === 'print' ? '부수' : '수량'}
                    </th>
                    
                    {estimateType === 'general' && (
                      <th className="p-2.5 w-16 text-center">단위</th>
                    )}

                    <th className="p-2.5 w-28 text-right">단가 (원)</th>
                    <th className="p-2.5 w-32 text-right bg-slate-50 font-black">공급가액 (원)</th>
                    <th className="p-2.5 min-w-[100px]">비고</th>
                    <th className="p-2.5 w-10 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/80 transition">
                      <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>
                      
                      {/* 품명 */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="품명 / 작업명 입력"
                          value={item.name}
                          onChange={e => handleItemChange(index, 'name', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-sky-500"
                        />
                      </td>

                      {/* 규격 */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="예: 295*416, A4"
                          value={item.spec}
                          onChange={e => handleItemChange(index, 'spec', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </td>

                      {/* 페이지 (인쇄형일 때) */}
                      {estimateType === 'print' && (
                        <td className="p-1.5 bg-sky-50/30 border-x border-sky-100">
                          <input
                            type="number"
                            min="1"
                            placeholder="p"
                            value={item.pages}
                            onChange={e => handleItemChange(index, 'pages', e.target.value)}
                            className="w-full p-2 border border-sky-200 rounded-lg text-xs text-center font-bold text-sky-900 bg-white"
                            title="페이지 수 (입력 시: 페이지 × 부수 × 단가로 계산)"
                          />
                        </td>
                      )}

                      {/* 부수 / 수량 */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center font-semibold"
                        />
                      </td>

                      {/* 단위 (일반 물품형일 때) */}
                      {estimateType === 'general' && (
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="식/개"
                            value={item.unit}
                            onChange={e => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center text-slate-600"
                          />
                        </td>
                      )}

                      {/* 단가 */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.unit_price}
                          onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs text-right font-mono font-semibold"
                        />
                      </td>

                      {/* 공급가액 (자동 계산) */}
                      <td className="p-2 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                        ₩ {(Number(item.amount) || 0).toLocaleString()}
                      </td>

                      {/* 비고 */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="비고"
                          value={item.note}
                          onChange={e => handleItemChange(index, 'note', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-600"
                        />
                      </td>

                      {/* 삭제 */}
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="품목 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. 부가세 및 최종 견적 합계액 카드 */}
          {/* 4. 부가세 및 최종 견적 합계액 카드 */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
            
            {/* ── 공급가액 절사 (컴팩트 1줄) ── */}
            <div className="flex flex-wrap items-center gap-1.5 py-1 border-b border-slate-800 pb-3">
              <span className="text-[11px] font-bold text-slate-400 flex items-center mr-1">
                <Scissors className="w-3 h-3 mr-1 text-amber-400" />절사:
              </span>
              {[
                { label: '없음', unit: 0, calc: rawSupplyPrice },
                { label: '만원↑', unit: 10000, calc: Math.floor(rawSupplyPrice / 10000) * 10000 },
                { label: '천원↑', unit: 1000, calc: Math.floor(rawSupplyPrice / 1000) * 1000 },
                { label: '백원↑', unit: 100, calc: Math.floor(rawSupplyPrice / 100) * 100 },
                { label: '직접입력', unit: 'custom', calc: null },
              ].map((btn) => {
                // 반드시 Number() 비교로 통일 (저장된 값이 문자열일 수 있음)
                const isSelected = btn.unit === 'custom'
                  ? discountUnit === 'custom'
                  : Number(discountUnit) === Number(btn.unit);
                const calcVal = btn.calc !== null ? btn.calc : null;
                const diff = calcVal !== null ? rawSupplyPrice - calcVal : 0;
                return (
                  <button
                    key={`disc-${btn.unit}`}
                    type="button"
                    onClick={() => {
                      setDiscountUnit(btn.unit === 'custom' ? 'custom' : Number(btn.unit));
                      if (btn.unit === 'custom' && !customSupplyPrice) {
                        setCustomSupplyPrice(String(finalSupplyPrice));
                      }
                    }}
                    title={calcVal !== null ? `→ ₩${calcVal.toLocaleString()}원 ${diff > 0 ? `(-₩${diff.toLocaleString()})` : ''}` : '직접 입력'}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-1 ring-amber-300/60'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    <span>{btn.label}</span>
                    {calcVal !== null && (
                      <span className={`block text-[10px] font-mono font-normal leading-tight ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                        ₩{calcVal.toLocaleString()}{diff > 0 ? ` -${diff.toLocaleString()}` : ''}
                      </span>
                    )}
                  </button>
                );
              })}
              {discountUnit === 'custom' && (
                <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-amber-400">
                  <span className="text-[11px] text-amber-300 font-semibold">₩</span>
                  <input
                    type="number"
                    placeholder="직접 입력"
                    value={customSupplyPrice}
                    onChange={(e) => setCustomSupplyPrice(e.target.value)}
                    className="w-24 p-0.5 bg-transparent text-amber-300 text-[11px] font-mono font-bold text-right outline-none"
                  />
                  <span className="text-[11px] text-amber-300">원</span>
                </div>
              )}
              {discountAmount > 0 && (
                <span className="ml-auto text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                  ✂ -{discountAmount.toLocaleString()}원 절사
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={e => setIncludeVat(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-400"
                />
                <span>부가가치세 (VAT 10%) 과세 적용</span>
              </label>

              <div className="flex items-center space-x-6 text-xs">
                {discountAmount > 0 && (
                  <div>
                    <span className="text-slate-400 mr-2">품목 합계:</span>
                    <span className="font-mono text-slate-400 text-xs line-through">₩ {rawSupplyPrice.toLocaleString()} 원</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-300 mr-2">공급가액:</span>
                  <strong className="font-mono text-white text-base">₩ {finalSupplyPrice.toLocaleString()} 원</strong>
                  {discountAmount > 0 && (
                    <span className="text-[10px] text-amber-400 font-bold ml-1.5">(절사)</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 mr-2">세액 (10%):</span>
                  <strong className="font-mono text-sky-300 text-sm">₩ {totalTax.toLocaleString()} 원</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-bold text-slate-300">최종 총 견적금액 (VAT 포함)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                ₩ {totalPrice.toLocaleString()} 원
              </div>
            </div>
          </div>

          {/* 5. 견적서 비고 및 요청 특이사항 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">견적서 비고 및 요청 특이사항</label>
            <textarea
              rows={3}
              placeholder="견적서 하단에 출력될 안내문구 또는 특이사항을 입력하세요."
              value={estimateNote}
              onChange={e => setEstimateNote(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs leading-relaxed"
            />
          </div>

        </div>

        {/* 모달 하단 푸터 액션 버튼 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onPrint) {
                onPrint({
                  ...sale,
                  supplier_id: supplierId,
                  contact_person: showContactPerson ? contactPerson : '',
                  client_contact_person: showContactPerson ? contactPerson : '',
                  phone: showContactPerson ? contactPhone : '',
                  client_phone: showContactPerson ? contactPhone : '',
                  email: contactEmail,
                  client_email: contactEmail,
                  show_contact_person: showContactPerson,
                  hide_contact_person: !showContactPerson,
                  customer_name: custName,
                  dept: custDept,
                  raw_supply_price: rawSupplyPrice,
                  discount_unit: discountUnit,
                  discount_amount: discountAmount,
                  estimate_type: estimateType,
                  estimate_items: items,
                  estimate_date: estimateDate,
                  valid_days: validDays,
                  payment_terms: paymentTerms,
                  estimate_note: estimateNote,
                  supply_price: totalSupplyPrice,
                  tax: totalTax,
                  total_price: totalPrice,
                }, {
                  ...customer,
                  name: custName,
                  dept: custDept,
                  contact_person: showContactPerson ? contactPerson : '',
                  phone: showContactPerson ? contactPhone : '',
                });
              }
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄 / 엑셀 미리보기</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '저장 중...' : '견적서 저장 및 매출액 즉시 반영'}</span>
            </button>
          </div>
        </div>


      {/* ── 시트 선택 팝업 (엑셀 시트 여러 개일 때) ── */}
      {sheetSelectState && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>시트 선택</span>
              </h3>
              <button
                type="button"
                onClick={() => setSheetSelectState(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{sheetSelectState.fileName}</span> 파일에
              시트가 {sheetSelectState.sheetNames.length}개 있습니다. 견적 품목이 있는 시트를 선택해 주세요.
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {sheetSelectState.sheetNames.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSheetSelected(name)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition text-sm font-semibold text-slate-700 flex items-center space-x-2"
                >
                  <span className="text-[11px] font-mono text-slate-400 w-5 text-center">{idx + 1}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSheetSelectState(null)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 transition"
            >
              취소
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

