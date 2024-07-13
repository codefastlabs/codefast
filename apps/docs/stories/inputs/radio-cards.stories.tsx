import { RadioCards, RadioCardsItem } from '@codefast/ui/radio-cards';
import { Box } from '@codefast/ui/box';
import { Text } from '@codefast/ui/text';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: RadioCards,
  tags: ['autodocs'],
  title: 'Components/Inputs/Radio Cards',
} satisfies Meta<typeof RadioCards>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Box>
      <RadioCards className="grid-cols-1 sm:grid-cols-3" defaultValue="1" {...args}>
        <RadioCardsItem className="hover:bg-accent hover:text-accent-foreground" value="1">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">8-core CPU</Text>
            <Text>32GB RAM</Text>
          </Box>
        </RadioCardsItem>
        <RadioCardsItem className="hover:bg-accent hover:text-accent-foreground" value="2">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">6-core CPU</Text>
            <Text>24GB RAM</Text>
          </Box>
        </RadioCardsItem>
        <RadioCardsItem className="hover:bg-accent hover:text-accent-foreground" value="3">
          <Box className="flex w-full flex-col items-start">
            <Text className="font-bold">4-core CPU</Text>
            <Text>16GB RAM</Text>
          </Box>
        </RadioCardsItem>
      </RadioCards>
    </Box>
  ),
};
