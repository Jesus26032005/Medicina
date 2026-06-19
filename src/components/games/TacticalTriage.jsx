import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Siren,
  Timer,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const PATIENTS_PER_GAME = 5;
const SECONDS_PER_PATIENT = 15;

const triageOptions = [
  {
    colorClass: 'bg-emerald-600 hover:bg-emerald-700',
    key: 'green',
    label: 'VERDE',
    subtitle: 'Leve',
  },
  {
    colorClass: 'bg-yellow-500 hover:bg-yellow-600',
    key: 'yellow',
    label: 'AMARILLO',
    subtitle: 'Diferido',
  },
  {
    colorClass: 'bg-red-600 hover:bg-red-700',
    key: 'red',
    label: 'ROJO',
    subtitle: 'Inmediato',
  },
  {
    colorClass: 'bg-slate-950 hover:bg-slate-800 dark:bg-black dark:hover:bg-slate-800',
    key: 'black',
    label: 'NEGRO',
    subtitle: 'Fallecido',
  },
];

const notes = [
  'START busca decisiones rapidas: caminar, respirar, circulacion y estado mental.',
  'En incidentes con muchas victimas, clasificar rapido ayuda a usar mejor los recursos disponibles.',
  'El color verde no significa sin dolor; significa que puede caminar y esperar.',
  'Respirar mas de 30 por minuto es una bandera roja en START.',
  'No obedecer ordenes simples puede indicar que el cerebro o la circulacion estan fallando.',
];

