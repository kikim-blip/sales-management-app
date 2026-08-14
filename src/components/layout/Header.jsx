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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
        {/* ── 좌측: 브랜드 로고 및 타이틀 (아래 사이드바 좌측 끝선과 정확히 일치) ── */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink min-w-0">
          <img src="/images/kyungsung_logo.jpg" alt="경성문화사 로고" className="h-7 sm:h-9 object-contain flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-800 leading-tight whitespace-nowrap truncate">
                영업관리
              </h1>
              {isUsingSheetsDB === false ? (
                <span className="hidden xs:inline-flex items-center space-x-0.5 bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                  <Database className="w-2.5 h-2.5" />
                  <span>실시간</span>
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                  데모
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block whitespace-nowrap">업무 시스템</p>
          </div>
        </div>

        {/* ── 우측: 팀 셀렉터, 프로필 뱃지, 새로고침, 로그아웃 (아래 본문 우측 끝선과 정확히 일치) ── */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">

          {/* ── 팀/부서 필터 셀렉터 ── */}
          {isAdmin ? (
            /* 관리자: 전체 / 부서별 / 팀별 모두 선택 가능 */
            <div className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 transition">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 flex-shrink-0" />
              <select
                value={selectedTeamGroup}
                onChange={(e) => setSelectedTeamGroup(e.target.value)}
                className="bg-transparent font-extrabold text-sky-900 focus:outline-none text-[11px] sm:text-xs cursor-pointer max-w-[75px] xs:max-w-[100px] sm:max-w-[140px]"
              >
                <option value="ALL">🏢 전체</option>
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
            <div className="flex items-center space-x-1 bg-sky-50 border border-sky-200 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-extrabold text-sky-900 shadow-sm whitespace-nowrap">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600" />
              <span className="truncate max-w-[70px] sm:max-w-none">{user?.team || user?.dept || '팀장'}</span>
            </div>
          ) : (
            /* 일반 팀원: 본인 팀만 고정 표시 */
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 shadow-sm whitespace-nowrap">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
              <span className="truncate max-w-[70px] sm:max-w-none">{user?.team || user?.dept || '미지정'}</span>
            </div>
          )}

          {/* ── 사원 프로필 버튼 ── */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center space-x-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition flex-shrink-0"
            title="계정 정보"
          >
            <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600" />
            <span className="font-mono text-sky-900 font-bold hidden xs:inline">{user?.userCode || '44'}</span>
            <span className="truncate max-w-[45px] sm:max-w-none">{user?.userName || '김광일'}</span>
          </button>

          {isLoggedIn && (
            <button
              onClick={refreshData}
              disabled={loading}
              className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition flex-shrink-0"
              title="데이터 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          )}

          {isLoggedIn ? (
            <button
              onClick={logout}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0"
              title="로그아웃"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={login}
              className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold shadow-sm transition flex-shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
          )}
        </div>
      </div>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </header>
  );
}