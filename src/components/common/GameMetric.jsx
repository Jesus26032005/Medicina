import React from 'react';

export default function GameMetric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="break-words text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-bold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}
