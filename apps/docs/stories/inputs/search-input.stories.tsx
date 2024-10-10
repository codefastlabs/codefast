import { SearchInput } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';
import { NotebookIcon, SearchIcon } from 'lucide-react';
import React, { useState } from 'react';

const meta: Meta<typeof SearchInput> = {
  argTypes: {
    autoFocus: {
      control: { type: 'boolean' },
      description:
        'Specifies that the input field should automatically get focus when the page loads',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default value of the search input.',
      table: {
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the search input.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    inputSize: {
      control: { type: 'select' },
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the search input.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    loaderPosition: {
      control: { type: 'select' },
      options: ['prefix', 'suffix'],
      description: 'Position of the loader/spinner.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'prefix' },
      },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the search input is in a loading state.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onChange: {
      action: 'onChange',
      description: 'Callback function triggered when the value changes.',
      table: {
        type: { summary: '(value: string) => void' },
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
      description: 'Content to be displayed before the input.',
      table: {
        type: { summary: 'React.ReactNode' },
      },
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
      description:
        'Specifies that the input field must be filled out before submitting the form',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    spinner: {
      control: { type: 'text' },
      description: 'Custom spinner component.',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
    suffix: {
      control: { type: 'text' },
      description: 'Content to be displayed after the input.',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
    value: {
      control: { type: 'text' },
      description: 'The controlled value of the search input.',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  component: SearchInput,
  tags: ['autodocs'],
  title: 'Components/Inputs/Search Input',
};

export default meta;

type Story = StoryObj<typeof SearchInput>;

// Default story showing basic SearchInput
export const Default: Story = {
  args: {
    loading: false,
    disabled: false,
  },
};

// Story for NumberInput with different sizes
export const Sizes: Story = {
  args: {
    prefix: <SearchIcon />,
  },
  render: (args) => (
    <div className="space-y-4">
      {(['xxs', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <SearchInput key={size} {...args} inputSize={size} placeholder={size} />
      ))}
    </div>
  ),
};

// Story showing SearchInput with a default value
export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'Default search value',
  },
};

// Story showing disabled SearchInput
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

// Story showing SearchInput with read-only state
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    placeholder: 'Read-only search input',
  },
};

// Story showing SearchInput with loading state
export const Loading: Story = {
  args: {
    loading: true,
  },
};

// Story showing SearchInput with custom prefix and suffix
export const WithPrefixSuffix: Story = {
  args: {
    prefix: <SearchIcon />,
    suffix: <NotebookIcon />,
  },
};

// Interactive story for SearchInput
export const Interactive: Story = {
  render: (args) => {
    const [searchValue, setSearchValue] = useState('');

    return (
      <SearchInput
        {...args}
        value={searchValue}
        onChange={(value) => {
          setSearchValue(value);
        }}
      />
    );
  },
};
