import dynamic from 'next/dynamic';

import type { RegistryGroup, RegistryItem } from '@/types/registry';

export const registryBlocks: Record<string, RegistryItem> = {
  'dashboard-01': {
    component: dynamic(() => import('@/registry/blocks/dashboard-01/page')),
    description: 'A dashboard with sidebar, charts and data table.',
    files: [
      {
        path: 'src/registry/blocks/dashboard-01/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/dashboard-01/data.json',
        target: 'app/dashboard/data.json',
        type: 'registry:file',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/chart-area-interactive.tsx',
        target: 'app/dashboard/_components/chart-area-interactive.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/data-table.tsx',
        target: 'app/dashboard/_components/data-table.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/nav-documents.tsx',
        target: 'app/dashboard/_components/nav-documents.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/nav-main.tsx',
        target: 'app/dashboard/_components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/nav-secondary.tsx',
        target: 'app/dashboard/_components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/nav-user.tsx',
        target: 'app/dashboard/_components/nav-user.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/section-cards.tsx',
        target: 'app/dashboard/_components/section-cards.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/dashboard-01/_components/site-header.tsx',
        target: 'app/dashboard/_components/site-header.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'dashboard-01',
    title: 'Dashboard 01',
  },
  'form-01': {
    component: dynamic(() => import('@/registry/blocks/form-01/page')),
    description: 'Service upgrade form with payment information and package options.',
    files: [
      {
        path: 'src/registry/blocks/form-01/_components/payment-plan-form.tsx',
        target: 'app/components/payment-plan-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'form-01',
    title: 'Form 01',
  },
  'login-01': {
    component: dynamic(() => import('@/registry/blocks/login-01/page')),
    description: 'A simple login form.',
    files: [
      {
        path: 'src/registry/blocks/login-01/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/login-01/_components/login-form.tsx',
        target: 'app/login/_components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'login-01',
    title: 'Login 01',
  },
  'login-02': {
    component: dynamic(() => import('@/registry/blocks/login-02/page')),
    description: 'A two column login page with a cover image.',
    files: [
      {
        path: 'src/registry/blocks/login-02/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/login-02/_components/login-form.tsx',
        target: 'app/login/_components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'login-02',
    title: 'Login 02',
  },
  'login-03': {
    component: dynamic(() => import('@/registry/blocks/login-03/page')),
    description: 'A login page with a muted background color.',
    files: [
      {
        path: 'src/registry/blocks/login-03/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/login-03/_components/login-form.tsx',
        target: 'app/login/_components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'login-03',
    title: 'Login 03',
  },
  'login-04': {
    component: dynamic(() => import('@/registry/blocks/login-04/page')),
    description: 'A login page with form and image.',
    files: [
      {
        path: 'src/registry/blocks/login-04/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/login-04/_components/login-form.tsx',
        target: 'app/login/_components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'login-04',
    title: 'Login 04',
  },
  'login-05': {
    component: dynamic(() => import('@/registry/blocks/login-05/page')),
    description: 'A simple email-only login page.',
    files: [
      {
        path: 'src/registry/blocks/login-05/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/login-05/_components/login-form.tsx',
        target: 'app/login/_components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'login-05',
    title: 'Login 05',
  },
  'products-01': {
    component: dynamic(() => import('@/registry/blocks/products-01/page')),
    description: 'A table of products',
    slug: 'products-01',
    title: 'Products 01',
  },
  'sidebar-01': {
    component: dynamic(() => import('@/registry/blocks/sidebar-01/page')),
    description: 'A simple sidebar with navigation grouped by section.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-01/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-01/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-01/_components/search-form.tsx',
        target: 'app/dashboard/_components/search-form.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-01/_components/version-switcher.tsx',
        target: 'app/dashboard/_components/version-switcher.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-01',
    title: 'Sidebar 01',
  },
  'sidebar-02': {
    component: dynamic(() => import('@/registry/blocks/sidebar-02/page')),
    description: 'A sidebar with collapsible sections.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-02/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-02/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-02/_components/search-form.tsx',
        target: 'app/dashboard/_components/search-form.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-02/_components/version-switcher.tsx',
        target: 'app/dashboard/_components/version-switcher.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-02',
    title: 'Sidebar 02',
  },
  'sidebar-03': {
    component: dynamic(() => import('@/registry/blocks/sidebar-03/page')),
    description: 'A sidebar with submenus.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-03/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-03/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-03',
    title: 'Sidebar 03',
  },
  'sidebar-04': {
    component: dynamic(() => import('@/registry/blocks/sidebar-04/page')),
    description: 'A floating sidebar with submenus.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-04/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-04/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-04',
    title: 'Sidebar 04',
  },
  'sidebar-05': {
    component: dynamic(() => import('@/registry/blocks/sidebar-05/page')),
    description: 'A sidebar with collapsible submenus.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-05/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-05/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-05/_components/search-form.tsx',
        target: 'app/dashboard/_components/search-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-05',
    title: 'Sidebar 05',
  },
  'sidebar-06': {
    component: dynamic(() => import('@/registry/blocks/sidebar-06/page')),
    description: 'A sidebar with submenus as dropdowns.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-06/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-06/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-06/_components/nav-main.tsx',
        target: 'app/dashboard/_components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-06/_components/sidebar-opt-in-form.tsx',
        target: 'app/dashboard/_components/sidebar-opt-in-form.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-06',
    title: 'Sidebar 06',
  },
  'sidebar-07': {
    component: dynamic(() => import('@/registry/blocks/sidebar-07/page')),
    description: 'A sidebar that collapses to icons.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-07/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-07/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-07/_components/nav-main.tsx',
        target: 'app/dashboard/_components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-07/_components/nav-projects.tsx',
        target: 'app/dashboard/_components/nav-projects.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-07/_components/nav-user.tsx',
        target: 'app/dashboard/_components/nav-user.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-07/_components/team-switcher.tsx',
        target: 'app/dashboard/_components/team-switcher.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-07',
    title: 'Sidebar 07',
  },
  'sidebar-08': {
    component: dynamic(() => import('@/registry/blocks/sidebar-08/page')),
    description: 'An inset sidebar with secondary navigation.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-08/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-08/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-08/_components/nav-main.tsx',
        target: 'app/dashboard/_components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-08/_components/nav-projects.tsx',
        target: 'app/dashboard/_components/nav-projects.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-08/_components/nav-secondary.tsx',
        target: 'app/dashboard/_components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-08/_components/nav-user.tsx',
        target: 'app/dashboard/_components/nav-user.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-08',
    title: 'Sidebar 08',
  },
  'sidebar-09': {
    component: dynamic(() => import('@/registry/blocks/sidebar-09/page')),
    description: 'Collapsible nested sidebars.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-09/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-09/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-09/_components/nav-user.tsx',
        target: 'app/dashboard/_components/nav-user.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-09',
    title: 'Sidebar 09',
  },
  'sidebar-10': {
    component: dynamic(() => import('@/registry/blocks/sidebar-10/page')),
    description: 'A sidebar in a popover.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-10/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-10/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-10/_components/nav-actions.tsx',
        target: 'app/dashboard/_components/nav-actions.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-10/_components/nav-favorites.tsx',
        target: 'app/dashboard/_components/nav-favorites.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-10/_components/nav-main.tsx',
        target: 'app/dashboard/_components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-10/_components/nav-secondary.tsx',
        target: 'app/dashboard/_components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-10/_components/nav-workspaces.tsx',
        target: 'app/dashboard/_components/nav-workspaces.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-10/_components/team-switcher.tsx',
        target: 'app/dashboard/_components/team-switcher.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-10',
    title: 'Sidebar 10',
  },
  'sidebar-11': {
    component: dynamic(() => import('@/registry/blocks/sidebar-11/page')),
    description: 'A sidebar with a collapsible file tree.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-11/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-11/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-11',
    title: 'Sidebar 11',
  },
  'sidebar-12': {
    component: dynamic(() => import('@/registry/blocks/sidebar-12/page')),
    description: 'A sidebar with a calendar.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-12/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-12/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-12/_components/calendars.tsx',
        target: 'app/dashboard/_components/calendars.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-12/_components/date-picker.tsx',
        target: 'app/dashboard/_components/date-picker.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-12/_components/nav-user.tsx',
        target: 'app/dashboard/_components/nav-user.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-12',
    title: 'Sidebar 12',
  },
  'sidebar-13': {
    component: dynamic(() => import('@/registry/blocks/sidebar-13/page')),
    description: 'A sidebar in a dialog.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-13/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-13/_components/settings-dialog.tsx',
        target: 'app/dashboard/_components/settings-dialog.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-13',
    title: 'Sidebar 13',
  },
  'sidebar-14': {
    component: dynamic(() => import('@/registry/blocks/sidebar-14/page')),
    description: 'A sidebar on the right.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-14/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-14/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-14',
    title: 'Sidebar 14',
  },
  'sidebar-15': {
    component: dynamic(() => import('@/registry/blocks/sidebar-15/page')),
    description: 'A left and right sidebar.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-15/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/calendars.tsx',
        target: 'app/dashboard/_components/calendars.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/date-picker.tsx',
        target: 'app/dashboard/_components/date-picker.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/nav-favorites.tsx',
        target: 'app/dashboard/_components/nav-favorites.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/nav-main.tsx',
        target: 'app/dashboard/_components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/nav-secondary.tsx',
        target: 'app/dashboard/_components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/nav-user.tsx',
        target: 'app/dashboard/_components/nav-user.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/nav-workspaces.tsx',
        target: 'app/dashboard/_components/nav-workspaces.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/sidebar-left.tsx',
        target: 'app/dashboard/_components/sidebar-left.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/sidebar-right.tsx',
        target: 'app/dashboard/_components/sidebar-right.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-15/_components/team-switcher.tsx',
        target: 'app/dashboard/_components/team-switcher.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-15',
    title: 'Sidebar 15',
  },
  'sidebar-16': {
    component: dynamic(() => import('@/registry/blocks/sidebar-16/page')),
    description: 'A sidebar with a sticky site header.',
    files: [
      {
        path: 'src/registry/blocks/sidebar-16/page.tsx',
        target: 'app/dashboard/page.tsx',
        type: 'registry:page',
      },
      {
        path: 'src/registry/blocks/sidebar-16/_components/app-sidebar.tsx',
        target: 'app/dashboard/_components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-16/_components/nav-main.tsx',
        target: 'app/dashboard/_components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-16/_components/nav-projects.tsx',
        target: 'app/dashboard/_components/nav-projects.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-16/_components/nav-secondary.tsx',
        target: 'app/dashboard/_components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-16/_components/nav-user.tsx',
        target: 'app/dashboard/_components/nav-user.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-16/_components/search-form.tsx',
        target: 'app/dashboard/_components/search-form.tsx',
        type: 'registry:component',
      },
      {
        path: 'src/registry/blocks/sidebar-16/_components/site-header.tsx',
        target: 'app/dashboard/_components/site-header.tsx',
        type: 'registry:component',
      },
    ],
    slug: 'sidebar-16',
    title: 'Sidebar 16',
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
