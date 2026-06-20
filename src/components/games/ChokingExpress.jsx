import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import ClinicalEvidenceDisclosure from '../common/ClinicalEvidenceDisclosure';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const REQUIRED_HITS = 5;

const contexts = ['restaurante', 'comedor de casa', 'calle', 'parque'];

const patientTypes = {
  adulto_promedio: {
    label: 'adulto promedio',
    subject: 'un adulto',
    force: 'abdominal',
    greenMin: 38,
    greenMax: 62,
    targetLabel: 'Compresiones Abdominales (boca del estomago)',
  },
};

const obstructionLevels = ['partial', 'complete'];

const actionOptions = [
  {
    id: 'apply_heimlich',
    label: 'Aplicar Heimlich',
    className: 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25',
  },
  {
    id: 'do_not_apply',
    label: 'No aplicar (Animar a toser)',
    className: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25',
  },
];

const notes = [
  'Si alguien se atraganta y no puede hablar ni toser, llama a emergencias y actua rapido.',
  'La idea es crear un empujon de aire desde dentro para sacar el objeto, como cuando salta un corcho.',
  'En embarazo u obesidad se presiona el pecho porque el abdomen no es una zona segura.',
  'En ninos la fuerza debe ser menor: ayudar no significa empujar con todo.',
  'Si la persona se desmaya, la situacion cambia: hay que activar emergencias de inmediato.',
];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getCorrectAction(obstructionLevel) {
  return obstructionLevel === 'partial' ? 'do_not_apply' : 'apply_heimlich';
}

function buildDescription(context, patientType, obstructionLevel) {
  const patient = patientTypes[patientType];

  if (obstructionLevel === 'partial') {
    return `En un ${context}, ${patient.subject} empieza a atragantarse, pero tose fuerte, puede emitir sonidos y todavia entra algo de aire.`;
  }

  return `En un ${context}, ${patient.subject} se levanta asustado, se lleva las manos al cuello, no emite ningun sonido y se ve desesperado.`;
}

function buildRecommendation(obstructionLevel) {
  if (obstructionLevel === 'partial') {
    return 'Recomendacion AHA/Cruz Roja: si puede toser o hablar, anima a toser, observa de cerca y llama a emergencias si empeora.';
  }

  return 'Recomendacion: si no puede hablar, toser ni respirar, llama a emergencias e inicia compresiones abdominales.';
}

function buildWrongFeedback(caseData) {
  if (caseData.obstructionLevel === 'partial') {
    return 'Error Critico: Si la persona puede toser o emitir sonido, el aire aun pasa. Hacer Heimlich puede empeorar la obstruccion.';
  }

  return 'Error: si no puede hablar, toser ni respirar, esperar cuesta tiempo vital. Debes aplicar la maniobra.';
}

