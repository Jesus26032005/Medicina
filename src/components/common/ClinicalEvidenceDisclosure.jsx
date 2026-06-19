import React from 'react';
import { ExternalLink, Library } from 'lucide-react';

const evidenceByModule = {
  burn_lab: {
    description:
      'Modulo sustentado en lineamientos institucionales de primeros auxilios y epidemiologia de quemaduras, con apoyo academico para enfriamiento, irrigacion y clasificacion inicial.',
    links: [
      ['AHA / American Red Cross - 2024 First Aid Guidelines', 'https://cpr.heart.org/en/resuscitation-science/first-aid-guidelines'],
      ['World Health Organization - Burns fact sheet', 'https://www.who.int/news-room/fact-sheets/detail/burns'],
      ['NIH/PubMed - Burn first aid cooling evidence', 'https://pubmed.ncbi.nlm.nih.gov/34916091/'],
    ],
  },
  choking_express: {
    description:
      'Basado en guias institucionales de primeros auxilios para reconocimiento de obstruccion parcial/completa y desobstruccion de via aerea en personas conscientes.',
    links: [
      ['AHA / American Red Cross - 2024 First Aid Guidelines', 'https://cpr.heart.org/en/resuscitation-science/first-aid-guidelines'],
      ['American Red Cross - Learn First Aid', 'https://www.redcross.org/take-a-class/resources/learn-first-aid'],
      ['American Red Cross - First Aid Training', 'https://www.redcross.org/take-a-class/first-aid/first-aid-training'],
    ],
  },
  rcp_hero: {
    description:
      'Basado en las guias de la American Heart Association para Reanimacion Cardiopulmonar (RCP) y Atencion Cardiovascular de Emergencia (ACE), con foco en frecuencia de compresiones de alta calidad.',
    rationale:
      "Justificacion de Memoria Muscular: El entrenamiento con metronomos auditivos o canciones con un tempo de 100 a 120 BPM (como Stayin' Alive) esta comprobado clinicamente para mejorar la retencion de la frecuencia de compresion toracica adecuada.",
    links: [
      ['American Heart Association - CPR and ECC Guidelines', 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines'],
      ['American Heart Association - High Quality CPR', 'https://cpr.heart.org/en/resuscitation-science/high-quality-cpr'],
      ['American Red Cross - CPR steps', 'https://www.redcross.org/take-a-class/cpr/performing-cpr/cpr-steps'],
      ["NIH/PubMed - Stayin' Alive mental metronome study", 'https://pubmed.ncbi.nlm.nih.gov/22445896/'],
    ],
  },
  tactical_triage: {
    description:
      'Modulo academico basado en el algoritmo START para incidentes con multiples victimas y en literatura academica indexada sobre triage de desastres.',
    links: [
      ['HHS REMM - START Adult Triage Algorithm', 'https://remm.hhs.gov/startadult.htm'],
    ],
  },
  tourniquet_code: {
    description:
      'Respaldado por el Consenso de Hartford, el programa Stop the Bleed y materiales institucionales del American College of Surgeons para control de hemorragia externa potencialmente mortal.',
    links: [
      ['ACS Stop the Bleed - Get Trained', 'https://www.stopthebleed.org/get-trained/'],
      ['American College of Surgeons - Trauma Programs', 'https://www.facs.org/quality-programs/trauma/'],
    ],
  },
};

export default function ClinicalEvidenceDisclosure({ moduleKey }) {
  const evidence = evidenceByModule[moduleKey];

  if (!evidence) {
    return null;
  }

  return (
    <details className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-cyan-950 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">
      <summary className="flex cursor-pointer touch-manipulation select-none items-center gap-2 text-sm font-bold">
        <Library aria-hidden="true" className="h-4 w-4" />
        Fuentes y Evidencia Clinica
      </summary>
      <p className="mt-3 text-sm leading-6">{evidence.description}</p>
      {evidence.rationale ? (
        <p className="mt-3 rounded-md border border-cyan-200 bg-white p-3 text-sm font-semibold leading-6 text-cyan-900 dark:border-cyan-300/20 dark:bg-slate-950 dark:text-cyan-100">
          {evidence.rationale}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2">
        {evidence.links.map(([label, url]) => (
          <a
            className="flex items-center justify-between gap-3 rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-slate-950 dark:text-cyan-100 dark:hover:bg-cyan-400/10"
            href={url}
            key={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>{label}</span>
            <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
          </a>
        ))}
      </div>
    </details>
  );
}
