// src/pages/PaymentPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, CreditCard, Calendar, Pencil, Trash2, FileSearch } from 'lucide-react';
import SelectJobOrderModal from '../components/common/SelectJobOrderModal';
import { getLocalDateStr } from '../utils/dateUtils';

export default function PaymentPage() {
  const { payments, customers, jobOrders, addPayment, updatePayment, deletePayment, selectedTeamGroup } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showSelectJobModal, setShowSelectJobModal] = useState(false);

  const today = getLocalDateStr();

  const filteredPayments = payments.filter(p => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;
    if (p.dept && p.dept === selectedTeamGroup) return true;
    const cust = customers.find(c => c.id === p.customer_id);
    if (cust && cust.dept === selectedTeamGroup) return true;
    return false;
  });
  const defaultForm = {
    payment_date: today,
    customer_id: '',
    customer_name: '',
    dept: '',
    amount: '',
    method: '계좌이체',
  };

  const [formData, setFormData] = useState(defaultForm);
  const [customerNameInput, setCustomerNameInput] = useState('');

  // 작업전표 불러오기로 수금 폼 자동 채우기
  const handleSelectJobOrder = (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const cName = cust ? cust.name : (order.customer_name || order.customer_id || '');
    const cDept = cust ? cust.dept : (order.dept || '');

    setCustomerNameInput(cName);
    setFormData(prev => ({
      ...prev,
      customer_id: order.customer_id || cName,
      customer_name: cName,
      dept: cDept,
      amount: order.estimated_price || '',
    }));
    setShowSelectJobModal(false);
    alert(`[${order.code_number}] ${order.title} 전표의 금액(${(order.estimated_price || 0).toLocaleString()}원)과 고객사 정보가 수금 폼에 반영되었습니다!`);
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

  const openEditModal = (p) => {
    setEditingId(p.id);
    const cust = customers.find(c => c.id === p.customer_id);
    const cName = cust ? cust.name : (p.customer_id || '');
    const cDept = cust ? cust.dept : '';

    setCustomerNameInput(cName);
    setFormData({
      payment_date: p.payment_date || today,
      customer_id: p.customer_id || '',
      customer_name: cName,
      dept: cDept,
      amount: p.amount || '',
      method: p.method || '계좌이체',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 수금 내역을 삭제하시겠습니까?')) return;
    try {
      await deletePayment(id);
      alert('수금 내역이 삭제되었습니다.');
    } catch (err) {
      alert('삭제 에러: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerNameInput.trim()) return alert('고객사명을 입력하거나 선택해 주세요.');
    if (!formData.amount) return alert('수금액을 입력해 주세요.');

    try {
      setSubmitting(true);
      if (editingId) {
        await updatePayment(editingId, formData);
        alert('수금 내역이 수정되었습니다!');
      } else {
        await addPayment(formData);
        alert('수금 내역이 구글 시트에 기록되었습니다!');
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
          <h2 className="text-xl font-bold text-slate-800">수금 내역 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">입금 완료된 수금 내역을 구글 시트에 저장, 수정, 삭제합니다.</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>수금 내역 등록</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredPayments.map((p, idx) => {
            const cust = customers.find(c => c.id === p.customer_id);
            return (
              <div key={p.id || idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-sm">
                      {cust ? `${cust.name} (${cust.dept})` : `발주처: ${p.customer_id}`}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>수금일: {p.payment_date}</span>
                      <span>• 결제수단: {p.method}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-600">+{(p.amount || 0).toLocaleString()} 원</span>
                    <p className="text-[11px] font-mono text-slate-400">{p.id}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 수금 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? '수금 내역 수정' : '신규 수금 등록'}
              </h3>

              {/* 💡 작업전표 불러오기 버튼 추가! */}
              {!editingId && (
                <button
                  type="button"
                  onClick={() => setShowSelectJobModal(true)}
                  className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold transition"
                >
                  <FileSearch className="w-3.5 h-3.5 text-amber-600" />
                  <span>작업전표 불러오기</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              
              {/* 고객사명 및 과/부서 분리 검색 입력 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">고객사명 *</label>
                  <input
                    type="text"
                    list="payment-customer-list"
                    required
                    placeholder="고객사명 검색 또는 입력"
                    value={customerNameInput}
                    onChange={e => handleCustomerNameChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <datalist id="payment-customer-list">
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">수금액 (원) *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">수금일자</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">결제수단</label>
                <select
                  value={formData.method}
                  onChange={e => setFormData({ ...formData, method: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="계좌이체">계좌이체</option>
                  <option value="카드결제">카드결제</option>
                  <option value="현금">현금</option>
                  <option value="어음">어음</option>
                </select>
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
                className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : (editingId ? '수정 저장' : '수금 완료 저장')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 💡 수금 탭 작업전표 불러오기 (선택) 모달 */}
      {showSelectJobModal && (
        <SelectJobOrderModal
          jobOrders={jobOrders}
          customers={customers}
          onSelect={handleSelectJobOrder}
          onClose={() => setShowSelectJobModal(false)}
        />
      )}
    </div>
  );
}