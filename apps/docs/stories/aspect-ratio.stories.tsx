import { type Meta, type StoryObj } from '@storybook/react';
import { AspectRatio } from '@codefast/ui/aspect-ratio';
import Image from 'next/image';
import { Box } from '@codefast/ui/box';

const meta = {
  component: AspectRatio,
  tags: ['autodocs'],
  title: 'UIs/Aspect Ratio',
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Box className="w-[450px]">
      <AspectRatio ratio={16 / 9} className="bg-muted" {...args}>
        <Image
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          fill
          className="rounded-md object-cover"
        />
      </AspectRatio>
    </Box>
  ),
};
