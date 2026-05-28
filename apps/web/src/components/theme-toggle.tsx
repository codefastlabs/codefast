import type { ColorScheme } from "@codefast/theme";
import { useColorScheme } from "@codefast/theme";

const NEXT_SCHEME: Record<ColorScheme, ColorScheme> = {
  light: "dark",
  dark: "automatic",
  automatic: "light",
};

const LABEL: Record<ColorScheme, string> = {
  light: "Light",
  dark: "Dark",
  automatic: "Auto",
};

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  function toggleColorScheme() {
    void setColorScheme(NEXT_SCHEME[colorScheme]);
  }

  const label = `Appearance: ${LABEL[colorScheme]}. Click to switch.`;

  return (
    <button
      type="button"
      onClick={toggleColorScheme}
      aria-label={label}
      title={label}
      className="rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      {LABEL[colorScheme]}
    </button>
  );
}
