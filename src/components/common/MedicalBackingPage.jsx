import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const bibliography = [
  {
    title: 'RCP Hero',
    description:
      'Esta simulacion utiliza 110 BPM debido a que las guias internacionales recomiendan compresiones toracicas entre 100 y 120 por minuto.',
    links: [
      {
        label: 'American Heart Association - High Quality CPR',
        url: 'https://cpr.heart.org/en/resuscitation-science/high-quality-cpr',
      },
      {
        label: 'American Heart Association - What is CPR',
        url: 'https://cpr.heart.org/en/resources/what-is-cpr',
      },
      {
        label: 'American Red Cross - CPR Steps',
        url: 'https://www.redcross.org/take-a-class/cpr/performing-cpr/cpr-steps',
      },
      {
        label: 'MSD Manual - RCP en adultos',
        url: 'https://www.msdmanuals.com/es/professional/cuidados-cr%C3%ADticos/paro-card%C3%ADaco-y-reanimaci%C3%B3n-cardiopulmonar-rcp/reanimaci%C3%B3n-cardiopulmonar-rcp-en-adultos',
      },
    ],
  },
  {
    title: 'Laboratorio de Quemaduras',
    description:
      'El simulador ensena enfriamiento con agua corriente, evita el uso de hielo y contempla protocolos diferenciados para quemaduras termicas, quimicas y electricas.',
    links: [
      {
        label: 'INSST - NTP 524 Quemaduras',
        url: 'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/15-serie-ntp-numeros-506-a-540-ano-2000/ntp-524-primeros-auxilios-quemaduras',
      },
      {
        label: 'SECIP - Protocolo de Quemados',
        url: 'https://secip.com/images/uploads/2020/11/Protocolo-de-Quemados-SECIP.pdf',
      },
      {
        label: 'Universidad Complutense - Tratamiento de Quemaduras',
        url: 'https://www.ucm.es/data/cont/docs/420-2014-02-07-TRATAMIENTO-QUEMADURAS-15-Dic-2013.pdf',
      },
      {
        label: 'Mayo Clinic - Chemical Burns First Aid',
        url: 'https://www.mayoclinic.org/first-aid/first-aid-chemical-burns/basics/art-20056667',
      },
    ],
  },
  {
    title: 'Ahogo Express (Heimlich)',
    description:
      'La simulacion diferencia entre adultos, ninos y pacientes embarazados u obesos, empleando compresiones toracicas cuando las abdominales no son recomendadas.',
    links: [
      {
        label: 'Hospital Privado - Maniobra Heimlich',
        url: 'https://hospitalprivado.com.ar/programa-de-prevencion/maniobra-de-heimlich.html',
      },
      {
        label: 'iLERNA - Casos especiales Heimlich',
        url: 'https://www.ilerna.es/blog/maniobra-de-heimlich-especiales',
      },
      {
        label: 'Cruz Roja Americana - Primeros Auxilios y Atragantamiento',
        url: 'https://www.redcross.org/take-a-class/first-aid/performing-first-aid/choking-first-aid',
      },
      {
        label: 'Mayo Clinic - Choking First Aid',
        url: 'https://www.mayoclinic.org/first-aid/first-aid-choking/basics/art-20056637',
      },
    ],
  },
  {
    title: 'Codigo Torniquete',
    description:
      'Disclaimer clinico: los rangos numericos mostrados en el simulador representan una abstraccion educativa para modelar el control de hemorragias y no deben interpretarse como valores clinicos reales.',
    links: [
      {
        label: 'SAMUR Madrid - Control de Hemorragias',
        url: 'https://servpub.madrid.es/manualsamur/data/606_02.html',
      },
      {
        label: 'Elsevier - Control de Hemorragia Externa',
        url: 'https://www.elsevier.es/es-revista-prehospital-emergency-care-edicion-espanola--44-articulo-control-hemorragia-externa-combate-X1888402409460652',
      },
      {
        label: 'Stop The Bleed',
        url: 'https://www.stopthebleed.org',
      },
      {
        label: 'American College of Surgeons - Stop The Bleed',
        url: 'https://www.facs.org/quality-programs/trauma/education/stop-the-bleed/',
      },
    ],
  },
  {
    title: 'Triage Tactico (Protocolo START)',
    description:
      'El simulador utiliza el algoritmo START (Simple Triage and Rapid Treatment) para la clasificacion de multiples victimas.',
    links: [
      {
        label: 'CEMP - Protocolo START',
        url: 'https://www.cemp.es/noticias/triage-start/',
      },
      {
        label: 'Revista Medica - Triage Prehospitalario',
        url: 'https://revistamedica.com/triage-start-prehospitalario/',
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
