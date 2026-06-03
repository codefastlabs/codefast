import type { ComponentDoc } from "#/components/examples/docs/types";
import {
  buttonAnatomyCode,
  buttonAsChildCode,
  buttonIconsCode,
  buttonLoadingCode,
  buttonSizesCode,
  buttonVariantsCode,
} from "#/components/examples/codes";
import { ButtonAsChild } from "#/components/examples/docs/button/as-child";
import { ButtonIcons } from "#/components/examples/docs/button/icons";
import { ButtonLoading } from "#/components/examples/docs/button/loading";
import { ButtonSizes } from "#/components/examples/docs/button/sizes";
import { ButtonVariants } from "#/components/examples/docs/button/variants";

export const buttonDoc: ComponentDoc = {
  examples: [
    {
      id: "variants",
      title: "Variants",
      description: "Six visual styles cover primary actions, secondary actions, and links.",
      Demo: ButtonVariants,
      code: buttonVariantsCode,
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "Four text sizes plus square icon sizes for icon-only buttons.",
      Demo: ButtonSizes,
      code: buttonSizesCode,
    },
    {
      id: "with-icon",
      title: "With icon",
      description:
        "Place an icon before or after the label. Add data-icon to fine-tune the padding.",
      Demo: ButtonIcons,
      code: buttonIconsCode,
    },
    {
      id: "loading",
      title: "Loading state",
      description: "Compose with Spinner and disable the button while an action is in flight.",
      Demo: ButtonLoading,
      code: buttonLoadingCode,
    },
    {
      id: "as-child",
      title: "asChild composition",
      description:
        "Render the button styles on a different element — an anchor, a router Link — via Radix Slot.",
      Demo: ButtonAsChild,
      code: buttonAsChildCode,
    },
  ],
  anatomy: buttonAnatomyCode,
  api: [
    {
      name: "Button",
      description: "Renders a native <button>, or its child element when asChild is set.",
      props: [
        {
          name: "variant",
          type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"',
          default: '"default"',
          description: "Visual style of the button.",
        },
        {
          name: "size",
          type: '"xs" | "sm" | "default" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"',
          default: '"default"',
          description:
            "Controls height and horizontal padding. Use icon sizes for icon-only buttons.",
        },
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description: "Merge props onto the single child instead of rendering a <button>.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables interaction and removes the button from the tab order.",
        },
        {
          name: "type",
          type: '"button" | "submit" | "reset"',
          default: '"button"',
          description: "Native button type. Defaults to button to avoid accidental form submits.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to and from the button." },
      { keys: ["Space"], description: "Activates the button." },
      { keys: ["Enter"], description: "Activates the button." },
    ],
    notes: [
      "Renders a native <button>, so it is focusable and announced as a button with no extra ARIA.",
      "Icon-only buttons must set an aria-label — the visible icon carries no accessible name.",
      "A visible focus ring is shown only for keyboard focus via :focus-visible.",
    ],
  },
  guidelines: {
    do: [
      "Lead with the most important action using the default variant — one primary per view.",
      "Use the destructive variant for irreversible actions like delete.",
      "Keep labels to a verb or verb + noun: “Save”, “Add member”.",
    ],
    dont: [
      "Don’t stack multiple default (primary) buttons next to each other.",
      "Don’t use a Button for navigation — use a link (or asChild with an anchor) instead.",
      "Don’t rely on colour alone for destructive intent; keep an explicit label.",
    ],
  },
  related: ["button-group", "toggle", "dropdown-menu"],
};
