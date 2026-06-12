import { LabelRequired } from "#/registry/label/required.example";
import { LabelSwitchRow } from "#/registry/label/switch-row.example";
import { LabelWithControls } from "#/registry/label/with-controls.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const labelDoc: ComponentDoc = {
  examples: [
    {
      id: "with-controls",
      title: "With controls",
      description: "Link a label to an input via htmlFor, or pair it beside a checkbox.",
      Demo: LabelWithControls,
      source: docSource("label", "with-controls"),
      previewClassName: "items-start",
    },
    {
      id: "required",
      title: "Required field",
      description: "Mark a required input and pair it with helper text.",
      Demo: LabelRequired,
      source: docSource("label", "required"),
      previewClassName: "items-start",
    },
    {
      id: "switch-row",
      title: "Beside a switch",
      description: "Associate a label with a switch in a settings row.",
      Demo: LabelSwitchRow,
      source: docSource("label", "switch-row"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("label"),
  api: [
    {
      name: "Label",
      description: "An accessible form label that forwards htmlFor.",
      props: [
        {
          name: "htmlFor",
          type: "string",
          description: "The id of the control this label names. Clicking focuses that control.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Match htmlFor to the control’s id so clicking the label activates it.",
      "Every interactive control should have a Label, even if visually hidden.",
      "Disabled controls don’t style their label automatically — dim it yourself.",
    ],
  },
  guidelines: {
    do: ["Give every input, checkbox, and switch a Label.", "Keep labels short and in sentence case."],
    dont: [
      "Don’t replace a label with placeholder text.",
      "Don’t leave a control unlabelled and rely on nearby text alone.",
    ],
  },
  related: ["field", "input", "checkbox"],
};
