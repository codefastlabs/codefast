import { defineMain } from "@storybook/react-vite/node";

export default defineMain({
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  features: {
    experimentalTestSyntax: true,
  },
});
