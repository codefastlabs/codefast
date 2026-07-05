import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { CollapsibleBasic } from "#/registry/collapsible/basic.example";
import { CollapsibleDemo } from "#/registry/collapsible/demo.example";
import { CollapsibleFileTree } from "#/registry/collapsible/file-tree.example";
import { CollapsibleRtl } from "#/registry/collapsible/rtl.example";
import { CollapsibleSettings } from "#/registry/collapsible/settings.example";

export const collapsibleDoc: ComponentDoc = {
  usage: docUsage("collapsible"),
  examples: [
    {
      id: "collapsible-basic",
      title: "Basic",
      description: "An interactive component which expands/collapses a panel.",
      Demo: CollapsibleBasic,
      source: docSource("collapsible", "basic"),
      previewClassName: "items-start",
    },
    {
      id: "collapsible-demo",
      title: "Demo",
      description: "A collapsible order card revealing shipping and item details.",
      Demo: CollapsibleDemo,
      source: docSource("collapsible", "demo"),
      previewClassName: "items-start",
    },
    {
      id: "collapsible-file-tree",
      title: "File Tree",
      description: "Use nested collapsibles to build a file tree.",
      Demo: CollapsibleFileTree,
      source: docSource("collapsible", "file-tree"),
    },
    {
      id: "collapsible-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: CollapsibleRtl,
      source: docSource("collapsible", "rtl"),
      previewClassName: "items-start",
      direction: "rtl",
    },
    {
      id: "collapsible-settings",
      title: "Settings Panel",
      description: "Use a trigger button to reveal additional settings.",
      Demo: CollapsibleSettings,
      source: docSource("collapsible", "settings"),
    },
  ],
  anatomy: [{ name: "Collapsible", children: [{ name: "CollapsibleTrigger" }, { name: "CollapsibleContent" }] }],
  features: [
    "open/onOpenChange for controlled state, or defaultOpen uncontrolled — the same pattern as Accordion and Dialog.",
    "CollapsibleTrigger exposes aria-expanded automatically; pair with asChild to make any element (a Button, a row) the trigger.",
    "For several independent, mutually-exclusive sections, reach for Accordion instead — Collapsible is a single region.",
  ],
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
    do: ["Use to hide secondary detail behind a single toggle.", "Show a clear summary of what’s hidden."],
    dont: ["Don’t hide content users need at a glance.", "Don’t use for many sections — that’s an Accordion."],
  },
  related: ["accordion", "tabs", "card"],
};
