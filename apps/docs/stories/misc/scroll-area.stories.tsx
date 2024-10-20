import { ScrollArea, Separator } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';
import Image from 'next/image';

const meta = {
  argTypes: {
    size: {
      control: 'inline-radio',
      description: 'The size of the scroll area.',
      type: {
        name: 'enum',
        value: ['none', 'sm', 'md', 'lg'],
      },
      table: {
        defaultValue: {
          summary: 'md',
        },
      },
    },
  },
  args: {
    size: 'md',
  },
  component: ScrollArea,
  tags: ['autodocs'],
  title: 'UI/Scroll Area',
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof ScrollArea>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`,
);
const tagCount = tags.length;

export const Default: Story = {
  render: (args) => (
    <ScrollArea className="h-72 w-48 rounded-md border" {...args}>
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag, index) => (
          <>
            <div key={tag} className="text-sm">
              {tag}
            </div>
            {index < tagCount - 1 && <Separator className="my-2" />}
          </>
        ))}
      </div>
    </ScrollArea>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Horizontal Scrolling
 * -------------------------------------------------------------------------- */

interface Artwork {
  art: string;
  artist: string;
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
      <div className="flex w-max gap-4 p-4">
        {works.map((artwork) => (
          <figure key={artwork.artist} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <Image
                alt={`Photo by ${artwork.artist}`}
                className="aspect-[3/4] h-fit w-fit object-cover"
                height={400}
                src={artwork.art}
                width={300}
              />
            </div>
            <figcaption className="text-muted-foreground pt-2 text-xs">
              Photo by{' '}
              <span className="text-foreground font-semibold">
                {artwork.artist}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  ),
};
