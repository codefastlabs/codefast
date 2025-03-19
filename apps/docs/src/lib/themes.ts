export interface Theme {
  name: string;
  value: string;
}

export const THEMES: Theme[] = [
  { name: 'Default', value: 'default' },
  { name: 'Slate', value: 'slate' },
  { name: 'Gray', value: 'gray' },
  { name: 'Zinc', value: 'zinc' },
  { name: 'Neutral', value: 'neutral' },
  { name: 'Stone', value: 'stone' },
];
