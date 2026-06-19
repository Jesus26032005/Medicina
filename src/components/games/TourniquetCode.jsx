import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gauge, RotateCcw, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const HOLD_TARGET_SECONDS = 5;
const MAX_PRESSURE = 120;

const cases = [
  {
    id: 'arm_amputation_machinery',
    title: 'Amputacion de brazo por maquinaria',
    description: 'Sangrado muy fuerte en el brazo. Hay que apretar lo suficiente para detenerlo.',
    greenMin: 78,
    greenMax: 96,
    bleedRate: 'alta',
  },
  {
    id: 'leg_glass_laceration',
    title: 'Laceracion profunda en pierna por cristal',
    description: 'Corte profundo en pierna con sangrado constante de perdida media.',
    greenMin: 56,
    greenMax: 76,
    bleedRate: 'media',
  },
  {
    id: 'forearm_stab_wound',
    title: 'Herida punzocortante en antebrazo',
    description: 'Herida profunda en antebrazo; el sangrado no se detiene solo.',
    greenMin: 48,
    greenMax: 66,
    bleedRate: 'moderada',
  },
  {
    id: 'thigh_gunshot_arterial',
    title: 'Herida por arma de fuego en muslo',
    description: 'Sangrado a chorros en el muslo: este caso necesita mucha presion.',
    greenMin: 88,
    greenMax: 108,
    bleedRate: 'muy alta',
  },
  {
    id: 'forearm_chainsaw_deep_cut',
    title: 'Corte profundo por motosierra en antebrazo',
    description: 'Corte irregular y profundo con mucha sangre y tejido expuesto.',
    greenMin: 74,
    greenMax: 92,
    bleedRate: 'alta',
  },
  {
    id: 'calf_dog_bite_severe',
    title: 'Mordedura grave de perro en pantorrilla',
    description: 'Desgarro profundo en pantorrilla con sangrado que sigue saliendo.',
    greenMin: 58,
    greenMax: 76,
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

function getPrecision(pressure, caseData) {
  const center = (caseData.greenMin + caseData.greenMax) / 2;
  const halfRange = (caseData.greenMax - caseData.greenMin) / 2;
  const distance = Math.abs(pressure - center);
  return Math.round(clamp(100 - (distance / (halfRange + 28)) * 100, 0, 100));
}

function calculateNormalizedScore(initialPrecision, finalPrecision, errorsCount) {
  const improvementBonus = Math.max(0, finalPrecision - initialPrecision) * 0.5;
  return Math.round(clamp(finalPrecision - errorsCount * 2 + improvementBonus, 0, 100));
}

export default function TourniquetCode() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(() => pickCase());
  const [showBriefing, setShowBriefing] = useState(true);
  const [pressure, setPressure] = useState(0);
  const [isTwisting, setIsTwisting] = useState(false);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [feedback, setFeedback] = useState('Mantén la presion en zona verde durante 5 segundos.');
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const samplesRef = useRef([]);
  const startTimeRef = useRef(Date.now());
  const lastErrorZoneRef = useRef('none');

  const zone = useMemo(() => {
    if (pressure < caseData.greenMin) {
      return 'low';
    }
    if (pressure > caseData.greenMax) {
      return 'high';
    }
    return 'green';
  }, [caseData, pressure]);

  const precision = getPrecision(pressure, caseData);

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
        game_key: 'tourniquet_code',
        initial_precision: nextResults.initialPrecision,
        final_precision: nextResults.finalPrecision,
        completion_time_seconds: nextResults.completionTimeSeconds,
        errors_count: nextResults.errorsCount,
        score: nextResults.score,
        telemetry: {
          case_id: caseData.id,
          green_zone: [caseData.greenMin, caseData.greenMax],
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
        ? Math.round(items.reduce((sum, sample) => sum + sample.precision, 0) / items.length)
        : 0;
    const initialPrecision = average(first);
    const finalPrecision = average(last);
    const nextResults = {
      completionTimeSeconds: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
      errorsCount,
      finalPrecision,
      initialPrecision,
      note: notes[Math.floor(Math.random() * notes.length)],
      score: calculateNormalizedScore(initialPrecision, finalPrecision, errorsCount),
    };

    setResults(nextResults);
    persistSession(nextResults);
  }, [errorsCount, persistSession]);

  const startTwisting = useCallback(() => {
    if (!showBriefing && !results) {
      setIsTwisting(true);
    }
  }, [results, showBriefing]);

  const stopTwisting = useCallback(() => {
    setIsTwisting(false);
  }, []);

  useEffect(() => {
    if (showBriefing || results) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setPressure((current) => {
        const next = clamp(current + (isTwisting ? 2.8 : -0.9), 0, MAX_PRESSURE);
        const nextPrecision = getPrecision(next, caseData);
        samplesRef.current.push({
          elapsed_ms: Date.now() - startTimeRef.current,
          precision: nextPrecision,
          pressure: Math.round(next),
        });
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [caseData, isTwisting, results, showBriefing]);

  useEffect(() => {
    if (showBriefing || results) {
      return undefined;
    }

    if (zone === 'low') {
      setFeedback('Falta presion, sangrado activo.');
      if (lastErrorZoneRef.current !== 'low' && pressure > 8) {
        setErrorsCount((count) => count + 1);
      }
      lastErrorZoneRef.current = 'low';
      setHoldSeconds(0);
      return undefined;
    }

    if (zone === 'high') {
      setFeedback('Exceso de presion. Riesgo de dano nervioso cronico.');
      if (lastErrorZoneRef.current !== 'high') {
        setErrorsCount((count) => count + 1);
      }
      lastErrorZoneRef.current = 'high';
      setHoldSeconds(0);
      return undefined;
    }

    setFeedback('Zona verde: sangrado controlado. Mantén la presion.');
    lastErrorZoneRef.current = 'green';
    const timer = window.setInterval(() => {
      setHoldSeconds((seconds) => {
        const next = seconds + 0.1;
        if (next >= HOLD_TARGET_SECONDS) {
          window.clearInterval(timer);
          finishGame();
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [finishGame, pressure, results, showBriefing, zone]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code !== 'Space' || event.repeat) {
        return;
      }

      event.preventDefault();
      startTwisting();
    }

    function handleKeyUp(event) {
      if (event.code !== 'Space') {
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
  }, [startTwisting, stopTwisting]);

  function startSimulation() {
    startTimeRef.current = Date.now();
    samplesRef.current = [];
    setPressure(0);
    setErrorsCount(0);
    setHoldSeconds(0);
    setFeedback('Gira la varilla hasta entrar en zona verde.');
    setShowBriefing(false);
  }

  function resetGame() {
    setCaseData(pickCase());
    setResults(null);
    setShowBriefing(true);
    setPressure(0);
    setIsTwisting(false);
    setHoldSeconds(0);
    setErrorsCount(0);
    setSaveState('idle');
    setSaveError('');
    lastErrorZoneRef.current = 'none';
  }

  const angle = -130 + (pressure / MAX_PRESSURE) * 260;
  const greenStart = -130 + (caseData.greenMin / MAX_PRESSURE) * 260;
  const greenEnd = -130 + (caseData.greenMax / MAX_PRESSURE) * 260;
  const pressurePercent = (pressure / MAX_PRESSURE) * 100;
  const greenStartPercent = (caseData.greenMin / MAX_PRESSURE) * 100;
  const greenWidthPercent = ((caseData.greenMax - caseData.greenMin) / MAX_PRESSURE) * 100;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
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
          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-300">{caseData.bleedRate} perdida</p>
              <h1 className="mt-2 text-4xl font-bold">{caseData.title}</h1>
              <p className="mt-3 text-slate-300">{caseData.description}</p>

              <div className="mt-8 flex justify-center">
                <div className="relative h-80 w-80 rounded-full border border-white/10 bg-slate-900 shadow-2xl shadow-rose-950/30">
                  <svg className="h-full w-full" viewBox="0 0 320 320">
                    <circle cx="160" cy="160" fill="none" r="120" stroke="rgba(255,255,255,0.08)" strokeWidth="22" />
                    <path d={describeArc(160, 160, 120, greenStart, greenEnd)} fill="none" stroke="#22c55e" strokeLinecap="round" strokeWidth="22" />
                    <path d={describeArc(160, 160, 120, -130, greenStart - 4)} fill="none" stroke="#f97316" strokeLinecap="round" strokeWidth="16" />
                    <path d={describeArc(160, 160, 120, greenEnd + 4, 130)} fill="none" stroke="#ef4444" strokeLinecap="round" strokeWidth="16" />
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
                  <span>Barra de presion</span>
                  <span>Zona verde: {caseData.greenMin}-{caseData.greenMax}</span>
                </div>
                <div className="relative h-8 overflow-hidden rounded-full bg-gradient-to-r from-amber-500/60 via-slate-700 to-red-600/70">
                  <div
                    className="absolute top-0 h-full rounded-full bg-emerald-400/80 ring-2 ring-emerald-200"
                    style={{
                      left: `${greenStartPercent}%`,
                      width: `${greenWidthPercent}%`,
                    }}
                  />
                  <motion.div
                    animate={{ left: `${pressurePercent}%` }}
                    className="absolute top-1/2 h-12 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-lg shadow-white/40"
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>0</span>
                  <span>{MAX_PRESSURE}</span>
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
                <Metric label="Precision" value={`${precision}%`} />
                <Metric label="Errores" value={errorsCount} />
                <Metric label="Zona verde" value={`${caseData.greenMin}-${caseData.greenMax}`} />
                <Metric label="Mantener" value={`${holdSeconds.toFixed(1)}s`} />
              </div>
              <div className={`mt-5 rounded-md border p-4 text-sm font-semibold ${zone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : zone === 'high' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
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
            Presion. Entra en la zona verde; si queda bajo sigue sangrando, y
            si sube demasiado puedes lastimar nervios y musculo.
          </p>
        </div>
        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <h2 className="font-bold text-cyan-950 dark:text-cyan-100">Como se mide Inicio vs Final</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
            Inicio es el promedio de precision del primer tercio de muestras de
            presion. Final es el promedio del ultimo tercio. La mejora muestra
            si aprendiste a mantener la aguja dentro de la zona verde.
          </p>
        </div>
        <MedicalDisclaimer />
        <div className="mt-6 flex flex-wrap gap-3">
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
      <motion.section animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white" initial={{ opacity: 0, y: 18 }}>
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Notas de la IA</p>
        <h2 className="mt-1 text-2xl font-bold">Sangrado controlado</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Inicial" value={`${results.initialPrecision}%`} />
          <Metric label="Final" value={`${results.finalPrecision}%`} />
          <Metric label="Score" value={results.score} />
        </div>
        <p className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">{results.note}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? 'Guardando evidencia en Supabase...' : null}
          {saveState === 'saved' ? 'Evidencia guardada en Supabase.' : null}
          {saveState === 'error' ? `No se guardo la evidencia: ${saveError}` : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button className="h-12 touch-manipulation select-none rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600" onClick={onExit} type="button">
            Salir al Dashboard
          </button>
          <button className="h-12 touch-manipulation select-none rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700" onClick={onRestart} type="button">
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
