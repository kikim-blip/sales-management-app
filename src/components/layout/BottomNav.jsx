// src/components/layout/BottomNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, FileSpreadsheet, CreditCard, Shield } from 'lucide-react';

import { useGoogleAuth } from '../../context/GoogleAuthContext';

const navItems = [
  { name: '현황', path: '/', icon: LayoutDashboard },
  { name: '작업전표', path: '/job-orders', icon: ClipboardList },
  { name: '매출관리', path: '/sales', icon: FileSpreadsheet },
  { name: '고객관리', path: '/customers', icon: Users },
  { name: '사용자', path: '/staffs', icon: Shield },
];


export default function BottomNav() {
  const { user } = useGoogleAuth();
  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  const visibleNavItems = navItems.filter(item => {
    if (item.path === '/staffs') {
      return isAdmin;
    }
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-1 py-1 flex justify-around shadow-lg">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                isActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}