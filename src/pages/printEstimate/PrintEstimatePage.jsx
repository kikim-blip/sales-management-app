// src/pages/printEstimate/PrintEstimatePage.jsx
import React, { useState } from 'react';
import { PlusCircle, Sliders, ClipboardList } from 'lucide-react';
import EstimateListPage from './EstimateListPage';
import EstimateFormPage from './EstimateFormPage';
import MasterManagementPage from './MasterManagementPage';

export default function PrintEstimatePage() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'form' | 'master'
  const [editingEstimate, setEditingEstimate] = useState(null);

  const handleNewEstimate = () => {
    setEditingEstimate(null);
    setActiveTab('form');
  };

  const handleSelectEstimate = (estimate) => {
    setEditingEstimate(estimate);
    setActiveTab('form');
  };

  const handleBackToList = () => {
    setEditingEstimate(null);
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      {/* 최상단 페이지 헤더 및 탭 네비게이션 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <span>인쇄 견적 관리 시스템</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-700">
              경성문화사
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            제판(CTP), 인쇄, 제본, 후가공, 용지 등 6대 공정 자동 원가 계산 및 견적서 버전 관리
          </p>
        </div>

        {/* 대메뉴 탭 버튼 */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'list'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>견적 목록</span>
          </button>

          <button
            onClick={handleNewEstimate}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'form'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{editingEstimate ? '견적 수정/작성' : '새 견적 작성'}</span>
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'master'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>단가 & 마스터</span>
          </button>
        </div>
      </div>

      {/* 탭 본문 렌더링 */}
      {activeTab === 'list' && (
        <EstimateListPage
          onNewEstimate={handleNewEstimate}
          onSelectEstimate={handleSelectEstimate}
        />
      )}

      {activeTab === 'form' && (
        <EstimateFormPage
          initialEstimate={editingEstimate}
          onBack={handleBackToList}
          onSaved={() => {
            // 저장 완료 시 목록으로 돌아가거나 유지
          }}
        />
      )}

      {activeTab === 'master' && (
        <MasterManagementPage />
      )}
    </div>
  );
}
