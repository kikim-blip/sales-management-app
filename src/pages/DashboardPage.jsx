// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { AlertCircle, FileText, RefreshCw, ChevronRight, Clock, AlertTriangle, Calendar, Printer, CheckCircle2, Users, Share2, Zap, Pencil, Truck, XCircle } from 'lucide-react';
import CustomerDetailModal from '../components/common/CustomerDetailModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';
import JobOrderModal from '../components/common/JobOrderModal';

export default function DashboardPage() {
  const { customers, sales, payments, jobOrders, loading, error, selectedTeamGroup, updateJobOrder, updateSales } = useData();
  const { user } = useGoogleAuth();
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showJobEditModal, setShowJobEditModal] = useState(false);

  const [editingSale, setEditingSale] = useState(null);
  const [showSaleScheduleModal, setShowSaleScheduleModal] = useState(false);


  const todayStr = new Date().toISOString().split('T')[0];

  // 💡 팀/부서 필터링 매칭 헬퍼
  const isTeamMatch = (itemDept, custId) => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;
    if (itemDept && itemDept === selectedTeamGroup) return true;
    if (custId) {
      const foundCust = customers.find(c => c.id === custId);
      if (foundCust && foundCust.dept === selectedTeamGroup) return true;
    }
    return false;
  };

  // 팀별 데이터 스코프
  const filteredSales = sales.filter(s => isTeamMatch(s.dept, s.customer_id));
  const filteredPayments = payments.filter(p => isTeamMatch(p.dept, p.customer_id));
  const filteredJobOrders = jobOrders.filter(o => isTeamMatch(o.dept, o.customer_id));
  const filteredCustomers = customers.filter(c => !selectedTeamGroup || selectedTeamGroup === 'ALL' || c.dept === selectedTeamGroup);

  const totalSalesAmount = filteredSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const totalPaymentAmount = filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  // 미수금 = 매출액 - 수금액 (음수가 되는 경우는 0으로 표시, 별도 안내)
  const totalUnpaidAmount = totalSalesAmount - totalPaymentAmount;
  const displayUnpaid = Math.max(0, totalUnpaidAmount);
  const isOverpaid = totalUnpaidAmount < 0;

  const customerSummary = filteredCustomers
    .map((cust) => {
      const custSales = filteredSales
        .filter((s) => s.customer_id === cust.id || (s.customer_name && s.customer_name === cust.name))
        .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
      const custPayments = filteredPayments
        .filter((p) => p.customer_id === cust.id)
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      return {
        ...cust,
        totalSales: custSales,
        totalPayment: custPayments,
        unpaid: custSales - custPayments,
      };
    })
    .filter((cust) => cust.totalSales > 0 || cust.totalPayment > 0);


  // D-Day 계산 헬퍼
  const getDDayInfo = (deliveryDateStr) => {
    if (!deliveryDateStr) return { diffDays: 999, label: '일정미정', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    const target = new Date(deliveryDateStr);
    const now = new Date(todayStr);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { diffDays, label: `⚠️ 납품 지연 (D+${Math.abs(diffDays)})`, color: 'bg-rose-600 text-white border-rose-700 animate-pulse' };
    }
    if (diffDays === 0) {
      return { diffDays, label: '🚨 오늘 납품 (D-DAY)', color: 'bg-rose-500 text-white border-rose-600 font-black animate-bounce' };
    }
    if (diffDays === 1) {
      return { diffDays, label: '⚡ 내일 납품 (D-1)', color: 'bg-amber-500 text-white border-amber-600 font-bold' };
    }
    if (diffDays <= 3) {
      return { diffDays, label: `🔥 긴급 임박 (D-${diffDays})`, color: 'bg-sky-500 text-white border-sky-600 font-bold' };
    }
    return { diffDays, label: `📅 D-${diffDays}`, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // 🚨 납품 일정 급건 순 정렬 리스트 생성 (작업전표 + 직접 등록된 매출 납품일정 통합)
  const jobItems = filteredJobOrders
    .filter(o => o.delivery_date)
    .map(order => {
      const dday = getDDayInfo(order.delivery_date);
      const cust = customers.find(c => c.id === order.customer_id);
      return {
        ...order,
        itemType: 'jobOrder', // 작업전표
        displayCode: order.code_number || order.id,
        displayTitle: order.title || '제목 없음',
        dday,
        customerNameDisplay: cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : ''}` : (order.customer_name || order.customer_id || '미지정'),
        detailsText: `사양: ${order.spec || '-'} | 수량: ${order.quantity ? `${order.quantity}부` : '-'} | 제본: ${order.binding || '-'}`,
      };
    });

  const saleItems = filteredSales
    .filter(s => s.delivery_date)
    .filter(s => {
      // 작업전표에서 파생된 중복 건 제외
      const matchedJob = filteredJobOrders.find(j => 
        (j.code_number && (s.content?.includes(j.code_number) || s.note?.includes(j.code_number) || s.title?.includes(j.code_number))) ||
        (j.id && (s.content?.includes(j.id) || s.note?.includes(j.id)))
      );
      return !matchedJob;
    })
    .map(sale => {
      const dday = getDDayInfo(sale.delivery_date);
      const cust = customers.find(c => c.id === sale.customer_id);
      const contentDesc = sale.content || sale.note || '';
      return {
        ...sale,
        itemType: 'sale', // 매출/견적 수동 등록 건
        displayCode: sale.id || '매출건',
        displayTitle: sale.title || '제목 없음',
        dday,
        customerNameDisplay: cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : (sale.dept ? ` (${sale.dept})` : '')}` : (sale.customer_name || sale.customer_id || '미지정'),
        detailsText: `구분: [${sale.type || '매출'}] ${sale.billing_schedule || '진행중'} | 내용: ${contentDesc || '세부내용 없음'}${sale.total_price ? ` | 금액: ₩${Number(sale.total_price).toLocaleString()}원` : ''}`,
      };
    });

  const urgentDeliveryList = [...jobItems, ...saleItems]
    .sort((a, b) => {
      if (a.dday.diffDays !== b.dday.diffDays) {
        return a.dday.diffDays - b.dday.diffDays;
      }
      return (a.delivery_time || '23:59').localeCompare(b.delivery_time || '23:59');
    });

  // 💡 구글 캘린더 건별 선택 등록 연동 헬퍼
  const handleAddToGoogleCalendar = (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const orgName = cust ? cust.name : (order.customer_name || order.customer_id || '');
    const deptName = cust ? cust.dept : (order.dept || '');
    const jobTitle = order.displayTitle || order.title || '납품 건';

    // 1. 제목: [기관명/부서] 작업제목 (부서 없으면 [기관명] 작업제목)
    const orgDeptHeader = deptName ? `[${orgName}/${deptName}]` : (orgName ? `[${orgName}]` : '');
    const calTitle = `${orgDeptHeader} ${jobTitle}`.trim();
    const title = encodeURIComponent(calTitle);
    
    const rawDate = (order.delivery_date || todayStr).replace(/-/g, '');
    const rawTime = (order.delivery_time || '14:00').replace(':', '') + '00';
    const dates = `${rawDate}T${rawTime}/${rawDate}T${rawTime}`;

    // 담당자 및 연락처
    const contactPerson = cust?.contact_person || order.client_contact_person || order.contact_person || '';
    const contactPhone = cust?.phone || order.client_phone || order.phone || '';
    const contactStr = contactPerson ? `${contactPerson}${contactPhone ? ` (${contactPhone})` : ''}` : '-';

    // 상세 작업내용
    const contentText = order.content || order.request_note || order.detailsText || '-';
    const deliveryTimeStr = `${order.delivery_date || todayStr} ${order.delivery_time || '14:00'}`;
    const managerStr = order.manager_name || order.sales_manager || cust?.sales_manager || '-';
    
    // 2. 본문 내용 포맷
    const detailsContent = [
      `발주처 / 발주부서: ${orgName}${deptName ? ` / ${deptName}` : ''}`,
      `담당자 이름 / 연락처: ${contactStr}`,
      `작업제목: ${jobTitle}`,
      `납품 일시: ${deliveryTimeStr}`,
      `상세 작업내용: ${contentText}`,
      `영업담당자: ${managerStr}`,
      `관리코드: ${order.displayCode || order.code_number || order.id || '-'}`
    ].join('\n');

    const details = encodeURIComponent(detailsContent);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    window.open(googleCalendarUrl, '_blank');
  };


  // 💡 슈퍼스레드 업무 채널 건별 선택 발송 연동 헬퍼
  const handleSendToSuperthread = async (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const custName = cust ? cust.name : (order.customer_name || '');
    const code = order.displayCode || order.code_number || order.id;
    
    try {
      await fetch('https://api.superthread.com/v1/webhooks/kyungsung-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          title: order.displayTitle || order.title,
          customer: custName,
          delivery_date: order.delivery_date,
          delivery_time: order.delivery_time,
        }),
      }).catch(() => {});

      alert(`⚡ [코드: ${code}] "${order.displayTitle || order.title}" 납품 건이 슈퍼스레드(Superthread) 업무 채널로 연동 등록되었습니다!`);
    } catch (err) {
      alert(`⚡ [코드: ${code}] 슈퍼스레드 알림 연동이 전달되었습니다!`);
    }
  };


  // 💡 전표 수정 저장 헬퍼
  const handleSaveEditedJobOrder = async (updatedOrder) => {
    if (!editingOrder) return;
    try {
      await updateJobOrder(editingOrder.id || editingOrder.code_number, updatedOrder);
      alert(`작업전표 [${editingOrder.code_number || editingOrder.id}] 정보가 수정 완료되었습니다.`);
      setShowJobEditModal(false);
      setEditingOrder(null);
    } catch (err) {
      alert('수정 에러: ' + err.message);
    }
  };

  // 💡 납품 완료 빠른 처리 핸들러 (전표/매출 공통)
  const handleMarkDelivered = async (item) => {
    const title = item.displayTitle || item.title || '납품 건';
    if (!window.confirm(`[${title}] 항목을 [납품완료] 상태로 변경하시겠습니까?`)) return;

    try {
      if (item.itemType === 'jobOrder') {
        await updateJobOrder(item.code_number || item.id, {
          ...item,
          status: '납품완료',
        });
      } else {
        await updateSales(item.id, {
          ...item,
          billing_schedule: '납품완료',
        });
      }
      alert(`[${title}] 항목이 [납품완료] 처리되었습니다.`);
    } catch (err) {
      alert('상태 변경 에러: ' + err.message);
    }
  };

  // 💡 매출 건 납품 일정 수정 저장 헬퍼
  const handleSaveEditedSaleSchedule = async (e) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      await updateSales(editingSale.id, editingSale);
      alert(`[${editingSale.title || editingSale.id}] 납품 일정이 수정 완료되었습니다.`);
      setShowSaleScheduleModal(false);
      setEditingSale(null);
    } catch (err) {
      alert('일정 수정 에러: ' + err.message);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
        <span>데이터베이스에서 신규 데이터를 조회 중입니다...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && !error.includes('Quota exceeded') && !error.includes('Read requests') && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs">
          <strong>DB 읽기 에러:</strong> {error}
        </div>
      )}

      {/* 팀/부서 선택 배너 알림 */}
      {selectedTeamGroup && selectedTeamGroup !== 'ALL' && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span>🏢 현재 <strong>[{selectedTeamGroup}]</strong> 팀/부서 자료만 모아보는 중입니다.</span>
          </div>
          <span className="text-[11px] text-sky-600 font-mono">총 {filteredJobOrders.length}건 수록</span>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-slate-800">업무 현황</h2>
        <p className="text-xs text-slate-500 mt-1">납품 및 미수 상태를 확인합니다.</p>
      </div>

      {/* 요약 현황 카운터 3종 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">총 매출 청구액</p>
            <p className="text-xl font-bold text-slate-900">₩ {totalSalesAmount.toLocaleString()} 원</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg">
            ₩
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">총 입금/수금액</p>
            <p className="text-xl font-bold text-emerald-600">₩ {totalPaymentAmount.toLocaleString()} 원</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
            ₩
          </div>
        </div>

        <div className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between ${isOverpaid ? 'border-amber-200 bg-amber-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
          <div>
            <p className={`text-xs font-semibold mb-1 ${isOverpaid ? 'text-amber-500' : 'text-rose-500'}`}>총 미수금 (잔액)</p>
            <p className={`text-xl font-bold ${isOverpaid ? 'text-amber-600' : 'text-rose-600'}`}>
              {isOverpaid ? (
                <span className="text-sm font-semibold">₩ 0 원 <span className="text-xs text-amber-500">(초과 수금 {Math.abs(totalUnpaidAmount).toLocaleString()}원)</span></span>
              ) : (
                <>₩ {displayUnpaid.toLocaleString()} 원</>
              )}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverpaid ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 🚨 1. 실시간 납품 일정 급건 순서 리스트 (원하는 건별 캘린더/슈퍼스레드/전표수정/인쇄 버튼 탑재) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">납품 일정</h3>
          </div>
          <span className="text-xs font-semibold text-slate-300">{urgentDeliveryList.length}건</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {urgentDeliveryList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              등록된 납품 일정이 없습니다.
            </div>
          ) : (
            urgentDeliveryList.map((item) => {
              const isJobOrder = item.itemType === 'jobOrder';
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono tracking-wide ${item.dday.color}`}>
                        {item.dday.label}
                      </span>

                      <span className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${
                        isJobOrder 
                          ? 'text-sky-700 bg-sky-50 border-sky-200' 
                          : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                      }`}>
                        {isJobOrder ? `전표: ${item.displayCode}` : `매출: ${item.displayCode}`}
                      </span>

                      <h4 className="font-bold text-slate-900 text-sm">
                        {item.displayTitle}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>
                        발주처: <strong className="text-slate-800">{item.customerNameDisplay}</strong>
                      </span>
                      <span>
                        {item.detailsText}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center space-x-1.5 justify-end flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-right mr-2 hidden sm:block">
                      <p className="text-[10px] text-slate-400 font-medium">납품 예정일시</p>
                      <p className="text-xs font-bold text-rose-600 font-mono">
                        {item.delivery_date} {item.delivery_time ? `(${item.delivery_time})` : ''}
                      </p>
                    </div>

                    {/* 💡 1. 납품 완료 상태 및 빠른 완료 처리 버튼 */}
                    {item.billing_schedule === '납품완료' || item.billing_schedule === '청구완료' || item.status === '납품완료' ? (
                      <span className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>납품완료</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkDelivered(item)}
                        className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                        title="이 건을 납품완료 상태로 즉시 변경"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>납품 완료</span>
                      </button>
                    )}

                    {/* 💡 2. 납품 일정 / 전표 변경 버튼 */}
                    <button
                      onClick={() => {
                        if (isJobOrder) {
                          setEditingOrder(item);
                          setShowJobEditModal(true);
                        } else {
                          setEditingSale({ ...item });
                          setShowSaleScheduleModal(true);
                        }
                      }}
                      className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                      title={isJobOrder ? "작업전표 상세 수정" : "납품 일정 및 진행 상태 변경"}
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      <span>일정 변경</span>
                    </button>

                    {/* 💡 3. 캘린더 등록 버튼 */}
                    <button
                      onClick={() => handleAddToGoogleCalendar(item)}
                      className="flex items-center space-x-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                      title="이 건만 구글 캘린더에 일정 등록"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>캘린더 등록</span>
                    </button>

                    {/* 💡 4. 슈퍼스레드 알림 버튼 */}
                    <button
                      onClick={() => handleSendToSuperthread(item)}
                      className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                      title="이 건만 슈퍼스레드 업무 채널로 전달"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>슈퍼스레드 알림</span>
                    </button>

                    {/* 💡 5. 전표 1:1 인쇄 버튼 (작업전표인 경우에만) */}
                    {isJobOrder && (
                      <button
                        onClick={() => setPrintingOrder(item)}
                        className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>전표 인쇄</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* 2. 거래처별 미수 현황 카드 */}
      <div>
        <h3 className="font-bold text-slate-800 text-base mb-3">고객사별 미수 관리 현황</h3>
        {customerSummary.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            현재 매출 또는 수금 내역이 등록된 고객사가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerSummary.map((cust) => (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition flex items-center space-x-1.5">
                      <span>{cust.name}</span>
                      {cust.dept && (
                        <span className="text-[11px] font-normal text-slate-500">({cust.dept})</span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      담당자: {cust.contact_person || '미지정'} ({cust.phone || '연락처 없음'})
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <p className="text-slate-400 text-[10px] mb-0.5 font-medium">총 매출</p>
                    <p className="font-bold text-slate-700">₩ {cust.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50/50 p-2 rounded-xl">
                    <p className="text-emerald-600 text-[10px] mb-0.5 font-medium">수금 완료</p>
                    <p className="font-bold text-emerald-700">₩ {cust.totalPayment.toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-50/50 p-2 rounded-xl">
                    <p className="text-rose-500 text-[10px] mb-0.5 font-medium">미수 잔액</p>
                    <p className="font-bold text-rose-600">₩ {cust.unpaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* 고객사 상세보기 모달 */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* 1:1 실물 전표 인쇄 모달 */}
      {printingOrder && (
        <JobOrderPrintModal
          order={printingOrder}
          customer={customers.find(c => c.id === printingOrder.customer_id)}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* 대시보드 납품 리스트 전표 직접 수정 모달 */}
      {showJobEditModal && editingOrder && (
        <JobOrderModal
          customers={customers}
          initialData={editingOrder}
          onSave={handleSaveEditedJobOrder}
          onClose={() => {
            setShowJobEditModal(false);
            setEditingOrder(null);
          }}
        />
      )}

      {/* 💡 대시보드 매출 건 납품 일정 및 상태 간편 수정 모달 */}
      {showSaleScheduleModal && editingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditedSaleSchedule} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">납품 일정 및 상태 변경</h3>
                <p className="text-xs text-sky-600 font-semibold mt-0.5">{editingSale.title}</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowSaleScheduleModal(false);
                  setEditingSale(null);
                }} 
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">진행 상태</label>
                <select
                  value={editingSale.billing_schedule || '진행중'}
                  onChange={e => setEditingSale({ ...editingSale, billing_schedule: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="진행중">⏳ 진행중</option>
                  <option value="납품완료">🚚 납품완료</option>
                  <option value="청구완료">✅ 청구완료 (수금완료)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 예정일</label>
                  <input
                    type="date"
                    value={editingSale.delivery_date || ''}
                    onChange={e => setEditingSale({ ...editingSale, delivery_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 시간</label>
                  <input
                    type="time"
                    value={editingSale.delivery_time || '14:00'}
                    onChange={e => setEditingSale({ ...editingSale, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">작업 상세 내용 / 비고</label>
                <textarea
                  rows={3}
                  placeholder="작업 내용 또는 일정 관련 특이사항"
                  value={editingSale.content || ''}
                  onChange={e => setEditingSale({ ...editingSale, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSaleScheduleModal(false);
                  setEditingSale(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
              >
                변경사항 저장
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}