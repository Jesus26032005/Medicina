import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Gauge, RotateCcw, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import ClinicalEvidenceDisclosure from '../common/ClinicalEvidenceDisclosure';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const MAX_PRESSURE = 100;
const BLEEDING_START_PERCENT = 100;
const IDEAL_PRESSURE_MIN = 65;
const IDEAL_PRESSURE_MAX = 85;
const CRITICAL_TISSUE_DAMAGE = 100;

const cases = [
  {
    bleedRate: 'alta',
    description: 'Sangrado muy fuerte en el brazo. Hay que aplicar tensión suficiente para detenerlo.',
    id: 'arm_amputation_machinery',
    pressureGain: 12,
    title: 'Amputación de brazo por maquinaria',
  },
  {
    bleedRate: 'media',
    description: 'Corte profundo en pierna con sangrado constante de pérdida media.',
    id: 'leg_glass_laceration',
    pressureGain: 10,
    title: 'Laceración profunda en pierna por cristal',
  },
  {
    bleedRate: 'moderada',
    description: 'Herida profunda en antebrazo; el sangrado no se detiene solo.',
    id: 'forearm_stab_wound',
    pressureGain: 9,
    title: 'Herida punzocortante en antebrazo',
  },
  {
    bleedRate: 'muy alta',
    description: 'Sangrado a chorros en el muslo: requiere tensión rápida y sostenida.',
    id: 'thigh_gunshot_arterial',
    pressureGain: 13,
    title: 'Herida por arma de fuego en muslo',
  },
  {
    bleedRate: 'alta',
    description: 'Corte irregular y profundo con mucha sangre y tejido expuesto.',
    id: 'forearm_chainsaw_deep_cut',
    pressureGain: 12,
    title: 'Corte profundo por motosierra en antebrazo',
  },
  {
    bleedRate: 'media',
    description: 'Desgarro profundo en pantorrilla con sangrado que sigue saliendo.',
    id: 'calf_dog_bite_severe',
    pressureGain: 10,
    title: 'Mordedura grave de perro en pantorrilla',
  },
];

const notes = [
  'Un torniquete se usa cuando una extremidad sangra tanto que la presión directa no basta.',
  'La meta es detener el sangrado visible con tensión sostenida y controlada.',
  'Anotar la hora importa porque el equipo médico necesita saber cuánto tiempo lleva puesto.',
  'Aunque controles el sangrado, en la vida real hay que llamar a emergencias cuanto antes.',
  'El torniquete debe colocarse 5-7 cm arriba de la herida y nunca encima de una articulación.',
];

