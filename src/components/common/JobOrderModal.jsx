// src/components/common/JobOrderModal.jsx
import React, { useState } from 'react';
import { X, CheckCircle2, UserCheck, Hash, Save, AlertTriangle } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { useData } from '../../context/DataContext';

export default function JobOrderModal({ customers = [], initialData = null, onSave, onClose }) {
  const { user } = useGoogleAuth();
  const { addCustomer } = useData();

  const isEditMode = !!initialData;
  const today = new Date().toISOString().split('T')[0];
  
  const d = new Date();
  const currentYear = d.getFullYear();
  const yy = String(currentYear).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateYYMMDD = `${yy}${mm}${dd}`;

  const userCode = user?.userCode || '44';
  const userName = user?.userName || '김광일';
  const companyCode = user?.companyCode || '3';

  const getInitialSeq = () => {
    try {
      if (initialData?.seq) return initialData.seq;
      const saved = localStorage.getItem('last_job_sequence_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.year === currentYear) {
          return Number(parsed.seq || 277) + 1;
        }
      }
    } catch (e) {
      console.warn('Seq calculation error:', e);
    }
    return 277;
  };

  const [seqNumber, setSeqNumber] = useState(getInitialSeq());
  const formattedSeq = String(seqNumber).padStart(3, '0');
  const generatedCode = initialData?.code_number || `${userCode} - ${dateYYMMDD} - ${companyCode}${formattedSeq}`;

  const getInitialCustomerName = () => {
    try {
      if (initialData?.customer_name) return initialData.customer_name;
      if (initialData?.customer_id && Array.isArray(customers)) {
        const found = customers.find(c => c && c.id === initialData.customer_id);
        if (found) return found.name;
        return initialData.customer_id;
      }
    } catch (e) {
      console.warn('Cust name error:', e);
    }
    return '';
  };

  const [customerNameInput, setCustomerNameInput] = useState(getInitialCustomerName());
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code_number: generatedCode,
    seq: seqNumber,
    manager_name: initialData?.manager_name || userName,
    receipt_date: initialData?.receipt_date || today,
    delivery_date: initialData?.delivery_date || today,
    delivery_time: initialData?.delivery_time || '14:00',
    customer_id: initialData?.customer_id || '',
    dept: initialData?.dept || '',
    title: initialData?.title || '',
    spec: initialData?.spec || '',
    pages: initialData?.pages || '',
    duplex: initialData?.duplex || '단면',
    quantity: initialData?.quantity || '',
    estimated_price: initialData?.estimated_price || '',
    client_contact_person: initialData?.client_contact_person || '',
    client_phone: initialData?.client_phone || '',
    client_email: initialData?.client_email || '',
    email_receipt_time: initialData?.email_receipt_time || '',
    cover_job: initialData?.cover_job || '',
    cover_paper: initialData?.cover_paper || '',
    cover_print: initialData?.cover_print || '',
    coating: initialData?.coating || '',
    inner_job: initialData?.inner_job || '',
    inner_paper: initialData?.inner_paper || '',
    inner_print: initialData?.inner_print || '',
    interleaf_paper: initialData?.interleaf_paper || '',
    binding: initialData?.binding || '',
    draft_email: initialData?.draft_email || '',
    draft_group: initialData?.draft_group || '',
    mail_sender: initialData?.mail_sender || '',
    cover_proof_date: initialData?.cover_proof_date || '',
    inner_proof_date: initialData?.inner_proof_date || '',
    proof_method: initialData?.proof_method || '',
    planning: initialData?.planning || '',
    photography: initialData?.photography || '',
    illustration: initialData?.illustration || '',
    copyright_web: initialData?.copyright_web || '',
    production_progress: initialData?.production_progress || '',
    delivery_destination: initialData?.delivery_destination || '',
    cover_related: initialData?.cover_related || '',
    inner_related: initialData?.inner_related || '',
    request_note: initialData?.request_note || '',
    editor_name: initialData?.editor_name || '',
    designer_name: initialData?.designer_name || '',
  });

  const handleSeqChange = (newSeqVal) => {
    const val = Number(newSeqVal) || 1;
    setSeqNumber(val);
    const fmt = String(val).padStart(3, '0');
    const newCode = `${userCode} - ${dateYYMMDD} - ${companyCode}${fmt}`;
    setFormData(prev => ({
      ...prev,
      seq: val,
      code_number: newCode,
    }));
  };

  const handleCustomerNameChange = (typedName) => {
    setCustomerNameInput(typedName);
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const matched = safeCustomers.find(c => c && c.name && c.name.trim() === typedName.trim());
    if (matched) {
      setFormData(prev => ({
        ...prev,
        customer_id: matched.id,
        dept: matched.dept || prev.dept,
        client_contact_person: matched.contact_person || prev.client_contact_person,
        client_phone: matched.phone || prev.client_phone,
        client_email: matched.email || prev.client_email,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: typedName,
      }));
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const form = e.currentTarget;
      const elements = Array.from(form.querySelectorAll('input, select, textarea, button'))
        .filter(el => !el.disabled && el.tabIndex !== -1 && el.type !== 'hidden');
      const index = elements.indexOf(e.target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerNameInput.trim()) return alert('발주처(고객사명)를 입력해 주세요.');
    if (!formData.title.trim()) return alert('품명(작업제목)을 입력해 주세요.');

    try {
      setSubmitting(true);
      const safeCustomers = Array.isArray(customers) ? customers : [];
      let targetCustId = formData.customer_id;
      const matched = safeCustomers.find(c => c && c.name && c.name.trim() === customerNameInput.trim());

      if (!matched && customerNameInput.trim() && typeof addCustomer === 'function') {
        const newCust = await addCustomer({
          name: customerNameInput.trim(),
          dept: formData.dept || '',
          contact_person: formData.client_contact_person || '',
          phone: formData.client_phone || '',
          email: formData.client_email || '',
          sales_manager: userName,
        });
        if (newCust && newCust.id) targetCustId = newCust.id;
      } else if (matched) {
        targetCustId = matched.id;
      }

      if (!isEditMode) {
        try {
          localStorage.setItem('last_job_sequence_info', JSON.stringify({
            year: currentYear,
            seq: seqNumber
          }));
        } catch (e) {
          console.warn('Storage save error:', e);
        }
      }

      const finalOrderData = {
        ...formData,
        customer_id: targetCustId,
        customer_name: customerNameInput.trim(),
      };

      if (typeof onSave === 'function') {
        await onSave(finalOrderData);
      }
    } catch (err) {
      alert('저장 에러: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const safeCustomersList = Array.isArray(customers) ? customers : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* 상단 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-xs">작업전표</span>
            <h3 className="font-bold text-slate-800 text-base">
              {isEditMode ? '의뢰 작업전표 수정 (실물 1:1 종이 양식 폼)' : '의뢰 작업전표 상세 접수 (실물 1:1 종이 양식 폼)'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? '저장 중...' : (isEditMode ? '전표 수정 저장' : '작업전표 접수 저장')}</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📄 경성문화사 실물 작업전표 1:1 종이 양식 접수 폼 */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans text-xs">
          <div className="bg-white p-4 border border-slate-300 rounded-xl space-y-4">
            
            {/* 1. 상단 레이아웃: [좌측: 코드번호 박스 & 큰 타이틀 '작 업 전 표'] | [우측: 공식 KYUNGSUNG 로고 & 결재란] */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              
              {/* 좌측: 코드번호 상자 + 작 업 전 표 타이틀 */}
              <div className="space-y-3 w-full sm:w-auto">
                <div className="border-2 border-black px-3 py-1.5 flex items-center space-x-3 bg-white">
                  <span className="font-bold text-black text-xs tracking-wider">코 드 번 호</span>
                  <input
                    type="text"
                    readOnly={isEditMode}
                    value={formData.code_number}
                    className="font-mono font-black text-rose-600 text-sm tracking-widest bg-transparent border-none focus:outline-none w-full"
                  />
                  {!isEditMode && (
                    <div className="flex items-center space-x-1 border-l border-slate-300 pl-2">
                      <span className="text-[10px] text-slate-500 font-bold">순번:</span>
                      <input
                        type="number"
                        min="1"
                        value={seqNumber}
                        onChange={e => handleSeqChange(e.target.value)}
                        className="w-14 p-1 border border-slate-300 rounded text-center font-bold text-xs"
                      />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-[0.6em] text-black uppercase pt-1">
                  작 업 전 표
                </h1>
              </div>

              {/* 우측: 공식 KYUNGSUNG 경성문화사 로고 이미지 + 결재란 */}
              <div className="flex flex-col items-end space-y-2 w-full sm:w-auto">
                <div className="flex items-center space-x-1 mb-1">
                  <img src="/images/kyungsung_logo.jpg" alt="경성문화사 로고" className="h-8 object-contain" />
                </div>

                <div className="border-2 border-black text-center text-[11px] flex bg-white">
                  <div className="border-r border-black bg-slate-100 font-bold w-7 flex items-center justify-center p-1 leading-tight">
                    결<br/>재
                  </div>
                  <div className="divide-y divide-black min-w-[180px]">
                    <div className="grid grid-cols-3 divide-x divide-black border-b border-black bg-slate-100 font-bold p-1">
                      <div>담 당</div>
                      <div>부서장</div>
                      <div>회 장</div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-black h-9 font-bold text-rose-600">
                      <input
                        type="text"
                        value={formData.manager_name}
                        onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
                        className="w-full text-center font-bold text-rose-600 bg-transparent border-none focus:outline-none"
                      />
                      <div className="flex items-center justify-center"></div>
                      <div className="flex items-center justify-center"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 2. 접수일 & 납품일 입력 헤더 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-bold text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="text-black font-bold whitespace-nowrap">접 수 일 :</span>
                <input
                  type="date"
                  value={formData.receipt_date}
                  onChange={e => setFormData({ ...formData, receipt_date: e.target.value })}
                  className="p-1 border border-slate-300 rounded font-bold text-xs text-rose-600"
                />
              </div>
              <div className="flex items-center space-x-2 sm:justify-end">
                <span className="text-black font-bold whitespace-nowrap">납 품 일 :</span>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="p-1 border border-slate-300 rounded font-bold text-xs text-rose-600"
                />
                <span className="text-black font-bold">시간:</span>
                <input
                  type="time"
                  value={formData.delivery_time}
                  onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                  className="p-1 border border-slate-300 rounded font-bold text-xs text-rose-600"
                />
              </div>
            </div>

            {/* 3. HWP 양식과 100% 동일한 1:1 실물 표 입력 테이블 */}
            <div className="border-2 border-black divide-y-2 divide-black bg-white">
              
              <div className="divide-y divide-black">
                
                {/* Row 1: 발주처 & 과/부서 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black font-bold">
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center tracking-widest text-black">발 주 처 *</div>
                  <div className="col-span-6 p-1.5">
                    <input
                      type="text"
                      list="job-customer-list"
                      required
                      placeholder="고객사명 검색 또는 직접 입력"
                      value={customerNameInput}
                      onChange={e => handleCustomerNameChange(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs focus:ring-1 focus:ring-sky-500"
                    />
                    <datalist id="job-customer-list">
                      {safeCustomersList.map(c => (
                        <option key={c?.id || c?.name} value={c?.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-span-4 p-1.5 border-l border-black">
                    <input
                      type="text"
                      placeholder="과/부서명 입력 (예: AX전략실)"
                      value={formData.dept}
                      onChange={e => setFormData({ ...formData, dept: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                  </div>
                </div>

                {/* Row 2: 품명 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black font-bold">
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center tracking-widest text-black">품 명 *</div>
                  <div className="col-span-10 p-1.5">
                    <input
                      type="text"
                      required
                      placeholder="품명 (작업제목) 입력"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                  </div>
                </div>

                {/* Row 3: 규격 / 면수 / 양단면 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center font-bold">
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center tracking-widest text-black">규 격</div>
                  <div className="col-span-4 p-1.5">
                    <input
                      type="text"
                      placeholder="예: 90*50 또는 A4"
                      value={formData.spec}
                      onChange={e => setFormData({ ...formData, spec: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-rose-600 text-xs"
                    />
                  </div>
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center border-l border-black tracking-widest text-black">면 수</div>
                  <div className="col-span-4 p-1.5 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="예: 2p"
                      value={formData.pages}
                      onChange={e => setFormData({ ...formData, pages: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-rose-600 text-xs"
                    />
                    <select
                      value={formData.duplex}
                      onChange={e => setFormData({ ...formData, duplex: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    >
                      <option value="단면">단면</option>
                      <option value="양면">양면</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: 수량 & 견적금액 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black font-bold text-center">
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center tracking-widest text-black">수 량</div>
                  <div className="col-span-4 p-1.5">
                    <input
                      type="text"
                      placeholder="예: 500"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-rose-600 text-xs"
                    />
                  </div>
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center border-l border-black tracking-wider text-black">견 적 금 액</div>
                  <div className="col-span-4 p-1.5">
                    <input
                      type="number"
                      placeholder="견적 산정 금액 (원)"
                      value={formData.estimated_price}
                      onChange={e => setFormData({ ...formData, estimated_price: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-rose-600 text-xs"
                    />
                  </div>
                </div>

                {/* Row 5: 발주업체 담당자 & 이메일 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black font-bold">
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center leading-tight tracking-wider text-black">발 주 업 체<br/>담 당 자</div>
                  <div className="col-span-4 p-1.5 grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      placeholder="담당자명"
                      value={formData.client_contact_person}
                      onChange={e => setFormData({ ...formData, client_contact_person: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="연락처"
                      value={formData.client_phone}
                      onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                  </div>
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center border-l border-black tracking-widest text-black">이 메 일</div>
                  <div className="col-span-4 p-1.5 grid grid-cols-2 gap-1 border-l border-black">
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      value={formData.client_email}
                      onChange={e => setFormData({ ...formData, client_email: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="접수시간 (예: 16:05)"
                      value={formData.email_receipt_time}
                      onChange={e => setFormData({ ...formData, email_receipt_time: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                  </div>
                </div>

              </div>

              {/* 하단 인쇄/용지 사양 입력 섹션 */}
              <div className="divide-y divide-black">
                
                {/* Row 6: 표지작업 & 표지용지 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-wider text-black">표 지 작 업</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 옵셋편집 / 파일작업"
                      value={formData.cover_job}
                      onChange={e => setFormData({ ...formData, cover_job: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-wider text-black">표 지 용 지</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 스노우 200g"
                      value={formData.cover_paper}
                      onChange={e => setFormData({ ...formData, cover_paper: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Row 7: 표지인쇄 & 코팅 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-wider text-black">표 지 인 쇄</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 칼라 4도"
                      value={formData.cover_print}
                      onChange={e => setFormData({ ...formData, cover_print: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-widest text-black">코 팅</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 유광 라미네이팅"
                      value={formData.coating}
                      onChange={e => setFormData({ ...formData, coating: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Row 8: 내지작업 & 본문용지 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-wider text-black">내 지 작 업</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 내지 일반편집"
                      value={formData.inner_job}
                      onChange={e => setFormData({ ...formData, inner_job: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-wider text-black">본 문 용 지</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 모조 80g"
                      value={formData.inner_paper}
                      onChange={e => setFormData({ ...formData, inner_paper: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Row 9: 내지인쇄 & 간지용지 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-wider text-black">내 지 인 쇄</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 흑백 1도"
                      value={formData.inner_print}
                      onChange={e => setFormData({ ...formData, inner_print: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-wider text-black">간 지 용 지</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="간지용지"
                      value={formData.interleaf_paper}
                      onChange={e => setFormData({ ...formData, interleaf_paper: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Row 10: 제본 & 후가공 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-widest text-black">제 본</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 무선제본 / 중철"
                      value={formData.binding}
                      onChange={e => setFormData({ ...formData, binding: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-widest text-black">후 가 공</div>
                  <div className="col-span-4 p-1 text-slate-500 font-bold flex items-center justify-center">없음</div>
                </div>

                {/* Row 11: 원고 & 교정일 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold flex items-center justify-center tracking-widest text-black">원 고</div>
                  <div className="col-span-4 p-1 grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      placeholder="메일"
                      value={formData.draft_email}
                      onChange={e => setFormData({ ...formData, draft_email: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                    <input
                      type="text"
                      placeholder="그룹"
                      value={formData.draft_group}
                      onChange={e => setFormData({ ...formData, draft_group: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                    <input
                      type="text"
                      placeholder="발송자"
                      value={formData.mail_sender}
                      onChange={e => setFormData({ ...formData, mail_sender: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black flex items-center justify-center tracking-widest text-black">교 정 일</div>
                  <div className="col-span-4 divide-y divide-black text-[11px] p-0.5">
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span className="font-bold">표지:</span>
                      <input
                        type="date"
                        value={formData.cover_proof_date}
                        onChange={e => setFormData({ ...formData, cover_proof_date: e.target.value })}
                        className="p-0.5 border border-slate-300 rounded text-rose-600 font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span className="font-bold">내지:</span>
                      <input
                        type="date"
                        value={formData.inner_proof_date}
                        onChange={e => setFormData({ ...formData, inner_proof_date: e.target.value })}
                        className="p-0.5 border border-slate-300 rounded text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 12: 교정방법 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-wider text-black">교 정 방 법</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: PDF 교정 / 출력교정"
                      value={formData.proof_method}
                      onChange={e => setFormData({ ...formData, proof_method: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-6 p-1.5 bg-white"></div>
                </div>

                {/* Row 13: 기획 & 사진촬영 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-widest text-black">기 획</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="기획 사양"
                      value={formData.planning}
                      onChange={e => setFormData({ ...formData, planning: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-wider text-black">사 진 촬 영</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="사진촬영"
                      value={formData.photography}
                      onChange={e => setFormData({ ...formData, photography: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Row 14: 일러스트 & 저작권.웹게시 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-wider text-black">일 러 스 트</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="일러스트 사양"
                      value={formData.illustration}
                      onChange={e => setFormData({ ...formData, illustration: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-tight text-black">저작권ㆍ웹게시</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="저작권 / 웹게시 여부"
                      value={formData.copyright_web}
                      onChange={e => setFormData({ ...formData, copyright_web: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Row 15: 제작진행 & 납품처 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold tracking-wider text-black">제 작 진 행</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 출력실 전달 / 제본 진행"
                      value={formData.production_progress}
                      onChange={e => setFormData({ ...formData, production_progress: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-black tracking-wider text-black">납 품 처</div>
                  <div className="col-span-4 p-1">
                    <input
                      type="text"
                      placeholder="예: 직접 전달 / 퀵 배송"
                      value={formData.delivery_destination}
                      onChange={e => setFormData({ ...formData, delivery_destination: e.target.value })}
                      className="w-full p-1 border border-slate-300 rounded font-bold text-rose-600 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Row 16: 표지컨셉 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black font-bold">
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center tracking-wider text-black">표 지 컨 셉</div>
                  <div className="col-span-10 p-1">
                    <input
                      type="text"
                      placeholder="표지 컨셉 세부 사항 입력"
                      value={formData.cover_related}
                      onChange={e => setFormData({ ...formData, cover_related: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                  </div>
                </div>

                {/* Row 17: 내지컨셉 */}
                <div className="grid grid-cols-12 divide-x divide-black border-b border-black font-bold">
                  <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center tracking-wider text-black">내 지 컨 셉</div>
                  <div className="col-span-10 p-1">
                    <input
                      type="text"
                      placeholder="내지 컨셉 세부 사항 입력"
                      value={formData.inner_related}
                      onChange={e => setFormData({ ...formData, inner_related: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-rose-600 text-xs"
                    />
                  </div>
                </div>

                {/* Row 18: <표지관련> & <내지관련> 양옆 나란히 반반 박스 */}
                <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
                  <div className="p-2 space-y-1">
                    <p className="font-bold text-center text-black">&lt;표지관련&gt;</p>
                    <textarea
                      rows={2}
                      placeholder="표지 디자인/인쇄 관련 지시사항"
                      value={formData.cover_related}
                      onChange={e => setFormData({ ...formData, cover_related: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-semibold text-rose-600 text-xs"
                    />
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="font-bold text-center text-black">&lt;내지관련&gt;</p>
                    <textarea
                      rows={2}
                      placeholder="내지 편집/제본 관련 지시사항"
                      value={formData.inner_related}
                      onChange={e => setFormData({ ...formData, inner_related: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded font-semibold text-rose-600 text-xs"
                    />
                  </div>
                </div>

                {/* Row 19: <요청사항> */}
                <div className="p-2.5 min-h-[90px]">
                  <p className="font-bold text-black mb-1 text-[11px]">&lt;요청사항&gt;</p>
                  <textarea
                    rows={3}
                    placeholder="작업자 지시 요청사항을 입력하세요 (예: 6하원칙 작성)"
                    value={formData.request_note}
                    onChange={e => setFormData({ ...formData, request_note: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-semibold text-rose-600 text-xs leading-relaxed"
                  />
                </div>

              </div>

            </div>

            {/* 4. 하단 원칙 안내문 */}
            <div className="text-[10px] text-black space-y-0.5 mt-2 font-medium">
              <p>※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며</p>
              <p className="pl-12">작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.</p>
            </div>

            {/* 5. 하단 작업자 서명란 입력 */}
            <div className="flex justify-between items-center mt-3 px-8 text-xs font-bold text-black">
              <div className="flex items-center space-x-2">
                <span>표지 작업자 :</span>
                <input
                  type="text"
                  placeholder="담당자명"
                  value={formData.editor_name}
                  onChange={e => setFormData({ ...formData, editor_name: e.target.value })}
                  className="w-28 p-1 border border-slate-300 rounded text-center font-bold text-rose-600 text-xs"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span>내지 작업자 :</span>
                <input
                  type="text"
                  placeholder="디자이너명"
                  value={formData.designer_name}
                  onChange={e => setFormData({ ...formData, designer_name: e.target.value })}
                  className="w-28 p-1 border border-slate-300 rounded text-center font-bold text-rose-600 text-xs"
                />
              </div>
            </div>

          </div>
        </div>

        {/* 하단 접수 제출 버튼 */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end space-x-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-200"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 shadow-sm"
          >
            {submitting ? '저장 중...' : (isEditMode ? '수정 사항 저장' : '작업전표 접수 저장')}
          </button>
        </div>
      </form>
    </div>
  );
}
