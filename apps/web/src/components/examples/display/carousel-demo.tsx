import { Card, CardContent } from "@codefast/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@codefast/ui/carousel";

export function CarouselDemo() {
  return (
    <Carousel className="w-full max-w-xs">
      {/* Cross-axis padding lets each Card's ring show instead of being clipped
          by the viewport's required overflow-hidden. See CarouselContent docs. */}
      <CarouselContent classNames={{ wrapper: "-m-2 p-2" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <CarouselItem key={i}>
            <Card>
              <CardContent className="flex aspect-square items-center justify-center p-6">
                <span className="text-4xl font-semibold">{i + 1}</span>
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