function pickCase() {
  return cases[Math.floor(Math.random() * cases.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

export default function TourniquetCode() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(() => pickCase());
  const [showBriefing, setShowBriefing] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pressureApplied, setPressureApplied] = useState(0);
  const [activeBleeding, setActiveBleeding] = useState(BLEEDING_START_PERCENT);
  const [tissueDamage, setTissueDamage] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [feedback, setFeedback] = useState('Aplica presión repetidamente hasta que el sangrado llegue a 0%.');
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const samplesRef = useRef([]);
  const startTimeRef = useRef(Date.now());
  const lastErrorRef = useRef(0);
  const pressureRef = useRef(0);
  const tissueDamageRef = useRef(0);
  const activeBleedingRef = useRef(BLEEDING_START_PERCENT);
  const finishTriggeredRef = useRef(false);

  const gameStarted = !showBriefing && !showTutorial;
  const gameOver = Boolean(results);
  const controlPercent = Math.round(100 - activeBleeding);
  const pressureBarClass =
    pressureApplied > IDEAL_PRESSURE_MAX
      ? 'bg-red-600 animate-pulse'
      : pressureApplied >= IDEAL_PRESSURE_MIN
        ? 'bg-teal-500'
        : 'bg-gray-400';
  const pressureStatus =
    pressureApplied > IDEAL_PRESSURE_MAX
      ? 'Peligro: afloja un poco'
      : pressureApplied >= IDEAL_PRESSURE_MIN
        ? 'Presión óptima: controlando sangrado'
        : 'Presión insuficiente';

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
        game_key: 'tourniquet_code',
        initial_precision: nextResults.initialPrecision,
        final_precision: nextResults.finalPrecision,
        completion_time_seconds: nextResults.completionTimeSeconds,
        errors_count: nextResults.errorsCount,
        score: nextResults.score,
        telemetry: {
          case_id: caseData.id,
          objective: 'active_bleeding_100_to_0',
          critical_tissue_damage: CRITICAL_TISSUE_DAMAGE,
          ideal_pressure_range: [IDEAL_PRESSURE_MIN, IDEAL_PRESSURE_MAX],
          samples: samplesRef.current,
        },
      });

      if (error) {
        setSaveState('error');
        setSaveError(error.message);
        return;
      }

      setSaveState('saved');
    },
    [caseData.id, user?.id]
  );

  const finishGame = useCallback((options = {}) => {
    const samples = samplesRef.current;
    const first = samples.slice(0, Math.max(1, Math.floor(samples.length / 3)));
    const last = samples.slice(Math.max(0, samples.length - Math.max(1, Math.floor(samples.length / 3))));
    const averageControl = (items) =>
      items.length
        ? Math.round(items.reduce((sum, sample) => sum + sample.control_percent, 0) / items.length)
        : 0;
    const initialPrecision = averageControl(first);
    const finalPrecision = averageControl(last);
    const completionTimeSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const timeResponse = Math.round(clamp(100 - completionTimeSeconds * 2, 20, 100));
    const finalTissueDamage = options.tissueDamage ?? tissueDamage;
    const nextResults = {
      criticalError: Boolean(options.criticalError),
      completionTimeSeconds,
      errorsCount,
      finalPrecision,
      initialPrecision,
      note: options.note ?? notes[Math.floor(Math.random() * notes.length)],
      score: options.criticalError
        ? Math.min(
            25,
            calculateUniversalScore({
              knowledgeDecision: 20,
              mechanicalPrecision: Math.max(0, finalPrecision - finalTissueDamage),
              timeResponse: 0,
            })
          )
        : calculateUniversalScore({
            knowledgeDecision: 100,
            mechanicalPrecision: Math.max(0, finalPrecision - finalTissueDamage * 0.25),
            timeResponse,
          }),
      tissueDamage: Math.round(finalTissueDamage),
      timeResponse,
    };

    setResults(nextResults);
    setFeedback(options.criticalError ? 'Error crítico por exceso de presión.' : 'Hemorragia controlada.');
    persistSession(nextResults);
  }, [errorsCount, persistSession, tissueDamage]);

  const applyPressure = useCallback(() => {
    if (!gameStarted || gameOver) {
      return;
    }

    setPressureApplied((currentPressure) => {
      const nextPressure = clamp(currentPressure + caseData.pressureGain, 0, MAX_PRESSURE);
      if (nextPressure > IDEAL_PRESSURE_MAX) {
        setFeedback('Peligro: exceso de presión. Afloja un poco para evitar daño al tejido o nervios.');
      } else if (nextPressure >= IDEAL_PRESSURE_MIN) {
        setFeedback('Presión óptima: controlando sangrado.');
      } else {
        setFeedback('Aún falta presión: el sangrado sigue activo.');
      }
      return nextPressure;
    });
  }, [caseData.pressureGain, gameOver, gameStarted]);

  useEffect(() => {
    pressureRef.current = pressureApplied;
  }, [pressureApplied]);

  useEffect(() => {
    tissueDamageRef.current = tissueDamage;
  }, [tissueDamage]);

  useEffect(() => {
    activeBleedingRef.current = activeBleeding;
  }, [activeBleeding]);

  useEffect(() => {
    if (!gameStarted || gameOver) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setPressureApplied((currentPressure) => clamp(currentPressure - 4, 0, MAX_PRESSURE));
    }, 140);

    return () => window.clearInterval(interval);
  }, [gameOver, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const currentPressure = pressureRef.current;
      const isIdeal = currentPressure >= IDEAL_PRESSURE_MIN && currentPressure <= IDEAL_PRESSURE_MAX;
      const isExcessive = currentPressure > IDEAL_PRESSURE_MAX;
      const zone = isExcessive ? 'excessive' : isIdeal ? 'ideal' : 'insufficient';

      if (isIdeal) {
        setActiveBleeding((previousBleeding) => {
          const nextBleeding = Math.max(0, previousBleeding - 5);
          activeBleedingRef.current = nextBleeding;
          samplesRef.current.push({
            active_bleeding: Math.round(nextBleeding),
            control_percent: Math.round(100 - nextBleeding),
            elapsed_ms: Date.now() - startTimeRef.current,
            pressure_applied: Math.round(currentPressure),
            tissue_damage: Math.round(tissueDamageRef.current),
            zone,
          });
          return nextBleeding;
        });
        setFeedback('Presión óptima: controlando sangrado.');
        return;
      }

      if (isExcessive) {
        setTissueDamage((previousDamage) => {
          const nextDamage = Math.min(CRITICAL_TISSUE_DAMAGE, previousDamage + 10);
          tissueDamageRef.current = nextDamage;
          samplesRef.current.push({
            active_bleeding: Math.round(activeBleedingRef.current),
            control_percent: Math.round(100 - activeBleedingRef.current),
            elapsed_ms: Date.now() - startTimeRef.current,
            pressure_applied: Math.round(currentPressure),
            tissue_damage: Math.round(nextDamage),
            zone,
          });
          return nextDamage;
        });
        setFeedback('Peligro: exceso de presión. Afloja un poco.');
        return;
      }

      samplesRef.current.push({
        active_bleeding: Math.round(activeBleedingRef.current),
        control_percent: Math.round(100 - activeBleedingRef.current),
        elapsed_ms: Date.now() - startTimeRef.current,
        pressure_applied: Math.round(currentPressure),
        tissue_damage: Math.round(tissueDamageRef.current),
        zone,
      });

      if (Date.now() - lastErrorRef.current > 1800) {
        setErrorsCount((count) => count + 1);
        lastErrorRef.current = Date.now();
      }
      setFeedback('Falta presión sostenida: el sangrado no baja.');
    }, 500);

    return () => window.clearInterval(interval);
  }, [gameOver, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || finishTriggeredRef.current || activeBleeding > 0) {
      return;
    }

    finishTriggeredRef.current = true;
    finishGame();
  }, [activeBleeding, finishGame, gameOver, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || finishTriggeredRef.current || tissueDamage < CRITICAL_TISSUE_DAMAGE) {
      return;
    }

    finishTriggeredRef.current = true;
    finishGame({
      criticalError: true,
      note: 'Error crítico: Has causado daño permanente por exceso de presión.',
      tissueDamage,
    });
  }, [finishGame, gameOver, gameStarted, tissueDamage]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        applyPressure();
      }
    };

    if (gameStarted && !gameOver) {
      window.addEventListener('keydown', handleKeyDown, { passive: false });
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applyPressure, gameOver, gameStarted]);

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
    pressureRef.current = 0;
    tissueDamageRef.current = 0;
    activeBleedingRef.current = BLEEDING_START_PERCENT;
    finishTriggeredRef.current = false;
    setPressureApplied(0);
    setActiveBleeding(BLEEDING_START_PERCENT);
    setTissueDamage(0);
    setErrorsCount(0);
    setFeedback('Aplica presión repetidamente hasta que el sangrado llegue a 0%.');
    setShowBriefing(false);
    setShowTutorial(true);
  }

  function dismissTutorial(event) {
    event?.preventDefault();
    event?.stopPropagation();
    startTimeRef.current = Date.now();
    lastErrorRef.current = Date.now();
    setShowTutorial(false);
  }

  function resetGame() {
    setCaseData(pickCase());
    setResults(null);
    setShowBriefing(true);
    setShowTutorial(false);
    setPressureApplied(0);
    setActiveBleeding(BLEEDING_START_PERCENT);
    setTissueDamage(0);
    setErrorsCount(0);
    setFeedback('Aplica presión repetidamente hasta que el sangrado llegue a 0%.');
    setSaveState('idle');
    setSaveError('');
    samplesRef.current = [];
    pressureRef.current = 0;
    tissueDamageRef.current = 0;
    activeBleedingRef.current = BLEEDING_START_PERCENT;
    finishTriggeredRef.current = false;
    lastErrorRef.current = 0;
  }

  return (
    <main className="isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200" to="/dashboard">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100">
            Código Torniquete
          </div>
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" />
        </header>

        {showBriefing ? (
          <Briefing caseData={caseData} onStart={startSimulation} />
        ) : (
          <div className="relative grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {showTutorial ? (
              <button
                aria-label="Cerrar tutorial de Código Torniquete"
                className="fixed inset-0 z-50 flex touch-manipulation select-none flex-col items-center justify-center bg-black/70 px-6 text-center backdrop-blur-sm"
                onClick={dismissTutorial}
                onPointerDown={dismissTutorial}
                type="button"
              >
                <span className="animate-bounce text-6xl" aria-hidden="true">
                  👇
                </span>
                <span className="mt-4 max-w-sm translate-z-0 transform-gpu rounded-lg border border-rose-300/40 bg-rose-500/20 p-4 text-base font-bold text-white shadow-2xl">
                  Mantén la presión entre 65% y 85%. Si pasas de 85%, sube el daño al tejido.
                </span>
                <span className="mt-3 text-sm text-slate-200">
                  En celular toca el botón. En computadora usa barra espaciadora.
                </span>
              </button>
            ) : null}

            <section className="isolate translate-z-0 transform-gpu rounded-lg border border-white/10 bg-white/5 p-4 md:p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-300">{caseData.bleedRate} pérdida</p>
              <h1 className="mt-2 text-2xl font-bold md:text-4xl">{caseData.title}</h1>
              <p className="mt-3 text-slate-300">{caseData.description}</p>
              <div className="mt-4 rounded-md border border-rose-300/30 bg-rose-400/10 p-3 text-sm font-semibold text-rose-100">
                Coloca el torniquete 5-7 cm arriba de la herida. Nunca sobre una articulación.
              </div>

              <div className="isolate mt-6 translate-z-0 transform-gpu rounded-lg border border-white/10 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <span>Sangrado activo</span>
                  <span>{Math.round(activeBleeding)}%</span>
                </div>
                <div className="mt-3 h-9 overflow-hidden rounded-full bg-emerald-400/20">
                  <motion.div
                    animate={{ width: `${activeBleeding}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-red-700 to-rose-500"
                    transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>Controlado 0%</span>
                  <span>Activo 100%</span>
                </div>
              </div>

              <div className="isolate mt-6 translate-z-0 transform-gpu rounded-lg border border-white/10 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <span>Daño tisular</span>
                  <span>{Math.round(tissueDamage)}%</span>
                </div>
                <div className="mt-3 h-8 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: `${tissueDamage}%` }}
                    className="h-full rounded-full bg-red-600"
                    transition={{ type: 'spring', stiffness: 130, damping: 18 }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  El daño aumenta si mantienes la presión por encima de {IDEAL_PRESSURE_MAX}%.
                </p>
              </div>

              <div className="isolate mt-6 translate-z-0 transform-gpu rounded-lg border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-rose-950/20">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <span>Barra de tensión</span>
                  <span>{Math.round(pressureApplied)}%</span>
                </div>
                <div className="mt-3 h-10 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: `${pressureApplied}%` }}
                    className={`h-full rounded-full ${pressureBarClass}`}
                    transition={{ type: 'spring', stiffness: 130, damping: 18 }}
                  />
                </div>
                <p className={`mt-2 text-sm font-bold ${
                  pressureApplied > IDEAL_PRESSURE_MAX
                    ? 'text-red-200'
                    : pressureApplied >= IDEAL_PRESSURE_MIN
                      ? 'text-teal-200'
                      : 'text-slate-300'
                }`}>
                  {pressureStatus}
                </p>
              </div>

              <button
                className="mt-6 flex h-14 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-md bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={showTutorial}
                onClick={applyPressure}
                onTouchStart={(event) => {
                  event.preventDefault();
                  applyPressure();
                }}
                style={{ touchAction: 'manipulation' }}
                type="button"
              >
                <Gauge aria-hidden="true" className="h-5 w-5" />
                Aplicar presión
              </button>
            </section>

            <aside className="isolate translate-z-0 transform-gpu rounded-lg border border-white/10 bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
              <h2 className="font-bold">Telemetría</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Control" value={`${controlPercent}%`} />
                <Metric label="Errores" value={errorsCount} />
                <Metric label="Sangrado" value={`${Math.round(activeBleeding)}%`} />
                <Metric label="Presión" value={`${Math.round(pressureApplied)}%`} />
                <Metric label="Daño" value={`${Math.round(tissueDamage)}%`} />
              </div>
              <div className={`mt-5 rounded-md border p-4 text-sm font-semibold ${
                pressureApplied > IDEAL_PRESSURE_MAX
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : pressureApplied >= IDEAL_PRESSURE_MIN
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}>
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
      <div className="isolate w-full max-w-3xl translate-z-0 transform-gpu rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white md:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Briefing médico</p>
        <h1 className="mt-2 text-3xl font-bold">{caseData.title}</h1>
        <p className="mt-3 text-slate-700 dark:text-slate-300">{caseData.description}</p>
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100">
          <h2 className="font-bold">Instrucciones</h2>
          <p className="mt-2 leading-6">
            En computadora: presiona repetidamente la barra espaciadora o el botón.
            En celular: toca Aplicar presión. La zona ideal es 65% a 85%:
            ahí el sangrado baja rápido. Si pasas de 85%, el sangrado puede
            detenerse, pero sube el daño al tejido y nervios.
          </p>
        </div>
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100">
          Coloca el torniquete 5-7 cm arriba de la herida y nunca encima de una articulación.
        </div>
        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <h2 className="font-bold text-cyan-950 dark:text-cyan-100">Cómo se mide Inicio vs Final</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
            Inicio es el control del sangrado durante el primer tercio de la partida.
            Final es el control durante el último tercio. La meta es hemorragia controlada: 0% de sangrado activo.
          </p>
        </div>
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/30 dark:bg-emerald-400/10">
          <h2 className="font-bold text-emerald-950 dark:text-emerald-100">Cómo se calcula el score</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900 dark:text-emerald-100">
            El score va de 0 a 100: 40% decisión clínica de controlar la
            hemorragia, 40% precisión manteniendo tensión útil sin excederte y
            20% tiempo. Si pasas demasiado tiempo por arriba de 85%, sube el
            daño tisular y el resultado se penaliza fuerte.
          </p>
        </div>
        <MedicalDisclaimer />
        <ClinicalEvidenceDisclosure moduleKey="tourniquet_code" />
        <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3">
          <button className="h-12 touch-manipulation select-none rounded-md bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700" onClick={onStart} type="button">
            Entendido, iniciar simulación
          </button>
          <VideoTutorialModal title="Video tutorial control de hemorragias" videoId="llgVqL8HyiI" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function ResultsModal({ onExit, onRestart, results, saveError, saveState }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="isolate max-h-[85dvh] w-full max-w-xl translate-z-0 transform-gpu overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white md:p-8"
        initial={{ opacity: 0, y: 18 }}
      >
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
          <BookOpen aria-hidden="true" className="h-4 w-4" />
          Retroalimentación clínica
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          {results.criticalError ? 'Error crítico por exceso de presión' : 'Hemorragia controlada'}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Inicial" value={`${results.initialPrecision}%`} />
          <Metric label="Final" value={`${results.finalPrecision}%`} />
          <Metric label="Score" value={results.score} />
          <Metric label="Daño tisular" value={`${results.tissueDamage}%`} />
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
          <button className="h-12 w-full touch-manipulation select-none rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto" onClick={onRestart} type="button">
            Nuevo caso
          </button>
        </div>
      </motion.section>
    </div>
  );
}
