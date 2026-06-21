import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-200">
          Cargando sesión...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children;
}
