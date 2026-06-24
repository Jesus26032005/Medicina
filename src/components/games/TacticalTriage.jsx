import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ClipboardList,
  Siren,
  Timer,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import GameBriefingLayout, { BriefingCard } from '../common/GameBriefingLayout';
import GameResultsModal from '../common/GameResultsModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const PATIENTS_PER_GAME = 5;
const SECONDS_PER_PATIENT = 20;

const triageOptions = [
  {
    colorClass: 'border-red-300/40 bg-red-600 hover:bg-red-700 shadow-red-950/40',
    key: 'red',
    label: 'ROJO',
    subtitle: 'Inmediato - Riesgo vital',
    time: '0 min',
  },
  {
    colorClass: 'border-orange-300/40 bg-orange-500 hover:bg-orange-600 shadow-orange-950/40',
    key: 'orange',
    label: 'NARANJA',
    subtitle: 'Muy urgente',
    time: '10 min',
  },
  {
    colorClass: 'border-yellow-300/40 bg-yellow-500 hover:bg-yellow-600 shadow-yellow-950/30',
    key: 'yellow',
    label: 'AMARILLO',
    subtitle: 'Urgente',
    time: '60 min',
  },
  {
    colorClass: 'border-emerald-300/40 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/40',
    key: 'green',
    label: 'VERDE',
    subtitle: 'Estándar',
    time: '120 min',
  },
  {
    colorClass: 'border-blue-300/40 bg-blue-600 hover:bg-blue-700 shadow-blue-950/40',
    key: 'blue',
    label: 'AZUL',
    subtitle: 'No urgente',
    time: '240 min',
  },
];

const manchesterLevels = {
  blue: 'Azul - No urgente - 240 min',
  green: 'Verde - Estándar - 120 min',
  orange: 'Naranja - Muy urgente - 10 min',
  red: 'Rojo - Inmediato - Riesgo vital',
  yellow: 'Amarillo - Urgente - 60 min',
};

const notes = [
  'Manchester prioriza por riesgo clínico: primero busca amenaza vital, conciencia, respiración, hemorragia, dolor y constantes.',
  'Un paciente azul no significa que no importe; significa que no tiene signos agudos de prioridad alta en el momento de clasificar.',
  'Dolor severo, dificultad respiratoria severa o dolor torácico con síntomas autonómicos elevan la prioridad.',
  'La clasificación de triage no es diagnóstico: decide qué tan pronto debe valorarse al paciente.',
  'El color rojo implica atención inmediata porque hay riesgo vital evidente o muy probable.',
];

const manchesterSteps = [
  {
    color: 'ROJO',
    description: 'Riesgo vital inmediato: paro, inconsciencia, hemorragia exanguinante o compromiso respiratorio crítico.',
    rule: 'Amenaza vital',
  },
  {
    color: 'NARANJA',
    description: 'Muy urgente: dolor severo, dificultad respiratoria severa, dolor torácico de alto riesgo o hemorragia mayor controlable.',
    rule: '10 min',
  },
  {
    color: 'AMARILLO',
    description: 'Urgente: dolor moderado, fiebre relevante, dificultad respiratoria moderada o constantes alteradas sin shock.',
    rule: '60 min',
  },
  {
    color: 'VERDE',
    description: 'Estándar: problema menor con síntomas tolerables, movilidad conservada y sin datos de alarma.',
    rule: '120 min',
  },
  {
    color: 'AZUL',
    description: 'No urgente: solicitud administrativa o condición crónica estable sin síntomas agudos.',
    rule: '240 min',
  },
];

