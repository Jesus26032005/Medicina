import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MedicalDisclaimer() {
  return (
    <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
        <p className="text-sm font-semibold leading-6">
          Atención: Esta simulación educativa cuenta con revisión y aval
          técnico-algorítmico de un profesional de la salud. Este respaldo no
          constituye una certificación sanitaria ni sustituye cursos
          acreditados, entrenamiento práctico, diagnóstico, valoración o
          atención de un profesional. En una emergencia real, llama de
          inmediato a los servicios de emergencia (por ejemplo, 911) y sigue
          sus indicaciones.
        </p>
      </div>
    </div>
  );
}
