import { Card, CardContent } from "@codefast/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@codefast/ui/carousel";

export function CarouselDemo() {
  return (
    <Carousel className="w-full max-w-[12rem] sm:max-w-xs">
      <CarouselContent>
        {Array.from({ length: 5 }, (_, index) => index + 1).map((slide) => (
          <CarouselItem key={slide}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold text-ui-fg">{slide}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Overlay the controls — the default -inset-s-12/-inset-e-12 placement needs
          48px of free space per side, which the showcase preview card lacks. */}
      <CarouselPrevious className="inset-s-2" />
      <CarouselNext className="inset-e-2" />
    </Carousel>
  );
}
