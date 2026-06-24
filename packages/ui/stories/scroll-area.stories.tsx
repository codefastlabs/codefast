import { ScrollArea, ScrollAreaScrollbar } from "#/components/scroll-area";

import preview from "../.storybook/preview";

/**
 * ScrollArea is a composition with optional root props. Demoed via `render`
 * while keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = preview.meta({
  args: { size: "md" },
  component: ScrollArea,
  subcomponents: { ScrollAreaScrollbar },
  parameters: {
    docs: {
      description: {
        component: [
          "Augments native scrolling with a custom, cross-browser-consistent scrollbar.",
          "",
          "**Anatomy:** `ScrollArea > content`; horizontal and vertical `ScrollAreaScrollbar`s are rendered for you.",
          "Constrain the `ScrollArea` with a fixed height/width so content overflows; pick a track `size` (`default` · `sm`).",
        ].join("\n"),
      },
    },
  },
  title: "Layout/ScrollArea",
});

const RELEASES = [
  {
    version: "v2.5.0",
    date: "Jun 2",
    notes: "New Resizable component and dark-mode polish.",
  },
  {
    version: "v2.4.1",
    date: "May 24",
    notes: "Fixed focus ring contrast on outline buttons.",
  },
  {
    version: "v2.4.0",
    date: "May 18",
    notes: "Added Input OTP and Field validation helpers.",
  },
  {
    version: "v2.3.0",
    date: "May 9",
    notes: "Carousel now supports vertical orientation.",
  },
  {
    version: "v2.2.0",
    date: "Apr 30",
    notes: "Introduced Sonner toasts and Progress Circle.",
  },
  {
    version: "v2.1.0",
    date: "Apr 21",
    notes: "Reworked Sidebar with collapsible groups.",
  },
];

const WORKS = [
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

export const Default = meta.story({
  render: (args) => (
    <ScrollArea {...args} className="h-56 w-64 rounded-xl border border-border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Changelog</h4>
        <ol className="space-y-3">
          {RELEASES.map(({ version, date, notes }) => (
            <li key={version} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-foreground">{version}</span>
                <span className="text-xs text-muted-foreground">{date}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{notes}</p>
            </li>
          ))}
        </ol>
      </div>
    </ScrollArea>
  ),
});

export const Horizontal = meta.story({
  render: () => (
    <ScrollArea className="w-96 rounded-md border whitespace-nowrap">
      <div className="flex w-max space-x-4 p-4">
        {WORKS.map((artwork) => (
          <figure key={artwork.artist} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <img
                src={artwork.art}
                alt={artwork.artist}
                className="aspect-[3/4] h-fit w-fit object-cover"
                width={300}
                height={400}
              />
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              Photo by <span className="font-semibold text-foreground">{artwork.artist}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ScrollAreaScrollbar orientation="horizontal" />
    </ScrollArea>
  ),
});
