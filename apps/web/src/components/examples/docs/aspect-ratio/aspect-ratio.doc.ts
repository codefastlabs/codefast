import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { AspectRatioRatios } from "#/components/examples/docs/aspect-ratio/ratios";

import { AspectRatioBanner } from "#/components/examples/docs/aspect-ratio/banner";
import { AspectRatioMedia } from "#/components/examples/docs/aspect-ratio/media";

export const aspectRatioDoc: ComponentDoc = {
  examples: [
    {
      id: "ratios",
      title: "Common ratios",
      description: "Lock content to 16/9, 1/1, or 4/3 — the box holds the shape at any width.",
      Demo: AspectRatioRatios,
      code: docSource("aspect-ratio", "ratios"),
    },
    {
      id: "banner",
      title: "Ultra-wide banner",
      description: "Lock a hero header to a 21/9 cinematic ratio.",
      Demo: AspectRatioBanner,
      code: docSource("aspect-ratio", "banner"),
    },
    {
      id: "media",
      title: "Media thumbnail",
      description: "A 16/9 video thumbnail with an overlaid play control.",
      Demo: AspectRatioMedia,
      code: docSource("aspect-ratio", "media"),
    },
  ],
  anatomy: docAnatomy("aspect-ratio"),
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
