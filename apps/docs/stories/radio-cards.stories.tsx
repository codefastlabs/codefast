import { RadioCards, RadioCardsItem } from '@codefast/ui/radio-cards';
import { Box } from '@codefast/ui/box';
import { Text } from '@codefast/ui/text';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: RadioCards,
  tags: ['autodocs'],
  title: 'UIs/Radio Cards',
} satisfies Meta<typeof RadioCards>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Box>
      <RadioCards defaultValue="1" className="grid-cols-1 sm:grid-cols-3" {...args}>
        <RadioCardsItem value="1">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">8-core CPU</Text>
            <Text>32GB RAM</Text>
          </Box>
        </RadioCardsItem>
        <RadioCardsItem value="2">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">6-core CPU</Text>
            <Text>24GB RAM</Text>
          </Box>
        </RadioCardsItem>
        <RadioCardsItem value="3">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">4-core CPU</Text>
            <Text>16GB RAM</Text>
          </Box>
        </RadioCardsItem>
      </RadioCards>
    </Box>
  ),
};
