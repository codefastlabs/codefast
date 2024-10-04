import { type Meta, type StoryObj } from '@storybook/react';
import { PasswordInput } from '@codefast/ui';
import { LoaderCircleIcon, LockKeyholeIcon, LockKeyholeOpenIcon } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/Inputs/Password Input',
  component: PasswordInput,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the input field',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    inputSize: {
      control: { type: 'select' },
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Sets the size of the input field',
      table: { type: { summary: 'xxs | xs | sm | md | lg | xl' }, defaultValue: { summary: 'md' } },
    },
    loaderPosition: {
      control: { type: 'select' },
      options: ['prefix', 'suffix'],
      description: 'Position of the loader in the input field',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'prefix' } },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Determines if the loading spinner is shown',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    prefix: {
      control: { type: 'text' },
      description: 'Prefix element shown before the input field',
      table: { type: { summary: 'ReactNode' } },
    },
    spinner: {
      control: false,
      description: 'Custom spinner element shown when loading',
      table: { type: { summary: 'ReactNode' } },
    },
    suffix: {
      control: { type: 'text' },
      description: 'Suffix element shown after the input field',
      table: { type: { summary: 'ReactNode' } },
    },
  },
  args: {
    disabled: false,
    inputSize: 'md',
    loaderPosition: 'prefix',
    loading: false,
  },
};

export default meta;

type Story = StoryObj<typeof PasswordInput>;

export const Basic: Story = {};

// Story for InputPassword with loading state
export const Loading: Story = {
  args: { loading: true },
};

// Story for PasswordInput with prefix and suffix
export const PrefixSuffix: Story = {
  args: { prefix: <LockKeyholeOpenIcon />, suffix: <LockKeyholeIcon /> },
};

// Story for PasswordInput with different sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <PasswordInput inputSize="xxs" placeholder="xxs" />
      <PasswordInput inputSize="xs" placeholder="xs" />
      <PasswordInput inputSize="sm" placeholder="sm" />
      <PasswordInput inputSize="md" placeholder="md" />
      <PasswordInput inputSize="lg" placeholder="lg" />
      <PasswordInput inputSize="xl" placeholder="xl" />
    </div>
  ),
};

// Story for PasswordInput in the disabled state
export const Disabled: Story = {
  args: { disabled: true },
};

// Story for PasswordInput with a custom spinner
export const CustomSpinner: Story = {
  args: { spinner: <LoaderCircleIcon className="animate-spin" />, loading: true },
};

// Story for PasswordInput in a controlled state
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="space-y-4">
        <PasswordInput
          placeholder="Controlled"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />

        <p>
          <strong>Value:</strong> {value}
        </p>
      </div>
    );
  },
};
