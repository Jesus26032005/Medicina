import React from 'react';
import { BookOpen, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function ResultMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
      <p className="break-words text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function GameResultsModal({
  children,
  metrics,
  onExit,
  onRestart,
  restartLabel,
  saveError,
  saveState,
  score,
  title,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm md:p-6">
      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="isolate max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl md:max-w-2xl md:p-6 lg:max-w-3xl"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
              <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0" />
              Retroalimentación clínica
            </p>
            <h2 className="mt-1 break-words text-2xl font-bold md:text-3xl">{title}</h2>
          </div>
          {score !== undefined ? (
            <div className="w-full rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 md:w-auto md:min-w-32 md:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                Puntuación
              </p>
              <p className="text-3xl font-bold text-white">{score}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {metrics.map((metric) => (
            <ResultMetric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>

        {children}

        <div className="mt-4 flex items-start gap-2 break-words text-sm text-slate-300">
          <Save aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {saveState === 'saving' ? 'Guardando tu progreso...' : null}
            {saveState === 'saved' ? 'Progreso guardado en tu expediente.' : null}
            {saveState === 'error'
              ? `No se pudo registrar el progreso: ${saveError}`
              : null}
          </span>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-4 md:flex-row md:justify-end">
          <button
            className="w-full rounded-xl border border-slate-600 bg-transparent px-6 py-3 font-bold text-slate-300 transition-all hover:bg-slate-800 md:w-auto"
            onClick={onExit}
            type="button"
          >
            Salir al Dashboard
          </button>
          <button
            className="w-full rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-500 md:w-auto"
            onClick={onRestart}
            type="button"
          >
            {restartLabel}
          </button>
        </div>
      </motion.section>
    </div>
  );
}
