import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { expect } from "storybook/test";

import { Button } from "#/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "#/components/form";
import { Input } from "#/components/input";

import preview from "../.storybook/preview";

/**
 * Form composes react-hook-form with `Form`/`FormField`/`FormItem` and friends.
 * The root needs a `useForm` instance, so it's demoed via `render` with a small
 * client component — keep `component` only for prop-driven single components.
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
  title: "Form/Form",
});

export const Default = meta.story({
  render: () => <SignInForm />,
});

export const ValidatesRequired = meta.story({
  render: () => <SignInForm />,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ValidatesRequired.test("validates required", async ({ canvas, userEvent }) => {
  const submit = canvas.getByRole("button", { name: /sign in/i });

  await userEvent.click(submit);
  await expect(await canvas.findByText(/username is required/i)).toBeVisible();
});
