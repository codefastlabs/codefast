import { docSource, docUsage } from "#/registry/source";
import { TableActions } from "#/registry/table/actions.example";
import { TableFooterExample } from "#/registry/table/footer.example";
import { TableRtl } from "#/registry/table/rtl.example";
import type { ComponentDoc } from "#/registry/types";

export const tableDoc: ComponentDoc = {
  usage: docUsage("table"),
  examples: [
    {
      id: "table-actions",
      title: "Actions",
      description: "A table showing actions for each row using a <DropdownMenu /> component.",
      Demo: TableActions,
      source: docSource("table", "actions"),
      previewClassName: "block",
    },
    {
      id: "table-footer",
      title: "Footer",
      description: "Use the <TableFooter /> component to add a footer to the table.",
      Demo: TableFooterExample,
      source: docSource("table", "footer"),
      previewClassName: "block",
    },
    {
      id: "table-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: TableRtl,
      source: docSource("table", "rtl"),
      direction: "rtl",
      previewClassName: "block",
    },
  ],
  anatomy: [
    {
      name: "Table",
      children: [
        { name: "TableCaption" },
        { name: "TableHeader", children: [{ name: "TableRow", children: [{ name: "TableHead" }] }] },
        { name: "TableBody", children: [{ name: "TableRow", children: [{ name: "TableCell" }] }] },
        { name: "TableFooter", children: [{ name: "TableRow", children: [{ name: "TableCell" }] }] },
      ],
    },
  ],
  features: [
    "Wraps itself in a horizontally-scrollable container automatically — no separate overflow wrapper needed for wide tables.",
    "TableRow highlights itself on data-selected or aria-expanded with no extra classes required.",
    "Thin styled wrappers over real <table>/<thead>/<tbody>/<tfoot> elements — full native semantics and copy/paste behaviour.",
  ],
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
    do: ["Use for genuinely tabular data with shared columns.", "Right-align numeric columns and use tabular figures."],
    dont: ["Don’t use a table purely for layout.", "Don’t drop the header row — it names the columns."],
  },
  related: ["item", "card", "pagination"],
};
