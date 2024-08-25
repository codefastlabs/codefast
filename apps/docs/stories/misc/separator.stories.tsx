import { Separator, SeparatorItem } from '@codefast/ui/separator';
import { Box } from '@codefast/ui/box';
import { Text } from '@codefast/ui/text';
import { Heading } from '@codefast/ui/heading';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Separator,
  tags: ['autodocs'],
  title: 'Components/Misc/Separator',
  argTypes: {
    orientation: {
      control: 'inline-radio',
      description: 'Choose the orientation of the separator.',
      type: {
        name: 'enum',
        value: ['horizontal', 'vertical'],
      },
      table: {
        defaultValue: {
          summary: 'horizontal',
        },
      },
    },
    align: {
      control: 'inline-radio',
      description: 'Choose the alignment of the separator.',
      type: {
        name: 'enum',
        value: ['start', 'center', 'end'],
      },
      table: {
        defaultValue: {
          summary: 'start',
        },
      },
    },
  },
  args: {
    orientation: 'horizontal',
    align: 'start',
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <Box>
      <Box className="space-y-1">
        <Heading as="h4" className="text-sm font-medium leading-none">
          Radix Primitives
        </Heading>
        <Text className="text-muted-foreground text-sm">An open-source UI component library.</Text>
      </Box>
      <Separator className="my-4" />
      <Box className="flex items-center space-x-4 text-sm">
        <Box>Blog</Box>
        <Separator className="h-4" orientation="vertical" />
        <Box>Docs</Box>
        <Separator className="h-4" orientation="vertical" />
        <Box>Source</Box>
      </Box>
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Vertical
 * -------------------------------------------------------------------------- */

export const Vertical: Story = {
  render: () => (
    <Box className="flex items-center space-x-4">
      <Box>Blog</Box>
      <Separator className="h-4" orientation="vertical" />
      <Box>Docs</Box>
      <Separator className="h-4" orientation="vertical" />
      <Box>Source</Box>
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Label
 * -------------------------------------------------------------------------- */

export const Label: Story = {
  render: (args) => (
    <Box>
      <Heading as="h4" className="text-sm font-medium leading-none">
        Radix Primitives
      </Heading>
      <Separator className="my-4" {...args}>
        <SeparatorItem>or</SeparatorItem>
      </Separator>
      <Text className="text-muted-foreground text-sm">An open-source UI component library.</Text>
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Vertical Label
 * -------------------------------------------------------------------------- */

export const VerticalLabel: Story = {
  args: {
    orientation: 'vertical',
    align: 'center',
  },

  render: (args) => (
    <Box className="inline-grid grid-flow-col space-x-4">
      <Box className="flex size-20 items-center justify-center border border-dashed">Blog</Box>
      <Separator orientation="vertical" {...args}>
        <SeparatorItem>or</SeparatorItem>
      </Separator>
      <Box className="flex size-20 items-center justify-center border border-dashed">Docs</Box>
    </Box>
  ),
};
