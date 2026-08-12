// src/components/common/JobOrderModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ClipboardList, CheckCircle2, UserCheck, Printer, FileText, Hash, Building } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { useData } from '../../context/DataContext';

export default function JobOrderModal({ customers, onSave, onClose }) {
  const { user } = useGoogleAuth();
  const { addCustomer } = useData();

  const today = new Date().toISOString().split('T')[0];
  
  // 날짜 기반 YYMMDD 및 연도 생성
  const d = new Date();
  const currentYear = d.getFullYear();
  const yy = String(currentYear).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateYYMMDD = `${yy}${mm}${dd}`;

  const userCode = user?.userCode || '44';
  const userName = user?.userName || '김광일';
  const companyCode = user?.companyCode || '3';

  // 로컬 스토리지에서 마지막 작성 연도 및 순번 가져오기
  const getInitialSeq = () => {
    const saved = localStorage.getItem('last_job_sequence_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.year === currentYear) {
          return Number(parsed.seq || 277) + 1;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return 277; // 기본 시작 순번
  };

  const [seqNumber, setSeqNumber] = useState(getInitialSeq());
  const formattedSeq = String(seqNumber).padStart(3, '0');
  
  // 생성 코드: (고유번호)-(YYMMDD)-(회사코드+순번) 예: 44 - 260812 - 3277
  const generatedCode = `${userCode} - ${dateYYMMDD} - ${companyCode}${formattedSeq}`;

  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'print' | 'design'
  const [customerNameInput, setCustomerNameInput] = useState('');

  const [formData, setFormData] = useState({
    code_number: generatedCode,
    seq: seqNumber,
    manager_name: userName,
    receipt_date: today,
    delivery_date: today,
    delivery_time: '',
    customer_id: '',
    dept: '',
    title: '',
    spec: '',
    pages: '',
    duplex: '',
    quantity: '',
    estimated_price: '',
    client_contact_person: '',
    client_phone: '',
    client_email: '',
    email_receipt_time: '',
    cover_job: '',
    cover_paper: '',
    cover_print: '',
    coating: '',
    inner_job: '',
    inner_paper: '',
    inner_print: '',
    interleaf_paper: '',
    binding: '',
    draft_email: '',
    draft_group: '',
    mail_sender: '',
    cover_proof_date: '',
    inner_proof_date: '',
    proof_method: '',
    planning: '',
    photography: '',
    illustration: '',
    copyright_web: '',
    production_progress: '',
    delivery_destination: '',
    cover_related: '',
    inner_related: '',
    request_note: '',
    editor_name: userName,
    designer_name: '',
  });

  // 순번 변경 시 실시간 코드번호 업데이트
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

  // 고객사명 입력 또는 선택 시 자동 완성 처리
  const handleCustomerNameChange = (typedName) => {
    setCustomerNameInput(typedName);
    const matched = customers.find(c => c.name.trim() === typedName.trim());
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCustName = customerNameInput.trim();
    if (!finalCustName) return alert('발주처(고객사명)를 입력하거나 선택해 주세요.');
    if (!formData.title) return alert('품명(작업제목)을 입력해 주세요.');

    // 💡 미등록 고객사일 경우 [01_고객관리] DB에 자동 등록 생성!
    let custId = formData.customer_id;
    const existingCust = customers.find(c => c.name.trim() === finalCustName);
    if (!existingCust && addCustomer) {
      const createdCust = await addCustomer({
        name: finalCustName,
        dept: formData.dept,
        contact_person: formData.client_contact_person,
        phone: formData.client_phone,
        email: formData.client_email,
        staff_manager_name: userName,
      });
      if (createdCust?.id) {
        custId = createdCust.id;
      }
    } else if (existingCust) {
      custId = existingCust.id;
    }

    // 💡 다음 전표를 위해 마지막 순번 기억 저장!
    localStorage.setItem('last_job_sequence_info', JSON.stringify({
      year: currentYear,
      seq: formData.seq,
    }));

    onSave({
      ...formData,
      customer_id: custId,
      customer_name: finalCustName,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 헤더 영역 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              의뢰 작업전표 상세 접수 폼
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 코드번호 및 순번 설정 배너 */}
        <div className="bg-slate-900 px-6 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded font-bold">코드번호</span>
            <span className="text-lg font-mono font-extrabold text-rose-400 tracking-wider">
              {formData.code_number}
            </span>
          </div>

          {/* 수동 순번 지정 입력창 */}
          <div className="flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">전표 순번:</span>
            <input
              type="number"
              min="1"
              max="9999"
              value={formData.seq}
              onChange={e => handleSeqChange(e.target.value)}
              className="w-16 p-1 bg-slate-900 border border-slate-600 rounded text-center text-amber-300 font-mono font-extrabold text-xs"
              title="임의 순번 지정 시 다음 작성부터 1씩 자동 증가합니다."
            />
            <span className="text-[10px] text-slate-400"> (다음 전표부터 +1 자동증가)</span>
          </div>
        </div>

        {/* 서브 탭 3종 */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 text-xs font-bold space-x-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center space-x-1.5 ${
              activeTab === 'basic' ? 'bg-white text-sky-700 border-t-2 border-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>1. 발주 & 기본 정보</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center space-x-1.5 ${
              activeTab === 'print' ? 'bg-white text-sky-700 border-t-2 border-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>2. 인쇄/표지/내지/제본 사양</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center space-x-1.5 ${
              activeTab === 'design' ? 'bg-white text-sky-700 border-t-2 border-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. 교정/기획/디자인/요청사항</span>
          </button>
        </div>

        {/* 탭 본문 영역 */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* TAB 1: 발주 & 기본 정보 */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>발주처 (고객사명) *</span>
                    <span className="text-[10px] text-sky-600 font-normal">※ 신규 입력 시 고객DB에 자동등록</span>
                  </label>

                  {/* 💡 고객사명만 표기되는 직접 입력 + 자동완성 datalist */}
                  <div className="relative">
                    <input
                      type="text"
                      list="customer-name-suggestions"
                      required
                      placeholder="고객사명 입력 또는 선택 (예: 기후에너지환경부)"
                      value={customerNameInput}
                      onChange={e => handleCustomerNameChange(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                    <datalist id="customer-name-suggestions">
                      {customers.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">과/부서명</label>
                  <input
                    type="text"
                    placeholder="예: 물관리위원회지원단"
                    value={formData.dept}
                    onChange={e => setFormData({ ...formData, dept: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">품명 (작업제목) *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 사업 안내 책자 및 카탈로그 제작"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">발주업체 담당자</label>
                  <input
                    type="text"
                    placeholder="예: 강성희"
                    value={formData.client_contact_person}
                    onChange={e => setFormData({ ...formData, client_contact_person: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">담당자 연락처</label>
                  <input
                    type="text"
                    placeholder="예: 010-1234-5678"
                    value={formData.client_phone}
                    onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">이메일 주소</label>
                  <input
                    type="email"
                    placeholder="example@domain.com"
                    value={formData.client_email}
                    onChange={e => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">접수 일자</label>
                  <input
                    type="date"
                    value={formData.receipt_date}
                    onChange={e => setFormData({ ...formData, receipt_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">납품 희망일</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">납품 시간</label>
                  <input
                    type="time"
                    value={formData.delivery_time}
                    onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                <div>
                  <label className="block font-semibold text-sky-800 mb-1">견적 산정 금액 (원)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.estimated_price}
                    onChange={e => setFormData({ ...formData, estimated_price: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-sky-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-sky-800 mb-1">이메일 접수 시간</label>
                  <input
                    type="time"
                    value={formData.email_receipt_time}
                    onChange={e => setFormData({ ...formData, email_receipt_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 인쇄/표지/내지/제본 사양 */}
          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">규격 (사이즈)</label>
                  <input
                    type="text"
                    placeholder="예: A4"
                    value={formData.spec}
                    onChange={e => setFormData({ ...formData, spec: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">면수 (페이지)</label>
                  <input
                    type="text"
                    placeholder="예: 100"
                    value={formData.pages}
                    onChange={e => setFormData({ ...formData, pages: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">양/단면</label>
                  <select
                    value={formData.duplex}
                    onChange={e => setFormData({ ...formData, duplex: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">선택</option>
                    <option value="양면">양면</option>
                    <option value="단면">단면</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">수량 (부)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              {/* 표지 사양 그룹 */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">📘 표지 사양 (Cover Specification)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">표지 작업</label>
                    <input type="text" value={formData.cover_job} onChange={e => setFormData({...formData, cover_job: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">표지 용지</label>
                    <input type="text" value={formData.cover_paper} onChange={e => setFormData({...formData, cover_paper: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">표지 인쇄</label>
                    <input type="text" value={formData.cover_print} onChange={e => setFormData({...formData, cover_print: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">코팅</label>
                    <input type="text" value={formData.coating} onChange={e => setFormData({...formData, coating: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                </div>
              </div>

              {/* 내지 & 간지 사양 그룹 */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">📖 내지 & 간지 & 제본 사양 (Inner & Binding)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">내지 작업</label>
                    <input type="text" value={formData.inner_job} onChange={e => setFormData({...formData, inner_job: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">내지 용지</label>
                    <input type="text" value={formData.inner_paper} onChange={e => setFormData({...formData, inner_paper: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">내지 인쇄</label>
                    <input type="text" value={formData.inner_print} onChange={e => setFormData({...formData, inner_print: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">간지 용지</label>
                    <input type="text" value={formData.interleaf_paper} onChange={e => setFormData({...formData, interleaf_paper: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">제본</label>
                    <input type="text" value={formData.binding} onChange={e => setFormData({...formData, binding: e.target.value})} className="w-full p-2 border rounded-lg font-bold text-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 교정/기획/디자인/요청사항 */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">표지 교정일</label>
                  <input type="date" value={formData.cover_proof_date} onChange={e => setFormData({...formData, cover_proof_date: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">내지 교정일</label>
                  <input type="date" value={formData.inner_proof_date} onChange={e => setFormData({...formData, inner_proof_date: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">교정 방법</label>
                  <input type="text" value={formData.proof_method} onChange={e => setFormData({...formData, proof_method: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">제작 진행 상태</label>
                  <select value={formData.production_progress} onChange={e => setFormData({...formData, production_progress: e.target.value})} className="w-full p-2 border rounded-lg font-bold text-sky-700">
                    <option value="">선택</option>
                    <option value="진행중">진행중</option>
                    <option value="교정대기">교정대기</option>
                    <option value="인쇄대기">인쇄대기</option>
                    <option value="제본대기">제본대기</option>
                    <option value="납품완료">납품완료</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">기획 여부</label>
                  <input type="text" value={formData.planning} onChange={e => setFormData({...formData, planning: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">사진 촬영</label>
                  <input type="text" value={formData.photography} onChange={e => setFormData({...formData, photography: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">일러스트 필요</label>
                  <input type="text" value={formData.illustration} onChange={e => setFormData({...formData, illustration: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">저작권/웹게시</label>
                  <input type="text" value={formData.copyright_web} onChange={e => setFormData({...formData, copyright_web: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">편집 작업자</label>
                  <input type="text" value={formData.editor_name} onChange={e => setFormData({...formData, editor_name: e.target.value})} className="w-full p-2 border rounded-lg font-semibold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">디자인 작업자</label>
                  <input type="text" value={formData.designer_name} onChange={e => setFormData({...formData, designer_name: e.target.value})} className="w-full p-2 border rounded-lg font-semibold" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">특이사항 및 요청사항</label>
                <textarea
                  rows={2}
                  placeholder="작업 전표 특별 요청사항 기록"
                  value={formData.request_note}
                  onChange={e => setFormData({ ...formData, request_note: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}

        </div>

        {/* 푸터 영역 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            사원번호: {userCode} | 회사코드: {companyCode}
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>전표 접수 완료</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