const fallbackCases = [
  {
    chestPainRisk: false,
    consciousness: 'inconsciente',
    difficultyBreathing: 'severa',
    expected: 'red',
    hemorrhage: 'ausente',
    id: 'mts_fallback_red_arrest',
    pain: 'sin_dolor',
    scenario: 'Paciente ingresa en paro cardiorrespiratorio presenciado; no respira y no tiene pulso palpable.',
    source: 'fallback',
    temperature: 'normal',
    title: 'Paro cardiorrespiratorio presenciado',
  },
  {
    chestPainRisk: true,
    consciousness: 'alerta',
    difficultyBreathing: 'severa',
    expected: 'orange',
    hemorrhage: 'ausente',
    id: 'mts_fallback_orange_chest_pain',
    pain: 'severo',
    scenario: 'Paciente con dolor toracico opresivo irradiado a brazo izquierdo, diaforesis y dificultad para respirar severa.',
    source: 'fallback',
    temperature: 'normal',
    title: 'Dolor torácico de alto riesgo',
  },
  {
    chestPainRisk: false,
    consciousness: 'alerta',
    difficultyBreathing: 'ausente',
    expected: 'yellow',
    hemorrhage: 'ausente',
    id: 'mts_fallback_yellow_abdomen',
    pain: 'moderado',
    scenario: 'Dolor abdominal moderado de 2 días de evolución, fiebre de 38.5 °C, sin signos de shock.',
    source: 'fallback',
    temperature: 'alterada',
    title: 'Dolor abdominal con fiebre',
  },
  {
    chestPainRisk: false,
    consciousness: 'alerta',
    difficultyBreathing: 'ausente',
    expected: 'green',
    hemorrhage: 'ausente',
    id: 'mts_fallback_green_sprain',
    pain: 'moderado',
    scenario: 'Esguince de tobillo tras caída leve, dolor tolerable 4/10, puede caminar cojeando y no hay deformidad evidente.',
    source: 'fallback',
    temperature: 'normal',
    title: 'Esguince de tobillo',
  },
  {
    chestPainRisk: false,
    consciousness: 'alerta',
    difficultyBreathing: 'ausente',
    expected: 'blue',
    hemorrhage: 'ausente',
    id: 'mts_fallback_blue_prescription',
    pain: 'sin_dolor',
    scenario: 'Paciente acude para solicitud de renovación de receta de medicamentos crónicos, sin síntomas agudos.',
    source: 'fallback',
    temperature: 'normal',
    title: 'Renovación de receta',
  },
];

