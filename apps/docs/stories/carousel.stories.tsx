import { Card, CardContent } from '@codefast/ui/card';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@codefast/ui/carousel';
import { useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Box } from '@codefast/ui/box';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Carousel,
  tags: ['autodocs'],
  title: 'UIs/Carousel',
  decorators: [
    (Story) => (
      <Box className="p-10">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Carousel className="w-full max-w-xs" {...args}>
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- okay for static content
          <CarouselItem key={index}>
            <Box className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <Box as="span" className="text-4xl font-semibold">
                    {index + 1}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <Carousel
      opts={{
        align: 'start',
      }}
      className="w-full max-w-sm"
      {...args}
    >
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- okay for static content
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <Box className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <Box as="span" className="text-3xl font-semibold">
                    {index + 1}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Spacing
 * -------------------------------------------------------------------------- */

export const Spacing: Story = {
  render: (args) => (
    <Carousel className="w-full max-w-sm" {...args}>
      <CarouselContent className="-ml-1">
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- okay for static content
          <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
            <Box className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <Box as="span" className="text-2xl font-semibold">
                    {index + 1}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Orientation
 * -------------------------------------------------------------------------- */

export const Orientation: Story = {
  render: (args) => (
    <Carousel
      opts={{
        align: 'start',
      }}
      orientation="vertical"
      className="w-full max-w-xs"
      {...args}
    >
      <CarouselContent className="-mt-1 h-[200px]">
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- okay for static content
          <CarouselItem key={index} className="pt-1 md:basis-1/2">
            <Box className="p-1">
              <Card>
                <CardContent className="flex items-center justify-center p-6">
                  <Box as="span" className="text-3xl font-semibold">
                    {index + 1}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: API
 * -------------------------------------------------------------------------- */

export const API: Story = {
  parameters: {
    layout: 'centered',
  },
  render: (args) => {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!api) {
        return;
      }

      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);

      api.on('select', () => {
        setCurrent(api.selectedScrollSnap() + 1);
      });
    }, [api]);

    return (
      <Box>
        <Carousel setApi={setApi} className="w-full max-w-xs" {...args}>
          <CarouselContent>
            {Array.from({ length: 5 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key -- okay for static content
              <CarouselItem key={index}>
                <Box className="p-1">
                  <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-6">
                      <Box as="span" className="text-4xl font-semibold">
                        {index + 1}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <Box className="text-muted-foreground py-2 text-center text-sm">
          Slide {current} of {count}
        </Box>
      </Box>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Plugins
 * -------------------------------------------------------------------------- */

export const Plugins: Story = {
  render: (args) => {
    const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

    return (
      <Carousel
        plugins={[plugin.current]}
        className="w-full max-w-xs"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        {...args}
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key -- okay for static content
            <CarouselItem key={index}>
              <Box className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <Box as="span" className="text-4xl font-semibold">
                      {index + 1}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  },
};
