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
  TextInput,
  toast,
  Toaster,
} from '@codefast/ui';
import { useId } from 'react';
import { z } from 'zod';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Meta, type StoryObj } from '@storybook/react';
import { MailIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { wait } from 'next/dist/lib/wait';

const meta = {
  args: {
    inputSize: 'md',
  },
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
    name: 'email',
    placeholder: 'Email',
    type: 'email',
  },
  render: (args) => {
    return <TextInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Size Native
 * -------------------------------------------------------------------------- */

export const SizeNative: Story = {
  args: {
    ...Default.args,
    size: 3,
    maxLength: 3,
    className: 'w-auto inline-flex',
    placeholder: 'CVV',
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
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={id}>Picture</Label>
        <TextInput id={id} type="file" {...args} inputSize="xxs" />
        <TextInput id={id} type="file" {...args} inputSize="xs" />
        <TextInput id={id} type="file" {...args} inputSize="sm" />
        <TextInput id={id} type="file" {...args} inputSize="md" />
        <TextInput id={id} type="file" {...args} inputSize="lg" />
        <TextInput id={id} type="file" {...args} inputSize="xl" />
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
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={id}>Email</Label>
        <TextInput id={id} placeholder="Email" prefix={<MailIcon />} type="email" {...args} />
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
      <TextInput placeholder="Email" type="email" {...args} />
      <Button type="submit">Subscribe</Button>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <TextInput {...args} inputSize="xxs" prefix={<SettingsIcon />} />
      <TextInput {...args} inputSize="xs" prefix={<SettingsIcon />} />
      <TextInput {...args} inputSize="sm" prefix={<SettingsIcon />} />
      <TextInput {...args} inputSize="md" prefix={<SettingsIcon />} />
      <TextInput {...args} inputSize="lg" prefix={<SettingsIcon />} />
      <TextInput {...args} inputSize="xl" prefix={<SettingsIcon />} />
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const formValues = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Invalid email address.',
  }),
});

type FormValues = z.infer<typeof formValues>;

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
    const form = useForm<FormValues>({
      resolver: zodResolver(formValues),
      defaultValues: {
        username: '',
        email: '',
      },
    });

    const onSubmit: SubmitHandler<FormValues> = async (values): Promise<void> => {
      await wait(1000);
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
          <div className="space-y-4">
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <TextInput
                      disabled={form.formState.isSubmitting}
                      loaderPosition="suffix"
                      loading={form.formState.isSubmitting}
                      placeholder="info@codefast.one"
                      prefix={<MailIcon />}
                      {...field}
                      {...args}
                    />
                  </FormControl>
                  <FormDescription>This is your public display name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={form.formState.isSubmitting} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    );
  },
};
