// src/pages/StaffManagementPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { Users, UserPlus, Shield, CheckCircle2, XCircle, Clock, Search, Pencil, Trash2, KeyRound } from 'lucide-react';

export default function StaffManagementPage() {
  const { staffs, saveStaffToSheet, deleteStaff, selectedTeamGroup } = useData();
  const { user } = useGoogleAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  const defaultForm = {
    dept: user?.dept || '영업1팀',
    team: '영업1팀',
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
      dept: s.dept || '영업1팀',
      team: s.team || s.dept || '영업1팀',
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

  // 💡 관리자 1클릭 승인/거절 처리
  const handleToggleStatus = async (staffItem, newStatus) => {
    if (!isAdmin) return alert('관리자만 가입 승인 권한이 있습니다.');
    try {
      const updated = { ...staffItem, status: newStatus };
      await saveStaffToSheet(updated);
      alert(`[${staffItem.userName}] 사원의 가입 상태가 [${newStatus}] 처리되었습니다.`);
    } catch (err) {
      alert('승인 처리 실패: ' + err.message);
    }
  };

  // 💡 사원 삭제 처리
  const handleDeleteStaffItem = async (s) => {
    if (!isAdmin) return alert('관리자만 사원 삭제 권한이 있습니다.');
    const sName = s.userName || s.name || '';
    const sCode = s.userCode || s.code || '';
    if (!window.confirm(`정말 사원 [${sName} (${sCode})] 정보를 DB에서 완전히 삭제하시겠습니까?`)) return;
    try {
      await deleteStaff(sCode || sName || s.email);
      alert(`[${sName}] 사원 정보가 DB에서 성공적으로 삭제되었습니다.`);
    } catch (err) {
      alert('삭제 에러: ' + err.message);
    }
  };

  // 💡 데이터 권한 필터링 (일반 사원은 자신의 팀/부서 자료만, 관리자는 전체 보기)
  const filteredStaffs = staffs.filter((s) => {
    const sName = s.userName || s.name || '';
    const sDept = s.dept || '';
    const sTeam = s.team || '';
    const sCode = s.userCode || s.code || '';

    const matchesSearch =
      sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sDept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sCode.includes(searchTerm);

    // 일반 사원은 본인 부서/팀 정보만 표시, 관리자는 전체 표시
    if (!isAdmin) {
      const myDept = user?.dept || '영업1팀';
      return matchesSearch && (sDept === myDept || sTeam === myDept);
    }

    const matchesGroup = !selectedTeamGroup || selectedTeamGroup === 'ALL' || sDept === selectedTeamGroup || sTeam === selectedTeamGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-5">
      {/* 상단 타이틀 및 신규 사원 등록 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-800">사용자(사원) 등록 및 가입 승인 관리</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            부서명, 팀, 성명, 사원고유번호, 회사코드를 관리하며 관리자 승인 후 원하는 소속 자료만 이용하도록 제어합니다.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewModal}
            className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 사원 등록</span>
          </button>
        )}
      </div>

      {/* 검색 및 상태 안내 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="성명, 부서명, 팀명, 사원번호 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>승인 완료: <strong>{staffs.filter(s => s.status === '승인완료').length}명</strong></span>
          </span>
          <span className="flex items-center space-x-1 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>승인 대기: <strong>{staffs.filter(s => s.status === '승인대기').length}명</strong></span>
          </span>
        </div>
      </div>

      {/* 사원 관리 테이블 목록 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3.5">부서명</th>
                <th className="p-3.5">팀명</th>
                <th className="p-3.5">성명</th>
                <th className="p-3.5">사원고유번호</th>
                <th className="p-3.5">회사코드</th>
                <th className="p-3.5">직급/권한</th>
                <th className="p-3.5 text-center">가입 승인 상태</th>
                {isAdmin && <th className="p-3.5 text-center">관리 조작</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    등록된 사원 정보가 없거나 일치하는 자료가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStaffs.map((s, idx) => {
                  const isApproved = (s.status || '승인완료') === '승인완료';
                  return (
                    <tr key={s.userCode || idx} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-sky-900">{s.dept || '영업1팀'}</td>
                      <td className="p-3.5 text-slate-600">{s.team || s.dept || '영업1팀'}</td>
                      <td className="p-3.5 font-extrabold text-slate-900">{s.userName || s.name}</td>
                      <td className="p-3.5 font-mono font-bold text-rose-600">{s.userCode || s.code}</td>
                      <td className="p-3.5 font-mono text-slate-500">{s.companyCode || '3'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.role === '관리자' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.role || '일반사원'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>승인 완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-[11px] font-bold animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>승인 대기</span>
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {!isApproved ? (
                              <button
                                onClick={() => handleToggleStatus(s, '승인완료')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm transition"
                              >
                                승인 허가
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(s, '승인대기')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm transition"
                              >
                                승인 보류
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="정보 수정"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaffItem(s)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="사원 정보 완전 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 신규/수정 사원 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveStaff} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              {editingStaff ? '사원 프로필 정보 수정' : '신규 사원 등록'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">부서명 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 기획예산부"
                    value={formData.dept}
                    onChange={e => setFormData({ ...formData, dept: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">팀명 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 영업1팀"
                    value={formData.team}
                    onChange={e => setFormData({ ...formData, team: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-semibold"
                  />
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '사원 정보 저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
