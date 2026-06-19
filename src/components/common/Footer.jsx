import React from 'react';
import { ShieldCheck } from 'lucide-react';

const LAST_MEDICAL_REVIEW = 'junio 2026';

export { LAST_MEDICAL_REVIEW };

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-xs leading-5 md:flex-row md:items-center md:justify-between">
        <p>
          <span className="font-bold text-slate-950 dark:text-white">Aviso Legal:</span>{' '}
          LifeSaver Arcade es una herramienta exclusivamente educativa y de
          simulacion. No constituye orientacion clinica, diagnostico ni
          reemplaza el criterio de un profesional de la salud. En caso de una
          emergencia real, comuniquese inmediatamente a los servicios de
          emergencia de su localidad (Ej. 911).
        </p>
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Ultima revision medica clinica: {LAST_MEDICAL_REVIEW}
        </div>
      </div>
    </footer>
  );
}
