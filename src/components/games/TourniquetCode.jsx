import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gauge, RotateCcw, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const MAX_PRESSURE = 120;
const BLEEDING_START_PERCENT = 100;

const cases = [
  {
    id: 'arm_amputation_machinery',
    title: 'Amputacion de brazo por maquinaria',
    description: 'Sangrado muy fuerte en el brazo. Hay que apretar lo suficiente para detenerlo.',
    controlThreshold: 78,
    bleedRate: 'alta',
  },
  {
    id: 'leg_glass_laceration',
    title: 'Laceracion profunda en pierna por cristal',
    description: 'Corte profundo en pierna con sangrado constante de perdida media.',
    controlThreshold: 56,
    bleedRate: 'media',
  },
  {
    id: 'forearm_stab_wound',
    title: 'Herida punzocortante en antebrazo',
    description: 'Herida profunda en antebrazo; el sangrado no se detiene solo.',
    controlThreshold: 48,
    bleedRate: 'moderada',
  },
  {
    id: 'thigh_gunshot_arterial',
    title: 'Herida por arma de fuego en muslo',
    description: 'Sangrado a chorros en el muslo: este caso necesita mucha presion.',
    controlThreshold: 88,
    bleedRate: 'muy alta',
  },
  {
    id: 'forearm_chainsaw_deep_cut',
    title: 'Corte profundo por motosierra en antebrazo',
    description: 'Corte irregular y profundo con mucha sangre y tejido expuesto.',
    controlThreshold: 74,
    bleedRate: 'alta',
  },
  {
    id: 'calf_dog_bite_severe',
    title: 'Mordedura grave de perro en pantorrilla',
    description: 'Desgarro profundo en pantorrilla con sangrado que sigue saliendo.',
    controlThreshold: 58,
    bleedRate: 'media',
  },
];

const notes = [
  'Un torniquete se usa cuando una extremidad sangra tanto que la presion directa no basta.',
  'La meta no es apretar por apretar: es detener el sangrado visible con la menor presion necesaria.',
  'Anotar la hora importa porque el equipo medico necesita saber cuanto tiempo lleva puesto.',
  'Aunque controles el sangrado, en la vida real hay que llamar a emergencias cuanto antes.',
  'Si falta presion, la sangre sigue saliendo; si te pasas demasiado, puedes danar nervios y tejidos.',
];

