import type { UseEmblaCarouselType } from "embla-carousel-react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Context } from "radix-ui/internal";
import type { ComponentProps, JSX, KeyboardEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "#/components/button";
import { useDirection } from "#/components/direction";
import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Context: Carousel
 * -------------------------------------------------------------------------- */

const CAROUSEL_NAME = "Carousel";

type ScopedProps<P> = P & { __scopeCarousel?: Context.Scope };

const [createCarouselContext, createCarouselScope] = Context.createContextScope(CAROUSEL_NAME);

/**
 * @since 0.3.16-canary.0
 */
type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

interface BaseCarouselProps {
  opts?: CarouselOptions;
  orientation?: "horizontal" | "vertical";
  plugins?: CarouselPlugin;
  setApi?: (api: CarouselApi) => void;
}

type CarouselContextValue = BaseCarouselProps & {
  api: ReturnType<typeof useEmblaCarousel>[1];
  canScrollNext: boolean;
  canScrollPrev: boolean;
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  scrollNext: () => void;
  scrollPrev: () => void;
};

const [CarouselContextProvider, useCarouselContext] = createCarouselContext<CarouselContextValue>(CAROUSEL_NAME);

/* -----------------------------------------------------------------------------
 * Component: Carousel
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface CarouselProps extends BaseCarouselProps, ComponentProps<"div"> {}

/**
 * @since 0.3.16-canary.0
 */
function Carousel({
  __scopeCarousel,
  children,
  className,
  opts,
  orientation,
  plugins,
  setApi,
  ...props
}: ScopedProps<CarouselProps>): JSX.Element {
  const direction = useDirection();

  const [carouselRef, api] = useEmblaCarousel(
    {
      // Mirror Embla's drag/snap physics under RTL; explicit opts.direction wins.
      direction,
      ...opts,
      axis: orientation === "vertical" ? "y" : "x",
    },
    plugins,
  );

  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) {
      return;
    }

    setCanScrollPrevious(carouselApi.canScrollPrev());
    setCanScrollNext(carouselApi.canScrollNext());
  }, []);

  const scrollPrevious = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Arrow keys follow reading direction: in RTL the left key advances.
      const previousKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      const nextKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";

      if (event.key === previousKey) {
        event.preventDefault();
        scrollPrevious();
      } else if (event.key === nextKey) {
        event.preventDefault();
        scrollNext();
      }
    },
    [direction, scrollPrevious, scrollNext],
  );

  useEffect(() => {
    if (!api || !setApi) {
      return;
    }

    setApi(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) {
      return;
    }

    // Defer onSelect to avoid synchronous setState in effect
    queueMicrotask(() => {
      onSelect(api);
    });
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return (): void => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContextProvider
      api={api}
      canScrollNext={canScrollNext}
      canScrollPrev={canScrollPrevious}
      carouselRef={carouselRef}
      opts={opts}
      orientation={orientation ?? (opts?.axis === "y" ? "vertical" : "horizontal")}
      scope={__scopeCarousel}
      scrollNext={scrollNext}
      scrollPrev={scrollPrevious}
    >
      <div
        aria-roledescription="carousel"
        className={cn("relative", className)}
        data-slot="carousel"
        role="region"
        onKeyDownCapture={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    </CarouselContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CarouselContent
 * -------------------------------------------------------------------------- */

const CAROUSEL_CONTENT_NAME = "CarouselContent";

/**
 * @since 0.3.16-canary.0
 */
interface CarouselContentProps extends ComponentProps<"div"> {
  classNames?: {
    /** Class applied to the flex track that holds the slides. */
    content?: string;
    /** Class applied to the scroll viewport (the `overflow-hidden` element). */
    wrapper?: string;
  };
}

/**
 * The scroll viewport requires `overflow-hidden` (Embla hides off-screen slides
 * with it), so any ring/shadow on slide content that sits OUTSIDE the slide's
 * border-box is clipped where the slide meets the viewport edge. This is
 * inherent to every Embla-based carousel — the active slide is flush with both
 * scroll-axis edges, so left/right rings (horizontal) cannot show without
 * revealing the neighbouring slide.
 *
 * To give content shadows/rings breathing room on the CROSS axis (top/bottom
 * for horizontal carousels), add a negative-margin + matching padding via
 * `classNames.wrapper`, e.g. `classNames={{ wrapper: "-my-2 py-2" }}`. This
 * shifts no layout but lets the clip happen `n`px further out.
 *
 * @since 0.3.16-canary.0
 */
function CarouselContent({
  __scopeCarousel,
  className,
  classNames,
  ...props
}: ScopedProps<CarouselContentProps>): JSX.Element {
  const { carouselRef, orientation } = useCarouselContext(CAROUSEL_CONTENT_NAME, __scopeCarousel);

  return (
    <div ref={carouselRef} className={cn("overflow-hidden", classNames?.wrapper)} data-slot="carousel-content">
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ms-4" : "-mt-4 h-full flex-col",
          classNames?.content,
          className,
        )}
        {...props}
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CarouselItem
 * -------------------------------------------------------------------------- */

const CAROUSEL_ITEM_NAME = "CarouselItem";

/**
 * @since 0.3.16-canary.0
 */
type CarouselItemProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function CarouselItem({ __scopeCarousel, className, ...props }: ScopedProps<CarouselItemProps>): JSX.Element {
  const { orientation } = useCarouselContext(CAROUSEL_ITEM_NAME, __scopeCarousel);

  return (
    <div
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "ps-4" : "pt-4", className)}
      data-slot="carousel-item"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CarouselPrevious
 * -------------------------------------------------------------------------- */

const CAROUSEL_PREVIOUS_NAME = "CarouselPrevious";

/**
 * @since 0.3.16-canary.0
 */
type CarouselPreviousProps = ComponentProps<typeof Button>;

/**
 * @since 0.3.16-canary.0
 */
function CarouselPrevious({
  __scopeCarousel,
  className,
  size = "icon-sm",
  variant = "outline",
  ...props
}: ScopedProps<CarouselPreviousProps>): JSX.Element {
  const { canScrollPrev, orientation, scrollPrev } = useCarouselContext(CAROUSEL_PREVIOUS_NAME, __scopeCarousel);

  return (
    <Button
      aria-label="Previous slide"
      className={cn(
        "absolute touch-manipulation rounded-full",
        orientation === "horizontal"
          ? "-inset-s-12 top-1/2 -translate-y-1/2 active:not-aria-[haspopup]:translate-y-[calc(-50%+1px)]"
          : "inset-s-1/2 -top-12 -translate-x-1/2 rotate-90 rtl:translate-x-1/2",
        className,
      )}
      data-slot="carousel-previous"
      disabled={!canScrollPrev}
      size={size}
      variant={variant}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon className="rtl:rotate-180" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CarouselNext
 * -------------------------------------------------------------------------- */

const CAROUSEL_NEXT_NAME = "CarouselNext";

/**
 * @since 0.3.16-canary.0
 */
type CarouselNextProps = ComponentProps<typeof Button>;

/**
 * @since 0.3.16-canary.0
 */
function CarouselNext({
  __scopeCarousel,
  className,
  size = "icon-sm",
  variant = "outline",
  ...props
}: ScopedProps<CarouselNextProps>): JSX.Element {
  const { canScrollNext, orientation, scrollNext } = useCarouselContext(CAROUSEL_NEXT_NAME, __scopeCarousel);

  return (
    <Button
      aria-label="Next slide"
      className={cn(
        "absolute touch-manipulation rounded-full",
        orientation === "horizontal"
          ? "-inset-e-12 top-1/2 -translate-y-1/2 active:not-aria-[haspopup]:translate-y-[calc(-50%+1px)]"
          : "inset-s-1/2 -bottom-12 -translate-x-1/2 rotate-90 rtl:translate-x-1/2",
        className,
      )}
      data-slot="carousel-next"
      disabled={!canScrollNext}
      size={size}
      variant={variant}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRightIcon className="rtl:rotate-180" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  CarouselApi,
  CarouselContentProps,
  CarouselItemProps,
  CarouselNextProps,
  CarouselPreviousProps,
  CarouselProps,
};
export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, createCarouselScope };
