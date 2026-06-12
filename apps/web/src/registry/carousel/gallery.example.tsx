import { Card, CardContent } from "@codefast/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@codefast/ui/carousel";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

type CarouselApi = Parameters<NonNullable<ComponentProps<typeof Carousel>["setApi"]>>[0];

export function CarouselGallery() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    const onSelect = (): void => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="w-full max-w-xs space-y-3">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent classNames={{ wrapper: "-m-2 p-2" }}>
          {Array.from({ length: 5 }, (_, index) => (
            <CarouselItem key={index}>
              <Card>
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

      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              index === current ? "bg-ui-fg" : "bg-ui-border hover:bg-ui-muted",
            )}
          />
        ))}
      </div>
      <p className="text-center text-xs text-ui-muted tabular-nums">
        Slide {current + 1} of {count || 5}
      </p>
    </div>
  );
}
