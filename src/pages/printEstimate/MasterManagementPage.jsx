// src/pages/printEstimate/MasterManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RotateCcw, Save, Check, FileSpreadsheet, Layers, Sliders, ShieldCheck, Building2, Printer } from 'lucide-react';
import {
  getMasterPapers, saveMasterPaper, deleteMasterPaper,
  getMasterProcesses, saveMasterProcess, deleteMasterProcess,
  getMasterStdPrices, saveMasterStdPrices, resetMasterDataToDefaults,
  getGovernmentMasterRates, saveGovernmentMasterRates, resetGovernmentMasterRates,
} from '../../services/printEstimateStorage';

export default function MasterManagementPage() {
  const [activeTab, setActiveTab] = useState('govRate'); // 'govRate' | 'paper' | 'process' | 'stdPrice'

  // States
  const [papers, setPapers] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [stdPrices, setStdPrices] = useState({});
  const [govRates, setGovRates] = useState({});
  const [editingPaper, setEditingPaper] = useState(null);
  const [editingProcess, setEditingProcess] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load masters
  const loadAll = () => {
    setPapers(getMasterPapers());
    setProcesses(getMasterProcesses());
    setStdPrices(getMasterStdPrices());
    setGovRates(getGovernmentMasterRates());
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleReset = () => {
    if (window.confirm('모든 용지, 공정, 표준단가를 시스템 기본 표준 데이터로 복원하시겠습니까? (사용자가 추가한 커스텀 항목이 초기화됩니다.)')) {
      resetMasterDataToDefaults();
      loadAll();
      showToast();
    }
  };

  const showToast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // ── Paper handlers
  const handleSavePaper = (e) => {
    e.preventDefault();
    if (!editingPaper.name || !editingPaper.weight) return;
    saveMasterPaper(editingPaper);
    setPapers(getMasterPapers());
    setEditingPaper(null);
    showToast();
  };

  const handleDeletePaper = (id) => {
    if (window.confirm('이 용지 규격을 삭제하시겠습니까?')) {
      deleteMasterPaper(id);
      setPapers(getMasterPapers());
      showToast();
    }
  };

  // ── Process handlers
  const handleSaveProcess = (e) => {
    e.preventDefault();
    if (!editingProcess.name) return;
    saveMasterProcess(editingProcess);
    setProcesses(getMasterProcesses());
    setEditingProcess(null);
    showToast();
  };

  const handleDeleteProcess = (id) => {
    if (window.confirm('이 공정을 삭제하시겠습니까?')) {
      deleteMasterProcess(id);
      setProcesses(getMasterProcesses());
      showToast();
    }
  };

  // ── GovRate handlers
  const handleUpdateGovPlate = (key, val) => {
    setGovRates(prev => ({
      ...prev,
      platePrices: { ...(prev.platePrices || {}), [key]: Number(val) || 0 }
    }));
  };

  const handleUpdateGovTypeset = (key, val) => {
    setGovRates(prev => ({
      ...prev,
      typesetUnitPrice: { ...(prev.typesetUnitPrice || {}), [key]: Number(val) || 0 }
    }));
  };

  const handleUpdateGovPass = (index, val) => {
    setGovRates(prev => {
      const copy = Array.isArray(prev.passUnitPrices) ? [...prev.passUnitPrices] : [];
      if (copy[index]) {
        copy[index] = { ...copy[index], price: Number(val) || 0 };
      }
      return { ...prev, passUnitPrices: copy };
    });
  };

  const handleUpdateGovBinding = (key, val) => {
    setGovRates(prev => ({
      ...prev,
      bindingUnitPrice: { ...(prev.bindingUnitPrice || {}), [key]: Number(val) || 0 }
    }));
  };

  const handleUpdateGovFinishing = (key, val) => {
    setGovRates(prev => ({
      ...prev,
      finishingUnitPrice: { ...(prev.finishingUnitPrice || {}), [key]: Number(val) || 0 }
    }));
  };

  const handleUpdateGovDigital = (key, val) => {
    setGovRates(prev => ({
      ...prev,
      digitalUnitPrice: { ...(prev.digitalUnitPrice || {}), [key]: Number(val) || 0 }
    }));
  };

  const handleUpdateGovLightRate = (section, key, val) => {
    setGovRates(prev => ({
      ...prev,
      lightPrintRates: {
        ...(prev.lightPrintRates || {}),
        [section]: {
          ...((prev.lightPrintRates && prev.lightPrintRates[section]) || {}),
          [key]: Number(val) || 0,
        }
      }
    }));
  };

  const handleUpdateGovRates = (key, val) => {
    setGovRates(prev => ({
      ...prev,
      [key]: Number(val) || 0
    }));
  };

  const handleSaveGovRates = () => {
    saveGovernmentMasterRates(govRates);
    showToast();
  };

  const handleResetGovRates = () => {
    if (window.confirm('조달청 공공 표준단가를 고시 기본값으로 초기화하시겠습니까?')) {
      const reset = resetGovernmentMasterRates();
      setGovRates(reset);
      showToast();
    }
  };

  // ── StdPrice handlers
  const handleUpdateStdCtp = (key, field, val) => {
    const next = { ...stdPrices };
    next.ctp = { ...next.ctp, [key]: { ...next.ctp[key], [field]: Number(val) || val } };
    setStdPrices(next);
  };

  const handleUpdateFinishing = (key, field, val) => {
    const next = { ...stdPrices };
    next.finishing = { ...next.finishing, [key]: { ...next.finishing[key], [field]: Number(val) || val } };
    setStdPrices(next);
  };

  const handleSaveStdPrices = () => {
    saveMasterStdPrices(stdPrices);
    showToast();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            <span>인쇄 단가 & 마스터 데이터 관리</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            조달청 공공 표준인쇄원가 고시단가 및 사기업 실무 단가표, 용지 규격, 공정 마스터를 설정합니다.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>단가 마스터 저장 완료!</span>
            </span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>전체 기본값 초기화</span>
          </button>
        </div>
      </div>

      {/* 서브 탭 */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 gap-2 shadow-sm">
        <button
          onClick={() => setActiveTab('govRate')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'govRate'
              ? 'border-teal-600 text-teal-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>🏛️ 1. 조달·공공 표준 단가 마스터</span>
        </button>

        <button
          onClick={() => setActiveTab('paper')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'paper'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📄 2. 용지 마스터 ({papers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('process')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'process'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>⚙️ 3. 공정 마스터 ({processes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stdPrice')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'stdPrice'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 4. 사기업 실무 단가표</span>
        </button>
      </div>

      {/* ── 탭 1: 조달·공공 표준 단가 마스터 ── */}
      {activeTab === 'govRate' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 border-t-0 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-teal-600 text-white rounded-md">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-sm font-black text-slate-800">
                  조달청 인쇄요금 원가계산 고시 기준단가 설정
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                국가를 당사자로 하는 계약에 관한 법률 시행규칙 제6조에 근거한 법정 원가 계산 시 적용되는 조달 표준 단가입니다.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetGovRates}
                className="flex items-center space-x-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>조달 고시 기본값 복원</span>
              </button>
              <button
                type="button"
                onClick={handleSaveGovRates}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>조달 단가 마스터 저장</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* 1. CTP 인쇄판대 & 전자조판료 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-4">
              <div className="font-black text-slate-800 text-xs pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>1. CTP 인쇄판료 (판당 단가)</span>
                <span className="text-[11px] font-normal text-slate-500">조달청 공인 단가</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">국2절 (A2)</label>
                  <input
                    type="number"
                    value={govRates.platePrices?.['국2절'] ?? 17500}
                    onChange={e => handleUpdateGovPlate('국2절', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">4×6 2절 (B2)</label>
                  <input
                    type="number"
                    value={govRates.platePrices?.['4×6 2절'] ?? 17500}
                    onChange={e => handleUpdateGovPlate('4×6 2절', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">국4절 (A3)</label>
                  <input
                    type="number"
                    value={govRates.platePrices?.['국4절'] ?? 12500}
                    onChange={e => handleUpdateGovPlate('국4절', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">4×6 4절 (B3)</label>
                  <input
                    type="number"
                    value={govRates.platePrices?.['4×6 4절'] ?? 12500}
                    onChange={e => handleUpdateGovPlate('4×6 4절', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">경인쇄 마스터</label>
                  <input
                    type="number"
                    value={govRates.platePrices?.['마스터'] ?? 2500}
                    onChange={e => handleUpdateGovPlate('마스터', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
              </div>

              <div className="font-black text-slate-800 text-xs pt-2 pb-1 border-b border-slate-200 flex items-center justify-between">
                <span>전자조판료 (면당 기본단가)</span>
                <span className="text-[11px] font-normal text-slate-500">기본단가 × 면수 × 조판율</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">표지 조판료</label>
                  <input
                    type="number"
                    value={govRates.typesetUnitPrice?.cover ?? 25000}
                    onChange={e => handleUpdateGovTypeset('cover', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">본문 조판료</label>
                  <input
                    type="number"
                    value={govRates.typesetUnitPrice?.body ?? 15390}
                    onChange={e => handleUpdateGovTypeset('body', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">화보 조판료</label>
                  <input
                    type="number"
                    value={govRates.typesetUnitPrice?.supplement ?? 20000}
                    onChange={e => handleUpdateGovTypeset('supplement', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
              </div>
            </div>

            {/* 2. 통수별 통당 인쇄 기본료 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-4">
              <div className="font-black text-slate-800 text-xs pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>2. 통수별 통당 인쇄 기본료 (원/통)</span>
                <span className="text-[11px] font-normal text-slate-500">국2절/4×6 2절 매엽기 (1도 기준)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(govRates.passUnitPrices || []).map((row, idx) => (
                  <div key={row.limit}>
                    <label className="font-bold text-slate-600 block mb-1">
                      {row.limit >= 99999999 ? '10,000통 초과' : `${row.limit.toLocaleString()}통 이하`}
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        value={row.price}
                        onChange={e => handleUpdateGovPass(idx, e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-right text-teal-800"
                      />
                      <span className="text-slate-500 font-bold">원</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ※ 지질할증(150g 이상/50g 이하: 1.3배), 솔리드 베다할증(1.6배), 특수별색(2.0배)이 산식에 의해 통당 단가에 곱해집니다.
              </div>
            </div>

            {/* 3. 제본 및 마감 가공단가 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-4">
              <div className="font-black text-slate-800 text-xs pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>3. 제본료 및 마감 단가</span>
                <span className="text-[11px] font-normal text-slate-500">책자 제본 / 낱장 재단 / 리플렛 접지</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">무사무선 (면당)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={govRates.bindingUnitPrice?.perfect ?? 0.825}
                    onChange={e => handleUpdateGovBinding('perfect', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">중철 (면당)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={govRates.bindingUnitPrice?.saddle ?? 0.650}
                    onChange={e => handleUpdateGovBinding('saddle', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">양장 (면당)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={govRates.bindingUnitPrice?.hardcover ?? 3.5}
                    onChange={e => handleUpdateGovBinding('hardcover', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">스프링 (부당)</label>
                  <input
                    type="number"
                    value={govRates.bindingUnitPrice?.spring ?? 850}
                    onChange={e => handleUpdateGovBinding('spring', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-teal-800"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-700 mb-2">리플렛 접지 및 낱장 재단비</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="font-medium text-slate-600 block mb-0.5 text-[11px]">2단접지 (부당)</label>
                    <input
                      type="number"
                      value={govRates.finishingUnitPrice?.fold2 ?? 12}
                      onChange={e => handleUpdateGovFinishing('fold2', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block mb-0.5 text-[11px]">3단접지 (부당)</label>
                    <input
                      type="number"
                      value={govRates.finishingUnitPrice?.fold3 ?? 18}
                      onChange={e => handleUpdateGovFinishing('fold3', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block mb-0.5 text-[11px]">4단접지 (부당)</label>
                    <input
                      type="number"
                      value={govRates.finishingUnitPrice?.fold4 ?? 24}
                      onChange={e => handleUpdateGovFinishing('fold4', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block mb-0.5 text-[11px]">대문/병풍 (부당)</label>
                    <input
                      type="number"
                      value={govRates.finishingUnitPrice?.foldGate ?? 30}
                      onChange={e => handleUpdateGovFinishing('foldGate', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block mb-0.5 text-[11px]">포스터재단 (기본)</label>
                    <input
                      type="number"
                      value={govRates.finishingUnitPrice?.cutSingle ?? 15000}
                      onChange={e => handleUpdateGovFinishing('cutSingle', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-right font-bold text-teal-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 코팅, 디지털 출력 & 법정 가산율 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-4">
              <div className="font-black text-slate-800 text-xs pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>4. 코팅, 디지털출력 및 법정 가산율</span>
                <span className="text-[11px] font-normal text-slate-500">라미네이팅 / Direct 출력 / 계약법</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">무광코팅 (원/R)</label>
                  <input
                    type="number"
                    value={govRates.finishingUnitPrice?.matteLami ?? 48000}
                    onChange={e => handleUpdateGovFinishing('matteLami', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">유광코팅 (원/R)</label>
                  <input
                    type="number"
                    value={govRates.finishingUnitPrice?.glossLami ?? 42000}
                    onChange={e => handleUpdateGovFinishing('glossLami', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">디지털 원색 (원/장)</label>
                  <input
                    type="number"
                    value={govRates.digitalUnitPrice?.color ?? 120}
                    onChange={e => handleUpdateGovDigital('color', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-purple-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">디지털 단색 (원/장)</label>
                  <input
                    type="number"
                    value={govRates.digitalUnitPrice?.mono ?? 35}
                    onChange={e => handleUpdateGovDigital('mono', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right text-purple-700"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-700 mb-2">국가계약법 시행규칙 제6조 법정 가산율 기본값</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">일반관리비율 (최대 14%)</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        value={govRates.defaultManageRate ?? 5}
                        onChange={e => handleUpdateGovRates('defaultManageRate', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-right text-teal-800"
                      />
                      <span className="font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">법정이윤율 (최대 25%)</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="25"
                        value={govRates.defaultProfitRate ?? 10}
                        onChange={e => handleUpdateGovRates('defaultProfitRate', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-right text-teal-800"
                      />
                      <span className="font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">낙찰하한율 / 사정율</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.1"
                        value={govRates.defaultContractRate ?? 88}
                        onChange={e => handleUpdateGovRates('defaultContractRate', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-right text-teal-800"
                      />
                      <span className="font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 경인쇄(마스터인쇄) 고시 기준단가 (조달청/공공 표준) */}
            <div className="md:col-span-2 border border-amber-300 rounded-xl p-5 bg-amber-50/40 space-y-5">
              <div className="font-black text-amber-950 text-sm pb-2 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="p-1 bg-amber-600 text-white rounded">
                    <Printer className="w-4 h-4" />
                  </span>
                  <span>5. 경인쇄(마스터인쇄) 조달청 공공 표준 고시 기준단가 설정</span>
                </div>
                <span className="text-[11px] font-normal text-amber-800">
                  50부 기본단가 / 10부 초과단가 / 원고 파일 조판생략 감액 / 표지 매수 가산 기준
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 5-1. 50부까지 기본단가 */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-3">
                  <div className="font-bold text-slate-800 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span>□ 50부 기본단가 (원)</span>
                    <span className="text-[10px] text-slate-500">지종 및 절수별</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { key: '8절_백상지', label: '8절 백상지 (표지/본문)' },
                      { key: '8절_중질지', label: '8절 중질지 (갱지)' },
                      { key: '8절_신문용지', label: '8절 신문용지' },
                      { key: '10절_백상지', label: '10절 백상지' },
                      { key: '16절_백상지', label: '16절 백상지 (A4/B5 본문)' },
                      { key: '16절_중질지', label: '16절 중질지' },
                      { key: '16절_신문용지', label: '16절 신문용지' },
                      { key: '25절_백상지', label: '25절 백상지' },
                      { key: '32절_백상지', label: '32절 백상지' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between gap-2">
                        <label className="text-slate-600 font-medium truncate">{item.label}</label>
                        <div className="w-28 flex items-center space-x-1">
                          <input
                            type="number"
                            value={govRates.lightPrintRates?.base50?.[item.key] ?? 0}
                            onChange={e => handleUpdateGovLightRate('base50', item.key, e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-right font-bold text-amber-900"
                          />
                          <span className="text-slate-400 text-[10px]">원</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5-2. 10부마다 가산단가 & 조판감액 */}
                <div className="space-y-4">
                  {/* 10부마다 초과 가산단가 */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5">
                    <div className="font-bold text-slate-800 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                      <span>□ 10부마다 초과단가 (원)</span>
                      <span className="text-[10px] text-slate-500">50부 초과 시</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {['8절', '10절', '16절', '25절', '32절'].map(cut => (
                        <div key={cut} className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-600">{cut}</span>
                          <div className="w-20 flex items-center space-x-1">
                            <input
                              type="number"
                              value={govRates.lightPrintRates?.extra10?.[cut] ?? 0}
                              onChange={e => handleUpdateGovLightRate('extra10', cut, e.target.value)}
                              className="w-full p-1 border border-slate-300 rounded text-right font-bold text-amber-900 text-xs"
                            />
                            <span className="text-slate-400 text-[10px]">원</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 원고 파일 제공 시 조판생략 감액단가 */}
                  <div className="bg-white p-3.5 rounded-xl border border-rose-200 space-y-2.5">
                    <div className="font-bold text-rose-900 pb-1.5 border-b border-rose-100 flex items-center justify-between">
                      <span>□ 조판생략 감액단가 (면당)</span>
                      <span className="text-[10px] text-rose-600 font-bold">감액(-)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {['8절', '10절', '16절', '25절', '32절'].map(cut => (
                        <div key={cut} className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-600">{cut}</span>
                          <div className="w-20 flex items-center space-x-1">
                            <input
                              type="number"
                              value={govRates.lightPrintRates?.typesetDiscount?.[cut] ?? 0}
                              onChange={e => handleUpdateGovLightRate('typesetDiscount', cut, e.target.value)}
                              className="w-full p-1 border border-rose-300 rounded text-right font-bold text-rose-700 text-xs"
                            />
                            <span className="text-slate-400 text-[10px]">원</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-rose-600 mt-1">
                      ※ 원고(한글/PDF) 제공 시 본문 면수에 곱하여 소계에서 차감됩니다.
                    </p>
                  </div>
                </div>

                {/* 5-3. 표지 배수 가산 기준 */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-3">
                  <div className="font-bold text-slate-800 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span>□ 표지 배수 가산 기준 (매)</span>
                    <span className="text-[10px] text-slate-500">고시 규정 매수</span>
                  </div>
                  <div className="space-y-3 text-[11px]">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold">8절 / 10절 기본매수</label>
                        <div className="w-20 flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            value={govRates.lightPrintRates?.coverSheets?.base8_10 ?? 5}
                            onChange={e => handleUpdateGovLightRate('coverSheets', 'base8_10', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-right font-bold text-amber-900"
                          />
                          <span className="text-slate-400 text-[10px]">매</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">8절/10절 표지의 고시 기본 환산 매수</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold">16절 이하 기본매수</label>
                        <div className="w-20 flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            value={govRates.lightPrintRates?.coverSheets?.base16_32 ?? 3}
                            onChange={e => handleUpdateGovLightRate('coverSheets', 'base16_32', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-right font-bold text-amber-900"
                          />
                          <span className="text-slate-400 text-[10px]">매</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">A4, B5, 16절 이하 표지 고시 기본 매수</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold">아트지/레자크지 가산</label>
                        <div className="w-20 flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            value={govRates.lightPrintRates?.coverSheets?.artPaper ?? 2.5}
                            onChange={e => handleUpdateGovLightRate('coverSheets', 'artPaper', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-right font-bold text-amber-900"
                          />
                          <span className="text-slate-400 text-[10px]">매</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">백상지 외 고급 표지지 사용 시 가산</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold">추가 1도당 가산매수</label>
                        <div className="w-20 flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            value={govRates.lightPrintRates?.coverSheets?.extraColor ?? 2.5}
                            onChange={e => handleUpdateGovLightRate('coverSheets', 'extraColor', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-right font-bold text-amber-900"
                          />
                          <span className="text-slate-400 text-[10px]">매</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">1도 초과 추가 색도당 (2도: +2.5매, 4도: +7.5매)</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold">표지 코팅 가산매수</label>
                        <div className="w-20 flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            value={govRates.lightPrintRates?.coverSheets?.coating ?? 5.0}
                            onChange={e => handleUpdateGovLightRate('coverSheets', 'coating', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-right font-bold text-amber-900"
                          />
                          <span className="text-slate-400 text-[10px]">매</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">라미네이팅 표지 코팅 시 고시 가산 매수</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 탭 2: 용지 마스터 ── */}
      {activeTab === 'paper' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 border-t-0 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">등록된 지종 및 평량별 연당 단가</span>
            <button
              onClick={() => setEditingPaper({ name: '스노우지', type: '스노우', weight: 100, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 50000 })}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 용지 추가</span>
            </button>
          </div>

          {/* 용지 추가/수정 모달 or 폼 */}
          {editingPaper && (
            <form onSubmit={handleSavePaper} className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-sky-900">
                {editingPaper.id ? '용지 정보 수정' : '신규 용지 등록'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">용지명</label>
                  <input
                    type="text"
                    value={editingPaper.name}
                    onChange={e => setEditingPaper({ ...editingPaper, name: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="예: 스노우지"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">분류/지종</label>
                  <input
                    type="text"
                    value={editingPaper.type}
                    onChange={e => setEditingPaper({ ...editingPaper, type: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="예: 스노우"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">평량 (g/m²)</label>
                  <input
                    type="number"
                    value={editingPaper.weight}
                    onChange={e => setEditingPaper({ ...editingPaper, weight: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="100"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">규격명</label>
                  <select
                    value={editingPaper.sizeName}
                    onChange={e => setEditingPaper({ ...editingPaper, sizeName: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="국전지">국전지 (636×939)</option>
                    <option value="4×6전지">4×6전지 (788×1091)</option>
                    <option value="특규격">특규격</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">연당 단가 (원)</label>
                  <input
                    type="number"
                    value={editingPaper.unitPrice}
                    onChange={e => setEditingPaper({ ...editingPaper, unitPrice: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-bold text-sky-700"
                    placeholder="50000"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPaper(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
                >
                  저장
                </button>
              </div>
            </form>
          )}

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-left">용지명</th>
                  <th className="p-2.5 text-left">분류</th>
                  <th className="p-2.5 text-center">평량</th>
                  <th className="p-2.5 text-center">규격</th>
                  <th className="p-2.5 text-right">연당 단가</th>
                  <th className="p-2.5 text-center w-24">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {papers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                    <td className="p-2.5 text-slate-500">{p.type}</td>
                    <td className="p-2.5 text-center font-medium">{p.weight}g</td>
                    <td className="p-2.5 text-center text-slate-600">{p.sizeName}</td>
                    <td className="p-2.5 text-right font-bold text-sky-700">{(p.unitPrice || 0).toLocaleString()}원</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setEditingPaper(p)}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePaper(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 탭 2: 공정 마스터 ── */}
      {activeTab === 'process' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 border-t-0 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">공정 분류별 목록</span>
            <button
              onClick={() => setEditingProcess({ name: '', type: 'FINISHING', category: 'COATING', desc: '' })}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 공정 추가</span>
            </button>
          </div>

          {editingProcess && (
            <form onSubmit={handleSaveProcess} className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-sky-900">
                {editingProcess.id ? '공정 수정' : '신규 공정 등록'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">공정명</label>
                  <input
                    type="text"
                    value={editingProcess.name}
                    onChange={e => setEditingProcess({ ...editingProcess, name: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="예: 무광코팅"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">대분류</label>
                  <select
                    value={editingProcess.type}
                    onChange={e => setEditingProcess({ ...editingProcess, type: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PREPRESS">제판 (PREPRESS)</option>
                    <option value="PRINT">인쇄 (PRINT)</option>
                    <option value="BINDING">제본 (BINDING)</option>
                    <option value="FINISHING">후가공 (FINISHING)</option>
                    <option value="OTHER">기타 (OTHER)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">소분류 코드</label>
                  <input
                    type="text"
                    value={editingProcess.category}
                    onChange={e => setEditingProcess({ ...editingProcess, category: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="CTP, OFFSET 등"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">설명</label>
                  <input
                    type="text"
                    value={editingProcess.desc}
                    onChange={e => setEditingProcess({ ...editingProcess, desc: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="상세 설명"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProcess(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
                >
                  저장
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-left">공정명</th>
                  <th className="p-2.5 text-center">대분류</th>
                  <th className="p-2.5 text-center">소분류</th>
                  <th className="p-2.5 text-left">설명</th>
                  <th className="p-2.5 text-center w-24">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processes.map(pr => (
                  <tr key={pr.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-800">{pr.name}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {pr.type}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-slate-500">{pr.category}</td>
                    <td className="p-2.5 text-slate-600">{pr.desc}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setEditingProcess(pr)}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProcess(pr.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 탭 3: 표준 단가표 설정 ── */}
      {activeTab === 'stdPrice' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 border-t-0 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">CTP 및 주요 후가공 표준 단가표</span>
            <button
              onClick={handleSaveStdPrices}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>표준단가 변경사항 저장</span>
            </button>
          </div>

          {/* CTP 단가 */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">■ CTP 판당 표준 단가</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stdPrices.ctp && Object.entries(stdPrices.ctp).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-slate-700">{val.name}</div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={val.unitPrice}
                      onChange={e => handleUpdateStdCtp(key, 'unitPrice', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-bold text-sky-700"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">원/{val.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 후가공 단가 */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">■ 주요 후가공 표준 단가</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stdPrices.finishing && Object.entries(stdPrices.finishing).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-slate-700">{val.name}</div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={val.unitPrice}
                      onChange={e => handleUpdateFinishing(key, 'unitPrice', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-bold text-sky-700"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">원/{val.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