const startSteps = [
  {
    color: 'VERDE',
    description: 'Si la victima puede caminar, se localiza como verde aunque tenga dolor o este asustada.',
    rule: 'Camina',
  },
  {
    color: 'NEGRO',
    description: 'Si no respira, abre la via aerea. Si aun asi no respira, se clasifica como negro.',
    rule: 'No respira tras abrir via aerea',
  },
  {
    color: 'ROJO',
    description: 'Si respira >30, no tiene pulso radial (pulso en la muñeca), llenado capilar (sangre vuelve a la piel) >2 s o no obedece ordenes, es rojo.',
    rule: '30 - 2 - Puede',
  },
  {
    color: 'AMARILLO',
    description: 'Si no camina, pero respira menos de 30/min, tiene pulso radial y obedece, es amarillo.',
    rule: 'Puede esperar vigilancia',
  },
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

function generatePatient(index) {
  const canWalk = chance(0.22);
  const noInitialBreathing = !canWalk && chance(0.18);
  const breathesAfterAirway = noInitialBreathing ? chance(0.45) : true;
  const respiratoryRate = noInitialBreathing
    ? breathesAfterAirway
      ? randomItem([10, 12, 16])
      : 0
    : canWalk
      ? randomItem([18, 20, 22, 24])
      : randomItem([18, 22, 26, 28, 32, 36, 40]);
  const capillaryRefill = respiratoryRate === 0 ? null : randomItem([1, 2, 3, 4]);
  const radialPulse = capillaryRefill !== null && capillaryRefill <= 2 && chance(0.82);
  const mentalStatus = canWalk || chance(0.68) ? 'follows' : randomItem(['confused', 'unconscious']);
  const mechanism = randomItem([
    'explosion con varias victimas',
    'choque vehicular multiple',
    'colapso de estructura',
    'incendio en zona industrial',
    'accidente en transporte publico',
  ]);
  const title = canWalk
    ? `Paciente ${index}: ambulante`
    : respiratoryRate === 0
      ? `Paciente ${index}: no respira`
      : `Paciente ${index}: no puede caminar`;
  const scenarioParts = [
    `${title} tras ${mechanism}.`,
    canWalk ? 'Camina hacia ti con dolor.' : 'Permanece en el suelo y no puede caminar.',
    respiratoryRate === 0
      ? breathesAfterAirway
        ? 'No respiraba al inicio; al abrir la via aerea vuelve a respirar.'
        : 'No respiraba al inicio; abres la via aerea y sigue sin respirar.'
      : `Respira a ${respiratoryRate} rpm.`,
    capillaryRefill === null
      ? 'Llenado capilar no valorable.'
      : `Llenado capilar (tiempo en que la sangre vuelve a la piel): ${capillaryRefill}s.`,
    radialPulse ? 'Tiene pulso radial en la muñeca.' : 'No se palpa pulso radial claro.',
    mentalStatus === 'follows'
      ? 'Obedece la orden simple de apretar tu mano.'
      : mentalStatus === 'confused'
        ? 'Balbucea y no sigue una orden simple.'
        : 'Esta inconsciente y no responde ordenes simples.',
  ];

  return {
    airwayOpened: noInitialBreathing,
    breathesAfterAirway,
    breathingAfterAirway: breathesAfterAirway,
    canWalk,
    capillaryRefill,
    capillaryRefillSeconds: capillaryRefill,
    explanation: getStartExplanation({
      canWalk,
      breathesAfterAirway,
      respiratoryRate,
      capillaryRefill,
      radialPulse,
      mentalStatus,
    }),
    mentalStatus,
    obeysCommands: mentalStatus === 'follows',
    radialPulse,
    respiratoryRate,
    respirations: respiratoryRate,
    scenario: scenarioParts.join(' '),
    title,
    walks: canWalk,
  };
}

function generatePatients() {
  return Array.from({ length: PATIENTS_PER_GAME }, (_, index) => generatePatient(index + 1));
}

function getStartExplanation(patient) {
  if (patient.canWalk) {
    return 'Paso 1 START: si puede caminar, se clasifica VERDE para despejar la escena y atender primero a quien no camina.';
  }

  if (patient.respiratoryRate === 0) {
    return patient.breathesAfterAirway
      ? 'Paso 2 START: si no respiraba y vuelve a respirar al abrir la via aerea, se clasifica ROJO.'
      : 'Paso 2 START: si no respira incluso despues de abrir la via aerea, se clasifica NEGRO.';
  }

  if (patient.respiratoryRate > 30) {
    return 'Paso 3 START: si no camina y respira mas de 30 veces por minuto, se clasifica ROJO.';
  }

  if (!patient.radialPulse || patient.capillaryRefill > 2) {
    return 'Paso 4 START: si no hay pulso radial o el llenado capilar tarda mas de 2 segundos, la circulacion falla y se clasifica ROJO.';
  }

  if (patient.mentalStatus !== 'follows') {
    return 'Paso 5 START: si no obedece ordenes simples, se clasifica ROJO.';
  }

  return 'Paso 5 START: si no camina, respira a 30 o menos, tiene buena circulacion y obedece ordenes, se clasifica AMARILLO.';
}

function scrollToGameTop() {
  window.scrollTo({ behavior: 'auto', left: 0, top: 0 });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function getStartCategory(patient) {
  if (patient.canWalk) {
    return 'green';
  }

  if (patient.respiratoryRate === 0) {
    return patient.breathesAfterAirway ? 'red' : 'black';
  }

  if (patient.respiratoryRate > 30) {
    return 'red';
  }

  if (!patient.radialPulse || patient.capillaryRefill > 2) {
    return 'red';
  }

  if (patient.mentalStatus !== 'follows') {
    return 'red';
  }

  return 'yellow';
}

function getAverage(items) {
  return items.length
    ? Math.round(items.reduce((sum, item) => sum + item.precision, 0) / items.length)
    : 0;
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

  const currentPatient = patients[currentIndex];
  const errorsCount = answers.filter((answer) => !answer.correct).length;
  const correctCount = answers.filter((answer) => answer.correct).length;

  const persistSession = useCallback(
    async (nextResults, finalAnswers) => {
      if (!supabase || !user?.id) {
        setSaveState('error');
        setSaveError('No se pudo guardar: falta una sesion activa o conexion con el expediente.');
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
          generator: 'procedural_start',
          protocol: 'START',
          total_patients: PATIENTS_PER_GAME,
        },
      });

      if (error) {
        setSaveState('error');
        setSaveError(
          error.message?.includes('game_sessions_game_key_check')
            ? 'El expediente aun no acepta el modulo Triage. Actualiza la regla de juegos permitidos en la base de datos.'
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

      const expectedCategory = getStartCategory(currentPatient);
      const correct = !timedOut && selectedKey === expectedCategory;
      const answer = {
        correct,
        expected: expectedCategory,
        patient_id: currentPatient.title,
        patient_variables: {
          breathesAfterAirway: currentPatient.breathesAfterAirway,
          canWalk: currentPatient.canWalk,
          capillaryRefill: currentPatient.capillaryRefill,
          mentalStatus: currentPatient.mentalStatus,
          radialPulse: currentPatient.radialPulse,
          respiratoryRate: currentPatient.respiratoryRate,
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
            ? `Tiempo agotado. Regla START: ${currentPatient.explanation}`
            : `Clasificacion incorrecta. Regla START: ${currentPatient.explanation}`
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
      if (event.code !== 'Space') {
        return;
      }

      event.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link className="flex h-10 touch-manipulation select-none items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10" to="/dashboard">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-100">
            Triage Tactico - START
          </div>
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" />
        </header>

        {showBriefing ? (
          <Briefing onStart={startSimulation} />
        ) : (
          <div className="relative grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {showTutorial ? (
              <button
                aria-label="Cerrar tutorial de triage tactico"
                className="fixed inset-0 z-50 flex touch-manipulation select-none flex-col items-center justify-center bg-black/70 px-6 text-center backdrop-blur-sm"
                onClick={dismissTutorial}
                type="button"
              >
                <span className="animate-bounce text-6xl" aria-hidden="true">
                  👇
                </span>
                <span className="mt-4 max-w-sm rounded-lg border border-red-300/40 bg-red-500/20 p-4 text-base font-bold text-white shadow-2xl">
                  Lee el caso y selecciona la accion medica correcta.
                </span>
                <span className="mt-3 text-sm text-slate-200">
                  Toca VERDE, AMARILLO, ROJO o NEGRO segun la regla START.
                </span>
              </button>
            ) : null}
            <section className="rounded-lg border border-red-400/20 bg-white/5 p-6 shadow-2xl shadow-red-950/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-300">
                    <Siren aria-hidden="true" className="h-4 w-4" />
                    Victima {currentIndex + 1} de {PATIENTS_PER_GAME}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold">{currentPatient.title}</h1>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-yellow-100">
                  <Timer aria-hidden="true" className="h-5 w-5" />
                  <span className="text-2xl font-bold">{secondsLeft}s</span>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-white/10 bg-slate-900 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Tarjeta clinica</p>
                <p className="mt-3 text-xl font-semibold text-white">{currentPatient.scenario}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <ClinicalMetric label="Camina" value={currentPatient.walks ? 'Si' : 'No'} />
                  <ClinicalMetric label="Respira" value={`${currentPatient.respirations}/min`} />
                  <ClinicalMetric label="Llenado capilar (piel)" value={currentPatient.capillaryRefillSeconds === null ? 'No aplica' : `${currentPatient.capillaryRefillSeconds}s`} />
                  <ClinicalMetric label="Via aerea" value={currentPatient.airwayOpened ? 'Abierta' : 'No requerida'} />
                  <ClinicalMetric label="Pulso radial" value={currentPatient.radialPulse ? 'Si' : 'No'} />
                  <ClinicalMetric label="Obedece" value={currentPatient.obeysCommands ? 'Si' : 'No'} />
                </div>
              </div>

              <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                {triageOptions.map((option) => (
                  <button
                    className={`min-h-20 w-full touch-manipulation select-none rounded-lg px-5 py-4 text-left text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-24 ${option.colorClass}`}
                    disabled={isLocked}
                    key={option.key}
                    onClick={() => classifyPatient(option.key)}
                    type="button"
                  >
                    <span className="block text-2xl font-black">{option.label}</span>
                    <span className="text-sm font-semibold opacity-90">{option.subtitle}</span>
                  </button>
                ))}
              </div>

              {feedback ? (
                <div className={`mt-6 rounded-lg border p-4 text-sm font-semibold ${
                  answers.at(-1)?.correct
                    ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                    : 'border-red-300/30 bg-red-400/10 text-red-100'
                }`}>
                  {feedback}
                  <button
                    className="mt-4 flex h-12 w-full touch-manipulation select-none items-center justify-center rounded-md bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-100 sm:w-auto"
                    onClick={() => goNext()}
                    type="button"
                  >
                    {currentIndex + 1 >= PATIENTS_PER_GAME ? 'Ver resultados' : 'Siguiente paciente'}
                  </button>
                </div>
              ) : null}
            </section>

            <aside className="rounded-lg border border-white/10 bg-slate-900 p-5">
              <h2 className="font-bold">Telemetria START</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ClinicalMetric label="Correctos" value={`${correctCount}/${answers.length}`} />
                <ClinicalMetric label="Errores" value={errorsCount} />
                <ClinicalMetric label="Pendientes" value={PATIENTS_PER_GAME - answers.length} />
                <ClinicalMetric label="Tiempo/paciente" value={`${SECONDS_PER_PATIENT}s`} />
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300">
                START se decide en este orden: caminar, respiracion, pulso radial
                (pulso en la muñeca) o llenado capilar (sangre vuelve a la
                piel), y capacidad de obedecer ordenes simples.
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
  return (
    <section className="grid flex-1 place-items-center py-10">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white"
        initial={{ opacity: 0, y: 16 }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          Briefing medico
        </p>
        <h1 className="mt-2 text-3xl font-bold">Triage Tactico</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-bold">Instrucciones</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              En computadora y celular: toca o haz clic en uno de los cuatro
              colores para clasificar cada paciente. Verde si camina, negro si
              no respira despues de abrir via aerea, rojo si necesita ayuda
              inmediata y amarillo si puede esperar.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-bold">Inicio vs Final</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Inicio es el promedio de precision de los primeros 2 pacientes.
              Final es el promedio de los ultimos 2. Asi se mide si clasificas
              mejor conforme avanza el incidente.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold text-yellow-900 dark:border-yellow-300/30 dark:bg-yellow-400/10 dark:text-yellow-100">
          Tendras {SECONDS_PER_PATIENT} segundos por paciente. Si el tiempo se
          acaba, cuenta como error y se explica la regla START correcta.
        </div>
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <h2 className="font-bold">Como se localiza en START</h2>
          <div className="mt-3 grid gap-3">
            {startSteps.map((step) => (
              <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950 sm:grid-cols-[120px_1fr]" key={step.color}>
                <div>
                  <p className="font-black text-slate-950 dark:text-white">{step.color}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{step.rule}</p>
                </div>
                <p className="leading-6 text-slate-700 dark:text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        <MedicalDisclaimer />
        <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3">
          <button className="h-12 w-full touch-manipulation select-none rounded-md bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 sm:w-auto" onClick={onStart} type="button">
            Entendido, Iniciar Simulacion
          </button>
          <VideoTutorialModal title="Video tutorial triage START" videoId="_B4y6W59WNQ" />
        </div>
      </motion.div>
    </section>
  );
}

function ClinicalMetric({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ResultsModal({ onExit, onRestart, results, saveError, saveState }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[85dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white md:p-8"
        initial={{ opacity: 0, y: 18 }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">Retroalimentacion clinica</p>
        <h2 className="mt-1 text-2xl font-bold">Triage completado</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultMetric label="Inicial" value={`${results.initialPrecision}%`} />
          <ResultMetric label="Final" value={`${results.finalPrecision}%`} />
          <ResultMetric label="Score" value={results.score} />
        </div>
        <p className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">{results.note}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? 'Guardando tu progreso...' : null}
          {saveState === 'saved' ? 'Progreso guardado en tu expediente.' : null}
          {saveState === 'error' ? `No se pudo registrar el progreso: ${saveError}` : null}
        </div>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 md:flex-row md:justify-end md:gap-4">
          <button className="h-12 w-full touch-manipulation select-none rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 sm:w-auto" onClick={onExit} type="button">
            Salir al Dashboard
          </button>
          <button className="h-12 w-full touch-manipulation select-none rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto" onClick={onRestart} type="button">
            Nuevo incidente
          </button>
        </div>
      </motion.section>
    </div>
  );
}

function ResultMetric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
