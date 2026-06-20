import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Activity,
  BookOpenCheck,
  Brain,
  Globe2,
  LogOut,
  PlayCircle,
  Send,
  ShieldCheck,
  Siren,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { LAST_MEDICAL_REVIEW } from '../common/Footer';
import ThemeToggle from '../common/ThemeToggle';

const games = [
  ['RCP Hero', 'rcp_hero', 'Practica ritmo y resistencia para compresiones.'],
  ['Laboratorio de Quemaduras', 'burn_lab', 'Aprende que ayuda y que empeora una quemadura.'],
  ['Codigo Torniquete', 'tourniquet_code', 'Controla sangrado con presion suficiente y segura.'],
  ['Ahogo Express', 'choking_express', 'Reconoce donde aplicar la maniobra segun el caso.'],
  ['Triage Tactico', 'tactical_triage', 'Clasifica multiples victimas con protocolo START.'],
];

const limitOptions = [10, 25, 50, 100];
const gameLabels = Object.fromEntries(games.map(([label, key]) => [key, label]));
const gameIcons = {
  burn_lab: PlayCircle,
  choking_express: PlayCircle,
  rcp_hero: PlayCircle,
  tactical_triage: Siren,
  tourniquet_code: PlayCircle,
};
const gameShortLabels = {
  burn_lab: 'Quemaduras',
  choking_express: 'Ahogo',
  rcp_hero: 'RCP',
  tactical_triage: 'Triage',
  tourniquet_code: 'Torniquete',
};
const defaultAiFact =
  'Primer consejo: si hay una emergencia real, primero llama a emergencias y luego ayuda sin ponerte en riesgo.';
const localAiFacts = [
  defaultAiFact,
  'Practicar pocos minutos varias veces ayuda mas que intentar memorizar todo en una sola sesion.',
  'En una emergencia real, tu primera meta es mantenerte seguro, pedir ayuda y actuar con calma.',
  'Los mitos de primeros auxilios suelen sonar faciles, pero pueden retrasar lo que si ayuda.',
  'Reconocer rapido que no hacer tambien salva tiempo valioso.',
];
const localInfoCards = [
  {
    text: 'Sabias que muchas emergencias cardiacas ocurren en el hogar? Practicar aqui puede ayudarte a reaccionar mejor con alguien cercano.',
    title: 'Dato curioso',
  },
  {
    text: 'Triage START se recuerda como "30 - 2 - Puede": respiracion, pulso/perfusion y estado mental.',
    title: 'Recordatorio clinico',
  },
  {
    text: 'Haz una partida corta, revisa tu precision final y repite. La practica con retroalimentacion inmediata ayuda mas que memorizar todo de golpe.',
    title: 'Practica inteligente',
  },
];
const infoCardIcons = [Activity, Brain, Sparkles];
const blockedWords = [
  'pendejo',
  'pendeja',
  'idiota',
  'imbecil',
  'estupido',
  'estupida',
  'mierda',
  'chingar',
  'chingada',
  'puto',
  'puta',
  'vete a la burguer',
  'vete a la chingada',
  'vete a la mierda',
  'joto',
  'jota',
  'maricon',
  'maricón',
  'culero',
  'culera',
  'cabrón',
];
const geminiModelCandidates = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash-latest',
];

function getSessionSignature(session) {
  return [
    session.game_key,
    Number(session.initial_precision ?? 0).toFixed(2),
    Number(session.final_precision ?? 0).toFixed(2),
    Number(session.errors_count ?? 0),
    Number(session.score ?? 0),
  ].join('|');
}

function removeConsecutiveDuplicateSessions(sourceSessions) {
  return sourceSessions.filter((session, index, array) => {
    if (index === 0) {
      return true;
    }

    return getSessionSignature(session) !== getSessionSignature(array[index - 1]);
  });
}

function hasBlockedLanguage(text) {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return blockedWords.some((word) => normalized.includes(word));
}

