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

const clinicalCases = [
  {
    answer: 'green',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 1,
    explanation: 'Paso 1 START: si puede caminar, se clasifica VERDE. Dolor o gritos no cambian la prioridad si camina.',
    obeysCommands: true,
    radialPulse: true,
    respirations: 24,
    scenario: 'Mujer joven camina hacia el punto de reunion, grita por dolor en el brazo y responde preguntas.',
    title: 'Camina y grita de dolor',
    walks: true,
  },
  {
    answer: 'green',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 1,
    explanation: 'Paso 1 START: quien camina va a VERDE para despejar la escena y dejar recursos a quienes no caminan.',
    obeysCommands: true,
    radialPulse: true,
    respirations: 22,
    scenario: 'Hombre camina con ayuda minima, tiene raspones en la cara y puede decir su nombre.',
    title: 'Ambulante con heridas menores',
    walks: true,
  },
  {
    answer: 'black',
    airwayOpened: true,
    breathingAfterAirway: false,
    capillaryRefillSeconds: null,
    explanation: 'Paso 2 START: si no respira, se abre la via aerea. Si aun asi no respira, se clasifica NEGRO.',
    obeysCommands: false,
    radialPulse: false,
    respirations: 0,
    scenario: 'No camina, esta inmovil y no respira. Abres la via aerea y sigue sin respirar.',
    title: 'No respira tras abrir via aerea',
    walks: false,
  },
  {
    answer: 'black',
    airwayOpened: true,
    breathingAfterAirway: false,
    capillaryRefillSeconds: null,
    explanation: 'Paso 2 START: ausencia de respiracion despues de abrir via aerea corresponde a NEGRO.',
    obeysCommands: false,
    radialPulse: false,
    respirations: 0,
    scenario: 'Adulto atrapado, no camina, no respira; tras maniobra de apertura de via aerea no inicia respiracion.',
    title: 'Apnea persistente',
    walks: false,
  },
  {
    answer: 'red',
    airwayOpened: true,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 2,
    explanation: 'Paso 2 START: si no respiraba y vuelve a respirar despues de abrir la via aerea, se clasifica ROJO.',
    obeysCommands: false,
    radialPulse: true,
    respirations: 12,
    scenario: 'No camina. No respiraba al inicio, abres la via aerea y empieza a respirar a 12 rpm.',
    title: 'Respira tras abrir via aerea',
    walks: false,
  },
  {
    answer: 'red',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 1,
    explanation: 'Paso 3 START: si no camina y respira mas de 30 rpm, se clasifica ROJO.',
    obeysCommands: true,
    radialPulse: true,
    respirations: 34,
    scenario: 'Mujer no camina, respira a 34 rpm, tiene pulso radial y puede apretar tu mano.',
    title: 'Respiracion mayor a 30 rpm',
    walks: false,
  },
  {
    answer: 'red',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 3,
    explanation: 'Paso 4 START: si no hay pulso radial (pulso en la muñeca) o el llenado capilar (tiempo en que la sangre vuelve a la piel) es mayor a 2 segundos, se clasifica ROJO.',
    obeysCommands: true,
    radialPulse: false,
    respirations: 24,
    scenario: 'Hombre, no camina, respira a 24 rpm, no tiene pulso radial, esta consciente.',
    title: 'Sin pulso radial',
    walks: false,
  },
  {
    answer: 'red',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 4,
    explanation: 'Paso 4 START: llenado capilar (tiempo en que la sangre vuelve a la piel) mayor a 2 segundos indica mala circulacion. Clasificacion ROJO.',
    obeysCommands: true,
    radialPulse: true,
    respirations: 26,
    scenario: 'No camina, respira a 26 rpm, tiene pulso radial debil, llenado capilar de 4 segundos y obedece.',
    title: 'Llenado capilar lento',
    walks: false,
  },
  {
    answer: 'red',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 1,
    explanation: 'Paso 5 START: si no obedece ordenes simples o balbucea, se clasifica ROJO.',
    obeysCommands: false,
    radialPulse: true,
    respirations: 22,
    scenario: 'No camina, respira a 22 rpm, tiene pulso radial, pero balbucea y no aprieta tu mano.',
    title: 'No obedece ordenes',
    walks: false,
  },
  {
    answer: 'yellow',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 1,
    explanation: 'Paso 5 START: si no camina, respira menor o igual a 30, tiene buena circulacion y obedece, es AMARILLO.',
    obeysCommands: true,
    radialPulse: true,
    respirations: 18,
    scenario: 'No camina por dolor de pierna, respira a 18 rpm, pulso radial presente, llenado capilar 1 segundo y obedece.',
    title: 'Diferido estable',
    walks: false,
  },
  {
    answer: 'yellow',
    airwayOpened: false,
    breathingAfterAirway: true,
    capillaryRefillSeconds: 2,
    explanation: 'Paso 5 START: no camina, pero respira <=30, la sangre circula bien y obedece. Clasificacion AMARILLO.',
    obeysCommands: true,
    radialPulse: true,
    respirations: 28,
    scenario: 'No puede levantarse, respira 28 rpm, pulso radial presente, llenado capilar 2 segundos y aprieta la mano.',
    title: 'No ambulante perfundido',
    walks: false,
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

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function calculateNormalizedScore(initialPrecision, finalPrecision, errorsCount) {
  const improvementBonus = Math.max(0, finalPrecision - initialPrecision) * 0.5;
  return Math.round(clamp(finalPrecision - errorsCount * 2 + improvementBonus, 0, 100));
}

function getStartCategory(patient) {
  if (patient.walks) {
    return 'green';
  }

  if (patient.respirations === 0) {
    return patient.breathingAfterAirway ? 'red' : 'black';
  }

  if (patient.respirations > 30) {
    return 'red';
  }

  if (!patient.radialPulse || patient.capillaryRefillSeconds > 2) {
    return 'red';
  }

  if (!patient.obeysCommands) {
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
  const [patients, setPatients] = useState(() => shuffle(clinicalCases).slice(0, PATIENTS_PER_GAME));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_PATIENT);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
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
        setSaveError('No se pudo guardar: falta sesion activa o Supabase.');
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
          protocol: 'START',
          total_patients: PATIENTS_PER_GAME,
        },
      });

      if (error) {
        setSaveState('error');
        setSaveError(error.message);
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
      const nextResults = {
        completionTimeSeconds: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
        correctCount: finalAnswers.filter((answer) => answer.correct).length,
        errorsCount: finalErrors,
        finalPrecision,
        initialPrecision,
        note: notes[Math.floor(Math.random() * notes.length)],
        score: calculateNormalizedScore(initialPrecision, finalPrecision, finalErrors),
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
      if (isLocked || results || showBriefing) {
        return;
      }

      const expectedCategory = getStartCategory(currentPatient);
      const correct = !timedOut && selectedKey === expectedCategory;
      const answer = {
        correct,
        expected: expectedCategory,
        patient_id: currentPatient.title,
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
    [answers, currentPatient, isLocked, results, secondsLeft, showBriefing]
  );

  useEffect(() => {
    if (showBriefing || results || isLocked) {
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
  }, [classifyPatient, isLocked, results, showBriefing]);

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
    startTimeRef.current = Date.now();
    setShowBriefing(false);
  }

  function resetGame() {
    setPatients(shuffle(clinicalCases).slice(0, PATIENTS_PER_GAME));
    setCurrentIndex(0);
    setSecondsLeft(SECONDS_PER_PATIENT);
    setAnswers([]);
    setFeedback('');
    setIsLocked(false);
    setResults(null);
    setSaveState('idle');
    setSaveError('');
    setShowBriefing(true);
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
          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_340px]">
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
        <div className="mt-6 flex flex-wrap gap-3">
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
        className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white"
        initial={{ opacity: 0, y: 18 }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">Notas de la IA</p>
        <h2 className="mt-1 text-2xl font-bold">Triage completado</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultMetric label="Inicial" value={`${results.initialPrecision}%`} />
          <ResultMetric label="Final" value={`${results.finalPrecision}%`} />
          <ResultMetric label="Score" value={results.score} />
        </div>
        <p className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">{results.note}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? 'Guardando evidencia en Supabase...' : null}
          {saveState === 'saved' ? 'Evidencia guardada en Supabase.' : null}
          {saveState === 'error' ? `No se guardo la evidencia: ${saveError}` : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
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
