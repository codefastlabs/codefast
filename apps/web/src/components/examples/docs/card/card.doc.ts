import { CardLogin } from "#/components/examples/docs/card/login";
import { CardOverview } from "#/components/examples/docs/card/overview";
import { CardSimple } from "#/components/examples/docs/card/simple";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const cardDoc: ComponentDoc = {
  examples: [
    {
      id: "overview",
      title: "Overview",
      description: "All slots together: header, action, content, and footer.",
      Demo: CardOverview,
      code: docSource("card", "overview"),
      previewClassName: "items-start",
    },
    {
      id: "simple",
      title: "Header + content",
      description: "Every slot is optional — use only what you need.",
      Demo: CardSimple,
      code: docSource("card", "simple"),
      previewClassName: "items-start",
    },
    {
      id: "login",
      title: "Form card",
      description: "Compose inputs and actions inside the card slots.",
      Demo: CardLogin,
      code: docSource("card", "login"),
    },
  ],
  anatomy: docAnatomy("card"),
  api: [
    {
      name: "Card",
      description: "The surface. Every part below is a styled <div> you can omit or reorder.",
      props: [
        {
          name: "className",
          type: "string",
          description: "Compose width, shadow, and spacing — the card owns no layout of its own.",
        },
      ],
    },
    {
      name: "CardHeader / CardFooter / CardContent",
      description: "Layout slots.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "CardHeader hosts CardTitle, CardDescription, and an optional CardAction.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Card is a presentational container with no implicit role — structure content with real headings.",
      "When a whole card is clickable, wrap it in a single link/button rather than nesting interactives.",
      "Use CardTitle as a real heading level that fits the surrounding document outline.",
    ],
  },
  guidelines: {
    do: [
      "Group genuinely related content; one idea per card.",
      "Keep actions in CardFooter or CardAction so they’re easy to find.",
    ],
    dont: [
      "Don’t nest cards inside cards — it muddies hierarchy.",
      "Don’t put more than one primary action in a single card.",
    ],
  },
  related: ["item", "accordion", "separator"],
};
