import type { ComponentDoc } from "#/components/examples/docs/types";
import { badgeAsLinkCode, badgeVariantsCode, badgeWithIconCode } from "#/components/examples/codes";
import { BadgeAsLink } from "#/components/examples/docs/badge/as-link";
import { BadgeVariants } from "#/components/examples/docs/badge/variants";
import { BadgeWithIcon } from "#/components/examples/docs/badge/with-icon";

export const badgeDoc: ComponentDoc = {
  examples: [
    {
      id: "variants",
      title: "Variants",
      description: "Five styles for status, category, and emphasis.",
      Demo: BadgeVariants,
      code: badgeVariantsCode,
    },
    {
      id: "with-icon",
      title: "With icon & counts",
      description: "Add a leading icon, or use a bare number as a count indicator.",
      Demo: BadgeWithIcon,
      code: badgeWithIconCode,
    },
    {
      id: "as-link",
      title: "As a link",
      description: "Render the badge as an anchor with asChild to make it interactive.",
      Demo: BadgeAsLink,
      code: badgeAsLinkCode,
    },
  ],
  anatomy: `import { Badge } from "@codefast/ui/badge";

<Badge variant="default">Label</Badge>`,
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
