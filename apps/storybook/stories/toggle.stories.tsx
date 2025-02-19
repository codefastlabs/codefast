import type { Meta, StoryObj } from '@storybook/react';

import { Toggle } from '@codefast/ui';
import { fn } from '@storybook/test';
import { ExpandIcon } from 'lucide-react';
import { useState } from 'react';

const meta = {
  args: {
    defaultPressed: false,
    disabled: false,
    onPressedChange: fn(),
    size: 'md',
    variant: 'default',
  },
  argTypes: {
    defaultPressed: {
      control: { type: 'boolean' },
      description: 'The uncontrolled state of the toggle when initially rendered.',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the toggle button.',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    onPressedChange: {
      action: 'onPressedChange',
      description: 'Callback function triggered when the toggle state changes.',
      table: {
        type: { summary: '(pressed: boolean) => void' },
      },
    },
    pressed: {
      control: { type: 'boolean' },
      description: 'The controlled state of the toggle (pressed or not).',
      table: {
        type: { summary: 'boolean' },
      },
    },
    size: {
      control: { type: 'select' },
      description: 'Toggle button size.',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      table: {
        defaultValue: { summary: 'md' },
        type: { summary: 'string' },
      },
    },
    variant: {
      control: { type: 'select' },
      description: 'Toggle button variant styles.',
      options: ['default', 'secondary', 'info', 'success', 'warning', 'destructive', 'outline', 'ghost'],
      table: {
        defaultValue: { summary: 'default' },
        type: { summary: 'string' },
      },
    },
  },
  component: Toggle,
  tags: ['autodocs'],
  title: 'UI/Toggle',
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof Toggle>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => <Toggle {...args}>Toggle</Toggle>,
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Toggle key={size} {...args} size={size}>
          {size} Toggle
        </Toggle>
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Variants
 * -------------------------------------------------------------------------- */

export const Variants: Story = {
  args: {
    className: 'capitalize',
  },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['default', 'secondary', 'info', 'success', 'warning', 'destructive', 'outline', 'ghost'] as const).map(
        (variant) => (
          <Toggle key={variant} {...args} variant={variant}>
            {variant} Toggle
          </Toggle>
        ),
      )}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: {
    children: 'Disabled Toggle',
    disabled: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Icon Only
 * -------------------------------------------------------------------------- */

export const IconOnly: Story = {
  args: {
    icon: true,
    prefix: <ExpandIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Prefix
 * -------------------------------------------------------------------------- */

export const Prefix: Story = {
  args: {
    children: 'Option',
    prefix: <ExpandIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Suffix
 * -------------------------------------------------------------------------- */

export const Suffix: Story = {
  args: {
    children: 'Option',
    suffix: <ExpandIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Interactive
 * -------------------------------------------------------------------------- */

export const Interactive: Story = {
  args: {
    disabled: false,
    icon: false,
    size: 'md',
    variant: 'default',
  },
  render: (args) => {
    const [toggled, setToggled] = useState(false);

    return (
      <Toggle
        {...args}
        onClick={() => {
          setToggled(!toggled);
        }}
      >
        {toggled ? 'On' : 'Off'}
      </Toggle>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Controlled
 * -------------------------------------------------------------------------- */

export const Controlled: Story = {
  render: (args) => {
    const [pressed, setPressed] = useState(false);

    return (
      <div className="space-y-4">
        <Toggle {...args} pressed={pressed} onPressedChange={setPressed}>
          Controlled Toggle
        </Toggle>
        <p>
          <strong>Pressed:</strong> {pressed ? 'Yes' : 'No'}
        </p>
      </div>
    );
  },
};
