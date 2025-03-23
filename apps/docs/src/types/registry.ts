import type { ComponentType } from 'react';

export interface Registry {
  component: ComponentType;
  description: string;
  slug: string;
  title: string;
}

export interface RegistryGroup {
  name: string;
  components?: Registry[];
  description?: string;
  slug?: string;
}
