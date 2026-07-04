import { ScrollArea, ScrollAreaScrollbar } from "@codefast/ui/scroll-area";
import { Image } from "@unpic/react";

export interface Artwork {
  artist: string;
  art: string;
}

export const works: Array<Artwork> = [
  {
    artist: "Ornella Binni",
    art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Tom Byrom",
    art: "https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Vladimir Malyavko",
    art: "https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80",
  },
];

export function ScrollAreaHorizontalDemo() {
  return (
    <ScrollArea className="w-96 rounded-md border border-ui-border whitespace-nowrap">
      <div className="flex w-max space-x-4 p-4">
        {works.map((artwork) => (
          <figure key={artwork.artist} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <Image
                alt={`Photo by ${artwork.artist}`}
                className="aspect-[3/4] w-[150px] object-cover"
                height={400}
                layout="constrained"
                src={artwork.art}
                width={300}
              />
            </div>
            <figcaption className="pt-2 text-xs text-ui-muted">
              Photo by <span className="font-semibold text-ui-fg">{artwork.artist}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ScrollAreaScrollbar orientation="horizontal" />
    </ScrollArea>
  );
}
