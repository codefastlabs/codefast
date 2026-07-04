import { LabelDemo } from "#/registry/label/demo";
import { LabelInField } from "#/registry/label/field.example";
import { LabelRtl } from "#/registry/label/rtl.example";
import { docDemo, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const labelDoc: ComponentDoc = {
  examples: [
    {
      id: "label-demo",
      title: "Demo",
      description: "Labels naming an input, a checkbox, and a disabled control.",
      Demo: LabelDemo,
      source: docDemo("label"),
      previewClassName: "items-start",
    },
    {
      id: "label-field",
      title: "Label in Field",
      description: "Inside a form, use FieldLabel from the Field component for built-in description and error wiring.",
      Demo: LabelInField,
      source: docSource("label", "field"),
      previewClassName: "items-start",
    },
    {
      id: "label-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: LabelRtl,
      source: docSource("label", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "Label" }],
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
