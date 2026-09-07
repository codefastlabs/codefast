import { docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { AlertActionExample } from "#/registry/alert/action.example";
import { AlertBasic } from "#/registry/alert/basic.example";
import { AlertColors } from "#/registry/alert/colors.example";
import { AlertDestructive } from "#/registry/alert/destructive.example";
import { AlertRtl } from "#/registry/alert/rtl.example";

export const alertDoc: ComponentDoc = {
  examples: [
    {
      id: "alert-basic",
      title: "Basic",
      description: "A basic alert with an icon, title and description.",
      Demo: AlertBasic,
      source: docSource("alert", "basic"),
      previewClassName: "items-start",
    },
    {
      id: "alert-destructive",
      title: "Destructive",
      description: "Use variant=destructive to create a destructive alert.",
      Demo: AlertDestructive,
      source: docSource("alert", "destructive"),
      previewClassName: "items-start",
    },
    {
      id: "alert-action",
      title: "Action",
      description: "Use AlertAction to add a button or other action element to the alert.",
      Demo: AlertActionExample,
      source: docSource("alert", "action"),
      previewClassName: "items-start",
    },
    {
      id: "alert-colors",
      title: "Custom colors",
      description: "Customize the alert colors by adding utility classes to the Alert component.",
      Demo: AlertColors,
      source: docSource("alert", "colors"),
      previewClassName: "items-start",
    },
    {
      id: "alert-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: AlertRtl,
      source: docSource("alert", "rtl"),
      previewClassName: "items-start",
      direction: "rtl",
    },
  ],
  anatomy: [
    { name: "Alert", children: [{ name: "AlertTitle" }, { name: "AlertDescription" }, { name: "AlertAction" }] },
  ],
  features: [
    'Renders with role="alert" — screen readers announce it as soon as it mounts, with no extra wiring.',
    "The layout shifts to a two-column grid automatically once a leading <svg> icon is present as a direct child.",
    "AlertAction is absolutely positioned in the top-right corner for a dismiss button or similar trailing control.",
  ],
  api: [
    {
      name: "Alert",
      props: [
        {
          name: "variant",
          type: '"default" | "destructive"',
          default: '"default"',
          description: "Neutral information, or an error/danger banner.",
        },
      ],
    },
    {
      name: "AlertTitle",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The headline text.",
        },
      ],
    },
    {
      name: "AlertDescription",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The body text.",
        },
      ],
    },
    {
      name: "AlertAction",
      description: "Absolutely positioned in the top-right corner for a dismiss button or similar trailing control.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "An action element, e.g. a dismiss button.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Use role=alert for messages that must be announced immediately; otherwise keep it static.",
      "Convey severity in the text, not colour alone.",
      "Keep the icon decorative — the meaning lives in the title and description.",
    ],
  },
  guidelines: {
    do: ["Use inline alerts for contextual, non-blocking messages.", "Pair destructive alerts with a clear next step."],
    dont: [
      "Don’t use an inline Alert for a decision that must block — use Alert Dialog.",
      "Don’t stack many alerts; summarise instead.",
    ],
  },
  related: ["alert-dialog", "sonner", "badge"],
};
