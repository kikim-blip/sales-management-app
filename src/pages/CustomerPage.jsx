// src/pages/CustomerPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { Plus, Search, Pencil, Trash2, Download } from 'lucide-react';

export default function CustomerPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, selectedTeamGroup } = useData();
  const { user } = useGoogleAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loggedInUserName = user?.userName || '김광일';

  const defaultForm = {
    name: '',
    dept: '',
    contact_person: '',
    phone: '',
    email: '',
    sales_manager: loggedInUserName,
  };

  const [formData, setFormData] = useState(defaultForm);

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      ...defaultForm,
      sales_manager: loggedInUserName,
    });
    setShowModal(true);
  };

  const openEditModal = (cust) => {
    setEditingId(cust.id);
    setFormData({
      name: cust.name || '',
      dept: cust.dept || '',
      contact_person: cust.contact_person || '',
      phone: cust.phone || '',
      email: cust.email || '',
      sales_manager: cust.sales_manager || loggedInUserName,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 고객 정보를 시트에서 삭제하시겠습니까?')) return;
    try {
      await deleteCustomer(id);
      alert('고객 정보가 삭제되었습니다.');
    } catch (err) {
      alert('삭제 에러: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert('고객사명을 입력해 주세요.');

    try {
      setSubmitting(true);
      if (editingId) {
        await updateCustomer(editingId, formData);
        alert('고객 정보가 수정되었습니다!');
      } else {
        await addCustomer(formData);
        alert('신규 고객이 등록되었습니다!');
      }
      setShowModal(false);
    } catch (err) {
      alert('저장 에러: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 고객 리스트 CSV 다운로드
  const handleExportCSV = () => {
    if (filtered.length === 0) return alert('다운로드할 고객 데이터가 없습니다.');
    const headers = ['고객사명', '사업장(ID)', '과/부서명', '담당자', '연락처', '이메일', '영업담당'];
    const rows = filtered.map(c => [
      c.name || '',
      c.id || '',
      c.dept || '',
      c.contact_person || '',
      c.phone || '',
      c.email || '',
      c.sales_manager || '',
    ]);
    const today = new Date().toISOString().split('T')[0];
    const csv = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `고객관리_전체목록_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = customers.filter(c => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.dept || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.sales_manager || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTeam =
      !selectedTeamGroup ||
      selectedTeamGroup === 'ALL' ||
      c.dept === selectedTeamGroup;

    return matchesSearch && matchesTeam;
  });



  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">고객 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">거래처 및 과/부서 담당자, 이메일, 영업담당자 정보를 등록 및 수정 관리합니다.</p>
        </div>
        <div className="flex items-center space-x-2">
          {filtered.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>CSV 다운로드</span>
            </button>
          )}
          <button
            onClick={openNewModal}
            className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>신규 고객 등록</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="고객사명, 과/부서명, 담당자, 영업담당자 검색..."
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
                    {c.sales_manager && (
                      <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-100">
                        영업담당: {c.sales_manager}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    담당자: <strong>{c.contact_person || '미지정'}</strong> ({c.phone || '-'}) | 이메일: <strong>{c.email || '-'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{c.id}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                    title="수정"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 💡 신규 고객 등록 / 수정 모달 (이메일 & 영업담당자 필드 추가완료) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? '고객 정보 수정' : '신규 고객 등록'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">고객사명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 기후에너지환경부"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">과/부서명</label>
                <input
                  type="text"
                  placeholder="예: 물관리위원회지원단"
                  value={formData.dept}
                  onChange={e => setFormData({ ...formData, dept: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">담당자명 (고객측)</label>
                  <input
                    type="text"
                    placeholder="예: 강성희"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">연락처</label>
                  <input
                    type="text"
                    placeholder="예: 010-1234-5678"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* 💡 구글 시트 Col F: 이메일 추가 */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">이메일 주소</label>
                <input
                  type="email"
                  placeholder="example@domain.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* 💡 구글 시트 Col G: 영업담당자 추가 */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">영업담당자 (당사 담당직원)</label>
                <input
                  type="text"
                  placeholder="예: 김광일"
                  value={formData.sales_manager}
                  onChange={e => setFormData({ ...formData, sales_manager: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
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
                {submitting ? '저장 중...' : (editingId ? '수정 저장' : '시트에 저장')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}