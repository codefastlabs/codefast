import addonA11y from "@storybook/addon-a11y";
import { definePreview } from "@storybook/react-vite";

import "./tailwind.css";

export default definePreview({
  parameters: {
    a11y: {
      /**
       * "todo" surfaces a11y violations in the panel without failing the run.
       * Flip to "error" once stories are clean to enforce a11y in `test:stories`.
       */
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(?:background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  addons: [addonA11y()],
});
