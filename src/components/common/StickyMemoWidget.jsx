// src/components/common/StickyMemoWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import {
  Plus, Trash2, Pin, Palette, Minimize2, Maximize2, X, Move, StickyNote,
  Check, Save, Eye, EyeOff, Sparkles, FolderOpen, AlertCircle, RotateCcw,
  Layers, ExternalLink
} from 'lucide-react';

const MEMO_COLORS = {
  yellow: {
    bg: 'bg-amber-100',
    header: 'bg-amber-200/90 border-amber-300',
    border: 'border-amber-300',
    text: 'text-amber-950',
    textarea: 'bg-amber-100/70 focus:bg-amber-50',
    shadow: 'shadow-amber-900/10',
    badge: 'bg-amber-300 text-amber-900',
    dot: 'bg-amber-400',
  },
  pink: {
    bg: 'bg-rose-100',
    header: 'bg-rose-200/90 border-rose-300',
    border: 'border-rose-300',
    text: 'text-rose-950',
    textarea: 'bg-rose-100/70 focus:bg-rose-50',
    shadow: 'shadow-rose-900/10',
    badge: 'bg-rose-300 text-rose-900',
    dot: 'bg-rose-400',
  },
  green: {
    bg: 'bg-emerald-100',
    header: 'bg-emerald-200/90 border-emerald-300',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    textarea: 'bg-emerald-100/70 focus:bg-emerald-50',
    shadow: 'shadow-emerald-900/10',
    badge: 'bg-emerald-300 text-emerald-900',
    dot: 'bg-emerald-400',
  },
  blue: {
    bg: 'bg-sky-100',
    header: 'bg-sky-200/90 border-sky-300',
    border: 'border-sky-300',
    text: 'text-sky-950',
    textarea: 'bg-sky-100/70 focus:bg-sky-50',
    shadow: 'shadow-sky-900/10',
    badge: 'bg-sky-300 text-sky-900',
    dot: 'bg-sky-400',
  },
  orange: {
    bg: 'bg-orange-100',
    header: 'bg-orange-200/90 border-orange-300',
    border: 'border-orange-300',
    text: 'text-orange-950',
    textarea: 'bg-orange-100/70 focus:bg-orange-50',
    shadow: 'shadow-orange-900/10',
    badge: 'bg-orange-300 text-orange-900',
    dot: 'bg-orange-400',
  },
};

const COLOR_KEYS = ['yellow', 'pink', 'green', 'blue', 'orange'];

