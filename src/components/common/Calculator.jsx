// src/components/common/Calculator.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Delete, Calculator, Copy, Check, Move } from 'lucide-react';

export default function CalculatorWidget({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [prevOperator, setPrevOperator] = useState(null);
  const [prevValue, setPrevValue] = useState(null);
  const [justCalculated, setJustCalculated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const dragRef = useRef(null);
  const dragStart = useRef(null);

  const format = (num) => {
    if (num === null || num === undefined) return '0';
    const n = parseFloat(num);
    if (isNaN(n)) return 'Error';
    if (!isFinite(n)) return n > 0 ? '+Inf' : '-Inf';
    // 콤마 포함 포맷
    const parts = n.toFixed(10).replace(/\.?0+$/, '').split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const calculate = useCallback((a, op, b) => {
    const fa = parseFloat(String(a).replace(/,/g, ''));
    const fb = parseFloat(String(b).replace(/,/g, ''));
    if (op === '+') return fa + fb;
    if (op === '-') return fa - fb;
    if (op === '*') return fa * fb;
    if (op === '/') return fb === 0 ? 'Error' : fa / fb;
    if (op === '%') return fa * fb / 100;
    return fb;
  }, []);

  const handleDigit = (digit) => {
    if (justCalculated) {
      setDisplay(digit);
      setExpression(digit);
      setJustCalculated(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      const raw = display.replace(/,/g, '');
      const next = raw === '0' ? digit : raw + digit;
      setDisplay(format(parseFloat(next)));
    }
  };

  const handleDecimal = () => {
    if (justCalculated) { setDisplay('0.'); setJustCalculated(false); return; }
    if (waitingForOperand) { setDisplay('0.'); setWaitingForOperand(false); return; }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const handleOperator = (op) => {
    setJustCalculated(false);
    const current = parseFloat(display.replace(/,/g, ''));
    if (prevOperator && !waitingForOperand) {
      const result = calculate(prevValue, prevOperator, current);
      const resultStr = format(result);
      setDisplay(resultStr);
      setExpression(`${expression} ${op}`);
      setPrevValue(result === 'Error' ? 0 : result);
    } else {
      setExpression(`${format(current)} ${op}`);
      setPrevValue(current);
    }
    setPrevOperator(op);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (!prevOperator) return;
    const current = parseFloat(display.replace(/,/g, ''));
    const result = calculate(prevValue, prevOperator, current);
    const resultStr = format(result);
    const histEntry = `${expression} ${format(current)} = ${resultStr}`;
    setHistory(h => [histEntry, ...h].slice(0, 10));
    setDisplay(resultStr);
    setExpression('');
    setPrevOperator(null);
    setPrevValue(null);
    setWaitingForOperand(false);
    setJustCalculated(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setPrevOperator(null);
    setPrevValue(null);
    setWaitingForOperand(false);
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    if (justCalculated || waitingForOperand) return;
    const raw = display.replace(/,/g, '');
    if (raw.length <= 1 || raw === '0') {
      setDisplay('0');
    } else {
      setDisplay(format(parseFloat(raw.slice(0, -1))));
    }
  };

  const handleToggleSign = () => {
    const raw = parseFloat(display.replace(/,/g, ''));
    setDisplay(format(-raw));
  };

  const handlePercent = () => {
    const raw = parseFloat(display.replace(/,/g, '')) / 100;
    setDisplay(format(raw));
  };

  // 계산 결과값 클립보드 복사
  const handleCopyResult = () => {
    const rawNum = display.replace(/,/g, '');
    navigator.clipboard.writeText(rawNum).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = rawNum;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // 키보드 지원 (폼 입력란에 포커스가 있을 때는 충돌 방지)
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '.') handleDecimal();
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('*');
      else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // 드래그 기능
  const onMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragStart.current.x));
      const newY = Math.max(60, Math.min(window.innerHeight - 380, e.clientY - dragStart.current.y));
      setPosition({ x: newX, y: newY });
    };
    const onUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  const posStyle = position.x !== null
    ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, transform: 'none' }
    : { position: 'fixed', right: '28px', top: '100px' };

  const Btn = ({ label, onClick, variant = 'num', wide = false }) => {
    const base = 'flex items-center justify-center rounded-2xl font-bold text-sm transition active:scale-95 select-none h-11 shadow-sm';
    const variants = {
      num: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
      op: 'bg-blue-500 hover:bg-blue-600 text-white font-black text-base',
      eq: 'bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base shadow-emerald-500/20',
      fn: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold',
      red: 'bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold',
    };
    return (
      <button
        onClick={onClick}
        className={`${base} ${variants[variant]} ${wide ? 'col-span-2' : ''}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      ref={dragRef}
      style={{ ...posStyle, zIndex: 99999 }}
      className="w-72 bg-white rounded-3xl shadow-2xl border border-slate-300/80 overflow-hidden select-none"
    >
      {/* 드래그 가능 상단 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-900 cursor-grab active:cursor-grabbing text-white"
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black tracking-wide">팝업 계산기</span>
        </div>

        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="계산기 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 계산 표현식 및 디스플레이 */}
      <div className="bg-slate-950 px-4 pt-3 pb-3 text-right relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="text-[10px] font-mono text-slate-500">수식 / 히스토리</span>
          <span className="truncate max-w-[170px] font-mono">{expression || '\u00A0'}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          {/* 복사 버튼 */}
          <button
            onClick={handleCopyResult}
            className={`no-drag flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition shadow-sm ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title="계산 결과를 클립보드에 복사하여 폼에 붙여넣기(Ctrl+V)"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-white" />
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-300" />
                <span>복사</span>
              </>
            )}
          </button>

          <div className="text-white text-2xl sm:text-3xl font-black tracking-tight truncate font-mono">
            {display}
          </div>
        </div>
      </div>

      {/* 버튼 그리드 */}
      <div className="p-3 grid grid-cols-4 gap-2 bg-slate-50 border-t border-slate-100">
        <Btn label="AC" onClick={handleClear} variant="fn" />
        <Btn label="+/-" onClick={handleToggleSign} variant="fn" />
        <Btn label="%" onClick={handlePercent} variant="fn" />
        <Btn label="÷" onClick={() => handleOperator('/')} variant="op" />

        <Btn label="7" onClick={() => handleDigit('7')} />
        <Btn label="8" onClick={() => handleDigit('8')} />
        <Btn label="9" onClick={() => handleDigit('9')} />
        <Btn label="×" onClick={() => handleOperator('*')} variant="op" />

        <Btn label="4" onClick={() => handleDigit('4')} />
        <Btn label="5" onClick={() => handleDigit('5')} />
        <Btn label="6" onClick={() => handleDigit('6')} />
        <Btn label="-" onClick={() => handleOperator('-')} variant="op" />

        <Btn label="1" onClick={() => handleDigit('1')} />
        <Btn label="2" onClick={() => handleDigit('2')} />
        <Btn label="3" onClick={() => handleDigit('3')} />
        <Btn label="+" onClick={() => handleOperator('+')} variant="op" />

        <Btn label="0" onClick={() => handleDigit('0')} wide />
        <Btn label="." onClick={handleDecimal} />
        <Btn label="=" onClick={handleEquals} variant="eq" />
      </div>

      {/* 안내 풋터 */}
      <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 select-none">
        <span>💡 상단 바를 잡고 자유롭게 이동</span>
        <span>[복사] 누르고 폼에 붙여넣기</span>
      </div>
    </div>
  );
}
