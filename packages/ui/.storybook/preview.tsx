import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { definePreview } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { DirectionProvider } from "#/components/direction";

import "./tailwind.css";

/**
 * Mirrors the whole preview for the Direction toolbar: `dir` must live on the
 * document element so Radix portal content (mounted on body) matches Tailwind's
 * `rtl:` variant, and DirectionProvider keeps Radix behavior in sync.
 */
function DirectionDecorator({ children, dir }: { children: ReactNode; dir: "ltr" | "rtl" }) {
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}

export default definePreview({
  /** Generate an autodocs page for every component (examples + props + description). */
  tags: ["autodocs"],
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
      sort: "requiredFirst",
    },
  },

  globalTypes: {
    direction: {
      description: "Reading direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR" },
          { value: "rtl", title: "RTL" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { direction: "ltr" },

  decorators: [
    (Story, context) => (
      <DirectionDecorator dir={context.globals.direction === "rtl" ? "rtl" : "ltr"}>
        <Story />
      </DirectionDecorator>
    ),
  ],

  addons: [addonDocs(), addonA11y()],
});
