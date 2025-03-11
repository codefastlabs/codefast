import type { Registry } from '@/types/registry';

export const blocks: Registry['items'] = [
  {
    name: 'sidebar-01',
    type: 'registry:block',
    description: 'A simple sidebar with navigation grouped by section.',
    files: [
      {
        path: '@/registry/blocks/sidebar-01/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-01/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-01/components/search-form.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-01/components/version-switcher.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-02',
    description: 'A sidebar with collapsible sections.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-02/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-02/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-02/components/search-form.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-02/components/version-switcher.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-03',
    description: 'A sidebar with submenus.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-03/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-03/components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-04',
    description: 'A floating sidebar with submenus.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-04/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-04/components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-05',
    description: 'A sidebar with collapsible submenus.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-05/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-05/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-05/components/search-form.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-06',
    description: 'A sidebar with submenus as dropdowns.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-06/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-06/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-06/components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-06/components/sidebar-opt-in-form.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-07',
    type: 'registry:block',
    description: 'A sidebar that collapses to icons.',
    files: [
      {
        path: '@/registry/blocks/sidebar-07/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-07/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-07/components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-07/components/nav-projects.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-07/components/nav-user.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-07/components/team-switcher.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-08',
    description: 'An inset sidebar with secondary navigation.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-08/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-08/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-08/components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-08/components/nav-projects.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-08/components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-08/components/nav-user.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-09',
    description: 'Collapsible nested sidebars.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-09/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-09/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-09/components/nav-user.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-10',
    description: 'A sidebar in a popover.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-10/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-10/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-10/components/nav-actions.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-10/components/nav-favorites.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-10/components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-10/components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-10/components/nav-workspaces.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-10/components/team-switcher.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-11',
    description: 'A sidebar with a collapsible file tree.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-11/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-11/components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-12',
    description: 'A sidebar with a calendar.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-12/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-12/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-12/components/calendars.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-12/components/date-picker.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-12/components/nav-user.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-13',
    description: 'A sidebar in a dialog.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-13/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-13/components/settings-dialog.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-14',
    description: 'A sidebar on the right.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-14/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-14/components/app-sidebar.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-15',
    description: 'A left and right sidebar.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-15/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/calendars.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/date-picker.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/nav-favorites.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/nav-user.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/nav-workspaces.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/sidebar-left.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/sidebar-right.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-15/components/team-switcher.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'sidebar-16',
    description: 'A sidebar with a sticky site header.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/sidebar-16/page.tsx',
        type: 'registry:page',
        target: 'app/dashboard/page.tsx',
      },
      {
        path: '@/registry/blocks/sidebar-16/components/app-sidebar.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-16/components/nav-main.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-16/components/nav-projects.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-16/components/nav-secondary.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-16/components/nav-user.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-16/components/search-form.tsx',
        type: 'registry:component',
      },
      {
        path: '@/registry/blocks/sidebar-16/components/site-header.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['sidebar', 'dashboard'],
  },
  {
    name: 'login-01',
    description: 'A simple login form.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/login-01/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: '@/registry/blocks/login-01/components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['authentication', 'login'],
  },
  {
    name: 'login-02',
    description: 'A two column login page with a cover image.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/login-02/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: '@/registry/blocks/login-02/components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['authentication', 'login'],
  },
  {
    name: 'login-03',
    description: 'A login page with a muted background color.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/login-03/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: '@/registry/blocks/login-03/components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['authentication', 'login'],
  },
  {
    name: 'login-04',
    description: 'A login page with form and image.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/login-04/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: '@/registry/blocks/login-04/components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['authentication', 'login'],
  },
  {
    name: 'login-05',
    description: 'A simple email-only login page.',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/login-05/page.tsx',
        target: 'app/login/page.tsx',
        type: 'registry:page',
      },
      {
        path: '@/registry/blocks/login-05/components/login-form.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['authentication', 'login'],
  },
  {
    name: 'products-01',
    description: 'A table of products',
    type: 'registry:block',
    files: [
      {
        path: '@/registry/blocks/products-01/page.tsx',
        type: 'registry:page',
        target: 'app/products/page.tsx',
      },
      {
        path: '@/registry/blocks/products-01/components/products-table.tsx',
        type: 'registry:component',
      },
    ],
  },
];
