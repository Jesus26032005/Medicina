import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck } from 'lucide-react';

export default function MedicalBackingModal({ className = '' }) {
  return (
    <Link
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 ${className}`}
      to="/respaldo-medico"
    >
      <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
      Ver Respaldo Medico y Fuentes
    </Link>
  );
}
