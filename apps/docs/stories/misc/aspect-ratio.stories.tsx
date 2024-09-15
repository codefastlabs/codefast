import { AspectRatio } from '@codefast/ui/aspect-ratio';
import Image from 'next/image';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: AspectRatio,
  tags: ['autodocs'],
  title: 'Components/Misc/Aspect Ratio',
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <div className="w-[450px]">
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
