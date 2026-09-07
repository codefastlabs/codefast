import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { SonnerDescription } from "#/registry/sonner/description.example";
import { SonnerPosition } from "#/registry/sonner/position.example";
import { SonnerTypes } from "#/registry/sonner/types.example";

export const sonnerDoc: ComponentDoc = {
  usage: docUsage("sonner"),
  examples: [
    {
      id: "sonner-types",
      title: "Toast types",
      description: "Click to fire a real toast — default, success, info, warning, error, and promise.",
      Demo: SonnerTypes,
      source: docSource("sonner", "types"),
    },
    {
      id: "sonner-description",
      title: "Description",
      description: "Add a secondary line under the title with the description option.",
      Demo: SonnerDescription,
      source: docSource("sonner", "description"),
    },
    {
      id: "sonner-position",
      title: "Position",
      description: "Use the position prop to change the position of the toast.",
      Demo: SonnerPosition,
      source: docSource("sonner", "position"),
    },
  ],
  features: [
    "Custom icons per severity (success/error/warning/info/loading) match the rest of the design system instead of Sonner's defaults.",
    "Automatically follows the app's next-themes theme (light/dark/system) — no manual theme prop needed.",
    "toast.promise(promise, { loading, success, error }) chains all three states from a single call, auto-updating as the promise settles.",
  ],
  anatomy: [{ name: "Toaster" }],
  api: [
    {
      name: "toast()",
      description: "Imperative API. Call a method to enqueue a toast.",
      props: [
        {
          name: "toast(message, options?)",
          type: "(message, ToastOptions) => id",
          description: "Base toast. .success / .error / .warning / .info set the variant.",
        },
        {
          name: "toast.promise(p, msgs)",
          type: "(Promise, { loading, success, error }) => void",
          description: "Shows loading, then resolves to success or error automatically.",
        },
        {
          name: "options.action",
          type: "{ label: string; onClick: () => void }",
          description: "Renders a button inside the toast (e.g. Undo).",
        },
        {
          name: "options.description",
          type: "ReactNode",
          description: "Secondary line under the title.",
        },
      ],
    },
    {
      name: "Toaster",
      description: "Mount once. Renders the toast region.",
      props: [
        {
          name: "position",
          type: '"top-right" | "bottom-right" | … ',
          default: '"bottom-right"',
          description: "Corner the toasts stack in.",
        },
        {
          name: "richColors",
          type: "boolean",
          default: "false",
          description: "Use saturated success/error backgrounds.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Toasts render in an aria-live region so screen readers announce them.",
      "Keep messages short; put any required action behind an explicit action button.",
      "Don’t use toasts for critical errors that need a decision — use an Alert Dialog.",
    ],
  },
  guidelines: {
    do: [
      "Confirm background actions (saved, copied, deleted) with a brief toast.",
      "Offer Undo for destructive actions instead of a blocking confirm.",
    ],
    dont: [
      "Don’t stack many toasts at once or use long durations.",
      "Don’t put essential, long-lived information in a toast.",
    ],
  },
  related: ["alert", "alert-dialog", "progress"],
};
