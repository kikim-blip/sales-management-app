import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  User,
  Clock,
  CheckCircle2,
  Edit,
  PlusCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Truck,
  Zap,
  CreditCard,
} from 'lucide-react';

export default function LogPage() {
  const { logs = [], clearLogs, refreshData, loading } = useData();
  const { user } = useGoogleAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL'); // ALL, TODAY, 7DAYS, 30DAYS

  // 관리자 여부 확인 (관리자만 로그 초기화 지원)
  const isAdmin = user?.role === '관리자' || user?.email === 'richkikim@gmail.com';

  // 💡 필터링된 로그 목록
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. 카테고리 필터
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      // 2. 액션(작업유형) 필터
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }
      // 3. 검색어 필터 (사용자명, 이메일, 상세내용, 대상ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const uName = (log.user_name || '').toLowerCase();
        const uEmail = (log.user_email || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const targetId = (log.target_id || '').toLowerCase();
        if (!uName.includes(q) && !uEmail.includes(q) && !details.includes(q) && !targetId.includes(q)) {
          return false;
        }
      }
      // 4. 기간 필터
      if (dateRange !== 'ALL') {
        const logDate = new Date(log.created_at || Date.now());
        const now = new Date();
        if (dateRange === 'TODAY') {
          if (logDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === '7DAYS') {
          const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        } else if (dateRange === '30DAYS') {
          const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        }
      }
      return true;
    });
  }, [logs, searchQuery, selectedCategory, selectedAction, dateRange]);

  // 💡 통계 데이터 산출
  const stats = useMemo(() => {
    const total = logs.length;
    const todayStr = new Date().toDateString();
    const todayCount = logs.filter(l => new Date(l.created_at || Date.now()).toDateString() === todayStr).length;
    const deliveryCount = logs.filter(l => l.action === '납품완료' || l.action === '상태변경').length;
    const paymentCount = logs.filter(l => l.category === '수금').length;
    const createCount = logs.filter(l => l.action === '등록').length;
    const updateCount = logs.filter(l => l.action === '수정').length;
    const deleteCount = logs.filter(l => l.action === '삭제').length;
    return { total, todayCount, deliveryCount, paymentCount, createCount, updateCount, deleteCount };
  }, [logs]);

  // 💡 CSV 엑셀 다운로드
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return alert('다운로드할 로그 기록이 없습니다.');

    const headers = ['NO', '일시', '수행 사용자', '이메일', '작업 구분', '카테고리', '상세 작업 내용', '대상 ID'];
    const rows = filteredLogs.map((l, index) => [
      filteredLogs.length - index,
      l.created_at || '',
      l.user_name || '',
      l.user_email || '',
      l.action || '',
      l.category || '',
      l.details || '',
      l.target_id || '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `시스템_작업조작로그_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 💡 로그 전체 비우기 (관리자)
  const handleClear = async () => {
    if (!isAdmin) return alert('로그 삭제 권한이 없습니다.');
    if (window.confirm('정말로 모든 작업 조작 로그를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      await clearLogs();
      alert('로그 기록이 성공적으로 비워졌습니다.');
    }
  };

  // 작업 유형별 아이콘 및 뱃지 스타일 헬퍼
  const getActionBadge = (action) => {
    switch (action) {
      case '납품완료':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <Truck className="w-3 h-3 text-emerald-700" />
            <span>납품완료</span>
          </span>
        );
      case '상태변경':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-sm">
            <Zap className="w-3 h-3 text-purple-700" />
            <span>상태변경</span>
          </span>
        );
      case '등록':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <PlusCircle className="w-3 h-3 text-teal-600" />
            <span>등록</span>
          </span>
        );
      case '수정':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Edit className="w-3 h-3 text-sky-600" />
            <span>수정</span>
          </span>
        );
      case '삭제':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3 text-rose-600" />
            <span>삭제</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>{action || '일반'}</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* ── 📌 상단 제목 및 액션 버튼 ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">시스템 작업 &amp; 조작 로그</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              사용자들이 언제 무엇을 등록, 납품완료, 수금, 수정, 삭제하였는지 실시간으로 모니터링합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refreshData(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            title="최신 로그로 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀(CSV) 저장</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleClear}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
              title="로그 전체 초기화 (관리자)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>로그 초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 📊 통계 카드 4종 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">전체 기록 수</p>
            <p className="text-xl font-black text-slate-800 font-mono mt-1">{stats.total.toLocaleString()}건</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">오늘의 작업</p>
            <p className="text-xl font-black text-sky-600 font-mono mt-1">{stats.todayCount.toLocaleString()}건</p>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">납품완료 / 상태변경</p>
            <p className="text-xl font-black text-emerald-600 font-mono mt-1">{stats.deliveryCount.toLocaleString()}건</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">수금 처리 기록</p>
            <p className="text-xl font-black text-indigo-600 font-mono mt-1">{stats.paymentCount.toLocaleString()}건</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── 🔍 검색 및 다중 필터 영역 ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. 검색어 입력 */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="작성자, 이메일, 내용, ID 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-sky-500 focus:outline-none transition"
            />
          </div>

          {/* 2. 카테고리 (메뉴) 선택 */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 w-full focus:outline-none cursor-pointer"
            >
              <option value="ALL">전체 메뉴 (카테고리)</option>
              <option value="매출/견적">매출 / 견적관리</option>
              <option value="수금">수금 관리</option>
              <option value="작업전표">작업전표</option>
              <option value="고객">고객(거래처) 관리</option>
              <option value="사원관리">사원/사용자 관리</option>
              <option value="게시판">업무 게시판</option>
            </select>
          </div>

          {/* 3. 작업 유형 (행위) 선택 */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 w-full focus:outline-none cursor-pointer"
            >
              <option value="ALL">전체 작업 구분</option>
              <option value="납품완료">🚚 납품완료 처리만</option>
              <option value="상태변경">⚡ 상태변경만</option>
              <option value="등록">🟢 신규 등록만</option>
              <option value="수정">🔵 내용 수정만</option>
              <option value="삭제">🔴 항목 삭제만</option>
            </select>
          </div>

          {/* 4. 기간 선택 */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDateRange('ALL')}
              className={`flex-1 py-1 rounded-lg transition ${dateRange === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              전체
            </button>
            <button
              onClick={() => setDateRange('TODAY')}
              className={`flex-1 py-1 rounded-lg transition ${dateRange === 'TODAY' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              오늘
            </button>
            <button
              onClick={() => setDateRange('7DAYS')}
              className={`flex-1 py-1 rounded-lg transition ${dateRange === '7DAYS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              최근7일
            </button>
            <button
              onClick={() => setDateRange('30DAYS')}
              className={`flex-1 py-1 rounded-lg transition ${dateRange === '30DAYS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              30일
            </button>
          </div>

        </div>
      </div>

      {/* ── 📋 로그 리스트 테이블 ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700">
            총 <span className="text-sky-600 font-black">{filteredLogs.length}</span>건의 조작 기록이 조회되었습니다.
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-semibold">조회 조건에 해당하는 작업 기록이 존재하지 않습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">NO</th>
                  <th className="py-3 px-4 w-44">일시</th>
                  <th className="py-3 px-4 w-40">수행 사용자</th>
                  <th className="py-3 px-4 w-28 text-center">구분</th>
                  <th className="py-3 px-4 w-28 text-center">메뉴</th>
                  <th className="py-3 px-4">상세 조작 내용</th>
                  <th className="py-3 px-4 w-32 font-mono">대상 ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredLogs.map((log, index) => {
                  const isDelivery = log.action === '납품완료';
                  const isStatus = log.action === '상태변경';
                  const isPayment = log.category === '수금';

                  return (
                    <tr
                      key={log.id || index}
                      className={`transition ${
                        isDelivery
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/70 font-semibold'
                          : isPayment
                          ? 'bg-indigo-50/30 hover:bg-indigo-50/60'
                          : isStatus
                          ? 'bg-purple-50/30 hover:bg-purple-50/60'
                          : 'hover:bg-sky-50/40'
                      }`}
                    >
                      {/* NO */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {filteredLogs.length - index}
                      </td>

                      {/* 일시 */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {log.created_at}
                      </td>

                      {/* 수행 사용자 */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[10px] flex-shrink-0 ${
                            isDelivery ? 'bg-emerald-200 text-emerald-800' : isPayment ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {(log.user_name || '시').slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{log.user_name || '시스템'}</p>
                            {log.user_email && (
                              <p className="text-[10px] text-slate-400 truncate">{log.user_email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 구분 (뱃지) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* 메뉴 (카테고리) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 border rounded-md text-[11px] font-bold ${
                          isPayment
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : isDelivery
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {log.category || '일반'}
                        </span>
                      </td>

                      {/* 상세 조작 내용 */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.details}
                      </td>

                      {/* 대상 ID */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {log.target_id || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
