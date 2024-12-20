import type { Meta, StoryObj } from '@storybook/react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Text,
} from '@codefast/ui';
import { CalendarDays } from 'lucide-react';

const meta = {
  component: HoverCard,
  decorators: [
    (Story) => (
      <div className="pb-40">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Hover Card',
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<typeof HoverCard>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <HoverCard {...args} closeDelay={150} openDelay={150}>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <Text className="text-sm">The React Framework – created and maintained by @vercel.</Text>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 size-4 opacity-70" />{' '}
              <span className="text-muted-foreground text-xs">Joined December 2021</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
