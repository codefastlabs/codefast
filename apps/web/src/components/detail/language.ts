export type Language = "en" | "ar" | "he";

export type Direction = "ltr" | "rtl";

/**
 * Per-language bundle: the reading direction plus the translated strings the
 * example renders. Keyed by language so RTL demos can swap copy and direction
 * together.
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
