import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const bibliography = [
  {
    title: 'RCP Hero',
    description:
      "Basado en las guias de la American Heart Association para RCP y Atencion Cardiovascular de Emergencia, con enfasis en compresiones toracicas de alta calidad dentro del rango 100-120 por minuto. Justificacion de Memoria Muscular: El entrenamiento con metronomos auditivos o canciones con un tempo de 100 a 120 BPM (como Stayin' Alive) esta comprobado clinicamente para mejorar la retencion de la frecuencia de compresion toracica adecuada.",
    links: [
      {
        label: 'American Heart Association - CPR and ECC Guidelines',
        url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines',
      },
      {
        label: 'American Heart Association - High Quality CPR',
        url: 'https://cpr.heart.org/en/resuscitation-science/high-quality-cpr',
      },
      {
        label: 'American Red Cross - CPR Steps',
        url: 'https://www.redcross.org/take-a-class/cpr/performing-cpr/cpr-steps',
      },
      {
        label: "NIH/PubMed - Stayin' Alive mental metronome study",
        url: 'https://pubmed.ncbi.nlm.nih.gov/22445896/',
      },
    ],
  },
  {
    title: 'Laboratorio de Quemaduras',
    description:
      'Sustentado en lineamientos institucionales de primeros auxilios, epidemiologia de la OMS y literatura academica indexada para enfriamiento, irrigacion y manejo inicial de quemaduras.',
    links: [
      {
        label: 'AHA / American Red Cross - 2024 First Aid Guidelines',
        url: 'https://cpr.heart.org/en/resuscitation-science/first-aid-guidelines',
      },
      {
        label: 'World Health Organization - Burns fact sheet',
        url: 'https://www.who.int/news-room/fact-sheets/detail/burns',
      },
      {
        label: 'NIH/PubMed - Burn first aid cooling evidence',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34916091/',
      },
    ],
  },
  {
    title: 'Ahogo Express (Heimlich)',
    description:
      'Basado en guias institucionales de primeros auxilios para diferenciar obstruccion parcial y completa y entrenar decisiones iniciales de desobstruccion.',
    links: [
      {
        label: 'AHA / American Red Cross - 2024 First Aid Guidelines',
        url: 'https://cpr.heart.org/en/resuscitation-science/first-aid-guidelines',
      },
      {
        label: 'American Red Cross - Learn First Aid',
        url: 'https://www.redcross.org/take-a-class/resources/learn-first-aid',
      },
      {
        label: 'American Red Cross - First Aid Training',
        url: 'https://www.redcross.org/take-a-class/first-aid/first-aid-training',
      },
    ],
  },
  {
    title: 'Codigo Torniquete',
    description:
      'Respaldado por el Consenso de Hartford, Stop the Bleed y materiales institucionales del American College of Surgeons para control de hemorragia externa potencialmente mortal.',
    links: [
      {
        label: 'ACS Stop the Bleed - Get Trained',
        url: 'https://www.stopthebleed.org/get-trained/',
      },
      {
        label: 'American College of Surgeons - Trauma Programs',
        url: 'https://www.facs.org/quality-programs/trauma/',
      },
    ],
  },
  {
    title: 'Triage Tactico (Protocolo START)',
    description:
      'Basado en literatura academica indexada sobre triage de incidentes con multiples victimas y el algoritmo START.',
    links: [
      {
        label: 'HHS REMM - START Adult Triage Algorithm',
        url: 'https://remm.hhs.gov/startadult.htm',
      },
    ],
  },
];

export default function MedicalBackingPage() {
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
          <nav className="flex items-center gap-3">
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
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Bibliografia interactiva
        </p>
        <h1 className="mt-2 text-4xl font-bold">Respaldo medico por minijuego</h1>
        <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">
          Fuentes usadas como apoyo teorico para la validacion academica del
          simulador. Los enlaces abren en una pestana nueva.
        </p>

        <section className="mt-8 rounded-lg border border-green-200 bg-green-50 p-5 text-green-800 dark:border-green-700/70 dark:bg-green-900/30 dark:text-green-200">
          <p className="font-bold">Validacion medica confirmada:</p>
          <p className="mt-2 leading-7">
            RCP a 110 BPM (rango óptimo), evitación de vasoconstricción
            (cuando los vasos se cierran demasiado) por hielo en quemaduras,
            prevención de reacciones cinéticas en cal viva
            mediante cepillado en seco, y adaptación torácica en maniobra de
            Heimlich para embarazadas y obesos.
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
              <div className="mt-4 space-y-2">
                {category.links.map((link) => (
                  <a
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm font-semibold text-cyan-800 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-cyan-200 dark:hover:bg-gray-700"
                    href={link.url}
                    key={link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>{link.label}</span>
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
