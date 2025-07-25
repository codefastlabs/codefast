"use client";

import type { JSX, ReactNode } from "react";

import Cookies from "js-cookie";
import { createContext, useContext, useEffect, useState } from "react";

const THEME_COOKIE_NAME = "active_theme";
const DEFAULT_THEME = "default";

function setThemeCookie(theme: string): void {
  if (typeof globalThis === "undefined") {
    return;
  }

  Cookies.set(THEME_COOKIE_NAME, theme, {
    expires: 365,
    path: "/",
    sameSite: "Lax",
    secure: globalThis.location.protocol === "https:",
  });
}

interface ThemeContextValue {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: string;
}): JSX.Element {
  const [activeTheme, setActiveTheme] = useState<string>(() => initialTheme ?? DEFAULT_THEME);

  useEffect(() => {
    setThemeCookie(activeTheme);

    const element = document.documentElement;

    for (const className of [...element.classList].filter((currentClass) =>
      currentClass.startsWith("theme-"),
    )) {
      element.classList.remove(className);
    }

    element.classList.add(`theme-${activeTheme}`);

    if (activeTheme.endsWith("-scaled")) {
      element.classList.add("theme-scaled");
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeConfig must be used within an ActiveThemeProvider");
  }

  return context;
}
