import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Brush,
  Droplets,
  Flame,
  HelpCircle,
  Package,
  RotateCcw,
  Save,
  ShieldAlert,
  Snowflake,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../common/MedicalDisclaimer';
import ThemeToggle from '../common/ThemeToggle';
import VideoTutorialModal from '../common/VideoTutorialModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const toolDefinitions = {
  airway_assessment: {
    icon: Wind,
    label: 'Evaluar Via Aerea',
  },
  brush_powder: {
    icon: Brush,
    label: 'Cepillar Polvo',
  },
  butter: {
    icon: Package,
    label: 'Mantequilla',
  },
  call_emergency: {
    icon: Activity,
    label: 'Activar Emergencias',
  },
  cool_water: {
    icon: Droplets,
    label: 'Agua Fria',
  },
  copious_irrigation: {
    icon: Droplets,
    label: 'Irrigacion Abundante',
  },
  dry_cover: {
    icon: Package,
    label: 'Cobertura Seca',
  },
  ice: {
    icon: Snowflake,
    label: 'Hielo',
  },
  no_remove_tar: {
    icon: ShieldAlert,
    label: 'No Retirar Alquitran',
  },
  neutralizer: {
    icon: Package,
    label: 'Neutralizante Casero',
  },
  remove_clothing: {
    icon: Brush,
    label: 'Retirar Ropa Contaminada',
  },
  remove_jewelry: {
    icon: BadgeCheck,
    label: 'Retirar Joyeria',
  },
  sterile_gauze: {
    icon: BadgeCheck,
    label: 'Gasa Esteril',
  },
  stop_burning: {
    icon: Flame,
    label: 'Apagar Fuente de Calor',
  },
  sunscreen: {
    icon: Sun,
    label: 'Crema Solar',
  },
  toothpaste: {
    icon: Brush,
    label: 'Pasta de Dientes',
  },
  warm_water: {
    icon: Droplets,
    label: 'Agua Tibia',
  },
};

