import dynamic from 'next/dynamic';

import type { RegistryGroup, RegistryItem } from '@/types/registry';

export const registryBlocks: Record<string, RegistryItem> = {
  'sidebar-01': {
    component: dynamic(() => import('@/registry/blocks/sidebar-01/page')),
    description: 'A simple sidebar with navigation grouped by section.',
    slug: 'sidebar-01',
    title: 'Sidebar 01',
  },
  'sidebar-02': {
    component: dynamic(() => import('@/registry/blocks/sidebar-02/page')),
    description: 'A sidebar with collapsible sections.',
    slug: 'sidebar-02',
    title: 'Sidebar 02',
  },
  'sidebar-03': {
    component: dynamic(() => import('@/registry/blocks/sidebar-03/page')),
    description: 'A sidebar with submenus.',
    slug: 'sidebar-03',
    title: 'Sidebar 03',
  },
  'sidebar-04': {
    component: dynamic(() => import('@/registry/blocks/sidebar-04/page')),
    description: 'A floating sidebar with submenus.',
    slug: 'sidebar-04',
    title: 'Sidebar 04',
  },
  'sidebar-05': {
    component: dynamic(() => import('@/registry/blocks/sidebar-05/page')),
    description: 'A sidebar with collapsible submenus.',
    slug: 'sidebar-05',
    title: 'Sidebar 05',
  },
  'sidebar-06': {
    component: dynamic(() => import('@/registry/blocks/sidebar-06/page')),
    description: 'A sidebar with submenus as dropdowns.',
    slug: 'sidebar-06',
    title: 'Sidebar 06',
  },
  'sidebar-07': {
    component: dynamic(() => import('@/registry/blocks/sidebar-07/page')),
    description: 'A sidebar that collapses to icons.',
    slug: 'sidebar-07',
    title: 'Sidebar 07',
  },
  'sidebar-08': {
    component: dynamic(() => import('@/registry/blocks/sidebar-08/page')),
    description: 'An inset sidebar with secondary navigation.',
    slug: 'sidebar-08',
    title: 'Sidebar 08',
  },
  'sidebar-09': {
    component: dynamic(() => import('@/registry/blocks/sidebar-09/page')),
    description: 'Collapsible nested sidebars.',
    slug: 'sidebar-09',
    title: 'Sidebar 09',
  },
  'sidebar-10': {
    component: dynamic(() => import('@/registry/blocks/sidebar-10/page')),
    description: 'A sidebar in a popover.',
    slug: 'sidebar-10',
    title: 'Sidebar 10',
  },
  'sidebar-11': {
    component: dynamic(() => import('@/registry/blocks/sidebar-11/page')),
    description: 'A sidebar with a collapsible file tree.',
    slug: 'sidebar-11',
    title: 'Sidebar 11',
  },
  'sidebar-12': {
    component: dynamic(() => import('@/registry/blocks/sidebar-12/page')),
    description: 'A sidebar with a calendar.',
    slug: 'sidebar-12',
    title: 'Sidebar 12',
  },
  'sidebar-13': {
    component: dynamic(() => import('@/registry/blocks/sidebar-13/page')),
    description: 'A sidebar in a dialog.',
    slug: 'sidebar-13',
    title: 'Sidebar 13',
  },
  'sidebar-14': {
    component: dynamic(() => import('@/registry/blocks/sidebar-14/page')),
    description: 'A sidebar on the right.',
    slug: 'sidebar-14',
    title: 'Sidebar 14',
  },
  'sidebar-15': {
    component: dynamic(() => import('@/registry/blocks/sidebar-15/page')),
    description: 'A left and right sidebar.',
    slug: 'sidebar-15',
    title: 'Sidebar 15',
  },
  'sidebar-16': {
    component: dynamic(() => import('@/registry/blocks/sidebar-16/page')),
    description: 'A sidebar with a sticky site header.',
    slug: 'sidebar-16',
    title: 'Sidebar 16',
  },
  'login-01': {
    component: dynamic(() => import('@/registry/blocks/login-01/page')),
    description: 'A simple login form.',
    slug: 'login-01',
    title: 'Login 01',
  },
  'login-02': {
    component: dynamic(() => import('@/registry/blocks/login-02/page')),
    description: 'A two column login page with a cover image.',
    slug: 'login-02',
    title: 'Login 02',
  },
  'login-03': {
    component: dynamic(() => import('@/registry/blocks/login-03/page')),
    description: 'A login page with a muted background color.',
    slug: 'login-03',
    title: 'Login 03',
  },
  'login-04': {
    component: dynamic(() => import('@/registry/blocks/login-04/page')),
    description: 'A login page with form and image.',
    slug: 'login-04',
    title: 'Login 04',
  },
  'login-05': {
    component: dynamic(() => import('@/registry/blocks/login-05/page')),
    description: 'A simple email-only login page.',
    slug: 'login-05',
    title: 'Login 05',
  },
  'products-01': {
    component: dynamic(() => import('@/registry/blocks/products-01/page')),
    description: 'A table of products',
    slug: 'products-01',
    title: 'Products 01',
  },
  'dashboard-01': {
    component: dynamic(() => import('@/registry/blocks/dashboard-01/page')),
    description: 'A dashboard with sidebar, charts and data table.',
    slug: 'dashboard-01',
    title: 'Dashboard 01',
  },
  'form-01': {
    component: dynamic(() => import('@/registry/blocks/form-01/page')),
    description: 'Service upgrade form with payment information and package options.',
    slug: 'form-01',
    title: 'Form 01',
  },
};

export const registryBlockGroups: RegistryGroup[] = [
  {
    title: 'Login',
    description: 'Login interface templates with various styles and layouts.',
    components: [
      registryBlocks['login-01'],
      registryBlocks['login-02'],
      registryBlocks['login-03'],
      registryBlocks['login-04'],
      registryBlocks['login-05'],
    ],
  },
  {
    title: 'Products',
    description: 'Product list display and management interface',
    components: [registryBlocks['products-01']],
  },
  {
    title: 'Forms',
    description: 'Collection of multipurpose form templates with various input fields',
    components: [registryBlocks['form-01']],
  },
  {
    title: 'Dashboard',
    description: 'The dashboard displays key system data.',
    components: [registryBlocks['dashboard-01']],
  },
  {
    title: 'Sidebar',
    description: 'Side navigation bars with various variations and styles',
    components: [
      registryBlocks['sidebar-01'],
      registryBlocks['sidebar-02'],
      registryBlocks['sidebar-03'],
      registryBlocks['sidebar-04'],
      registryBlocks['sidebar-05'],
      registryBlocks['sidebar-06'],
      registryBlocks['sidebar-07'],
      registryBlocks['sidebar-08'],
      registryBlocks['sidebar-09'],
      registryBlocks['sidebar-10'],
      registryBlocks['sidebar-11'],
      registryBlocks['sidebar-12'],
      registryBlocks['sidebar-13'],
      registryBlocks['sidebar-14'],
      registryBlocks['sidebar-15'],
      registryBlocks['sidebar-16'],
    ],
  },
];
