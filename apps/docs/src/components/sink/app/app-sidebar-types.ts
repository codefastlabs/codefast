import type { LucideIcon } from 'lucide-react';

/* -------------------------------------------------------------------------------------------------
 * Types: AppSidebar
 * -------------------------------------------------------------------------------------------------*/

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface Team {
  name: string;
  logo: LucideIcon;
  plan: string;
}

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items: NavSubItem[];
}

export interface AppSidebarData {
  user: User;
  teams: Team[];
  navMain: NavItem[];
}
