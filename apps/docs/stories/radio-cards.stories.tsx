import { RadioCards, RadioCardsItem, Text } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: RadioCards,
  tags: ['autodocs'],
  title: 'UI/Radio Cards',
} satisfies Meta<typeof RadioCards>;

export default meta;

type Story = StoryObj<typeof RadioCards>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <div>
      <RadioCards className="grid-cols-1 sm:grid-cols-3" defaultValue="1" {...args}>
        <RadioCardsItem className="hover:bg-accent hover:text-accent-foreground" value="1">
          <div className="flex w-full flex-col items-start">
            <Text className="font-bold">8-core CPU</Text>
            <Text>32GB RAM</Text>
          </div>
        </RadioCardsItem>
        <RadioCardsItem className="hover:bg-accent hover:text-accent-foreground" value="2">
          <div className="flex w-full flex-col items-start">
            <Text className="font-bold">6-core CPU</Text>
            <Text>24GB RAM</Text>
          </div>
        </RadioCardsItem>
        <RadioCardsItem className="hover:bg-accent hover:text-accent-foreground" value="3">
          <div className="flex w-full flex-col items-start">
            <Text className="font-bold">4-core CPU</Text>
            <Text>16GB RAM</Text>
          </div>
        </RadioCardsItem>
      </RadioCards>
    </div>
  ),
};
