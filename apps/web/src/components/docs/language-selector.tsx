import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codefast/ui/select";
import { cn } from "@codefast/ui/lib/utils";

export type Language = "en" | "ar" | "he";

export type Direction = "ltr" | "rtl";

/**
 * Per-language bundle: the reading direction plus the translated strings the
 * example renders. Mirrors shadcn's RTL example shape so demos port cleanly.
 */
export type Translations<T extends Record<string, string> = Record<string, string>> = Record<
  Language,
  {
    dir: Direction;
    locale?: string;
    values: T;
  }
>;

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "he", label: "Hebrew (עברית)" },
] as const;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * Holds the active language for an RTL example so the toolbar selector and the
 * demo body stay in sync. Scope one provider per example preview.
 */
export function LanguageProvider({
  children,
  defaultLanguage = "ar",
}: {
  children: ReactNode;
  defaultLanguage?: Language;
}): ReactNode {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
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

export interface LanguageSelectorProps {
  value: Language;
  onValueChange: (value: Language) => void;
  className?: string;
  languages?: Array<Language>;
}

/** The `ltr` dropdown that switches the active language of an RTL preview. */
export function LanguageSelector({
  value,
  onValueChange,
  className,
  languages = ["en", "ar", "he"],
}: LanguageSelectorProps): ReactNode {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as Language)}>
      <SelectTrigger
        size="sm"
        dir="ltr"
        data-name="language-selector"
        className={cn("w-36", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent dir="ltr">
        <SelectGroup>
          {languageOptions
            .filter((option) => languages.includes(option.value))
            .map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
