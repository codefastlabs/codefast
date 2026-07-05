import { CarouselDApiDemo } from "#/registry/carousel/api.example";
import { CarouselMultiple } from "#/registry/carousel/multiple.example";
import { CarouselOrientation } from "#/registry/carousel/orientation.example";
import { CarouselPlugin } from "#/registry/carousel/plugin.example";
import { CarouselRtl } from "#/registry/carousel/rtl.example";
import { CarouselSize } from "#/registry/carousel/size.example";
import { CarouselSpacing } from "#/registry/carousel/spacing.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const carouselDoc: ComponentDoc = {
  usage: docUsage("carousel"),
  examples: [
    {
      id: "multiple",
      title: "Multiple per view",
      description: "Show several items at once with basis utilities.",
      Demo: CarouselMultiple,
      source: docSource("carousel", "multiple"),
    },
    {
      id: "carousel-api",
      title: "API",
      description: "Use a state and the setApi prop to get an instance of the carousel API.",
      Demo: CarouselDApiDemo,
      source: docSource("carousel", "api"),
    },
    {
      id: "carousel-orientation",
      title: "Orientation",
      description: "Use the orientation prop to set the orientation of the carousel.",
      Demo: CarouselOrientation,
      source: docSource("carousel", "orientation"),
    },
    {
      id: "carousel-plugin",
      title: "Plugins",
      description: "Add plugins such as Autoplay to the carousel using the plugins prop.",
      Demo: CarouselPlugin,
      source: docSource("carousel", "plugin"),
    },
    {
      id: "carousel-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: CarouselRtl,
      source: docSource("carousel", "rtl"),
      direction: "rtl",
    },
    {
      id: "carousel-size",
      title: "Sizes",
      description: "To set the size of the items, you can use the basis utility class on the <CarouselItem />.",
      Demo: CarouselSize,
      source: docSource("carousel", "size"),
    },
    {
      id: "carousel-spacing",
      title: "Spacing",
      description:
        "To set the spacing between the items, we use a ps-[VALUE] utility on the <CarouselItem /> and a negative -ms-[VALUE] on the <CarouselContent />.",
      Demo: CarouselSpacing,
      source: docSource("carousel", "spacing"),
    },
  ],
  anatomy: [
    {
      name: "Carousel",
      children: [
        { name: "CarouselContent", children: [{ name: "CarouselItem" }] },
        { name: "CarouselPrevious" },
        { name: "CarouselNext" },
      ],
    },
  ],
  features: [
    "Built on Embla; setApi exposes the live Embla instance to read the current index or call scrollTo() imperatively.",
    "Arrow-key navigation follows reading direction — in RTL, Left advances instead of Right.",
    "CarouselPrevious/CarouselNext disable themselves automatically at the ends of an unlooped carousel.",
  ],
  api: [
    {
      name: "Carousel",
      description: "Embla-powered. Owns the viewport and exposes the underlying api.",
      props: [
        {
          name: "orientation",
          type: '"horizontal" | "vertical"',
          default: '"horizontal"',
          description: "Scroll axis.",
        },
        {
          name: "opts",
          type: "EmblaOptionsType",
          description: 'Embla options, e.g. { align: "start", loop: true }.',
        },
        {
          name: "setApi",
          type: "(api) => void",
          description: "Receive the Embla api to read the index or call scrollTo().",
        },
        {
          name: "plugins",
          type: "EmblaPluginType[]",
          description: "Embla plugins such as Autoplay.",
        },
      ],
    },
    {
      name: "CarouselItem",
      props: [
        {
          name: "className",
          type: "string",
          description: "Set basis-1/2, basis-1/3… to show multiple items per view.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Focuses the carousel region, then the prev/next buttons." },
      { keys: ["Arrow", "Left"], description: "Scrolls to the previous slide." },
      { keys: ["Arrow", "Right"], description: "Scrolls to the next slide." },
    ],
    notes: [
      "The region is labelled as a carousel; prev/next buttons disable at the ends.",
      "Provide a text counter or labelled dots so position isn’t conveyed only visually.",
      "Avoid autoplay for essential content, or pause it on hover/focus.",
    ],
  },
  guidelines: {
    do: [
      "Show position with a counter or dot indicators.",
      "Use basis utilities on items to reveal a peek of the next slide.",
    ],
    dont: [
      "Don’t hide critical content inside an autoplaying carousel.",
      "Don’t remove the prev/next controls on non-touch devices.",
    ],
  },
  related: ["card", "aspect-ratio", "scroll-area"],
};
