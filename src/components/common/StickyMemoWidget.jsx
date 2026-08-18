// src/components/common/StickyMemoWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import {
  Plus, Trash2, Pin, Palette, Minimize2, Maximize2, X, Move, StickyNote,
  Check, Calendar, Clock
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
  },
  pink: {
    bg: 'bg-rose-100',
    header: 'bg-rose-200/90 border-rose-300',
    border: 'border-rose-300',
    text: 'text-rose-950',
    textarea: 'bg-rose-100/70 focus:bg-rose-50',
    shadow: 'shadow-rose-900/10',
    badge: 'bg-rose-300 text-rose-900',
  },
  green: {
    bg: 'bg-emerald-100',
    header: 'bg-emerald-200/90 border-emerald-300',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    textarea: 'bg-emerald-100/70 focus:bg-emerald-50',
    shadow: 'shadow-emerald-900/10',
    badge: 'bg-emerald-300 text-emerald-900',
  },
  blue: {
    bg: 'bg-sky-100',
    header: 'bg-sky-200/90 border-sky-300',
    border: 'border-sky-300',
    text: 'text-sky-950',
    textarea: 'bg-sky-100/70 focus:bg-sky-50',
    shadow: 'shadow-sky-900/10',
    badge: 'bg-sky-300 text-sky-900',
  },
  orange: {
    bg: 'bg-orange-100',
    header: 'bg-orange-200/90 border-orange-300',
    border: 'border-orange-300',
    text: 'text-orange-950',
    textarea: 'bg-orange-100/70 focus:bg-orange-50',
    shadow: 'shadow-orange-900/10',
    badge: 'bg-orange-300 text-orange-900',
  },
};

const COLOR_KEYS = ['yellow', 'pink', 'green', 'blue', 'orange'];

function SingleStickyNote({ memo, onUpdate, onDelete, onBringToFront, zIndex }) {
  const [content, setContent] = useState(memo.content || '');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({
    x: memo.pos_x || 100,
    y: memo.pos_y || 150,
  });

  const cardRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const saveTimeoutRef = useRef(null);

  const theme = MEMO_COLORS[memo.color] || MEMO_COLORS.yellow;

  // 디바운스 자동 저장
  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(memo.id, { content: val });
    }, 600);
  };

  const handleBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    onUpdate(memo.id, { content });
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

  // 드래그 중 및 종료
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
      className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-xl ${theme.shadow} transition-shadow overflow-hidden select-none flex flex-col ${
        isMinimized ? 'w-56 h-10' : 'w-64 sm:w-72 h-72'
      }`}
      onMouseDown={() => onBringToFront(memo.id)}
    >
      {/* 포스트잇 상단 헤더 / 드래그 바 */}
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
          {/* 색상 선택기 토글 */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(v => !v)}
              className="p-1 rounded hover:bg-black/10 transition"
              title="색상 변경"
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
            title={isMinimized ? '펼치기' : '접기'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* 삭제 */}
          <button
            onClick={() => {
              if (window.confirm('이 포스트잇 메모를 삭제하시겠습니까?')) {
                onDelete(memo.id);
              }
            }}
            className="p-1 rounded hover:bg-rose-500 hover:text-white text-slate-600 transition"
            title="삭제"
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
            placeholder="여기에 메모를 입력하세요...&#10;• 할 일 목록&#10;• 전화번호 및 메모"
            className={`w-full flex-1 resize-none rounded-xl p-2.5 text-sm leading-relaxed outline-none transition border-none font-medium ${theme.text} ${theme.textarea}`}
          />
          <div className="flex items-center justify-between pt-1.5 px-1 text-[10px] text-slate-500 font-mono">
            <span>{(memo.updated_at || '').slice(0, 16)}</span>
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

  // 본인의 메모만 필터링 (비로그인 시 전체 또는 이메일 일치)
  const myMemos = memos.filter(m => {
    if (!m.user_email) return true;
    if (!userEmail) return true;
    return m.user_email.toLowerCase().trim() === userEmail;
  });

  const [topZIndex, setTopZIndex] = useState(9000);
  const [memoZIndexes, setMemoZIndexes] = useState({});

  const bringToFront = (id) => {
    setTopZIndex(z => {
      const nextZ = z + 1;
      setMemoZIndexes(prev => ({ ...prev, [id]: nextZ }));
      return nextZ;
    });
  };

  const handleAddNewMemo = (color = 'yellow') => {
    const randomOffset = (myMemos.length * 25) % 150;
    addMemo({
      user_email: userEmail,
      content: '',
      color: color,
      pos_x: Math.min(window.innerWidth - 300, 100 + randomOffset),
      pos_y: Math.min(window.innerHeight - 350, 120 + randomOffset),
      is_pinned: false,
    });
  };

  return (
    <>
      {/* 화면에 포스트잇이 하나도 없을 때 안내 패널 플로팅 버튼 */}
      {myMemos.length === 0 && (
        <div
          style={{ position: 'fixed', right: '24px', bottom: '140px', zIndex: 9000 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-amber-200 w-72 text-center select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 font-bold">
            <StickyNote className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-black text-slate-800">포스트잇 메모</h4>
          <p className="text-xs text-slate-500 mt-1 mb-3">
            화면에 자유롭게 붙여두고 사용할 수 있는 스티키 메모입니다.
          </p>
          <button
            onClick={() => handleAddNewMemo('yellow')}
            className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>첫 포스트잇 만들기</span>
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

      {/* 우측 하단 컨트롤 플로팅 바 (새 메모 생성 & 닫기) */}
      <div
        style={{ position: 'fixed', right: '24px', bottom: '80px', zIndex: 9998 }}
        className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md text-white p-1.5 rounded-2xl shadow-2xl border border-slate-700"
      >
        <span className="text-xs font-black px-2 flex items-center space-x-1 text-amber-300">
          <StickyNote className="w-3.5 h-3.5" />
          <span>메모 ({myMemos.length})</span>
        </span>

        {/* 색상별 빠른 추가 버튼 */}
        <button
          onClick={() => handleAddNewMemo('yellow')}
          className="w-7 h-7 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 flex items-center justify-center font-bold transition active:scale-90"
          title="노란 포스트잇 추가"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleAddNewMemo('pink')}
          className="w-7 h-7 rounded-xl bg-rose-400 hover:bg-rose-300 text-rose-950 flex items-center justify-center font-bold transition active:scale-90"
          title="분홍 포스트잇 추가"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleAddNewMemo('green')}
          className="w-7 h-7 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex items-center justify-center font-bold transition active:scale-90"
          title="연두 포스트잇 추가"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
          title="메모 위젯 숨기기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
