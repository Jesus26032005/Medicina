import React, { useEffect, useState } from 'react';
import { Eye, Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  const [colorBlindMode, setColorBlindMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return localStorage.getItem('color-blind-mode') === 'enabled';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorBlindMode);
    localStorage.setItem('color-blind-mode', colorBlindMode ? 'enabled' : 'disabled');
  }, [colorBlindMode]);

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
        className={`flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10 ${className}`}
        onClick={() => setDarkMode((value) => !value)}
        title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        type="button"
      >
        {darkMode ? (
          <Sun aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Moon aria-hidden="true" className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>
      <button
        aria-label={colorBlindMode ? 'Desactivar modo daltónico' : 'Activar modo daltónico'}
        aria-pressed={colorBlindMode}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-md border transition ${
          colorBlindMode
            ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10'
        }`}
        onClick={() => setColorBlindMode((value) => !value)}
        title={colorBlindMode ? 'Desactivar modo daltónico' : 'Activar modo daltónico'}
        type="button"
      >
        <Eye aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
