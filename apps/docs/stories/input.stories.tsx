import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { useId } from "react";
import { Button } from "@codefast/ui/button";
import { toast, Toaster } from "@codefast/ui/sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@codefast/ui/form";

const meta = {
  component: Input,
  tags: ["autodocs"],
  title: "UIs/Input",
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    type: "email",
    placeholder: "Email",
  },
};

/* -----------------------------------------------------------------------------
 * Story: File
 * -------------------------------------------------------------------------- */

export const File: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={id}>Picture</Label>
        <Input id={id} type="file" {...args} />
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Label
 * -------------------------------------------------------------------------- */

export const WithLabel: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={id}>Email</Label>
        <Input type="email" placeholder="Email" id={id} {...args} />
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Button
 * -------------------------------------------------------------------------- */

export const WithButton: Story = {
  render: (args) => (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input type="email" placeholder="Email" {...args} />
      <Button type="submit">Subscribe</Button>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

export const ReactHookForm: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  render: (args) => {
    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        username: "",
      },
    });

    function onSubmit(data: z.infer<typeof FormSchema>): void {
      toast("You submitted the following values:", {
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      });
    }

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-2/3 space-y-6"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="codefast" {...field} {...args} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
};
