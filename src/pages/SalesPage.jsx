// src/pages/SalesPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Calendar, Share2, Pencil, Trash2, ClipboardList, FileText, FileSearch, Printer, CheckCircle2, Truck, DollarSign } from 'lucide-react';
import JobOrderModal from '../components/common/JobOrderModal';
import SelectJobOrderModal from '../components/common/SelectJobOrderModal';
import QuotePrintModal from '../components/common/QuotePrintModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';

export default function SalesPage() {
  const { sales, customers, jobOrders, addSales, updateSales, deleteSales, addJobOrder, addPayment, selectedTeamGroup } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showJobOrderModal, setShowJobOrderModal] = useState(false);
  const [showSelectJobModal, setShowSelectJobModal] = useState(false);

  const [printingQuote, setPrintingQuote] = useState(null);
  const [printingJobOrder, setPrintingJobOrder] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const filteredSales = sales.filter(s => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;
    if (s.dept && s.dept === selectedTeamGroup) return true;
    const cust = customers.find(c => c.id === s.customer_id);
    if (cust && cust.dept === selectedTeamGroup) return true;
    return false;
  });

  const defaultForm = {
    reg_date: today,
    receipt_date: today,
    delivery_date: today,
    delivery_time: '14:00',
    customer_id: '',
    customer_name: '',
    dept: '',
    title: '',
    content: '',
    note: '',
    billing_schedule: '진행중', // 💡 신규 등록 기본 상태: 진행중
    type: '매출',
    supply_price: '',
    tax: 0,
    total_price: 0,
    calendar_synced: true,
    superthread_synced: true,
  };

  const [formData, setFormData] = useState(defaultForm);
  const [customerNameInput, setCustomerNameInput] = useState('');

  // 신규 작업전표 저장
  const handleSaveJobOrder = async (newOrder) => {
    await addJobOrder(newOrder);
    alert('작업전표가 정상 등록되었습니다!');
    setShowJobOrderModal(false);
  };

  // 작업전표 클릭 시 폼에 자동 입력 (Auto-fill)
  const handleSelectJobOrder = (order) => {
    const supply = order.estimated_price || 0;
    const tax = Math.round(supply * 0.1);
    
    const cust = customers.find(c => c.id === order.customer_id);
    const cName = cust ? cust.name : (order.customer_name || order.customer_id || '');
    const cDept = cust ? cust.dept : (order.dept || '');

    setCustomerNameInput(cName);
    setFormData(prev => ({
      ...prev,
      customer_id: order.customer_id || cName,
      customer_name: cName,
      dept: cDept,
      title: order.title,
      content: `[코드: ${order.code_number || order.id}] ${order.cover_job || ''} / ${order.binding || ''}`,
      note: `담당: ${order.manager_name} (코드: ${order.code_number})`,
      delivery_date: order.delivery_date || today,
      delivery_time: order.delivery_time || '14:00',
      supply_price: supply,
      tax: tax,
      total_price: supply + tax,
    }));
    setShowSelectJobModal(false);
    alert(`[${order.code_number}] ${order.title} 전표 정보가 매출 폼에 자동 입력되었습니다!`);
  };

  // 💡 고객사명, 과/부서명, 담당자명, 영업담당자 확장 스마트 검색 매칭
  const handleCustomerNameChange = (typedName) => {
    setCustomerNameInput(typedName);
    const cleaned = typedName.trim().toLowerCase();

    const matched = customers.find(c => 
      (c.name || '').toLowerCase() === cleaned ||
      (c.dept || '').toLowerCase() === cleaned ||
      (c.contact_person || '').toLowerCase() === cleaned ||
      (c.sales_manager || '').toLowerCase() === cleaned ||
      `${c.name} ${c.dept}`.toLowerCase().includes(cleaned) ||
      `${c.name} (${c.dept})`.toLowerCase().includes(cleaned) ||
      `${c.name} - ${c.contact_person}`.toLowerCase().includes(cleaned)
    );

    if (matched) {
      setCustomerNameInput(matched.name);
      setFormData(prev => ({
        ...prev,
        customer_id: matched.id,
        customer_name: matched.name,
        dept: matched.dept || prev.dept,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: typedName,
        customer_name: typedName,
      }));
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setCustomerNameInput('');
    setFormData(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    const cust = customers.find(c => c.id === item.customer_id);
    const cName = cust ? cust.name : (item.customer_id || '');
    const cDept = cust ? cust.dept : '';
    setCustomerNameInput(cName);

    setFormData({
      reg_date: item.reg_date || today,
      receipt_date: item.receipt_date || today,
      delivery_date: item.delivery_date || today,
      delivery_time: item.delivery_time || '14:00',
      customer_id: item.customer_id || '',
      customer_name: cName,
      dept: cDept,
      title: item.title || '',
      content: item.content || '',
      note: item.note || '',
      billing_schedule: item.billing_schedule || '진행중',
      type: item.type || '매출',
      supply_price: item.supply_price || '',
      tax: item.tax || 0,
      total_price: item.total_price || 0,
      calendar_synced: !!item.calendar_synced,
      superthread_synced: !!item.superthread_synced,
    });
    setShowModal(true);
  };

  // 💡 상태 변경: [납품완료] 처리
  const handleMarkDelivered = async (item) => {
    try {
      await updateSales(item.id, {
        ...item,
        billing_schedule: '납품완료',
      });
      alert(`[${item.title}] 항목이 [납품완료] 상태로 변경되었습니다.`);
    } catch (err) {
      alert('상태 변경 에러: ' + err.message);
    }
  };

  // 💡 상태 변경: [💰 수금 처리] -> 수금DB 자동 등록 + [청구완료] 전환!
  const handleCollectPayment = async (item) => {
    const cust = customers.find(c => c.id === item.customer_id);
    const custName = cust ? `${cust.name}` : (item.customer_name || item.customer_id);
    const amountStr = (item.total_price || 0).toLocaleString();

    if (!window.confirm(`[${custName}] 의 매출 건 (${amountStr}원)에 대해 수금 처리를 진행하시겠습니까?\n\n진행 내용:\n1) [03_수금관리] DB에 입금 데이터 자동 기록\n2) 해당 매출 건 상태를 [청구완료]로 최종 전환`)) return;

    try {
      // 1. 수금 DB에 수금 데이터 생성
      await addPayment({
        payment_date: today,
        customer_id: item.customer_id,
        amount: item.total_price || 0,
        method: '계좌이체',
      });

      // 2. 매출 DB 항목 상태를 [청구완료]로 업데이트
      await updateSales(item.id, {
        ...item,
        billing_schedule: '청구완료',
      });

      alert(`[${custName}] 수금 처리 (${amountStr}원) 및 [청구완료] 최종 전환이 완료되었습니다!`);
    } catch (err) {
      alert('수금 처리 에러: ' + err.message);
    }
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
      supply_price: val === '' ? '' : supply,
      tax: tax,
      total_price: supply + tax,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerNameInput.trim()) return alert('고객사명을 입력하거나 선택해 주세요.');
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

  // 상태 뱃지 렌더링 헬퍼
  const renderStatusBadge = (status) => {
    if (status === '청구완료') {
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-lg font-extrabold flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span>청구완료 (수금완료)</span></span>;
    }
    if (status === '납품완료') {
      return <span className="bg-sky-100 text-sky-800 border border-sky-300 text-xs px-2.5 py-1 rounded-lg font-extrabold flex items-center space-x-1"><Truck className="w-3.5 h-3.5 text-sky-600" /><span>납품완료</span></span>;
    }
    return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-lg font-extrabold flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>진행중</span></span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">매출 및 견적 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">상태를 [진행중 ➔ 납품완료 ➔ 수금처리(청구완료)] 순으로 체계적으로 관리합니다.</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* 실물 전표 인쇄 팝업 버튼 */}
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
        {filteredSales.map((item, idx) => {
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
                    {renderStatusBadge(item.billing_schedule)}
                  </div>
                  <p className="text-xs font-medium text-sky-600 mt-1">
                    발주처: {cust ? `${cust.name} (${cust.dept})` : item.customer_id}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <span className="text-lg font-extrabold text-slate-900">{(item.total_price || 0).toLocaleString()} 원</span>
                  <p className="text-[11px] text-slate-400">공급가: {(item.supply_price || 0).toLocaleString()}원</p>
                  
                  <div className="flex items-center space-x-1 pt-1">
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

              {/* 하단 정보 및 수금/상태 관리 액션 버튼 */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span>납품일: <strong className="text-slate-700">{item.delivery_date} {item.delivery_time}</strong></span>
                </div>

                {/* 💡 상태에 따른 진행 ➔ 납품 ➔ 수금 버튼 액션 바 */}
                <div className="flex items-center space-x-2">
                  {item.billing_schedule === '진행중' && (
                    <button
                      onClick={() => handleMarkDelivered(item)}
                      className="flex items-center space-x-1 bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>납품 완료</span>
                    </button>
                  )}

                  {item.billing_schedule !== '청구완료' && (
                    <button
                      onClick={() => handleCollectPayment(item)}
                      className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl text-xs font-bold transition shadow-sm animate-pulse"
                    >
                      <span className="font-extrabold text-xs">₩</span>
                      <span>수금 처리 (청구완료)</span>
                    </button>
                  )}

                  {item.billing_schedule === '청구완료' && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      수금완료 (03_수금관리 연동됨)
                    </span>
                  )}
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
              
              {/* 고객사명 및 과/부서 분리 검색 입력 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">고객사명 *</label>
                  <input
                    type="text"
                    list="sales-customer-list"
                    required
                    placeholder="고객사명 검색 또는 직접 입력"
                    value={customerNameInput}
                    onChange={e => handleCustomerNameChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <datalist id="sales-customer-list">
                    {customers.map(c => (
                      <React.Fragment key={c.id}>
                        <option value={c.name} label={`${c.dept ? `[${c.dept}] ` : ''}${c.contact_person ? `담당: ${c.contact_person}` : ''}`} />
                        {c.contact_person && <option value={c.contact_person} label={`고객사: ${c.name}`} />}
                        {c.dept && <option value={c.dept} label={`고객사: ${c.name}`} />}
                      </React.Fragment>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">과/부서명</label>
                  <input
                    type="text"
                    placeholder="부서명 입력"
                    value={formData.dept}
                    onChange={e => setFormData({ ...formData, dept: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">작업명 (제목) *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 8월 소프트웨어 납품"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* 💡 상태 (진행중 ➔ 납품완료 ➔ 청구완료) 지정 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">진행 상태</label>
                  <select
                    value={formData.billing_schedule}
                    onChange={e => setFormData({ ...formData, billing_schedule: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="진행중">⏳ 진행중</option>
                    <option value="납품완료">🚚 납품완료</option>
                    <option value="청구완료">✅ 청구완료 (수금완료)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">공급가액 (원)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.supply_price}
                    onChange={e => handlePriceChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">총 청구금액 (VAT포함)</label>
                  <input
                    type="number"
                    disabled
                    value={formData.total_price}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-sky-700 text-xs"
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
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 시간</label>
                  <input
                    type="time"
                    value={formData.delivery_time}
                    onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
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
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
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