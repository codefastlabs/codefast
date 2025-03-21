import type { LucideIcon } from 'lucide-react';

export interface User {
  avatar: string;
  email: string;
  name: string;
}

export interface Team {
  logo: React.ComponentType;
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
