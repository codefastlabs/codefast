import { useTheme } from "@codefast/theme";
import type { Theme } from "@codefast/theme";

const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const LABEL: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "Auto",
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function toggleTheme() {
    void setTheme(NEXT_THEME[theme]);
  }

  const label = `Theme: ${LABEL[theme]}. Click to switch.`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      {LABEL[theme]}
    </button>
  );
}
