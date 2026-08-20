// src/App.jsx
import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import { useGoogleAuth } from './context/GoogleAuthContext';
import { useData } from './context/DataContext';
import CalculatorWidget from './components/common/Calculator';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import DashboardPage from './pages/DashboardPage';
import CustomerPage from './pages/CustomerPage';
import JobOrderPage from './pages/JobOrderPage';
import SalesPage from './pages/SalesPage';
import PaymentPage from './pages/PaymentPage';
import StaffManagementPage from './pages/StaffManagementPage';
import BoardPage from './pages/BoardPage';
import LogPage from './pages/LogPage';
import LoginPage from './pages/LoginPage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('d1_cache_sales');
    localStorage.removeItem('d1_cache_customers');
    localStorage.removeItem('d1_cache_jobOrders');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-800">화면 로딩 중 일시적 오류</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              화면 표시 중 예기치 못한 문제가 발생했습니다.<br />
              캐시를 정리하고 새로고침하여 정상 화면으로 복구합니다.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>캐시 초기화 및 새로고침</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { isLoggedIn, user } = useGoogleAuth();
  const { showCalc, setShowCalc } = useData();

  // 💡 최초 접속 시 로그인되지 않은 사용자는 메인 화면을 숨기고 로그인 & 회원가입 신청 게이트만 표시!
  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}