// src/pages/CustomerPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { Plus, Search, Pencil, Trash2, Download, Users, ChevronDown, ChevronRight, Phone, Mail, User, Building2, Upload } from 'lucide-react';
import { getLocalDateStr } from '../utils/dateUtils';
import * as XLSX from 'xlsx';

export default function CustomerPage() {
  const { customers, contacts = [], staffs = [], addCustomer, updateCustomer, deleteCustomer, addContact, updateContact, deleteContact, selectedTeamGroup } = useData();
  const { user } = useGoogleAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 담당자 모달 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactEditingId, setContactEditingId] = useState(null);
  const [contactParentId, setContactParentId] = useState(null); // 어느 고객사에 추가할지
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const defaultContactForm = { name: '', phone: '', mobile: '', email: '', note: '' };
  const [contactForm, setContactForm] = useState(defaultContactForm);

  // 펼침/접힘 상태
  const [expandedCustomers, setExpandedCustomers] = useState({});

  const loggedInUserName = user?.userName || user?.name || (user?.email ? user.email.split('@')[0] : '');

  const defaultForm = {
    name: '',
    dept: '',
  };

  const [formData, setFormData] = useState(defaultForm);

  const openNewModal = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (cust) => {
    setEditingId(cust.id);
    setFormData({
      name: cust.name || '',
      dept: cust.dept || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const custContacts = contacts.filter(c => c.customer_id === id);
    if (custContacts.length > 0) {
      if (!window.confirm(`이 고객사에 등록된 담당자 ${custContacts.length}명도 함께 삭제됩니다. 계속하시겠습니까?`)) return;
      for (const c of custContacts) {
        await deleteContact(c.id);
      }
    } else {
      if (!window.confirm('정말 이 고객 정보를 삭제하시겠습니까?')) return;
    }
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

  // ── 담당자 CRUD ──
  const openNewContactModal = (customerId) => {
    setContactParentId(customerId);
    setContactEditingId(null);
    setContactForm(defaultContactForm);
    setShowContactModal(true);
  };

  const openEditContactModal = (contact) => {
    setContactParentId(contact.customer_id);
    setContactEditingId(contact.id);
    setContactForm({
      name: contact.name || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      email: contact.email || '',
      note: contact.note || '',
    });
    setShowContactModal(true);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name) return alert('담당자명을 입력해 주세요.');
    try {
      setContactSubmitting(true);
      if (contactEditingId) {
        await updateContact(contactEditingId, { ...contactForm, customer_id: contactParentId });
        alert('담당자 정보가 수정되었습니다!');
      } else {
        await addContact({ ...contactForm, customer_id: contactParentId });
        alert('담당자가 등록되었습니다!');
      }
      setShowContactModal(false);
    } catch (err) {
      alert('저장 에러: ' + err.message);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('이 담당자를 삭제하시겠습니까?')) return;
    await deleteContact(id);
  };

  // 고객 리스트 CSV 다운로드
  const handleExportCSV = () => {
    if (filtered.length === 0) return alert('다운로드할 고객 데이터가 없습니다.');
    const today = getLocalDateStr();
    const rows = [];
    rows.push(['고객사명', '사업장(ID)', '과/부서명', '담당자명', '연락처', '이메일', '비고']);
    filtered.forEach(c => {
      const custContacts = contacts.filter(ct => ct.customer_id === c.id);
      if (custContacts.length === 0) {
        rows.push([c.name || '', c.id || '', c.dept || '', '', '', '', '']);
      } else {
        custContacts.forEach(ct => {
          rows.push([c.name || '', c.id || '', c.dept || '', ct.name || '', ct.phone || '', ct.email || '', ct.note || '']);
        });
      }
    });
    const csv = '\uFEFF' + rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `고객관리_담당자목록_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const headers = [['고객사명(필수)', '과/부서명', '담당자명(필수)', '일반번호', '휴대전화', '이메일', '비고']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "고객일괄등록양식");
    XLSX.writeFile(wb, "고객일괄등록양식.xlsx");
  };

  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setSubmitting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      if (rows.length <= 1) throw new Error("데이터가 없습니다.");
      
      const headers = rows[0];
      const nameIdx = headers.findIndex(h => h && h.includes('고객사명'));
      const deptIdx = headers.findIndex(h => h && h.includes('과/부서명'));
      const contactIdx = headers.findIndex(h => h && h.includes('담당자명'));
      const phoneIdx = headers.findIndex(h => h && h.includes('일반번호'));
      const mobileIdx = headers.findIndex(h => h && h.includes('휴대전화'));
      const emailIdx = headers.findIndex(h => h && h.includes('이메일'));
      const noteIdx = headers.findIndex(h => h && h.includes('비고'));

      if (nameIdx === -1 || contactIdx === -1) {
        throw new Error("필수 헤더('고객사명(필수)', '담당자명(필수)')를 찾을 수 없습니다. 양식을 확인하세요.");
      }

      let successCount = 0;
      let existingCustomersMap = new Map();
      
      // Load current customers into map to avoid duplicate creations
      customers.forEach(c => {
        const key = `${c.name || ''}_${c.dept || ''}`;
        existingCustomersMap.set(key, c.id);
      });

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[nameIdx] || !row[contactIdx]) continue; // Skip empty rows or rows missing required fields
        
        const cName = String(row[nameIdx] || '').trim();
        const cDept = deptIdx !== -1 ? String(row[deptIdx] || '').trim() : '';
        const ctName = String(row[contactIdx] || '').trim();
        const ctPhone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';
        const ctMobile = mobileIdx !== -1 ? String(row[mobileIdx] || '').trim() : '';
        const ctEmail = emailIdx !== -1 ? String(row[emailIdx] || '').trim() : '';
        const ctNote = noteIdx !== -1 ? String(row[noteIdx] || '').trim() : '';

        const custKey = `${cName}_${cDept}`;
        let customerId = existingCustomersMap.get(custKey);

        if (!customerId) {
          // Create new customer
          const newCust = await addCustomer({ name: cName, dept: cDept });
          customerId = newCust.id;
          existingCustomersMap.set(custKey, customerId);
        }

        // Add contact to this customer
        await addContact({
          customer_id: customerId,
          name: ctName,
          phone: ctPhone,
          mobile: ctMobile,
          email: ctEmail,
          note: ctNote
        });
        successCount++;
      }
      
      alert(`총 ${successCount}건의 담당자 정보를 성공적으로 등록했습니다.`);
      if (fileInputRef.current) fileInputRef.current.value = ''; // reset
    } catch (err) {
      alert(`엑셀 처리 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter(c => {
    const custContacts = contacts.filter(ct => ct.customer_id === c.id);
    const contactNames = custContacts.map(ct => ct.name || '').join(' ');
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.dept || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactNames.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTeam = (() => {
      if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;
      if (c.dept === selectedTeamGroup) return true;
      if (c.sales_manager === selectedTeamGroup) return true;
      const mgrStaff = staffs.find(s => s.userName === c.sales_manager);
      if (mgrStaff && (mgrStaff.team === selectedTeamGroup || mgrStaff.dept === selectedTeamGroup)) return true;
      return false;
    })();

    return matchesSearch && matchesTeam;
  });

  const totalContacts = contacts.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">고객 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            거래처 {filtered.length}개 / 담당자 {totalContacts}명 등록됨. 기관+부서별로 여러 담당자를 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>양식 다운로드</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            className="flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{submitting ? '처리 중...' : '엑셀 일괄 등록'}</span>
          </button>
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
            <span>신규 고객사 등록</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="고객사명, 과/부서명, 담당자명 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* ℹ️ 구조 설명 배너 */}
      <div className="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-2.5 rounded-xl text-xs font-medium">
        💡 <strong>새로운 구조</strong>: 고객사(기관+부서)에 담당자를 1:N으로 등록합니다. 매출 등록 시 담당자를 선택하면 해당 건에 독립적으로 저장됩니다.
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">등록된 고객이 없습니다.</div>
          )}
          {filtered.map((c, idx) => {
            const custContacts = contacts.filter(ct => ct.customer_id === c.id);
            const isExpanded = expandedCustomers[c.id] !== false; // 기본 펼침

            return (
              <div key={c.id || idx} className="border-b border-slate-100 last:border-0">
                {/* 고객사 행 */}
                <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                  onClick={() => setExpandedCustomers(prev => ({ ...prev, [c.id]: !isExpanded }))}>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(c.name || '고객').substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                        {c.dept && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.dept}</span>}
                        <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full border border-sky-100">
                          <Users className="w-3 h-3 inline mr-0.5" />
                          담당자 {custContacts.length}명
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{c.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openNewContactModal(c.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition"
                      title="담당자 추가"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>담당자 추가</span>
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      title="기관 정보 수정"
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

                {/* 담당자 목록 (펼침) */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100">
                    {custContacts.length === 0 ? (
                      <div className="px-16 py-3 text-xs text-slate-400 italic">
                        등록된 담당자가 없습니다. "담당자 추가" 버튼을 클릭하여 등록하세요.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {custContacts.map((ct) => (
                          <div key={ct.id} className="pl-16 pr-4 py-3 flex items-center justify-between hover:bg-white">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800 text-sm">{ct.name}</span>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {ct.phone && (
                                    <span className="text-xs text-slate-500 flex items-center gap-0.5" title="일반번호">
                                      <Phone className="w-3 h-3" />{ct.phone}
                                    </span>
                                  )}
                                  {ct.mobile && (
                                    <span className="text-xs text-slate-500 flex items-center gap-0.5" title="휴대전화">
                                      <Phone className="w-3 h-3 text-sky-500" />{ct.mobile}
                                    </span>
                                  )}
                                  {ct.email && (
                                    <span className="text-xs text-slate-500 flex items-center gap-0.5">
                                      <Mail className="w-3 h-3" />{ct.email}
                                    </span>
                                  )}
                                  {ct.note && (
                                    <span className="text-xs text-slate-400 italic">{ct.note}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => openEditContactModal(ct)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                title="담당자 수정"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(ct.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="담당자 삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 💡 신규 고객사 등록 / 수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? '고객사 정보 수정' : '신규 고객사 등록'}
            </h3>
            <p className="text-xs text-slate-500 bg-sky-50 p-2.5 rounded-xl border border-sky-100">
              💡 고객사(기관+부서) 정보만 저장합니다. 담당자는 고객사 등록 후 별도로 추가해 주세요.
            </p>
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
                {submitting ? '저장 중...' : (editingId ? '수정 저장' : '등록')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 💡 담당자 등록 / 수정 모달 */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleContactSubmit} className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              {contactEditingId ? '담당자 정보 수정' : '담당자 신규 등록'}
            </h3>
            
            <div className="space-y-3">
              {/* 소속 부서 선택 (이동 가능) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">소속 기관/부서</label>
                <select
                  value={contactParentId || ''}
                  onChange={e => setContactParentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>소속 기관/부서를 선택하세요</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.dept ? `/ ${c.dept}` : ''}
                    </option>
                  ))}
                </select>
                {contactEditingId && (
                  <p className="text-[11px] text-emerald-600 mt-1 ml-1 font-medium">
                    * 소속을 변경하여도 기존 매출 기록은 변하지 않습니다.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">담당자명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 권기남 주무관"
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">일반번호</label>
                  <input
                    type="text"
                    placeholder="예: 033-760-6094"
                    value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">휴대전화</label>
                  <input
                    type="text"
                    placeholder="예: 010-1234-5678"
                    value={contactForm.mobile || ''}
                    onChange={e => setContactForm({ ...contactForm, mobile: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">이메일</label>
                <input
                  type="email"
                  placeholder="example@domain.com"
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">비고</label>
                <input
                  type="text"
                  placeholder="예: 구매담당"
                  value={contactForm.note}
                  onChange={e => setContactForm({ ...contactForm, note: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={contactSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {contactSubmitting ? '저장 중...' : (contactEditingId ? '수정 저장' : '담당자 등록')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}