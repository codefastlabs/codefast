import { docDemo, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";
import { TypographyBlockquote } from "#/registry/typography/blockquote.example";
import { TypographyDemo } from "#/registry/typography/demo";
import { TypographyH1 } from "#/registry/typography/h1.example";
import { TypographyH2 } from "#/registry/typography/h2.example";
import { TypographyH3 } from "#/registry/typography/h3.example";
import { TypographyH4 } from "#/registry/typography/h4.example";
import { TypographyInlineCode } from "#/registry/typography/inline-code.example";
import { TypographyLarge } from "#/registry/typography/large.example";
import { TypographyLead } from "#/registry/typography/lead.example";
import { TypographyList } from "#/registry/typography/list.example";
import { TypographyMuted } from "#/registry/typography/muted.example";
import { TypographyP } from "#/registry/typography/p.example";
import { TypographyRtl } from "#/registry/typography/rtl.example";
import { TypographySmall } from "#/registry/typography/small.example";
import { TypographyTable } from "#/registry/typography/table.example";

export const typographyDoc: ComponentDoc = {
  examples: [
    {
      id: "typography-demo",
      title: "Demo",
      description: "Headings, paragraphs, links, blockquotes, and lists composed into a prose layout.",
      Demo: TypographyDemo,
      source: docDemo("typography"),
      previewClassName: "items-start",
    },
    {
      id: "typography-h1",
      title: "h1",
      description: "The top-level page heading.",
      Demo: TypographyH1,
      source: docSource("typography", "h1"),
      previewClassName: "items-start",
    },
    {
      id: "typography-h2",
      title: "h2",
      description: "A section heading with a bottom border.",
      Demo: TypographyH2,
      source: docSource("typography", "h2"),
      previewClassName: "items-start",
    },
    {
      id: "typography-h3",
      title: "h3",
      description: "A sub-section heading.",
      Demo: TypographyH3,
      source: docSource("typography", "h3"),
      previewClassName: "items-start",
    },
    {
      id: "typography-h4",
      title: "h4",
      description: "A minor heading.",
      Demo: TypographyH4,
      source: docSource("typography", "h4"),
      previewClassName: "items-start",
    },
    {
      id: "typography-p",
      title: "Paragraph",
      description: "Body copy with comfortable line height and spacing.",
      Demo: TypographyP,
      source: docSource("typography", "p"),
      previewClassName: "items-start",
    },
    {
      id: "typography-blockquote",
      title: "Blockquote",
      description: "An italic, left-bordered quotation.",
      Demo: TypographyBlockquote,
      source: docSource("typography", "blockquote"),
      previewClassName: "items-start",
    },
    {
      id: "typography-table",
      title: "Table",
      description: "A bordered, striped data table.",
      Demo: TypographyTable,
      source: docSource("typography", "table"),
      previewClassName: "items-start",
    },
    {
      id: "typography-list",
      title: "List",
      description: "A bulleted list with spaced items.",
      Demo: TypographyList,
      source: docSource("typography", "list"),
      previewClassName: "items-start",
    },
    {
      id: "typography-inline-code",
      title: "Inline code",
      description: "Monospace code rendered inline with text.",
      Demo: TypographyInlineCode,
      source: docSource("typography", "inline-code"),
      previewClassName: "items-start",
    },
    {
      id: "typography-lead",
      title: "Lead",
      description: "A larger, muted introductory paragraph.",
      Demo: TypographyLead,
      source: docSource("typography", "lead"),
      previewClassName: "items-start",
    },
    {
      id: "typography-large",
      title: "Large",
      description: "Emphasised large text.",
      Demo: TypographyLarge,
      source: docSource("typography", "large"),
      previewClassName: "items-start",
    },
    {
      id: "typography-small",
      title: "Small",
      description: "Small, tight text for captions and hints.",
      Demo: TypographySmall,
      source: docSource("typography", "small"),
      previewClassName: "items-start",
    },
    {
      id: "typography-muted",
      title: "Muted",
      description: "De-emphasised secondary text.",
      Demo: TypographyMuted,
      source: docSource("typography", "muted"),
      previewClassName: "items-start",
    },
    {
      id: "typography-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: TypographyRtl,
      source: docSource("typography", "rtl"),
      previewClassName: "items-start",
      direction: "rtl",
    },
  ],
  guidelines: {
    do: [
      "Use semantic elements (h1–h4, p, ul, blockquote) so the document outline stays meaningful.",
      "Keep one h1 per page and step heading levels without skipping.",
    ],
    dont: [
      "Don’t pick a heading level for its size — style with classes instead.",
      "Don’t wrap whole paragraphs in inline-code or muted styles.",
    ],
  },
  related: ["card", "separator", "table"],
};
