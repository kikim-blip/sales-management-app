// src/components/common/SelectJobOrderModal.jsx
import React from 'react';
import { X, ClipboardList, ArrowRight, User } from 'lucide-react';

export default function SelectJobOrderModal({ jobOrders, customers, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">의뢰 작업전표 선택 (자동 연동)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <p className="text-xs text-slate-500 mb-2">
            불러올 작업전표를 선택하시면 코드번호, 고객사, 담당자, 작업내용, 사양이 매출/견적서에 자동 입력됩니다.
          </p>

          {jobOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              등록된 의뢰 작업전표가 없습니다.
            </div>
          ) : (
            jobOrders.map((order, idx) => {
              const cust = customers.find(c => c.id === order.customer_id);
              const codeNo = order.code_number || order.id || '84-260812-3277';
              return (
                <div
                  key={order.id || idx}
                  onClick={() => onSelect(order)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        {codeNo}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-sky-700">{order.title}</h4>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>고객사: <strong className="text-slate-700">{cust ? `${cust.name} (${cust.dept})` : order.customer_id}</strong></span>
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>담당: {order.manager_name || '홍길동'}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      접수일: {order.receipt_date || order.order_date} | 희망 납품일: {order.delivery_date} | 금액: {(order.estimated_price || 0).toLocaleString()}원
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 text-sky-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                    <span>선택</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