const clinicalCases = [
  {
    id: 'thermal_boiling_water',
    title: 'Termica: agua hirviendo',
    mechanism: 'Escaldadura en antebrazo por agua a alta temperatura.',
    visual: 'thermal',
    hint: 'Enfria poco a poco y cubre limpio. Nada de remedios grasosos.',
    correctTools: {
      cool_water: 'Correcto: el agua fresca baja el calor que sigue danando la piel.',
      remove_jewelry: 'Correcto: si la zona se hincha, anillos o pulseras pueden apretar demasiado.',
      sterile_gauze: 'Correcto: cubrir con gasa limpia protege la piel abierta.',
    },
    incorrectTools: {
      butter: 'Error: la grasa guarda el calor como una tapa y hace que la quemadura siga cocinandose.',
      ice: 'Error: el hielo cierra las venas de golpe y quema la piel por frio, empeorando todo.',
      toothpaste: 'Error: la pasta tiene quimicos y suciedad; puede irritar e infectar la herida.',
    },
  },
  {
    id: 'thermal_direct_fire',
    title: 'Termica: fuego directo',
    mechanism: 'Llama directa en manga de ropa con quemadura irregular.',
    visual: 'thermal',
    hint: 'Primero detén lo que quema; luego enfria y cubre limpio.',
    correctTools: {
      stop_burning: 'Correcto: apagar la fuente evita que la piel siga recibiendo calor.',
      cool_water: 'Correcto: el agua fresca frena el calor que queda atrapado.',
      sterile_gauze: 'Correcto: cubrir limpio baja el roce, el dolor y la suciedad.',
    },
    incorrectTools: {
      butter: 'Error: la mantequilla atrapa calor y deja una capa dificil de limpiar.',
      ice: 'Error: el frio extremo tambien quema y puede matar piel que aun podia salvarse.',
      toothpaste: 'Error: la pasta no es esteril; ensucia una herida que debe estar limpia.',
    },
  },
  {
    id: 'chemical_liquid_acid',
    title: 'Quimica liquida: acido clorhidrico',
    mechanism: 'Salpicadura liquida acida en piel y ropa.',
    visual: 'chemical',
    hint: 'Si es liquido corrosivo, quita lo contaminado y enjuaga con mucha agua.',
    correctTools: {
      remove_clothing: 'Correcto: la ropa mojada con quimico sigue quemando si se queda pegada.',
      copious_irrigation: 'Correcto: mucha agua ayuda a arrastrar y diluir el acido. La irrigacion con agua abundante debe mantenerse entre 15 y 30 minutos continuos.',
      call_emergency: 'Correcto: una quemadura quimica necesita revision profesional.',
    },
    incorrectTools: {
      neutralizer: 'Error: mezclar quimicos en casa puede calentar la zona y empeorar la quemadura.',
      butter: 'Error: la grasa deja el corrosivo atrapado contra la piel.',
      sterile_gauze: 'Error: tapar antes de enjuagar deja el quimico trabajando sobre la piel.',
    },
  },
  {
    id: 'chemical_powder_quicklime',
    title: 'Quimica en polvo: cal viva',
    mechanism: 'Polvo alcalino reactivo sobre antebrazo.',
    visual: 'chemical',
    hint: 'Si es polvo que reacciona con agua, primero retiralo en seco.',
    correctTools: {
      brush_powder: 'Correcto: quitar el polvo en seco evita activar mas reaccion.',
      dry_cover: 'Correcto: cubrir seco protege sin mojar el quimico.',
      call_emergency: 'Correcto: estos quimicos pueden seguir entrando profundo en la piel.',
    },
    incorrectTools: {
      cool_water: 'Error critico: la cal viva con agua puede calentarse de golpe y quemar mas.',
      copious_irrigation: 'Error critico: mojar antes de quitar el polvo puede activar la reaccion.',
      butter: 'Error: la grasa pega el quimico a la piel.',
    },
  },
  {
    id: 'electrical_high_voltage',
    title: 'Electrica: alto voltaje',
    mechanism: 'Marca de entrada y salida electrica; el peligro puede estar por dentro.',
    visual: 'electrical',
    hint: 'Aqui lo peligroso puede estar por dentro: llama emergencias y revisa respiracion.',
    correctTools: {
      call_emergency: 'Correcto: con electricidad fuerte, el corazon puede estar en riesgo aunque la piel se vea pequena.',
      airway_assessment: 'Correcto: hay que revisar respiracion y estado general, no solo la quemadura.',
      sterile_gauze: 'Correcto: cubrir limpio protege las marcas visibles.',
    },
    incorrectTools: {
      cool_water: 'Error: si la escena no es segura, el agua puede ponerte en peligro tambien.',
      butter: 'Error: la mantequilla no ayuda al posible dano interno ni al corazon.',
      ice: 'Error: el hielo no arregla el riesgo electrico interno.',
    },
  },
  {
    id: 'friction_motorcycle',
    title: 'Friccion: caida de motocicleta',
    mechanism: 'Abrasiones extensas con contaminacion por asfalto.',
    visual: 'friction',
    hint: 'Piensa en enfriar, limpiar suavemente y cubrir sin productos contaminantes.',
    correctTools: {
      cool_water: 'Correcto: el agua ayuda a enfriar y retirar suciedad superficial.',
      sterile_gauze: 'Correcto: cubrir disminuye contaminacion y dolor.',
      call_emergency: 'Correcto: abrasiones extensas pueden coexistir con trauma mayor.',
    },
    incorrectTools: {
      toothpaste: 'Error: agrega quimicos y bacterias a una herida ya contaminada.',
      butter: 'Error: una grasa impide limpieza adecuada de particulas.',
      ice: 'Error: el hielo baja el flujo de sangre en la piel y no limpia la suciedad.',
    },
  },
  {
    id: 'cold_liquid_nitrogen',
    title: 'Congelamiento: nitrogeno liquido',
    mechanism: 'Quemadura por frio extremo con piel palida y rigida.',
    visual: 'cold',
    hint: 'No frotes ni uses hielo; recalienta de forma controlada.',
    correctTools: {
      warm_water: 'Correcto: el recalentamiento gradual con agua tibia protege tejido congelado.',
      sterile_gauze: 'Correcto: cubrir sin comprimir protege la piel fragil.',
      call_emergency: 'Correcto: lesiones por frio extremo pueden tener dano profundo.',
    },
    incorrectTools: {
      ice: 'Error: aumenta la lesion por congelacion.',
      cool_water: 'Error: el agua fria perpetua la perdida de calor.',
      butter: 'Error: no recalienta tejido y dificulta la evaluacion.',
    },
  },
  {
    id: 'solar_second_degree',
    title: 'Solar: quemadura grave de 2do grado',
    mechanism: 'Ampollas extensas tras exposicion solar prolongada.',
    visual: 'thermal',
    hint: 'Enfria, cubre y deriva si hay ampollas extensas o compromiso sistemico.',
    correctTools: {
      cool_water: 'Correcto: enfriar alivia dolor y reduce calor residual.',
      sterile_gauze: 'Correcto: cubrir ampollas intactas reduce friccion y contaminacion.',
      call_emergency: 'Correcto: ampollas extensas requieren valoracion por perdida de barrera cutanea.',
    },
    incorrectTools: {
      sunscreen: 'Error: el protector solar no se aplica sobre quemadura abierta o ampollada.',
      toothpaste: 'Error: irrita piel danada y aumenta riesgo infeccioso.',
      ice: 'Error: el frio extremo puede profundizar la lesion.',
    },
  },
  {
    id: 'hot_tar',
    title: 'Alquitran caliente',
    mechanism: 'Material caliente adherido a piel.',
    visual: 'tar',
    hint: 'Enfria el material, pero no lo arranques de la piel.',
    correctTools: {
      cool_water: 'Correcto: enfriar solidifica y baja la temperatura del alquitran.',
      no_remove_tar: 'Correcto: arrancarlo puede retirar piel viable adherida.',
      call_emergency: 'Correcto: requiere manejo clinico para retirada segura.',
    },
    incorrectTools: {
      brush_powder: 'Error: friccionar puede desgarrar piel adherida al material.',
      butter: 'Error: no enfria adecuadamente y contamina la zona.',
      ice: 'Error: el frio extremo puede lesionar mas tejido.',
    },
  },
  {
    id: 'smoke_inhalation_airway',
    title: 'Inhalacion de humo / vias aereas',
    mechanism: 'Quemadura facial con tos, hollin y ronquera.',
    visual: 'airway',
    hint: 'Si respiro humo, lo urgente puede ser que la garganta se cierre, no solo la piel.',
    correctTools: {
      airway_assessment: 'Correcto: ronquera y hollin son pistas de que respirar puede ponerse dificil.',
      call_emergency: 'Correcto: necesita ayuda urgente y vigilancia para respirar.',
      cool_water: 'Correcto: enfria la piel visible, pero sin retrasar la ayuda.',
    },
    incorrectTools: {
      butter: 'Error: no ayuda a respirar y retrasa lo importante.',
      toothpaste: 'Error: ensucia la cara quemada y no ayuda con el humo inhalado.',
      sterile_gauze: 'Error: cubrir la piel no reemplaza revisar si puede respirar bien.',
    },
  },
];

