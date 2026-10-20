// src/components/common/QuickJobOrderImportModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Calendar, User, Phone, Mail, Building, Clock, Layers, Save, Image as ImageIcon } from 'lucide-react';
import { parseHwpJobOrder, parseTextJobOrder } from '../../utils/jobOrderParser';
import { getLocalDateStr } from '../../utils/dateUtils';
import { useData } from '../../context/DataContext';

export default function QuickJobOrderImportModal({ isOpen, onClose, onSuccess }) {
  const { customers, addCustomer, addSale, fetchAllData } = useData();

  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [pastedImage, setPastedImage] = useState(null);
  const [manualText, setManualText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Ctrl+V 글로벌 붙여넣기 리스너
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e) => {
      // 입력창에 타이핑 중일 때는 텍스트 붙여넣기 기본 동작 유지
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.id !== 'paste-drop-zone') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      // 1. 이미지 클립보드 감지
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (ev) => {
            setPastedImage(ev.target.result);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }

      // 2. 텍스트 클립보드 감지
      const text = e.clipboardData.getData('text');
      if (text && text.trim().length > 10) {
        processText(text);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // HWP 파일 처리
  const processFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      if (file.name.toLowerCase().endsWith('.hwp')) {
        const result = await parseHwpJobOrder(file);
        setParsedData(result);
      } else {
        // 텍스트 파일 등
        const text = await file.text();
        processText(text);
      }
    } catch (err) {
      alert('파일 분석 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  // 텍스트 처리
  const processText = (text) => {
    setParsing(true);
    try {
      const result = parseTextJobOrder(text);
      setParsedData(result);
    } catch (err) {
      alert('텍스트 분석 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  // 필드 수정 핸들러
  const handleFieldChange = (field, value) => {
    setParsedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 고객사 자동 매칭 확인
  const matchedCustomer = customers.find(c =>
    c.name === parsedData?.customer_name ||
    (parsedData?.customer_name && c.name.includes(parsedData.customer_name))
  );

  // 🚀 최종 등록 처리: 고객 등록 + 납품 일정 & 작업전표 매출 등록
  const handleSubmit = async () => {
    if (!parsedData || !parsedData.title) {
      alert('품명(작업명)이 누락되었습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const today = getLocalDateStr();
      let customerId = matchedCustomer ? matchedCustomer.id : null;

      // 1. 미등록 고객사인 경우 신규 고객 자동 생성
      if (!customerId && parsedData.customer_name) {
        const newCustId = `cust_${Date.now()}`;
        const newCustomerPayload = {
          id: newCustId,
          name: parsedData.customer_name,
          dept: parsedData.dept || '',
          contact_person: parsedData.contact_person || '',
          phone: parsedData.phone || '',
          email: parsedData.email || '',
          sales_manager: parsedData.sales_manager || '김광일',
          reg_date: today,
        };
        await addCustomer(newCustomerPayload);
        customerId = newCustId;
      }

      // 2. 신규 매출 / 납품 일정 / 작업전표 등록
      const codeNumber = parsedData.code_number || `44-${today.replace(/-/g, '').slice(2)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newSalePayload = {
        id: `sale_${Date.now()}`,
        code_number: codeNumber,
        customer_id: customerId,
        customer_name: parsedData.customer_name || '거래처',
        dept: parsedData.dept || '',
        contact_person: parsedData.contact_person || '',
        phone: parsedData.phone || '',
        email: parsedData.email || '',
        title: parsedData.title,
        spec: parsedData.spec || '',
        pages: parsedData.pages || '',
        quantity: Number(parsedData.quantity) || 1,
        supply_price: Number(parsedData.supply_price) || 0,
        tax: Math.round((Number(parsedData.supply_price) || 0) * 0.1),
        total_price: Math.round((Number(parsedData.supply_price) || 0) * 1.1),
        sales_manager: parsedData.sales_manager || '김광일',
        reg_date: parsedData.receipt_date || parsedData.reg_date || today,
        delivery_date: parsedData.delivery_date || today,
        billing_status: '미청구',
        payment_status: '미수',
        billing_schedule: parsedData.note || '',
        // 작업전표 세부정보
        order_spec: {
          code_number: codeNumber,
          cover_work: parsedData.cover_work || '',
          cover_paper: parsedData.cover_paper || '',
          cover_print: parsedData.cover_print || '',
          coating: parsedData.coating || '',
          inner_work: parsedData.inner_work || '',
          inner_paper: parsedData.inner_paper || '',
          inner_print: parsedData.inner_print || '',
          binding: parsedData.binding || '',
          manuscript: parsedData.manuscript || '',
          production_process: parsedData.production_process || '',
          delivery_place: parsedData.delivery_place || '',
        }
      };

      await addSale(newSalePayload);
      if (fetchAllData) await fetchAllData(true);

      alert(`[${parsedData.title}] 납품 일정이 성공적으로 등록되었습니다!\n납품일: ${parsedData.delivery_date || today}`);
      if (onSuccess) onSuccess(newSalePayload);
      onClose();
    } catch (err) {
      alert('등록 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-800 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-400/20 text-sky-300 flex items-center justify-center font-black border border-sky-400/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center space-x-2">
                <span>작업전표 스마트 불러오기 (HWP / 붙여넣기)</span>
                <span className="text-xs bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full">
                  자동 납품 일정 등록
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                한글(.hwp) 파일을 드래그하거나 내용을 복사해 붙여넣으면 납품 일정이 자동 생성됩니다.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs">
          
          {/* ── 1. 파일 드래그앤드롭 및 붙여넣기 수신 영역 ── */}
          <div
            id="paste-drop-zone"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-2.5 ${
              isDragging
                ? 'border-sky-500 bg-sky-50/80 scale-[1.01]'
                : parsedData
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".hwp,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-sky-600">
              {parsing ? (
                <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
              ) : parsedData ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <Upload className="w-6 h-6 text-sky-600" />
              )}
            </div>

            <div>
              <p className="font-extrabold text-sm text-slate-800">
                {parsing
                  ? '작업전표 문서를 정밀 분석 중입니다...'
                  : parsedData
                  ? '작업전표 데이터가 성공적으로 추출되었습니다! (다시 올리려면 클릭)'
                  : '한글(.hwp) 파일을 여기에 끌어다 놓거나 클릭하여 선택하세요'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                💡 한글 파일 내용이나 표를 복사한 후 화면에서 <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700 shadow-sm">Ctrl + V</kbd> 를 눌러도 즉시 인식됩니다.
              </p>
            </div>
          </div>

          {/* 붙여넣은 이미지 미리보기 */}
          {pastedImage && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-slate-700">붙여넣은 캡처 이미지 감지됨</span>
              </div>
              <button
                onClick={() => setPastedImage(null)}
                className="text-xs text-rose-500 hover:underline"
              >
                이미지 지우기
              </button>
            </div>
          )}

          {/* ── 2. 추출된 데이터 폼 (확인 및 수정) ── */}
          {parsedData && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                  추출된 작업전표 정보 확인
                </h3>
                {matchedCustomer ? (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ✓ 등록 고객 자동 매칭: {matchedCustomer.name}
                  </span>
                ) : (
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    + 신규 고객으로 자동 등록 예정
                  </span>
                )}
              </div>

              {/* 기본 핵심 정보 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">발주처 (고객사명) *</label>
                  <input
                    type="text"
                    value={parsedData.customer_name || ''}
                    onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">과 / 부서명</label>
                  <input
                    type="text"
                    value={parsedData.dept || ''}
                    onChange={(e) => handleFieldChange('dept', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">담당자 성명</label>
                  <input
                    type="text"
                    value={parsedData.contact_person || ''}
                    onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">연락처</label>
                  <input
                    type="text"
                    value={parsedData.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                  />
                </div>

                {/* 납품 일정 & 접수일자 강조 */}
                <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-300 md:col-span-2">
                  <label className="block text-[11px] font-black text-amber-900 mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    납품 일정 (마감일자) *
                  </label>
                  <input
                    type="date"
                    value={parsedData.delivery_date || ''}
                    onChange={(e) => handleFieldChange('delivery_date', e.target.value)}
                    className="w-full p-2 border border-amber-300 rounded-lg text-xs font-black text-amber-950 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">접수일자</label>
                  <input
                    type="date"
                    value={parsedData.receipt_date || parsedData.reg_date || ''}
                    onChange={(e) => handleFieldChange('receipt_date', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">영업담당</label>
                  <input
                    type="text"
                    value={parsedData.sales_manager || '김광일'}
                    onChange={(e) => handleFieldChange('sales_manager', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              {/* 품명 및 수량/규격 */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">작업 품명 (건명) *</label>
                  <input
                    type="text"
                    value={parsedData.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">규격 / 사양</label>
                  <input
                    type="text"
                    value={parsedData.spec || ''}
                    onChange={(e) => handleFieldChange('spec', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">수량 (부수)</label>
                  <input
                    type="number"
                    value={parsedData.quantity || '1'}
                    onChange={(e) => handleFieldChange('quantity', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* 공정 및 인쇄 사양 상세 */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-slate-700 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">인쇄 및 후가공 제작 사양</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-slate-500">표지용지:</span> <strong className="text-slate-800">{parsedData.cover_paper || '-'}</strong></div>
                  <div><span className="text-slate-500">표지인쇄:</span> <strong className="text-slate-800">{parsedData.cover_print || '-'}</strong></div>
                  <div><span className="text-slate-500">코팅:</span> <strong className="text-slate-800">{parsedData.coating || '-'}</strong></div>
                  <div><span className="text-slate-500">제본:</span> <strong className="text-slate-800">{parsedData.binding || '-'}</strong></div>
                  <div><span className="text-slate-500">본문용지:</span> <strong className="text-slate-800">{parsedData.inner_paper || '-'}</strong></div>
                  <div><span className="text-slate-500">본문인쇄:</span> <strong className="text-slate-800">{parsedData.inner_print || '-'}</strong></div>
                  <div><span className="text-slate-500">제작진행:</span> <strong className="text-slate-800">{parsedData.production_process || '-'}</strong></div>
                  <div><span className="text-slate-500">납품처:</span> <strong className="text-slate-800">{parsedData.delivery_place || '-'}</strong></div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            닫기
          </button>

          <button
            type="button"
            disabled={!parsedData || submitting}
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? '납품 일정 등록 중...' : '납품 일정 및 작업전표 등록 완료'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
