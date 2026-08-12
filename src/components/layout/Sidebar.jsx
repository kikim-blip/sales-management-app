// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileSpreadsheet, CreditCard } from 'lucide-react';

const navItems = [
  { name: '대시보드', path: '/', icon: LayoutDashboard },
  { name: '고객 관리', path: '/customers', icon: Users },
  { name: '매출/견적 관리', path: '/sales', icon: FileSpreadsheet },
  { name: '수금 관리', path: '/payments', icon: CreditCard },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-65px)] p-4">
      <div className="text-xs font-semibold text-slate-400 mb-4 px-3 tracking-wider uppercase">메인 메뉴</div>
      <nav className="space-y-1">
        {navItems.map((item) => {
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
    </aside>
  );
}