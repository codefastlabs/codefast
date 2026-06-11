import { CarouselGallery } from "#/components/examples/docs/carousel/gallery";
import { CarouselMultiple } from "#/components/examples/docs/carousel/multiple";
import { CarouselVertical } from "#/components/examples/docs/carousel/vertical";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const carouselDoc: ComponentDoc = {
  examples: [
    {
      id: "gallery",
      title: "With dots & counter",
      description:
        "Track the active slide via setApi — drive clickable dots and a live “X of N” counter.",
      Demo: CarouselGallery,
      code: docSource("carousel", "gallery"),
    },
    {
      id: "vertical",
      title: "Vertical axis",
      description: 'Set orientation="vertical" to stack slides and scroll up/down.',
      Demo: CarouselVertical,
      code: docSource("carousel", "vertical"),
    },
    {
      id: "multiple",
      title: "Multiple per view",
      description: "Show several items at once with basis utilities.",
      Demo: CarouselMultiple,
      code: docSource("carousel", "multiple"),
    },
  ],
  anatomy: docAnatomy("carousel"),
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
