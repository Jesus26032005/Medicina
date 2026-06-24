import React from 'react';
import ClinicalEvidenceDisclosure from './ClinicalEvidenceDisclosure';
import MedicalDisclaimer from './MedicalDisclaimer';
import VideoTutorialModal from './VideoTutorialModal';

const BRIEFING_CARD_VARIANTS = {
  critical: 'border-amber-400/40 bg-amber-500/10',
  instructions: 'border-emerald-400/40 bg-emerald-500/10',
  mechanics: 'border-cyan-400/40 bg-cyan-500/10',
  progress: 'border-purple-400/40 bg-purple-500/10',
  score: 'border-red-400/40 bg-red-500/10',
  standard: 'border-slate-700/50 bg-slate-800/50',
};

export function BriefingCard({ children, title, variant = 'standard' }) {
  return (
    <section
      className={`mb-4 rounded-xl border p-4 md:p-6 ${
        BRIEFING_CARD_VARIANTS[variant] ?? BRIEFING_CARD_VARIANTS.standard
      }`}
    >
      <h2 className="font-bold text-white">{title}</h2>
      <div className="mt-2 break-words text-sm leading-6 text-slate-300 md:text-base">
        {children}
      </div>
    </section>
  );
}

export default function GameBriefingLayout({
  children,
  evidenceKey,
  onStart,
  title,
  videoId,
  videoTitle,
}) {
  function handleStartClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (typeof onStart !== 'function') {
      return;
    }

    onStart();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ behavior: 'auto', left: 0, top: 0 });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    });
  }

  return (
    <section className="grid flex-1 place-items-center px-3 py-8 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl md:max-w-2xl md:p-6 lg:max-w-3xl">
        <p className="break-words text-sm font-semibold uppercase tracking-wide text-cyan-400">
          Briefing médico
        </p>
        <h1 className="mb-6 mt-2 break-words text-3xl font-bold text-white md:text-4xl">
          {title}
        </h1>

        {children}

        <MedicalDisclaimer />
        <ClinicalEvidenceDisclosure moduleKey={evidenceKey} />

        <div className="mt-6 flex w-full flex-col justify-center gap-4 md:flex-row md:justify-center">
          <button
            className="w-full rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 md:w-auto"
            onClick={handleStartClick}
            type="button"
          >
            Entendido, iniciar simulación
          </button>
          <VideoTutorialModal
            buttonClassName="w-full rounded-xl border-2 border-slate-600 bg-transparent px-6 py-3 font-bold text-slate-300 transition-all hover:border-blue-500 hover:text-blue-400 md:w-auto"
            title={videoTitle}
            videoId={videoId}
          />
        </div>
      </div>
    </section>
  );
}
