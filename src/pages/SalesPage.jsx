// src/pages/SalesPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Calendar, Share2, Pencil, Trash2, ClipboardList, FileText, FileSearch, Printer } from 'lucide-react';
import JobOrderModal from '../components/common/JobOrderModal';
import SelectJobOrderModal from '../components/common/SelectJobOrderModal';
import QuotePrintModal from '../components/common/QuotePrintModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';

export default function SalesPage() {
  const { sales, customers, addSales, updateSales, deleteSales } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. 작업전표 관련 state
  const [jobOrders, setJobOrders] = useState([
    {
      id: 'ORDER-001',
      code_number: '84 - 260812 - 3277',
      manager_name: '강영진',
      receipt_date: '2026-08-12',
      customer_id: customers[0]?.id || 'CUST-001',
      dept: '기획예산부',
      title: '2026년 공사 주요사업 추진현황',
      spec: '210*297',
      pages: '페이지수',
      duplex: '양면',
      quantity: 50,
      estimated_price: 1500000,
      client_contact_person: '김수정',
      client_phone: '061-931-1114',
      client_email: 'ksj127@at.or.kr',
      email_receipt_time: '26.08.12 (수) 10:51',
      cover_job: '한글편집세종',
      cover_paper: '레쟈크체크백색',
      cover_print: '컬러',
      coating: '없음',
      inner_job: '한글편집세종',
      inner_paper: '백색모조100g',
      inner_print: '컬러',
      interleaf_paper: '없음',
      binding: '무선제본',
      draft_email: 'ksks5577',
      draft_group: 'aT',
      mail_sender: '김수정',
      cover_proof_date: '2026-08-12',
      inner_proof_date: '2026-08-12',
      proof_method: '리턴없음',
      planning: '기획관련내용',
      photography: '사진촬영관련내용',
      illustration: '일러스트 작업 유무',
      copyright_web: '저작권·웹게시 관련 내용',
      production_progress: '서울출력실',
      delivery_destination: '이기철팀장전달',
      cover_related: '1.첫페이지 표지사용',
      inner_related: '1.개쪽만 확인하고 올려주세요',
      request_note: '-',
      editor_name: '편집 작업자명',
      designer_name: '디자인 작업자명',
      delivery_date: '2026-08-13',
      delivery_time: '12시',
      status: '의뢰접수',
    }
  ]);
  const [showJobOrderModal, setShowJobOrderModal] = useState(false);
  const [showSelectJobModal, setShowSelectJobModal] = useState(false);

  // 2. 출력 모달 state
  const [printingQuote, setPrintingQuote] = useState(null);
  const [printingJobOrder, setPrintingJobOrder] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const defaultForm = {
    reg_date: today,
    receipt_date: today,
    delivery_date: today,
    delivery_time: '14:00',
    customer_id: customers.length > 0 ? customers[0].id : '',
    title: '',
    content: '',
    note: '',
    billing_schedule: '청구완료',
    type: '매출',
    supply_price: 1000000,
    tax: 100000,
    total_price: 1100000,
    calendar_synced: true,
    superthread_synced: true,
  };

  const [formData, setFormData] = useState(defaultForm);

  // 신규 작업전표 저장
  const handleSaveJobOrder = (newOrder) => {
    const orderId = `ORDER-${String(jobOrders.length + 1).padStart(3, '0')}`;
    setJobOrders(prev => [{ id: orderId, ...newOrder }, ...prev]);
    alert('경성문화사 1:1 작업전표가 등록되었습니다! [전표 인쇄] 버튼을 누르면 실물 서식으로 즉시 출력됩니다.');
    setShowJobOrderModal(false);
  };

  // 작업전표 클릭 시 폼에 자동 입력 (Auto-fill)
  const handleSelectJobOrder = (order) => {
    const supply = order.estimated_price || 1000000;
    const tax = Math.round(supply * 0.1);
    setFormData(prev => ({
      ...prev,
      customer_id: order.customer_id,
      title: order.title,
      content: `[코드: ${order.code_number || order.id}] ${order.content || ''}`,
      note: `담당: ${order.manager_name || '강영진'} (코드: ${order.code_number || '84-260812-3277'})`,
      delivery_date: order.delivery_date || today,
      delivery_time: order.delivery_time || '14:00',
      supply_price: supply,
      tax: tax,
      total_price: supply + tax,
    }));
    setShowSelectJobModal(false);
    alert(`[${order.code_number || '전표'}] ${order.title} 전표가 매출/견적 폼에 자동 반영되었습니다!`);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      ...defaultForm,
      customer_id: customers.length > 0 ? customers[0].id : '',
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      reg_date: item.reg_date || today,
      receipt_date: item.receipt_date || today,
      delivery_date: item.delivery_date || today,
      delivery_time: item.delivery_time || '14:00',
      customer_id: item.customer_id || (customers[0]?.id || ''),
      title: item.title || '',
      content: item.content || '',
      note: item.note || '',
      billing_schedule: item.billing_schedule || '청구완료',
      type: item.type || '매출',
      supply_price: item.supply_price || 0,
      tax: item.tax || 0,
      total_price: item.total_price || 0,
      calendar_synced: !!item.calendar_synced,
      superthread_synced: !!item.superthread_synced,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 매출/견적 항목을 시트에서 삭제하시겠습니까?')) return;
    try {
      await deleteSales(id);
      alert('성공적으로 삭제되었습니다.');
    } catch (err) {
      alert('삭제 에러: ' + err.message);
    }
  };

  const handlePriceChange = (val) => {
    const supply = Number(val) || 0;
    const tax = Math.round(supply * 0.1);
    setFormData(prev => ({
      ...prev,
      supply_price: supply,
      tax: tax,
      total_price: supply + tax,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) return alert('고객사를 선택해 주세요.');
    if (!formData.title) return alert('작업명을 입력해 주세요.');

    try {
      setSubmitting(true);
      if (editingId) {
        await updateSales(editingId, formData);
        alert('매출/견적 항목이 구글 시트에 수정 적용되었습니다!');
      } else {
        await addSales(formData);
        alert('신규 매출이 구글 시트 저장 및 Webhook 연동되었습니다!');
      }
      setShowModal(false);
    } catch (err) {
      alert('저장 에러: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">매출 및 견적 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">의뢰전표 연동, 구글 시트 저장, 견적서/비교견적서 PDF 출력이 가능합니다.</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* 경성문화사 실물 전표 인쇄 팝업 버튼 */}
          <button
            onClick={() => setPrintingJobOrder(jobOrders[0])}
            className="flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>실물 전표 인쇄</span>
          </button>

          {/* 작업전표 신규 접수 버튼 */}
          <button
            onClick={() => setShowJobOrderModal(true)}
            className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <ClipboardList className="w-4 h-4 text-sky-400" />
            <span>의뢰 전표 접수</span>
          </button>

          {/* 매출/견적 등록 버튼 */}
          <button
            onClick={openNewModal}
            className="flex items-center justify-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>매출/견적 등록</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sales.map((item, idx) => {
          const cust = customers.find(c => c.id === item.customer_id);
          return (
            <div key={item.id || idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      item.type === '매출' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.type}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                  </div>
                  <p className="text-xs font-medium text-sky-600 mt-1">
                    {cust ? `${cust.name} - ${cust.dept}` : `고객 ID: ${item.customer_id}`}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <span className="text-lg font-extrabold text-slate-900">{item.total_price.toLocaleString()} 원</span>
                  <p className="text-[11px] text-slate-400">공급가: {item.supply_price.toLocaleString()}원</p>
                  
                  <div className="flex items-center space-x-1 pt-1">
                    {/* 견적서/비교견적서 문서 출력 버튼 */}
                    <button
                      onClick={() => setPrintingQuote({ quote: item, customer: cust })}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition mr-1"
                      title="견적서/비교견적서 문서 출력"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>견적서 출력</span>
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      title="수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {item.content && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {item.content}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span>납품일: <strong className="text-slate-700">{item.delivery_date} {item.delivery_time}</strong></span>
                  <span>상태: <strong className="text-slate-700">{item.billing_schedule}</strong></span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] ${
                    item.calendar_synced ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    <span>캘린더</span>
                  </span>

                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] ${
                    item.superthread_synced ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Share2 className="w-3 h-3" />
                    <span>슈퍼스레드</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. 신규/수정 매출 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? '매출/견적 항목 수정' : '신규 매출/견적 입력'}
              </h3>

              {/* 작업전표 불러오기 (자동채우기) 버튼 */}
              {!editingId && (
                <button
                  type="button"
                  onClick={() => setShowSelectJobModal(true)}
                  className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                >
                  <FileSearch className="w-3.5 h-3.5 text-amber-600" />
                  <span>작업전표 불러오기</span>
                </button>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">고객선택 (고객사명 - 과/부서명) *</label>
                <select
                  value={formData.customer_id}
                  onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.dept} ({c.contact_person})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">작업명 (제목) *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 8월 소프트웨어 납품"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">공급가액 (원)</label>
                  <input
                    type="number"
                    value={formData.supply_price}
                    onChange={e => handlePriceChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">총 청구금액 (VAT포함)</label>
                  <input
                    type="number"
                    disabled
                    value={formData.total_price}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-sky-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 예정일</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 시간</label>
                  <input
                    type="time"
                    value={formData.delivery_time}
                    onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">작업 상세 내용</label>
                <textarea
                  rows={2}
                  placeholder="작업 상세 내용 입력"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">외부 자동화 연동 선택</p>
                <div className="flex space-x-4 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.calendar_synced}
                      onChange={e => setFormData({ ...formData, calendar_synced: e.target.checked })}
                      className="rounded text-sky-600"
                    />
                    <span>구글 캘린더 자동 등록</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.superthread_synced}
                      onChange={e => setFormData({ ...formData, superthread_synced: e.target.checked })}
                      className="rounded text-sky-600"
                    />
                    <span>슈퍼스레드 Webhook 알림</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : (editingId ? '수정 내용 저장' : '시트에 저장하기')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. 신규 작업전표 접수 모달 */}
      {showJobOrderModal && (
        <JobOrderModal
          customers={customers}
          onSave={handleSaveJobOrder}
          onClose={() => setShowJobOrderModal(false)}
        />
      )}

      {/* 3. 작업전표 불러오기 (선택) 모달 */}
      {showSelectJobModal && (
        <SelectJobOrderModal
          jobOrders={jobOrders}
          customers={customers}
          onSelect={handleSelectJobOrder}
          onClose={() => setShowSelectJobModal(false)}
        />
      )}

      {/* 4. 견적서 / 비교견적서 문서 출력 모달 */}
      {printingQuote && (
        <QuotePrintModal
          quote={printingQuote.quote}
          customer={printingQuote.customer}
          onClose={() => setPrintingQuote(null)}
        />
      )}

      {/* 5. 경성문화사 실물 작업전표 1:1 출력 모달 */}
      {printingJobOrder && (
        <JobOrderPrintModal
          order={printingJobOrder}
          customer={customers.find(c => c.id === printingJobOrder.customer_id)}
          onClose={() => setPrintingJobOrder(null)}
        />
      )}
    </div>
  );
}