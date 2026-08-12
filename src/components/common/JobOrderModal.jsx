// src/components/common/JobOrderModal.jsx
import React, { useState } from 'react';
import { X, ClipboardList, CheckCircle2 } from 'lucide-react';

export default function JobOrderModal({ customers, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    order_date: today,
    customer_id: customers.length > 0 ? customers[0].id : '',
    title: '',
    content: '',
    delivery_date: today,
    delivery_time: '14:00',
    estimated_price: 1000000,
    status: '의뢰접수',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_id) return alert('고객사를 선택해 주세요.');
    if (!formData.title) return alert('작업명을 입력해 주세요.');

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">의뢰 작업전표 접수 입력</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          신규 의뢰 들어온 작업전표를 등록해 두면, 추후 매출/견적서 등록 시 1클릭으로 모든 정보가 자동 연동됩니다.
        </p>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">고객선택 *</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">의뢰 작업명 (제목) *</label>
            <input
              type="text"
              required
              placeholder="예: 2026 하반기 인쇄물 및 웹 홍보 전표"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">접수 일자</label>
              <input
                type="date"
                value={formData.order_date}
                onChange={e => setFormData({ ...formData, order_date: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">납품 희망일</label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">예상 공급가액 (원)</label>
            <input
              type="number"
              value={formData.estimated_price}
              onChange={e => setFormData({ ...formData, estimated_price: Number(e.target.value) })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">상세 의뢰 내용 및 요구사항</label>
            <textarea
              rows={3}
              placeholder="의뢰서/전표 상세 사양 및 요구사항 입력"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>작업전표 접수 완료</span>
          </button>
        </div>
      </form>
    </div>
  );
}
