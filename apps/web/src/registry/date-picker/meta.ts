import type { ComponentMetaInput } from "#/registry/components";

export const meta: ComponentMetaInput = {
  name: "Date Picker",
  category: "form",
  order: 225,
  description: "A date and date-range picker composed from a Popover and the Calendar component.",
  composition: ["Calendar", "Popover"],
};
