import { BadgeAsLink } from "#/components/examples/badge.as-link";
import { BadgeVariants } from "#/components/examples/badge.variants";
import { BadgeWithIcon } from "#/components/examples/badge.with-icon";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const badgeDoc: ComponentDoc = {
  examples: [
    {
      id: "variants",
      title: "Variants",
      description: "Five styles for status, category, and emphasis.",
      Demo: BadgeVariants,
      source: docSource("badge", "variants"),
    },
    {
      id: "with-icon",
      title: "With icon & counts",
      description: "Add a leading icon, or use a bare number as a count indicator.",
      Demo: BadgeWithIcon,
      source: docSource("badge", "with-icon"),
    },
    {
      id: "as-link",
      title: "As a link",
      description: "Render the badge as an anchor with asChild to make it interactive.",
      Demo: BadgeAsLink,
      source: docSource("badge", "as-link"),
    },
  ],
  anatomy: docAnatomy("badge"),
  api: [
    {
      name: "Badge",
      description: "Renders a <span>, or its child element when asChild is set.",
      props: [
        {
          name: "variant",
          type: '"default" | "secondary" | "outline" | "destructive" | "ghost" | "link"',
          default: '"default"',
          description: "Visual style of the badge.",
        },
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description: "Merge props onto the single child — e.g. an <a> — instead of a <span>.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "A badge is decorative text by default and needs no role.",
      "When a badge conveys status (e.g. “Error”), keep the meaning in the text, not colour alone.",
      "When made interactive via asChild, ensure the child element is itself focusable (a link or button).",
    ],
  },
  guidelines: {
    do: [
      "Keep badge text to one or two words.",
      "Use destructive/secondary variants to map to a consistent status scale.",
    ],
    dont: [
      "Don’t put long sentences or interactive controls inside a badge.",
      "Don’t use a badge as the only signal for critical state.",
    ],
  },
  related: ["button", "kbd", "item"],
};
