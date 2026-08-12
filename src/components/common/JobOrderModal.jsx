// src/components/common/JobOrderModal.jsx
import React, { useState } from 'react';
import { X, ClipboardList, CheckCircle2, UserCheck, Printer, FileText } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';

export default function JobOrderModal({ customers, onSave, onClose }) {
  const { user } = useGoogleAuth();
  const today = new Date().toISOString().split('T')[0];
  
  // 날짜 기반 YYMMDD 생성 (예: 260812)
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateYYMMDD = `${yy}${mm}${dd}`;

  const userCode = user?.userCode || '84';
  const userName = user?.userName || '홍길동';
  const companyCode = user?.companyCode || '3';
  const randomSeq = Math.floor(100 + Math.random() * 900); // 3자리 순번

  // 코드번호 예시: 84 - 260812 - 3277
  const generatedCode = `${userCode} - ${dateYYMMDD} - ${companyCode}${randomSeq}`;

  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'print' | 'design'

  const [formData, setFormData] = useState({
    // 1~5
    code_number: generatedCode,
    manager_name: userName,
    receipt_date: today,
    delivery_date: today,
    delivery_time: '14:00',
    // 6~7
    customer_id: customers.length > 0 ? customers[0].id : '',
    dept: customers[0]?.dept || '',
    // 8~13
    title: '',
    spec: 'A4',
    pages: '100',
    duplex: '양면',
    quantity: 500,
    estimated_price: 1500000,
    // 14~17
    client_contact_person: customers[0]?.contact_person || '',
    client_phone: customers[0]?.phone || '',
    client_email: '',
    email_receipt_time: '10:00',
    // 18~21 (표지)
    cover_job: '4도 칼라',
    cover_paper: '아트지 250g',
    cover_print: '옵셋인쇄',
    coating: '유광코팅',
    // 22~26 (내지 & 제본)
    inner_job: '1도 흑백',
    inner_paper: '모조지 80g',
    inner_print: '옵셋인쇄',
    interleaf_paper: '색지 80g',
    binding: '무선제본',
    // 27~32 (교정 & 메일)
    draft_email: '',
    draft_group: '',
    mail_sender: '',
    cover_proof_date: today,
    inner_proof_date: today,
    proof_method: 'PDF 교정',
    // 33~37 (제작 & 기획)
    planning: '기획 포함',
    photography: '해당 없음',
    illustration: '필요',
    copyright_web: '허용',
    production_progress: '진행중',
    // 38~43 (비고 & 작업자)
    delivery_destination: '본사 납품',
    cover_related: '',
    inner_related: '',
    request_note: '',
    editor_name: userName,
    designer_name: '디자이너',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_id) return alert('발주처(고객사)를 선택해 주세요.');
    if (!formData.title) return alert('품명(작업제목)을 입력해 주세요.');

    onSave(formData);
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

        {/* 🚨 코드번호 강조 배너 (이미지 서식과 동일 적용) */}
        <div className="bg-slate-900 px-6 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded font-bold">코드번호</span>
            <span className="text-lg font-mono font-extrabold text-rose-400 tracking-wider">
              {formData.code_number}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-300">
            <span>담당자: <strong className="text-sky-300">{formData.manager_name}</strong></span>
            <span>작업자: <strong className="text-emerald-300">{formData.editor_name}</strong></span>
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
                  <label className="block font-bold text-slate-700 mb-1">발주처 (고객사명) *</label>
                  <select
                    value={formData.customer_id}
                    onChange={e => {
                      const cust = customers.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        customer_id: e.target.value,
                        dept: cust?.dept || '',
                        client_contact_person: cust?.contact_person || '',
                        client_phone: cust?.phone || '',
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">과/부서명</label>
                  <input
                    type="text"
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
                    value={formData.client_contact_person}
                    onChange={e => setFormData({ ...formData, client_contact_person: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">담당자 연락처</label>
                  <input
                    type="text"
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
                    value={formData.spec}
                    onChange={e => setFormData({ ...formData, spec: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">면수 (페이지)</label>
                  <input
                    type="text"
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
                    <option value="양면">양면</option>
                    <option value="단면">단면</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">수량 (부)</label>
                  <input
                    type="number"
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
