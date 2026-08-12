// src/pages/SalesPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Calendar, Share2 } from 'lucide-react';

export default function SalesPage() {
  const { sales, customers, addSales } = useData();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    reg_date: today,
    receipt_date: today,
    delivery_date: today,
    delivery_time: '14:00',
    customer_id: '',
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
  });

  // 공급가액 입력 시 부가세 10% 자동 계산
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
      await addSales(formData);
      alert('매출 내역이 구글 시트 저장 및 Webhook 연동되었습니다!');
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
          <p className="text-xs text-slate-500 mt-0.5">매출 입력 시 구글 시트 기록과 구글 캘린더 연동이 자동 실행됩니다.</p>
        </div>
        <button
          onClick={() => {
            if (customers.length > 0) {
              setFormData(prev => ({ ...prev, customer_id: customers[0].id }));
            }
            setShowModal(true);
          }}
          className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>매출/견적 등록</span>
        </button>
      </div>

      <div className="space-y-3">
        {sales.map((item, idx) => {
          const cust = customers.find(c => c.id === item.customer_id);
          return (
            <div key={item.id || idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
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
                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900">{item.total_price.toLocaleString()} 원</span>
                  <p className="text-[11px] text-slate-400">공급가: {item.supply_price.toLocaleString()}원</p>
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

      {/* 매출 입력 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800">신규 매출/견적 입력</h3>
            
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

              {/* 자동화 체크박스 */}
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
                {submitting ? '저장 & Webhook 중...' : '시트에 저장하기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}