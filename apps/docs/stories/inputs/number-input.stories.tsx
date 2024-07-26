import { type Meta, type StoryObj } from '@storybook/react';
import { NumberInput } from '@codefast/ui/number-input';

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
