import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import type { Direction, Language, Translations } from "#/features/components-catalog/components/detail/language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps extends Omit<ComponentProps<typeof LanguageContext.Provider>, "value"> {
  readonly defaultLanguage?: Language;
}

/**
 * Holds the active language for an RTL example so the toolbar selector and the
 * demo body stay in sync. Scope one provider per example preview.
 */
export function LanguageProvider({ defaultLanguage = "ar", ...props }: LanguageProviderProps): ReactNode {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  return <LanguageContext.Provider value={{ language, setLanguage }} {...props} />;
}

export function useLanguageContext(): LanguageContextValue | undefined {
  return useContext(LanguageContext);
}

/**
 * Resolves the active language and its translation bundle. Prefers the nearest
 * `LanguageProvider`; falls back to local state so an example still works when
 * rendered outside a provider.
 */
export function useTranslation<T extends Record<string, string>>(
  translations: Translations<T>,
  defaultLanguage: Language = "ar",
): {
  language: Language;
  setLanguage: (language: Language) => void;
  dir: Direction;
  locale: string | undefined;
  t: T;
} {
  const context = useLanguageContext();
  const [localLanguage, setLocalLanguage] = useState<Language>(defaultLanguage);

  const language = context?.language ?? localLanguage;
  const setLanguage = context?.setLanguage ?? setLocalLanguage;

  const { dir, locale, values: t } = translations[language];

  return { language, setLanguage, dir, locale, t };
}
