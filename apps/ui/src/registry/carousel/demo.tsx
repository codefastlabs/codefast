import { Card, CardContent } from "@codefast/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@codefast/ui/carousel";
import { cn } from "@codefast/ui/lib/utils";

const STAYS = [
  {
    title: "Mountain Retreat",
    location: "Aspen, Colorado",
    price: "$220",
    gradient: "from-sky-400 to-indigo-500",
  },
  {
    title: "Coastal Villa",
    location: "Amalfi, Italy",
    price: "$340",
    gradient: "from-amber-400 to-rose-500",
  },
  {
    title: "Forest Cabin",
    location: "Banff, Canada",
    price: "$150",
    gradient: "from-emerald-400 to-teal-500",
  },
];

export function CarouselDemo() {
  return (
    <Carousel className="w-full max-w-xs">
      {/* Cross-axis padding lets each Card's ring show instead of being clipped
          by the viewport's required overflow-hidden. See CarouselContent docs. */}
      <CarouselContent classNames={{ wrapper: "-m-2 p-2" }}>
        {STAYS.map(({ title, location, price, gradient }) => (
          <CarouselItem key={title}>
            <Card className="gap-0 py-0">
              <CardContent className="p-0">
                <div className={cn("flex h-32 items-end bg-gradient-to-br p-3", gradient)}>
                  <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {price} / night
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-ui-fg">{title}</p>
                  <p className="text-xs text-ui-muted">{location}</p>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Overlay the controls on the slides — the default -inset-s-12/-inset-e-12
          placement needs 48px of free space on each side, which the showcase
          preview card doesn't have. */}
      <CarouselPrevious className="inset-s-2" />
      <CarouselNext className="inset-e-2" />
    </Carousel>
  );
}
