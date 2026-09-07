import { docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { ButtonAsChild } from "#/registry/button/aschild.example";
import { ButtonDefault } from "#/registry/button/default.example";
import { ButtonDestructive } from "#/registry/button/destructive.example";
import { ButtonGhost } from "#/registry/button/ghost.example";
import { ButtonIcon } from "#/registry/button/icon.example";
import { ButtonLink } from "#/registry/button/link.example";
import { ButtonOutline } from "#/registry/button/outline.example";
import { ButtonRounded } from "#/registry/button/rounded.example";
import { ButtonRtl } from "#/registry/button/rtl.example";
import { ButtonSecondary } from "#/registry/button/secondary.example";
import { ButtonSize } from "#/registry/button/size.example";
import { ButtonSpinner } from "#/registry/button/spinner.example";
import { ButtonWithIcon } from "#/registry/button/with-icon.example";

export const buttonDoc: ComponentDoc = {
  examples: [
    {
      id: "button-default",
      title: "Default",
      description: "Displays a button or a component that looks like a button.",
      Demo: ButtonDefault,
      source: docSource("button", "default"),
    },
    {
      id: "button-destructive",
      title: "Destructive",
      description: "Displays a button or a component that looks like a button.",
      Demo: ButtonDestructive,
      source: docSource("button", "destructive"),
    },
    {
      id: "button-ghost",
      title: "Ghost",
      description: "Displays a button or a component that looks like a button.",
      Demo: ButtonGhost,
      source: docSource("button", "ghost"),
    },
    {
      id: "button-icon",
      title: "Icon",
      description: "Displays a button or a component that looks like a button.",
      Demo: ButtonIcon,
      source: docSource("button", "icon"),
    },
    {
      id: "button-link",
      title: "Link",
      description: "Displays a button or a component that looks like a button.",
      Demo: ButtonLink,
      source: docSource("button", "link"),
    },
    {
      id: "button-outline",
      title: "Outline",
      description: "Displays a button or a component that looks like a button.",
      Demo: ButtonOutline,
      source: docSource("button", "outline"),
    },
    {
      id: "button-rounded",
      title: "Rounded",
      description: "Use the rounded-full class to make the button rounded.",
      Demo: ButtonRounded,
      source: docSource("button", "rounded"),
    },
    {
      id: "button-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ButtonRtl,
      source: docSource("button", "rtl"),
      direction: "rtl",
    },
    {
      id: "button-secondary",
      title: "Secondary",
      description: "Displays a button or a component that looks like a button.",
      Demo: ButtonSecondary,
      source: docSource("button", "secondary"),
    },
    {
      id: "button-size",
      title: "Size",
      description: "Use the size prop to change the size of the button.",
      Demo: ButtonSize,
      source: docSource("button", "size"),
    },
    {
      id: "button-spinner",
      title: "Spinner",
      description:
        "Render a <Spinner /> component inside the button to show a loading state. Remember to add the data-icon='inline-start' or data-icon='inline-end' attribute to the spinner for the correct spacing.",
      Demo: ButtonSpinner,
      source: docSource("button", "spinner"),
    },
    {
      id: "button-with-icon",
      title: "With Icon",
      description:
        "Remember to add the data-icon='inline-start' or data-icon='inline-end' attribute to the icon for the correct spacing.",
      Demo: ButtonWithIcon,
      source: docSource("button", "with-icon"),
    },
    {
      id: "button-aschild",
      title: "As Child",
      description: "Use the asChild prop on Button to make another component look like a button.",
      Demo: ButtonAsChild,
      source: docSource("button", "aschild"),
    },
  ],
  anatomy: [{ name: "Button" }],
  features: [
    "Six variants (default, secondary, outline, ghost, destructive, link) and eight sizes, including icon-only sizes.",
    "asChild renders the child element in place of a <button> — turn a link or custom trigger into a styled button.",
    'A child marked data-icon="inline-start" or "inline-end" (an icon or a Spinner) automatically tightens its padding.',
    "Styles itself as active via aria-expanded when used as a menu or popover trigger.",
  ],
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
          description: "Controls height and horizontal padding. Use icon sizes for icon-only buttons.",
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
