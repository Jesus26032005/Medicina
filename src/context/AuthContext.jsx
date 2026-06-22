import {
  createContext,
  default as React,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!supabase) {
        setAuthError(
          'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env.'
        );
        setLoading(false);
        return;
      }

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }

    loadSession();

    if (!supabase) {
      loadSession();
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }, []);

  const register = useCallback(async ({ email, password, fullName }) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
    const { data: isUsernameAvailable, error: usernameCheckError } = await supabase.rpc(
      'is_username_available',
      { candidate: normalizedFullName }
    );

    if (usernameCheckError) {
      throw new Error('No se pudo verificar la disponibilidad del nombre de usuario.');
    }

    if (!isUsernameAvailable) {
      throw new Error('username already registered');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: normalizedFullName,
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      authError,
      isAuthenticated: Boolean(session?.user),
      login,
      register,
      logout,
    }),
    [session, user, loading, authError, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
