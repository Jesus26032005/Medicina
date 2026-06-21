import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, LogIn, MessageSquareQuote, ShieldCheck, Users } from 'lucide-react';
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
import { supabase } from '../../lib/supabaseClient';
import ThemeToggle from '../common/ThemeToggle';

export default function GlobalEvidence() {
  const [sessions, setSessions] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadEvidence() {
      if (!supabase) {
        setErrorMessage('Supabase no está configurado.');
        setLoading(false);
        return;
      }

      const [
        { data: sessionData, error: sessionError },
        { data: testimonialData, error: testimonialError },
        { data: profilesCount, error: profilesCountError },
      ] =
        await Promise.all([
          supabase
            .from('game_sessions')
            .select('id, user_id, game_key, initial_precision, final_precision, errors_count, score, created_at')
            .order('created_at', { ascending: true }),
          supabase
            .from('testimonials')
            .select('id, content, learning_text, user_id, created_at')
            .order('created_at', { ascending: false })
            .limit(12),
          supabase.rpc('get_profiles_count'),
        ]);

      if (sessionError) {
        setErrorMessage(sessionError.message);
      }

      if (testimonialError) {
        setErrorMessage((current) =>
          current ? `${current} ${testimonialError.message}` : testimonialError.message
        );
      }

      const fallbackUserIds = new Set([
        ...(sessionData ?? []).map((session) => session.user_id).filter(Boolean),
        ...(testimonialData ?? []).map((testimonial) => testimonial.user_id).filter(Boolean),
      ]);

      const authorIds = [
        ...new Set((testimonialData ?? []).map((testimonial) => testimonial.user_id).filter(Boolean)),
      ];
      let profilesById = {};

      if (authorIds.length) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', authorIds);

        profilesById = Object.fromEntries(
          (profileData ?? []).map((profile) => [
            profile.id,
            profile.full_name || 'Usuario Anónimo',
          ])
        );
      }

      setSessions(sessionData ?? []);
      setRegisteredUsersCount(
        profilesCountError ? fallbackUserIds.size : Number(profilesCount ?? 0)
      );
      setTestimonials(
        (testimonialData ?? []).map((testimonial) => ({
          ...testimonial,
          authorName: profilesById[testimonial.user_id] ?? 'Usuario Anónimo',
        }))
      );
      setLoading(false);
    }

    loadEvidence();
  }, []);

  const impactData = useMemo(() => {
    if (!sessions.length) {
      return [{ final: 0, initial: 0, name: 'Global' }];
    }

    const initial =
      sessions.reduce((sum, session) => sum + Number(session.initial_precision ?? 0), 0) /
      sessions.length;
    const final =
      sessions.reduce((sum, session) => sum + Number(session.final_precision ?? 0), 0) /
      sessions.length;

    return [
      {
        final: Number(final.toFixed(2)),
        initial: Number(initial.toFixed(2)),
        name: 'Global',
      },
    ];
  }, [sessions]);

  const globalInitial = impactData[0]?.initial ?? 0;
  const globalFinal = impactData[0]?.final ?? 0;
  const totalErrors = sessions.reduce(
    (sum, session) => sum + Number(session.errors_count ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-slate-950 dark:text-white">
      <header className="border-b border-gray-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link className="flex items-center gap-3 font-bold" to="/evidencia">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            LifeSaver Arcade
          </Link>
          <nav className="flex items-center gap-3">
            <Link className="text-sm font-semibold text-cyan-700 hover:text-cyan-900 dark:text-cyan-200 dark:hover:text-white" to="/dashboard">
              Mi dashboard
            </Link>
            <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-white" to="/respaldo-medico">
              Respaldo médico
            </Link>
            <ThemeToggle />
            <Link
              className="flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              to="/login"
            >
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
          Dashboard global
        </p>
        <h1 className="mt-2 text-4xl font-bold">Panel de impacto educativo</h1>
        <p className="mt-3 max-w-2xl text-gray-600 dark:text-slate-300">
          Vista agregada de telemetría: adquisición de precisión, reducción de
          errores y testimonios de aprendizaje.
        </p>

        {errorMessage ? (
          <p className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi
            icon={Users}
            label="Usuarios en base de datos"
            value={loading ? '...' : registeredUsersCount}
          />
          <Kpi
            label="Partidas jugadas"
            value={loading ? '...' : sessions.length}
          />
          <Kpi label="Errores médicos detectados" value={loading ? '...' : totalErrors} />
          <Kpi label="Precisión inicial global" value={loading ? '...' : `${globalInitial}%`} />
          <Kpi label="Precisión final global" value={loading ? '...' : `${globalFinal}%`} />
        </div>

        <section className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5 text-gray-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
          <h2 className="font-bold">Precisión Inicial vs Final Global</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Promedio agregado de todos los intentos registrados.
          </p>
          <div className="mt-4 h-80 rounded-lg bg-white p-3 dark:bg-slate-900">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={impactData}>
                <CartesianGrid stroke="#64748b" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Legend />
                <Bar dataKey="initial" fill="#f97316" name="Precisión inicial" />
                <Bar dataKey="final" fill="#06b6d4" name="Precisión final" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                Aprendizajes de usuarios
              </p>
              <h2 className="mt-1 text-2xl font-bold">Testimonios del simulador</h2>
            </div>
            <p className="hidden text-sm text-gray-500 dark:text-slate-400 sm:block">
              {testimonials.length} registros recientes
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {testimonials.length ? (
              testimonials.map((testimonial) => (
                <article
                  className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-md transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/10 dark:shadow-slate-950/20 dark:hover:border-cyan-300/40 dark:hover:bg-white/[0.14]"
                  key={testimonial.id}
                >
                  <MessageSquareQuote aria-hidden="true" className="h-6 w-6 text-cyan-300" />
                  <p className="mt-4 text-sm font-semibold text-teal-700 dark:text-teal-300">
                    {testimonial.authorName || 'Usuario Anónimo'}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-gray-700 dark:text-slate-100">
                    {testimonial.content || testimonial.learning_text}
                  </p>
                  <p className="mt-4 border-t border-gray-200 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/10 dark:text-slate-400">
                    {testimonial.created_at
                      ? new Intl.DateTimeFormat('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(testimonial.created_at))
                      : 'Testimonio'}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 md:col-span-3">
                Aún no hay testimonios. Cuando los usuarios compartan aprendizajes
                respetuosos, aparecerán aquí como evidencia cualitativa.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function Kpi({ icon: Icon = Activity, label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <Icon aria-hidden="true" className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}
