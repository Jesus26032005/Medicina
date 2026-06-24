import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import GameBriefingLayout, { BriefingCard } from '../common/GameBriefingLayout';
import Metric from '../common/GameMetric';
import GameResultsModal from '../common/GameResultsModal';
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
    targetLabel: 'Compresiones abdominales (boca del estómago)',
  },
  mujer_embarazada: {
    label: 'mujer embarazada',
    subject: 'una mujer embarazada',
    force: 'torácica',
    greenMin: 58,
    greenMax: 82,
    targetLabel: 'Compresiones torácicas (centro del pecho)',
  },
  persona_obesa: {
    label: 'persona obesa',
    subject: 'una persona con abdomen muy grande',
    force: 'torácica',
    greenMin: 58,
    greenMax: 82,
    targetLabel: 'Compresiones torácicas (centro del pecho)',
  },
  bebe: {
    label: 'bebé menor de 1 año',
    subject: 'un bebé menor de 1 año',
    force: 'pediátrica',
    greenMin: 50,
    greenMax: 74,
    targetLabel: '5 golpes en espalda y 5 compresiones en pecho',
  },
};

const obstructionLevels = ['partial', 'complete'];

const actionOptions = [
  {
    id: 'apply_heimlich',
    label: 'Aplicar maniobra indicada',
    className: 'border-cyan-300 bg-cyan-100 text-cyan-900 hover:bg-cyan-200 dark:border-cyan-300/30 dark:bg-cyan-400/15 dark:text-cyan-100 dark:hover:bg-cyan-400/25',
  },
  {
    id: 'do_not_apply',
    label: 'No aplicar (animar a toser)',
    className: 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:border-emerald-300/30 dark:bg-emerald-400/15 dark:text-emerald-100 dark:hover:bg-emerald-400/25',
  },
];

const notes = [
  'Si alguien se atraganta y no puede hablar ni toser, llama a emergencias y actúa rápido.',
  'La idea es crear un empujón de aire desde dentro para sacar el objeto, como cuando salta un corcho.',
  'En embarazo u obesidad se presiona el pecho porque el abdomen no es una zona segura.',
  'En niños la fuerza debe ser menor: ayudar no significa empujar con todo.',
  'Si la persona se desmaya, la situación cambia: hay que activar emergencias de inmediato.',
];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getCorrectAction(obstructionLevel) {
  return obstructionLevel === 'partial' ? 'do_not_apply' : 'apply_heimlich';
}

function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildDescription(context, patientType, obstructionLevel) {
  const patient = patientTypes[patientType];

  if (obstructionLevel === 'partial') {
    if (patientType === 'bebe') {
      return `En un ${context}, ${patient.subject} se atraganta, pero llora, tose y todavía puede mover aire.`;
    }

    return `En un ${context}, ${patient.subject} empieza a atragantarse, pero tose fuerte, puede emitir sonidos y todavía entra algo de aire.`;
  }

  if (patientType === 'bebe') {
    return `En un ${context}, ${patient.subject} se atraganta, deja de llorar, no puede toser fuerte y se ve con dificultad para respirar.`;
  }

  return `En un ${context}, ${patient.subject} se levanta asustado, se lleva las manos al cuello, no emite ningún sonido y se ve desesperado.`;
}

function buildRecommendation(obstructionLevel, patientType) {
  if (obstructionLevel === 'partial') {
    return 'Recomendación AHA/Cruz Roja: si puede toser o hablar, anima a toser, observa de cerca y llama a emergencias si empeora.';
  }

  if (patientType === 'mujer_embarazada' || patientType === 'persona_obesa') {
    return 'Recomendación: si no puede hablar, toser ni respirar y no es seguro rodear el abdomen, llama a emergencias y aplica compresiones torácicas.';
  }

  if (patientType === 'bebe') {
    return 'Recomendación: en bebés con obstrucción completa se usan 5 golpes en la espalda y 5 compresiones en el pecho, no compresiones abdominales.';
  }

  return 'Recomendación: si no puede hablar, toser ni respirar, llama a emergencias e inicia compresiones abdominales.';
}

function buildWrongFeedback(caseData) {
  if (caseData.obstructionLevel === 'partial') {
    return 'Error crítico: si la persona puede toser, llorar o emitir sonido, el aire aún pasa. Aplicar una maniobra puede empeorar la obstrucción.';
  }

  return `Error: si no puede hablar, toser, llorar ni respirar bien, esperar cuesta tiempo vital. Debes aplicar la maniobra indicada: ${caseData.targetLabel}.`;
}

