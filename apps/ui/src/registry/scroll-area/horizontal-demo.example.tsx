import { ScrollArea, ScrollAreaScrollbar } from "@codefast/ui/scroll-area";

export interface Artwork {
  artist: string;
}

export const works: Array<Artwork> = [
  { artist: "Ornella Binni" },
  { artist: "Tom Byrom" },
  { artist: "Vladimir Malyavko" },
];

export function ScrollAreaHorizontalDemo() {
  return (
    <ScrollArea className="w-96 rounded-md border border-ui-border whitespace-nowrap">
      <div className="flex w-max space-x-4 p-4">
        {works.map((artwork) => (
          <figure key={artwork.artist} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <div
                aria-label={`Photo by ${artwork.artist}`}
                className="aspect-[3/4] w-[150px] bg-ui-surface"
                role="img"
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
