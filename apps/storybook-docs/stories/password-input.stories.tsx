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
  PasswordInput,
  Pre,
  TextInput,
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Meta, type StoryObj } from '@storybook/react';
import { LoaderCircleIcon, LockKeyholeIcon, LockKeyholeOpenIcon, MailIcon } from 'lucide-react';
import { wait } from 'next/dist/lib/wait';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  title: 'UI/Password Input',
  component: PasswordInput,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the input field',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    inputSize: {
      control: { type: 'select' },
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Sets the size of the input field',
      table: {
        type: { summary: 'xxs | xs | sm | md | lg | xl' },
        defaultValue: { summary: 'md' },
      },
    },
    loaderPosition: {
      control: { type: 'inline-radio' },
      options: ['prefix', 'suffix'],
      description: 'Position of the loader in the input field',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'prefix' },
      },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Determines if the loading spinner is shown',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    prefix: {
      control: { type: 'text' },
      description: 'Prefix element shown before the input field',
      table: { type: { summary: 'ReactNode' } },
    },
    spinner: {
      control: false,
      description: 'Custom spinner element shown when loading',
      table: { type: { summary: 'ReactNode' } },
    },
    suffix: {
      control: { type: 'text' },
      description: 'Suffix element shown after the input field',
      table: { type: { summary: 'ReactNode' } },
    },
  },
  args: {
    disabled: false,
    inputSize: 'md',
    loaderPosition: 'prefix',
    loading: false,
  },
} satisfies Meta<typeof PasswordInput>;

export default meta;

type Story = StoryObj<typeof PasswordInput>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: { defaultValue: 'Password' },
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      {(['xxs', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <PasswordInput key={size} inputSize={size} placeholder={size} />
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: { disabled: true },
};

/* -----------------------------------------------------------------------------
 * Story: Loading
 * -------------------------------------------------------------------------- */

export const Loading: Story = {
  args: { loading: true },
};

/* -----------------------------------------------------------------------------
 * Story: Custom Spinner
 * -------------------------------------------------------------------------- */

export const CustomSpinner: Story = {
  args: {
    spinner: <LoaderCircleIcon className="animate-spin" />,
    loading: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Prefix
 * -------------------------------------------------------------------------- */

export const Prefix: Story = {
  args: { prefix: <LockKeyholeOpenIcon /> },
};

/* -----------------------------------------------------------------------------
 * Story: Suffix
 * -------------------------------------------------------------------------- */

export const Suffix: Story = {
  args: { suffix: <LockKeyholeIcon /> },
};

/* -----------------------------------------------------------------------------
 * Story: Controlled
 * -------------------------------------------------------------------------- */

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('');

    return (
      <div className="space-y-4">
        <PasswordInput
          {...args}
          placeholder="Controlled"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />

        <p>
          <strong>Value:</strong> {value}
        </p>
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
      email: z.string().email({
        message: 'Invalid email address.',
      }),
      password: z.string().min(8, {
        message: 'Password must be at least 8 characters.',
      }),
    });

    const form = useForm<z.infer<typeof formValues>>({
      resolver: zodResolver(formValues),
      defaultValues: {
        email: '',
        password: '',
      },
    });

    const onSubmit: SubmitHandler<z.infer<typeof formValues>> = async (values): Promise<void> => {
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
              name="email"
              render={({ field: { disabled, ...field } }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <TextInput
                      disabled={disabled ?? form.formState.isSubmitting}
                      inputMode="email"
                      placeholder="info@codefast.one"
                      prefix={<MailIcon />}
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>This is your public display name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field: { disabled, ...field } }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={disabled ?? form.formState.isSubmitting}
                      placeholder="Password"
                      prefix={<LockKeyholeOpenIcon />}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Must be at least 8 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button loading={form.formState.isSubmitting} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    );
  },
};
