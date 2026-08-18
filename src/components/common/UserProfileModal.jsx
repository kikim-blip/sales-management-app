// src/components/common/UserProfileModal.jsx
import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, Database } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { useData } from '../../context/DataContext';

export default function UserProfileModal({ onClose }) {
  const { user, updateUserProfile } = useGoogleAuth();
  const { saveStaffToSheet, isUsingSheetsDB, departments, teams, staffs } = useData();

  const allDepartments = Array.from(new Set([
    ...(departments || []),
    ...(staffs || []).map(s => s.dept).filter(Boolean)
  ]));

  const allTeams = Array.from(new Set([
    ...(teams || []),
    ...(staffs || []).map(s => s.team).filter(Boolean)
  ]));

  const [formData, setFormData] = useState({
    userCode: user?.userCode || '',
    userName: user?.userName || user?.name || '',
    companyCode: user?.companyCode || '3',
    email: user?.email || '',
    dept: user?.dept || (allDepartments[0] || '세종영업본부'),
    team: user?.team || (allTeams[0] || '영업1조'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateUserProfile(formData);
    await saveStaffToSheet(formData).catch(console.error);

    alert(`사원 프로필 정보가 저장되었습니다!\n사원번호: ${formData.userCode} | 담당자: ${formData.userName} | 부서: ${formData.dept} | 팀: ${formData.team}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">팀원/사원 프로필 설정</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          작업전표 고유 코드번호 <strong className="text-sky-600 font-mono">(고유번호)-(YYMMDD)-(회사코드+순번)</strong> 생성 및 견적서 담당자명에 자동 반영됩니다.
        </p>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">사원 고유번호 (예: 84) *</label>
            <input
              type="text"
              required
              placeholder="예: 84"
              value={formData.userCode}
              onChange={e => setFormData({ ...formData, userCode: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold text-sky-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">담당자 성명 *</label>
            <input
              type="text"
              required
              placeholder="예: 홍길동 팀장"
              value={formData.userName}
              onChange={e => setFormData({ ...formData, userName: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">소속 부서 선택 *</label>
              <select
                required
                value={formData.dept}
                onChange={e => setFormData({ ...formData, dept: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-sky-500 bg-white cursor-pointer"
              >
                {allDepartments.length === 0 ? (
                  <option value="세종영업본부">🏢 세종영업본부</option>
                ) : (
                  allDepartments.map(deptName => (
                    <option key={deptName} value={deptName}>
                      🏢 {deptName}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">팀명 선택 *</label>
              <select
                required
                value={formData.team}
                onChange={e => setFormData({ ...formData, team: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-sky-500 bg-white cursor-pointer"
              >
                {allTeams.length === 0 ? (
                  <option value="영업1조">👥 영업1조</option>
                ) : (
                  allTeams.map(tName => (
                    <option key={tName} value={tName}>
                      👥 {tName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">회사 코드 (예: 3) *</label>
            <input
              type="text"
              required
              placeholder="예: 3"
              value={formData.companyCode}
              onChange={e => setFormData({ ...formData, companyCode: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold text-purple-700"
            />
          </div>

          <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 flex items-center space-x-2 text-xs text-sky-800">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>생성되는 코드번호 예시: <strong className="font-mono text-rose-600">{formData.userCode}-260812-{formData.companyCode}277</strong></span>
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
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
          >
            프로필 저장
          </button>
        </div>
      </form>
    </div>
  );
}
