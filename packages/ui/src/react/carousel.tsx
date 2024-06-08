'use client';

import * as React from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { createContextScope } from '@radix-ui/react-context';
import { cn } from '../lib/utils';
import { Button } from './button';
import type { ButtonProps } from './button';
import type { Scope } from '@radix-ui/react-context';

/* -----------------------------------------------------------------------------
 * Context: Carousel
 * -------------------------------------------------------------------------- */

const CAROUSEL_NAME = 'Carousel';

type ScopedProps<P> = P & { __scopeCarousel?: Scope };

const [createCarouselContext] = createContextScope(CAROUSEL_NAME);

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

interface BaseCarouselProps {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
}

type CarouselContextValue = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & BaseCarouselProps;

const [CarouselProvider, useCarouselContext] = createCarouselContext<CarouselContextValue>(CAROUSEL_NAME);

/* -----------------------------------------------------------------------------
 * Component: Carousel
 * -------------------------------------------------------------------------- */

type CarouselElement = HTMLDivElement;
type CarouselProps = React.HTMLAttributes<HTMLDivElement> & BaseCarouselProps;

const Carousel = React.forwardRef<CarouselElement, CarouselProps>(
  (
    { __scopeCarousel, children, orientation, opts, setApi, plugins, className, ...props }: ScopedProps<CarouselProps>,
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === 'vertical' ? 'y' : 'x',
      },
      plugins,
    );

    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((carouselApi: CarouselApi) => {
      if (!carouselApi) {
        return;
      }

      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on('reInit', onSelect);
      api.on('select', onSelect);

      return () => {
        api.off('select', onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselProvider
        scope={__scopeCarousel}
        carouselRef={carouselRef}
        api={api}
        opts={opts}
        orientation={orientation ?? (opts?.axis === 'y' ? 'vertical' : 'horizontal')}
        scrollPrev={scrollPrev}
        scrollNext={scrollNext}
        canScrollPrev={canScrollPrev}
        canScrollNext={canScrollNext}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn('relative', className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselProvider>
    );
  },
);

Carousel.displayName = CAROUSEL_NAME;

/* -----------------------------------------------------------------------------
 * Component: CarouselContent
 * -------------------------------------------------------------------------- */

const CAROUSEL_CONTENT_NAME = 'CarouselContent';

type CarouselContentElement = HTMLDivElement;
type CarouselContentProps = React.HTMLAttributes<HTMLDivElement>;

const CarouselContent = React.forwardRef<CarouselContentElement, CarouselContentProps>(
  ({ __scopeCarousel, className, ...props }: ScopedProps<CarouselContentProps>, ref) => {
    const { carouselRef, orientation } = useCarouselContext(CAROUSEL_CONTENT_NAME, __scopeCarousel);

    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn('flex', orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)}
          {...props}
        />
      </div>
    );
  },
);

CarouselContent.displayName = CAROUSEL_CONTENT_NAME;

/* -----------------------------------------------------------------------------
 * Component: CarouselItem
 * -------------------------------------------------------------------------- */

const CAROUSEL_ITEM_NAME = 'CarouselItem';

type CarouselItemElement = HTMLDivElement;
type CarouselItemProps = React.HTMLAttributes<HTMLDivElement>;

const CarouselItem = React.forwardRef<CarouselItemElement, CarouselItemProps>(
  ({ __scopeCarousel, className, ...props }: ScopedProps<CarouselItemProps>, ref) => {
    const { orientation } = useCarouselContext(CAROUSEL_ITEM_NAME, __scopeCarousel);

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn('min-w-0 shrink-0 grow-0 basis-full', orientation === 'horizontal' ? 'pl-4' : 'pt-4', className)}
        {...props}
      />
    );
  },
);

CarouselItem.displayName = CAROUSEL_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Component: CarouselPrevious
 * -------------------------------------------------------------------------- */

const CAROUSEL_PREVIOUS_NAME = 'CarouselPrevious';

type CarouselPreviousElement = HTMLButtonElement;
type CarouselPreviousProps = ButtonProps;

const CarouselPrevious = React.forwardRef<CarouselPreviousElement, CarouselPreviousProps>(
  (
    { __scopeCarousel, className, variant = 'outline', size = 'icon', ...props }: ScopedProps<CarouselPreviousProps>,
    ref,
  ) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarouselContext(CAROUSEL_PREVIOUS_NAME, __scopeCarousel);

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute size-8 rounded-full',
          orientation === 'horizontal'
            ? '-left-12 top-1/2 -translate-y-1/2'
            : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeftIcon className="size-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    );
  },
);

CarouselPrevious.displayName = CAROUSEL_PREVIOUS_NAME;

/* -----------------------------------------------------------------------------
 * Component: CarouselNext
 * -------------------------------------------------------------------------- */

const CAROUSEL_NEXT_NAME = 'CarouselNext';

type CarouselNextElement = HTMLButtonElement;
type CarouselNextProps = ButtonProps;

const CarouselNext = React.forwardRef<CarouselNextElement, CarouselNextProps>(
  (
    { __scopeCarousel, className, variant = 'outline', size = 'icon', ...props }: ScopedProps<CarouselNextProps>,
    ref,
  ) => {
    const { orientation, scrollNext, canScrollNext } = useCarouselContext(CAROUSEL_NEXT_NAME, __scopeCarousel);

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute size-8 rounded-full',
          orientation === 'horizontal'
            ? '-right-12 top-1/2 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRightIcon className="size-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  },
);

CarouselNext.displayName = CAROUSEL_NEXT_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselProps,
  type CarouselContentProps,
  type CarouselItemProps,
  type CarouselPreviousProps,
  type CarouselNextProps,
};
