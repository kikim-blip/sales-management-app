// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, FileSpreadsheet, CreditCard, UserCheck, Shield } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import UserProfileModal from '../common/UserProfileModal';

const navItems = [
  { name: '통합 대시보드', path: '/', icon: LayoutDashboard },
  { name: '작업전표 관리', path: '/job-orders', icon: ClipboardList },
  { name: '매출 및 수금 관리', path: '/sales', icon: FileSpreadsheet },
  { name: '거래처(고객) 관리', path: '/customers', icon: Users },
  { name: '사용자(사원) 승인 관리', path: '/staffs', icon: Shield },
];

export default function Sidebar() {
  const { user } = useGoogleAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  const visibleNavItems = navItems.filter(item => {
    if (item.path === '/staffs') {
      return isAdmin;
    }
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-65px)] p-4">
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-4 px-3 tracking-wider uppercase">메인 메뉴</div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-600 font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* 담당 직원 정보 설정 메뉴 바 */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 text-left transition group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400">담당 사원 정보</p>
              <p className="text-xs font-bold text-slate-800 group-hover:text-sky-600">
                {user?.userCode || '44'} - {user?.userName || '김광일'}
              </p>
            </div>
          </div>
        </button>
      </div>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </aside>
  );
}