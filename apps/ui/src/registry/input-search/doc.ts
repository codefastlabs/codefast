import { InputSearchControlled } from "#/registry/input-search/controlled.example";
import { InputSearchDisabled } from "#/registry/input-search/disabled.example";
import { InputSearchWithResults } from "#/registry/input-search/with-results.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const inputSearchDoc: ComponentDoc = {
  usage: docUsage("input-search"),
  examples: [
    {
      id: "controlled",
      title: "Controlled with clear",
      description: "A leading icon, a one-click clear button, and a live query readout.",
      Demo: InputSearchControlled,
      source: docSource("input-search", "controlled"),
      previewClassName: "items-start",
    },
    {
      id: "with-results",
      title: "Live filtering",
      description: "Drive a results list from the controlled value.",
      Demo: InputSearchWithResults,
      source: docSource("input-search", "with-results"),
      previewClassName: "items-start",
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "A non-interactive search field.",
      Demo: InputSearchDisabled,
      source: docSource("input-search", "disabled"),
    },
  ],
  anatomy: [{ name: "InputSearch" }],
  features: [
    "Works controlled or fully uncontrolled — useControllableState means defaultValue alone (no value/onChange) still manages state internally.",
    'The clear (×) button only renders once there’s a value, and clicking it calls onChange("") — the same path as clearing manually.',
  ],
  api: [
    {
      name: "InputSearch",
      description: "A search field with a leading icon and a clear (×) button.",
      props: [
        {
          name: "value / onChange",
          type: "string / (value?: string) => void",
          description: "Controlled query. onChange also fires with an empty value on clear.",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "Initial query when uncontrolled.",
        },
        {
          name: "placeholder",
          type: "string",
          description: "Hint text shown when empty.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      {
        keys: ["Esc"],
        description:
          "Clears the field in browsers that support it natively for type=search (e.g. WebKit) — not implemented in JS.",
      },
    ],
    notes: [
      "Renders type=search with an accessible clear button.",
      "Give it a label (visible or aria-label) describing what is searched.",
      "Debounce expensive queries; don’t fetch on every keystroke.",
    ],
  },
  guidelines: {
    do: ["Use for filtering lists and global search.", "Show the active query and a way to clear it."],
    dont: ["Don’t use it for non-search text entry.", "Don’t hide the clear affordance once there’s a value."],
  },
  related: ["input", "command", "input-group"],
};
