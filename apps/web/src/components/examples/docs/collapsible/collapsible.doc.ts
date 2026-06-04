import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { CollapsibleRepos } from "#/components/examples/docs/collapsible/repos";

export const collapsibleDoc: ComponentDoc = {
  examples: [
    {
      id: "repos",
      title: "Show more / less",
      description: "Controlled open state reveals extra rows with a smooth height animation.",
      Demo: CollapsibleRepos,
      code: docSource("collapsible", "repos"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("collapsible"),
  api: [
    {
      name: "Collapsible",
      description: "A single togglable region.",
      props: [
        {
          name: "open / onOpenChange",
          type: "boolean / (open: boolean) => void",
          description: "Controlled open state and its handler.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "false",
          description: "Initial state when uncontrolled.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Prevents toggling.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to the trigger." },
      { keys: ["Space"], description: "Toggles the content." },
      { keys: ["Enter"], description: "Toggles the content." },
    ],
    notes: [
      "The trigger exposes aria-expanded and controls the content region.",
      "For several independent sections, use an Accordion instead.",
      "Keep the always-visible summary meaningful on its own.",
    ],
  },
  guidelines: {
    do: [
      "Use to hide secondary detail behind a single toggle.",
      "Show a clear summary of what’s hidden.",
    ],
    dont: [
      "Don’t hide content users need at a glance.",
      "Don’t use for many sections — that’s an Accordion.",
    ],
  },
  related: ["accordion", "tabs", "card"],
};
