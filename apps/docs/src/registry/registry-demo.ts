import type { Registry } from '@/types/registry';

export const ui: Registry['items'] = [
  {
    name: 'accordion',
    type: 'registry:demo',
  },
  {
    name: 'alert',
    type: 'registry:demo',
  },
  {
    name: 'alert-dialog',
    type: 'registry:demo',
  },
  {
    name: 'aspect-ratio',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/aspect-ratio-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'aspect-ratio'],
  },
  {
    name: 'avatar',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/avatar-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'avatar'],
  },
  {
    name: 'badge',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/badge-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'badge'],
  },
  {
    name: 'breadcrumb',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/breadcrumb-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'breadcrumb'],
  },
  {
    name: 'button',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/button-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'button'],
  },
  {
    name: 'calendar',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/calendar-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'calendar'],
  },
  {
    name: 'card',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/card-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'card'],
  },
  {
    name: 'carousel',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/carousel-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'carousel'],
  },
  {
    name: 'chart',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/chart-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'chart'],
  },
  {
    name: 'checkbox',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/checkbox-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'checkbox'],
  },
  {
    name: 'collapsible',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/collapsible-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'collapsible'],
  },
  {
    name: 'command',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/command-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'command'],
  },
  {
    name: 'combobox',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/combobox-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'combobox'],
  },
  {
    name: 'context-menu',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/context-menu-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'context-menu'],
  },
  {
    name: 'dialog',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/dialog-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'dialog'],
  },
  {
    name: 'drawer',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/drawer-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'drawer'],
  },
  {
    name: 'dropdown-menu',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/dropdown-menu-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'dropdown-menu'],
  },
  {
    name: 'form',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/form-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'form'],
  },
  {
    name: 'hover-card',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/hover-card-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'hover-card'],
  },
  {
    name: 'input',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/input-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'input'],
  },
  {
    name: 'input-otp',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/input-otp-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'input-otp'],
  },
  {
    name: 'label',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/label-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'label'],
  },
  {
    name: 'menubar',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/menubar-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'menubar'],
  },
  {
    name: 'navigation-menu',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/navigation-menu-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'navigation-menu'],
  },
  {
    name: 'pagination',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/pagination-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'pagination'],
  },
  {
    name: 'popover',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/popover-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'popover'],
  },
  {
    name: 'progress',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/progress-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'progress'],
  },
  {
    name: 'radio-group',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/radio-group-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'radio-group'],
  },
  {
    name: 'resizable',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/resizable-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'resizable'],
  },
  {
    name: 'scroll-area',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/scroll-area-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'scroll-area'],
  },
  {
    name: 'select',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/select-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'select'],
  },
  {
    name: 'separator',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/separator-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'separator'],
  },
  {
    name: 'sheet',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/sheet-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'sheet'],
  },
  {
    name: 'sidebar',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/sidebar-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'sidebar'],
  },
  {
    name: 'skeleton',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/skeleton-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'skeleton'],
  },
  {
    name: 'slider',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/slider-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'slider'],
  },
  {
    name: 'sonner',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/sonner-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'sonner'],
  },
  {
    name: 'switch',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/switch-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'switch'],
  },
  {
    name: 'table',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/table-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'table'],
  },
  {
    name: 'tabs',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/tabs-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'tabs'],
  },
  {
    name: 'textarea',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/textarea-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'textarea'],
  },
  {
    name: 'toast',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/toast-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'toast'],
  },
  {
    name: 'toggle',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/toggle-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'toggle'],
  },
  {
    name: 'toggle-group',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/toggle-group-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'toggle-group'],
  },
  {
    name: 'tooltip',
    type: 'registry:demo',
    files: [
      {
        path: '@/registry/demos/tooltip-demo.tsx',
        type: 'registry:component',
      },
    ],
    categories: ['demos', 'tooltip'],
  },
];
