// src/components/layout/Header.jsx
import React, { useState } from 'react';
import { Building2, LogIn, LogOut, RefreshCw, Database, UserCheck, Users } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { useData } from '../../context/DataContext';
import UserProfileModal from '../common/UserProfileModal';

export default function Header() {
  const { isLoggedIn, user, login, logout } = useGoogleAuth();
  const { loading, refreshData, isUsingSheetsDB, selectedTeamGroup, setSelectedTeamGroup, staffs, customers } = useData();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 동적 과/부서 목록 추출
  const deptList = Array.from(new Set([
    '기획예산부',
    '영업1팀',
    '영업2팀',
    '생산관리부',
    ...staffs.map(s => s.dept).filter(Boolean),
    ...customers.map(c => c.dept).filter(Boolean),
  ]));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <img src="/images/kyungsung_logo.svg" alt="경성문화사 로고" className="h-9 object-contain" />
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">영업미수관리 PWA</h1>
            {isUsingSheetsDB ? (
              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <Database className="w-3 h-3" />
                <span>고성능 DB 연동됨</span>
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                더미 데이터 모드
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">팀별/그룹별 운영 및 실시간 연동</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* 💡 1. 팀별/부서별 데이터 그룹 셀렉터 (팀별 데이터 구분 운용) */}
        <div className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 transition">
          <Users className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden md:inline font-bold text-slate-600">그룹/팀:</span>
          <select
            value={selectedTeamGroup}
            onChange={(e) => setSelectedTeamGroup(e.target.value)}
            className="bg-transparent font-extrabold text-sky-900 focus:outline-none text-xs cursor-pointer"
          >
            <option value="ALL">🏢 전체 팀/부서 보기</option>
            {deptList.map(dept => (
              <option key={dept} value={dept}>
                🏢 {dept}
              </option>
            ))}
          </select>
        </div>

        {/* 💡 2. 사원 프로필 설정 버튼 (소속 과/부서 표시) */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
          title="사원 프로필 및 소속 과/부서 변경"
        >
          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
          <span className="font-mono text-sky-900 font-bold">{user?.userCode || '44'}</span>
          <span>- {user?.userName || '김광일'}</span>
          {user?.dept && <span className="hidden lg:inline bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded text-[10px] font-bold">{user.dept}</span>}
        </button>

        {isLoggedIn && (
          <button
            onClick={refreshData}
            disabled={loading}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="데이터 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        )}

        {isLoggedIn ? (
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        ) : (
          <button
            onClick={login}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Google 로그인</span>
          </button>
        )}
      </div>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </header>
  );
}