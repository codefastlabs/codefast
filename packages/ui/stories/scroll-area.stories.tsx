import { expect } from "storybook/test";

import { ScrollArea, ScrollAreaScrollbar } from "#/components/scroll-area";

import preview from "../.storybook/preview";

/**
 * ScrollArea — a composite whose root is a normal component (`ScrollAreaPrimitive.Root`
 * plus a custom `size` prop). The Root renders its own vertical + horizontal
 * `ScrollAreaScrollbar`s internally, so most usages just constrain the box and drop
 * content inside. The `size` enum drives scrollbar track thickness. Content here is
 * authored for Storybook and is NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { size: "md" },
  argTypes: {
    asChild: { table: { disable: true } },
    size: { control: "select", options: ["none", "sm", "md", "lg"] },
  },
  component: ScrollArea,
  parameters: {
    controls: { include: ["size"] },
    docs: {
      description: {
        component: [
          "Augments native scrolling with a custom, cross-browser-consistent scrollbar.",
          "",
          "**Anatomy:** `ScrollArea > content`; vertical and horizontal `ScrollAreaScrollbar`s are rendered for you.",
          "Constrain the `ScrollArea` with a fixed height/width so content overflows; pick a track `size` (`none` · `sm` · `md` · `lg`).",
        ].join("\n"),
      },
    },
  },
  subcomponents: { ScrollAreaScrollbar },
  title: "Layout/ScrollArea",
});

const RELEASES = [
  { version: "v2.5.0", date: "Jun 2", notes: "New Resizable component and dark-mode polish." },
  { version: "v2.4.1", date: "May 24", notes: "Fixed focus ring contrast on outline buttons." },
  { version: "v2.4.0", date: "May 18", notes: "Added Input OTP and Field validation helpers." },
  { version: "v2.3.0", date: "May 9", notes: "Carousel now supports vertical orientation." },
  { version: "v2.2.0", date: "Apr 30", notes: "Introduced Sonner toasts and Progress Circle." },
  { version: "v2.1.0", date: "Apr 21", notes: "Reworked Sidebar with collapsible groups." },
];

const WORKS = ["Ornella Binni", "Tom Byrom", "Vladimir Malyavko"];

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

/** Same composition as Default — only the `size` arg differs, so it reuses Default's render. */
export const SmallScrollbar = meta.story({
  args: { size: "sm" },
  render: Default.input.render,
});

/**
 * A genuinely different composition: horizontal overflow with an explicit
 * horizontal `ScrollAreaScrollbar`.
 */
export const Horizontal = meta.story({
  render: (args) => (
    <ScrollArea {...args} className="w-96 rounded-md border border-border whitespace-nowrap">
      <div className="flex w-max space-x-4 p-4">
        {WORKS.map((artist) => (
          <figure key={artist} className="shrink-0">
            <div className="flex h-48 w-36 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--muted),var(--accent))] text-2xl font-semibold text-muted-foreground">
              {artist
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              Photo by <span className="font-semibold text-foreground">{artist}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ScrollAreaScrollbar orientation="horizontal" />
    </ScrollArea>
  ),
});

Default.test("renders a scrollable viewport whose content overflows", async ({ canvas }) => {
  const viewport = canvas.getByText("Changelog").closest("[data-slot='scroll-area-viewport']");

  await expect(viewport).not.toBeNull();
  // Content (6 releases) overflows the fixed 14rem height → viewport is scrollable.
  await expect((viewport as HTMLElement).scrollHeight).toBeGreaterThan((viewport as HTMLElement).clientHeight);
});
