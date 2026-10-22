// src/pages/printEstimate/MasterManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RotateCcw, Save, Check, FileSpreadsheet, Layers, Sliders } from 'lucide-react';
import {
  getMasterPapers, saveMasterPaper, deleteMasterPaper,
  getMasterProcesses, saveMasterProcess, deleteMasterProcess,
  getMasterStdPrices, saveMasterStdPrices, resetMasterDataToDefaults,
} from '../../services/printEstimateStorage';

export default function MasterManagementPage() {
  const [activeTab, setActiveTab] = useState('paper'); // 'paper' | 'process' | 'stdPrice'

  // States
  const [papers, setPapers] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [stdPrices, setStdPrices] = useState({});
  const [editingPaper, setEditingPaper] = useState(null);
  const [editingProcess, setEditingProcess] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load masters
  const loadAll = () => {
    setPapers(getMasterPapers());
    setProcesses(getMasterProcesses());
    setStdPrices(getMasterStdPrices());
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
            <Sliders className="w-5 h-5 text-sky-600" />
            <span>인쇄 단가 & 마스터 데이터 관리</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            용지 규격별 연당단가, 공정 분류, CTP/인쇄/제본/후가공 표준단가를 경성문화사 기준에 맞춰 자유롭게 수정합니다.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>저장 완료!</span>
            </span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 표준단가로 초기화</span>
          </button>
        </div>
      </div>

      {/* 서브 탭 */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 space-x-2 shadow-sm">
        <button
          onClick={() => setActiveTab('paper')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'paper'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. 용지 마스터 ({papers.length})</span>
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
          <span>2. 공정 마스터 ({processes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stdPrice')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'stdPrice'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. 표준 단가표 설정</span>
        </button>
      </div>

      {/* ── 탭 1: 용지 마스터 ── */}
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
