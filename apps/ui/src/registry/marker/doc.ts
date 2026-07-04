import { MarkerIconExample } from "#/registry/marker/icon.example";
import { MarkerStatus } from "#/registry/marker/status.example";
import { MarkerVariants } from "#/registry/marker/variants.example";
import { docAnatomy, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const markerDoc: ComponentDoc = {
  examples: [
    {
      id: "marker-variants",
      title: "Variants",
      description:
        "default is a plain label; separator centers it between two rules; border draws a bottom line for a section break.",
      Demo: MarkerVariants,
      source: docSource("marker", "variants"),
    },
    {
      id: "marker-icon",
      title: "With icon",
      description: "Add a decorative MarkerIcon before the content; it is aria-hidden by default.",
      Demo: MarkerIconExample,
      source: docSource("marker", "icon"),
    },
    {
      id: "marker-status",
      title: "Status",
      description: "Pair a Spinner with role='status' for a live progress line inside a transcript.",
      Demo: MarkerStatus,
      source: docSource("marker", "status"),
    },
  ],
  anatomy: docAnatomy("marker"),
  api: [
    {
      name: "Marker",
      description: "The divider row.",
      props: [
        {
          name: "variant",
          type: '"default" | "separator" | "border"',
          default: '"default"',
          description: "Plain label, centered rule-flanked label, or bottom-bordered section break.",
        },
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description: "Render as the child element (e.g. a heading) instead of a div.",
        },
      ],
    },
    {
      name: "MarkerIcon",
      description: "Decorative leading icon; rendered aria-hidden.",
      props: [{ name: "children", type: "ReactNode", description: "An icon element." }],
    },
    {
      name: "MarkerContent",
      description: "The label; centers between the rules in the separator variant.",
      props: [{ name: "children", type: "ReactNode", description: "Label text or a link." }],
    },
  ],
  accessibility: {
    notes: [
      "MarkerIcon is aria-hidden — never put meaning only in the icon.",
      "For a semantic section break, use asChild with a real heading that fits the document outline.",
      "The separator rules and spacing mirror automatically under a DirectionProvider (RTL).",
    ],
  },
  guidelines: {
    do: [
      "Use markers to group a transcript by day or to flag the unread line.",
      "Keep the label short — a date, a count, or a couple of words.",
    ],
    dont: [
      "Don’t use a marker as the only heading for a whole page.",
      "Don’t stack multiple bordered markers in a row.",
    ],
  },
  related: ["message", "separator", "message-scroller"],
};
