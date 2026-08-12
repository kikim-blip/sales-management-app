// src/components/layout/Header.jsx
import React from 'react';
import { Building2, LogIn, LogOut, RefreshCw, Database } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { useData } from '../../context/DataContext';

export default function Header() {
  const { isLoggedIn, login, logout } = useGoogleAuth();
  const { loading, refreshData, isUsingSheetsDB } = useData();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-100">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">영업미수관리 PWA</h1>
            {isUsingSheetsDB ? (
              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <Database className="w-3 h-3" />
                <span>구글시트 DB 연동됨</span>
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                더미 데이터 모드
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Google Sheets API 실시간 연동</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
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
    </header>
  );
}