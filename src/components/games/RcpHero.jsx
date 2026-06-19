import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  HeartPulse,
  Monitor,
  Music,
  Play,
  RotateCcw,
  Save,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const SUCCESS_WINDOW_MS = 100;
const PRECISION_WINDOW_MS = 250;
const durationOptions = [
  { label: 'Modo Practica (30s)', value: 30000 },
  { label: 'Modo Estandar (60s)', value: 60000 },
  { label: 'Modo AHA (120s)', value: 120000 },
];

const cprPlaylist = [
  { id: 'stayin-alive', name: "Stayin' Alive - Bee Gees", bpm: 103, src: '/audio/stayin-alive.mp3' },
  { id: 'levitating', name: 'Levitating - Dua Lipa', bpm: 103, src: '/audio/levitating.mp3' },
  { id: 'calm-down', name: 'Calm Down - Rema ft. Selena Gomez', bpm: 107, src: '/audio/calm-down.mp3' },
  { id: 'dynamite', name: 'Dynamite - BTS', bpm: 114, src: '/audio/dynamite.mp3' },
  { id: 'uptown-funk', name: 'Uptown Funk - Bruno Mars', bpm: 115, src: '/audio/uptown-funk.mp3' },
  { id: 'sorry', name: 'Sorry - Justin Bieber', bpm: 100, src: '/audio/sorry.mp3' },
];

