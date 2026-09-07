import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { TableActions } from "#/registry/table/actions.example";
import { TableFooterExample } from "#/registry/table/footer.example";
import { TableRtl } from "#/registry/table/rtl.example";

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
      name: "TableHeader",
      description: "Maps to <thead>.",
      props: [{ name: "children", type: "ReactNode", description: "TableRow elements for the header." }],
    },
    {
      name: "TableBody",
      description: "Maps to <tbody>.",
      props: [{ name: "children", type: "ReactNode", description: "TableRow elements for the body." }],
    },
    {
      name: "TableFooter",
      description: "Maps to <tfoot>.",
      props: [{ name: "children", type: "ReactNode", description: "TableRow elements for the footer." }],
    },
    {
      name: "TableRow",
      description: "Maps to <tr>. Highlights itself on data-selected or aria-expanded.",
      props: [{ name: "children", type: "ReactNode", description: "TableHead or TableCell elements." }],
    },
    {
      name: "TableHead",
      description: "A header cell — maps to <th>.",
      props: [{ name: "children", type: "ReactNode", description: "The column heading content." }],
    },
    {
      name: "TableCell",
      description: "A body cell — maps to <td>.",
      props: [{ name: "children", type: "ReactNode", description: "The cell content." }],
    },
    {
      name: "TableCaption",
      props: [
        { name: "children", type: "ReactNode", description: "A caption describing the table for assistive tech." },
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
