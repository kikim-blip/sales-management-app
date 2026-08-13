// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, FileSpreadsheet, Shield } from 'lucide-react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';

const navItems = [
  { name: '통합 대시보드', path: '/', icon: LayoutDashboard },
  { name: '작업전표 관리', path: '/job-orders', icon: ClipboardList },
  { name: '매출 및 수금 관리', path: '/sales', icon: FileSpreadsheet },
  { name: '거래처(고객) 관리', path: '/customers', icon: Users },
  { name: '사용자(사원) 승인 관리', path: '/staffs', icon: Shield },
];

export default function Sidebar() {
  const { user } = useGoogleAuth();

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  const visibleNavItems = navItems.filter(item => {
    if (item.path === '/staffs') return isAdmin;
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-65px)] p-4">
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
    </aside>
  );
}