import { Card, CardContent } from "@codefast/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@codefast/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import * as React from "react";

export function CarouselPlugin() {
  // Lazy state init keeps one Autoplay instance stable across renders without reading a ref during render.
  const [plugin] = React.useState(() => Autoplay({ delay: 2000, stopOnInteraction: true }));

  return (
    <Carousel
      plugins={[plugin]}
      className="w-full max-w-40 sm:max-w-xs"
      onMouseEnter={plugin.stop}
      onMouseLeave={plugin.reset}
    >
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
