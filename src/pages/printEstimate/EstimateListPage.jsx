// src/pages/printEstimate/EstimateListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Download, Printer, Edit2, Trash2, GitBranch,
  CheckCircle
} from 'lucide-react';
import {
  getEstimates,
  deleteEstimate,
  createEstimateVersion,
  setFinalEstimate,
  exportEstimatesToExcel
} from '../../services/printEstimateStorage';
import EstimatePrintViewModal from './EstimatePrintViewModal';

export default function EstimateListPage({ onNewEstimate, onSelectEstimate }) {
  const [estimates, setEstimates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [printEstimate, setPrintEstimate] = useState(null);

  const loadEstimates = () => {
    setEstimates(getEstimates());
  };

  useEffect(() => {
    loadEstimates();
  }, []);

  const handleDelete = (id, productName) => {
    if (window.confirm(`[${productName || '선택한 견적서'}]를 삭제하시겠습니까?`)) {
      deleteEstimate(id);
      loadEstimates();
    }
  };

  const handleBranchVersion = (item) => {
    const nextVer = (item.version || 1) + 1;
    if (window.confirm(`[${item.productName}] 견적서를 복사하여 '${nextVer}차 견적서'를 생성하시겠습니까?`)) {
      const newVersion = createEstimateVersion(item.id);
      loadEstimates();
      if (onSelectEstimate) onSelectEstimate(newVersion);
    }
  };

  const handleSetFinal = (id, productName) => {
    if (window.confirm(`[${productName}] 견적서를 '최종 확정 견적'으로 지정하시겠습니까?`)) {
      setFinalEstimate(id);
      loadEstimates();
    }
  };

  // 필터링된 견적 목록
  const filteredList = useMemo(() => {
    return estimates.filter(e => {
      const matchSearch =
        !searchTerm ||
        (e.productName && e.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.clientName && e.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.estimateNo && e.estimateNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'FINAL' && e.isFinal) ||
        e.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [estimates, searchTerm, statusFilter]);

  return (
    <div className="space-y-5">
      {/* 상단 검색 및 툴바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="품명, 거래처명, 견적번호 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-sky-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="ALL">상태 전체</option>
            <option value="작성완료">작성완료</option>
            <option value="작성중">작성중/임시</option>
            <option value="FINAL">최종확정만</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportEstimatesToExcel(filteredList)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>목록 엑셀 다운로드</span>
          </button>

          <button
            onClick={onNewEstimate}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>새 견적서 작성</span>
          </button>
        </div>
      </div>

      {/* 견적서 데이터 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">견적번호 / 버전</th>
                <th className="p-3">거래처명</th>
                <th className="p-3">품명 (인쇄물 제목)</th>
                <th className="p-3 text-center">수량 / 규격</th>
                <th className="p-3 text-right">공급가액</th>
                <th className="p-3 text-right">합계 견적액</th>
                <th className="p-3 text-right">부당단가</th>
                <th className="p-3 text-center">상태</th>
                <th className="p-3 text-center">작성일자</th>
                <th className="p-3 text-center w-36">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    등록된 인쇄 견적서가 없습니다. 상단의 '새 견적서 작성' 버튼을 눌러보세요!
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800">{item.estimateNo}</div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {item.version || 1}차
                        </span>
                        {item.isFinal && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">
                            최종확정
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 font-semibold text-slate-800">
                      <div>{item.clientName || '-'}</div>
                      {item.contactName && <div className="text-[11px] text-slate-400">{item.contactName}</div>}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => onSelectEstimate(item)}
                        className="font-bold text-sky-700 hover:text-sky-900 hover:underline text-left block"
                      >
                        {item.productName}
                      </button>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {item.paperType} / {item.bindingType}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-800">
                        {(item.quantity || 0).toLocaleString()} {item.unit || '부'}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.paperCut || ''} ({item.pages || 0}p)</div>
                    </td>

                    <td className="p-3 text-right font-medium text-slate-600">
                      {(item.subtotal || 0).toLocaleString()}원
                    </td>

                    <td className="p-3 text-right font-black text-sky-700 text-sm">
                      {(item.totalAmount || 0).toLocaleString()}원
                    </td>

                    <td className="p-3 text-right font-bold text-slate-700">
                      {(item.unitPrice || 0).toLocaleString()}원
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isFinal
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === '임시저장'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}>
                        {item.isFinal ? '최종확정' : item.status || '작성완료'}
                      </span>
                    </td>

                    <td className="p-3 text-center text-slate-400 text-[11px]">
                      {item.createdAt ? item.createdAt.slice(0, 10) : '-'}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onSelectEstimate(item)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                          title="수정 / 상세"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPrintEstimate(item)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                          title="A4 인쇄"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleBranchVersion(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                          title="새 버전 분기 (복사)"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                        </button>
                        {!item.isFinal && (
                          <button
                            onClick={() => handleSetFinal(item.id, item.productName)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg"
                            title="최종 견적 지정"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id, item.productName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 인쇄 모달 */}
      {printEstimate && (
        <EstimatePrintViewModal
          estimate={printEstimate}
          onClose={() => setPrintEstimate(null)}
        />
      )}
    </div>
  );
}
