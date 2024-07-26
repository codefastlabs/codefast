import { type Meta, type StoryObj } from '@storybook/react';
import { NumberInput } from '@codefast/ui/number-input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wait } from 'next/dist/lib/wait';
import { toast, Toaster } from '@codefast/ui/sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { Pre } from '@codefast/ui/pre';
import { Button } from '@codefast/ui/button';
import { Code } from '@codefast/ui/code';

const meta = {
  component: NumberInput,
  tags: ['autodocs'],
  title: 'Components/Inputs/Number Input',
  argTypes: {
    inputSize: {
      control: { type: 'inline-radio' },
      description: 'The size of the button.',
      options: ['xs', 'sm', 'default', 'lg'],
    },
  },
  args: {
    inputSize: 'default',
  },
} satisfies Meta<typeof NumberInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    placeholder: 'Placeholder',
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled',
    disabled: true,
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Readonly
 * -------------------------------------------------------------------------- */

export const Readonly: Story = {
  args: {
    placeholder: 'Readonly',
    readOnly: true,
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Formating With Decimal
 * -------------------------------------------------------------------------- */

export const FormatingWithDecimal: Story = {
  args: {
    placeholder: 'Decimal',
    defaultValue: 0,
    formatOptions: {
      signDisplay: 'exceptZero',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    },
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Formating With Percentage
 * -------------------------------------------------------------------------- */

export const FormatingWithPercentage: Story = {
  args: {
    placeholder: 'Percentage',
    defaultValue: 0.5,
    formatOptions: {
      style: 'percent',
    },
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Formating With Currency
 * -------------------------------------------------------------------------- */

export const FormatingWithCurrency: Story = {
  args: {
    placeholder: 'Currency',
    defaultValue: 45,
    formatOptions: {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'code',
      currencySign: 'accounting',
    },
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Formating With Unit
 * -------------------------------------------------------------------------- */

export const FormatingWithUnit: Story = {
  args: {
    placeholder: 'Unit',
    defaultValue: 4,
    formatOptions: {
      style: 'unit',
      unit: 'inch',
      unitDisplay: 'long',
    },
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const FormSchema = z.object({
  age: z.coerce.number().int().positive().min(18).max(99),
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
        age: 10,
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
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <NumberInput disabled={form.formState.isSubmitting} placeholder="codefast" {...field} {...args} />
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
