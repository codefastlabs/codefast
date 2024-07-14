import { Label } from '@codefast/ui/label';
import { useId } from 'react';
import { Button } from '@codefast/ui/button';
import { toast, Toaster } from '@codefast/ui/sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { Box } from '@codefast/ui/box';
import { Pre } from '@codefast/ui/pre';
import { Code } from '@codefast/ui/code';
import { type Meta, type StoryObj } from '@storybook/react';
import { MailIcon, UserIcon } from 'lucide-react';
import { TextInput } from '@codefast/ui/text-input';
import { wait } from 'next/dist/lib/wait';

const meta = {
  component: TextInput,
  tags: ['autodocs'],
  title: 'Components/Inputs/Text Input',
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    type: 'email',
    placeholder: 'Email',
  },
  render: (args) => {
    return <TextInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: File
 * -------------------------------------------------------------------------- */

export const File: Story = {
  render: (args) => {
    const id = useId();

    return (
      <Box className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={id}>Picture</Label>
        <TextInput id={id} type="file" {...args} />
      </Box>
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
  render: (args) => {
    return <TextInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Label
 * -------------------------------------------------------------------------- */

export const WithLabel: Story = {
  render: (args) => {
    const id = useId();

    return (
      <Box className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={id}>Email</Label>
        <TextInput id={id} placeholder="Email" prefix={<MailIcon />} type="email" {...args} />
      </Box>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Button
 * -------------------------------------------------------------------------- */

export const WithButton: Story = {
  render: (args) => (
    <Box className="flex w-full max-w-sm items-center space-x-2">
      <TextInput placeholder="Email" type="email" {...args} />
      <Button type="submit">Subscribe</Button>
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const FormSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
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
        username: '',
      },
    });

    async function onSubmit(data: z.infer<typeof FormSchema>): Promise<void> {
      await wait(1000);
      toast.message('You submitted the following values:', {
        description: (
          <Pre className="w-full rounded-md bg-slate-950 p-4">
            <Code className="text-white">{JSON.stringify(data, null, 2)}</Code>
          </Pre>
        ),
      });
    }

    return (
      <Form {...form}>
        <form className="w-2/3 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <TextInput
                    disabled={form.formState.isSubmitting}
                    loaderPosition="suffix"
                    loading={form.formState.isSubmitting}
                    placeholder="codefast"
                    prefix={<UserIcon />}
                    {...field}
                    {...args}
                  />
                </FormControl>
                <FormDescription>This is your public display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={form.formState.isSubmitting} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    );
  },
};
