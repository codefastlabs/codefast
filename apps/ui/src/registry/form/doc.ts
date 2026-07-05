import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { FormContact } from "#/registry/form/contact.example";
import { FormNewsletter } from "#/registry/form/newsletter.example";
import { FormSignIn } from "#/registry/form/sign-in.example";

export const formDoc: ComponentDoc = {
  usage: docUsage("form"),
  examples: [
    {
      id: "sign-in",
      title: "Sign-in with validation",
      description: "A controlled form: submit invalid values to see inline errors, valid ones to succeed.",
      Demo: FormSignIn,
      source: docSource("form", "sign-in"),
      previewClassName: "items-start",
    },
    {
      id: "contact",
      title: "Contact form",
      description: "Field + Textarea with inline validation and a helper.",
      Demo: FormContact,
      source: docSource("form", "contact"),
      previewClassName: "items-start",
    },
    {
      id: "newsletter",
      title: "With consent",
      description: "Combine an input with a required consent checkbox.",
      Demo: FormNewsletter,
      source: docSource("form", "newsletter"),
      previewClassName: "items-start",
    },
  ],
  anatomy: [
    {
      name: "Form",
      children: [
        {
          name: "FormField",
          children: [
            {
              name: "FormItem",
              children: [
                { name: "FormLabel" },
                { name: "FormControl" },
                { name: "FormDescription" },
                { name: "FormMessage" },
              ],
            },
          ],
        },
      ],
    },
  ],
  features: [
    "FormField connects a react-hook-form Controller to a name/control pair and wires the label/description/message ids through context.",
    "FormControl (a Slot) sets aria-invalid and aria-describedby on whatever control it wraps, pointing at the description and message ids automatically.",
    "FormMessage renders the current react-hook-form field error, or falls back to its children when the field is valid.",
  ],
  api: [
    {
      name: "Form (react-hook-form)",
      description:
        "The Form parts bind react-hook-form to accessible markup — see Usage above for the full FormField/FormControl/FormMessage wiring with useForm. The examples below intentionally stay dependency-free (plain state + Field) to show the same pattern without requiring react-hook-form.",
      props: [
        {
          name: "FormField",
          type: "{ control, name, render }",
          description: "Connects a control to RHF and wires label, description, and error ids.",
        },
        {
          name: "FormMessage",
          type: "ReactNode",
          description: "Renders the field’s validation error from RHF state.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Associate every control with a label, and link errors via aria-describedby.",
      "Set aria-invalid on a control when its value fails validation.",
      "Validate on submit (and optionally on blur) — show errors as text, not only colour.",
    ],
  },
  guidelines: {
    do: ["Keep forms short; group related fields with Field / FieldSet.", "Show a clear success state after submit."],
    dont: [
      "Don’t validate aggressively on every keystroke before first submit.",
      "Don’t rely on placeholder text instead of labels.",
    ],
  },
  related: ["field", "input", "input-password"],
};
