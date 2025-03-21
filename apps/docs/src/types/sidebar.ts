import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export interface User {
  avatar: string;
  email: string;
  name: string;
}

export interface Team {
  logo: ComponentType;
  name: string;
  plan: 'Enterprise' | 'Free' | 'Startup';
}

export interface NavSubItem {
  title: string;
  url: string;
  isActive?: boolean;
}

export interface NavItem {
  items: NavSubItem[];
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
}

export interface Project {
  icon: LucideIcon;
  name: string;
  url: string;
}