function generateCase() {
  const context = pickRandom(contexts);
  const patientType = pickRandom(Object.keys(patientTypes));
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
    recommendation: buildRecommendation(obstructionLevel, patientType),
    targetLabel: patient.targetLabel,
    title: `${capitalizeFirst(patient.label)}: ${obstructionLevel === 'partial' ? 'obstrucción parcial' : 'obstrucción completa'}`,
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

function getCompressionZone(caseData) {
  if (caseData.force === 'torácica') {
    return {
      bottom: '62%',
      label: 'Presiona en el pecho',
      shortLabel: 'Pecho',
    };
  }

  if (caseData.force === 'pediátrica') {
    return {
      bottom: '58%',
      label: 'Golpes en espalda + compresiones en pecho',
      shortLabel: 'Pecho bebé',
    };
  }

  return {
    bottom: '38%',
    label: 'Presiona en el abdomen',
    shortLabel: 'Abdomen',
  };
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
  const compressionZone = getCompressionZone(caseData);

  const persistSession = useCallback(
    async (nextResults) => {
      if (!supabase || !user?.id) {
        setSaveState('error');
        setSaveError('No se pudo guardar: falta una sesión activa o conexión con el expediente.');
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
          note: 'Buena decisión: una obstrucción parcial se maneja animando a toser, observando y pidiendo ayuda si empeora.',
          timeResponse: 100,
        });
        return;
      }

      setFeedback(`Correcto: aplica la maniobra indicada y ejecuta ${caseData.targetLabel}.`);
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

      if (!isSpaceKey) {
        return;
      }

      event.preventDefault();

      if (event.repeat || showBriefing || results) {
        return;
      }

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

  useEffect(() => {
    if (!showTutorial || showBriefing || results) {
      return undefined;
    }

    scrollToGameTop();
    const frameId = window.requestAnimationFrame(scrollToGameTop);

    return () => window.cancelAnimationFrame(frameId);
  }, [results, showBriefing, showTutorial]);

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
    setFeedback('Primero evalúa si la obstrucción es parcial o grave.');
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
    setFeedback('Primero evalúa si la obstrucción es parcial o grave.');
  }

  return (
    <main className="isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <Link className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" to="/dashboard">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">
            Ahogo Express
          </div>
          <ThemeToggle />
        </header>

        {showBriefing ? (
          <Briefing onStart={startSimulation} />
        ) : (
          <div className="grid flex-1 items-center gap-6 py-4 md:gap-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="isolate relative flex min-h-[calc(100dvh-120px)] flex-col justify-start overflow-visible rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5 md:min-h-0 md:justify-center md:p-6">
              {showTutorial ? (
                <button
                  aria-label="Cerrar tutorial e iniciar práctica"
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
                    Toca aquí para iniciar. Después presiona el botón o usa la barra espaciadora cuando el indicador llegue a la zona verde.
                  </span>
                  <span className="mt-3 text-sm text-slate-200">
                    En celular: toca el botón. En computadora: barra espaciadora.
                  </span>
                </button>
              ) : null}
              {assessmentPhase === 'pending' ? (
                <div className="isolate mx-auto w-full max-w-xl translate-z-0 transform-gpu rounded-lg border border-cyan-200 bg-cyan-50 p-5 text-center dark:border-cyan-300/20 dark:bg-slate-900/95">
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                    Evaluación inicial
                  </p>
                  <h1 className="mt-2 text-2xl font-bold md:text-4xl">{caseData.title}</h1>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">{caseData.description}</p>
                  <div className="mt-4 rounded-md border border-cyan-300 bg-cyan-100 p-3 text-sm font-semibold leading-6 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100">
                    {caseData.recommendation}
                  </div>
                  <p className="mt-4 rounded-md border border-amber-300 bg-amber-100 p-3 text-sm font-semibold text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
                    Antes de comprimir, elige la primera acción correcta según el protocolo.
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
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                    Técnica {caseData.force}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold md:text-4xl">{caseData.title}</h1>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">{caseData.description}</p>
                  <p className="mt-4 rounded-md border border-cyan-300 bg-cyan-100 p-3 text-sm font-bold text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                    Objetivo: {caseData.targetLabel}
                  </p>
                  <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-100 p-3 text-sm font-bold text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100">
                    Zona de acción: {compressionZone.label}. El marcador brillante sobre el paciente muestra dónde actuar.
                  </p>

                  <div className="isolate mx-auto mt-4 flex w-full max-w-md shrink-0 translate-z-0 transform-gpu flex-row items-center justify-evenly gap-4 overflow-visible md:mt-8 md:max-w-none md:gap-8">
                    <div ref={trackRef} className="relative h-56 w-14 shrink-0 translate-z-0 transform-gpu overflow-hidden rounded-full border border-slate-300 bg-slate-200 shadow-inner dark:border-white/10 dark:bg-slate-900 sm:h-64 sm:w-16 md:h-96 md:w-24">
                      <div
                        ref={targetRef}
                        className="colorblind-target-zone absolute left-2 right-2 rounded-full bg-emerald-400/45 ring-2 ring-emerald-300"
                        style={{
                          bottom: `${caseData.greenMin}%`,
                          height: `${caseData.greenMax - caseData.greenMin}%`,
                        }}
                      />
                      <div
                        className="colorblind-moving-indicator heimlich-indicator absolute left-1/2 top-0 h-5 w-14 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50 md:h-6 md:w-20"
                        ref={indicatorRef}
                      />
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-center">
                      <div
                        className={`relative rounded-full bg-amber-100 ${
                          caseData.patientType === 'bebe'
                            ? 'h-28 w-24 sm:h-32 sm:w-28 md:h-56 md:w-44'
                            : 'h-36 w-28 sm:h-40 sm:w-32 md:h-80 md:w-56'
                        }`}
                      >
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-amber-200 ${
                            caseData.patientType === 'bebe'
                              ? 'top-3 h-10 w-10 sm:top-4 sm:h-11 sm:w-11 md:top-7 md:h-16 md:w-16'
                              : 'top-4 h-9 w-9 sm:top-5 sm:h-10 sm:w-10 md:top-10 md:h-20 md:w-20'
                          }`}
                        />
                        <div
                          className={`absolute bottom-3 left-1/2 -translate-x-1/2 rounded-t-full bg-amber-200 ${
                            caseData.patientType === 'bebe'
                              ? 'h-16 w-16 sm:h-20 sm:w-20 md:bottom-6 md:h-36 md:w-28'
                              : 'h-24 w-20 sm:bottom-4 sm:h-28 sm:w-24 md:bottom-8 md:h-56 md:w-40'
                          }`}
                        />
                        <div
                          className={`absolute left-1/2 flex h-8 w-20 -translate-x-1/2 items-center justify-center rounded-full border-4 text-[10px] font-black uppercase tracking-wide sm:h-9 sm:w-24 md:h-14 md:w-36 md:text-xs ${
                            lastSuccess ? 'border-emerald-500 bg-emerald-300/60' : 'border-cyan-500 bg-cyan-300/40'
                          }`}
                          style={{
                            bottom: compressionZone.bottom,
                          }}
                        >
                          {compressionZone.shortLabel}
                        </div>
                      </div>
                      <p className="mt-3 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-center text-xs font-bold text-cyan-800 dark:border-white/10 dark:bg-white/5 dark:text-cyan-100">
                        {compressionZone.label}
                      </p>
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
                    Aplicar compresión
                  </button>
                </>
              )}
            </section>

            <aside className="isolate translate-z-0 transform-gpu rounded-lg border border-white/10 bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
              <h2 className="font-bold">Telemetría</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Aciertos" value={`${hits}/${REQUIRED_HITS}`} />
                <Metric label="Errores" value={errorsCount} />
                <Metric label="Última precisión" value={`${lastPrecision}%`} />
                <Metric label="Decisión" value={decisionScore ? 'Correcta' : assessmentChoice ? 'Revisar' : 'Pendiente'} />
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

function Briefing({ onStart }) {
  const handleStart = () => onStart();

  return (
    <GameBriefingLayout
      evidenceKey="choking_express"
      onStart={handleStart}
      title="Choking Express"
      videoId="lsrrkUnf_JM"
      videoTitle="Video tutorial Heimlich"
    >
      <BriefingCard title="📖 Instrucciones" variant="instructions">
        <p>
          Primero elige entre dos acciones: aplicar la maniobra indicada o no
          aplicarla y animar a toser. Si la persona tose, llora o hace sonidos,
          no comprimas. Si no emite sonido, no puede toser o respira muy mal,
          aplica la técnica indicada. Después usa espacio o el botón cuando el
          indicador pase por la zona verde. Se requieren {REQUIRED_HITS} aciertos.
        </p>
      </BriefingCard>
      <BriefingCard title="⚡ Toma de Decisiones Críticas" variant="critical">
        <p>
          El mayor peso recae en la primera decisión: animar a toser cuando la
          obstrucción es parcial o aplicar la maniobra cuando es grave. Una
          intervención innecesaria ante una persona que todavía tose se
          considera un error crítico y recibe la penalización máxima.
        </p>
      </BriefingCard>
      <BriefingCard title="🎯 Puntuación" variant="score">
        <p>
            La puntuación va de 0 a 100: 40% decisión inicial, 40% precisión al
            aplicar la compresión en la zona correcta y 20% rapidez. Si aplicas
            una maniobra cuando la persona todavía tose, se marca un error crítico y
            la puntuación cae a 0.
        </p>
      </BriefingCard>
    </GameBriefingLayout>
  );
}

function ResultsModal({ onExit, onRestart, results, saveError, saveState }) {
  return (
    <GameResultsModal
      metrics={[
        { label: 'Inicial', value: `${results.initialPrecision}%` },
        { label: 'Final', value: `${results.finalPrecision}%` },
        { label: 'Decisión', value: `${results.knowledgeDecision}%` },
        { label: 'Mecánica', value: `${results.mechanicalPrecision}%` },
        { label: 'Tiempo', value: `${results.timeResponse}%` },
        { label: 'Puntuación', value: results.score },
      ]}
      onExit={onExit}
      onRestart={onRestart}
      restartLabel="Nuevo caso"
      saveError={saveError}
      saveState={saveState}
      score={results.score}
      title={results.criticalError ? 'Decisión crítica revisada' : 'Práctica completada'}
    >
      <p className="mt-4 break-words rounded-xl border border-cyan-300 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100 md:text-base">
        {results.note}
      </p>
    </GameResultsModal>
  );
}
