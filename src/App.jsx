// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import { useGoogleAuth } from './context/GoogleAuthContext';
import { useData } from './context/DataContext';
import CalculatorWidget from './components/common/Calculator';

import DashboardPage from './pages/DashboardPage';
import CustomerPage from './pages/CustomerPage';
import JobOrderPage from './pages/JobOrderPage';
import SalesPage from './pages/SalesPage';
import PaymentPage from './pages/PaymentPage';
import StaffManagementPage from './pages/StaffManagementPage';
import BoardPage from './pages/BoardPage';
import LogPage from './pages/LogPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { isLoggedIn, user } = useGoogleAuth();
  const { showCalc, setShowCalc } = useData();

  // 💡 최초 접속 시 로그인되지 않은 사용자는 메인 화면을 숨기고 로그인 & 회원가입 신청 게이트만 표시!
  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
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
            <Route path="/job-orders" element={<JobOrderPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/payments" element={<PaymentPage />} />
            <Route path="/staffs" element={isAdmin ? <StaffManagementPage /> : <div className="text-center py-20 font-bold text-slate-400">관리자 전용 메뉴입니다.</div>} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/logs" element={isAdmin ? <LogPage /> : <div className="text-center py-20 font-bold text-slate-400">관리자 전용 메뉴입니다.</div>} />
          </Routes>
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <BottomNav />

      {/* 🧮 전역 최상단 플로팅 계산기 (어떤 모달창 위에서도 항상 최상단에 떠서 함께 작업 가능!) */}
      {showCalc && (
        <CalculatorWidget onClose={() => setShowCalc(false)} />
      )}
    </div>
  );
}