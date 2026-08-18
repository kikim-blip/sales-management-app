// src/components/common/StickyMemoWidget.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import {
  Plus, Trash2, Pin, Palette, Minimize2, Maximize2, X, Move, StickyNote,
  Check, Save, Eye, EyeOff, Sparkles, FolderOpen, AlertCircle
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

          {/* 🗑️ 영구 삭제 버튼 (사용자가 명시적으로 원할 때만 삭제) */}
          <button
            onClick={() => {
              if (window.confirm('정말 이 메모를 완전히 삭제하시겠습니까?\n(작성된 내용은 DB에서도 영구 삭제됩니다)')) {
                onDelete(memo.id);
              }
            }}
            className="p-1 rounded hover:bg-rose-500 hover:text-white text-slate-600 transition"
            title="메모 영구 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
            placeholder="여기에 메모를 입력하세요...&#10;• 입력하는 즉시 클라우드에 자동 저장됩니다.&#10;• 화면을 닫아도 지워지지 않고 보존됩니다."
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

  // 본인의 메모만 필터링 (D1 영구 보존 데이터)
  const myMemos = memos.filter(m => {
    if (!m.user_email) return true;
    if (!userEmail) return true;
    return m.user_email.toLowerCase().trim() === userEmail;
  });

  const [topZIndex, setTopZIndex] = useState(9000);
  const [memoZIndexes, setMemoZIndexes] = useState({});
  const [showManagerModal, setShowManagerModal] = useState(false);

  const bringToFront = (id) => {
    setTopZIndex(z => {
      const nextZ = z + 1;
      setMemoZIndexes(prev => ({ ...prev, [id]: nextZ }));
      return nextZ;
    });
  };

  const handleAddNewMemo = (color = 'yellow') => {
    const randomOffset = (myMemos.length * 30) % 180;
    addMemo({
      user_email: userEmail,
      content: '',
      color: color,
      pos_x: Math.min(window.innerWidth - 300, 120 + randomOffset),
      pos_y: Math.min(window.innerHeight - 350, 140 + randomOffset),
      is_pinned: false,
    });
  };

  return (
    <>
      {/* 화면에 포스트잇이 하나도 없을 때 생성 안내 패널 */}
      {myMemos.length === 0 && (
        <div
          style={{ position: 'fixed', right: '24px', bottom: '140px', zIndex: 9000 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-amber-200 w-80 text-center select-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 font-bold shadow-sm">
            <StickyNote className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-800">포스트잇 메모</h4>
          <p className="text-xs text-slate-500 mt-1.5 mb-4 leading-relaxed">
            작성한 모든 메모는 <strong>클라우드 DB에 영구 자동 저장</strong>됩니다.<br />
            창을 닫거나 새로고침해도 그대로 유지됩니다.
          </p>
          <button
            onClick={() => handleAddNewMemo('yellow')}
            className="w-full flex items-center justify-center space-x-1.5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>새 포스트잇 만들기</span>
          </button>
        </div>
      )}

      {/* 포스트잇 목록 렌더링 */}
      {myMemos.map((memo) => (
        <SingleStickyNote
          key={memo.id}
          memo={memo}
          onUpdate={updateMemo}
          onDelete={deleteMemo}
          onBringToFront={bringToFront}
          zIndex={memoZIndexes[memo.id] || 9000}
        />
      ))}

      {/* 우측 하단 컨트롤 플로팅 바 (새 메모 생성, 목록 관리함, 화면 숨기기) */}
      <div
        style={{ position: 'fixed', right: '24px', bottom: '80px', zIndex: 9998 }}
        className="flex items-center space-x-2 bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-2xl border border-slate-700 select-none"
      >
        <button
          onClick={() => setShowManagerModal(true)}
          className="text-xs font-black flex items-center space-x-1.5 text-amber-300 hover:text-amber-200 transition py-1 px-1.5 rounded-xl hover:bg-slate-800"
          title="저장된 전체 메모 목록 관리함 열기"
        >
          <FolderOpen className="w-4 h-4" />
          <span>메모함 ({myMemos.length}개)</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5"></div>

        {/* 색상별 빠른 추가 버튼 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleAddNewMemo('yellow')}
            className="w-6 h-6 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 flex items-center justify-center font-bold transition active:scale-90"
            title="노란 메모 추가"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAddNewMemo('pink')}
            className="w-6 h-6 rounded-lg bg-rose-400 hover:bg-rose-300 text-rose-950 flex items-center justify-center font-bold transition active:scale-90"
            title="분홍 메모 추가"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAddNewMemo('green')}
            className="w-6 h-6 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex items-center justify-center font-bold transition active:scale-90"
            title="연두 메모 추가"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700 mx-0.5"></div>

        {/* 화면에서 메모 숨기기 (영구 삭제 아님!) */}
        <button
          onClick={onClose}
          className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
          title="화면에서 메모 숨기기 (상단 [📝 메모] 버튼으로 언제든 다시 열기)"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>화면 숨기기</span>
        </button>
      </div>

      {/* 📁 저장된 메모 관리함 모달 */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">보관된 포스트잇 메모함</h3>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  총 {myMemos.length}개
                </span>
              </div>
              <button
                onClick={() => setShowManagerModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {myMemos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <StickyNote className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">저장된 메모가 없습니다.</p>
                </div>
              ) : (
                myMemos.map((m) => {
                  const mTheme = MEMO_COLORS[m.color] || MEMO_COLORS.yellow;
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border ${mTheme.border} ${mTheme.bg} flex items-start justify-between gap-3 shadow-sm`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${mTheme.dot}`}></span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {m.updated_at || m.created_at || '최근 저장'}
                          </span>
                          {m.is_pinned && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md">
                              📌 고정
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-medium whitespace-pre-wrap line-clamp-3 ${mTheme.text}`}>
                          {m.content || '(빈 메모)'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm('이 메모를 완전히 삭제하시겠습니까?')) {
                            deleteMemo(m.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 transition flex-shrink-0"
                        title="메모 영구 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  handleAddNewMemo('yellow');
                  setShowManagerModal(false);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                <span>새 메모 작성</span>
              </button>
              <button
                onClick={() => setShowManagerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
