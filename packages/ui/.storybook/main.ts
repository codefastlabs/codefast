import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook 10 + React/Vite. Stories live outside `src/` (in `stories/`) so they
 * never leak into the published tarball (`files` ships only `src` + `dist`).
 *
 * Tailwind v4 is processed by the package's `postcss.config.js`, which Storybook's
 * Vite builder picks up automatically — no `viteFinal` CSS wiring needed.
 */
const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
};

export default config;
