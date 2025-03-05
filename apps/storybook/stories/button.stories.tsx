import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@codefast/ui';
import { fn } from '@storybook/test';
import { LoaderCircleIcon, PaletteIcon, ScanSearchIcon, TreeDeciduousIcon } from 'lucide-react';
import { useState } from 'react';

const meta = {
  args: {
    disabled: false,
    icon: false,
    loaderPosition: 'prefix',
    loading: false,
    onClick: fn(),
    prefix: undefined,
    size: 'md',
    spinner: undefined,
    suffix: undefined,
    variant: 'default',
  },
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the button',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    icon: {
      control: { type: 'boolean' },
      description: 'Indicates if the button should display an icon',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    loaderPosition: {
      control: { type: 'inline-radio' },
      description: 'Position of the loader',
      options: ['prefix', 'suffix'],
      table: {
        defaultValue: { summary: 'prefix' },
        type: { summary: 'string' },
      },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Shows a loading spinner when true',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    onClick: {
      action: 'onClick',
      description: 'Callback function triggered when the button is clicked',
      table: {
        type: { summary: '() => void' },
      },
    },
    prefix: {
      control: { type: 'text' },
      description: 'Element shown before the button content',
      table: { type: { summary: 'ReactNode' } },
    },
    size: {
      control: { type: 'select' },
      description: 'Button size',
      options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl'],
      table: { defaultValue: { summary: 'md' }, type: { summary: 'string' } },
    },
    spinner: {
      control: { type: 'text' },
      description: 'Custom spinner element',
      table: { type: { summary: 'ReactNode' } },
    },
    suffix: {
      control: { type: 'text' },
      description: 'Element shown after the button content',
      table: { type: { summary: 'ReactNode' } },
    },
    variant: {
      control: { type: 'select' },
      description: 'Button variant styles',
      options: ['default', 'secondary', 'info', 'success', 'warning', 'destructive', 'outline', 'ghost', 'link'],
      table: {
        defaultValue: { summary: 'default' },
        type: { summary: 'string' },
      },
    },
  },
  component: Button,
  tags: ['autodocs'],
  title: 'UI/Button',
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof Button>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    children: 'Click Me',
  },
};

export const Sizes: Story = {
  args: {
    prefix: <ScanSearchIcon />,
  },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {size} button
        </Button>
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Variants
 * -------------------------------------------------------------------------- */

export const Variants: Story = {
  args: { className: 'capitalize' },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const).map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant} Button
        </Button>
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Loading
 * -------------------------------------------------------------------------- */

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: CustomSpinner
 * -------------------------------------------------------------------------- */

export const CustomSpinner: Story = {
  args: {
    children: 'Loading...',
    loading: true,
    spinner: <LoaderCircleIcon className="animate-spin" />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Prefix
 * -------------------------------------------------------------------------- */

export const Prefix: Story = {
  args: {
    children: 'Submit',
    prefix: <PaletteIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Suffix
 * -------------------------------------------------------------------------- */

export const Suffix: Story = {
  args: {
    children: 'Submit',
    suffix: <TreeDeciduousIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: IconOnly
 * -------------------------------------------------------------------------- */

export const IconOnly: Story = {
  args: {
    icon: true,
    prefix: <PaletteIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Controlled
 * -------------------------------------------------------------------------- */

export const Controlled: Story = {
  render: (args) => {
    const [count, setCount] = useState(0);

    return (
      <div className="space-y-4">
        <Button
          {...args}
          onClick={() => {
            setCount(count + 1);
          }}
        >
          Click Me
        </Button>
        <p>
          <strong>Count:</strong> {count}
        </p>
      </div>
    );
  },
};
