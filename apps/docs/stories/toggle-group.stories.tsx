import { ToggleGroup, ToggleGroupItem } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ApertureIcon, ExpandIcon, PackageCheckIcon } from 'lucide-react';
import { useState } from 'react';

const meta = {
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'The value of the toggle item that should be selected by default.',
      table: {
        type: { summary: 'string | string[]' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the toggle group and all its items.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    icon: {
      control: { type: 'boolean' },
      description: 'If true, the toggle button will have an icon',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onValueChange: {
      action: 'onValueChange',
      description: 'Callback function triggered when the value of the selected toggle item changes.',
      table: {
        type: { summary: '(value: string | string[]) => void' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Toggle button size',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'md' } },
    },
    type: {
      control: { type: 'inline-radio' },
      options: ['single', 'multiple'],
      description:
        'Defines whether only a single toggle item can be active at a time (`single`) or multiple items can be active (`multiple`).',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'single' },
      },
    },
    value: {
      control: { type: 'text' },
      description:
        'The controlled value of the selected toggle item. This should be used when the component is controlled.',
      table: {
        type: { summary: 'string | string[]' },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'info', 'success', 'warning', 'destructive', 'outline', 'ghost'],
      description: 'Toggle button variant styles',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
  },
  args: {
    disabled: false,
    icon: false,
    onValueChange: fn(),
    size: 'md',
    type: 'single',
    variant: 'default',
  },
  component: ToggleGroup,
  tags: ['autodocs'],
  title: 'UI/Toggle Group',
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof ToggleGroup>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
      <ToggleGroupItem value="2">Option 2</ToggleGroupItem>
      <ToggleGroupItem value="3">Option 3</ToggleGroupItem>
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(['xxs', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <ToggleGroup key={size} {...args} size={size}>
          <ToggleGroupItem value="1">{size} 1</ToggleGroupItem>
          <ToggleGroupItem value="2">{size} 2</ToggleGroupItem>
          <ToggleGroupItem value="3">{size} 3</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Variants
 * -------------------------------------------------------------------------- */

export const Variants: Story = {
  args: { className: '[&_button]:capitalize' },
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(['default', 'secondary', 'info', 'success', 'warning', 'destructive', 'outline', 'ghost'] as const).map(
        (variant) => (
          <ToggleGroup key={variant} {...args} variant={variant}>
            <ToggleGroupItem value="1">{variant} 1</ToggleGroupItem>
            <ToggleGroupItem value="2">{variant} 2</ToggleGroupItem>
            <ToggleGroupItem value="3">{variant} 3</ToggleGroupItem>
          </ToggleGroup>
        ),
      )}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Icons
 * -------------------------------------------------------------------------- */

export const Icons: Story = {
  args: { icon: true },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem prefix={<ExpandIcon />} value="1" />
      <ToggleGroupItem prefix={<ApertureIcon />} value="2" />
      <ToggleGroupItem prefix={<PackageCheckIcon />} value="3" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Prefix
 * -------------------------------------------------------------------------- */

export const Prefix: Story = {
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem prefix={<ExpandIcon />} value="1">
        Option 1
      </ToggleGroupItem>
      <ToggleGroupItem prefix={<ApertureIcon />} value="2">
        Option 2
      </ToggleGroupItem>
      <ToggleGroupItem prefix={<PackageCheckIcon />} value="3">
        Option 3
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Suffix
 * -------------------------------------------------------------------------- */

export const Suffix: Story = {
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem suffix={<ExpandIcon />} value="1">
        Option 1
      </ToggleGroupItem>
      <ToggleGroupItem suffix={<ApertureIcon />} value="2">
        Option 2
      </ToggleGroupItem>
      <ToggleGroupItem suffix={<PackageCheckIcon />} value="3">
        Option 3
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Controlled
 * -------------------------------------------------------------------------- */

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('1');

    return (
      <div className="space-y-4">
        <ToggleGroup {...args} defaultValue="1" type="single" value={value} onValueChange={setValue}>
          <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="2">Option 2</ToggleGroupItem>
          <ToggleGroupItem value="3">Option 3</ToggleGroupItem>
        </ToggleGroup>

        <p>
          <strong>Value:</strong> {value}
        </p>
      </div>
    );
  },
};
