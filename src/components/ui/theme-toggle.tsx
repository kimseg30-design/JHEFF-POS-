'use client';

import React from 'react';
import { useTheme } from '@/lib/contexts/theme-context';
import { Sun, Moon, Laptop } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'header' | 'button' | 'switch' | 'dropdown-item';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'header',
  showLabel = false,
}) => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'switch') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors p-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          isDark ? 'bg-orange-600 border border-orange-500/50' : 'bg-gray-200 border border-gray-300'
        } ${className}`}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
      >
        <span className="sr-only">Toggle dark mode</span>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md ${
            isDark ? 'translate-x-8 bg-gray-900 text-amber-300' : 'translate-x-0 bg-white text-orange-500'
          }`}
        >
          {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </motion.div>
      </button>
    );
  }

  if (variant === 'dropdown-item') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
          isDark 
            ? 'hover:bg-gray-800 text-gray-200' 
            : 'hover:bg-gray-50 text-gray-700'
        } ${className}`}
        role="menuitem"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${
            isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-orange-100 text-orange-600'
          }`}>
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <span className="font-bold text-sm">
            {isDark ? 'Dark Theme' : 'Light Theme'}
          </span>
        </div>
        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {isDark ? 'On' : 'Off'}
        </span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-700 text-amber-300 border-gray-700 shadow-sm'
            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-xs'
        } ${className}`}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-gray-600" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // 'header' variant (compact, polished button with icon + dynamic label)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`px-2.5 py-2 sm:px-3 rounded-2xl border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
        isDark
          ? 'bg-gray-800/90 hover:bg-gray-700 text-amber-300 border-gray-700 shadow-xs'
          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-xs'
      } ${className}`}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.6, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 drop-shadow-xs" />
        ) : (
          <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
        )}
      </motion.div>
      <span className={`text-xs font-bold ${showLabel ? 'inline' : 'hidden sm:inline'} select-none`}>
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

