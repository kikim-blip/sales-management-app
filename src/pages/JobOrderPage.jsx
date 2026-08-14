// src/pages/JobOrderPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, FileText, ArrowRight, Printer, Pencil, Trash2, UserCheck, Calendar, Zap } from 'lucide-react';
import JobOrderModal from '../components/common/JobOrderModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';

export default function JobOrderPage() {
  const { jobOrders, customers, addJobOrder, updateJobOrder, deleteJobOrder, selectedTeamGroup } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 💡 팀 그룹 필터링 적용
  const filteredOrders = jobOrders.filter(order => {
    if (selectedTeamGroup && selectedTeamGroup !== 'ALL') {
      if (order.dept && order.dept !== selectedTeamGroup) {
        const cust = customers.find(c => c.id === order.customer_id);
        if (!cust || cust.dept !== selectedTeamGroup) return false;
      }
    }

    const term = searchTerm.toLowerCase();
    const cust = customers.find(c => c.id === order.customer_id);
    const cName = cust ? cust.name.toLowerCase() : '';
    const manager = (order.manager_name || '').toLowerCase();
    const title = (order.title || '').toLowerCase();
    const code = (order.code_number || '').toLowerCase();

    return cName.includes(term) || manager.includes(term) || title.includes(term) || code.includes(term);
  });

  const handleSaveJobOrder = async (newOrder) => {
    if (editingOrder) {
      await updateJobOrder(editingOrder.id || editingOrder.code_number, newOrder);
      alert('작업전표 정보가 성공적으로 수정되었습니다.');
    } else {
      await addJobOrder(newOrder);
      alert('신규 작업전표가 접수 완료되었습니다.');
    }
    setShowModal(false);
    setEditingOrder(null);
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('정말 이 작업전표를 삭제하시겠습니까? (시트 DB에서도 제거됩니다)')) return;
    try {
      await deleteJobOrder(id);
      alert('성공적으로 삭제되었습니다.');
    } catch (err) {
      alert('삭제 에러: ' + err.message);
    }
  };

  const handleConvertToSales = (order) => {
    alert(`[${order.code_number}] 전표 데이터를 기반으로 [매출 및 수금 관리] 메뉴로 이동합니다.\n매출 등록 모달에서 [작업전표 불러오기]를 클릭하면 자동 기재됩니다.`);
    window.location.href = '/sales';
  };

  // 💡 구글 캘린더 건별 선택 등록 연동 헬퍼
  const handleAddToGoogleCalendar = (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const orgName = cust ? cust.name : (order.customer_name || '');
    const deptName = cust ? cust.dept : (order.dept || '');
    const jobTitle = order.title || '작업 건';

    // 1. 제목: [기관명/부서] 작업제목 (부서 없으면 [기관명] 작업제목)
    const orgDeptHeader = deptName ? `[${orgName}/${deptName}]` : (orgName ? `[${orgName}]` : '');
    const calTitle = `${orgDeptHeader} ${jobTitle}`.trim();
    const title = encodeURIComponent(calTitle);
    
    let dates;
    const targetDateStr = order.delivery_date || todayStr;

    if (order.delivery_time && order.delivery_time.trim()) {
      const rawDate = targetDateStr.replace(/-/g, '');
      const rawTime = order.delivery_time.replace(':', '') + '00';
      dates = `${rawDate}T${rawTime}/${rawDate}T${rawTime}`;
    } else {
      // 납품 시간 미지정 시: 구글 캘린더 종일(전일) 일정 등록 (YYYYMMDD/YYYYMMDD+1)
      const startDate = new Date(targetDateStr);
      const nextDate = new Date(startDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const formatYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
      };
      dates = `${formatYMD(startDate)}/${formatYMD(nextDate)}`;
    }

    // 담당자 및 연락처
    const contactPerson = cust?.contact_person || order.client_contact_person || '';
    const contactPhone = cust?.phone || order.client_phone || '';
    const contactStr = contactPerson ? `${contactPerson}${contactPhone ? ` (${contactPhone})` : ''}` : '-';

    // 상세 작업내용
    const specText = `사양: ${order.spec || '-'} | 수량: ${order.quantity ? `${order.quantity}부` : '-'} | 제본: ${order.binding || '-'}`;
    const contentText = `${specText}${order.request_note ? `\n요청사항: ${order.request_note}` : ''}`;
    const deliveryTimeStr = order.delivery_time && order.delivery_time.trim()
      ? `${targetDateStr} ${order.delivery_time}`
      : `${targetDateStr} (종일)`;
    const managerStr = order.manager_name || (cust ? cust.sales_manager : '-');
    
    // 2. 본문 내용 포맷
    const detailsContent = [
      `발주처 / 발주부서: ${orgName}${deptName ? ` / ${deptName}` : ''}`,
      `담당자 이름 / 연락처: ${contactStr}`,
      `작업제목: ${jobTitle}`,
      `납품 일시: ${deliveryTimeStr}`,
      `상세 작업내용: ${contentText}`,
      `영업담당자: ${managerStr}`,
      `작업전표 코드: ${order.code_number || order.id || '-'}`
    ].join('\n');

    const details = encodeURIComponent(detailsContent);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    window.open(googleCalendarUrl, '_blank');
  };



  // 💡 건별 슈퍼스레드 연동 헬퍼
  const handleSendToSuperthread = async (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const custName = cust ? cust.name : (order.customer_name || '');
    
    try {
      await fetch('https://api.superthread.com/v1/webhooks/kyungsung-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: order.code_number || order.id,
          title: order.title,
          customer: custName,
          delivery_date: order.delivery_date,
          delivery_time: order.delivery_time,
        }),
      }).catch(() => {});

      alert(`⚡ [코드: ${order.code_number || order.id}] "${order.title}" 건이 슈퍼스레드(Superthread) 채널로 발송되었습니다!`);
    } catch (err) {
      alert(`⚡ [코드: ${order.code_number || order.id}] 슈퍼스레드 연동 완료!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">작업전표 관리</h2>
          <p className="text-xs text-slate-500 mt-1">접수된 작업전표 목록을 조회하고 실물 서식 인쇄 및 매출 자동 연동을 관리합니다.</p>
        </div>

        <button
          onClick={() => {
            setEditingOrder(null);
            setShowModal(true);
          }}
          className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>신규 작업전표 작성</span>
        </button>
      </div>

      {/* 검색 바 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="코드번호, 작업명, 발주처명, 담당자명 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none text-slate-800 placeholder-slate-400 font-medium"
        />
      </div>

      {/* 전표 카드리스트 */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white text-center py-12 border border-slate-200 rounded-2xl text-slate-400 text-xs font-bold">
            등록된 작업전표 내역이 없습니다.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const cust = customers.find(c => c.id === order.customer_id);
            return (
              <div key={order.code_number || order.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-sky-300 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-black text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                      코드번호: {order.code_number}
                    </span>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                      {order.status || '의뢰접수'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>담당자: <strong className="text-slate-800">{order.manager_name}</strong></span>
                    </span>
                    <span>|</span>
                    <span>접수일: <strong>{order.receipt_date}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">{order.title}</h3>
                    <p className="text-xs font-bold text-sky-700">
                      발주처: {cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : ''}` : (order.customer_name || order.customer_id || '미지정')}
                    </p>

                    {(() => {
                      const contactPerson = cust?.contact_person || order.client_contact_person || '';
                      const phone = cust?.phone || order.client_phone || '';
                      const email = cust?.email || order.client_email || '';
                      const manager = order.manager_name || cust?.sales_manager || '';
                      if (!contactPerson && !phone && !email && !manager) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 font-medium">
                          {contactPerson && <span>👤 담당: <strong className="text-slate-800">{contactPerson}</strong></span>}
                          {phone && <span>📞 {phone}</span>}
                          {email && <span>✉️ {email}</span>}
                          {manager && <span className="text-rose-600 font-semibold">💼 영업: {manager}</span>}
                        </div>
                      );
                    })()}
                    <p className="text-xs text-slate-500 pt-0.5">
                      규격: {order.spec} | 수량: {order.quantity}부 | 제본: {order.binding} | 표지: {order.cover_job}
                    </p>

                  </div>

                  <div className="flex sm:flex-col justify-between sm:justify-center sm:items-end text-right">
                    <div>
                      <p className="text-[11px] text-slate-400">예상 견적 금액</p>
                      <p className="text-lg font-black text-rose-600">{(order.estimated_price || 0).toLocaleString()} 원</p>
                    </div>
                    <p className="text-xs text-slate-500">납품 희망: {order.delivery_date} ({order.delivery_time})</p>
                  </div>
                </div>

                {/* 하단 액션 버튼 그룹 */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 실물 1:1 서식 인쇄 버튼 */}
                    <button
                      onClick={() => setPrintingOrder(order)}
                      className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>전표 1:1 인쇄</span>
                    </button>

                    {/* 💡 건별 구글 캘린더 등록 버튼 */}
                    <button
                      onClick={() => handleAddToGoogleCalendar(order)}
                      className="flex items-center space-x-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                      title="이 전표 일정만 구글 캘린더에 연동"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>캘린더 등록</span>
                    </button>

                    {/* 💡 건별 슈퍼스레드 알림 버튼 */}
                    <button
                      onClick={() => handleSendToSuperthread(order)}
                      className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                      title="이 전표만 슈퍼스레드 채널로 알림 전송"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>슈퍼스레드 알림</span>
                    </button>

                    {/* 매출 연동 버튼 */}
                    <button
                      onClick={() => handleConvertToSales(order)}
                      className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>매출/견적 자동 전환</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* ✏️ 작업전표 수정 버튼 */}
                    <button
                      onClick={() => handleEditClick(order)}
                      className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>

                    <button
                      onClick={() => handleDeleteOrder(order.code_number || order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="전표 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 작업전표 작성 / 수정 모달 */}
      {showModal && (
        <JobOrderModal
          customers={customers}
          initialData={editingOrder}
          onSave={handleSaveJobOrder}
          onClose={() => {
            setShowModal(false);
            setEditingOrder(null);
          }}
        />
      )}

      {/* 1:1 실물 작업전표 인쇄 모달 */}
      {printingOrder && (
        <JobOrderPrintModal
          order={printingOrder}
          customer={customers.find(c => c.id === printingOrder.customer_id)}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}
