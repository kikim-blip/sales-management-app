// src/pages/PaymentPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Plus, CreditCard, Calendar, Pencil, Trash2, FileSearch, Search } from 'lucide-react';
import SelectJobOrderModal from '../components/common/SelectJobOrderModal';
import { getLocalDateStr } from '../utils/dateUtils';

export default function PaymentPage() {
  const { payments, customers, contacts = [], staffs = [], jobOrders, addPayment, updatePayment, deletePayment, selectedTeamGroup } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showSelectJobModal, setShowSelectJobModal] = useState(false);

  const today = getLocalDateStr();

  const filteredPayments = payments.filter(p => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;
    if (p.dept && p.dept === selectedTeamGroup) return true;
    const cust = customers.find(c => c.id === p.customer_id);
    if (cust) {
      if (cust.dept === selectedTeamGroup) return true;
      if (cust.sales_manager === selectedTeamGroup) return true;
      const mgrStaff = staffs.find(s => s.userName === cust.sales_manager);
      if (mgrStaff && (mgrStaff.team === selectedTeamGroup || mgrStaff.dept === selectedTeamGroup)) return true;
    }
    return false;
  });
  const defaultForm = {
    payment_date: today,
    customer_id: '',
    customer_name: '',
    dept: '',
    amount: '',
    method: '계좌이체',
    note: '',
  };

  const [formData, setFormData] = useState(defaultForm);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const customerSearchResults = (() => {
    if (!customerSearchInput.trim()) return [];
    const q = customerSearchInput.trim().toLowerCase();
    const results = [];

    customers.forEach(c => {
      const cMatch = 
        (c.name || '').toLowerCase().includes(q) ||
        (c.dept || '').toLowerCase().includes(q) ||
        (c.sales_manager || '').toLowerCase().includes(q);

      const custContacts = contacts.filter(ct => ct.customer_id === c.id);

      if (cMatch) {
        if (custContacts.length === 0) {
          results.push({ ...c }); 
        } else {
          custContacts.forEach(ct => {
            results.push({
              ...c,
              contact_person: ct.name,
              phone: ct.phone,
              mobile: ct.mobile,
              email: ct.email,
              contact_id: ct.id
            });
          });
        }
      } else {
        const matchedContacts = custContacts.filter(ct => 
          (ct.name || '').toLowerCase().includes(q) ||
          (ct.phone || '').includes(q) ||
          (ct.mobile || '').includes(q) ||
          (ct.email || '').toLowerCase().includes(q)
        );
        matchedContacts.forEach(ct => {
          results.push({
            ...c,
            contact_person: ct.name,
            phone: ct.phone,
            mobile: ct.mobile,
            email: ct.email,
            contact_id: ct.id
          });
        });
      }
    });

    return results.slice(0, 50);
  })();

  const openNewModal = () => {
    setEditingId(null);
    setCustomerNameInput('');
    setCustomerSearchInput('');
    setShowCustomerDropdown(false);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    const cust = customers.find(c => c.id === p.customer_id);
    const cName = cust ? cust.name : (p.customer_id || '');
    const cDept = cust ? cust.dept : '';

    setCustomerNameInput(cName);
    setCustomerSearchInput('');
    setShowCustomerDropdown(false);
    setFormData({
      payment_date: p.payment_date || today,
      customer_id: p.customer_id || '',
      customer_name: cName,
      dept: cDept,
      amount: p.amount || '',
      method: p.method || '계좌이체',
      note: p.note || '',
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
                    {p.note && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        비고: {p.note}
                      </div>
                    )}
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
              
              {/* 검색 필드 추가 */}
              <div ref={customerDropdownRef} className="relative mb-2">
                <label className="block text-[11px] font-bold text-emerald-700 mb-1">🔍 기존 등록 고객 검색하여 정보 불러오기</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="고객사명, 부서명, 담당자명으로 검색..."
                    value={customerSearchInput}
                    onChange={e => {
                      setCustomerSearchInput(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => {
                      if (customerSearchInput.trim()) setShowCustomerDropdown(true);
                    }}
                    className="w-full pl-8 pr-2.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {customerSearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchInput('');
                        setShowCustomerDropdown(false);
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showCustomerDropdown && customerSearchInput.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                    <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                      <span>검색 결과 ({customerSearchResults.length}건)</span>
                      <button
                        type="button"
                        onClick={() => setShowCustomerDropdown(false)}
                        className="text-slate-500 hover:text-slate-800 font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 text-[11px]"
                      >
                        ✕ 닫기
                      </button>
                    </div>
                    {customerSearchResults.length > 0 ? (
                      customerSearchResults.map((c, idx) => (
                        <button
                          key={`${c.id}-${c.contact_id || idx}`}
                          type="button"
                          onClick={() => {
                            setCustomerNameInput(c.name);
                            setFormData(prev => ({
                              ...prev,
                              customer_id: c.id,
                              customer_name: c.name,
                              dept: c.dept || prev.dept,
                            }));
                            setCustomerSearchInput('');
                            setShowCustomerDropdown(false);
                          }}
                          className="w-full text-left p-2.5 hover:bg-emerald-50 cursor-pointer flex flex-col transition"
                        >
                          <span className="font-bold text-slate-800">{c.name} {c.dept ? `(${c.dept})` : ''}</span>
                          <span className="text-[11px] text-slate-400">
                            {c.contact_person ? `담당: ${c.contact_person}` : ''} {c.phone ? `| ${c.phone}` : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-500 text-[11px]">
                        검색 결과가 없습니다. 아래에 직접 기입해 주세요.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">고객사명 *</label>
                  <input
                    type="text"
                    required
                    placeholder="고객사명 직접 입력"
                    value={formData.customer_name}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomerNameInput(val);
                      setFormData(prev => ({ ...prev, customer_name: val, customer_id: val }));
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">비고 (내역 등 상세 메모)</label>
                <textarea
                  placeholder="수금 관련 참고사항이나 메모를 자유롭게 기입하세요."
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs resize-y min-h-[60px]"
                />
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