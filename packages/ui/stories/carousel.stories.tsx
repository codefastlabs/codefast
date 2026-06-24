import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Card, CardContent } from "#/components/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "#/components/carousel";

const meta = {
  component: Carousel,
  title: "Display/Carousel",
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
};

export const Multiple: Story = {
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
};

export const Vertical: Story = {
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
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const ScrollsOnClick: Story = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole("button", { name: /next slide/i });

    await expect(next).toBeEnabled();
    await userEvent.click(next);
    await expect(next).toBeInTheDocument();
  },
};
