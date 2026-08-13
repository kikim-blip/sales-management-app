// src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, RefreshCw, Database, UserCheck, Users } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { useData } from '../../context/DataContext';
import UserProfileModal from '../common/UserProfileModal';

export default function Header() {
  const { isLoggedIn, user, login, logout } = useGoogleAuth();
  const { loading, refreshData, isUsingSheetsDB, selectedTeamGroup, setSelectedTeamGroup, departments, teams, staffs } = useData();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';
  // 팀장: 본인 팀 전체 조회 가능, 팀원: 본인 팀만
  const isTeamManager = user?.role === '팀장' || user?.position === '팀장';

  // 💡 일반 팀원은 본인 팀으로 고정
  useEffect(() => {
    if (!isAdmin) {
      const myGroup = user?.team || user?.dept;
      if (myGroup) setSelectedTeamGroup(myGroup);
    }
  }, [isAdmin, user?.team, user?.dept, setSelectedTeamGroup]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <img src="/images/kyungsung_logo.jpg" alt="경성문화사 로고" className="h-9 object-contain" />
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">영업미수관리 PWA</h1>
            {isUsingSheetsDB === false ? (
              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <Database className="w-3 h-3" />
                <span>D1 DB 연동</span>
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

        {/* ── 팀/부서 필터 셀렉터 ── */}
        {isAdmin ? (
          /* 관리자: 전체 / 부서별 / 팀별 모두 선택 가능 */
          <div className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 transition">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden md:inline font-bold text-slate-600">팀 선택:</span>
            <select
              value={selectedTeamGroup}
              onChange={(e) => setSelectedTeamGroup(e.target.value)}
              className="bg-transparent font-extrabold text-sky-900 focus:outline-none text-xs cursor-pointer max-w-[140px]"
            >
              <option value="ALL">🏢 전체 보기</option>
              {departments?.length > 0 && (
                <optgroup label="── 부서별 ──">
                  {departments.map(dept => (
                    <option key={`dept-${dept}`} value={dept}>🏢 {dept}</option>
                  ))}
                </optgroup>
              )}
              {teams?.length > 0 && (
                <optgroup label="── 팀별 ──">
                  {teams.map(team => (
                    <option key={`team-${team}`} value={team}>👥 {team}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        ) : isTeamManager ? (
          /* 팀장: 본인 팀 표시 (고정, 변경 불가) */
          <div className="flex items-center space-x-1.5 bg-sky-50 border border-sky-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-sky-900 shadow-sm">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>팀장 · {user?.team || user?.dept || '미지정'}</span>
          </div>
        ) : (
          /* 일반 팀원: 본인 팀만 고정 표시 */
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>소속 팀: {user?.team || user?.dept || '미지정'}</span>
          </div>
        )}

        {/* ── 사원 프로필 버튼 (우측 상단 한 군데만) ── */}
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