import { AccordionBasic } from "#/components/examples/docs/accordion/accordion-basic";
import { AccordionBorders } from "#/components/examples/docs/accordion/accordion-borders";
import { AccordionCard } from "#/components/examples/docs/accordion/accordion-card";
import { AccordionDemo } from "#/components/examples/docs/accordion/accordion-demo";
import { AccordionDisabled } from "#/components/examples/docs/accordion/accordion-disabled";
import { AccordionMultiple } from "#/components/examples/docs/accordion/accordion-multiple";
import { AccordionRtl } from "#/components/examples/docs/accordion/accordion-rtl";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const accordionDoc: ComponentDoc = {
  examples: [
    {
      id: "accordion-demo",
      title: "Demo",
      description:
        "A vertically stacked set of interactive headings that each reveal a section of content.",
      Demo: AccordionDemo,
      code: docSource("accordion", "accordion-demo"),
      previewClassName: "items-start",
    },
    {
      id: "accordion-basic",
      title: "Basic",
      description:
        "A basic accordion that shows one item at a time. The first item is open by default.",
      Demo: AccordionBasic,
      code: docSource("accordion", "accordion-basic"),
      previewClassName: "items-start",
    },
    {
      id: "accordion-multiple",
      title: "Multiple",
      description: "Use type=multiple to allow multiple items to be open at the same time.",
      Demo: AccordionMultiple,
      code: docSource("accordion", "accordion-multiple"),
      previewClassName: "items-start",
    },
    {
      id: "accordion-disabled",
      title: "Disabled",
      description: "Use the disabled prop on AccordionItem to disable individual items.",
      Demo: AccordionDisabled,
      code: docSource("accordion", "accordion-disabled"),
      previewClassName: "items-start",
    },
    {
      id: "accordion-borders",
      title: "Borders",
      description: "Add borders to the Accordion and items for a more defined separation.",
      Demo: AccordionBorders,
      code: docSource("accordion", "accordion-borders"),
      previewClassName: "items-start",
    },
    {
      id: "accordion-card",
      title: "Card",
      description: "Wrap the Accordion in a Card component.",
      Demo: AccordionCard,
      code: docSource("accordion", "accordion-card"),
      previewClassName: "items-start",
    },
    {
      id: "accordion-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: AccordionRtl,
      code: docSource("accordion", "accordion-rtl"),
      previewClassName: "items-start",
      direction: "rtl",
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
