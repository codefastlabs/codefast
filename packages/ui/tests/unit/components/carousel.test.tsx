import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious } from "#components/carousel";
import { DirectionProvider } from "#components/direction";

// Embla needs real layout, so stub it: the api is controllable and we capture
// the options it was constructed with to assert direction is forwarded.
const mocks = vi.hoisted(() => {
  const scrollNext = vi.fn();
  const scrollPrev = vi.fn();
  const bounds = { next: true, previous: true };

  return {
    bounds,
    scrollNext,
    scrollPrev,
    options: vi.fn(),
    api: {
      scrollNext,
      scrollPrev,
      canScrollNext: () => bounds.next,
      canScrollPrev: () => bounds.previous,
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
    mocks.bounds.next = true;
    mocks.bounds.previous = true;
  });

  describe("scroll bounds", () => {
    test("re-reads them when embla emits select", () => {
      mocks.bounds.previous = false;

      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>1</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>,
      );

      const previousButton = screen.getByRole("button", { name: "Previous slide" });

      expect(previousButton).toBeDisabled();

      mocks.bounds.previous = true;
      act(() => {
        for (const [event, listener] of mocks.api.on.mock.calls) {
          if (event === "select") {
            listener();
          }
        }
      });

      expect(previousButton).toBeEnabled();
    });

    test("removes every embla listener it adds on unmount", () => {
      const { unmount } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>1</CarouselItem>
          </CarouselContent>
        </Carousel>,
      );

      expect(mocks.api.on).toHaveBeenCalledWith("reInit", expect.any(Function));
      expect(mocks.api.on).toHaveBeenCalledWith("select", expect.any(Function));

      unmount();

      expect(mocks.api.off).toHaveBeenCalledTimes(mocks.api.on.mock.calls.length);
      for (const [event, listener] of mocks.api.on.mock.calls) {
        expect(mocks.api.off).toHaveBeenCalledWith(event, listener);
      }
    });
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
