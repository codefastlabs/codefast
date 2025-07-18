import Image from "next/image";
import { Fragment } from "react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { ScrollArea, Separator } from "@codefast/ui";

export function ScrollAreaDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div className="">
        <ScrollAreaVertical />
      </div>
      <div className="@7xl:col-span-2">
        <ScrollAreaHorizontalDemo />
      </div>
    </GridWrapper>
  );
}

const tags = Array.from({ length: 50 }).map(
  (_, index, a) => `v1.2.0-beta.${String(a.length - index)}`,
);

function ScrollAreaVertical(): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <ScrollArea className="h-72 w-48 rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
          {tags.map((tag) => (
            <Fragment key={tag}>
              <div className="text-sm">{tag}</div>
              <Separator className="my-2" />
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export const works = [
  {
    art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb",
    artist: "Ornella Binni",
  },
  {
    art: "https://images.unsplash.com/photo-1548516173-3cabfa4607e9",
    artist: "Tom Byrom",
  },
  {
    art: "https://images.unsplash.com/photo-1494337480532-3725c85fd2ab",
    artist: "Vladimir Malyav",
  },
] as const;

function ScrollAreaHorizontalDemo(): JSX.Element {
  return (
    <ScrollArea className="w-full max-w-96 rounded-md border p-4">
      <div className="flex gap-4">
        {works.map((artwork) => (
          <figure key={artwork.artist} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <Image
                alt={`Photo by ${artwork.artist}`}
                className="aspect-[3/4] h-fit w-fit object-cover"
                height={400}
                src={artwork.art}
                width={300}
              />
            </div>
            <figcaption className="text-muted-foreground pt-2 text-xs">
              Photo by <span className="text-foreground font-semibold">{artwork.artist}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  );
}
