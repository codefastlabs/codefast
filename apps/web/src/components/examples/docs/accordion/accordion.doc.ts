import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { AccordionMultiple } from "#/components/examples/docs/accordion/multiple";
import { AccordionSingle } from "#/components/examples/docs/accordion/single";

import { AccordionIcons } from "#/components/examples/docs/accordion/with-icons";

export const accordionDoc: ComponentDoc = {
  examples: [
    {
      id: "single",
      title: "Single (collapsible)",
      description: "Only one panel open at a time; collapsible lets them all close.",
      Demo: AccordionSingle,
      code: docSource("accordion", "single"),
      previewClassName: "items-start",
    },
    {
      id: "multiple",
      title: "Multiple",
      description: "Allow several panels to stay open at once.",
      Demo: AccordionMultiple,
      code: docSource("accordion", "multiple"),
      previewClassName: "items-start",
    },
    {
      id: "with-icons",
      title: "With icons",
      description: "Lead each trigger with an icon for scannable sections.",
      Demo: AccordionIcons,
      code: docSource("accordion", "with-icons"),
    },
  ],
  anatomy: docAnatomy("accordion"),
  api: [
    {
      name: "Accordion",
      props: [
        {
          name: "type",
          type: '"single" | "multiple"',
          description: "Whether one or many items can be open.",
        },
        {
          name: "collapsible",
          type: "boolean",
          default: "false",
          description: "For type=single, allow closing the open item. Ignored for multiple.",
        },
        {
          name: "value / defaultValue",
          type: "string | string[]",
          description: "Controlled / uncontrolled open item(s).",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to the next trigger." },
      { keys: ["Enter"], description: "Toggles the focused panel." },
      { keys: ["Space"], description: "Toggles the focused panel." },
      { keys: ["Arrow", "Down"], description: "Moves focus to the next trigger." },
      { keys: ["Arrow", "Up"], description: "Moves focus to the previous trigger." },
    ],
    notes: [
      "Each trigger is a button with aria-expanded and aria-controls set automatically.",
      "Panels are linked back to their trigger via aria-labelledby.",
    ],
  },
  guidelines: {
    do: [
      "Use for FAQs and progressively-disclosed settings.",
      "Keep trigger labels scannable and self-explanatory.",
    ],
    dont: [
      "Don’t hide content the user needs to see at a glance.",
      "Don’t nest accordions deeply — it gets hard to track state.",
    ],
  },
  related: ["collapsible", "tabs", "card"],
};
