// src/pages/StaffManagementPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { Plus, Search, Shield, UserCheck, CheckCircle2, Clock, Pencil, Trash2, XCircle, Building2, PlusCircle, Check, Users } from 'lucide-react';

export default function StaffManagementPage() {
  const { 
    staffs, saveStaffToSheet, deleteStaff, 
    departments, addDepartment, updateDepartment, deleteDepartment,
    teams, addTeam, updateTeam, deleteTeam
  } = useData();
  const { user } = useGoogleAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  // 💡 유효한 사원 데이터만 추출 (유령/빈 데이터 제거)
  const validStaffs = staffs.filter(s => s.userName || s.userCode || s.email);

  // 💡 전체 통합 부서 목록
  const allDepartments = Array.from(new Set([
    ...(departments || []),
    ...validStaffs.map(s => s.dept).filter(Boolean)
  ]));

  // 💡 전체 통합 팀 목록
  const allTeams = Array.from(new Set([
    ...(teams || []),
    ...validStaffs.map(s => s.team).filter(Boolean)
  ]));

  const [deptOrTeamTab, setDeptOrTeamTab] = useState('dept'); // 'dept' | 'team'
  const [newDeptInput, setNewDeptInput] = useState('');
  const [newTeamInput, setNewTeamInput] = useState('');

  const [editingDeptName, setEditingDeptName] = useState(null);
  const [editDeptValue, setEditDeptValue] = useState('');

  const [editingTeamName, setEditingTeamName] = useState(null);
  const [editTeamValue, setEditTeamValue] = useState('');

  const defaultForm = {
    dept: user?.dept || (allDepartments[0] || '세종영업본부'),
    team: user?.team || (allTeams[0] || '영업1조'),
    userName: '',
    userCode: '',
    companyCode: '3',
    role: '일반사원',
    status: '승인완료',
    email: '',
  };

  const [formData, setFormData] = useState(defaultForm);

  const openNewModal = () => {
    setEditingStaff(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (s) => {
    setEditingStaff(s);
    setFormData({
      id: s.id || undefined,
      dept: s.dept || (allDepartments[0] || '세종영업본부'),
      team: s.team || (allTeams[0] || '영업1조'),
      userName: s.userName || s.name || '',
      userCode: s.userCode || s.code || '',
      companyCode: s.companyCode || '3',
      role: s.role || '일반사원',
      status: s.status || '승인완료',
      email: s.email || '',
    });
    setShowModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formData.userName.trim()) return alert('성명을 입력해 주세요.');
    if (!formData.userCode.trim()) return alert('사원고유번호를 입력해 주세요.');

    try {
      setSubmitting(true);
      await saveStaffToSheet(formData);
      alert(`사원 [${formData.userName} (${formData.userCode})] 정보가 성공적으로 저장되었습니다!`);
      setShowModal(false);
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (s) => {
    const currentStatus = s.status || '승인완료';
    const nextStatus = currentStatus === '승인완료' ? '승인대기' : '승인완료';

    if (!window.confirm(`[${s.userName || s.userCode}] 사원의 가입 상태를 [${nextStatus}] 상태로 변경하시겠습니까?`)) return;

    try {
      await saveStaffToSheet({
        ...s,
        status: nextStatus,
      });
      alert(`가입 상태가 [${nextStatus}] (으)로 수정되었습니다.`);
    } catch (err) {
      alert('상태 변경 실패: ' + err.message);
    }
  };

  const handleDeleteClick = async (targetStaff) => {
    const identifier = targetStaff.id || targetStaff.email || targetStaff.userName;
    if (!identifier) return;

    if (!window.confirm(`정말 사원 [${targetStaff.userName || targetStaff.userCode}] 님의 정보를 DB에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteStaff(identifier);
      alert(`사원 [${targetStaff.userName || targetStaff.userCode}] 정보가 성공적으로 삭제되었습니다.`);
    } catch (err) {
      alert('삭제 에러: ' + err.message);
    }
  };

  // 💡 신규 부서 등록
  const handleAddDeptSubmit = (e) => {
    e.preventDefault();
    const name = newDeptInput.trim();
    if (!name) return alert('추가할 부서명을 입력해 주세요.');
    if (allDepartments.includes(name)) return alert('이미 존재하는 부서명입니다.');

    addDepartment(name);
    setNewDeptInput('');
    alert(`신규 부서 [${name}] (이)가 성공적으로 추가 등록되었습니다!`);
  };

  // 💡 신규 팀 등록
  const handleAddTeamSubmit = (e) => {
    e.preventDefault();
    const name = newTeamInput.trim();
    if (!name) return alert('추가할 팀명을 입력해 주세요.');
    if (allTeams.includes(name)) return alert('이미 존재하는 팀명입니다.');

    addTeam(name);
    setNewTeamInput('');
    alert(`신규 팀 [${name}] (이)가 성공적으로 추가 등록되었습니다!`);
  };

  // 💡 부서 수정 저장
  const handleSaveDeptEdit = (oldName) => {
    const newName = editDeptValue.trim();
    if (!newName) return alert('부서명을 입력해 주세요.');
    if (newName === oldName) {
      setEditingDeptName(null);
      return;
    }

    updateDepartment(oldName, newName);
    setEditingDeptName(null);
    alert(`부서명이 [${oldName}] ➔ [${newName}] (으)로 수정 변경되었습니다!`);
  };

  // 💡 팀 수정 저장
  const handleSaveTeamEdit = (oldName) => {
    const newName = editTeamValue.trim();
    if (!newName) return alert('팀명을 입력해 주세요.');
    if (newName === oldName) {
      setEditingTeamName(null);
      return;
    }

    updateTeam(oldName, newName);
    setEditingTeamName(null);
    alert(`팀명이 [${oldName}] ➔ [${newName}] (으)로 수정 변경되었습니다!`);
  };

  // 💡 부서 삭제
  const handleDeleteDept = (deptName) => {
    if (!window.confirm(`[${deptName}] 부서를 삭제하시겠습니까?`)) return;
    deleteDepartment(deptName);
    alert(`[${deptName}] 부서가 성공적으로 삭제되었습니다.`);
  };

  // 💡 팀 삭제
  const handleDeleteTeam = (teamName) => {
    if (!window.confirm(`[${teamName}] 팀을 삭제하시겠습니까?`)) return;
    deleteTeam(teamName);
    alert(`[${teamName}] 팀이 성공적으로 삭제되었습니다.`);
  };

  const filteredStaffs = validStaffs.filter(s => {
    const term = searchTerm.toLowerCase();
    const name = (s.userName || s.name || '').toLowerCase();
    const code = (s.userCode || s.code || '').toLowerCase();
    const dept = (s.dept || '').toLowerCase();
    const team = (s.team || '').toLowerCase();

    return name.includes(term) || code.includes(term) || dept.includes(term) || team.includes(term);
  });

  const approvedCount = validStaffs.filter(s => (s.status || '승인완료') === '승인완료').length;
  const pendingCount = validStaffs.filter(s => s.status === '승인대기').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">사용자(사원) 등록 및 가입 승인 관리</h2>
          <p className="text-xs text-slate-500 mt-1">부서명, 팀, 성명, 사원고유번호, 회사코드를 관리하며 관리자 승인 후 원하는 소속 자료만 이용하도록 제어합니다.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDeptModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl font-semibold text-xs shadow-sm transition"
          >
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>부서/팀 등록 및 관리</span>
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>신규 사원 등록</span>
          </button>
        </div>
      </div>

      {/* 검색 및 필터 현황 바 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="성명, 부서명, 팀명, 사원번호 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs outline-none text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs font-bold">
          <span className="flex items-center space-x-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>승인 완료: {approvedCount}명</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>승인 대기: {pendingCount}명</span>
          </span>
        </div>
      </div>

      {/* 사원 목록 그리드 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold border-b border-slate-200">
              <tr>
                <th className="p-3.5">부서명</th>
                <th className="p-3.5">팀명</th>
                <th className="p-3.5">성명</th>
                <th className="p-3.5">사원고유번호</th>
                <th className="p-3.5">회사코드</th>
                <th className="p-3.5">직급/권한</th>
                <th className="p-3.5 text-center">가입 승인 상태</th>
                <th className="p-3.5 text-center">관리 조작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-bold">
                    등록되었거나 검색 조건에 부합하는 사원 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStaffs.map((s, idx) => {
                  const isApproved = (s.status || '승인완료') === '승인완료';
                  return (
                    <tr key={s.id || s.email || `${s.userName}_${idx}`} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-sky-900">{s.dept || '부서 미지정'}</td>
                      <td className="p-3.5 text-slate-600">{s.team || s.dept || '팀 미지정'}</td>
                      <td className="p-3.5 font-extrabold text-slate-900">{s.userName || s.name || '-'}</td>
                      <td className="p-3.5 font-mono font-bold text-rose-600">{s.userCode || s.code || '-'}</td>
                      <td className="p-3.5 font-mono text-slate-500">{s.companyCode || '3'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.role === '관리자' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.role || '일반사원'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>승인 완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>승인 대기</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                              isApproved 
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' 
                                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {isApproved ? '승인 보류' : '가입 승인'}
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded"
                            title="사원 정보 수정"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(s)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="사원 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. 신규/수정 사원 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStaff} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingStaff ? '사원 정보 및 권한 수정' : '신규 사용자(사원) 직접 등록'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">소속 부서 선택 *</label>
                  <select
                    required
                    value={formData.dept}
                    onChange={e => setFormData({ ...formData, dept: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-sky-500 bg-white cursor-pointer"
                  >
                    {allDepartments.length === 0 ? (
                      <option value="세종영업본부">🏢 세종영업본부</option>
                    ) : (
                      allDepartments.map(d => (
                        <option key={d} value={d}>
                          🏢 {d}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">팀명 선택 *</label>
                  <select
                    required
                    value={formData.team}
                    onChange={e => setFormData({ ...formData, team: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-sky-500 bg-white cursor-pointer"
                  >
                    {allTeams.length === 0 ? (
                      <option value="영업1조">👥 영업1조</option>
                    ) : (
                      allTeams.map(t => (
                        <option key={t} value={t}>
                          👥 {t}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">성명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 김광일"
                  value={formData.userName}
                  onChange={e => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl font-extrabold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">사원고유번호 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 44"
                    value={formData.userCode}
                    onChange={e => setFormData({ ...formData, userCode: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">회사코드</label>
                  <input
                    type="text"
                    placeholder="예: 3"
                    value={formData.companyCode}
                    onChange={e => setFormData({ ...formData, companyCode: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">구글 로그인 계정 (이메일)</label>
                <input
                  type="email"
                  placeholder="예: user@gmail.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">시스템 권한</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="일반사원">일반사원</option>
                    <option value="관리자">관리자</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">승인 상태</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="승인완료">승인완료</option>
                    <option value="승인대기">승인대기</option>
                  </select>
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : (editingStaff ? '수정 내용 저장' : '사원 등록하기')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. 🏢 공식 부서 & 팀 탭별 등록/수정/삭제 관리 모달 */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-base">공식 부서 및 팀 관리</h3>
              </div>
              <button type="button" onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* 탭: [🏢 부서 관리] vs [👥 팀 관리] */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setDeptOrTeamTab('dept')}
                className={`flex-1 py-2 font-bold text-xs border-b-2 transition ${
                  deptOrTeamTab === 'dept' ? 'border-sky-600 text-sky-600 bg-sky-50/50' : 'border-transparent text-slate-500'
                }`}
              >
                🏢 부서 관리 ({allDepartments.length})
              </button>
              <button
                type="button"
                onClick={() => setDeptOrTeamTab('team')}
                className={`flex-1 py-2 font-bold text-xs border-b-2 transition ${
                  deptOrTeamTab === 'team' ? 'border-sky-600 text-sky-600 bg-sky-50/50' : 'border-transparent text-slate-500'
                }`}
              >
                👥 팀 관리 ({allTeams.length})
              </button>
            </div>

            {/* 🏢 1. 부서 관리 탭 */}
            {deptOrTeamTab === 'dept' && (
              <div className="space-y-3">
                <form onSubmit={handleAddDeptSubmit} className="bg-sky-50 p-3 rounded-2xl border border-sky-100 space-y-2">
                  <label className="block text-xs font-bold text-sky-900">➕ 신규 부서 등록</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="추가할 부서명 입력 (예: 개발본부)"
                      value={newDeptInput}
                      onChange={e => setNewDeptInput(e.target.value)}
                      className="flex-1 p-2 border border-sky-200 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>부서 등록</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {allDepartments.map((deptName) => {
                    const isEditing = editingDeptName === deptName;
                    const count = validStaffs.filter(s => s.dept === deptName).length;
                    return (
                      <div key={deptName} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editDeptValue}
                              onChange={e => setEditDeptValue(e.target.value)}
                              className="flex-1 p-1.5 border border-sky-400 rounded-lg text-xs font-bold bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveDeptEdit(deptName)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDeptName(null)}
                              className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <span>🏢 {deptName}</span>
                              <span className="text-[10px] text-sky-600 font-normal">({count}명 소속)</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => { setEditingDeptName(deptName); setEditDeptValue(deptName); }}
                                className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDept(deptName)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 👥 2. 팀 관리 탭 */}
            {deptOrTeamTab === 'team' && (
              <div className="space-y-3">
                <form onSubmit={handleAddTeamSubmit} className="bg-purple-50 p-3 rounded-2xl border border-purple-100 space-y-2">
                  <label className="block text-xs font-bold text-purple-900">➕ 신규 팀/조 등록</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="추가할 팀명 입력 (예: 영업5조)"
                      value={newTeamInput}
                      onChange={e => setNewTeamInput(e.target.value)}
                      className="flex-1 p-2 border border-purple-200 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>팀 등록</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {allTeams.map((teamName) => {
                    const isEditing = editingTeamName === teamName;
                    const count = validStaffs.filter(s => s.team === teamName).length;
                    return (
                      <div key={teamName} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editTeamValue}
                              onChange={e => setEditTeamValue(e.target.value)}
                              className="flex-1 p-1.5 border border-purple-400 rounded-lg text-xs font-bold bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTeamEdit(teamName)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTeamName(null)}
                              className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <span>👥 {teamName}</span>
                              <span className="text-[10px] text-purple-600 font-normal">({count}명 소속)</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => { setEditingTeamName(teamName); setEditTeamValue(teamName); }}
                                className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTeam(teamName)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
