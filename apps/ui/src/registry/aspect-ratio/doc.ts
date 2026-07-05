import { docDemo, docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { AspectRatioDemo } from "#/registry/aspect-ratio/demo";
import { AspectRatioPortrait } from "#/registry/aspect-ratio/portrait.example";
import { AspectRatioRtl } from "#/registry/aspect-ratio/rtl.example";
import { AspectRatioSquare } from "#/registry/aspect-ratio/square.example";

export const aspectRatioDoc: ComponentDoc = {
  examples: [
    {
      id: "aspect-ratio-demo",
      title: "Demo",
      description: "Lock an image to a 16/9 box — it holds the shape at any width.",
      Demo: AspectRatioDemo,
      source: docDemo("aspect-ratio"),
    },
    {
      id: "aspect-ratio-square",
      title: "Square",
      description: "A 1/1 square crop for avatars and thumbnails.",
      Demo: AspectRatioSquare,
      source: docSource("aspect-ratio", "square"),
    },
    {
      id: "aspect-ratio-portrait",
      title: "Portrait",
      description: "A 9/16 portrait box for vertical media.",
      Demo: AspectRatioPortrait,
      source: docSource("aspect-ratio", "portrait"),
    },
    {
      id: "aspect-ratio-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: AspectRatioRtl,
      source: docSource("aspect-ratio", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "AspectRatio" }],
  features: [
    "A single ratio prop (width ÷ height) constrains the child — no manual padding-hack CSS needed.",
    "Reserves space before the child loads, preventing layout shift for images, video, and embeds.",
  ],
  api: [
    {
      name: "AspectRatio",
      description: "Constrains its child to a fixed width-to-height ratio.",
      props: [
        {
          name: "ratio",
          type: "number",
          default: "1",
          description: "Width ÷ height, e.g. 16 / 9. The child fills the box.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Purely a layout helper — give the inner media its own alt text.",
      "Use object-cover (or contain) on images so they fill the locked box correctly.",
      "Helps prevent layout shift by reserving space before media loads.",
    ],
  },
  guidelines: {
    do: [
      "Use for images, video, embeds, and map tiles that must keep a shape.",
      "Combine with overflow-hidden + rounded corners for media cards.",
    ],
    dont: [
      "Don’t use it for text content that should grow with its length.",
      "Don’t forget object-fit on the inner image.",
    ],
  },
  related: ["card", "carousel", "skeleton"],
};
