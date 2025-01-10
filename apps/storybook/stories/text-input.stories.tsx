import type { Meta, StoryObj } from '@storybook/react';

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
  Pre,
  TextInput,
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { fn } from '@storybook/test';
import {
  ImportIcon,
  LoaderCircleIcon,
  MailIcon,
  TextCursorInputIcon,
  UsersIcon,
} from 'lucide-react';
import { wait } from 'next/dist/lib/wait';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  args: {
    autoFocus: false,
    disabled: false,
    inputSize: 'md',
    loaderPosition: 'prefix',
    loading: false,
    max: undefined,
    maxLength: undefined,
    min: undefined,
    onChange: fn(),
    placeholder: 'Enter text...',
    readOnly: false,
    required: false,
    step: undefined,
    type: 'text',
  },
  argTypes: {
    autoFocus: {
      control: { type: 'boolean' },
      description:
        'Specifies that the input field should automatically get focus when the page loads',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default value of the search input.',
      table: {
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the input field',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    inputSize: {
      control: { type: 'select' },
      description: 'Sets the size of the input field',
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      table: {
        defaultValue: { summary: 'md' },
        type: { summary: 'xxs | xs | sm | md | lg | xl' },
      },
    },
    loaderPosition: {
      control: { type: 'inline-radio' },
      description: 'Position of the loader in the input field',
      options: ['prefix', 'suffix'],
      table: {
        defaultValue: { summary: 'prefix' },
        type: { summary: 'string' },
      },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Determines if the loading spinner is shown',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value for number inputs',
      table: {
        type: { summary: 'number' },
      },
    },
    maxLength: {
      control: { type: 'number' },
      description: 'Maximum number of characters allowed in the input field',
      table: {
        type: { summary: 'number' },
      },
    },
    min: {
      control: { type: 'number' },
      description: 'Minimum value for number inputs',
      table: {
        type: { summary: 'number' },
      },
    },
    onChange: {
      action: 'changed',
      description: 'Function called when the input value changes',
      table: {
        type: {
          summary: '(event: React.ChangeEvent<HTMLInputElement>) => void',
        },
      },
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the input field',
      table: {
        type: { summary: 'string' },
      },
    },
    prefix: {
      control: { type: 'text' },
      description: 'Prefix element shown before the input field',
      table: { type: { summary: 'ReactNode' } },
    },
    readOnly: {
      control: { type: 'boolean' },
      description: 'Specifies that the input field is read-only',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Specifies that the input field must be filled out before submitting the form',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    step: {
      control: { type: 'number' },
      description: 'Interval between valid values for number inputs',
      table: {
        type: { summary: 'number' },
      },
    },
    suffix: {
      control: { type: 'text' },
      description: 'Suffix element shown after the input field',
      table: { type: { summary: 'ReactNode' } },
    },
    type: {
      control: { type: 'select' },
      description: 'The type of input field',
      options: [
        'text',
        'email',
        'password',
        'number',
        'tel',
        'url',
        'date',
        'time',
        'datetime-local',
        'month',
        'week',
        'file',
        'search',
      ],
      table: {
        defaultValue: { summary: 'text' },
        type: { summary: 'string' },
      },
    },
    value: {
      control: { type: 'text' },
      description: 'Controlled value of the input field',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  component: TextInput,
  tags: ['autodocs'],
  title: 'UI/Text Input',
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof TextInput>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    placeholder: 'Basic Text Input',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  args: {
    prefix: <ImportIcon />,
  },
  render: (args) => (
    <div className="space-y-4">
      {(['xxs', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <TextInput key={size} {...args} inputSize={size} placeholder={size} />
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Types
 * -------------------------------------------------------------------------- */

export const Types: Story = {
  args: {
    prefix: <TextCursorInputIcon />,
  },
  render: (args) => (
    <div className="space-y-4">
      {(
        [
          'text',
          'email',
          'password',
          'number',
          'tel',
          'url',
          'date',
          'time',
          'datetime-local',
          'month',
          'week',
          'file',
          'search',
        ] as const
      ).map((type) => (
        <TextInput key={type} {...args} placeholder={type} type={type} />
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled Text Input' },
};

/* -----------------------------------------------------------------------------
 * Story: ReadOnly
 * -------------------------------------------------------------------------- */

export const ReadOnly: Story = {
  args: { placeholder: 'Read-Only Text Input', readOnly: true },
};

/* -----------------------------------------------------------------------------
 * Story: Max Length
 * -------------------------------------------------------------------------- */

export const MaxLength: Story = {
  args: { maxLength: 10, placeholder: 'Max Length Text Input' },
};

/* -----------------------------------------------------------------------------
 * Story: Loading
 * -------------------------------------------------------------------------- */

export const Loading: Story = {
  args: { loading: true, placeholder: 'Loading...' },
};

/* -----------------------------------------------------------------------------
 * Story: Custom Spinner
 * -------------------------------------------------------------------------- */

export const CustomSpinner: Story = {
  args: {
    loading: true,
    placeholder: 'Loading...',
    spinner: <LoaderCircleIcon className="animate-spin" />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Prefix
 * -------------------------------------------------------------------------- */

export const Prefix: Story = {
  args: {
    placeholder: 'Email',
    prefix: <MailIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Suffix
 * -------------------------------------------------------------------------- */

export const Suffix: Story = {
  args: {
    placeholder: 'Username',
    suffix: <UsersIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Controlled
 * -------------------------------------------------------------------------- */

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('');

    return (
      <div className="space-y-4">
        <TextInput
          {...args}
          placeholder="Controlled Text Input"
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
    });

    const form = useForm<z.infer<typeof formValues>>({
      defaultValues: {
        email: '',
      },
      resolver: zodResolver(formValues),
    });

    const onSubmit = async (values: z.infer<typeof formValues>): Promise<void> => {
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
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field: { disabled, ...field } }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <TextInput
                    disabled={disabled ?? form.formState.isSubmitting}
                    placeholder="info@codefast.one"
                    prefix={<MailIcon />}
                    {...field}
                  />
                </FormControl>
                <FormDescription>This is your public display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button loading={form.formState.isSubmitting} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    );
  },
};
