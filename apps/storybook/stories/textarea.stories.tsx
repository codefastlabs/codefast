import type { Meta, StoryObj } from '@storybook/react';
import type { SubmitHandler } from 'react-hook-form';

import {
  Button,
  Code,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  Pre,
  Text,
  Textarea,
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  component: Textarea,
  tags: ['autodocs'],
  title: 'UI/Textarea',
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof Textarea>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => <Textarea placeholder="Type your message here." {...args} />,
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  render: (args) => <Textarea disabled placeholder="Type your message here." {...args} />,
};

/* -----------------------------------------------------------------------------
 * Story: With Label
 * -------------------------------------------------------------------------- */

export const WithLabel: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="grid w-full gap-1.5">
        <Label htmlFor={`message-${id}`}>Your message</Label>
        <Textarea id={`message-${id}`} placeholder="Type your message here." {...args} />
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Text
 * -------------------------------------------------------------------------- */

export const WithText: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="grid w-full gap-1.5">
        <Label htmlFor={`message-${id}`}>Your message</Label>
        <Textarea id={`message-${id}`} placeholder="Type your message here." {...args} />
        <Text className="text-muted-foreground text-sm">Your message will be copied to the support team.</Text>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Button
 * -------------------------------------------------------------------------- */

export const WithButton: Story = {
  render: (args) => {
    return (
      <div className="grid w-full gap-2">
        <Textarea placeholder="Type your message here." {...args} />
        <Button>Send message</Button>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

export const ReactHookForm: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  render: () => {
    const formValues = z.object({
      bio: z
        .string()
        .min(10, {
          message: 'Bio must be at least 10 characters.',
        })
        .max(160, {
          message: 'Bio must not be longer than 30 characters.',
        }),
    });

    const form = useForm<z.infer<typeof formValues>>({
      resolver: zodResolver(formValues),
    });

    const onSubmit: SubmitHandler<z.infer<typeof formValues>> = (values): void => {
      toast.message('You submitted the following values:', {
        description: (
          <Pre className="w-full rounded-md bg-slate-950 p-4">
            <Code className="text-white">{JSON.stringify(values, null, 2)}</Code>
          </Pre>
        ),
      });
    };

    return (
      <Form {...form}>
        <form className="w-2/3 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea className="resize-none" placeholder="Tell us a little bit about yourself" {...field} />
                </FormControl>
                <FormDescription>
                  You can <span>@mention</span> other users and organizations.
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
