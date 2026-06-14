import type { ComponentMetaInput } from "#/registry/components";

export const meta: ComponentMetaInput = {
  name: "Data Table",
  category: "display",
  description: "A sortable, filterable, paginated table built with TanStack Table and the Table primitives.",
  wide: true,
  composition: ["@tanstack/react-table", "Table"],
};
