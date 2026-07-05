import { BadgeCustomColors } from "#/registry/badge/colors.example";
import { BadgeWithIconLeft } from "#/registry/badge/icon.example";
import { BadgeAsLink } from "#/registry/badge/link.example";
import { BadgeRtl } from "#/registry/badge/rtl.example";
import { BadgeWithSpinner } from "#/registry/badge/spinner.example";
import { BadgeVariants } from "#/registry/badge/variants.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const badgeDoc: ComponentDoc = {
  usage: docUsage("badge"),
  examples: [
    {
      id: "variants",
      title: "Variants",
      description: "Five styles for status, category, and emphasis.",
      Demo: BadgeVariants,
      source: docSource("badge", "variants"),
    },
    {
      id: "badge-colors",
      title: "Custom Colors",
      description:
        "You can customize the colors of a badge by adding custom classes such as bg-green-50 dark:bg-green-800 to the Badge component.",
      Demo: BadgeCustomColors,
      source: docSource("badge", "colors"),
    },
    {
      id: "badge-icon",
      title: "With Icon",
      description:
        "You can render an icon inside the badge. Use data-icon='inline-start' to render the icon on the left and data-icon='inline-end' to render the icon on the right.",
      Demo: BadgeWithIconLeft,
      source: docSource("badge", "icon"),
    },
    {
      id: "badge-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: BadgeRtl,
      source: docSource("badge", "rtl"),
      direction: "rtl",
    },
    {
      id: "badge-spinner",
      title: "With Spinner",
      description:
        "You can render a spinner inside the badge. Remember to add the data-icon='inline-start' or data-icon='inline-end' prop to the spinner.",
      Demo: BadgeWithSpinner,
      source: docSource("badge", "spinner"),
    },
    {
      id: "badge-link",
      title: "Link",
      description: "Use the asChild prop to render a link as a badge.",
      Demo: BadgeAsLink,
      source: docSource("badge", "link"),
    },
  ],
  anatomy: [{ name: "Badge" }],
  features: [
    "Six variants — default, secondary, outline, destructive, ghost, link.",
    "asChild renders the child element (e.g. a link) instead of a <span>.",
    'A child marked data-icon="inline-start" or "inline-end" (an icon or a Spinner) gets matching spacing automatically, same convention as Button.',
  ],
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
