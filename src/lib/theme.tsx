"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ThemeMode } from "@/types/game";

const THEME_KEY = "overclocked-theme";
const LEGACY_THEME_KEY = "cpu-tycoon-theme";

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved =
      (window.localStorage.getItem(THEME_KEY) as ThemeMode | null) ??
      (window.localStorage.getItem(LEGACY_THEME_KEY) as ThemeMode | null);
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const initial: ThemeMode =
      saved === "light" || saved === "dark" ? saved : prefersLight ? "light" : "dark";
    applyThemeClass(initial);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate theme from localStorage
    setThemeState(initial);
    setReady(true);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    applyThemeClass(next);
    window.localStorage.setItem(THEME_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, ready }),
    [theme, toggleTheme, setTheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
