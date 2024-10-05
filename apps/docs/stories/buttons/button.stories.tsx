import { type Meta, type StoryObj } from '@storybook/react';
import { Button } from '@codefast/ui';
import { PaletteIcon, TreeDeciduousIcon } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Button> = {
  title: 'Components/Buttons/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
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
    loaderPosition: {
      control: { type: 'select' },
      options: ['prefix', 'suffix'],
      description: 'Position of the loader',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'prefix' },
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
        'link',
      ],
      description: 'Button variant styles',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'md' } },
    },
    icon: {
      control: { type: 'boolean' },
      description: 'Indicates if the button should display an icon',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    prefix: {
      control: { type: 'text' },
      description: 'Element shown before the button content',
      table: { type: { summary: 'ReactNode' } },
    },
    suffix: {
      control: { type: 'text' },
      description: 'Element shown after the button content',
      table: { type: { summary: 'ReactNode' } },
    },
    spinner: {
      control: { type: 'text' },
      description: 'Custom spinner element',
      table: { type: { summary: 'ReactNode' } },
    },
  },
  args: {
    disabled: false,
    loading: false,
    loaderPosition: 'prefix',
    variant: 'default',
    size: 'md',
    icon: false,
    prefix: undefined,
    suffix: undefined,
    spinner: undefined,
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Basic: Story = {
  args: {
    children: 'Click Me',
  },
};

// Story for Button with loading state
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

// Story for Button with prefix and suffix
export const PrefixSuffix: Story = {
  args: {
    prefix: <PaletteIcon />,
    children: 'Submit',
    suffix: <TreeDeciduousIcon />,
  },
};

// Story for Button in the disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

// Story for Button with different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button size="xxs">xxs button</Button>
      <Button size="xs">xs button</Button>
      <Button size="sm">sm button</Button>
      <Button size="md">md button</Button>
      <Button size="lg">lg button</Button>
      <Button size="xl">xl button</Button>
    </div>
  ),
};

// Story for Button in a controlled state
export const Controlled: Story = {
  render: () => {
    const [count, setCount] = useState(0);

    return (
      <div className="space-y-4">
        <Button
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

// Story for Button with different variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="default">Default Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="info">Info Button</Button>
      <Button variant="success">Success Button</Button>
      <Button variant="warning">Warning Button</Button>
      <Button variant="destructive">Destructive Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="link">Link Button</Button>
    </div>
  ),
};
