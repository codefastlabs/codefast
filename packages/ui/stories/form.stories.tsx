import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { expect } from "storybook/test";

import { Button } from "#/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "#/components/form";
import { Input } from "#/components/input";

import preview from "../.storybook/preview";

/**
 * Form is a COMPOSITE: `Form` is a thin alias over react-hook-form's `FormProvider`,
 * a context provider with no DOM of its own — so it correctly exposes no Controls and
 * is demoed via `render` with a small client component that owns a `useForm` instance.
 * Content here is authored for Storybook against the component's own API, NOT synced
 * with the apps/web registry.
 */
interface SignInValues {
  email: string;
  username: string;
}

function SignInForm(): JSX.Element {
  const form = useForm<SignInValues>({
    defaultValues: { email: "", username: "" },
  });

  return (
    <Form {...form}>
      <form
        className="w-full max-w-xs space-y-6"
        onSubmit={(event) => {
          // Demo only — no submission side effect.
          void form.handleSubmit(() => undefined)(event);
        }}
      >
        <FormField
          control={form.control}
          name="username"
          rules={{ required: "Username is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="ada" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          rules={{ required: "Email is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>
    </Form>
  );
}

const meta = preview.meta({
  component: Form,
  subcomponents: { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage },
  parameters: {
    docs: {
      description: {
        component: [
          "A set of `react-hook-form` bindings that wire accessible labels, descriptions, and validation messages to controls.",
          "",
          "**Anatomy:** `Form > FormField > FormItem > (FormLabel + FormControl + FormDescription + FormMessage)`.",
          "`Form` provides the form context; `FormField` connects a single field, and the parts auto-link `id`/`aria-*` and surface errors.",
        ].join("\n"),
      },
    },
  },
  title: "Form/Form",
});

export const Default = meta.story({
  render: () => <SignInForm />,
});

export const ValidatesRequired = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ValidatesRequired.test("surfaces required errors and marks the control invalid", async ({ canvas, userEvent }) => {
  const username = canvas.getByLabelText(/username/i);

  await expect(username).toHaveAttribute("aria-invalid", "false");

  await userEvent.click(canvas.getByRole("button", { name: /sign in/i }));

  await expect(await canvas.findByText(/username is required/i)).toBeVisible();
  await expect(username).toHaveAttribute("aria-invalid", "true");
});
