// src/pages/PaymentPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, CreditCard, Calendar } from 'lucide-react';

export default function PaymentPage() {
  const { payments, customers, addPayment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    payment_date: today,
    customer_id: '',
    amount: 1000000,
    method: '계좌이체',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) return alert('고객사를 선택해 주세요.');

    try {
      setSubmitting(true);
      await addPayment(formData);
      alert('수금 내역이 구글 시트에 기록되었습니다!');
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
          <p className="text-xs text-slate-500 mt-0.5">입금 완료된 수금 내역을 구글 시트에 저장합니다.</p>
        </div>
        <button
          onClick={() => {
            if (customers.length > 0) {
              setFormData(prev => ({ ...prev, customer_id: customers[0].id }));
            }
            setShowModal(true);
          }}
          className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>수금 내역 등록</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {payments.map((p, idx) => {
            const cust = customers.find(c => c.id === p.customer_id);
            return (
              <div key={p.id || idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-sm">
                      {cust ? `${cust.name} (${cust.dept})` : `고객 ID: ${p.customer_id}`}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>수금일: {p.payment_date}</span>
                      <span>• 결제수단: {p.method}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-600">+{p.amount.toLocaleString()} 원</span>
                  <p className="text-[11px] font-mono text-slate-400">{p.id}</p>
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
            <h3 className="text-lg font-bold text-slate-800">신규 수금 등록</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">고객선택 *</label>
                <select
                  value={formData.customer_id}
                  onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">수금액 (원)</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
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
                {submitting ? '시트 저장 중...' : '수금 완료 저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}