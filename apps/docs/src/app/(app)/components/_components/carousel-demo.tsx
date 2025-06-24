import {
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@codefast/ui";
import type { JSX } from "react";

export function CarouselDemo(): JSX.Element {
  return (
    <div className="**:select-none flex w-full flex-col items-center gap-4 *:w-full *:max-w-md">
      <Carousel
        className="*:data-[slot=carousel-next]:hidden *:data-[slot=carousel-previous]:hidden *:data-[slot=carousel-next]:md:inline-flex *:data-[slot=carousel-previous]:md:inline-flex"
        opts={{ loop: true }}
      >
        <CarouselContent>
          {Array.from({ length: 10 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: keep
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
      <Carousel
        className="*:data-[slot=carousel-next]:hidden *:data-[slot=carousel-previous]:hidden *:data-[slot=carousel-next]:md:inline-flex *:data-[slot=carousel-previous]:md:inline-flex"
        opts={{ loop: true }}
      >
        <CarouselContent className="-ml-1">
          {Array.from({ length: 10 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: keep
            <CarouselItem className="basis-1/2 pl-1" key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-2xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <Carousel
        className="*:data-[slot=carousel-next]:hidden *:data-[slot=carousel-previous]:hidden *:data-[slot=carousel-next]:md:inline-flex *:data-[slot=carousel-previous]:md:inline-flex"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {Array.from({ length: 10 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: keep
            <CarouselItem className="basis-1/3" key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
