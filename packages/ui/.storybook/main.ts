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
      // Keep radix-ui / own props; drop the inherited HTML-attribute noise.
      propFilter: (prop) => {
        const file = prop.parent?.fileName ?? "";

        return file === "" || !file.includes("/node_modules/@types/react/");
      },
    },
  },
});
