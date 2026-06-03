import type { ComponentDoc } from "#/components/examples/docs/types";
import { labelAnatomyCode, labelWithControlsCode } from "#/components/examples/codes";
import { LabelWithControls } from "#/components/examples/docs/label/with-controls";

export const labelDoc: ComponentDoc = {
  examples: [
    {
      id: "with-controls",
      title: "With controls",
      description: "Link a label to an input via htmlFor, or pair it beside a checkbox.",
      Demo: LabelWithControls,
      code: labelWithControlsCode,
      previewClassName: "items-start",
    },
  ],
  anatomy: labelAnatomyCode,
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
    do: [
      "Give every input, checkbox, and switch a Label.",
      "Keep labels short and in sentence case.",
    ],
    dont: [
      "Don’t replace a label with placeholder text.",
      "Don’t leave a control unlabelled and rely on nearby text alone.",
    ],
  },
  related: ["field", "input", "checkbox"],
};
