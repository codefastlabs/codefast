import { Card, CardContent } from "@codefast/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@codefast/ui/carousel";

export function CarouselVertical() {
  return (
    <Carousel orientation="vertical" opts={{ align: "start" }} className="w-full max-w-xs">
      <CarouselContent classNames={{ wrapper: "h-56 -m-2 p-2" }}>
        {Array.from({ length: 5 }, (_, index) => (
          <CarouselItem key={index} className="basis-1/2">
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <span className="text-2xl font-semibold">{index + 1}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
