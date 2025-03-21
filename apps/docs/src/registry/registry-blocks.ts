import dynamic from 'next/dynamic';

import type { Registry } from '@/types/registry';

export const registryBlocks: Record<string, Registry> = {
  'sidebar-01': {
    component: dynamic(() => import('@/registry/blocks/sidebar-01/page')),
    description: 'A simple sidebar with navigation grouped by section.',
    name: 'sidebar-01',
    title: 'Sidebar 01',
  },
  'sidebar-02': {
    component: dynamic(() => import('@/registry/blocks/sidebar-02/page')),
    description: 'A sidebar with collapsible sections.',
    name: 'sidebar-02',
    title: 'Sidebar 02',
  },
  'sidebar-03': {
    component: dynamic(() => import('@/registry/blocks/sidebar-03/page')),
    description: 'A sidebar with submenus.',
    name: 'sidebar-03',
    title: 'Sidebar 03',
  },
  'sidebar-04': {
    component: dynamic(() => import('@/registry/blocks/sidebar-04/page')),
    description: 'A floating sidebar with submenus.',
    name: 'sidebar-04',
    title: 'Sidebar 04',
  },
  'sidebar-05': {
    component: dynamic(() => import('@/registry/blocks/sidebar-05/page')),
    description: 'A sidebar with collapsible submenus.',
    name: 'sidebar-05',
    title: 'Sidebar 05',
  },
  'sidebar-06': {
    component: dynamic(() => import('@/registry/blocks/sidebar-06/page')),
    description: 'A sidebar with submenus as dropdowns.',
    name: 'sidebar-06',
    title: 'Sidebar 06',
  },
  'sidebar-07': {
    component: dynamic(() => import('@/registry/blocks/sidebar-07/page')),
    description: 'A sidebar that collapses to icons.',
    name: 'sidebar-07',
    title: 'Sidebar 07',
  },
  'sidebar-08': {
    component: dynamic(() => import('@/registry/blocks/sidebar-08/page')),
    description: 'An inset sidebar with secondary navigation.',
    name: 'sidebar-08',
    title: 'Sidebar 08',
  },
  'sidebar-09': {
    component: dynamic(() => import('@/registry/blocks/sidebar-09/page')),
    description: 'Collapsible nested sidebars.',
    name: 'sidebar-09',
    title: 'Sidebar 09',
  },
  'sidebar-10': {
    component: dynamic(() => import('@/registry/blocks/sidebar-10/page')),
    description: 'A sidebar in a popover.',
    name: 'sidebar-10',
    title: 'Sidebar 10',
  },
  'sidebar-11': {
    component: dynamic(() => import('@/registry/blocks/sidebar-11/page')),
    description: 'A sidebar with a collapsible file tree.',
    name: 'sidebar-11',
    title: 'Sidebar 11',
  },
  'sidebar-12': {
    component: dynamic(() => import('@/registry/blocks/sidebar-12/page')),
    description: 'A sidebar with a calendar.',
    name: 'sidebar-12',
    title: 'Sidebar 12',
  },
  'sidebar-13': {
    component: dynamic(() => import('@/registry/blocks/sidebar-13/page')),
    description: 'A sidebar in a dialog.',
    name: 'sidebar-13',
    title: 'Sidebar 13',
  },
  'sidebar-14': {
    component: dynamic(() => import('@/registry/blocks/sidebar-14/page')),
    description: 'A sidebar on the right.',
    name: 'sidebar-14',
    title: 'Sidebar 14',
  },
  'sidebar-15': {
    component: dynamic(() => import('@/registry/blocks/sidebar-15/page')),
    description: 'A left and right sidebar.',
    name: 'sidebar-15',
    title: 'Sidebar 15',
  },
  'sidebar-16': {
    component: dynamic(() => import('@/registry/blocks/sidebar-16/page')),
    description: 'A sidebar with a sticky site header.',
    name: 'sidebar-16',
    title: 'Sidebar 16',
  },
  'login-01': {
    component: dynamic(() => import('@/registry/blocks/login-01/page')),
    description: 'A simple login form.',
    name: 'login-01',
    title: 'Login 01',
  },
  'login-02': {
    component: dynamic(() => import('@/registry/blocks/login-02/page')),
    description: 'A two column login page with a cover image.',
    name: 'login-02',
    title: 'Login 02',
  },
  'login-03': {
    component: dynamic(() => import('@/registry/blocks/login-03/page')),
    description: 'A login page with a muted background color.',
    name: 'login-03',
    title: 'Login 03',
  },
  'login-04': {
    component: dynamic(() => import('@/registry/blocks/login-04/page')),
    description: 'A login page with form and image.',
    name: 'login-04',
    title: 'Login 04',
  },
  'login-05': {
    component: dynamic(() => import('@/registry/blocks/login-05/page')),
    description: 'A simple email-only login page.',
    name: 'login-05',
    title: 'Login 05',
  },
  'products-01': {
    component: dynamic(() => import('@/registry/blocks/products-01/page')),
    description: 'A table of products',
    name: 'products-01',
    title: 'Products 01',
  },
  'dashboard-01': {
    component: dynamic(() => import('@/registry/blocks/dashboard-01/page')),
    description: 'A dashboard with sidebar, charts and data table.',
    name: 'dashboard-01',
    title: 'Dashboard 01',
  },
};
