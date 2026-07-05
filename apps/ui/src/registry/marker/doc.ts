import { docDemo, docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { MarkerBorder } from "#/registry/marker/border.example";
import { MarkerDemo } from "#/registry/marker/demo";
import { MarkerIconExample } from "#/registry/marker/icon.example";
import { MarkerLinkButton } from "#/registry/marker/link-button.example";
import { MarkerSeparator } from "#/registry/marker/separator.example";
import { MarkerShimmer } from "#/registry/marker/shimmer.example";
import { MarkerStatus } from "#/registry/marker/status.example";
import { MarkerVariants } from "#/registry/marker/variants.example";

export const markerDoc: ComponentDoc = {
  usage: docUsage("marker"),
  examples: [
    {
      id: "marker-demo",
      title: "Overview",
      description: "A feed of markers — an icon note, a live status line, a separator, and another note.",
      Demo: MarkerDemo,
      source: docDemo("marker"),
    },
    {
      id: "marker-variants",
      title: "Variants",
      description:
        "default is a plain label; separator centers it between two rules; border draws a bottom line for a section break.",
      Demo: MarkerVariants,
      source: docSource("marker", "variants"),
    },
    {
      id: "marker-separator",
      title: "Separator",
      description: "Center a short label between two rules to divide a transcript by day or phase.",
      Demo: MarkerSeparator,
      source: docSource("marker", "separator"),
    },
    {
      id: "marker-border",
      title: "Border",
      description: "A bottom-bordered row per marker for a denser list of section breaks.",
      Demo: MarkerBorder,
      source: docSource("marker", "border"),
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
    {
      id: "marker-shimmer",
      title: "Shimmer",
      description: "Apply the shimmer utility to MarkerContent for an animated thinking line.",
      Demo: MarkerShimmer,
      source: docSource("marker", "shimmer"),
    },
    {
      id: "marker-link-button",
      title: "Link and button",
      description: "Use asChild to render the marker as an anchor or a button while keeping the layout.",
      Demo: MarkerLinkButton,
      source: docSource("marker", "link-button"),
    },
  ],
  features: [
    "Three variants — default (plain label), separator (centered between two rules), border (bottom-bordered section break).",
    "asChild renders the marker as a real heading, link, or button while keeping its layout, for a semantic section break or a clickable jump-to-date marker.",
    'Pairs with a Spinner (role="status") for a live "thinking" line in a transcript.',
  ],
  anatomy: [{ name: "Marker", children: [{ name: "MarkerIcon" }, { name: "MarkerContent" }] }],
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
