import { NativeSelectCountry } from "#/components/examples/native-select.country.example";
import { NativeSelectSimple } from "#/components/examples/native-select.simple.example";
import { NativeSelectStates } from "#/components/examples/native-select.states.example";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const nativeSelectDoc: ComponentDoc = {
  examples: [
    {
      id: "country",
      title: "Grouped options",
      description: "A controlled native <select> with option groups and a live readout.",
      Demo: NativeSelectCountry,
      source: docSource("native-select", "country"),
      previewClassName: "items-start",
    },
    {
      id: "states",
      title: "Disabled & invalid",
      description: "Native disabled and aria-invalid states.",
      Demo: NativeSelectStates,
      source: docSource("native-select", "states"),
      previewClassName: "items-start",
    },
    {
      id: "simple",
      title: "Ungrouped options",
      description: "A flat list of options without opt-groups.",
      Demo: NativeSelectSimple,
      source: docSource("native-select", "simple"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("native-select"),
  api: [
    {
      name: "NativeSelect",
      description: "A styled native <select>. Forwards all native select props.",
      props: [
        {
          name: "value / onChange",
          type: "string / (event) => void",
          description: "Standard controlled select props.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the control.",
        },
      ],
    },
    {
      name: "NativeSelectOptGroup / NativeSelectOption",
      props: [
        {
          name: "label / value",
          type: "string",
          description: "Group heading, and each option’s submitted value.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "It’s a real <select> — full native keyboard and screen-reader support, zero JS.",
      "Best for mobile and long lists where the OS picker is ideal.",
      "Pair with a Label via htmlFor / id.",
    ],
  },
  guidelines: {
    do: ["Use on mobile forms and when you want the native picker.", "Group long option lists with opt-groups."],
    dont: ["Don’t use it when you need custom option rendering — use Select.", "Don’t omit a label."],
  },
  related: ["select", "input", "field"],
};
