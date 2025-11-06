"use client";

import type { UseEmblaCarouselType } from "embla-carousel-react";
import type { ComponentProps, JSX, KeyboardEvent } from "react";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { Scope } from "@radix-ui/react-context";

import { Button } from "@/components/button/button";
import { cn } from "@codefast/tailwind-variants";
import { createContextScope } from "@radix-ui/react-context";

/* -----------------------------------------------------------------------------
 * Context: Carousel
 * -------------------------------------------------------------------------- */

const CAROUSEL_NAME = "Carousel";

type ScopedProps<P> = P & { __scopeCarousel?: Scope };

const [createCarouselContext, createCarouselScope] = createContextScope(CAROUSEL_NAME);

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

const [CarouselContextProvider, useCarouselContext] =
  createCarouselContext<CarouselContextValue>(CAROUSEL_NAME);

/* -----------------------------------------------------------------------------
 * Component: Carousel
 * -------------------------------------------------------------------------- */

interface CarouselProps extends BaseCarouselProps, ComponentProps<"div"> {}

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
  const [carouselRef, api] = useEmblaCarousel(
    {
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
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrevious, scrollNext],
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
        className={cn("relative", className)}
        data-slot="carousel"
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

interface CarouselContentProps extends ComponentProps<"div"> {
  classNames?: {
    content?: string;
    wrapper?: string;
  };
}

function CarouselContent({
  __scopeCarousel,
  className,
  classNames,
  ...props
}: ScopedProps<CarouselContentProps>): JSX.Element {
  const { carouselRef, orientation } = useCarouselContext(CAROUSEL_CONTENT_NAME, __scopeCarousel);

  return (
    <div
      ref={carouselRef}
      className={cn("overflow-hidden", classNames?.wrapper)}
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
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

type CarouselItemProps = ComponentProps<"div">;

function CarouselItem({
  __scopeCarousel,
  className,
  ...props
}: ScopedProps<CarouselItemProps>): JSX.Element {
  const { orientation } = useCarouselContext(CAROUSEL_ITEM_NAME, __scopeCarousel);

  return (
    <div
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
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

type CarouselPreviousProps = ComponentProps<typeof Button>;

function CarouselPrevious({
  __scopeCarousel,
  className,
  size = "icon",
  variant = "outline",
  ...props
}: ScopedProps<CarouselPreviousProps>): JSX.Element {
  const { canScrollPrev, orientation, scrollPrev } = useCarouselContext(
    CAROUSEL_PREVIOUS_NAME,
    __scopeCarousel,
  );

  return (
    <Button
      aria-label="Previous slide"
      className={cn(
        "absolute size-8 shadow-none",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      data-slot="carousel-previous"
      disabled={!canScrollPrev}
      prefix={<ArrowLeftIcon />}
      size={size}
      variant={variant}
      onClick={scrollPrev}
      {...props}
    >
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CarouselNext
 * -------------------------------------------------------------------------- */

const CAROUSEL_NEXT_NAME = "CarouselNext";

type CarouselNextProps = ComponentProps<typeof Button>;

function CarouselNext({
  __scopeCarousel,
  className,
  size = "icon",
  variant = "outline",
  ...props
}: ScopedProps<CarouselNextProps>): JSX.Element {
  const { canScrollNext, orientation, scrollNext } = useCarouselContext(
    CAROUSEL_NEXT_NAME,
    __scopeCarousel,
  );

  return (
    <Button
      aria-label="Next slide"
      className={cn(
        "absolute size-8 shadow-none",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      data-slot="carousel-next"
      disabled={!canScrollNext}
      prefix={<ArrowRightIcon />}
      size={size}
      variant={variant}
      onClick={scrollNext}
      {...props}
    >
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
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  createCarouselScope,
};
