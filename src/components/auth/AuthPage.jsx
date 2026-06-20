import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Gamepad2,
  HeartHandshake,
  LogIn,
  Stethoscope,
  UserPlus,
} from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const featureCards = [
  {
    description: 'Practica decisiones de primeros auxilios con juegos breves y claros.',
    icon: Gamepad2,
    title: 'Simuladores interactivos',
  },
  {
    description: 'Situaciones inspiradas en emergencias reales, explicadas sin lenguaje complicado.',
    icon: Stethoscope,
    title: 'Casos clinicos simplificados',
  },
  {
    description: 'Compara como empiezas y como terminas para ver tu avance.',
    icon: BarChart3,
    title: 'Telemetria de aprendizaje',
  },
  {
    description: 'Cada modulo incluye fuentes para revisar el fundamento academico.',
    icon: BookOpenCheck,
    title: 'Respaldo cientifico',
  },
];

function getFriendlyAuthError(error) {
  const message = (error?.message ?? '').toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'El correo o la contraseña son incorrectos. Por favor, verifica tus datos.';
  }

  if (message.includes('email rate limit exceeded') || message.includes('rate limit')) {
    return 'Por seguridad, se ha alcanzado el limite de intentos. Por favor, espera unos minutos antes de intentar de nuevo.';
  }

  if (
    message.includes('user already registered') ||
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('duplicate key') ||
    message.includes('unique')
  ) {
    return 'Este correo electronico ya esta registrado. Intenta iniciar sesion.';
  }

  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network')
  ) {
    return 'No se pudo conectar con el servidor. Verifica tu conexion a internet.';
  }

  return 'Ups, ocurrio un problema inesperado. Por favor, intentalo de nuevo en unos momentos.';
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, isAuthenticated, loading, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname ?? '/dashboard';
  const isRegisterMode = mode === 'register';

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const data = await register({ email, password, fullName });

        if (data.session) {
          navigate(from, { replace: true });
          return;
        }

        await login({ email, password });
        navigate(from, { replace: true });
      } else {
        await login({ email, password });
        navigate(from, { replace: true });
      }
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setErrorMessage('');
    setSuccessMessage('');
  }

  return (
    <main className="min-h-screen bg-teal-50 text-teal-950 transition-colors dark:bg-slate-950 dark:text-white">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)] lg:py-12">
        <div className="max-w-3xl">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-lg shadow-cyan-900/20">
            <HeartHandshake aria-hidden="true" className="h-8 w-8" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            LifeSaver Arcade
          </p>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 shadow-sm dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
            <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
            En proceso de aval clinico y evaluacion academica
          </div>
          <h1 className="text-3xl font-black leading-tight text-teal-950 dark:text-white md:text-6xl">
            Aprende a salvar vidas jugando
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-800 dark:text-slate-300">
            Una plataforma educativa para practicar primeros auxilios de forma
            segura, visual y medible. No necesitas saber medicina: cada juego te
            explica que hacer, por que importa y que mitos evitar.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {featureCards.map(({ description, icon: Icon, title }) => (
              <article
                className="rounded-lg border border-teal-200 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-800"
                key={title}
              >
                <Icon aria-hidden="true" className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
                <h2 className="mt-4 font-bold text-teal-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-teal-800 dark:text-slate-300">
                  {description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-cyan-900 shadow-sm dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            <Activity aria-hidden="true" className="mb-3 h-5 w-5" />
            La app guarda precision inicial, precision final y errores para que
            tu avance no sea solo una sensacion: se pueda ver en datos.
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-lg border border-teal-200 bg-white p-4 text-slate-950 shadow-2xl shadow-teal-900/10 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:shadow-black/30 md:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
              Acceso
            </p>
            <h2 className="mt-1 text-2xl font-black">Entra a tu entrenamiento</h2>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg bg-teal-50 p-1 dark:bg-slate-950">
            <button
              className={`flex h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                !isRegisterMode
                  ? 'bg-white text-teal-950 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-teal-700 hover:text-teal-950 dark:text-slate-400 dark:hover:text-white'
              }`}
              type="button"
              onClick={() => switchMode('login')}
            >
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Iniciar Sesion
            </button>
            <button
              className={`flex h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                isRegisterMode
                  ? 'bg-white text-teal-950 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-teal-700 hover:text-teal-950 dark:text-slate-400 dark:hover:text-white'
              }`}
              type="button"
              onClick={() => switchMode('register')}
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              Registrarse
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegisterMode ? (
              <label className="block">
                <span className="text-sm font-medium text-teal-900 dark:text-slate-200">
                  Nombre completo
                </span>
                <input
                  className="mt-2 h-12 w-full rounded-md border border-teal-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-950"
                  autoComplete="name"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ej. Ana Martinez"
                  required
                  type="text"
                  value={fullName}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-medium text-teal-900 dark:text-slate-200">
                Correo electronico
              </span>
              <input
                className="mt-2 h-12 w-full rounded-md border border-teal-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-950"
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-teal-900 dark:text-slate-200">
                Contrasena
              </span>
              <input
                className="mt-2 h-12 w-full rounded-md border border-teal-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-950"
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 6 caracteres"
                required
                type="password"
                value={password}
              />
            </label>

            {errorMessage ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-200">
                {errorMessage}
              </p>
            ) : null}

            {authError ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-200">
                {getFriendlyAuthError({ message: authError })}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100">
                {successMessage}
              </p>
            ) : null}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
              type="submit"
            >
              {isRegisterMode ? (
                <UserPlus aria-hidden="true" className="h-4 w-4" />
              ) : (
                <LogIn aria-hidden="true" className="h-4 w-4" />
              )}
              {isSubmitting
                ? 'Procesando...'
                : isRegisterMode
                  ? 'Crear cuenta'
                  : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
