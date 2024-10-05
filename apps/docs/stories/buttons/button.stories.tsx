import * as React from 'react';
import { type Meta, type StoryObj } from '@storybook/react';
import { Button } from '@codefast/ui';
import { LoaderCircleIcon, PaletteIcon, TreeDeciduousIcon } from 'lucide-react';
import { fn } from '@storybook/test';

const meta = {
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    icon: {
      control: { type: 'boolean' },
      description: 'Indicates if the button should display an icon',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    loaderPosition: {
      control: { type: 'inline-radio' },
      options: ['prefix', 'suffix'],
      description: 'Position of the loader',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'prefix' },
      },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Shows a loading spinner when true',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
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
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'md' } },
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
      options: [
        'default',
        'secondary',
        'info',
        'success',
        'warning',
        'destructive',
        'outline',
        'ghost',
        'link',
      ],
      description: 'Button variant styles',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
  },
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
  component: Button,
  tags: ['autodocs'],
  title: 'Components/Buttons/Button',
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof Button>;

export const Basic: Story = {
  args: {
    children: 'Click Me',
  },
};

// Story for Button with different sizes
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['xxs', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {size} button
        </Button>
      ))}
    </div>
  ),
};

// Story for Button with different variants
export const Variants: Story = {
  args: { className: 'capitalize' },
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
          'link',
        ] as const
      ).map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant} Button
        </Button>
      ))}
    </div>
  ),
};

// Story for Button in the disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

// Story for Button with loading state
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

// Story for Button with a custom spinner
export const CustomSpinner: Story = {
  args: {
    children: 'Loading...',
    spinner: <LoaderCircleIcon className="animate-spin" />,
    loading: true,
  },
};

// Story for Button with prefix
export const Prefix: Story = {
  args: {
    prefix: <PaletteIcon />,
    children: 'Submit',
  },
};

// Story for Button with suffix
export const Suffix: Story = {
  args: {
    children: 'Submit',
    suffix: <TreeDeciduousIcon />,
  },
};

// Story for Button in a controlled state
export const Controlled: Story = {
  render: (args) => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="space-y-4">
        <Button
          onClick={() => {
            setCount(count + 1);
          }}
          {...args}
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