async function moderateTestimonialWithGemini(text) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (hasBlockedLanguage(text)) {
    return {
      allowed: false,
      reason: 'Tu testimonio tiene lenguaje grosero. Puedes reescribirlo con respeto y lo intentamos de nuevo.',
    };
  }

  if (!apiKey) {
    return { allowed: true, reason: 'Filtro local aprobado.' };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `Revisa este testimonio para una app educativa de primeros auxilios.
Responde solo JSON valido con esta forma:
{"allowed":true,"reason":"mensaje corto"}

Reglas:
- allowed debe ser false si hay insultos, groserias, acoso, odio, contenido sexual, violencia gratuita, mala opinion de la web, inyecciones sql o contenido de codigo, cosas como memes tales como 67, cosas graciosas o mas configuraciones.
- allowed debe ser true si es una opinion sencilla, positiva, neutral o critica respetuosa.
- reason debe ser amable, en espanol y maximo una oracion.

Testimonio: ${JSON.stringify(text)}`;

  for (const modelName of geminiModelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();
      const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '');
      const parsed = JSON.parse(jsonText);

      return {
        allowed: Boolean(parsed.allowed),
        reason: parsed.reason || 'Revisado por IA.',
      };
    } catch {
      // Fallback is handled after trying all configured models.
    }
  }

  return { allowed: true, reason: 'Filtro local aprobado.' };
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialState, setTestimonialState] = useState('idle');
  const [testimonialMessage, setTestimonialMessage] = useState('');
  const [aiFact, setAiFact] = useState(defaultAiFact);
  const [aiStatus, setAiStatus] = useState('loading');
  const [infoCards, setInfoCards] = useState(localInfoCards);
  const [infoCardsStatus, setInfoCardsStatus] = useState('loading');
  const [progressLimit, setProgressLimit] = useState(10);

  const loadDashboard = useCallback(async () => {
    if (!user?.id || !supabase) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const personalResult = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (personalResult.error) {
      setErrorMessage(personalResult.error.message);
    }

    setSessions(personalResult.data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    async function loadAiFact() {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setAiFact(localAiFacts[Math.floor(Math.random() * localAiFacts.length)]);
        setAiStatus('ready');
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      for (const modelName of geminiModelCandidates) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(
            'Dame un dato curioso, corto y amigable sobre primeros auxilios para alguien que no sabe medicina. Maximo 2 oraciones.'
          );
          const text = result.response.text().trim();

          if (text) {
            setAiFact(text);
            setAiStatus('ready');
            return;
          }
        } catch {
          // Fallback is handled after trying all configured models.
        }
      }

      setAiFact(localAiFacts[Math.floor(Math.random() * localAiFacts.length)]);
      setAiStatus('ready');
    }

    loadAiFact();
  }, []);

  useEffect(() => {
    async function loadInfoCards() {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setInfoCards(localInfoCards);
        setInfoCardsStatus('ready');
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `Genera 3 tarjetas breves para una app educativa de primeros auxilios.
Responde solo JSON valido con esta forma:
[
  {"title":"titulo corto","text":"explicacion amigable de maximo 22 palabras"},
  {"title":"titulo corto","text":"explicacion amigable de maximo 22 palabras"},
  {"title":"titulo corto","text":"explicacion amigable de maximo 22 palabras"}
]
Reglas:
- Lenguaje para publico general, sin tecnicismos sin explicar.
- Temas posibles: RCP, quemaduras, hemorragias, atragantamiento o triage START.
- No des instrucciones peligrosas ni reemplaces llamar a emergencias.`;

      for (const modelName of geminiModelCandidates) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const rawText = result.response.text().trim();
          const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '');
          const parsed = JSON.parse(jsonText);

          if (
            Array.isArray(parsed) &&
            parsed.length >= 3 &&
            parsed.every((card) => card?.title && card?.text)
          ) {
            setInfoCards(parsed.slice(0, 3));
            setInfoCardsStatus('ready');
            return;
          }
        } catch {
          // Fallback is handled after trying all configured models.
        }
      }

      setInfoCards(localInfoCards);
      setInfoCardsStatus('ready');
    }

    loadInfoCards();
  }, []);

  const dedupedPersonalSessions = useMemo(
    () => removeConsecutiveDuplicateSessions(sessions),
    [sessions]
  );

  const personalProgressData = useMemo(() => {
    const gameAttemptCounts = {};

    const allProgressData = dedupedPersonalSessions.map((session) => {
      const gameKey = session.game_key;
      gameAttemptCounts[gameKey] = (gameAttemptCounts[gameKey] ?? 0) + 1;

      return {
        final: Number(session.final_precision ?? 0),
        game: gameLabels[session.game_key] ?? session.game_key,
        initial: Number(session.initial_precision ?? 0),
        intento: `${gameShortLabels[gameKey] ?? 'Juego'} ${gameAttemptCounts[gameKey]}`,
      };
    });

    return allProgressData.slice(-progressLimit);
  }, [dedupedPersonalSessions, progressLimit]);

  async function handleSubmitSuggestion(event) {
    event.preventDefault();

    const cleanSuggestion = suggestionText.trim();
    const cleanEmail = userEmail.trim();

    if (!cleanSuggestion) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('https://formsubmit.co/ajax/xcomcuenta@gmail.com', {
        body: JSON.stringify({
          _subject: 'Nueva Sugerencia - LifeSaver Arcade',
          correo_respuesta: cleanEmail || 'No proporcionado',
          mensaje: cleanSuggestion,
          usuario_sesion: user?.email ?? 'Usuario no identificado',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('FormSubmit request failed');
      }

      setSuggestionText('');
      setUserEmail('');
      setSubmitStatus('success');
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitTestimonial(event) {
    event.preventDefault();

    const cleanTestimonial = testimonialText.trim();

    if (!cleanTestimonial || !user?.id || !supabase) {
      setTestimonialState('error');
      setTestimonialMessage('No hay una sesion activa o Supabase no esta configurado.');
      return;
    }

    setTestimonialState('checking');
    setTestimonialMessage('Revisando que el testimonio sea respetuoso...');

    const moderation = await moderateTestimonialWithGemini(cleanTestimonial);

    if (!moderation.allowed) {
      setTestimonialState('blocked');
      setTestimonialMessage(
        moderation.reason ||
          'Tu testimonio no se subira si contiene groserias, insultos o lenguaje agresivo.'
      );
      return;
    }

    setTestimonialState('saving');
    setTestimonialMessage('Revision aprobada. Guardando testimonio...');

    const { error } = await supabase.from('testimonials').insert({
      content: cleanTestimonial,
      learning_text: cleanTestimonial,
      user_id: user.id,
    });

    if (error) {
      setTestimonialState('error');
      setTestimonialMessage(`No se pudo guardar en Supabase. Detalle: ${error.message}`);
      return;
    }

    setTestimonialText('');
    setTestimonialState('saved');
    setTestimonialMessage('Testimonio guardado y listo para aparecer en el dashboard global.');
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-gray-900 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link className="flex items-center gap-3 font-bold" to="/dashboard">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            LifeSaver Arcade
          </Link>
          <nav className="flex items-center gap-3">
            <Link className="text-sm font-semibold text-cyan-700 hover:text-cyan-900 dark:text-cyan-200 dark:hover:text-white" to="/evidencia">
              Dashboard global
            </Link>
            <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-white" to="/respaldo-medico">
              Respaldo medico
            </Link>
            <ThemeToggle />
            <button
              className="flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
              onClick={logout}
              type="button"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Salir
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 md:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            Panel personal
          </p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Hola, vamos a practicar con datos reales</h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
            Tu sesion es {user?.email}. Este panel compara como empiezas y como
            terminas cada intento, para ver si la practica de verdad esta
            ayudando.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Fecha de ultima revision medica clinica: {LAST_MEDICAL_REVIEW}
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
            <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
            Proyecto en proceso de aval clinico y evaluacion academica.
          </div>
        </div>

        <section className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 shadow-sm dark:border-cyan-300/20 dark:bg-cyan-300/10">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white">
              <Sparkles aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
                Primer consejo
              </p>
              {aiStatus === 'loading' ? (
                <div className="mt-3 space-y-2" aria-label="Cargando consejo">
                  <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-cyan-200 dark:bg-cyan-300/20" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-cyan-200 dark:bg-cyan-300/20" />
                </div>
              ) : (
                <p className="mt-2 text-lg font-semibold text-cyan-950 dark:text-white">
                  {aiFact}
                </p>
              )}
            </div>
          </div>
        </section>

        {errorMessage ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
            {errorMessage}
          </p>
        ) : null}

        <section>
          <article className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-bold">Dashboard personal</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Cada barra compara tu precision al inicio y al final. Por
                  defecto ves tus ultimos 10 intentos.
                </p>
                <p className="mt-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                  Mostrando {personalProgressData.length} de {dedupedPersonalSessions.length} intentos guardados.
                </p>
              </div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200" htmlFor="progress-limit">
                Ver ultimos
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-cyan-950 sm:w-36"
                  id="progress-limit"
                  onChange={(event) => setProgressLimit(Number(event.target.value))}
                  value={progressLimit}
                >
                  {limitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} intentos
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 h-72">
              {loading ? (
                <div className="grid h-full place-items-center text-sm text-gray-500 dark:text-gray-400">
                  Cargando tus sesiones...
                </div>
              ) : (
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={personalProgressData} margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
                    <CartesianGrid stroke="#64748b" strokeDasharray="3 3" />
                    <XAxis dataKey="intento" tick={{ fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend />
                    <Bar dataKey="initial" fill="#f97316" name="Inicio" />
                    <Bar dataKey="final" fill="#06b6d4" name="Final" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>
        </section>

        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            Minijuegos
          </p>
          <h2 className="mt-1 text-2xl font-bold">Elige una simulacion</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {games.map(([title, gameKey, description]) => {
              const GameIcon = gameIcons[gameKey] ?? PlayCircle;

              return (
                <Link
                  className="rounded-lg border border-teal-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-800 dark:hover:border-cyan-300/60"
                  key={gameKey}
                  to={`/games/${gameKey}`}
                >
                  <GameIcon aria-hidden="true" className="h-6 w-6 text-rose-600" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            Notas e informacion adicional
          </p>
          <h2 className="mt-1 text-2xl font-bold">Ideas utiles para practicar mejor</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {infoCardsStatus === 'loading'
              ? infoCardIcons.map((Icon, index) => (
                  <InfoCardSkeleton icon={Icon} key={index} />
                ))
              : infoCards.map((card, index) => (
                  <InfoCard
                    icon={infoCardIcons[index] ?? Sparkles}
                    key={`${card.title}-${index}`}
                    title={card.title}
                    text={card.text}
                  />
                ))}
          </div>
        </section>

        <section>
          <Link
            className="flex flex-col justify-between gap-6 rounded-xl border border-teal-200 bg-teal-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg dark:border-teal-300/20 dark:bg-teal-300/10 md:flex-row md:items-center"
            to="/evidencia"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Globe2 aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                  Dashboard global
                </p>
                <h3 className="mt-1 text-2xl font-bold text-teal-950 dark:text-white">
                  Ver Estadisticas Globales y Ranking
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-900 dark:text-teal-100">
                  Consulta el impacto de todos los usuarios, precision global,
                  partidas jugadas y testimonios publicos.
                </p>
              </div>
            </div>
            <span className="inline-flex min-h-12 items-center justify-center rounded-lg bg-teal-600 px-5 text-sm font-bold text-white">
              Abrir estadisticas
            </span>
          </Link>
        </section>

        <section>
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm dark:border-cyan-300/20 dark:bg-cyan-300/10">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
              Testimonio publico
            </p>
            <h2 className="mt-1 texzt-2xl font-bold">Comparte que aprendiste</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700 dark:text-gray-200">
              Este mensaje puede aparecer en el Dashboard Global como evidencia
              cualitativa. La IA revisa que sea respetuoso antes de publicarlo.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleSubmitTestimonial}>
              <textarea
                className="min-h-32 w-full rounded-lg border border-cyan-300 bg-white p-4 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-950"
                onChange={(event) => setTestimonialText(event.target.value)}
                placeholder="Ej. Aprendi que el hielo puede empeorar una quemadura..."
                required
                value={testimonialText}
              />
              <button
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                disabled={testimonialState === 'checking' || testimonialState === 'saving'}
                type="submit"
              >
                <Send aria-hidden="true" className="h-4 w-4" />
                {testimonialState === 'checking'
                  ? 'Revisando...'
                  : testimonialState === 'saving'
                    ? 'Guardando...'
                    : 'Enviar testimonio'}
              </button>
            </form>
            {testimonialState === 'checking' || testimonialState === 'saving' ? (
              <p className="mt-3 rounded-lg border border-cyan-200 bg-white/70 p-3 text-sm font-semibold text-cyan-700 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-200">
                {testimonialMessage}
              </p>
            ) : null}
            {testimonialState === 'saved' ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-200">
                {testimonialMessage}
              </p>
            ) : null}
            {testimonialState === 'blocked' ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-200">
                {testimonialMessage}
              </p>
            ) : null}
            {testimonialState === 'error' ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-300/30 dark:bg-red-400/10 dark:text-red-200">
                {testimonialMessage}
              </p>
            ) : null}
          </div>
        </section>

        <section className="pb-12">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-white/10 dark:bg-slate-800/50">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
              Buzon de mejora
            </p>
            <h2 className="mt-1 text-2xl font-bold">¿Tienes alguna sugerencia o queja?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              Cuentanos que funciono, que fue confuso o que mejorarias. Este
              mensaje no aparece como testimonio publico.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleSubmitSuggestion}>
              <input
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white p-4 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950"
                onChange={(event) => setUserEmail(event.target.value)}
                placeholder="Tu correo si quieres respuesta (opcional)"
                type="email"
                value={userEmail}
              />
              <textarea
                className="min-h-36 w-full rounded-lg border border-slate-300 bg-white p-4 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950"
                onChange={(event) => setSuggestionText(event.target.value)}
                placeholder="Ayudanos a mejorar el simulador..."
                required
                value={suggestionText}
              />
              <button
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-teal-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                disabled={isSubmitting}
                type="submit"
              >
                <Send aria-hidden="true" className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar sugerencia'}
              </button>
            </form>
            {submitStatus === 'success' ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-200">
                Gracias por tu mensaje. Lo revisaremos pronto.
              </p>
            ) : null}
            {submitStatus === 'error' ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-300/30 dark:bg-red-400/10 dark:text-red-200">
                Hubo un problema al enviar. Intenta mas tarde.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ icon: Icon, text, title }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-800">
      <Icon aria-hidden="true" className="h-6 w-6 text-teal-600 dark:text-teal-300" />
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {text}
      </p>
    </article>
  );
}

function InfoCardSkeleton({ icon: Icon }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-800">
      <Icon aria-hidden="true" className="h-6 w-6 text-teal-600 dark:text-teal-300" />
      <div className="mt-4 h-5 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
    </article>
  );
}
