import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const REQUIRED_HITS = 5;

const cases = [
  {
    id: 'adult_food_standard',
    title: 'Adulto atragantado con comida',
    description: 'La persona esta despierta, pero no puede hablar, toser ni respirar bien.',
    targetLabel: 'Compresion Abdominal (Boca del estomago)',
    greenMin: 38,
    greenMax: 62,
    force: 'estandar',
    criticalWrong: 'Error: apunta a la boca del estomago. La presion ahi ayuda a que el aire empuje el objeto como un corcho.',
  },
  {
    id: 'pregnant_or_obese',
    title: 'Mujer embarazada u obeso',
    description: 'Aqui no conviene apretar el abdomen: puede ser inseguro o no servir.',
    targetLabel: 'Compresion Toracica (Pecho)',
    greenMin: 66,
    greenMax: 90,
    force: 'toracica',
    criticalWrong: 'Error critico: en embarazo u obesidad se presiona el pecho, no el abdomen.',
  },
  {
    id: 'small_child',
    title: 'Nino pequeno',
    description: 'En un nino se usa menos fuerza, pero la zona correcta sigue importando mucho.',
    targetLabel: 'Compresion Abdominal (Boca del estomago)',
    greenMin: 36,
    greenMax: 62,
    force: 'reducida',
    criticalWrong: 'Error: usa menos fuerza y apunta a la boca del estomago; fuera de ahi puedes lastimar y no ayudar.',
  },
];

const notes = [
  'Si alguien se atraganta y no puede hablar ni toser, llama a emergencias y actua rapido.',
  'La idea es crear un empujon de aire desde dentro para sacar el objeto, como cuando salta un corcho.',
  'En embarazo u obesidad se presiona el pecho porque el abdomen no es una zona segura.',
  'En ninos la fuerza debe ser menor: ayudar no significa empujar con todo.',
  'Si la persona se desmaya, la situacion cambia: hay que activar emergencias de inmediato.',
];

