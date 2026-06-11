import { Card, CardContent } from "@codefast/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@codefast/ui/carousel";

export function CarouselMultiple() {
  return (
    <Carousel opts={{ align: "start" }} className="w-full max-w-xs">
      <CarouselContent classNames={{ wrapper: "-m-2 p-2" }}>
        {Array.from({ length: 8 }, (_, index) => (
          <CarouselItem key={index} className="basis-1/3">
            <Card>
              <CardContent className="flex aspect-square items-center justify-center p-4">
                <span className="text-xl font-semibold">{index + 1}</span>
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
