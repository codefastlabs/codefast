import { CheckboxCards, CheckboxCardsItem } from '@codefast/ui/checkbox-cards';
import { Box } from '@codefast/ui/box';
import { Text } from '@codefast/ui/text';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  component: CheckboxCards,
  tags: ['autodocs'],
  title: 'UIs/Checkbox Cards',
} satisfies Meta<typeof CheckboxCards>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Box>
      <CheckboxCards
        defaultValue={['1']}
        className="grid-cols-1 sm:grid-cols-3"
        {...args}
      >
        <CheckboxCardsItem value="1">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">8-core CPU</Text>
            <Text>32GB RAM</Text>
          </Box>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="2">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">6-core CPU</Text>
            <Text>24GB RAM</Text>
          </Box>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="3">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">4-core CPU</Text>
            <Text>16GB RAM</Text>
          </Box>
        </CheckboxCardsItem>
      </CheckboxCards>
    </Box>
  ),
};
