// src/components/common/Calculator.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Delete, Calculator } from 'lucide-react';

export default function CalculatorWidget({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [prevOperator, setPrevOperator] = useState(null);
  const [prevValue, setPrevValue] = useState(null);
  const [justCalculated, setJustCalculated] = useState(false);
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
    if (justCalculated || waitingForOperand) { setDisplay('0'); return; }
    const raw = display.replace(/,/g, '');
    const next = raw.length > 1 ? raw.slice(0, -1) : '0';
    setDisplay(next.includes('.') ? next : format(parseFloat(next)));
  };

  const handleToggleSign = () => {
    const raw = parseFloat(display.replace(/,/g, '')) * -1;
    setDisplay(format(raw));
  };

  const handlePercent = () => {
    const raw = parseFloat(display.replace(/,/g, '')) / 100;
    setDisplay(format(raw));
  };

  // 키보드 지원
  useEffect(() => {
    const handler = (e) => {
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

  // 드래그
  const onMouseDown = (e) => {
    setDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    };
    const onUp = () => setDragging(false);
    if (dragging) { window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); }
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  const posStyle = position.x !== null
    ? { position: 'fixed', left: position.x, top: position.y, transform: 'none' }
    : { position: 'fixed', right: '24px', bottom: '80px' };

  const Btn = ({ label, onClick, variant = 'num', wide = false }) => {
    const base = 'flex items-center justify-center rounded-2xl font-bold text-sm transition active:scale-95 select-none h-12';
    const variants = {
      num: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
      op: 'bg-blue-500 hover:bg-blue-600 text-white',
      eq: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      fn: 'bg-slate-200 hover:bg-slate-300 text-slate-700',
      red: 'bg-rose-100 hover:bg-rose-200 text-rose-700',
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
      style={posStyle}
      className="z-[9999] w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden select-none"
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-800 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <Calculator className="w-4 h-4" />
          <span className="text-sm font-bold">계산기</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 계산 표현식 */}
      <div className="bg-slate-900 px-4 pt-2 pb-1 text-right">
        <div className="text-slate-400 text-xs h-4 truncate">{expression || '\u00A0'}</div>
        <div className="text-white text-3xl font-black tracking-tight truncate mt-0.5">{display}</div>
      </div>

      {/* 버튼 그리드 */}
      <div className="p-3 grid grid-cols-4 gap-2 bg-slate-50">
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
        <Btn label="−" onClick={() => handleOperator('-')} variant="op" />

        <Btn label="1" onClick={() => handleDigit('1')} />
        <Btn label="2" onClick={() => handleDigit('2')} />
        <Btn label="3" onClick={() => handleDigit('3')} />
        <Btn label="+" onClick={() => handleOperator('+')} variant="op" />

        <Btn label="⌫" onClick={handleBackspace} variant="red" />
        <Btn label="0" onClick={() => handleDigit('0')} />
        <Btn label="." onClick={handleDecimal} />
        <Btn label="=" onClick={handleEquals} variant="eq" />
      </div>

      {/* 계산 히스토리 */}
      {history.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2 bg-white max-h-28 overflow-y-auto">
          <p className="text-xs text-slate-400 font-bold mb-1">최근 계산</p>
          {history.map((h, i) => (
            <div key={i} className="text-xs text-slate-500 truncate py-0.5">{h}</div>
          ))}
        </div>
      )}
    </div>
  );
}
