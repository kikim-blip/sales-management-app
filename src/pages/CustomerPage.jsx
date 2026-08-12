// src/pages/CustomerPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, UserPlus } from 'lucide-react';

export default function CustomerPage() {
  const { customers, addCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dept: '',
    contact_person: '',
    phone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert('고객사명을 입력해 주세요.');

    try {
      setSubmitting(true);
      await addCustomer(formData);
      alert('신규 고객이 구글 시트에 저장되었습니다!');
      setShowModal(false);
      setFormData({ name: '', dept: '', contact_person: '', phone: '' });
    } catch (err) {
      alert('저장 에러: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter(
    c => c.name.includes(searchTerm) || c.dept.includes(searchTerm) || c.contact_person.includes(searchTerm)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">고객 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">거래처 및 과/부서 담당자 정보를 등록하고 시트에 기록합니다.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>신규 고객 등록</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="고객사명, 과/부서명, 담당자 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.map((c, idx) => (
            <div key={c.id || idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                  {(c.name || '고객').substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                    {c.dept && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.dept}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">담당: {c.contact_person} | 연락처: {c.phone}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{c.id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">신규 고객 등록</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">고객사명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: (주)한국상사"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">과/부서명</label>
                <input
                  type="text"
                  placeholder="예: 영업부"
                  value={formData.dept}
                  onChange={e => setFormData({ ...formData, dept: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">담당자명</label>
                <input
                  type="text"
                  placeholder="예: 홍길동 팀장"
                  value={formData.contact_person}
                  onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">연락처</label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
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
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? '시트 저장 중...' : '시트에 저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}