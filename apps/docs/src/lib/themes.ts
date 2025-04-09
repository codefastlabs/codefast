export interface Theme {
  name: string;
  value: string;
}

export const THEMES: Theme[] = [
  { name: "Default", value: "default" },
  { name: "Slate", value: "slate" },
  { name: "Gray", value: "gray" },
  { name: "Zinc", value: "zinc" },
  { name: "Stone", value: "stone" },
  { name: "Scaled", value: "scaled" },
];
