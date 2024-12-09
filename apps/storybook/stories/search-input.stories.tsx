import { SearchInput } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';
import { NotebookIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof SearchInput> = {
  argTypes: {
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Specifies that the input field should automatically get focus when the page loads',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
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
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    inputSize: {
      control: { type: 'select' },
      description: 'Size of the search input.',
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      table: {
        defaultValue: { summary: 'md' },
        type: { summary: 'string' },
      },
    },
    loaderPosition: {
      control: { type: 'select' },
      description: 'Position of the loader/spinner.',
      options: ['prefix', 'suffix'],
      table: {
        defaultValue: { summary: 'prefix' },
        type: { summary: 'string' },
      },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the search input is in a loading state.',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
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
  title: 'UI/Search Input',
};

export default meta;

type Story = StoryObj<typeof SearchInput>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    disabled: false,
    loading: false,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
 * Story: With Default Value
 * -------------------------------------------------------------------------- */

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'Default search value',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Read-only
 * -------------------------------------------------------------------------- */

export const ReadOnly: Story = {
  args: {
    placeholder: 'Read-only search input',
    readOnly: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Loading
 * -------------------------------------------------------------------------- */

export const Loading: Story = {
  args: {
    loading: true,
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Prefix Suffix
 * -------------------------------------------------------------------------- */

export const WithPrefixSuffix: Story = {
  args: {
    prefix: <SearchIcon />,
    suffix: <NotebookIcon />,
  },
};

/* -----------------------------------------------------------------------------
 * Story: Interactive
 * -------------------------------------------------------------------------- */

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
