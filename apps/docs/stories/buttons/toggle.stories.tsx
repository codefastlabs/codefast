import * as React from 'react';
import { useState } from 'react';
import { type Meta, type StoryObj } from '@storybook/react';
import { Toggle } from '@codefast/ui';
import { fn } from '@storybook/test';
import { ExpandIcon } from 'lucide-react';

const meta: Meta<typeof Toggle> = {
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the toggle button.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    pressed: {
      control: { type: 'boolean' },
      description: 'The controlled state of the toggle (pressed or not).',
      table: {
        type: { summary: 'boolean' },
      },
    },
    defaultPressed: {
      control: { type: 'boolean' },
      description:
        'The uncontrolled state of the toggle when initially rendered.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onPressedChange: {
      action: 'onPressedChange',
      description: 'Callback function triggered when the toggle state changes.',
      table: {
        type: { summary: '(pressed: boolean) => void' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Toggle button size.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'secondary',
        'info',
        'success',
        'warning',
        'destructive',
        'outline',
        'ghost',
      ],
      description: 'Toggle button variant styles.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
  },
  args: {
    disabled: false,
    defaultPressed: false,
    size: 'md',
    variant: 'default',
    onPressedChange: fn(),
  },
  component: Toggle,
  tags: ['autodocs'],
  title: 'Components/Buttons/Toggle',
};

export default meta;

type Story = StoryObj<typeof Toggle>;

// Default story showing a basic toggle button
export const Default: Story = {
  render: (args) => <Toggle {...args}>Toggle</Toggle>,
};

// Story showing different sizes of toggle buttons
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

// Story showing different variants of toggle buttons
export const Variants: Story = {
  args: {
    className: 'capitalize',
  },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(
        [
          'default',
          'secondary',
          'info',
          'success',
          'warning',
          'destructive',
          'outline',
          'ghost',
        ] as const
      ).map((variant) => (
        <Toggle key={variant} {...args} variant={variant}>
          {variant} Toggle
        </Toggle>
      ))}
    </div>
  ),
};

// Story showing a disabled toggle button
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Toggle',
  },
};

// Story with toggle button having an icon
export const IconOnly: Story = {
  args: {
    prefix: <ExpandIcon />,
    icon: true,
  },
};

// Story for Toggle with prefix
export const Prefix: Story = {
  args: {
    prefix: <ExpandIcon />,
    children: 'Option',
  },
};

// Story for Toggle with suffix
export const Suffix: Story = {
  args: {
    suffix: <ExpandIcon />,
    children: 'Option',
  },
};

// Interactive story for toggle button
export const Interactive: Story = {
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
  args: {
    size: 'md',
    variant: 'default',
    icon: false,
    disabled: false,
  },
};

// Story for Toggle with controlled state
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
