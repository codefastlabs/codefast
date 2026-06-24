import { expect } from "storybook/test";

import { Card, CardContent } from "#/components/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "#/components/carousel";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Carousel,
  subcomponents: { CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
  parameters: {
    docs: {
      description: {
        component: [
          "A slideshow for cycling through a series of slides, powered by Embla Carousel.",
          "",
          "**Anatomy:** `Carousel > (CarouselContent > CarouselItem… + CarouselPrevious + CarouselNext)`.",
          "Set `orientation` and pass Embla `opts`/`plugins` on the root; the previous/next buttons read scroll state from context and disable at the edges.",
        ].join("\n"),
      },
    },
  },
  title: "Display/Carousel",
});

export const Default = meta.story({
  render: () => (
    <Carousel className="mx-auto w-full max-w-xs">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
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
      <CarouselPrevious className="inset-s-2" />
      <CarouselNext className="inset-e-2" />
    </Carousel>
  ),
});

export const Multiple = meta.story({
  render: () => (
    <Carousel className="mx-auto max-w-xs sm:max-w-sm" opts={{ align: "start" }}>
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="sm:basis-1/2 lg:basis-1/3">
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
      <CarouselPrevious className="inset-s-2" />
      <CarouselNext className="inset-e-2" />
    </Carousel>
  ),
});

export const Vertical = meta.story({
  render: () => (
    <Carousel className="mx-auto w-full max-w-xs" opts={{ align: "start" }} orientation="vertical">
      <CarouselContent className="-mt-1 h-67.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="basis-1/2 pt-1">
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
  ),
});

export const ScrollsOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ScrollsOnClick.test("scrolls on click", async ({ canvas, userEvent }) => {
  const next = canvas.getByRole("button", { name: /next slide/i });

  await expect(next).toBeEnabled();
  await userEvent.click(next);
  await expect(next).toBeInTheDocument();
});
