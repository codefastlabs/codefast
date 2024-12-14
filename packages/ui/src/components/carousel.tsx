'use client';

import { type Scope, createContextScope } from '@radix-ui/react-context';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { type HTMLAttributes, type KeyboardEvent, forwardRef, useCallback, useEffect, useState } from 'react';

import { type ButtonProps, Button } from '@/components/button';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Carousel
 * -------------------------------------------------------------------------- */

const CAROUSEL_NAME = 'Carousel';

type ScopedProps<P> = P & { __scopeCarousel?: Scope };

const [createCarouselContext, createCarouselScope] = createContextScope(CAROUSEL_NAME);

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

interface BaseCarouselProps {
  opts?: CarouselOptions;
  orientation?: 'horizontal' | 'vertical';
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

const [CarouselProvider, useCarouselContext] = createCarouselContext<CarouselContextValue>(CAROUSEL_NAME);

type CarouselElement = HTMLDivElement;
type CarouselProps = BaseCarouselProps & HTMLAttributes<HTMLDivElement>;

const Carousel = forwardRef<CarouselElement, CarouselProps>(
  (
    { __scopeCarousel, children, className, opts, orientation, plugins, setApi, ...props }: ScopedProps<CarouselProps>,
    forwardedRef,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === 'vertical' ? 'y' : 'x',
      },
      plugins,
    );

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const onSelect = useCallback((carouselApi: CarouselApi) => {
      if (!carouselApi) {
        return;
      }

      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    }, []);

    const scrollPrev = useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
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

      onSelect(api);
      api.on('reInit', onSelect);
      api.on('select', onSelect);

      return () => {
        api.off('select', onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselProvider
        api={api}
        canScrollNext={canScrollNext}
        canScrollPrev={canScrollPrev}
        carouselRef={carouselRef}
        opts={opts}
        orientation={orientation ?? (opts?.axis === 'y' ? 'vertical' : 'horizontal')}
        scope={__scopeCarousel}
        scrollNext={scrollNext}
        scrollPrev={scrollPrev}
      >
        <div
          ref={forwardedRef}
          aria-roledescription="carousel"
          className={cn('relative', className)}
          role="region"
          onKeyDownCapture={handleKeyDown}
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
interface CarouselContentProps extends HTMLAttributes<HTMLDivElement> {
  classNames?: {
    content?: string;
    wrapper?: string;
  };
}

const CarouselContent = forwardRef<CarouselContentElement, CarouselContentProps>(
  ({ __scopeCarousel, className, classNames, ...props }: ScopedProps<CarouselContentProps>, forwardedRef) => {
    const { carouselRef, orientation } = useCarouselContext(CAROUSEL_CONTENT_NAME, __scopeCarousel);

    return (
      <div ref={carouselRef} className={cn('overflow-hidden', classNames?.wrapper)}>
        <div
          ref={forwardedRef}
          className={cn(
            'flex',
            orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
            classNames?.content,
            className,
          )}
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
type CarouselItemProps = HTMLAttributes<HTMLDivElement>;

const CarouselItem = forwardRef<CarouselItemElement, CarouselItemProps>(
  ({ __scopeCarousel, className, ...props }: ScopedProps<CarouselItemProps>, forwardedRef) => {
    const { orientation } = useCarouselContext(CAROUSEL_ITEM_NAME, __scopeCarousel);

    return (
      <div
        ref={forwardedRef}
        aria-roledescription="slide"
        className={cn('min-w-0 shrink-0 grow-0 basis-full', orientation === 'horizontal' ? 'pl-4' : 'pt-4', className)}
        role="group"
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

const CarouselPrevious = forwardRef<CarouselPreviousElement, CarouselPreviousProps>(
  (
    {
      __scopeCarousel,
      className,
      icon = true,
      size = 'sm',
      variant = 'outline',
      ...props
    }: ScopedProps<CarouselPreviousProps>,
    forwardedRef,
  ) => {
    const { canScrollPrev, orientation, scrollPrev } = useCarouselContext(CAROUSEL_PREVIOUS_NAME, __scopeCarousel);

    return (
      <Button
        ref={forwardedRef}
        className={cn(
          'absolute',
          orientation === 'horizontal'
            ? '-left-12 top-1/2 -translate-y-1/2'
            : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollPrev}
        icon={icon}
        prefix={<ArrowLeftIcon />}
        size={size}
        variant={variant}
        onClick={scrollPrev}
        {...props}
      >
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

const CarouselNext = forwardRef<CarouselNextElement, CarouselNextProps>(
  (
    {
      __scopeCarousel,
      className,
      icon = true,
      size = 'sm',
      variant = 'outline',
      ...props
    }: ScopedProps<CarouselNextProps>,
    forwardedRef,
  ) => {
    const { canScrollNext, orientation, scrollNext } = useCarouselContext(CAROUSEL_NEXT_NAME, __scopeCarousel);

    return (
      <Button
        ref={forwardedRef}
        className={cn(
          'absolute',
          orientation === 'horizontal'
            ? '-right-12 top-1/2 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollNext}
        icon={icon}
        prefix={<ArrowRightIcon />}
        size={size}
        variant={variant}
        onClick={scrollNext}
        {...props}
      >
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  createCarouselScope,
  type CarouselApi,
  type CarouselContentProps,
  type CarouselItemProps,
  type CarouselNextProps,
  type CarouselPreviousProps,
  type CarouselProps,
};
