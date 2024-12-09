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
  args: {
    autoFocus: false,
    disabled: false,
    max: undefined,
    min: undefined,
    onChange: fn(),
    placeholder: 'Enter a number...',
    step: 1,
  },
  argTypes: {
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Specifies that the input field should automatically get focus when the page loads',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
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
    value: {
      control: { type: 'number' },
      description: 'Controlled value of the input field',
      table: {
        type: { summary: 'number' },
      },
    },
  },
  component: NumberInput,
  tags: ['autodocs'],
  title: 'UI/Number Input',
} satisfies Meta<typeof NumberInput>;

export default meta;

const units = {
  area: ['acre', 'hectare'],
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
  length: ['kilometer', 'meter', 'centimeter', 'inch', 'foot', 'yard', 'mile', 'mile-scandinavian'],
  mass: ['gram', 'kilogram', 'ounce', 'pound', 'stone'],
  percentage: ['percent'],
  temperature: ['celsius', 'fahrenheit', 'degree'],
  time: ['second', 'minute', 'hour', 'day', 'week', 'month', 'year', 'millisecond', 'microsecond', 'nanosecond'],
  volume: ['liter', 'milliliter', 'gallon', 'fluid-ounce'],
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
      currency: 'USD',
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      style: 'currency',
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
      maximumFractionDigits: 2,
      style: 'percent',
    },
    placeholder: 'Enter a percentage...',
    step: 0.01,
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
  args: { placeholder: 'Read-Only Number Input', readOnly: true },
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
    placeholder: 'Custom Spinner Number Input',
    spinner: <LoaderCircleIcon className="animate-spin" />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Prefix
 * -------------------------------------------------------------------------- */

export const Prefix: Story = {
  args: { placeholder: 'Number Input with Prefix', prefix: <ImportIcon /> },
};

/* -----------------------------------------------------------------------------
 * Story: Suffix
 * -------------------------------------------------------------------------- */

export const Suffix: Story = {
  args: { placeholder: 'Number Input with Suffix', suffix: <ImportIcon /> },
};

/* -----------------------------------------------------------------------------
 * Story: MinMax
 * -------------------------------------------------------------------------- */

export const MinMax: Story = {
  args: {
    max: 100,
    min: 0,
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
  args: { placeholder: 'Step Value Number Input (step=5)', step: 5 },
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
      defaultValues: {
        number: 0,
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
