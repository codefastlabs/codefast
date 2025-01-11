import type { Meta, StoryObj } from '@storybook/react';

import { AspectRatio } from '@codefast/ui';
import Image from 'next/image';

const meta = {
  component: AspectRatio,
  tags: ['autodocs'],
  title: 'UI/Aspect Ratio',
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof AspectRatio>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <div className="w-[28.125rem]">
      <AspectRatio className="bg-muted" ratio={16 / 9} {...args}>
        <Image
          fill
          alt="Photo by Drew Beamer"
          className="rounded-md object-cover"
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
        />
      </AspectRatio>
    </div>
  ),
};
