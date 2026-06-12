import { SonnerAction } from "#/registry/sonner/action.example";
import { SonnerLoading } from "#/registry/sonner/loading.example";
import { SonnerTypes } from "#/registry/sonner/types.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const sonnerDoc: ComponentDoc = {
  examples: [
    {
      id: "types",
      title: "Toast types",
      description: "Click to fire a real toast — default, success, error, and warning.",
      Demo: SonnerTypes,
      source: docSource("sonner", "types"),
    },
    {
      id: "action-promise",
      title: "Action & promise",
      description: "Attach an Undo action, or hand toast.promise a promise to auto-cycle loading → result.",
      Demo: SonnerAction,
      source: docSource("sonner", "action"),
    },
    {
      id: "loading",
      title: "Loading → success",
      description: "Start a loading toast and resolve it in place by id.",
      Demo: SonnerLoading,
      source: docSource("sonner", "loading"),
    },
  ],
  anatomy: docAnatomy("sonner"),
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
