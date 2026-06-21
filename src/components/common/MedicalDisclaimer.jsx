import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MedicalDisclaimer() {
  return (
    <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
        <p className="text-sm font-semibold leading-6">
          Atención: Esta es una simulación educativa basada en investigaciones
          teórico-prácticas y no reemplaza el criterio de un profesional de la
          salud. Aún se encuentra en proceso para tener el aval de un médico clínico oficial. En una emergencia
          real, el primer paso SIEMPRE es llamar a los servicios de emergencia
          (ej. 911).
        </p>
      </div>
    </div>
  );
}