const burnNotes = [
  'No todas las quemaduras se tratan igual: primero piensa que la causo.',
  'Si el quimico esta en polvo, a veces mojarlo de inmediato puede empeorar la reaccion.',
  'Con electricidad, una marca pequena en la piel puede esconder un problema serio por dentro.',
  'Mantequilla, pasta dental y remedios caseros suelen ensuciar, atrapar calor o retrasar ayuda real.',
  'Si hubo humo, tos o ronquera, lo urgente puede ser respirar, no solo la piel.',
];

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateNormalizedScore(initialPrecision, finalPrecision, errorsCount) {
  const improvementBonus = Math.max(0, finalPrecision - initialPrecision) * 0.5;
  return Math.round(clamp(finalPrecision - errorsCount * 2 + improvementBonus, 0, 100));
}

function buildToolList(caseData) {
  return [...Object.keys(caseData.correctTools), ...Object.keys(caseData.incorrectTools)];
}

function getTool(toolId) {
  return toolDefinitions[toolId];
}

export default function BurnLab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(() => getRandomItem(clinicalCases));
  const [score, setScore] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [usedTools, setUsedTools] = useState([]);
  const [actions, setActions] = useState([]);
  const [alert, setAlert] = useState('Evalua el mecanismo y selecciona la conducta segura.');
  const [shakeKey, setShakeKey] = useState(0);
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [showBriefing, setShowBriefing] = useState(true);
  const startTimeRef = useRef(Date.now());

  const caseTools = useMemo(() => buildToolList(caseData), [caseData]);
  const correctToolIds = useMemo(() => Object.keys(caseData.correctTools), [caseData]);
  const correctApplied = useMemo(
    () => usedTools.filter((toolId) => correctToolIds.includes(toolId)).length,
    [correctToolIds, usedTools]
  );
  const precision = Math.round((correctApplied / correctToolIds.length) * 100);

  const persistSession = useCallback(
    async (nextResults, finalActions) => {
      if (!supabase || !user?.id) {
        setSaveState('error');
        setSaveError('No se pudo guardar: falta sesion activa o Supabase.');
        return;
      }

      setSaveState('saving');
      setSaveError('');

      const { error } = await supabase.from('game_sessions').insert({
        user_id: user.id,
        game_key: 'burn_lab',
        initial_precision: 0,
        final_precision: nextResults.precision,
        completion_time_seconds: nextResults.completionTimeSeconds,
        errors_count: nextResults.errorsCount,
        score: nextResults.score,
        telemetry: {
          actions: finalActions,
          case_id: caseData.id,
          case_title: caseData.title,
          correct_applied: nextResults.correctApplied,
          correct_tools: correctToolIds,
          mechanism: caseData.mechanism,
          missed_tools: correctToolIds.filter((toolId) => !usedTools.includes(toolId)),
          wrong_tools: finalActions
            .filter((action) => !action.correct)
            .map((action) => action.tool_id),
        },
      });

      if (error) {
        setSaveState('error');
        setSaveError(error.message);
        return;
      }

      setSaveState('saved');
    },
    [caseData, correctToolIds, usedTools, user?.id]
  );

  const finishGame = useCallback(
    (nextErrorsCount, nextUsedTools, nextActions) => {
      const nextCorrectApplied = nextUsedTools.filter((toolId) =>
        correctToolIds.includes(toolId)
      ).length;
      const nextPrecision = Math.round((nextCorrectApplied / correctToolIds.length) * 100);
      const nextScore = calculateNormalizedScore(0, nextPrecision, nextErrorsCount);
      const nextResults = {
        caseTitle: caseData.title,
        completionTimeSeconds: Math.max(
          1,
          Math.round((Date.now() - startTimeRef.current) / 1000)
        ),
        correctApplied: nextCorrectApplied,
        errorsCount: nextErrorsCount,
        note: getRandomItem(burnNotes),
        precision: nextPrecision,
        score: nextScore,
      };

      setResults(nextResults);
      persistSession(nextResults, nextActions);
    },
    [caseData.title, correctToolIds, persistSession]
  );

  function applyTool(toolId) {
    if (results || usedTools.includes(toolId)) {
      return;
    }

    const tool = getTool(toolId);
    const isCorrect = Boolean(caseData.correctTools[toolId]);
    const feedback = caseData.correctTools[toolId] ?? caseData.incorrectTools[toolId];

    if (!tool || !feedback) {
      return;
    }

    const scoreDelta = isCorrect ? 45 : feedback.includes('critico') ? -35 : -20;
    const nextUsedTools = [...usedTools, toolId];
    const nextErrorsCount = errorsCount + (isCorrect ? 0 : 1);
    const nextCorrectApplied = nextUsedTools.filter((nextToolId) =>
      correctToolIds.includes(nextToolId)
    ).length;
    const nextPrecision = Math.round((nextCorrectApplied / correctToolIds.length) * 100);
    const nextScore = calculateNormalizedScore(0, nextPrecision, nextErrorsCount);
    const action = {
      correct: isCorrect,
      feedback,
      score_delta: scoreDelta,
      tool_id: toolId,
      tool_label: tool.label,
      timestamp_ms: Date.now() - startTimeRef.current,
    };
    const nextActions = [...actions, action];

    setUsedTools(nextUsedTools);
    setScore(nextScore);
    setErrorsCount(nextErrorsCount);
    setActions(nextActions);
    setAlert(feedback);

    if (!isCorrect) {
      setShakeKey((key) => key + 1);
      if (navigator.vibrate) {
        navigator.vibrate(140);
      }
    }

    if (correctToolIds.every((correctId) => nextUsedTools.includes(correctId))) {
      finishGame(nextErrorsCount, nextUsedTools, nextActions);
    }
  }

  function handleDragStart(event, toolId) {
    event.dataTransfer.setData('text/plain', toolId);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event) {
    event.preventDefault();
    applyTool(event.dataTransfer.getData('text/plain'));
  }

  function resetGame(nextCase = getRandomItem(clinicalCases)) {
    startTimeRef.current = Date.now();
    setCaseData(nextCase);
    setScore(0);
    setErrorsCount(0);
    setUsedTools([]);
    setActions([]);
    setAlert('Evalua el mecanismo y selecciona la conducta segura.');
    setShakeKey(0);
    setResults(null);
    setSaveState('idle');
    setSaveError('');
    setShowBriefing(true);
  }

  function startSimulation() {
    startTimeRef.current = Date.now();
    setShowBriefing(false);
  }

  function showHint() {
    setAlert(`Pista: ${caseData.hint}`);
  }

  return (
    <main
      className="min-h-screen bg-slate-950 text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(14,165,233,0.12), transparent 26%), linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px)',
        backgroundSize: 'auto, 30px 30px, 30px 30px',
      }}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            to="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">
            Caso aleatorio: {caseData.title}
          </div>
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" />
        </header>

        {showBriefing ? (
          <Briefing caseData={caseData} onStart={startSimulation} />
        ) : (
          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_380px]">
            <section>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                Sala de urgencias - Burn Lab
              </p>
              <h1 className="mt-2 text-2xl font-bold md:text-5xl">
                {caseData.title}
              </h1>
              <p className="mt-4 max-w-2xl text-slate-300">{caseData.mechanism}</p>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
                <motion.div
                  animate={
                    shakeKey
                      ? {
                          x: [0, -12, 12, -8, 8, 0],
                          borderColor: [
                            'rgba(248,113,113,0.8)',
                            'rgba(248,113,113,1)',
                            'rgba(248,113,113,0.8)',
                          ],
                        }
                      : { x: 0 }
                  }
                  className="relative flex min-h-[440px] flex-col items-center justify-center overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30"
                  key={`${caseData.id}-${shakeKey}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  transition={{ duration: 0.36 }}
                >
                  <div className="absolute left-4 top-4 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100">
                    Mecanismo: {caseData.visual}
                  </div>
                  <PatientVector visual={caseData.visual} />
                  <p className="mt-5 text-center text-sm font-semibold text-cyan-100">
                    Zona de intervencion
                  </p>
                  <p className="mt-2 max-w-sm text-center text-sm text-slate-400">
                    Suelta o selecciona herramientas. Completa todas las acciones correctas.
                  </p>
                </motion.div>

                <div className="rounded-lg border border-cyan-300/20 bg-white p-4 text-slate-950 shadow-2xl shadow-cyan-950/20 dark:bg-slate-900 dark:text-white">
                  <h2 className="font-bold">Bandeja de instrumental</h2>
                  <div className="mt-4 grid gap-3">
                    {caseTools.map((toolId) => {
                      const tool = getTool(toolId);
                      const ToolIcon = tool.icon;
                      const used = usedTools.includes(toolId);

                      return (
                        <button
                          className={`flex cursor-grab items-center justify-between gap-3 rounded-md border px-3 py-3 text-left text-sm font-semibold transition ${
                            used
                              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
                              : 'border-slate-200 bg-white text-slate-900 hover:border-cyan-300 hover:bg-cyan-50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:bg-cyan-400/10'
                          }`}
                          draggable={!used}
                          key={toolId}
                          onClick={() => applyTool(toolId)}
                          onDragStart={(event) => handleDragStart(event, toolId)}
                          type="button"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                              <ToolIcon aria-hidden="true" className="h-5 w-5" />
                            </span>
                            {tool.label}
                          </span>
                          {used ? <BadgeCheck aria-hidden="true" className="h-4 w-4" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <aside className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-black/20 dark:bg-slate-900 dark:text-white">
              <h2 className="text-lg font-bold">Telemetria del caso</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Score" value={score} />
                <Metric label="Fallos" value={errorsCount} />
                <Metric label="Correctos" value={`${correctApplied}/${correctToolIds.length}`} />
                <Metric label="Precision" value={`${precision}%`} />
              </div>
              <div
                className={`mt-5 rounded-md border p-4 ${
                  alert.includes('Error')
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-300/30 dark:bg-red-400/10 dark:text-red-100'
                    : 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100'
                }`}
              >
                <p className="text-sm font-bold">Respuesta clinica</p>
                <p className="mt-2 text-sm leading-6">{alert}</p>
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  className="flex h-12 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700"
                  onClick={showHint}
                  type="button"
                >
                  <HelpCircle aria-hidden="true" className="h-4 w-4" />
                  Ayuda/Pista
                </button>
                <button
                  className="flex h-12 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={() => resetGame()}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  Nuevo caso
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>

      {results ? (
        <ResultsModal
          onRestart={() => resetGame()}
          results={results}
          saveError={saveError}
          saveState={saveState}
          onExit={() => navigate('/dashboard')}
        />
      ) : null}
    </main>
  );
}

function PatientVector({ visual }) {
  const visualStyles = {
    airway: 'bg-slate-700',
    chemical: 'bg-lime-500',
    cold: 'bg-cyan-300',
    electrical: 'bg-yellow-400',
    friction: 'bg-red-700',
    tar: 'bg-slate-950',
    thermal: 'bg-red-500',
  };
  const iconMap = {
    airway: Wind,
    chemical: ShieldAlert,
    cold: Snowflake,
    electrical: Zap,
    friction: Brush,
    tar: Package,
    thermal: Flame,
  };
  const VisualIcon = iconMap[visual] ?? Flame;

  return (
    <div className="relative flex h-72 w-full max-w-lg items-center justify-center">
      <div className="absolute h-28 w-[88%] rounded-full bg-gradient-to-r from-amber-200 via-rose-100 to-amber-200 shadow-inner" />
      <div className="absolute left-[8%] h-32 w-32 rounded-full bg-amber-200" />
      <div className="absolute right-[4%] h-24 w-24 rounded-full bg-amber-100" />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        className={`relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/60 text-white shadow-2xl ${visualStyles[visual] ?? 'bg-red-500'}`}
        transition={{ duration: 1.1, repeat: Infinity }}
      >
        <VisualIcon aria-hidden="true" className="h-14 w-14" />
      </motion.div>
    </div>
  );
}

function Briefing({ caseData, onStart }) {
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
        <h1 className="mt-2 text-3xl font-bold">{caseData.title}</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-bold">Que paso</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{caseData.mechanism}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-bold">Instrucciones</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              En computadora: haz clic en la herramienta y aplicala al caso. En
              celular: toca cada opcion de la bandeja medica. Elige solo lo que
              enfria, limpia o protege; evita mitos que atrapan calor, ensucian
              o activan reacciones raras.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <h2 className="font-bold text-cyan-950 dark:text-cyan-100">Como se mide Inicio vs Final</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
            Inicio parte en 0 porque todavia no has elegido ningun tratamiento.
            Final es el porcentaje de acciones correctas aplicadas al caso. El
            score final queda entre 0 y 100, penalizando mitos o elecciones
            peligrosas.
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
          <VideoTutorialModal title="Video tutorial quemaduras" videoId="cECkv6xUuTY" />
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
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white md:p-6"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Notas de la IA
            </p>
            <h2 className="mt-1 text-2xl font-bold">{results.caseTitle}</h2>
          </div>
          <div className="rounded-md bg-rose-50 px-3 py-2 text-right dark:bg-rose-400/10">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-200">Score</p>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-100">{results.score}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Precision final" value={`${results.precision}%`} />
          <Metric label="Fallos" value={results.errorsCount} />
          <Metric label="Tiempo" value={`${results.completionTimeSeconds}s`} />
        </div>

        <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-400/10">
          <p className="text-sm font-bold text-cyan-950 dark:text-cyan-100">Nota adicional</p>
          <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">{results.note}</p>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? 'Guardando evidencia en Supabase...' : null}
          {saveState === 'saved' ? 'Evidencia guardada en Supabase.' : null}
          {saveState === 'error' ? `No se guardo la evidencia: ${saveError}` : null}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            className="flex h-12 w-full touch-manipulation select-none items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 sm:w-auto"
            onClick={onExit}
            type="button"
          >
            Salir al Dashboard
          </button>
          <button
            className="flex h-12 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
            onClick={onRestart}
            type="button"
          >
            <ShieldAlert aria-hidden="true" className="h-4 w-4" />
            Nuevo caso
          </button>
        </div>
      </motion.section>
    </div>
  );
}
