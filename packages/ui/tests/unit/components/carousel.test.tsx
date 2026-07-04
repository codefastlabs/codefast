import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Carousel, CarouselContent, CarouselItem } from "#/components/carousel";
import { DirectionProvider } from "#/components/direction";

// Embla needs real layout, so stub it: the api is controllable and we capture
// the options it was constructed with to assert direction is forwarded.
const mocks = vi.hoisted(() => {
  const scrollNext = vi.fn();
  const scrollPrev = vi.fn();

  return {
    scrollNext,
    scrollPrev,
    options: vi.fn(),
    api: {
      scrollNext,
      scrollPrev,
      canScrollNext: () => true,
      canScrollPrev: () => true,
      on: vi.fn(),
      off: vi.fn(),
    },
  };
});

vi.mock("embla-carousel-react", () => ({
  default: (options: unknown) => {
    mocks.options(options);

    return [vi.fn(), mocks.api];
  },
}));

function renderCarousel(dir: "ltr" | "rtl") {
  render(
    <DirectionProvider dir={dir}>
      <Carousel>
        <CarouselContent>
          <CarouselItem>1</CarouselItem>
          <CarouselItem>2</CarouselItem>
        </CarouselContent>
      </Carousel>
    </DirectionProvider>,
  );

  return screen.getByRole("region");
}

describe("carousel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("keyboard navigation", () => {
    test("advances with ArrowRight and retreats with ArrowLeft in LTR", () => {
      const region = renderCarousel("ltr");

      fireEvent.keyDown(region, { key: "ArrowRight" });
      expect(mocks.scrollNext).toHaveBeenCalledTimes(1);
      expect(mocks.scrollPrev).not.toHaveBeenCalled();

      fireEvent.keyDown(region, { key: "ArrowLeft" });
      expect(mocks.scrollPrev).toHaveBeenCalledTimes(1);
    });

    test("mirrors arrow keys in RTL so ArrowLeft advances", () => {
      const region = renderCarousel("rtl");

      fireEvent.keyDown(region, { key: "ArrowLeft" });
      expect(mocks.scrollNext).toHaveBeenCalledTimes(1);
      expect(mocks.scrollPrev).not.toHaveBeenCalled();

      fireEvent.keyDown(region, { key: "ArrowRight" });
      expect(mocks.scrollPrev).toHaveBeenCalledTimes(1);
    });
  });

  describe("embla options", () => {
    test("forwards the resolved reading direction to embla", () => {
      renderCarousel("rtl");

      expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({ direction: "rtl" }));
    });

    test("lets an explicit opts.direction override the context", () => {
      render(
        <DirectionProvider dir="rtl">
          <Carousel opts={{ direction: "ltr" }}>
            <CarouselContent>
              <CarouselItem>1</CarouselItem>
            </CarouselContent>
          </Carousel>
        </DirectionProvider>,
      );

      expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({ direction: "ltr" }));
    });
  });
});
