import { defineMain } from "@storybook/react-vite/node";

export default defineMain({
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  features: {
    experimentalTestSyntax: true,
  },
  typescript: {
    // The default JS `react-docgen` can't read our TS prop types, so autodocs
    // shows "Args table couldn't be auto-generated". `react-docgen-typescript`
    // reads the real types (incl. Radix-forwarded props on composites).
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // Keep own + radix-ui props (so subcomponent tabs document the real API,
      // e.g. SelectContent's `position`/`onEscapeKeyDown`); only drop the raw
      // HTML-attribute noise inherited from @types/react. NOTE: subcomponent tabs
      // are documentation only — Storybook Controls bind to the story's root, so
      // those tables never get interactive controls (by design).
      propFilter: (prop) => {
        const file = prop.parent?.fileName ?? "";

        return file === "" || !file.includes("/node_modules/@types/react/");
      },
    },
  },
});
