import { DataTableDemo } from "#/registry/data-table/demo";
import { DataTableRtl } from "#/registry/data-table/rtl.example";
import { docDemo, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const dataTableDoc: ComponentDoc = {
  examples: [
    {
      id: "data-table-demo",
      title: "Demo",
      description: "A payments table with sorting, column filtering, column visibility, row selection, and pagination.",
      Demo: DataTableDemo,
      source: docDemo("data-table"),
      previewClassName: "items-start",
    },
    {
      id: "data-table-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: DataTableRtl,
      source: docSource("data-table", "rtl"),
      previewClassName: "items-start",
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "Table",
      children: [
        { name: "TableHeader", children: [{ name: "TableRow", children: [{ name: "TableHead" }] }] },
        { name: "TableBody", children: [{ name: "TableRow", children: [{ name: "TableCell" }] }] },
      ],
    },
  ],
  guidelines: {
    do: [
      "Drive state (sorting, filters, visibility, selection) through TanStack Table and render with the Table primitives.",
      "Give every interactive header and row control an accessible label.",
    ],
    dont: ["Don’t paginate on the client for large datasets — fetch and sort server-side instead."],
  },
  related: ["table", "checkbox", "dropdown-menu"],
};
