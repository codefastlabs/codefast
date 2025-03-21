import type { ComponentType } from 'react';

export interface Registry {
  component: ComponentType;
  description: string;
  name: string;
  title: string;
}
