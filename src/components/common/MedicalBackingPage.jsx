import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { evidenceByModule, evidenceCategories } from './ClinicalEvidenceDisclosure';

const bibliography = evidenceCategories.map(([moduleKey, title]) => ({
  ...evidenceByModule[moduleKey],
  title,
}));

export default function MedicalBackingPage() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link className="flex items-center gap-3 font-bold" to="/evidencia">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            LifeSaver Arcade
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3">
            <Link
              className="flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              to="/dashboard"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Dashboard
            </Link>
            <Link className="text-sm font-semibold text-cyan-700 hover:text-cyan-900 dark:text-cyan-200 dark:hover:text-white" to="/evidencia">
              Dashboard global
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <button
                className="flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                onClick={logout}
                type="button"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Salir
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Bibliografía interactiva
        </p>
        <h1 className="mt-2 text-4xl font-bold">Respaldo médico por minijuego</h1>
        <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">
          Fuentes usadas como apoyo teórico para la validación académica del
          simulador. Los enlaces abren en una pestaña nueva.
        </p>

        <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100">
          <p className="font-bold">Cobertura clínica de los cinco minijuegos:</p>
          <p className="mt-2 leading-7">
            RCP Hero cubre frecuencia y calidad de compresiones; Ahogo Express,
            obstrucción parcial y grave; Código Torniquete, control de hemorragias;
            Burn Lab, clasificación y primeros auxilios en quemaduras; y Triage
            Táctico, priorización hospitalaria mediante Manchester MTS.
          </p>
          <p className="mt-3 text-sm font-bold">
            {evidenceCategories.length} de {evidenceCategories.length} módulos cuentan con bibliografía específica.
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {bibliography.map((category) => (
            <article
              className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-md dark:border-gray-700 dark:bg-gray-800"
              key={category.title}
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {category.title}
              </h2>
              <p className="mt-2 text-sm italic leading-6 text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
              {category.rationale ? (
                <p className="mt-3 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm font-semibold leading-6 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">
                  {category.rationale}
                </p>
              ) : null}
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {category.links.length} fuentes relacionadas
              </p>
              <div className="mt-4 space-y-2">
                {category.links.map((link) => (
                  <a
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm font-semibold text-cyan-800 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-cyan-200 dark:hover:bg-gray-700"
                    href={link.url}
                    key={link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>
                      <span className="block">{link.title}</span>
                      <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                        {link.institution}
                      </span>
                      {link.note ? (
                        <span className="mt-2 block text-xs font-medium leading-5 text-gray-600 dark:text-gray-300">
                          {link.note}
                        </span>
                      ) : null}
                    </span>
                    <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
