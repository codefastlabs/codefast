import { type Meta, type StoryObj } from "@storybook/react";
import { Card, CardContent } from "@codefast/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@codefast/ui/carousel";
import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";

const meta = {
  component: Carousel,
  tags: ["autodocs"],
  title: "UIs/Carousel",
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "w-full max-w-xs",
  },
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- okay for static content
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const Sizes: Story = {
  args: {
    opts: {
      align: "start",
    },
    className: "w-full max-w-sm",
  },
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- okay for static content
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-3xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const Spacing: Story = {
  args: {
    className: "w-full max-w-sm",
  },
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent className="-ml-1">
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- okay for static content
          <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-2xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const Orientation: Story = {
  args: {
    opts: {
      align: "start",
    },
    orientation: "vertical",
    className: "w-full max-w-xs",
  },
  render: (args) => (
    <div className="py-20">
      <Carousel {...args}>
        <CarouselContent className="-mt-1 h-[200px]">
          {Array.from({ length: 5 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key -- okay for static content
            <CarouselItem key={index} className="pt-1 md:basis-1/2">
              <div className="p-1">
                <Card>
                  <CardContent className="flex items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const API: Story = {
  args: {
    className: "w-full max-w-xs",
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

      api.on("select", () => {
        setCurrent(api.selectedScrollSnap() + 1);
      });
    }, [api]);

    return (
      <div>
        <Carousel setApi={setApi} {...args}>
          <CarouselContent>
            {Array.from({ length: 5 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key -- okay for static content
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-6">
                      <span className="text-4xl font-semibold">
                        {index + 1}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <div className="text-muted-foreground py-2 text-center text-sm">
          Slide {current} of {count}
        </div>
      </div>
    );
  },
};

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
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  },
};
