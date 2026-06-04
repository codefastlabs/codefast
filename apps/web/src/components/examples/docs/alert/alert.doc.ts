import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { AlertCompact } from "#/components/examples/docs/alert/compact";
import { AlertVariants } from "#/components/examples/docs/alert/variants";
import { AlertWithAction } from "#/components/examples/docs/alert/with-action";

export const alertDoc: ComponentDoc = {
  examples: [
    {
      id: "variants",
      title: "Default & destructive",
      description: "An icon, title, and body — plus an optional action slot for dismiss.",
      Demo: AlertVariants,
      code: docSource("alert", "variants"),
      previewClassName: "items-start",
    },
    {
      id: "compact",
      title: "Title only",
      description: "Drop the description for a terse, single-line status banner.",
      Demo: AlertCompact,
      code: docSource("alert", "compact"),
      previewClassName: "items-start",
    },
    {
      id: "with-action",
      title: "With call to action",
      description: "Use the action slot for a trailing button — upgrade, retry, or undo.",
      Demo: AlertWithAction,
      code: docSource("alert", "with-action"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("alert"),
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
      name: "AlertTitle / AlertDescription / AlertAction",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The headline, body text, and an optional trailing action (e.g. dismiss).",
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
    do: [
      "Use inline alerts for contextual, non-blocking messages.",
      "Pair destructive alerts with a clear next step.",
    ],
    dont: [
      "Don’t use an inline Alert for a decision that must block — use Alert Dialog.",
      "Don’t stack many alerts; summarise instead.",
    ],
  },
  related: ["alert-dialog", "sonner", "badge"],
};
