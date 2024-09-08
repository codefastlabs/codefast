import { type Meta, type StoryObj } from '@storybook/react';
import { NumberInput } from '@codefast/ui/number-input';
import { z } from 'zod';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wait } from 'next/dist/lib/wait';
import { toast, Toaster } from '@codefast/ui/sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { Pre } from '@codefast/ui/pre';
import { Button } from '@codefast/ui/button';
import { Code } from '@codefast/ui/code';
import { Label } from '@codefast/ui/label';
import { useState } from 'react';

const meta = {
  args: {
    inputSize: 'md',
  },
  component: NumberInput,
  tags: ['autodocs'],
  title: 'Components/Inputs/Number Input',
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
    step: 0.01,
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
      maximumFractionDigits: 2,
    },
    step: 0.02,
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
 * Story: Min and Max
 * -------------------------------------------------------------------------- */

export const MinAndMax: Story = {
  args: {
    placeholder: 'Min and Max',
    defaultValue: 50,
    min: 0,
    max: 100,
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Step
 * -------------------------------------------------------------------------- */

export const Step: Story = {
  args: {
    placeholder: 'Step',
    defaultValue: 50,
    step: 10,
  },
  render: (args) => {
    return <NumberInput {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  args: {
    placeholder: 'Sizes',
  },
  render: (args) => {
    return (
      <div className="grid place-items-center gap-4 sm:grid-cols-3">
        <NumberInput {...args} inputSize="sm" />
        <NumberInput {...args} />
        <NumberInput {...args} inputSize="lg" />
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Controlled
 * -------------------------------------------------------------------------- */

export const Controlled: Story = {
  args: {
    placeholder: 'Controlled',
    formatOptions: {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'code',
      currencySign: 'accounting',
    },
  },
  render: (args) => {
    const [value, setValue] = useState(50);

    return (
      <div className="space-y-4">
        <NumberInput {...args} value={value} onChange={setValue} />
        <NumberInput {...args} value={value} onChange={setValue} />
        <p>Mirrored number: {value}</p>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Form Reset
 * -------------------------------------------------------------------------- */

export const FormReset: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  args: {
    placeholder: 'Form Reset',
    value: 50,
    formatOptions: {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'code',
      currencySign: 'accounting',
    },
  },
  render: (args) => {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target as HTMLFormElement);

          toast.message('Form submitted!', {
            description: (
              <Pre className="w-full rounded-md bg-slate-950 p-4">
                <Code className="text-white">{JSON.stringify(Object.fromEntries(formData.entries()), null, 2)}</Code>
              </Pre>
            ),
          });
        }}
      >
        <div className="space-y-2">
          <Label>Enter a number:</Label>
          <NumberInput name="number" {...args} />
        </div>
        <Button type="reset" variant="outline">
          Reset form
        </Button>
      </form>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const FormValues = z.object({
  age: z.coerce.number().int().positive().min(18).max(99),
});

type FormValues = z.infer<typeof FormValues>;

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
      resolver: zodResolver(FormValues),
      defaultValues: {
        age: 10,
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
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <NumberInput disabled={form.formState.isSubmitting} placeholder="codefast" {...field} {...args} />
                </FormControl>
                <FormDescription>This is your public display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4">
            <Button loading={form.formState.isSubmitting} type="submit">
              Submit
            </Button>
            <Button loading={form.formState.isSubmitting} type="reset" variant="outline">
              Reset (Native)
            </Button>
            <Button
              loading={form.formState.isSubmitting}
              type="reset"
              variant="secondary"
              onClick={() => {
                form.reset();
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>
    );
  },
};
