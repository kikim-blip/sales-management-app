// src/pages/JobOrderPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { ClipboardList, Plus, Printer, FileText, UserCheck, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import JobOrderModal from '../components/common/JobOrderModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';

export default function JobOrderPage() {
  const { customers, sales, addSales } = useData();
  const { user } = useGoogleAuth();

  const today = new Date().toISOString().split('T')[0];

  // 1. 작업전표 목록 state
  const [jobOrders, setJobOrders] = useState([
    {
      id: 'ORDER-001',
      code_number: '84 - 260812 - 3277',
      manager_name: user?.userName || '강영진',
      receipt_date: today,
      customer_id: customers[0]?.id || 'CUST-001',
      dept: customers[0]?.dept || '기획예산부',
      title: '2026년 공사 주요사업 추진현황',
      spec: '210*297',
      pages: '페이지수',
      duplex: '양면',
      quantity: 50,
      estimated_price: 1500000,
      client_contact_person: customers[0]?.contact_person || '김수정',
      client_phone: customers[0]?.phone || '061-931-1114',
      client_email: 'ksj127@at.or.kr',
      email_receipt_time: '26.08.12 (수) 10:51',
      cover_job: '한글편집세종',
      cover_paper: '레쟈크체크백색',
      cover_print: '컬러',
      coating: '없음',
      inner_job: '한글편집세종',
      inner_paper: '백색모조100g',
      inner_print: '컬러',
      interleaf_paper: '없음',
      binding: '무선제본',
      draft_email: 'ksks5577',
      draft_group: 'aT',
      mail_sender: '김수정',
      cover_proof_date: today,
      inner_proof_date: today,
      proof_method: '리턴없음',
      planning: '기획관련내용',
      photography: '사진촬영관련내용',
      illustration: '일러스트 작업 유무',
      copyright_web: '저작권·웹게시 관련 내용',
      production_progress: '서울출력실',
      delivery_destination: '이기철팀장전달',
      cover_related: '1.첫페이지 표지사용',
      inner_related: '1.개쪽만 확인하고 올려주세요',
      request_note: '-',
      editor_name: '편집 작업자명',
      designer_name: '디자인 작업자명',
      delivery_date: today,
      delivery_time: '12시',
      status: '의뢰접수',
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [printingOrder, setPrintingOrder] = useState(null);

  // 작업전표 저장
  const handleSaveJobOrder = (newOrder) => {
    const orderId = `ORDER-${String(jobOrders.length + 1).padStart(3, '0')}`;
    setJobOrders(prev => [{ id: orderId, ...newOrder }, ...prev]);
    alert(`[코드: ${newOrder.code_number}] 작업전표가 접수 등록되었습니다!`);
    setShowModal(false);
  };

  // 작업전표 삭제
  const handleDeleteOrder = (id) => {
    if (!window.confirm('정말 이 작업전표를 삭제하시겠습니까?')) return;
    setJobOrders(prev => prev.filter(o => o.id !== id));
  };

  // 매출/견적으로 1클릭 전환
  const handleConvertToSales = async (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const supply = order.estimated_price || 1000000;
    const tax = Math.round(supply * 0.1);

    const salesItem = {
      reg_date: today,
      receipt_date: order.receipt_date || today,
      delivery_date: order.delivery_date || today,
      delivery_time: order.delivery_time || '14:00',
      customer_id: order.customer_id,
      title: order.title,
      content: `[코드: ${order.code_number}] ${order.cover_job} / ${order.binding}`,
      note: `담당사원: ${order.manager_name} (코드: ${order.code_number})`,
      billing_schedule: '청구완료',
      type: '매출',
      supply_price: supply,
      tax: tax,
      total_price: supply + tax,
      calendar_synced: true,
      superthread_synced: true,
    };

    try {
      await addSales(salesItem);
      alert(`[${order.code_number}] 전표가 매출 및 견적 항목으로 자동 전환 및 구글 시트에 저장되었습니다!`);
    } catch (err) {
      alert('매출 전환 에러: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 타이틀 및 작성 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-800">의뢰 작업전표 관리</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            의뢰 들어온 작업전표를 작성 및 관리하고, 실물 경성문화사 양식으로 1:1 출력 또는 매출로 연동합니다.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>작업전표 작성</span>
        </button>
      </div>

      {/* 등록된 작업전표 목록 */}
      <div className="space-y-4">
        {jobOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-3">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium">등록된 작업전표가 없습니다. 상단 [작업전표 작성] 버튼을 클릭해 보세요.</p>
          </div>
        ) : (
          jobOrders.map((order) => {
            const cust = customers.find(c => c.id === order.customer_id);
            return (
              <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-sky-300 transition">
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
                    <p className="text-xs font-semibold text-sky-600">
                      발주처: {cust ? `${cust.name} - ${cust.dept}` : order.customer_id} (담당: {order.client_contact_person || '미지정'})
                    </p>
                    <p className="text-xs text-slate-500 pt-1">
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
                  <div className="flex items-center space-x-2">
                    {/* 경성문화사 실물 1:1 서식 인쇄 버튼 */}
                    <button
                      onClick={() => setPrintingOrder(order)}
                      className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>실물 전표 인쇄 (PDF)</span>
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

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
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

      {/* 작업전표 신규 작성 모달 */}
      {showModal && (
        <JobOrderModal
          customers={customers}
          onSave={handleSaveJobOrder}
          onClose={() => setShowModal(false)}
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
    </div>
  );
}
