import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from '@codefast/ui/scroll-area';
import { Separator } from '@codefast/ui/separator';
import Image from 'next/image';
import { Heading } from '@codefast/ui/heading';
import { Box } from '@codefast/ui/box';

const meta = {
  component: ScrollArea,
  tags: ['autodocs'],
  title: 'UIs/Scroll Area',
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`,
);

export const Default: Story = {
  render: (args) => (
    <ScrollArea className="h-72 w-48 rounded-md border" {...args}>
      <Box className="p-4">
        <Heading as="h4" className="mb-4 text-sm font-medium leading-none">
          Tags
        </Heading>
        {tags.map((tag) => (
          <>
            <Box key={tag} className="text-sm">
              {tag}
            </Box>
            <Separator className="my-2" />
          </>
        ))}
      </Box>
    </ScrollArea>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Horizontal Scrolling
 * -------------------------------------------------------------------------- */

interface Artwork {
  artist: string;
  art: string;
}

const works: Artwork[] = [
  {
    artist: 'Ornella Binni',
    art: 'https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80',
  },
  {
    artist: 'Tom Byrom',
    art: 'https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80',
  },
  {
    artist: 'Vladimir Malyavko',
    art: 'https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80',
  },
];

export const HorizontalScrolling: Story = {
  render: (args) => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border" {...args}>
      <Box className="flex w-max space-x-4 p-4">
        {works.map((artwork) => (
          <figure key={artwork.artist} className="shrink-0">
            <Box className="overflow-hidden rounded-md">
              <Image
                src={artwork.art}
                alt={`Photo by ${artwork.artist}`}
                className="aspect-[3/4] h-fit w-fit object-cover"
                width={300}
                height={400}
              />
            </Box>
            <figcaption className="text-muted-foreground pt-2 text-xs">
              Photo by{' '}
              <Box as="span" className="text-foreground font-semibold">
                {artwork.artist}
              </Box>
            </figcaption>
          </figure>
        ))}
      </Box>
    </ScrollArea>
  ),
};
