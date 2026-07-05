import { BUTTON_EXAMPLE, CSS_SETUP, INSTALL_COMMAND } from "#/lib/install";
import { COMPONENTS } from "#/registry/_core/components";

export const COMPONENT_COUNT = COMPONENTS.length;

export const REQUIREMENTS = [
  { label: "React", value: "≥ 19.0.0" },
  { label: "TypeScript", value: "≥ 5.0" },
  { label: "Tailwind CSS", value: "v4" },
  { label: "Node.js", value: "≥ 20" },
] as const;

export const INSTALL_STEPS = [
  {
    step: "01",
    title: "Install the package",
    description: "Add @codefast/ui to your project. Peer dependencies (React 19, Tailwind v4) must already be present.",
    code: INSTALL_COMMAND,
  },
  {
    step: "02",
    title: "Import the CSS",
    description:
      "Add the design-system stylesheet to your global CSS. Pick a theme palette, then load the preset for Tailwind variants and motion utilities.",
    code: CSS_SETUP,
  },
  {
    step: "03",
    title: "Use a component",
    description: "Import any component by its named sub-path. No barrel imports, no tree-shaking surprises.",
    code: BUTTON_EXAMPLE,
  },
] as const;

/** Popular theme palettes shipped with @codefast/ui. */
export const FEATURED_THEMES = ["neutral", "sky", "zinc", "slate", "stone", "blue", "violet", "rose"] as const;

export const THEME_SNIPPET = (theme: string) =>
  `@import "tailwindcss";
@import "@codefast/ui/css/themes/${theme}.css";
@import "@codefast/ui/css/preset.css";`;
