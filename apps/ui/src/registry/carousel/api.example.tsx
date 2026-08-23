import { Card, CardContent } from "@codefast/ui/card";
import type { CarouselApi } from "@codefast/ui/carousel";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@codefast/ui/carousel";
import * as React from "react";

export function CarouselDApiDemo() {
  const [api, setApi] = React.useState<CarouselApi>();

  // Subscribe to the embla instance and read its state directly — the idiomatic way to
  // reflect an external mutable source in React, with no state-syncing effect.
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (!api) {
        return () => {};
      }

      api.on("reInit", onChange).on("select", onChange);

      return () => {
        api.off("reInit", onChange).off("select", onChange);
      };
    },
    [api],
  );

  const count = React.useSyncExternalStore(
    subscribe,
    () => (api ? api.scrollSnapList().length : 0),
    () => 0,
  );
  const current = React.useSyncExternalStore(
    subscribe,
    () => (api ? api.selectedScrollSnap() + 1 : 0),
    () => 0,
  );

  return (
    <div className="mx-auto max-w-40 sm:max-w-xs">
      <Carousel setApi={setApi} className="w-full max-w-xs">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <Card className="m-px">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="py-2 text-center text-sm text-muted-foreground">
        Slide {current} of {count}
      </div>
    </div>
  );
}
