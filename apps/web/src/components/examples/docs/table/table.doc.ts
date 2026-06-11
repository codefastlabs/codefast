import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { TableInvoices } from "#/components/examples/docs/table/invoices";
import { TableSelection } from "#/components/examples/docs/table/selection";
import { TableSimple } from "#/components/examples/docs/table/simple";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const tableDoc: ComponentDoc = {
  examples: [
    {
      id: "invoices",
      title: "Data table",
      description: "A semantic table with header, footer, caption, and a status Badge per row.",
      Demo: TableInvoices,
      code: docSource("table", "invoices"),
      previewClassName: "items-start",
    },
    {
      id: "simple",
      title: "Simple table",
      description: "Header and rows only — no caption or footer.",
      Demo: TableSimple,
      code: docSource("table", "simple"),
      previewClassName: "items-start",
    },
    {
      id: "selection",
      title: "Row selection",
      description: "A checkbox column with select-all and per-row state.",
      Demo: TableSelection,
      code: docSource("table", "selection"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("table"),
  api: [
    {
      name: "Table parts",
      description: "Thin styled wrappers over real HTML table elements.",
      props: [
        {
          name: "TableHeader / TableBody / TableFooter",
          type: "ReactNode",
          description: "Map to <thead>, <tbody>, <tfoot>.",
        },
        {
          name: "TableRow / TableHead / TableCell",
          type: "ReactNode",
          description: "Rows, header cells (<th>), and body cells (<td>).",
        },
        {
          name: "TableCaption",
          type: "ReactNode",
          description: "A caption describing the table for assistive tech.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Renders real <table> markup, so semantics and navigation come for free.",
      "Use TableCaption (or aria-label) to describe what the table contains.",
      "Keep header cells in <th> so columns are announced.",
    ],
  },
  guidelines: {
    do: [
      "Use for genuinely tabular data with shared columns.",
      "Right-align numeric columns and use tabular figures.",
    ],
    dont: [
      "Don’t use a table purely for layout.",
      "Don’t drop the header row — it names the columns.",
    ],
  },
  related: ["item", "card", "pagination"],
};