const consciousnessOptions = ['alerta', 'responde_voz', 'responde_dolor', 'inconsciente'];
const hemorrhageOptions = ['exanguinante', 'mayor_controlable', 'menor', 'ausente'];
const painOptions = ['severo', 'moderado', 'leve', 'sin_dolor'];
const temperatureOptions = ['normal', 'alterada'];
const breathingOptions = ['severa', 'moderada', 'ausente'];
const contexts = [
  'sala de espera de urgencias',
  'area de admision',
  'entrada de urgencias',
  'consulta no programada',
  'pasillo de triage',
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function chance(probability) {
  return Math.random() < probability;
}

function calculateUniversalScore({ knowledgeDecision, mechanicalPrecision, timeResponse }) {
  return Math.round(
    clamp(knowledgeDecision * 0.4 + mechanicalPrecision * 0.4 + timeResponse * 0.2, 0, 100)
  );
}

function getPainLabel(pain) {
  const labels = {
    leve: 'leve 1-3/10',
    moderado: 'moderado 4-7/10',
    severo: 'severo 8-10/10',
    sin_dolor: 'sin dolor',
  };
  return labels[pain] ?? pain;
}

function getConsciousnessLabel(consciousness) {
  const labels = {
    alerta: 'alerta',
    inconsciente: 'inconsciente',
    responde_dolor: 'responde al dolor',
    responde_voz: 'responde a la voz',
  };
  return labels[consciousness] ?? consciousness;
}

function getBreathingLabel(breathing) {
  const labels = {
    ausente: 'sin dificultad respiratoria',
    moderada: 'dificultad respiratoria moderada',
    severa: 'dificultad respiratoria severa',
  };
  return labels[breathing] ?? breathing;
}

function getHemorrhageLabel(hemorrhage) {
  const labels = {
    ausente: 'sin hemorragia',
    exanguinante: 'hemorragia exanguinante',
    mayor_controlable: 'hemorragia mayor controlable',
    menor: 'hemorragia menor',
  };
  return labels[hemorrhage] ?? hemorrhage;
}

function evaluateManchesterCase(caseData) {
  if (caseData.consciousness === 'inconsciente' || caseData.hemorrhage === 'exanguinante') {
    return {
      expected: 'red',
      explanation:
        'MTS: inconsciencia o hemorragia exanguinante son discriminadores de riesgo vital; se clasifica ROJO para atención inmediata.',
    };
  }

  if (
    caseData.difficultyBreathing === 'severa' ||
    caseData.hemorrhage === 'mayor_controlable' ||
    caseData.pain === 'severo' ||
    caseData.chestPainRisk ||
    caseData.consciousness === 'responde_dolor'
  ) {
    return {
      expected: 'orange',
      explanation:
        'MTS: dolor severo, dificultad respiratoria severa, dolor torácico de alto riesgo, respuesta solo al dolor o hemorragia mayor controlable elevan a NARANJA.',
    };
  }

  if (
    caseData.difficultyBreathing === 'moderada' ||
    caseData.pain === 'moderado' ||
    caseData.temperature === 'alterada' ||
    caseData.consciousness === 'responde_voz'
  ) {
    return {
      expected: 'yellow',
      explanation:
        'MTS: el dolor moderado, la fiebre o las constantes alteradas, la dificultad respiratoria moderada o la respuesta solo a la voz se clasifican como AMARILLO.',
    };
  }

  if (caseData.pain === 'leve' || caseData.hemorrhage === 'menor') {
    return {
      expected: 'green',
      explanation:
        'MTS: síntomas leves, hemorragia menor y estabilidad general corresponden a VERDE, atención estándar.',
    };
  }

  return {
    expected: 'blue',
    explanation:
        'MTS: no hay síntomas agudos ni discriminadores de urgencia; se clasifica AZUL como no urgente.',
  };
}

function buildProceduralScenario(caseData) {
  const parts = [
    `Paciente en ${caseData.context}.`,
    `Nivel de conciencia: ${getConsciousnessLabel(caseData.consciousness)}.`,
    `Hemorragia: ${getHemorrhageLabel(caseData.hemorrhage)}.`,
    `Dolor: ${getPainLabel(caseData.pain)}.`,
    `Respiración: ${getBreathingLabel(caseData.difficultyBreathing)}.`,
    caseData.temperature === 'alterada'
      ? 'Temperatura o constantes alteradas.'
      : 'Temperatura y constantes sin alarma evidente.',
  ];

  if (caseData.chestPainRisk) {
    parts.push('Refiere dolor torácico opresivo con datos de alarma.');
  }

  return parts.join(' ');
}

function generateManchesterCase(index) {
  const caseData = {
    chestPainRisk: chance(0.16),
    consciousness: randomItem(consciousnessOptions),
    context: randomItem(contexts),
    difficultyBreathing: randomItem(breathingOptions),
    hemorrhage: randomItem(hemorrhageOptions),
    id: `mts_proc_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`,
    pain: randomItem(painOptions),
    source: 'procedural',
    temperature: randomItem(temperatureOptions),
  };
  const evaluated = evaluateManchesterCase(caseData);

  return {
    ...caseData,
    expected: evaluated.expected,
    explanation: evaluated.explanation,
    scenario: buildProceduralScenario(caseData),
    title: `Paciente ${index}: prioridad ${manchesterLevels[evaluated.expected]}`,
  };
}

function normalizeFallbackCase(caseData, index) {
  const evaluated = evaluateManchesterCase(caseData);

  return {
    ...caseData,
    explanation: evaluated.explanation,
    title: `Paciente ${index}: ${caseData.title}`,
  };
}

function generatePatients() {
  try {
    return Array.from({ length: PATIENTS_PER_GAME }, (_, index) => {
      if (chance(0.28)) {
        return normalizeFallbackCase(
          fallbackCases[index % fallbackCases.length],
          index + 1
        );
      }
      return generateManchesterCase(index + 1);
    });
  } catch {
    return fallbackCases
      .slice(0, PATIENTS_PER_GAME)
      .map((caseData, index) => normalizeFallbackCase(caseData, index + 1));
  }
}

function getAverage(items) {
  return items.length
    ? Math.round(items.reduce((sum, item) => sum + item.precision, 0) / items.length)
    : 0;
}

function scrollToGameTop() {
  window.scrollTo({ behavior: 'auto', left: 0, top: 0 });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function TacticalTriage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState(() => generatePatients());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_PATIENT);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const startTimeRef = useRef(Date.now());
  const casePanelRef = useRef(null);
  const feedbackRef = useRef(null);

  const currentPatient = patients[currentIndex];
  const errorsCount = answers.filter((answer) => !answer.correct).length;
  const correctCount = answers.filter((answer) => answer.correct).length;

  const persistSession = useCallback(
    async (nextResults, finalAnswers) => {
      if (!supabase || !user?.id) {
        setSaveState('error');
        setSaveError('No se pudo guardar: falta una sesión activa o conexión con el expediente.');
        return;
      }

      setSaveState('saving');
      setSaveError('');

      const { error } = await supabase.from('game_sessions').insert({
        user_id: user.id,
        game_key: 'tactical_triage',
        initial_precision: nextResults.initialPrecision,
        final_precision: nextResults.finalPrecision,
        completion_time_seconds: nextResults.completionTimeSeconds,
        errors_count: nextResults.errorsCount,
        score: nextResults.score,
        telemetry: {
          answers: finalAnswers,
          fallback_cases_available: fallbackCases.length,
          generator: 'hybrid_manchester_triage',
          protocol: 'Manchester Triage System',
          total_patients: PATIENTS_PER_GAME,
        },
      });

      if (error) {
        setSaveState('error');
        setSaveError(
          error.message?.includes('game_sessions_game_key_check')
            ? 'El expediente aún no acepta el módulo Triage. Actualiza la regla de juegos permitidos en la base de datos.'
            : 'No se pudo registrar el resultado. Intenta de nuevo en unos momentos.'
        );
        return;
      }

      setSaveState('saved');
    },
    [user?.id]
  );

  const finishGame = useCallback(
    (finalAnswers) => {
      const first = finalAnswers.slice(0, 2);
      const last = finalAnswers.slice(Math.max(0, finalAnswers.length - 2));
      const initialPrecision = getAverage(first);
      const finalPrecision = getAverage(last);
      const finalErrors = finalAnswers.filter((answer) => !answer.correct).length;
      const timeResponse = finalAnswers.length
        ? Math.round(
            finalAnswers.reduce((sum, answer) => sum + answer.time_left_seconds, 0) /
              (finalAnswers.length * SECONDS_PER_PATIENT) *
              100
          )
        : 0;
      const nextResults = {
        completionTimeSeconds: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
        correctCount: finalAnswers.filter((answer) => answer.correct).length,
        errorsCount: finalErrors,
        finalPrecision,
        initialPrecision,
        note: notes[Math.floor(Math.random() * notes.length)],
        score: calculateUniversalScore({
          knowledgeDecision: finalPrecision,
          mechanicalPrecision: finalPrecision,
          timeResponse,
        }),
        timeResponse,
      };

      setResults(nextResults);
      persistSession(nextResults, finalAnswers);
    },
    [persistSession]
  );

  const goNext = useCallback(
    (nextAnswers = answers) => {
      if (currentIndex + 1 >= PATIENTS_PER_GAME) {
        finishGame(nextAnswers);
        return;
      }

      setCurrentIndex((index) => index + 1);
      setSecondsLeft(SECONDS_PER_PATIENT);
      setFeedback('');
      setIsLocked(false);
    },
    [answers, currentIndex, finishGame]
  );

  const classifyPatient = useCallback(
    (selectedKey, timedOut = false) => {
      if (isLocked || results || showBriefing || showTutorial) {
        return;
      }

      const correct = !timedOut && selectedKey === currentPatient.expected;
      const answer = {
        correct,
        expected: currentPatient.expected,
        patient_id: currentPatient.id,
        patient_variables: {
          chestPainRisk: currentPatient.chestPainRisk,
          consciousness: currentPatient.consciousness,
          difficultyBreathing: currentPatient.difficultyBreathing,
          hemorrhage: currentPatient.hemorrhage,
          pain: currentPatient.pain,
          source: currentPatient.source,
          temperature: currentPatient.temperature,
        },
        precision: correct ? 100 : 0,
        selected: timedOut ? 'timeout' : selectedKey,
        time_left_seconds: secondsLeft,
      };
      const nextAnswers = [...answers, answer];

      setAnswers(nextAnswers);
      setIsLocked(true);
      setFeedback(
        correct
          ? `Correcto: ${currentPatient.explanation}`
          : timedOut
            ? `Tiempo agotado. MTS esperado: ${manchesterLevels[currentPatient.expected]}. ${currentPatient.explanation}`
            : `Clasificación incorrecta. MTS esperado: ${manchesterLevels[currentPatient.expected]}. ${currentPatient.explanation}`
      );
    },
    [answers, currentPatient, isLocked, results, secondsLeft, showBriefing, showTutorial]
  );

  useEffect(() => {
    if (showBriefing || showTutorial || results || isLocked) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(interval);
          classifyPatient('', true);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [classifyPatient, isLocked, results, showBriefing, showTutorial]);

  useEffect(() => {
    function handleKeyDown(event) {
      const isSpaceKey = event.code === 'Space' || event.key === ' ';

      if (!isSpaceKey) {
        return;
      }

      event.preventDefault();

      if (event.repeat || showBriefing || results || !showTutorial) {
        return;
      }

      dismissTutorial();
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [results, showBriefing, showTutorial]);

  useEffect(() => {
    if (!showTutorial || showBriefing || results) {
      return undefined;
    }

    scrollToGameTop();
    const frameId = window.requestAnimationFrame(scrollToGameTop);

    return () => window.cancelAnimationFrame(frameId);
  }, [results, showBriefing, showTutorial]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [feedback]);

  useEffect(() => {
    if (currentIndex === 0 || showBriefing || showTutorial || results) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      casePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [currentIndex, results, showBriefing, showTutorial]);

  function startSimulation() {
    scrollToGameTop();
    setShowBriefing(false);
    setShowTutorial(true);
  }

  function dismissTutorial() {
    startTimeRef.current = Date.now();
    setShowTutorial(false);
  }

  function resetGame() {
    setPatients(generatePatients());
    setCurrentIndex(0);
    setSecondsLeft(SECONDS_PER_PATIENT);
    setAnswers([]);
    setFeedback('');
    setIsLocked(false);
    setResults(null);
    setSaveState('idle');
    setSaveError('');
    setShowBriefing(true);
    setShowTutorial(false);
  }

  return (
    <main
      className="isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 18%, rgba(249,115,22,0.13), transparent 28%), linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px)',
        backgroundSize: 'auto, 30px 30px, 30px 30px',
      }}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link className="flex h-10 touch-manipulation select-none items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" to="/dashboard">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-100">
            Triage Táctico - Manchester MTS
          </div>
          <ThemeToggle />
        </header>

        {showBriefing ? (
          <Briefing onStart={startSimulation} />
        ) : (
          <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-stretch gap-6 py-6 md:gap-8 md:py-8">
            {showTutorial ? (
              <button
                aria-label="Cerrar tutorial de Manchester Triage"
                className="fixed inset-0 z-50 flex touch-manipulation select-none flex-col items-center justify-center bg-black/70 px-6 text-center backdrop-blur-sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  dismissTutorial();
                }}
                type="button"
              >
                <span className="animate-bounce text-6xl" aria-hidden="true">
                  👇
                </span>
                <span className="mt-4 max-w-sm translate-z-0 transform-gpu rounded-lg border border-orange-300/40 bg-orange-500/20 p-4 text-base font-bold text-white shadow-2xl">
                  Lee los discriminadores clínicos y selecciona la prioridad Manchester correcta.
                </span>
                <span className="mt-3 text-sm text-slate-200">
                  Toca ROJO, NARANJA, AMARILLO, VERDE o AZUL.
                </span>
              </button>
            ) : null}
            <section className="isolate scroll-mt-4 translate-z-0 transform-gpu rounded-lg border border-orange-200 bg-white p-4 shadow-xl dark:border-orange-400/20 dark:bg-slate-900/95 dark:shadow-orange-950/20 md:p-6" ref={casePanelRef}>
              <div className="mb-5 flex flex-col gap-4 rounded-lg border border-orange-300/25 bg-orange-400/10 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-orange-800 dark:text-orange-200">
                    <ClipboardList aria-hidden="true" className="h-4 w-4" />
                    Manchester Triage System
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Clasifica prioridad intrahospitalaria según riesgo clínico y tiempo máximo de atención.
                  </p>
                </div>
                <div className="rounded-md border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-cyan-800 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100">
                  5 niveles MTS
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                    <Siren aria-hidden="true" className="h-4 w-4" />
                    Paciente {currentIndex + 1} de {PATIENTS_PER_GAME}
                  </p>
                  <h1 className="mt-2 break-words text-2xl font-bold leading-tight md:text-3xl">{currentPatient.title}</h1>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800 dark:border-yellow-300/30 dark:bg-yellow-300/10 dark:text-yellow-100">
                  <Timer aria-hidden="true" className="h-5 w-5" />
                  <span className="text-2xl font-bold">{secondsLeft}s</span>
                </div>
              </div>

              <div className="isolate mt-6 translate-z-0 transform-gpu rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-inner dark:border-cyan-300/20 dark:bg-slate-950/90 md:p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tarjeta clínica</p>
                <p className="mt-3 text-lg font-semibold leading-7 text-slate-950 dark:text-white">{currentPatient.scenario}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <ClinicalMetric label="Conciencia" value={getConsciousnessLabel(currentPatient.consciousness)} />
                  <ClinicalMetric label="Hemorragia" value={getHemorrhageLabel(currentPatient.hemorrhage)} />
                  <ClinicalMetric label="Dolor" value={getPainLabel(currentPatient.pain)} />
                  <ClinicalMetric label="Respiración" value={getBreathingLabel(currentPatient.difficultyBreathing)} />
                  <ClinicalMetric label="Temperatura" value={currentPatient.temperature === 'alterada' ? 'Alterada' : 'Normal'} />
                  <ClinicalMetric label="Dolor torácico" value={currentPatient.chestPainRisk ? 'Alto riesgo' : 'No'} />
                </div>
              </div>

              <div className="isolate mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {triageOptions.map((option) => (
                  <button
                    className={`colorblind-triage colorblind-triage-${option.key} min-h-[76px] w-full translate-z-0 transform-gpu touch-manipulation select-none rounded-lg border px-4 py-4 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 md:min-h-24 lg:px-3 ${option.colorClass}`}
                    disabled={isLocked || showTutorial}
                    key={option.key}
                    onClick={() => classifyPatient(option.key)}
                    type="button"
                  >
                    <span className="block text-2xl font-black">{option.label}</span>
                    <span className="block text-xs font-black uppercase opacity-95">{option.time}</span>
                    <span className="mt-1 block text-sm font-semibold opacity-90">{option.subtitle}</span>
                  </button>
                ))}
              </div>

              {feedback ? (
                <div ref={feedbackRef} className={`scroll-mt-4 mt-6 rounded-lg border p-4 text-sm font-semibold ${
                  answers.at(-1)?.correct
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100'
                    : 'border-red-300 bg-red-50 text-red-800 dark:border-red-300/30 dark:bg-red-400/10 dark:text-red-100'
                }`}>
                  {feedback}
                  <button
                    className="mt-4 flex min-h-12 w-full touch-manipulation select-none items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-slate-700 active:scale-95 sm:w-auto"
                    disabled={showTutorial}
                    onClick={() => goNext()}
                    type="button"
                  >
                    {currentIndex + 1 >= PATIENTS_PER_GAME ? 'Ver resultados' : 'Siguiente paciente'}
                  </button>
                </div>
              ) : null}
            </section>

            <aside className="isolate w-full translate-z-0 transform-gpu rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-lg dark:border-slate-700 dark:bg-slate-900/95 dark:text-white dark:shadow-black/20">
              <h2 className="font-bold">Telemetría MTS</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <ClinicalMetric label="Correctos" value={`${correctCount}/${answers.length}`} />
                <ClinicalMetric label="Errores" value={errorsCount} />
                <ClinicalMetric label="Pendientes" value={PATIENTS_PER_GAME - answers.length} />
                <ClinicalMetric label="Tiempo/paciente" value={`${SECONDS_PER_PATIENT}s`} />
              </div>
              <p className="mt-5 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-900 dark:border-orange-300/30 dark:bg-orange-400/10 dark:text-orange-100">
                MTS prioriza por discriminadores: conciencia, hemorragia,
                dolor, respiración, temperatura y signos de alto riesgo.
              </p>
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
      evidenceKey="tactical_triage"
      onStart={handleStart}
      title="Tactical Triage MTS"
      videoId="_B4y6W59WNQ"
      videoTitle="Video tutorial triage hospitalario MTS"
    >
      <BriefingCard title="📖 Instrucciones" variant="instructions">
        <p>
              En computadora y celular: toca o haz clic en uno de los cinco
              niveles Manchester. Lee conciencia, hemorragia, dolor,
              respiración, temperatura y datos de alto riesgo antes de decidir.
              Tendrás {SECONDS_PER_PATIENT} segundos por paciente.
        </p>
      </BriefingCard>
      <BriefingCard title="⚡ Toma de Decisiones Críticas" variant="critical">
        <p>
          La evaluación prioriza asignar correctamente el color Manchester
          desde la primera lectura de los discriminadores. Elegir una prioridad
          inferior ante inconsciencia, hemorragia exanguinante u otra amenaza
          vital penaliza la decisión inicial.
        </p>
      </BriefingCard>
      <BriefingCard title="📖 Cómo clasificar" variant="mechanics">
        <p>
            Primero descarta ROJO: inconsciente, paro, respiración crítica o
            hemorragia exanguinante. Luego busca NARANJA: dolor severo,
            dificultad respiratoria severa, dolor torácico de alto riesgo o
            hemorragia mayor controlable. AMARILLO es urgente, pero estable:
            dolor moderado, fiebre o dificultad respiratoria moderada. VERDE es
            problema menor con síntomas tolerables. AZUL es solicitud sin
            síntomas agudos.
        </p>
      </BriefingCard>
      <BriefingCard title="🎯 Puntuación" variant="score">
        <p>
            La puntuación va de 0 a 100: 40% decisión clínica, 40% precisión de
            clasificación y 20% tiempo restante. Cada paciente correcto suma
            precisión; cada error o tiempo agotado baja el promedio final.
        </p>
      </BriefingCard>
      <BriefingCard title="Niveles MTS">
          <div className="mt-3 grid gap-3">
            {manchesterSteps.map((step) => (
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[120px_1fr]" key={step.color}>
                <div>
                  <p className="font-black text-slate-950 dark:text-white">{step.color}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{step.rule}</p>
                </div>
                <p className="break-words leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
      </BriefingCard>
    </GameBriefingLayout>
  );
}

function ClinicalMetric({ label, value }) {
  const displayValue =
    typeof value === 'string' && value.length
      ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
      : value;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/80">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{displayValue}</p>
    </div>
  );
}

function ResultsModal({ onExit, onRestart, results, saveError, saveState }) {
  return (
    <GameResultsModal
      metrics={[
        { label: 'Inicial', value: `${results.initialPrecision}%` },
        { label: 'Final', value: `${results.finalPrecision}%` },
        { label: 'Puntuación', value: results.score },
      ]}
      onExit={onExit}
      onRestart={onRestart}
      restartLabel="Nuevo turno MTS"
      saveError={saveError}
      saveState={saveState}
      score={results.score}
      title="Triage Manchester completado"
    >
      <p className="mt-4 break-words rounded-xl border border-cyan-300 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100 md:text-base">
        {results.note}
      </p>
    </GameResultsModal>
  );
}