function generateCase() {
  const context = pickRandom(contexts);
  const patientType = 'adulto_promedio';
  const obstructionLevel = pickRandom(obstructionLevels);
  const patient = patientTypes[patientType];
  const correctAction = getCorrectAction(obstructionLevel);

  return {
    context,
    correctAction,
    description: buildDescription(context, patientType, obstructionLevel),
    force: patient.force,
    greenMax: patient.greenMax,
    greenMin: patient.greenMin,
    id: `${context}_${patientType}_${obstructionLevel}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    obstructionLevel,
    patientLabel: patient.label,
    patientType,
    recommendation: buildRecommendation(obstructionLevel),
    targetLabel: patient.targetLabel,
    title: `${patient.label}: ${obstructionLevel === 'partial' ? 'obstruccion parcial' : 'obstruccion completa'}`,
  };
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

function calculateUniversalScore({ knowledgeDecision, mechanicalPrecision, timeResponse }) {
  return Math.round(
    clamp(knowledgeDecision * 0.4 + mechanicalPrecision * 0.4 + timeResponse * 0.2, 0, 100)
  );
}

function scrollToGameTop() {
  window.scrollTo({ behavior: 'auto', left: 0, top: 0 });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function ChokingExpress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(() => generateCase());
  const [showBriefing, setShowBriefing] = useState(true);
  const [showTutorial, setShowTutorial] = useState(true);
  const [assessmentPhase, setAssessmentPhase] = useState('pending');
  const [assessmentChoice, setAssessmentChoice] = useState('');
  const [decisionScore, setDecisionScore] = useState(0);
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
        setSaveError('No se pudo guardar: falta una sesion activa o conexion con el expediente.');
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
          assessment_choice: nextResults.assessmentChoice,
          correct_action: caseData.correctAction,
          critical_error: nextResults.criticalError,
          case_id: caseData.id,
          context: caseData.context,
          force: caseData.force,
          green_zone: [caseData.greenMin, caseData.greenMax],
          obstruction_level: caseData.obstructionLevel,
          patient_type: caseData.patientType,
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
    (finalHits, finalErrors, options = {}) => {
      const samples = samplesRef.current;
      const chunkSize = Math.max(1, Math.floor(samples.length / 3));
      const first = samples.slice(0, chunkSize);
      const last = samples.slice(Math.max(0, samples.length - chunkSize));
      const completionTimeSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const initialPrecision = options.initialPrecision ?? getAverage(first);
      const finalPrecision = options.finalPrecision ?? getAverage(last);
      const knowledgeDecision = options.knowledgeDecision ?? decisionScore;
      const mechanicalPrecision = options.mechanicalPrecision ?? finalPrecision;
      const timeResponse = options.timeResponse ?? clamp(100 - completionTimeSeconds * 3, 0, 100);
      const nextResults = {
        assessmentChoice: options.assessmentChoice ?? assessmentChoice,
        completionTimeSeconds,
        criticalError: Boolean(options.criticalError),
        errorsCount: finalErrors,
        finalPrecision,
        initialPrecision,
        knowledgeDecision,
        mechanicalPrecision,
        note: options.note ?? notes[Math.floor(Math.random() * notes.length)],
        score: calculateUniversalScore({
          knowledgeDecision,
          mechanicalPrecision,
          timeResponse,
        }),
        timeResponse,
      };

      setResults(nextResults);
      persistSession(nextResults);
    },
    [assessmentChoice, decisionScore, persistSession]
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

  const beginInteractiveRun = useCallback(() => {
    startTimeRef.current = Date.now();
    setShowTutorial(false);
  }, []);

  const applyCompression = useCallback(() => {
    if (results || showBriefing || showTutorial || assessmentPhase !== 'ready') {
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
      setFeedback(`Fuera de la zona correcta. Objetivo: ${caseData.targetLabel}.`);
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
    assessmentPhase,
    showBriefing,
    showTutorial,
  ]);

  function handleAssessment(choice) {
    if (results || showBriefing || showTutorial || assessmentPhase !== 'pending') {
      return;
    }

    setAssessmentChoice(choice);

    if (choice === caseData.correctAction) {
      setDecisionScore(100);

      if (caseData.obstructionLevel === 'partial') {
        setFeedback('Correcto: si puede toser o hablar, se anima a toser y se vigila. No se comprime.');
        finishGame(0, 0, {
          assessmentChoice: choice,
          finalPrecision: 100,
          initialPrecision: 100,
          knowledgeDecision: 100,
          mechanicalPrecision: 100,
          note: 'Buena decision: una obstruccion parcial se maneja animando a toser, observando y pidiendo ayuda si empeora.',
          timeResponse: 100,
        });
        return;
      }

      setFeedback(`Correcto: aplica Heimlich y ejecuta ${caseData.targetLabel}.`);
      setAssessmentPhase('ready');
      return;
    }

    const wrongFeedback = buildWrongFeedback(caseData);
    setDecisionScore(0);
    setFeedback(wrongFeedback);
    finishGame(0, 1, {
      assessmentChoice: choice,
      criticalError: true,
      finalPrecision: 0,
      initialPrecision: 0,
      knowledgeDecision: 0,
      mechanicalPrecision: 0,
      note: wrongFeedback,
      timeResponse: 0,
    });
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const isSpaceKey = event.code === 'Space' || event.key === ' ';
      const isGameActive = !showBriefing && !results;

      if (!isSpaceKey || event.repeat || !isGameActive) {
        return;
      }

      event.preventDefault();

      if (!showBriefing && showTutorial && !results) {
        beginInteractiveRun();
        return;
      }

      applyCompression();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyCompression, beginInteractiveRun, results, showBriefing, showTutorial]);

  function startSimulation() {
    scrollToGameTop();
    samplesRef.current = [];
    setHits(0);
    setErrorsCount(0);
    setLastPrecision(0);
    setLastSuccess(false);
    setAssessmentPhase('pending');
    setAssessmentChoice('');
    setDecisionScore(0);
    setFeedback('Primero evalua si la obstruccion es parcial o grave.');
    setShowTutorial(true);
    setShowBriefing(false);
  }

  function resetGame() {
    setCaseData(generateCase());
    setResults(null);
    setShowBriefing(true);
    setShowTutorial(true);
    setHits(0);
    setErrorsCount(0);
    setLastPrecision(0);
    setLastSuccess(false);
    setAssessmentPhase('pending');
    setAssessmentChoice('');
    setDecisionScore(0);
    setSaveState('idle');
    setSaveError('');
    setFeedback('Primero evalua si la obstruccion es parcial o grave.');
  }

  return (
    <main className="isolate min-h-screen w-full max-w-[100vw] translate-z-0 transform-gpu overflow-x-hidden bg-slate-950 text-white">
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
          <div className="grid flex-1 items-center gap-6 py-4 md:gap-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="isolate relative flex h-[calc(100dvh-120px)] translate-z-0 transform-gpu flex-col justify-center overflow-y-auto overscroll-none rounded-lg border border-white/10 bg-white/5 p-3 md:h-auto md:overflow-visible md:p-6">
              {showTutorial ? (
                <button
                  aria-label="Cerrar tutorial e iniciar practica"
                  className="fixed inset-0 z-50 flex touch-manipulation select-none flex-col items-center justify-center bg-black/70 px-6 text-center backdrop-blur-sm transition"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    beginInteractiveRun();
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    beginInteractiveRun();
                  }}
                  type="button"
                >
                  <span className="animate-bounce text-5xl" aria-hidden="true">
                    👇
                  </span>
                  <span className="mt-4 max-w-xs translate-z-0 transform-gpu rounded-lg border border-cyan-300/30 bg-cyan-300/15 p-4 text-base font-bold text-cyan-50 shadow-2xl">
                    Toca aqui para iniciar. Despues presiona el boton o usa la barra espaciadora cuando el indicador llegue a la zona verde.
                  </span>
                  <span className="mt-3 text-sm text-slate-200">
                    En celular: toca el boton. En computadora: barra espaciadora.
                  </span>
                </button>
              ) : null}
              {assessmentPhase === 'pending' ? (
                <div className="isolate mx-auto w-full max-w-xl translate-z-0 transform-gpu rounded-lg border border-cyan-300/20 bg-slate-900/95 p-5 text-center">
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                    Evaluacion inicial
                  </p>
                  <h1 className="mt-2 text-2xl font-bold md:text-4xl">{caseData.title}</h1>
                  <p className="mt-3 text-slate-300">{caseData.description}</p>
                  <div className="mt-4 rounded-md border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm font-semibold leading-6 text-cyan-100">
                    {caseData.recommendation}
                  </div>
                  <p className="mt-4 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm font-semibold text-amber-100">
                    Antes de comprimir, elige la primera accion correcta segun el protocolo.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {actionOptions.map((option) => (
                      <button
                        className={`min-h-14 touch-manipulation select-none rounded-md border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${option.className}`}
                        disabled={showTutorial}
                        key={option.id}
                        onClick={() => handleAssessment(option.id)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">{caseData.force}</p>
                  <h1 className="mt-2 text-2xl font-bold md:text-4xl">{caseData.title}</h1>
                  <p className="mt-3 text-slate-300">{caseData.description}</p>
                  <p className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm font-bold text-cyan-100">
                    Objetivo: {caseData.targetLabel}
                  </p>

                  <div className="isolate mx-auto mt-4 flex w-full max-w-md translate-z-0 transform-gpu flex-row items-center justify-evenly gap-4 overflow-hidden md:mt-8 md:max-w-none md:gap-8">
                    <div ref={trackRef} className="relative h-56 w-14 shrink-0 translate-z-0 transform-gpu overflow-hidden rounded-full border border-white/10 bg-slate-900 sm:h-64 sm:w-16 md:h-96 md:w-24">
                      <div
                        ref={targetRef}
                        className="absolute left-2 right-2 rounded-full bg-emerald-400/45 ring-2 ring-emerald-300"
                        style={{
                          bottom: `${caseData.greenMin}%`,
                          height: `${caseData.greenMax - caseData.greenMin}%`,
                        }}
                      />
                      <div
                        className="heimlich-indicator absolute left-1/2 top-0 h-5 w-14 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50 md:h-6 md:w-20"
                        ref={indicatorRef}
                      />
                    </div>

                    <div className="flex shrink-0 flex-col justify-center">
                      <div className="relative h-36 w-28 rounded-full bg-amber-100 sm:h-40 sm:w-32 md:h-80 md:w-56">
                        <div className="absolute left-1/2 top-4 h-9 w-9 -translate-x-1/2 rounded-full bg-amber-200 sm:top-5 sm:h-10 sm:w-10 md:top-10 md:h-20 md:w-20" />
                        <div className="absolute bottom-3 left-1/2 h-24 w-20 -translate-x-1/2 rounded-t-full bg-amber-200 sm:bottom-4 sm:h-28 sm:w-24 md:bottom-8 md:h-56 md:w-40" />
                        <div
                          className={`absolute left-1/2 h-8 w-20 -translate-x-1/2 rounded-full border-4 sm:h-9 sm:w-24 md:h-14 md:w-36 ${
                            lastSuccess ? 'border-emerald-500 bg-emerald-300/60' : 'border-cyan-500 bg-cyan-300/40'
                          }`}
                          style={{
                            bottom: caseData.correctAction === 'chest_compressions' || caseData.correctAction === 'infant_back_blows' ? '62%' : '38%',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    className="mt-3 min-h-[48px] w-full touch-manipulation select-none rounded-md bg-cyan-600 text-sm font-bold text-white transition hover:bg-cyan-700 active:scale-[0.99] md:mt-8 md:h-14"
                    disabled={showTutorial}
                    onClick={applyCompression}
                    onTouchStart={(event) => {
                      event.preventDefault();
                      applyCompression();
                    }}
                    style={{ touchAction: 'manipulation' }}
                    type="button"
                  >
                    Aplicar Compresion
                  </button>
                </>
              )}
            </section>

            <aside className="isolate translate-z-0 transform-gpu rounded-lg border border-white/10 bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
              <h2 className="font-bold">Telemetria</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Aciertos" value={`${hits}/${REQUIRED_HITS}`} />
                <Metric label="Errores" value={errorsCount} />
                <Metric label="Ultima precision" value={`${lastPrecision}%`} />
                <Metric label="Decision" value={decisionScore ? 'Correcta' : assessmentChoice ? 'Revisar' : 'Pendiente'} />
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
      <div className="isolate w-full max-w-3xl translate-z-0 transform-gpu rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Briefing medico</p>
        <h1 className="mt-2 text-3xl font-bold">{caseData.title}</h1>
        <p className="mt-3 text-slate-700 dark:text-slate-300">{caseData.description}</p>
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100">
          {caseData.recommendation}
        </div>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <h2 className="font-bold">Instrucciones</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Primero elige entre dos acciones: aplicar Heimlich o no aplicarlo y
            animar a toser. Si la persona tose o hace sonidos, no comprimas. Si
            no emite sonido y se agarra el cuello, aplica Heimlich. Despues, en
            computadora presiona espacio o el boton cuando el indicador pase por
            la zona verde; en celular toca Aplicar Compresion.
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
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/30 dark:bg-emerald-400/10">
          <h2 className="font-bold text-emerald-950 dark:text-emerald-100">Como se calcula el score</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900 dark:text-emerald-100">
            El score va de 0 a 100: 40% decision inicial, 40% precision al
            aplicar la compresion en la zona correcta y 20% rapidez. Si aplicas
            Heimlich cuando la persona todavia tose, se marca error critico y el
            score cae a 0.
          </p>
        </div>
        <MedicalDisclaimer />
        <ClinicalEvidenceDisclosure moduleKey="choking_express" />
        <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3">
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
      <motion.section animate={{ opacity: 1, y: 0 }} className="isolate max-h-[85dvh] w-full max-w-xl translate-z-0 transform-gpu overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white md:p-8" initial={{ opacity: 0, y: 18 }}>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
          <BookOpen aria-hidden="true" className="h-4 w-4" />
          Retroalimentacion clinica
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          {results.criticalError ? 'Decision critica revisada' : 'Practica completada'}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Inicial" value={`${results.initialPrecision}%`} />
          <Metric label="Final" value={`${results.finalPrecision}%`} />
          <Metric label="Decision" value={`${results.knowledgeDecision}%`} />
          <Metric label="Mecanica" value={`${results.mechanicalPrecision}%`} />
          <Metric label="Tiempo" value={`${results.timeResponse}%`} />
          <Metric label="Score" value={results.score} />
        </div>
        <p className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">{results.note}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? 'Guardando tu progreso...' : null}
          {saveState === 'saved' ? 'Progreso guardado en tu expediente.' : null}
          {saveState === 'error' ? `No se pudo registrar el progreso: ${saveError}` : null}
        </div>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 md:flex-row md:justify-end md:gap-4">
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
