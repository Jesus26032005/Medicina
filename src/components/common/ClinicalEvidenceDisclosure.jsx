import React from 'react';
import { ExternalLink, Library } from 'lucide-react';

export const evidenceByModule = {
  rcp_hero: {
    description:
      'RCP Hero se respalda en guias oficiales AHA para soporte vital basico adulto, RCP de alta calidad y recursos institucionales que usan canciones de 100-120 BPM como ayuda de memoria ritmica.',
    rationale:
      "Ajuste pedagogico: la musica ayuda a recordar la frecuencia de compresion, pero no garantiza por si sola una RCP correcta. No sustituye profundidad, recoil, posicion de manos, activacion de emergencias, uso de DEA ni entrenamiento formal.",
    links: [
      {
        institution: 'American Heart Association',
        note: 'Guia oficial AHA 2025 para soporte vital basico en adultos; contiene recomendaciones formales sobre compresiones, DEA y obstruccion de via aerea.',
        title: 'Part 7: Adult Basic Life Support',
        url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support',
      },
      {
        institution: 'American Heart Association',
        note: 'Resume parametros operativos centrales de RCP en adultos, incluyendo frecuencia de compresiones, profundidad y uso de DEA.',
        title: 'What is CPR',
        url: 'https://cpr.heart.org/en/resources/what-is-cpr',
      },
      {
        institution: 'American Heart Association',
        note: 'Define metricas concretas de calidad de RCP, utiles para justificar telemetria y sistema de puntuacion.',
        title: 'High Quality CPR',
        url: 'https://cpr.heart.org/en/resuscitation-science/high-quality-cpr',
      },
      {
        institution: 'American Heart Association',
        note: "Documento institucional que vincula Hands-Only CPR con la cancion Stayin' Alive y explica el uso de canciones familiares para fijar ritmo.",
        title: 'FAQ: Hands-Only CPR',
        url: 'https://cpr.heart.org/-/media/cpr-files/courses-and-kits/hands-only-cpr/handsonly-cpr-faqs-ucm_494175.pdf',
      },
      {
        institution: 'American Heart Association',
        note: 'Programa comunitario oficial que usa playlists de 100-120 BPM para Hands-Only CPR.',
        title: 'Be the Beat',
        url: 'https://cpr.heart.org/en/training-programs/community-programs/be-the-beat',
      },
      {
        institution: 'American Heart Association',
        note: 'Recurso institucional con canciones entre 100 y 120 BPM para compresiones.',
        title: 'CPR Playlist',
        url: 'https://cpr.heart.org/en/-/media/CPR-Files/Training-Programs/Community-Programs/Be-the-Beat/BTB-2023/new-playlists/CPR-Playlist-2.pdf?sc_lang=en',
      },
      {
        institution: 'PubMed',
        note: 'Estudio indexado que apoya el uso de una ayuda musical/mnemonica para mantener la frecuencia de compresiones dentro de guia.',
        title: "Stayin' Alive: A Novel Mental Metronome to Maintain Compression Rates in Simulated Cardiac Arrests",
        url: 'https://pubmed.ncbi.nlm.nih.gov/22445896/',
      },
      {
        institution: 'American Heart Association / YouTube',
        note: 'Recurso audiovisual oficial para demostracion de Hands-Only CPR.',
        title: 'Official AHA Hands-Only CPR Demonstration Video',
        url: 'https://www.youtube.com/watch?v=7m5tPiTXL5A',
      },
      {
        institution: 'American Heart Association',
        note: 'Playlist oficial en español con canciones de 100-120 BPM para entrenamiento de compresiones.',
        title: 'Lista de canciones para RCP',
        url: 'https://cpr.heart.org/en/-/media/CPR-Files/Training-Programs/Community-Programs/Be-the-Beat/BTB-2023/new-playlists/Spanish-CPR-Playlist-2.pdf?sc_lang=en',
      },
      {
        institution: 'MedlinePlus',
        note: 'Explicación clínica en español de la RCP y situaciones donde debe aplicarse.',
        title: 'Reanimación cardiopulmonar (RCP)',
        url: 'https://medlineplus.gov/spanish/cpr.html',
      },
      {
        institution: 'Cruz Roja Española',
        note: 'Material educativo en español sobre soporte vital básico.',
        title: 'Reanimación cardiopulmonar básica',
        url: 'https://www.cruzroja.es/principal/web/ahora/reanimacion-cardiopulmonar',
      },
    ],
  },
  choking_express: {
    description:
      'Choking Express se sustenta en la diferenciacion critica entre obstruccion parcial y obstruccion grave. La conducta educativa central es animar a toser si aun hay tos/voz, y actuar con maniobras de desobstruccion si la obstruccion es grave.',
    rationale:
      'Ajuste pedagogico recomendado: para obstruccion grave en adulto consciente, el flujo debe representar 5 golpes dorsales + 5 compresiones abdominales. En embarazo tardio o si no se puede rodear el abdomen, se usan compresiones toracicas.',
    links: [
      {
        institution: 'American Heart Association',
        note: 'Algoritmo oficial AHA 2025 para obstruccion de via aerea en adultos, signos de gravedad y secuencia de maniobras.',
        title: 'Adult Foreign-Body Airway Obstruction',
        url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-BLS-Adult-FBAO-250630.pdf?sc_lang=en',
      },
      {
        institution: 'American Heart Association',
        note: 'Texto normativo que distingue obstruccion leve y grave y formaliza la recomendacion de golpes dorsales y compresiones.',
        title: 'Part 7: Adult Basic Life Support',
        url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support',
      },
      {
        institution: 'MedlinePlus / NIH-NLM',
        note: 'Confirma que si la persona puede toser y hablar no debe iniciarse la maniobra de desobstruccion; se anima a toser.',
        title: 'Choking - adult or child over 1 year',
        url: 'https://medlineplus.gov/ency/article/000049.htm',
      },
      {
        institution: 'Mayo Clinic',
        note: 'Recurso clinico institucional para soporte de primeros auxilios y redaccion pedagogica accesible.',
        title: 'Choking: First aid',
        url: 'https://www.mayoclinic.org/first-aid/first-aid-choking/basics/art-20056637',
      },
      {
        institution: 'American Red Cross / YouTube',
        note: 'Video oficial de apoyo audiovisual demostrativo para auditoria docente.',
        title: 'What to Do When an Adult is Choking',
        url: 'https://www.youtube.com/watch?v=8R3RWC-xx1I',
      },
      {
        institution: 'MedlinePlus',
        note: 'Versión oficial en español que diferencia obstrucción parcial y completa.',
        title: 'Asfixia en adulto o niño mayor de 1 año',
        url: 'https://medlineplus.gov/spanish/ency/article/000049.htm',
      },
      {
        institution: 'Manual MSD',
        note: 'Describe signos clínicos y maniobras para desobstrucción de vía aérea.',
        title: 'Asfixia por cuerpo extraño',
        url: 'https://www.msdmanuals.com/es/hogar/lesiones-y-envenenamientos/asfixia-y-obstrucción-de-la-vía-aérea/asfixia',
      },
      {
        institution: 'Cruz Roja Española',
        note: 'Primeros auxilios en atragantamiento para adultos.',
        title: 'Actuación ante un atragantamiento',
        url: 'https://www.cruzroja.es/principal/web/ahora/atragantamiento',
      },
    ],
  },
  tourniquet_code: {
    description:
      'Tourniquet Code se respalda en AHA/Red Cross, Stop the Bleed y el Consenso de Hartford para control precoz de hemorragia externa de extremidad potencialmente mortal.',
    rationale:
      'Ajuste pedagogico recomendado: la ensenanza audit-safe es colocar arriba de la herida, nunca sobre articulacion, apretar hasta detener el sangrado, asegurar, registrar hora, considerar segundo torniquete si sigue sangrando y no aflojar.',
    links: [
      {
        institution: 'American Heart Association / American Red Cross',
        note: 'Guia formal 2024 de primeros auxilios; establece que el torniquete debe apretarse hasta que el sangrado se detenga.',
        title: '2024 American Heart Association and American Red Cross Guidelines for First Aid',
        url: 'https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines',
      },
      {
        institution: 'American Red Cross',
        note: 'Recurso operativo que especifica ubicacion, dolor esperado, segundo torniquete y prohibicion de aflojar o retirar por personal lego.',
        title: 'How to Apply a Tourniquet',
        url: 'https://www.redcross.org/take-a-class/resources/articles/how-to-apply-a-tourniquet?srsltid=AfmBOop20guID8BPJ0X-AImlD4nJ11T6uV10ijKMLpsj-5y6OU101H6j',
      },
      {
        institution: 'American College of Surgeons / Stop the Bleed',
        note: 'Algoritmo institucional civil para control de hemorragias: aplicar por encima del sitio de sangrado y apretar hasta detenerlo.',
        title: 'Save a Life: What everyone should know to stop bleeding after an injury',
        url: 'https://www.stopthebleed.org/media/x3jbyfkp/save_a_life_flowchart.pdf',
      },
      {
        institution: 'American College of Surgeons / Stop the Bleed',
        note: 'Documento de consenso de trauma sobre control precoz de hemorragia y prioridad vital del torniquete en extremidades exanguinantes.',
        title: 'Hartford Consensus Compendium',
        url: 'https://www.stopthebleed.org/media/xt0hjwmw/hartford-consensus-compendium.pdf',
      },
      {
        institution: 'American College of Surgeons / YouTube',
        note: 'Video oficial del programa Stop the Bleed para apoyo audiovisual y evidencia docente.',
        title: 'How To STOP THE BLEED',
        url: 'https://www.youtube.com/watch?v=7LEqWoK_aS0',
      },
      {
      institution: 'Stop The Bleed',
      note: 'Diagrama oficial de control de hemorragias.',
      title: 'Save A Life Flowchart',
      url: 'https://www.stopthebleed.org/media/x3jbyfkp/save_a_life_flowchart.pdf',
    },
    {
      institution: 'Cruz Roja Española',
      note: 'Control inicial de hemorragias externas.',
      title: 'Hemorragias y control del sangrado',
      url: 'https://www.cruzroja.es/principal/web/ahora/hemorragias',
    },
    {
      institution: 'OPS',
      note: 'Material educativo sobre trauma y control de hemorragias.',
      title: 'Atención inicial al trauma',
      url: 'https://iris.paho.org/',
    },
    ],
  },
  burn_lab: {
    description:
      'Burn Lab se respalda en guias AHA/Red Cross, OMS, NIH/NLM, CDC/NIOSH y recursos clinicos institucionales para distinguir quemaduras termicas, quimicas, electricas, por frio, alquitran e inhalacion de humo.',
    rationale:
      'Ajuste pedagogico: distinguir causa y gravedad es esencial. La evidencia respalda enfriamiento con agua corriente limpia, retirar contaminantes cuando sea seguro, irrigacion en quimicas, evitar hielo/aceites/pasta y activar emergencias ante criterios de gravedad.',
    links: [
      {
        institution: 'American Heart Association / American Red Cross',
        note: 'Fuente guia para quemaduras termicas y criterios de derivacion o activacion de emergencias en primeros auxilios.',
        title: '2024 American Heart Association and American Red Cross Guidelines for First Aid',
        url: 'https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines',
      },
      {
        institution: 'World Health Organization',
        note: 'Resume que hacer y que no hacer en quemaduras, incluyendo agua corriente, irrigacion y prohibicion de pasta, aceite o hielo.',
        title: 'Burns',
        url: 'https://www.who.int/news-room/fact-sheets/detail/burns',
      },
      {
        institution: 'MedlinePlus / NIH-NLM',
        note: 'Refuerza manejo inicial, proteccion de la herida, senales de gravedad, inhalacion de humo y que no aplicar.',
        title: 'Burns: MedlinePlus Medical Encyclopedia',
        url: 'https://medlineplus.gov/ency/article/000030.htm',
      },
      {
        institution: 'Mayo Clinic',
        note: 'Especifica retirar ropa contaminada y enjuagar prolongadamente quemaduras quimicas.',
        title: 'Chemical burns: First aid',
        url: 'https://www.mayoclinic.org/first-aid/first-aid-chemical-burns/basics/art-20056667',
      },
      {
        institution: 'Mayo Clinic',
        note: 'Respalda seguridad de escena, posible RCP y cobertura inicial en lesiones electricas.',
        title: 'Electrical burns: First aid',
        url: 'https://www.mayoclinic.org/first-aid/first-aid-electrical-burns/basics/art-20056687',
      },
      {
        institution: 'Mayo Clinic',
        note: 'Apoya clasificacion de gravedad, retirada de objetos constrictivos, cobertura y criterios de atencion urgente.',
        title: 'Burns: First aid',
        url: 'https://www.mayoclinic.org/first-aid/first-aid-burns/basics/art-20056649',
      },
      {
        institution: 'NIOSH / CDC',
        note: 'Referencia federal para descontaminacion inicial; retirar exceso de solidos quimicos y luego lavar o irrigar.',
        title: 'First Aid Procedures for Chemical Hazards',
        url: 'https://www.cdc.gov/niosh/npg/firstaid.html',
      },
      {
        institution: 'NIOSH / CDC',
        note: 'Confirma que el oxido de calcio libera calor con agua, por lo que el caso debe ensenarse con precision.',
        title: 'NIOSH Pocket Guide to Chemical Hazards - Calcium oxide',
        url: 'https://www.cdc.gov/niosh/npg/npgd0093.html',
      },
      {
        institution: 'PubChem / NIH',
        note: 'Ficha NIH/PubChem con primeros auxilios para calcio oxido; util para revisar reglas especiales del minijuego.',
        title: 'Calcium Oxide',
        url: 'https://pubchem.ncbi.nlm.nih.gov/compound/Calcium-Oxide',
      },
      {
        institution: 'Mayo Clinic Health System / YouTube',
        note: 'Recurso audiovisual institucional para acompanar la evidencia escrita sobre quemaduras menores.',
        title: 'First aid tips: How to treat minor burns',
        url: 'https://www.youtube.com/watch?v=LIaqKI7B8EI',
      },
      {
      institution: 'OMS',
      note: 'Ficha oficial en español sobre quemaduras.',
      title: 'Quemaduras',
      url: 'https://www.who.int/es/news-room/fact-sheets/detail/burns',
    },
    {
      institution: 'MedlinePlus',
      note: 'Manejo inicial de quemaduras en español.',
      title: 'Quemaduras',
      url: 'https://medlineplus.gov/spanish/ency/article/000030.htm',
    },
    {
      institution: 'Manual MSD',
      note: 'Clasificación clínica y tratamiento inicial.',
      title: 'Quemaduras',
      url: 'https://www.msdmanuals.com/es/hogar/lesiones-y-envenenamientos/quemaduras/quemaduras',
    },
    {
      institution: 'CDC / NIOSH',
      note: 'Procedimientos de descontaminación química.',
      title: 'First Aid Procedures for Chemical Hazards',
      url: 'https://www.cdc.gov/niosh/npg/firstaid.html',
    },
    ],
  },
  tactical_triage: {
    description:
      'Tactical Triage se respalda en el Sistema de Triage de Manchester (MTS), referencias oficiales de Manchester Triage Group / ALSG, documentos tecnicos de implementacion y literatura indexada sobre validez y comparacion del MTS.',
    rationale:
      'El modulo usa MTS como marco intrahospitalario de cinco niveles. La evidencia de respaldo documenta gobernanza, entrenamiento, control de versiones, implementacion informatica y validacion academica del sistema.',
    links: [
      {
        institution: 'Deutsches Netzwerk Ersteinschätzung / triagenet',
        note: 'Documento tecnico oficial sobre proposito, procedimiento, copyright, orden de discriminadores, riesgo-limite e implementacion informatica del MTS.',
        title: 'Guideline For Implementation Of Manchester-Triage-Systems In An Hospital Information System',
        url: 'https://www.triagenet.net/content/mts_it_specification_german.pdf',
      },
      {
        institution: 'PubMed',
        note: 'Comparacion MTS vs ESI en simulacion.',
        title: 'MTS vs ESI Simulation',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19625548/',
      },
      {
      institution: 'PubMed',
      note: 'Validez y concordancia del Manchester Triage System.',
      title: 'Observer agreement of the Manchester Triage System and the Emergency Severity Index',
      url: 'https://pubmed.ncbi.nlm.nih.gov/19625548/',
    },
    {
      institution: 'Triagenet',
      note: 'Documento técnico oficial de implementación del MTS.',
      title: 'Guideline For Implementation Of Manchester-Triage-Systems',
      url: 'https://www.triagenet.net/content/mts_it_specification_german.pdf',
    },
    {
      institution: 'Manchester Triage Group',
      note: 'Sistema oficial de clasificación de urgencias por niveles.',
      title: 'Manchester Triage System',
      url: 'https://www.triage.nl/en/manchester-triage-system/',
    },
    ],
  },
};

export const evidenceCategories = [
  ['rcp_hero', 'RCP Hero'],
  ['choking_express', 'Choking Express'],
  ['tourniquet_code', 'Tourniquet Code'],
  ['burn_lab', 'Burn Lab'],
  ['tactical_triage', 'Tactical Triage Manchester MTS'],
];

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
      <ul className="mt-3 grid gap-2">
        {evidence.links.map((link) => (
          <li key={link.url}>
            <a
              className="flex items-start justify-between gap-3 rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-slate-950 dark:text-cyan-100 dark:hover:bg-cyan-400/10"
              href={link.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>
                <span className="block text-cyan-950 dark:text-cyan-50">{link.title}</span>
                <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
                  {link.institution}
                </span>
                {link.note ? (
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                    {link.note}
                  </span>
                ) : null}
              </span>
              <ExternalLink aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
