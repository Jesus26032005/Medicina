import React from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Footer from './components/common/Footer';
import MedicalBackingPage from './components/common/MedicalBackingPage';
import ScrollToTop from './components/common/ScrollToTop';
import GlobalEvidence from './components/dashboard/GlobalEvidence';
import UserDashboard from './components/dashboard/UserDashboard';
import BurnLab from './components/games/BurnLab';
import ChokingExpress from './components/games/ChokingExpress';
import RcpHero from './components/games/RcpHero';
import TacticalTriage from './components/games/TacticalTriage';
import TourniquetCode from './components/games/TourniquetCode';
import { AuthProvider } from './context/AuthContext';

function GamePlaceholder() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
          Ruta protegida
        </p>
        <h1 className="mt-2 text-2xl font-bold">Modulo de juego</h1>
        <p className="mt-3 text-slate-300">
          Aqui construiremos la experiencia interactiva y guardaremos la
          telemetria en Supabase.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
          to="/dashboard"
        >
          Volver al dashboard
        </Link>
      </div>
    </main>
  );
}

function GameRouter() {
  const { gameKey } = useParams();

  if (gameKey === 'rcp_hero') {
    return <RcpHero />;
  }

  if (gameKey === 'burn_lab') {
    return <BurnLab />;
  }

  if (gameKey === 'tourniquet_code') {
    return <TourniquetCode />;
  }

  if (gameKey === 'choking_express') {
    return <ChokingExpress />;
  }

  if (gameKey === 'tactical_triage') {
    return <TacticalTriage />;
  }

  return <GamePlaceholder />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <div className="isolate flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden">
          <div className="flex-1">
            <Routes>
              <Route element={<Navigate replace to="/login" />} path="/" />
              <Route element={<AuthPage />} path="/login" />
              <Route element={<GlobalEvidence />} path="/evidencia" />
              <Route element={<MedicalBackingPage />} path="/respaldo-medico" />
              <Route
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
                path="/dashboard"
              />
              <Route
                element={
                  <ProtectedRoute>
                    <GameRouter />
                  </ProtectedRoute>
                }
                path="/games/:gameKey"
              />
              <Route element={<Navigate replace to="/login" />} path="*" />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
