import { expect, waitFor } from "storybook/test";

import { Card, CardContent } from "#/components/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "#/components/carousel";

import preview from "../.storybook/preview";

/**
 * Carousel — a COMPOSITE slideshow powered by Embla Carousel. The root `<Carousel>`
 * is a normal `<div>`-based region that owns a real `orientation` enum prop plus
 * Embla `opts`/`plugins`/`setApi`; the previous/next buttons read scroll state from
 * context and disable at the edges. Binding `component: Carousel` lets `{...args}`
 * drive `orientation` directly. Content here is authored for Storybook against the
 * component's own public API — NOT synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { orientation: "horizontal" },
  argTypes: {
    opts: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    plugins: { table: { disable: true } },
    setApi: { table: { disable: true } },
  },
  component: Carousel,
  parameters: {
    controls: { include: ["orientation"] },
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
  subcomponents: { CarouselContent, CarouselItem, CarouselNext, CarouselPrevious },
  title: "Display/Carousel",
});

export const Default = meta.story({
  render: (args) => {
    const vertical = args.orientation === "vertical";

    return (
      <Carousel {...args} className="mx-auto w-full max-w-xs" opts={{ align: "start" }}>
        <CarouselContent className={vertical ? "-mt-1 h-67.5" : undefined}>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className={vertical ? "basis-1/2 pt-1" : undefined}>
              <div className="p-1">
                <Card>
                  <CardContent
                    className={
                      vertical
                        ? "flex items-center justify-center p-6"
                        : "flex aspect-square items-center justify-center p-6"
                    }
                  >
                    <span className="text-3xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className={vertical ? undefined : "inset-s-2"} />
        <CarouselNext className={vertical ? undefined : "inset-e-2"} />
      </Carousel>
    );
  },
});

/** Same composition as `Default`, driven entirely by `orientation: "vertical"`. */
export const Vertical = meta.story({
  args: { orientation: "vertical" },
  render: Default.input.render,
});

/**
 * A genuinely different composition: each `CarouselItem` shrinks to fractional
 * width so multiple slides are visible at once. This is its own render because the
 * per-item `basis-*` sizing is not expressible via root `args`.
 */
export const Multiple = meta.story({
  render: (args) => (
    <Carousel {...args} className="mx-auto max-w-xs sm:max-w-sm" opts={{ align: "start" }}>
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

export const ScrollsOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ScrollsOnClick.test("clicking next enables the previous control", async ({ canvas, userEvent }) => {
  const next = canvas.getByRole("button", { name: /next slide/i });
  const previous = canvas.getByRole("button", { name: /previous slide/i });

  // At the start edge: Previous is disabled, Next is enabled.
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  // Advancing moves off the start edge, so Previous becomes enabled.
  await userEvent.click(next);
  await waitFor(async () => {
    await expect(previous).toBeEnabled();
  });
});