function pickCase() {
  return cases[Math.floor(Math.random() * cases.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getControlEfficiency(pressure, caseData) {
  if (pressure < caseData.controlThreshold * 0.55) {
    return 0;
  }

  if (pressure < caseData.controlThreshold) {
    return Math.round(clamp((pressure / caseData.controlThreshold) * 70, 0, 70));
  }

  if (pressure > 112) {
    return 72;
  }

  return Math.round(clamp(78 + ((pressure - caseData.controlThreshold) / 34) * 22, 78, 100));
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
  const [pressure, setPressure] = useState(0);
  const [activeBleeding, setActiveBleeding] = useState(BLEEDING_START_PERCENT);
  const [isTwisting, setIsTwisting] = useState(false);
  const [errorsCount, setErrorsCount] = useState(0);
  const [feedback, setFeedback] = useState('Coloca el torniquete arriba de la herida y gira la varilla para reducir el sangrado.');
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const samplesRef = useRef([]);
  const startTimeRef = useRef(Date.now());
  const lastWarningRef = useRef('none');

  const controlEfficiency = getControlEfficiency(pressure, caseData);
  const controlPercent = Math.round(100 - activeBleeding);

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
        game_key: 'tourniquet_code',
        initial_precision: nextResults.initialPrecision,
        final_precision: nextResults.finalPrecision,
        completion_time_seconds: nextResults.completionTimeSeconds,
        errors_count: nextResults.errorsCount,
        score: nextResults.score,
        telemetry: {
          case_id: caseData.id,
          control_threshold: caseData.controlThreshold,
          objective: 'reduce_active_bleeding_to_zero',
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
    [caseData, user?.id]
  );

  const finishGame = useCallback(() => {
    const samples = samplesRef.current;
    const first = samples.slice(0, Math.max(1, Math.floor(samples.length / 3)));
    const last = samples.slice(Math.max(0, samples.length - Math.max(1, Math.floor(samples.length / 3))));
    const average = (items) =>
      items.length
        ? Math.round(items.reduce((sum, sample) => sum + sample.control_percent, 0) / items.length)
        : 0;
    const initialPrecision = average(first);
    const finalPrecision = average(last);
    const completionTimeSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const timeResponse = Math.round(clamp(100 - completionTimeSeconds * 2, 20, 100));
    const nextResults = {
      completionTimeSeconds,
      errorsCount,
      finalPrecision,
      initialPrecision,
      note: notes[Math.floor(Math.random() * notes.length)],
      score: calculateUniversalScore({
        knowledgeDecision: 100,
        mechanicalPrecision: finalPrecision,
        timeResponse,
      }),
      timeResponse,
    };

    setResults(nextResults);
    persistSession(nextResults);
  }, [errorsCount, persistSession]);

  const startTwisting = useCallback(() => {
    if (!showBriefing && !showTutorial && !results) {
      setIsTwisting(true);
    }
  }, [results, showBriefing, showTutorial]);

  const stopTwisting = useCallback(() => {
    setIsTwisting(false);
  }, []);

  useEffect(() => {
    if (showBriefing || showTutorial || results) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setPressure((current) => {
        const next = clamp(current + (isTwisting ? 2.8 : -0.9), 0, MAX_PRESSURE);
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isTwisting, results, showBriefing, showTutorial]);

  useEffect(() => {
    if (showBriefing || showTutorial || results) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const efficiency = getControlEfficiency(pressure, caseData);
      setActiveBleeding((currentBleeding) => {
        const delta = isTwisting ? efficiency / 18 : -1.2;
        const nextBleeding = clamp(currentBleeding - delta, 0, BLEEDING_START_PERCENT);
        const nextControlPercent = Math.round(100 - nextBleeding);

        samplesRef.current.push({
          active_bleeding: Math.round(nextBleeding),
          control_efficiency: efficiency,
          control_percent: nextControlPercent,
          elapsed_ms: Date.now() - startTimeRef.current,
          pressure: Math.round(pressure),
        });

        if (nextBleeding <= 0) {
          window.clearInterval(interval);
          finishGame();
        }

        return nextBleeding;
      });

      if (pressure < caseData.controlThreshold * 0.55) {
        setFeedback('Falta tension: el sangrado sigue activo.');
        if (pressure > 10 && lastWarningRef.current !== 'low') {
          setErrorsCount((count) => count + 1);
          lastWarningRef.current = 'low';
        }
        return;
      }

      if (pressure > 112) {
        setFeedback('Demasiada tension: controla el sangrado, pero puedes lastimar nervios y musculo.');
        if (lastWarningRef.current !== 'high') {
          setErrorsCount((count) => count + 1);
          lastWarningRef.current = 'high';
        }
        return;
      }

      setFeedback('Buen control: el sangrado esta bajando. Mantén la varilla hasta llegar a 0%.');
      lastWarningRef.current = 'controlled';
    }, 100);

    return () => window.clearInterval(interval);
  }, [caseData, finishGame, isTwisting, pressure, results, showBriefing, showTutorial]);

  useEffect(() => {
    function handleKeyDown(event) {
      const isSpaceKey = event.code === 'Space' || event.key === ' ';
      const isGameActive = !showBriefing && !results;

      if (!isSpaceKey || event.repeat || !isGameActive) {
        return;
      }

      event.preventDefault();
      if (!showBriefing && showTutorial && !results) {
        dismissTutorial();
        return;
      }

      startTwisting();
    }

    function handleKeyUp(event) {
      const isSpaceKey = event.code === 'Space' || event.key === ' ';
      const isGameActive = !showBriefing && !results;

      if (!isSpaceKey || !isGameActive) {
        return;
      }

      event.preventDefault();
      stopTwisting();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [results, showBriefing, showTutorial, startTwisting, stopTwisting]);

  function startSimulation() {
    scrollToGameTop();
    samplesRef.current = [];
    setPressure(0);
    setActiveBleeding(BLEEDING_START_PERCENT);
    setErrorsCount(0);
    setFeedback('Coloca el torniquete arriba de la herida y gira la varilla para reducir el sangrado.');
    setShowBriefing(false);
    setShowTutorial(true);
  }

  function dismissTutorial() {
    startTimeRef.current = Date.now();
    setShowTutorial(false);
  }

  function resetGame() {
    setCaseData(pickCase());
    setResults(null);
    setShowBriefing(true);
    setShowTutorial(false);
    setPressure(0);
    setActiveBleeding(BLEEDING_START_PERCENT);
    setIsTwisting(false);
    setErrorsCount(0);
    setSaveState('idle');
    setSaveError('');
    lastWarningRef.current = 'none';
  }

  const angle = -130 + (pressure / MAX_PRESSURE) * 260;
  const pressurePercent = (pressure / MAX_PRESSURE) * 100;
  const estimatedZoneStartPercent = (caseData.controlThreshold / MAX_PRESSURE) * 100;
  const estimatedZoneWidthPercent = ((112 - caseData.controlThreshold) / MAX_PRESSURE) * 100;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <Link className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200" to="/dashboard">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100">
            Codigo Torniquete
          </div>
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" />
        </header>

        {showBriefing ? (
          <Briefing caseData={caseData} onStart={startSimulation} />
        ) : (
          <div className="relative grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            {showTutorial ? (
              <button
                aria-label="Cerrar tutorial de Codigo Torniquete"
                className="fixed inset-0 z-50 flex touch-manipulation select-none flex-col items-center justify-center bg-black/70 px-6 text-center backdrop-blur-sm"
                onClick={dismissTutorial}
                onPointerDown={(event) => {
                  event.preventDefault();
                  dismissTutorial();
                }}
                type="button"
              >
                <span className="animate-bounce text-6xl" aria-hidden="true">
                  👇
                </span>
                <span className="mt-4 max-w-sm rounded-lg border border-rose-300/40 bg-rose-500/20 p-4 text-base font-bold text-white shadow-2xl">
                  Mantén presionado para girar la varilla hasta que el sangrado llegue a 0%.
                </span>
                <span className="mt-3 text-sm text-slate-200">
                  En celular mantén el dedo. En computadora usa la barra espaciadora.
                </span>
              </button>
            ) : null}
            <section className="rounded-lg border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-300">{caseData.bleedRate} perdida</p>
              <h1 className="mt-2 text-2xl font-bold md:text-4xl">{caseData.title}</h1>
              <p className="mt-3 text-slate-300">{caseData.description}</p>
              <div className="mt-4 rounded-md border border-rose-300/30 bg-rose-400/10 p-3 text-sm font-semibold text-rose-100">
                Coloca el torniquete 5-7 cm arriba de la herida. Nunca sobre una articulacion.
              </div>

              <div className="mt-8 flex justify-center">
                <div className="relative h-72 w-72 max-w-full rounded-full border border-white/10 bg-slate-900 shadow-2xl shadow-rose-950/30 sm:h-80 sm:w-80">
                  <svg className="h-full w-full" viewBox="0 0 320 320">
                    <circle cx="160" cy="160" fill="none" r="120" stroke="rgba(255,255,255,0.08)" strokeWidth="22" />
                    <path d={describeArc(160, 160, 120, -130, 130)} fill="none" stroke="rgba(244,63,94,0.65)" strokeLinecap="round" strokeWidth="18" />
                  </svg>
                  <motion.div
                    animate={{ rotate: angle }}
                    className="absolute left-1/2 top-1/2 h-1.5 w-32 origin-left rounded-full bg-white shadow-lg"
                    transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Gauge aria-hidden="true" className="h-9 w-9 text-rose-200" />
                    <p className="mt-2 text-5xl font-bold">{Math.round(pressure)}</p>
                    <p className="text-sm text-slate-400">presion simulada</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-white/10 bg-slate-900 p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <span>Sangrado activo</span>
                  <span>{Math.round(activeBleeding)}%</span>
                </div>
                <div className="relative h-8 overflow-hidden rounded-full bg-emerald-400/20">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400"
                    style={{
                      width: `${activeBleeding}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>Controlado 0%</span>
                  <span>Activo 100%</span>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
                    <span>Tension aplicada</span>
                    <span>{Math.round(pressure)}</span>
                  </div>
                  <div className="relative h-4 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute top-0 h-full rounded-full bg-emerald-400/40 ring-1 ring-emerald-200/70"
                      style={{
                        left: `${estimatedZoneStartPercent}%`,
                        width: `${estimatedZoneWidthPercent}%`,
                      }}
                    />
                    <motion.div
                      animate={{ width: `${pressurePercent}%` }}
                      className="h-full rounded-full bg-rose-500"
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Franja verde estimada: zona donde normalmente empieza a bajar el sangrado sin excederte.
                  </p>
                </div>
              </div>

              <button
                className="mt-8 h-14 w-full touch-none select-none rounded-md bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 active:bg-rose-800"
                onMouseDown={startTwisting}
                onMouseLeave={stopTwisting}
                onMouseUp={stopTwisting}
                onTouchCancel={stopTwisting}
                onTouchEnd={(event) => {
                  event.preventDefault();
                  stopTwisting();
                }}
                onTouchStart={(event) => {
                  event.preventDefault();
                  startTwisting();
                }}
                type="button"
              >
                Mantener: Girar Varilla (Espacio)
              </button>
            </section>

            <aside className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
              <h2 className="font-bold">Telemetria</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Control" value={`${controlPercent}%`} />
                <Metric label="Errores" value={errorsCount} />
                <Metric label="Sangrado" value={`${Math.round(activeBleeding)}%`} />
                <Metric label="Zona estimada" value={`${caseData.controlThreshold}-112`} />
                <Metric label="Eficiencia" value={`${controlEfficiency}%`} />
              </div>
              <div className={`mt-5 rounded-md border p-4 text-sm font-semibold ${
                activeBleeding <= 30
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : pressure > 112
                    ? 'border-red-200 bg-red-50 text-red-800'
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
      <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Briefing medico</p>
        <h1 className="mt-2 text-3xl font-bold">{caseData.title}</h1>
        <p className="mt-3 text-slate-700 dark:text-slate-300">{caseData.description}</p>
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100">
          <h2 className="font-bold">Instrucciones</h2>
          <p className="mt-2 leading-6">
            En computadora: mantén presionada la barra espaciadora o el boton
            para girar la varilla. En celular: manten el dedo sobre Aplicar
            Presion. El objetivo es bajar el Sangrado Activo de 100% a 0%.
            Si falta tension sigue sangrando; si te excedes puedes lastimar nervios y musculo.
          </p>
        </div>
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100">
          Coloca el torniquete 5-7 cm arriba de la herida y nunca encima de una articulacion.
          La franja verde es una guia estimada de tension util; el objetivo real es que el sangrado llegue a 0%.
        </div>
        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <h2 className="font-bold text-cyan-950 dark:text-cyan-100">Como se mide Inicio vs Final</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
            Inicio es cuanto controlaste el sangrado en el primer tercio de la
            partida. Final es el control del ultimo tercio. La meta clinica del
            simulador es llegar a hemorragia controlada: 0% de sangrado activo.
          </p>
        </div>
        <MedicalDisclaimer />
        <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3">
          <button className="h-12 touch-manipulation select-none rounded-md bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700" onClick={onStart} type="button">
            Entendido, Iniciar Simulacion
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
      <motion.section animate={{ opacity: 1, y: 0 }} className="max-h-[85dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white md:p-8" initial={{ opacity: 0, y: 18 }}>
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Retroalimentacion clinica</p>
        <h2 className="mt-1 text-2xl font-bold">Sangrado controlado</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Inicial" value={`${results.initialPrecision}%`} />
          <Metric label="Final" value={`${results.finalPrecision}%`} />
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

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}