function pickCase() {
  return cases[Math.floor(Math.random() * cases.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function scoreHit(positionPercent, caseData) {
  const center = (caseData.greenMin + caseData.greenMax) / 2;
  const distance = Math.abs(positionPercent - center);
  return Math.round(clamp(100 - distance * 3.2, 0, 100));
}

function getAverage(items) {
  return items.length
    ? Math.round(items.reduce((sum, sample) => sum + sample.precision, 0) / items.length)
    : 0;
}

function calculateNormalizedScore(initialPrecision, finalPrecision, errorsCount) {
  const improvementBonus = Math.max(0, finalPrecision - initialPrecision) * 0.5;
  return Math.round(clamp(finalPrecision - errorsCount * 2 + improvementBonus, 0, 100));
}

export default function ChokingExpress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(() => pickCase());
  const [showBriefing, setShowBriefing] = useState(true);
  const [hits, setHits] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [lastPrecision, setLastPrecision] = useState(0);
  const [lastSuccess, setLastSuccess] = useState(false);
  const [feedback, setFeedback] = useState('Sincroniza el indicador con la zona verde.');
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const indicatorRef = useRef(null);
  const targetRef = useRef(null);
  const trackRef = useRef(null);
  const samplesRef = useRef([]);
  const startTimeRef = useRef(Date.now());

  const persistSession = useCallback(
    async (nextResults) => {
      if (!supabase || !user?.id) {
        setSaveState('error');
        setSaveError('No se pudo guardar: falta sesion activa o Supabase.');
        return;
      }

      setSaveState('saving');
      setSaveError('');

      const { error } = await supabase.from('game_sessions').insert({
        user_id: user.id,
        game_key: 'choking_express',
        initial_precision: nextResults.initialPrecision,
        final_precision: nextResults.finalPrecision,
        completion_time_seconds: nextResults.completionTimeSeconds,
        errors_count: nextResults.errorsCount,
        score: nextResults.score,
        telemetry: {
          case_id: caseData.id,
          force: caseData.force,
          green_zone: [caseData.greenMin, caseData.greenMax],
          samples: samplesRef.current,
          target_label: caseData.targetLabel,
        },
      });

      if (error) {
        setSaveState('error');
        setSaveError(error.message);
        return;
      }

      setSaveState('saved');
    },
    [caseData, user?.id]
  );

  const finishGame = useCallback(
    (finalHits, finalErrors) => {
      const samples = samplesRef.current;
      const chunkSize = Math.max(1, Math.floor(samples.length / 3));
      const first = samples.slice(0, chunkSize);
      const last = samples.slice(Math.max(0, samples.length - chunkSize));
      const initialPrecision = getAverage(first);
      const finalPrecision = getAverage(last);
      const nextResults = {
        completionTimeSeconds: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
        errorsCount: finalErrors,
        finalPrecision,
        initialPrecision,
        note: notes[Math.floor(Math.random() * notes.length)],
        score: calculateNormalizedScore(initialPrecision, finalPrecision, finalErrors),
      };

      setResults(nextResults);
      persistSession(nextResults);
    },
    [persistSession]
  );

  const getIndicatorPosition = useCallback(() => {
    const indicator = indicatorRef.current;
    const track = trackRef.current;

    if (!indicator || !track) {
      return 0;
    }

    const indicatorRect = indicator.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const indicatorCenter = indicatorRect.top + indicatorRect.height / 2;
    const relativeFromTop = clamp(indicatorCenter - trackRect.top, 0, trackRect.height);
    const percentFromTop = (relativeFromTop / trackRect.height) * 100;

    return 100 - percentFromTop;
  }, []);

  const isIndicatorInsideTarget = useCallback(() => {
    const indicator = indicatorRef.current;
    const target = targetRef.current;

    if (!indicator || !target) {
      return false;
    }

    const indicatorRect = indicator.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const indicatorCenter = indicatorRect.top + indicatorRect.height / 2;

    return indicatorCenter >= targetRect.top && indicatorCenter <= targetRect.bottom;
  }, []);

  const applyCompression = useCallback(() => {
    if (results || showBriefing) {
      return;
    }

    const positionPercent = getIndicatorPosition();
    const precision = scoreHit(positionPercent, caseData);
    const success = isIndicatorInsideTarget();
    const nextHits = hits + (success ? 1 : 0);
    const nextErrors = errorsCount + (success ? 0 : 1);

    samplesRef.current.push({
      elapsed_ms: Date.now() - startTimeRef.current,
      position_percent: Math.round(positionPercent),
      precision,
      success,
    });

    setLastPrecision(precision);
    setLastSuccess(success);

    if (success) {
      setHits(nextHits);
      setFeedback(`Acierto ${nextHits}/${REQUIRED_HITS}: ${caseData.targetLabel}.`);
    } else {
      setErrorsCount(nextErrors);
      setFeedback(caseData.criticalWrong);
    }

    if (nextHits >= REQUIRED_HITS) {
      finishGame(nextHits, nextErrors);
    }
  }, [
    caseData,
    errorsCount,
    finishGame,
    getIndicatorPosition,
    hits,
    isIndicatorInsideTarget,
    results,
    showBriefing,
  ]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code !== 'Space' || event.repeat) {
        return;
      }

      event.preventDefault();
      applyCompression();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyCompression]);

  function startSimulation() {
    startTimeRef.current = Date.now();
    samplesRef.current = [];
    setHits(0);
    setErrorsCount(0);
    setLastPrecision(0);
    setLastSuccess(false);
    setFeedback(`Objetivo: ${caseData.targetLabel}.`);
    setShowBriefing(false);
  }

  function resetGame() {
    setCaseData(pickCase());
    setResults(null);
    setShowBriefing(true);
    setHits(0);
    setErrorsCount(0);
    setLastPrecision(0);
    setLastSuccess(false);
    setSaveState('idle');
    setSaveError('');
    setFeedback('Sincroniza el indicador con la zona verde.');
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <Link className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200" to="/dashboard">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">
            Ahogo Express
          </div>
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" />
        </header>

        {showBriefing ? (
          <Briefing caseData={caseData} onStart={startSimulation} />
        ) : (
          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">{caseData.force}</p>
              <h1 className="mt-2 text-2xl font-bold md:text-4xl">{caseData.title}</h1>
              <p className="mt-3 text-slate-300">{caseData.description}</p>
              <p className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm font-bold text-cyan-100">
                Objetivo: {caseData.targetLabel}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-8 sm:flex-row">
                <div ref={trackRef} className="relative h-[520px] w-24 overflow-hidden rounded-full border border-white/10 bg-slate-900">
                  <div
                    ref={targetRef}
                    className="absolute left-2 right-2 rounded-full bg-emerald-400/45 ring-2 ring-emerald-300"
                    style={{
                      bottom: `${caseData.greenMin}%`,
                      height: `${caseData.greenMax - caseData.greenMin}%`,
                    }}
                  />
                  <div
                    className="heimlich-indicator absolute left-1/2 top-0 h-6 w-20 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50"
                    ref={indicatorRef}
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <div className="relative h-80 w-56 rounded-full bg-amber-100">
                    <div className="absolute left-1/2 top-10 h-20 w-20 -translate-x-1/2 rounded-full bg-amber-200" />
                    <div className="absolute bottom-8 left-1/2 h-56 w-40 -translate-x-1/2 rounded-t-full bg-amber-200" />
                    <div
                      className={`absolute left-1/2 h-14 w-36 -translate-x-1/2 rounded-full border-4 ${
                        lastSuccess ? 'border-emerald-500 bg-emerald-300/60' : 'border-cyan-500 bg-cyan-300/40'
                      }`}
                      style={{
                        bottom: caseData.id === 'pregnant_or_obese' ? '62%' : '38%',
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                className="mt-8 h-14 w-full touch-manipulation select-none rounded-md bg-cyan-600 text-sm font-bold text-white transition hover:bg-cyan-700 active:scale-[0.99]"
                onClick={applyCompression}
                type="button"
              >
                Aplicar Compresion
              </button>
            </section>

            <aside className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
              <h2 className="font-bold">Telemetria</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Aciertos" value={`${hits}/${REQUIRED_HITS}`} />
                <Metric label="Errores" value={errorsCount} />
                <Metric label="Ultima precision" value={`${lastPrecision}%`} />
                <Metric label="Zona" value={caseData.targetLabel} />
              </div>
              <div className={`mt-5 rounded-md border p-4 text-sm font-semibold ${lastSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                {feedback}
              </div>
            </aside>
          </div>
        )}
      </section>

      {results ? (
        <ResultsModal
          onExit={() => navigate('/dashboard')}
          onRestart={resetGame}
          results={results}
          saveError={saveError}
          saveState={saveState}
        />
      ) : null}
    </main>
  );
}

function Briefing({ caseData, onStart }) {
  return (
    <section className="grid flex-1 place-items-center py-10">
      <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Briefing medico</p>
        <h1 className="mt-2 text-3xl font-bold">{caseData.title}</h1>
        <p className="mt-3 text-slate-700 dark:text-slate-300">{caseData.description}</p>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <h2 className="font-bold">Instrucciones</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            En computadora: presiona la barra espaciadora o el boton cuando el
            indicador pase por la zona verde. En celular: toca Aplicar
            Compresion. Lo importante es escoger bien la zona para que el aire
            empuje el objeto hacia afuera como un corcho.
          </p>
        </div>
        <p className="mt-3 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm font-semibold text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">
          Objetivo: {caseData.targetLabel}. Requiere {REQUIRED_HITS} aciertos.
        </p>
        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <h2 className="font-bold text-cyan-950 dark:text-cyan-100">Como se mide Inicio vs Final</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
            Inicio es el promedio de precision del primer tercio de compresiones
            intentadas. Final es el promedio del ultimo tercio. Asi se evalua si
            reconoces mejor la zona correcta conforme avanza el caso.
          </p>
        </div>
        <MedicalDisclaimer />
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="h-12 touch-manipulation select-none rounded-md bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-700"
            onClick={onStart}
            type="button"
          >
            Entendido, Iniciar Simulacion
          </button>
          <VideoTutorialModal title="Video tutorial Heimlich" videoId="lsrrkUnf_JM" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function ResultsModal({ onExit, onRestart, results, saveError, saveState }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm">
      <motion.section animate={{ opacity: 1, y: 0 }} className="max-h-[85vh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white md:p-6" initial={{ opacity: 0, y: 18 }}>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Notas de la IA</p>
        <h2 className="mt-1 text-2xl font-bold">Ya puede respirar mejor</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Inicial" value={`${results.initialPrecision}%`} />
          <Metric label="Final" value={`${results.finalPrecision}%`} />
          <Metric label="Score" value={results.score} />
        </div>
        <p className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">{results.note}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? 'Guardando evidencia en Supabase...' : null}
          {saveState === 'saved' ? 'Evidencia guardada en Supabase.' : null}
          {saveState === 'error' ? `No se guardo la evidencia: ${saveError}` : null}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            className="h-12 w-full touch-manipulation select-none rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 sm:w-auto"
            onClick={onExit}
            type="button"
          >
            Salir al Dashboard
          </button>
          <button
            className="h-12 w-full touch-manipulation select-none rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700 sm:w-auto"
            onClick={onRestart}
            type="button"
          >
            Nuevo caso
          </button>
        </div>
      </motion.section>
    </div>
  );
}
