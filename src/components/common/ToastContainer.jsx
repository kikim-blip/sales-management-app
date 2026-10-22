// src/components/common/ToastContainer.jsx
import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/40 text-white'
                : isError
                ? 'bg-rose-950/95 border-rose-500/50 text-white'
                : isWarning
                ? 'bg-amber-950/95 border-amber-500/50 text-white'
                : 'bg-slate-900/95 border-sky-500/40 text-white'
            }`}
          >
            <div className="flex-shrink-0 pt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-semibold leading-relaxed break-keep">
                {t.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss && onDismiss(t.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
