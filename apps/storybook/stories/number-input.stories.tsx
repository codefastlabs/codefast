import {
  Button,
  Code,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  NumberInput,
  Pre,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ImportIcon, LoaderCircleIcon } from 'lucide-react';
import { wait } from 'next/dist/lib/wait';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  argTypes: {
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Specifies that the input field should automatically get focus when the page loads',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the input field',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    formatOptions: {
      control: {
        type: 'object',
      },
      description: 'Options for formatting the number input',
      table: {
        type: { summary: 'Intl.NumberFormatOptions' },
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
    max: {
      control: { type: 'number' },
      description: 'Maximum value for number inputs',
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
          summary: '(value: number) => void',
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
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Specifies that the input field must be filled out before submitting the form',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    step: {
      control: { type: 'number' },
      description: 'Interval between valid values for number inputs',
      table: {
        type: { summary: 'number' },
      },
    },
    value: {
      control: { type: 'number' },
      description: 'Controlled value of the input field',
      table: {
        type: { summary: 'number' },
      },
    },
  },
  args: {
    autoFocus: false,
    disabled: false,
    max: undefined,
    min: undefined,
    onChange: fn(),
    placeholder: 'Enter a number...',
    step: 1,
  },
  component: NumberInput,
  tags: ['autodocs'],
  title: 'UI/Number Input',
} satisfies Meta<typeof NumberInput>;

export default meta;

const units = {
  area: ['acre', 'hectare'],
  volume: ['liter', 'milliliter', 'gallon', 'fluid-ounce'],
  length: ['kilometer', 'meter', 'centimeter', 'inch', 'foot', 'yard', 'mile', 'mile-scandinavian'],
  mass: ['gram', 'kilogram', 'ounce', 'pound', 'stone'],
  time: ['second', 'minute', 'hour', 'day', 'week', 'month', 'year', 'millisecond', 'microsecond', 'nanosecond'],
  temperature: ['celsius', 'fahrenheit', 'degree'],
  data: [
    'bit',
    'kilobit',
    'megabit',
    'gigabit',
    'terabit',
    'byte',
    'kilobyte',
    'megabyte',
    'gigabyte',
    'terabyte',
    'petabyte',
  ],
  percentage: ['percent'],
};

type Story = StoryObj<typeof NumberInput>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    placeholder: 'Basic Number Input',
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
        <NumberInput key={size} {...args} inputSize={size} placeholder={size} />
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: CurrencyFormat
 * -------------------------------------------------------------------------- */

export const CurrencyFormat: Story = {
  args: {
    formatOptions: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      currencyDisplay: 'code',
    },
    placeholder: 'Enter a price...',
  },
};

/* -----------------------------------------------------------------------------
 * Story: PercentageFormat
 * -------------------------------------------------------------------------- */

export const PercentageFormat: Story = {
  args: {
    formatOptions: {
      style: 'percent',
      maximumFractionDigits: 2,
    },
    step: 0.01,
    placeholder: 'Enter a percentage...',
  },
};

/* -----------------------------------------------------------------------------
 * Story: UnitFormat
 * -------------------------------------------------------------------------- */

export const UnitFormat: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>('acre');

    return (
      <div className="space-y-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select a unit..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(units).map(([group, unitList]) => (
              <SelectGroup key={group}>
                <SelectLabel>{group.charAt(0).toUpperCase() + group.slice(1)}</SelectLabel>

                {unitList.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <NumberInput
          {...args}
          formatOptions={{
            style: 'unit',
            unit: value,
          }}
          placeholder={`Enter a value in ${value}s...`}
        />
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: ReadOnly
 * -------------------------------------------------------------------------- */

export const ReadOnly: Story = {
  args: { readOnly: true, placeholder: 'Read-Only Number Input' },
};

/* -----------------------------------------------------------------------------
 * Story: Loading
 * -------------------------------------------------------------------------- */

export const Loading: Story = {
  args: { loading: true, placeholder: 'Loading Number Input' },
};

/* -----------------------------------------------------------------------------
 * Story: CustomSpinner
 * -------------------------------------------------------------------------- */

export const CustomSpinner: Story = {
  args: {
    loading: true,
    spinner: <LoaderCircleIcon className="animate-spin" />,
    placeholder: 'Custom Spinner Number Input',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Prefix
 * -------------------------------------------------------------------------- */

export const Prefix: Story = {
  args: { prefix: <ImportIcon />, placeholder: 'Number Input with Prefix' },
};

/* -----------------------------------------------------------------------------
 * Story: Suffix
 * -------------------------------------------------------------------------- */

export const Suffix: Story = {
  args: { suffix: <ImportIcon />, placeholder: 'Number Input with Suffix' },
};

/* -----------------------------------------------------------------------------
 * Story: MinMax
 * -------------------------------------------------------------------------- */

export const MinMax: Story = {
  args: {
    min: 0,
    max: 100,
    placeholder: 'Number between 0 and 100',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled Number Input' },
};

/* -----------------------------------------------------------------------------
 * Story: MaxValue
 * -------------------------------------------------------------------------- */

export const MaxValue: Story = {
  args: { max: 50, placeholder: 'Max Value Number Input (max=50)' },
};

/* -----------------------------------------------------------------------------
 * Story: MinValue
 * -------------------------------------------------------------------------- */

export const MinValue: Story = {
  args: { min: 10, placeholder: 'Min Value Number Input (min=10)' },
};

/* -----------------------------------------------------------------------------
 * Story: StepValue
 * -------------------------------------------------------------------------- */

export const StepValue: Story = {
  args: { step: 5, placeholder: 'Step Value Number Input (step=5)' },
};

/* -----------------------------------------------------------------------------
 * Story: Controlled
 * -------------------------------------------------------------------------- */

export const Controlled: Story = {
  render: (args) => {
    const [number, setNumber] = useState(0);

    return (
      <div className="space-y-4">
        <NumberInput
          {...args}
          placeholder="Controlled Number Input"
          value={number}
          onChange={(value) => {
            setNumber(value);
          }}
        />
        <p>
          <strong>Value:</strong> {number}
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
      number: z.number().min(0, { message: 'Must be at least 0.' }),
    });

    const form = useForm<z.infer<typeof formValues>>({
      resolver: zodResolver(formValues),
      defaultValues: {
        number: 0,
      },
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
            name="number"
            render={({ field: { disabled, ...field } }) => (
              <FormItem>
                <FormLabel>Number Input</FormLabel>
                <FormControl>
                  <NumberInput disabled={disabled} {...field} placeholder="Enter a number" />
                </FormControl>
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