function SingleStickyNote({ memo, onUpdate, onDelete, onBringToFront, zIndex }) {
  const [content, setContent] = useState(memo.content || '');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'typing' | 'saving' | 'saved'
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({
    x: memo.pos_x || 100,
    y: memo.pos_y || 150,
  });

  const cardRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const saveTimeoutRef = useRef(null);

  const theme = MEMO_COLORS[memo.color] || MEMO_COLORS.yellow;

  // 외부에서 memo.content가 변경되었을 때(동기화) state 업데이트
  useEffect(() => {
    if (memo.content !== undefined && memo.content !== content && saveStatus === 'saved') {
      setContent(memo.content);
    }
  }, [memo.content]);

  // 실시간 디바운스 자동 영구 저장
  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('typing');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      await onUpdate(memo.id, { content: val });
      setSaveStatus('saved');
    }, 500);
  };

  const handleBlur = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    await onUpdate(memo.id, { content });
    setSaveStatus('saved');
  };

  // 드래그 시작
  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    onBringToFront(memo.id);
    setDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  // 드래그 이동 및 종료 시 위치 영구 저장
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 240, dragStartRef.current.posX + dx));
      const newY = Math.max(60, Math.min(window.innerHeight - 100, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
        onUpdate(memo.id, { pos_x: position.x, pos_y: position.y });
      }
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, memo.id, onUpdate, position.x, position.y]);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: memo.is_pinned ? 9999 : zIndex,
      }}
      className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-xl ${theme.shadow} transition-shadow select-none flex flex-col ${
        isMinimized ? 'w-56 h-10' : 'w-64 sm:w-72 h-72'
      }`}
      onMouseDown={() => onBringToFront(memo.id)}
    >
      {/* 포스트잇 상단 헤더 / 드래그 핸들 */}
      <div
        onMouseDown={handleMouseDown}
        className={`px-3 py-2 border-b ${theme.header} flex items-center justify-between cursor-grab active:cursor-grabbing`}
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          <StickyNote className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
          <span className={`text-xs font-black truncate ${theme.text}`}>
            {content.trim() ? content.trim().split('\n')[0].slice(0, 12) : '새 메모'}
          </span>
        </div>

        <div className="flex items-center space-x-1 no-drag">
          {/* 저장 상태 표시 */}
          <span className="text-[10px] text-slate-500 font-medium mr-1 flex items-center gap-0.5">
            {saveStatus === 'saving' && <span className="text-blue-600 animate-pulse">저장중...</span>}
            {saveStatus === 'saved' && <span className="text-emerald-700 font-bold">✓ 저장됨</span>}
          </span>

          {/* 색상 선택기 토글 */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(v => !v)}
              className="p-1 rounded hover:bg-black/10 transition"
              title="포스트잇 색상 변경"
            >
              <Palette className="w-3.5 h-3.5 text-slate-700" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-6 bg-white/95 backdrop-blur-md rounded-xl p-1.5 shadow-xl border border-slate-200 flex gap-1 z-50">
                {COLOR_KEYS.map(ck => (
                  <button
                    key={ck}
                    onClick={() => {
                      onUpdate(memo.id, { color: ck });
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full border border-black/20 ${MEMO_COLORS[ck].bg} hover:scale-110 transition flex items-center justify-center`}
                  >
                    {memo.color === ck && <Check className="w-3 h-3 text-slate-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 상단 핀 고정 */}
          <button
            onClick={() => onUpdate(memo.id, { is_pinned: !memo.is_pinned })}
            className={`p-1 rounded hover:bg-black/10 transition ${memo.is_pinned ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
            title={memo.is_pinned ? '상단 고정 해제' : '상단 고정'}
          >
            <Pin className={`w-3.5 h-3.5 ${memo.is_pinned ? 'fill-blue-600 text-blue-600' : ''}`} />
          </button>

          {/* 접기 / 펼치기 */}
          <button
            onClick={() => setIsMinimized(v => !v)}
            className="p-1 rounded hover:bg-black/10 text-slate-700 transition"
            title={isMinimized ? '펼치기' : '접기 (최소화)'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* ❌ 닫기 버튼: 화면에서 닫기 (메모함에 영구 보관되며 언제든 다시 열기 가능!) */}
          <button
            onClick={() => onUpdate(memo.id, { is_closed: true })}
            className="p-1 rounded hover:bg-black/15 text-slate-600 hover:text-slate-900 transition"
            title="화면에서 닫기 (메모함에 안전하게 저장되며 언제든 다시 열 수 있습니다)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 본문 텍스트 영역 */}
      {!isMinimized && (
        <div className="flex-1 p-3 flex flex-col no-drag">
          <textarea
            value={content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            placeholder="여기에 메모를 입력하세요...&#10;• 작성 즉시 클라우드에 자동 저장됩니다.&#10;• 우측 [X]를 눌러 닫아도 메모함에 안전하게 보관됩니다."
            className={`w-full flex-1 resize-none rounded-xl p-2.5 text-sm leading-relaxed outline-none transition border-none font-medium ${theme.text} ${theme.textarea}`}
          />
          <div className="flex items-center justify-between pt-1.5 px-1 text-[10px] text-slate-500 font-mono">
            <span>{(memo.updated_at || memo.created_at || '').slice(0, 16)}</span>
            <span>{content.length} 자</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StickyMemoWidget({ onClose }) {
  const { memos = [], addMemo, updateMemo, deleteMemo } = useData();
  const { user } = useGoogleAuth();

  const userEmail = user?.email?.toLowerCase().trim() || '';

  // 본인의 전체 메모 목록 (D1 영구 보존)
  const myAllMemos = memos.filter(m => {
    if (!m.user_email) return true;
    if (!userEmail) return true;
    return m.user_email.toLowerCase().trim() === userEmail;
  });

  // 현재 화면에 열려있는 메모 (is_closed !== true)
  const activeMemos = myAllMemos.filter(m => !m.is_closed);
  const closedMemos = myAllMemos.filter(m => !!m.is_closed);

  const [topZIndex, setTopZIndex] = useState(9000);
  const [memoZIndexes, setMemoZIndexes] = useState({});
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerTab, setManagerTab] = useState('all'); // 'all' | 'active' | 'closed'

  const bringToFront = (id) => {
    setTopZIndex(z => {
      const nextZ = z + 1;
      setMemoZIndexes(prev => ({ ...prev, [id]: nextZ }));
      return nextZ;
    });
  };

  const handleAddNewMemo = (color = 'yellow') => {
    const randomOffset = (activeMemos.length * 30) % 180;
    addMemo({
      user_email: userEmail,
      content: '',
      color: color,
      pos_x: Math.min(window.innerWidth - 300, 120 + randomOffset),
      pos_y: Math.min(window.innerHeight - 350, 140 + randomOffset),
      is_pinned: false,
      is_closed: false,
    });
  };

  const handleReopenMemo = (memoId) => {
    updateMemo(memoId, { is_closed: false });
  };

  const handleReopenAll = () => {
    closedMemos.forEach(m => updateMemo(m.id, { is_closed: false }));
  };

  const handleCloseAll = () => {
    activeMemos.forEach(m => updateMemo(m.id, { is_closed: true }));
  };

  const filteredManagerMemos = myAllMemos.filter(m => {
    if (managerTab === 'active') return !m.is_closed;
    if (managerTab === 'closed') return !!m.is_closed;
    return true;
  });

  return (
    <>
      {/* 화면에 열려있는 포스트잇 렌더링 */}
      {activeMemos.map((memo) => (
        <SingleStickyNote
          key={memo.id}
          memo={memo}
          onUpdate={updateMemo}
          onDelete={deleteMemo}
          onBringToFront={bringToFront}
          zIndex={memoZIndexes[memo.id] || 9000}
        />
      ))}

      {/* 우측 하단 컨트롤 플로팅 바 (2줄 컴팩트 레이아웃) */}
      <div
        style={{ position: 'fixed', right: '20px', bottom: '75px', zIndex: 9998 }}
        className="flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-2xl shadow-2xl border border-slate-700 select-none min-w-[210px]"
      >
        {/* 1줄: 메모함 열기 + 색상별 새 메모 추가 버튼 */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowManagerModal(true)}
            className="text-xs font-black flex items-center space-x-1.5 text-amber-300 hover:text-amber-200 transition py-1 px-2 rounded-xl hover:bg-slate-800"
            title="저장된 전체 메모 목록 관리함 열기"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>메모함 ({activeMemos.length}/{myAllMemos.length})</span>
          </button>

          {/* 색상별 빠른 추가 버튼 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleAddNewMemo('yellow')}
              className="w-5 h-5 rounded-md bg-amber-400 hover:bg-amber-300 text-amber-950 flex items-center justify-center font-bold transition active:scale-90"
              title="노란 메모 추가"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAddNewMemo('pink')}
              className="w-5 h-5 rounded-md bg-rose-400 hover:bg-rose-300 text-rose-950 flex items-center justify-center font-bold transition active:scale-90"
              title="분홍 메모 추가"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAddNewMemo('green')}
              className="w-5 h-5 rounded-md bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex items-center justify-center font-bold transition active:scale-90"
              title="연두 메모 추가"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2줄: 전체 숨기기 버튼 */}
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center space-x-1 py-1 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
          title="화면에서 메모 위젯 숨기기 (상단 [📝 메모] 버튼으로 언제든 다시 열기)"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>전체 숨기기</span>
        </button>
      </div>

      {/* 📁 저장된 메모 관리함 모달 */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* 상단 헤더 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">포스트잇 메모함</h3>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  총 {myAllMemos.length}개 보관중
                </span>
              </div>
              <button
                onClick={() => setShowManagerModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 필터 탭 & 일괄 조작 버튼 */}
            <div className="px-6 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-2 text-xs">
              <div className="flex bg-slate-100 p-1 rounded-xl font-bold space-x-1">
                <button
                  onClick={() => setManagerTab('all')}
                  className={`px-3 py-1 rounded-lg transition ${managerTab === 'all' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  전체 ({myAllMemos.length})
                </button>
                <button
                  onClick={() => setManagerTab('active')}
                  className={`px-3 py-1 rounded-lg transition ${managerTab === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  화면에 열림 ({activeMemos.length})
                </button>
                <button
                  onClick={() => setManagerTab('closed')}
                  className={`px-3 py-1 rounded-lg transition ${managerTab === 'closed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  닫힘/보관 ({closedMemos.length})
                </button>
              </div>

              <div className="flex items-center space-x-1.5">
                {closedMemos.length > 0 && (
                  <button
                    onClick={handleReopenAll}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition"
                    title="닫힌 메모 전체 화면에 띄우기"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>전체 열기</span>
                  </button>
                )}
                {activeMemos.length > 0 && (
                  <button
                    onClick={handleCloseAll}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                    title="화면의 메모 전체 닫기 (메모함에 보관)"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>전체 닫기</span>
                  </button>
                )}
              </div>
            </div>

            {/* 메모 목록 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredManagerMemos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <StickyNote className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">해당 상태의 메모가 없습니다.</p>
                </div>
              ) : (
                filteredManagerMemos.map((m) => {
                  const mTheme = MEMO_COLORS[m.color] || MEMO_COLORS.yellow;
                  const isClosed = !!m.is_closed;

                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border ${mTheme.border} ${mTheme.bg} flex items-start justify-between gap-3 shadow-sm transition hover:shadow-md`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`w-2.5 h-2.5 rounded-full ${mTheme.dot}`}></span>
                          
                          {isClosed ? (
                            <span className="text-[10px] font-bold text-slate-600 bg-black/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <FolderOpen className="w-3 h-3" /> 닫힘 (보관중)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Eye className="w-3 h-3" /> 화면에 표시중
                            </span>
                          )}

                          {m.is_pinned && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-200/80 px-1.5 py-0.5 rounded-md">
                              📌 고정
                            </span>
                          )}

                          <span className="text-[11px] font-mono text-slate-500 ml-auto">
                            {m.updated_at || m.created_at || '최근 저장'}
                          </span>
                        </div>

                        <p className={`text-sm font-medium whitespace-pre-wrap line-clamp-3 ${mTheme.text}`}>
                          {m.content?.trim() || '(내용 없음)'}
                        </p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {isClosed ? (
                          <button
                            onClick={() => handleReopenMemo(m.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-sm transition"
                            title="화면에 다시 띄우기"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>다시 열기</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => updateMemo(m.id, { is_closed: true })}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition"
                            title="화면에서 닫기"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>닫기</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm('정말 이 메모를 완전히 삭제하시겠습니까?\n(작성된 내용은 복구되지 않습니다)')) {
                              deleteMemo(m.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-100 transition"
                          title="메모 영구 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 하단 바 */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  handleAddNewMemo('yellow');
                  setShowManagerModal(false);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>새 포스트잇 만들기</span>
              </button>
              <button
                onClick={() => setShowManagerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
