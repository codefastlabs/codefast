import { cn } from "@codefast/tailwind-variants";
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
    <div className={cn("w-full flex-col items-center gap-4 px-12", "@4xl:flex")}>
      <Carousel
        className={cn(
          "max-w-sm",
          "*:data-[slot=carousel-next]:hidden",
          "*:data-[slot=carousel-previous]:hidden",
          "*:data-[slot=carousel-next]:md:inline-flex",
          "*:data-[slot=carousel-previous]:md:inline-flex",
        )}
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent
                    className={cn("flex aspect-square items-center justify-center", "p-6")}
                  >
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
        className={cn(
          "max-w-sm",
          "*:data-[slot=carousel-next]:hidden",
          "*:data-[slot=carousel-previous]:hidden",
          "*:data-[slot=carousel-next]:md:inline-flex",
          "*:data-[slot=carousel-previous]:md:inline-flex",
        )}
        opts={{
          align: "start",
        }}
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className={cn("md:basis-1/2", "lg:basis-1/3")}>
              <div className="p-1">
                <Card>
                  <CardContent
                    className={cn("flex aspect-square items-center justify-center", "p-6")}
                  >
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
      <Carousel
        className={cn(
          "max-w-sm",
          "*:data-[slot=carousel-next]:hidden",
          "*:data-[slot=carousel-previous]:hidden",
          "*:data-[slot=carousel-next]:md:inline-flex",
          "*:data-[slot=carousel-previous]:md:inline-flex",
        )}
      >
        <CarouselContent className="-ml-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className={cn("pl-1", "md:basis-1/2")}>
              <div className="p-1">
                <Card>
                  <CardContent
                    className={cn("flex aspect-square items-center justify-center", "p-6")}
                  >
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
    </div>
  );
}
