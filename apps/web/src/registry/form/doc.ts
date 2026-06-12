import { FormContact } from "#/registry/form/contact.example";
import { FormNewsletter } from "#/registry/form/newsletter.example";
import { FormSignIn } from "#/registry/form/sign-in.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const formDoc: ComponentDoc = {
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
  anatomy: docAnatomy("form"),
  api: [
    {
      name: "Form (react-hook-form)",
      description:
        "The Form parts bind react-hook-form to accessible Field markup. Pair Form / FormField with useForm; the example here uses plain state + Field to stay dependency-free.",
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
