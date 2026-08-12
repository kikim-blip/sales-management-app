// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';

import DashboardPage from './pages/DashboardPage';
import CustomerPage from './pages/CustomerPage';
import SalesPage from './pages/SalesPage';
import PaymentPage from './pages/PaymentPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 상단 헤더 */}
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* PC 좌측 사이드바 */}
        <Sidebar />

        {/* 본문 콘텐츠 영역 */}
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/payments" element={<PaymentPage />} />
          </Routes>
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <BottomNav />
    </div>
  );
}