const medicalNotes = [
  'La RCP funciona mejor cuando mantienes un ritmo parecido a una cancion bailable: rapido, constante y sin pausas largas.',
  'En una persona adulta, las compresiones deben hundir el pecho lo suficiente para mover sangre, pero sin aplastar de mas.',
  'Despues de cada compresion deja que el pecho vuelva a subir; asi el corazon puede llenarse otra vez.',
  'Las pausas largas hacen que baje el flujo de sangre, por eso este juego premia la constancia.',
  'Si hay un DEA cerca, en la vida real se prende y se siguen sus instrucciones de voz.',
  'Las manos van al centro del pecho, como si quisieras empujar el ritmo hacia abajo, no hacia los lados.',
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundMetric(value) {
  return Number(value.toFixed(2));
}

function getTotalBeats(durationMs, beatIntervalMs) {
  return Math.floor(durationMs / beatIntervalMs) + 1;
}

function precisionFromDelta(absDelta) {
  return roundMetric(clamp(100 - (absDelta / PRECISION_WINDOW_MS) * 100, 0, 100));
}

function calculateNormalizedScore(initialPrecision, finalPrecision, errorsCount) {
  const improvementBonus = Math.max(0, finalPrecision - initialPrecision) * 0.5;
  return Math.round(clamp(finalPrecision - errorsCount * 2 + improvementBonus, 0, 100));
}

function getBeatWindowAverage(beatScores, startMs, endMs, durationMs, beatIntervalMs) {
  const selectedScores = [];
  const totalBeats = getTotalBeats(durationMs, beatIntervalMs);

  for (let beatIndex = 0; beatIndex < totalBeats; beatIndex += 1) {
    const beatTime = beatIndex * beatIntervalMs;

    if (beatTime >= startMs && beatTime < endMs) {
      selectedScores.push(beatScores.get(beatIndex) ?? 0);
    }
  }

  if (!selectedScores.length) {
    return 0;
  }

  const total = selectedScores.reduce((sum, score) => sum + score, 0);
  return roundMetric(total / selectedScores.length);
}

function buildResults(attempts, durationMs, beatIntervalMs) {
  const beatScores = new Map();
  let failedPresses = 0;

  attempts.forEach((attempt) => {
    if (!attempt.success) {
      failedPresses += 1;
      return;
    }

    const previousScore = beatScores.get(attempt.target_beat) ?? 0;
    beatScores.set(attempt.target_beat, Math.max(previousScore, attempt.precision));
  });

  const totalBeats = getTotalBeats(durationMs, beatIntervalMs);
  const successfulHits = beatScores.size;
  const missedBeats = totalBeats - successfulHits;
  const errorsCount = failedPresses + missedBeats;
  const initialPrecision = getBeatWindowAverage(
    beatScores,
    0,
    Math.min(10000, durationMs),
    durationMs,
    beatIntervalMs
  );
  const finalPrecision = getBeatWindowAverage(
    beatScores,
    Math.max(0, durationMs - 10000),
    durationMs,
    durationMs,
    beatIntervalMs
  );
  return {
    errorsCount,
    failedPresses,
    finalPrecision,
    initialPrecision,
    missedBeats,
    score: calculateNormalizedScore(initialPrecision, finalPrecision, errorsCount),
    successfulHits,
    totalBeats,
  };
}

export default function RcpHero() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [gameDurationMs, setGameDurationMs] = useState(120000);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [lastFeedback, setLastFeedback] = useState('Presiona iniciar para comenzar.');
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState(cprPlaylist[0].id);
  const [isMuted, setIsMuted] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [showBriefing, setShowBriefing] = useState(true);
  const [feedbackTone, setFeedbackTone] = useState('idle');
  const [feedbackFlashKey, setFeedbackFlashKey] = useState(0);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const attemptsRef = useRef([]);
  const finishedRef = useRef(false);
  const lastBeatRef = useRef(-1);
  const audioRef = useRef(null);

  const selectedTrack = cprPlaylist.find((track) => track.id === selectedTrackId) ?? cprPlaylist[0];
  const targetBPM = selectedTrack.bpm;
  const beatIntervalMs = 60000 / targetBPM;
  const currentBeat = Math.floor(elapsedMs / beatIntervalMs);
  const secondsLeft = Math.max(0, Math.ceil((gameDurationMs - elapsedMs) / 1000));
  const progress = clamp((elapsedMs / gameDurationMs) * 100, 0, 100);
  const averagePrecision = useMemo(() => {
    if (!attempts.length) {
      return 0;
    }

    const total = attempts.reduce((sum, attempt) => sum + attempt.precision, 0);
    return roundMetric(total / attempts.length);
  }, [attempts]);

  const playBeat = useCallback(() => {
    setPulseCount((count) => count + 1);
  }, []);

  const stopTrack = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  const playSelectedTrack = useCallback(async () => {
    stopTrack();

    const audio = new Audio(selectedTrack.src);
    audio.loop = true;
    audio.muted = isMuted;
    audio.volume = 0.75;
    audioRef.current = audio;

    try {
      await audio.play();
    } catch {
      // Some browsers require an extra direct gesture; first compression retries playback.
    }
  }, [isMuted, selectedTrack.src, stopTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => stopTrack, [stopTrack]);

  const persistSession = useCallback(
    async (nextResults, finalAttempts, soundtrack, durationMs, bpm, intervalMs) => {
      if (!supabase || !user?.id) {
        setSaveState('error');
        setSaveError('No se pudo guardar: falta sesion activa o Supabase.');
        return;
      }

      setSaveState('saving');
      setSaveError('');

      const { error } = await supabase.from('game_sessions').insert({
        user_id: user.id,
        game_key: 'rcp_hero',
        initial_precision: nextResults.initialPrecision,
        final_precision: nextResults.finalPrecision,
        completion_time_seconds: durationMs / 1000,
        errors_count: nextResults.errorsCount,
        score: nextResults.score,
        telemetry: {
          attempts: finalAttempts,
          target_bpm: bpm,
          beat_interval_ms: roundMetric(intervalMs),
          duration_ms: durationMs,
          duration_seconds: durationMs / 1000,
          success_window_ms: SUCCESS_WINDOW_MS,
          total_beats: nextResults.totalBeats,
          successful_hits: nextResults.successfulHits,
          missed_beats: nextResults.missedBeats,
          failed_presses: nextResults.failedPresses,
          soundtrack,
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

  const finishGame = useCallback(() => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    setIsRunning(false);
    setElapsedMs(gameDurationMs);
    lastBeatRef.current = -1;
    window.cancelAnimationFrame(animationFrameRef.current);
    stopTrack();

    const finalAttempts = attemptsRef.current;
    const soundtrack = selectedTrack;
    const nextResults = buildResults(finalAttempts, gameDurationMs, beatIntervalMs);
    setResults({
      ...nextResults,
      note: medicalNotes[Math.floor(Math.random() * medicalNotes.length)],
    });
    setLastFeedback('Sesion completada. Revisa tus Notas de la IA.');
    persistSession(nextResults, finalAttempts, soundtrack, gameDurationMs, targetBPM, beatIntervalMs);
  }, [beatIntervalMs, gameDurationMs, persistSession, selectedTrack, stopTrack, targetBPM]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    function tick(now) {
      const nextElapsed = now - startTimeRef.current;

      if (nextElapsed >= gameDurationMs) {
        finishGame();
        return;
      }

      const nextBeat = Math.floor(nextElapsed / beatIntervalMs);
      if (nextBeat !== lastBeatRef.current) {
        lastBeatRef.current = nextBeat;
        playBeat();
      }

      setElapsedMs(nextElapsed);
      animationFrameRef.current = window.requestAnimationFrame(tick);
    }

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [beatIntervalMs, finishGame, gameDurationMs, isRunning, playBeat]);

  const recordCompression = useCallback(() => {
    if (!isRunning || finishedRef.current) {
      return;
    }

    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    if (audioRef.current?.paused) {
      audioRef.current.play().catch(() => {});
    }

    const targetBeat = clamp(
      Math.round(elapsed / beatIntervalMs),
      0,
      getTotalBeats(gameDurationMs, beatIntervalMs) - 1
    );
    const idealElapsed = targetBeat * beatIntervalMs;
    const deltaMs = elapsed - idealElapsed;
    const absDelta = Math.abs(deltaMs);
    const success = absDelta <= SUCCESS_WINDOW_MS;
    const precision = precisionFromDelta(absDelta);

    const attempt = {
      elapsed_ms: Math.round(elapsed),
      target_beat: targetBeat,
      delta_ms: Math.round(deltaMs),
      precision,
      success,
    };

    attemptsRef.current = [...attemptsRef.current, attempt];
    setAttempts(attemptsRef.current);

    if (success) {
      setFeedbackTone('success');
      setFeedbackFlashKey((key) => key + 1);
      setLastFeedback(absDelta <= 45 ? 'Perfecto!' : 'Bien, estas dentro del margen.');
    } else if (deltaMs < 0) {
      setFeedbackTone('error');
      setFeedbackFlashKey((key) => key + 1);
      setLastFeedback('Rapido! Espera el siguiente cierre del circulo.');
    } else {
      setFeedbackTone('error');
      setFeedbackFlashKey((key) => key + 1);
      setLastFeedback('Lento! Acelera un poco.');
    }
  }, [beatIntervalMs, gameDurationMs, isRunning]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code !== 'Space' || event.repeat) {
        return;
      }

      event.preventDefault();
      recordCompression();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [recordCompression]);

  async function startGame() {
    attemptsRef.current = [];
    finishedRef.current = false;
    lastBeatRef.current = -1;
    setAttempts([]);
    setElapsedMs(0);
    setResults(null);
    setShowBriefing(false);
    setSaveState('idle');
    setSaveError('');
    setFeedbackTone('idle');
    setFeedbackFlashKey(0);
    setLastFeedback(`Pista activa: ${selectedTrack.name} (${selectedTrack.bpm} BPM).`);
    await playSelectedTrack();
    startTimeRef.current = performance.now();
    setIsRunning(true);
  }

  function resetToBriefing() {
    attemptsRef.current = [];
    finishedRef.current = false;
    lastBeatRef.current = -1;
    setAttempts([]);
    setElapsedMs(0);
    setResults(null);
    setIsRunning(false);
    stopTrack();
    setShowBriefing(true);
    setSaveState('idle');
    setSaveError('');
    setFeedbackTone('idle');
    setFeedbackFlashKey(0);
    setLastFeedback('Presiona iniciar para comenzar.');
  }

  return (
    <main
      className="min-h-screen bg-slate-950 text-white"
      style={{
        backgroundImage:
          'linear-gradient(rgba(34,197,94,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.08) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            to="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100">
            Objetivo: {targetBPM} BPM · {gameDurationMs / 1000}s
          </div>
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" />
        </header>

        {showBriefing ? (
          <Briefing
            durationMs={gameDurationMs}
            onDurationChange={setGameDurationMs}
            onStart={startGame}
            onTrackChange={setSelectedTrackId}
            selectedTrackId={selectedTrackId}
          />
        ) : (
        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_380px]">
          <section className="flex flex-col items-center text-center">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">
              <Monitor aria-hidden="true" className="h-4 w-4" />
              Monitor vital - RCP Hero
            </p>
            <h1 className="mt-2 text-4xl font-bold text-emerald-50 sm:text-5xl">
              Manten flujo de sangre efectivo
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Sigue la pista musical y comprime cuando el anillo ECG cierre. El
              margen de exito es de +/- {SUCCESS_WINDOW_MS} ms por latido.
            </p>

            <div className="mt-6 w-full max-w-2xl rounded-lg border border-emerald-400/20 bg-black/70 p-3 text-left shadow-2xl shadow-emerald-950/30">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                <span className="flex items-center gap-2">
                  <Music aria-hidden="true" className="h-4 w-4" />
                  Pista RCP
                </span>
                <span>{selectedTrack.name} · {selectedTrack.bpm} BPM</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                El intervalo objetivo de esta partida es de {roundMetric(beatIntervalMs)} ms por compresion.
              </p>
            </div>

            <motion.div
              animate={
                feedbackTone === 'success'
                  ? { boxShadow: '0 0 0 8px rgba(34,197,94,0.3)' }
                  : feedbackTone === 'error'
                    ? { boxShadow: '0 0 0 8px rgba(239,68,68,0.35)' }
                    : { boxShadow: '0 25px 70px rgba(136,19,55,0.4)' }
              }
              className={`relative mt-10 flex h-72 w-72 items-center justify-center rounded-full border shadow-2xl ${
                feedbackTone === 'success'
                  ? 'border-emerald-300/50 bg-emerald-500/10'
                  : feedbackTone === 'error'
                    ? 'border-red-300/50 bg-red-500/10'
                    : 'border-rose-300/20 bg-rose-500/10'
              }`}
              key={`feedback-${feedbackFlashKey}`}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                animate={{ scale: isRunning ? [1.28, 0.72] : 1.1, opacity: isRunning ? [0.15, 0.85, 0.2] : 0.25 }}
                className="absolute h-64 w-64 rounded-full border-4 border-cyan-300"
                key={`ring-${pulseCount}`}
                transition={{ duration: beatIntervalMs / 1000, ease: 'linear' }}
              />
              <motion.div
                animate={{
                  scale: isRunning ? [1, 1.18, 1] : 1,
                  filter: isRunning
                    ? [
                        'drop-shadow(0 0 12px rgba(244,63,94,0.25))',
                        'drop-shadow(0 0 38px rgba(244,63,94,0.65))',
                        'drop-shadow(0 0 12px rgba(244,63,94,0.25))',
                      ]
                    : 'drop-shadow(0 0 12px rgba(244,63,94,0.25))',
                }}
                className={`relative flex h-44 w-44 items-center justify-center rounded-full text-white ${
                  feedbackTone === 'success'
                    ? 'bg-emerald-600'
                    : feedbackTone === 'error'
                      ? 'bg-red-600'
                      : 'bg-rose-600'
                }`}
                key={pulseCount}
                transition={{
                  duration: 0.22,
                  ease: 'easeInOut',
                }}
              >
                <HeartPulse aria-hidden="true" className="h-24 w-24" />
              </motion.div>
            </motion.div>

            <div className="mt-8 w-full max-w-2xl overflow-hidden rounded-lg border border-emerald-400/20 bg-black/50 p-4 shadow-2xl shadow-emerald-950/30">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-emerald-300">
                <span>ECG Rhythm Sync</span>
                <span>{currentBeat + 1} / {getTotalBeats(gameDurationMs, beatIntervalMs)} latidos</span>
              </div>
              <svg
                aria-hidden="true"
                className="h-24 w-full text-emerald-400"
                preserveAspectRatio="none"
                viewBox="0 0 600 120"
              >
                <polyline
                  fill="none"
                  points="0,68 55,68 70,45 84,88 96,20 112,98 130,68 210,68 224,50 238,84 252,26 268,96 286,68 370,68 386,48 398,86 412,18 430,98 448,68 600,68"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
                <motion.circle
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.7, 0.7] }}
                  cx="412"
                  cy="18"
                  fill="currentColor"
                  key={`ecg-${pulseCount}`}
                  r="5"
                  style={{ originX: '412px', originY: '18px' }}
                  transition={{ duration: 0.22 }}
                />
              </svg>
            </div>

            <div className="mt-8 h-3 w-full max-w-xl overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex w-full max-w-xl items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Tempo</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  animate={{ x: isRunning ? ['0%', '100%'] : '0%' }}
                  className="h-full w-1/4 rounded-full bg-rose-400"
                  key={`tempo-${pulseCount}`}
                  transition={{ duration: beatIntervalMs / 1000, ease: 'linear' }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-400">{targetBPM} BPM</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                className="flex h-12 items-center gap-2 rounded-md bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-600"
                disabled={isRunning}
                onClick={startGame}
                type="button"
              >
                {attempts.length || results ? (
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Play aria-hidden="true" className="h-4 w-4" />
                )}
                {attempts.length || results ? 'Reiniciar' : 'Iniciar'}
              </button>
              <button
                className="flex h-12 items-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isRunning}
                onClick={recordCompression}
                type="button"
              >
                <Activity aria-hidden="true" className="h-4 w-4" />
                Comprimir
              </button>
              <button
                className="flex h-12 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 text-sm font-bold text-slate-100 transition hover:bg-white/10"
                onClick={() => setIsMuted((value) => !value)}
                type="button"
              >
                {isMuted ? (
                  <VolumeX aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Volume2 aria-hidden="true" className="h-4 w-4" />
                )}
                {isMuted ? 'Desmutear' : 'Mutear'}
              </button>
            </div>
          </section>

          <aside className="rounded-lg border border-emerald-400/20 bg-black/80 p-5 text-emerald-50 shadow-2xl shadow-emerald-950/30">
            <h2 className="text-lg font-bold text-emerald-300">Telemetria en vivo</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Tiempo" value={`${secondsLeft}s`} />
              <Metric label="Modo" value={`${gameDurationMs / 1000}s`} />
              <Metric label="BPM" value={targetBPM} />
              <Metric label="Latido" value={currentBeat + 1} />
              <Metric label="Pulsaciones" value={attempts.length} />
              <Metric label="Precision media" value={`${averagePrecision}%`} />
            </div>
            <div className="mt-5 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-sm font-semibold text-emerald-300">Feedback</p>
              <p className="mt-1 text-sm font-bold text-emerald-50">{lastFeedback}</p>
            </div>
            <div className="mt-5 text-sm text-slate-300">
              Barra espaciadora activa durante la partida. Evita mantenerla
              presionada; cada compresion debe ser intencional.
            </div>
          </aside>
        </div>
        )}
      </section>

      {results ? (
        <ResultsModal
          results={results}
          saveError={saveError}
          saveState={saveState}
          onRestart={resetToBriefing}
          onExit={() => navigate('/dashboard')}
        />
      ) : null}
    </main>
  );
}

function Briefing({ durationMs, onDurationChange, onStart, onTrackChange, selectedTrackId }) {
  const selectedTrack = cprPlaylist.find((track) => track.id === selectedTrackId) ?? cprPlaylist[0];

  return (
    <section className="grid flex-1 place-items-center py-10">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl shadow-black/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.22 }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Briefing medico
        </p>
        <h1 className="mt-2 text-3xl font-bold">RCP Hero</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-bold">Por que importa</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              La AHA recomienda 100-120 compresiones por minuto porque ese
              ritmo ayuda a mover sangre cuando el corazon no lo esta logrando
              por si solo.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-bold">Instrucciones</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              En computadora: escucha la pista y presiona la barra espaciadora
              cuando el anillo se cierre. En celular: toca el boton Comprimir al
              mismo ritmo. Nota: Las compresiones reales deben tener una
              profundidad de 5 a 6 cm.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-300/30 dark:bg-rose-400/10">
          <h2 className="font-bold text-rose-900 dark:text-rose-100">Prueba de resistencia</h2>
          <p className="mt-2 text-sm leading-6 text-rose-800 dark:text-rose-100">
            A los 2 minutos los brazos empiezan a cansarse. Mantener el ritmo
            de la cancion elegida, dentro del rango 100-120 BPM, muestra si tu
            ritmo aguanta cuando la adrenalina y la fatiga aparecen.
          </p>
        </div>
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/30 dark:bg-emerald-400/10">
          <label className="text-sm font-bold text-emerald-950 dark:text-emerald-100" htmlFor="rcp-duration">
            Duracion de la simulacion
          </label>
          <select
            className="mt-3 h-11 w-full rounded-md border border-emerald-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-950"
            id="rcp-duration"
            onChange={(event) => onDurationChange(Number(event.target.value))}
            value={durationMs}
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-emerald-800 dark:text-emerald-100">
            Practica rapido para probar cambios, o usa 120 segundos para simular
            el ciclo completo recomendado antes de cambiar de reanimador.
          </p>
        </div>
        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <label className="text-sm font-bold text-cyan-950 dark:text-cyan-100" htmlFor="rcp-track">
            Cancion guia para memoria muscular
          </label>
          <select
            className="mt-3 h-11 w-full rounded-md border border-cyan-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-950"
            id="rcp-track"
            onChange={(event) => onTrackChange(event.target.value)}
            value={selectedTrackId}
          >
            {cprPlaylist.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name} - {track.bpm} BPM
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-cyan-900 dark:text-cyan-100">
            Esta pista ajusta automaticamente el ritmo objetivo a {selectedTrack.bpm} BPM,
            equivalente a {roundMetric(60000 / selectedTrack.bpm)} ms por compresion.
          </p>
        </div>
        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <h2 className="font-bold text-cyan-950 dark:text-cyan-100">Como se mide Inicio vs Final</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
            Inicio es tu precision promedio en los primeros 10 segundos. Final
            es tu precision promedio en los ultimos 10 segundos de la duracion
            elegida. Asi vemos si tu ritmo mejora o se mantiene con la practica.
          </p>
        </div>
        <MedicalDisclaimer />
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="flex h-12 w-full items-center justify-center rounded-md bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700 sm:w-auto"
            onClick={onStart}
            type="button"
          >
            Entendido, Iniciar Simulacion
          </button>
          <VideoTutorialModal title="Video tutorial RCP" videoId="O1AOt_s1NzM" />
        </div>
      </motion.div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function ResultsModal({ onExit, onRestart, results, saveError, saveState }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm">
      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Notas de la IA
            </p>
            <h2 className="mt-1 text-2xl font-bold">Sesion RCP Hero completada</h2>
          </div>
          <div className="rounded-md bg-rose-50 px-3 py-2 text-right dark:bg-rose-400/10">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-200">Score</p>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-100">{results.score}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Precision inicial" value={`${results.initialPrecision}%`} />
          <Metric label="Precision final" value={`${results.finalPrecision}%`} />
          <Metric label="Fallos" value={results.errorsCount} />
        </div>

        <div className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <p className="text-sm font-bold text-cyan-950 dark:text-cyan-100">Nota adicional</p>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">{results.note}</p>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? 'Guardando evidencia en Supabase...' : null}
          {saveState === 'saved' ? 'Evidencia guardada en Supabase.' : null}
          {saveState === 'error' ? `No se guardo la evidencia: ${saveError}` : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="flex h-12 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            onClick={onExit}
            type="button"
          >
            Salir al Dashboard
          </button>
          <button
            className="flex h-12 items-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
            onClick={onRestart}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </motion.section>
    </div>
  );
}
