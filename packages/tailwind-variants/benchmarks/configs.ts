/**
 * Benchmark configurations for different scenarios
 */

export const benchmarkConfigs = {
  basic: {
    base: "base-class",
    defaultVariants: {
      color: "primary",
      size: "md",
    },
    variants: {
      color: {
        danger: "text-red-500",
        primary: "text-blue-500",
        secondary: "text-gray-500",
      },
      size: {
        lg: "text-lg",
        md: "text-base",
        sm: "text-sm",
      },
      variant: {
        ghost: "hover:bg-blue-100",
        outline: "border border-blue-500",
        solid: "bg-blue-500",
      },
    },
  },

  compound: {
    base: "base-class",
    compoundVariants: [
      {
        className: "text-blue-600 font-bold",
        color: "primary",
        size: "lg",
      },
      {
        className: "text-red-600 font-semibold",
        color: "danger",
        size: "sm",
      },
    ],
    defaultVariants: {
      color: "primary",
      size: "md",
    },
    variants: {
      color: {
        danger: "text-red-500",
        primary: "text-blue-500",
        secondary: "text-gray-500",
      },
      size: {
        lg: "text-lg",
        md: "text-base",
        sm: "text-sm",
      },
    },
  },

  slots: {
    base: "flex items-center gap-2",
    defaultVariants: {
      color: "primary",
      size: "sm",
    },
    slots: {
      base: "flex-1",
      icon: "w-4 h-4",
      label: "font-medium",
    },
    variants: {
      color: {
        primary: {
          base: "text-blue-500",
          icon: "text-blue-500",
          label: "text-blue-700",
        },
        secondary: {
          base: "text-gray-500",
          icon: "text-gray-500",
          label: "text-gray-700",
        },
      },
      size: {
        lg: {
          base: "text-lg",
          icon: "w-5 h-5",
          label: "text-base",
        },
        sm: {
          base: "text-sm",
          icon: "w-3 h-3",
          label: "text-xs",
        },
      },
    },
  },

  large: {
    base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    compoundVariants: [
      {
        className: "bg-red-600 hover:bg-red-700 text-white",
        color: "error",
        variant: "destructive",
      },
      {
        className: "border-green-500 text-green-600 hover:bg-green-50",
        color: "success",
        variant: "outline",
      },
      {
        className: "text-orange-600 hover:bg-orange-50",
        color: "warning",
        variant: "ghost",
      },
      {
        className: "font-bold shadow-lg",
        size: "lg",
        variant: "gradient",
      },
      {
        className: "animate-pulse",
        loading: true,
      },
      {
        className: "opacity-25 cursor-not-allowed",
        disabled: true,
        loading: true,
      },
      {
        className: "dark:border-gray-600 dark:text-gray-300",
        theme: "dark",
        variant: "outline",
      },
      {
        className: "bg-red-50 border-red-200 text-red-700",
        color: "error",
        variant: "filled",
      },
      {
        className: "text-white font-bold bg-gradient-to-r from-blue-500 to-purple-600",
        size: "xl",
        variant: "gradient",
      },
      {
        className: "backdrop-blur-sm bg-white/20 border border-white/30",
        variant: "glass",
      },
    ],
    defaultVariants: {
      color: "primary",
      disabled: false,
      loading: false,
      size: "default",
      theme: "light",
      variant: "default",
    },
    variants: {
      color: {
        error: "",
        info: "",
        primary: "",
        secondary: "",
        success: "",
        warning: "",
      },
      disabled: {
        false: "",
        true: "opacity-50 cursor-not-allowed",
      },
      loading: {
        false: "",
        true: "opacity-75 cursor-wait",
      },
      size: {
        default: "h-10 px-4 py-2",
        icon: "h-10 w-10",
        lg: "h-12 px-8 text-lg",
        sm: "h-8 px-3 text-xs",
        xl: "h-14 px-10 text-xl",
      },
      theme: {
        auto: "",
        dark: "dark",
        light: "",
      },
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        filled: "bg-muted/50",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        glass: "backdrop-blur-sm bg-white/20 border border-white/30",
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
        link: "text-primary underline-offset-4 hover:underline",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
  },

  // New comprehensive benchmark scenarios
  complexButton: {
    base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    compoundVariants: [
      {
        className: "bg-red-600 hover:bg-red-700",
        color: "error",
        variant: "destructive",
      },
      {
        className: "border-green-500 text-green-600 hover:bg-green-50",
        color: "success",
        variant: "outline",
      },
      {
        className: "text-orange-600 hover:bg-orange-50",
        color: "warning",
        variant: "ghost",
      },
      {
        className: "font-bold shadow-lg",
        size: "lg",
        variant: "gradient",
      },
      {
        className: "animate-pulse",
        loading: true,
      },
    ],
    defaultVariants: {
      color: "primary",
      disabled: false,
      loading: false,
      size: "default",
      variant: "default",
    },
    variants: {
      color: {
        error: "",
        info: "",
        primary: "",
        secondary: "",
        success: "",
        warning: "",
      },
      disabled: {
        false: "",
        true: "opacity-50 cursor-not-allowed",
      },
      loading: {
        false: "",
        true: "opacity-75 cursor-wait",
      },
      size: {
        default: "h-10 px-4 py-2",
        icon: "h-10 w-10",
        lg: "h-12 px-8 text-lg",
        sm: "h-8 px-3 text-xs",
        xl: "h-14 px-10 text-xl",
      },
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        glass: "backdrop-blur-sm bg-white/20 border border-white/30",
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
        link: "text-primary underline-offset-4 hover:underline",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
  },

  advancedCard: {
    base: "rounded-lg border bg-card text-card-foreground shadow-sm",
    compoundVariants: [
      {
        className: "shadow-2xl",
        elevated: true,
        variant: "elevated",
      },
      {
        className: "hover:bg-white/30",
        interactive: true,
        variant: "glass",
      },
      {
        className: "border-4",
        size: "lg",
        variant: "bordered",
      },
    ],
    defaultVariants: {
      elevated: false,
      interactive: false,
      size: "default",
      variant: "default",
    },
    slots: {
      actions: "flex items-center gap-2",
      content: "p-6 pt-0",
      description: "text-sm text-muted-foreground",
      footer: "flex items-center p-6 pt-0",
      header: "flex flex-col space-y-1.5 p-6",
      title: "text-2xl font-semibold leading-none tracking-tight",
    },
    variants: {
      elevated: {
        false: "",
        true: "shadow-xl",
      },
      interactive: {
        false: "",
        true: {
          base: "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
          header: "hover:bg-accent/50",
        },
      },
      size: {
        default: "",
        lg: {
          base: "p-8",
          content: "p-8 pt-0",
          footer: "p-8 pt-0",
          header: "p-8 pb-4",
        },
        sm: {
          base: "p-4",
          content: "p-4 pt-0",
          footer: "p-4 pt-0",
          header: "p-4 pb-2",
        },
      },
      variant: {
        bordered: {
          base: "border-2",
          header: "border-b-2",
        },
        default: "",
        elevated: {
          base: "shadow-lg",
          header: "bg-gradient-to-r from-gray-50 to-gray-100",
        },
        glass: {
          base: "backdrop-blur-sm bg-white/20 border border-white/30",
          header: "bg-white/10",
        },
        minimal: {
          base: "border-0 shadow-none",
          header: "pb-0",
        },
      },
    },
  },

  responsiveLayout: {
    base: "container mx-auto",
    compoundVariants: [
      {
        className: "w-full",
        layout: "fullscreen",
        sidebar: "hidden",
      },
      {
        className: "dark:bg-gray-900",
        layout: "centered",
        theme: "dark",
      },
      {
        className: "pl-16",
        responsive: false,
        sidebar: "collapsed",
      },
    ],
    defaultVariants: {
      layout: "default",
      responsive: true,
      sidebar: "collapsed",
      theme: "light",
    },
    slots: {
      content: "flex-1",
      footer: "border-t bg-background",
      header:
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      main: "lg:pl-64",
      mobileMenu: "lg:hidden",
      navigation: "flex items-center space-x-4 lg:space-x-6",
      sidebar: "hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:border-r",
    },
    variants: {
      layout: {
        centered: {
          base: "max-w-4xl",
          main: "flex flex-col items-center",
        },
        default: "",
        fullscreen: {
          base: "w-full max-w-none",
          main: "lg:pl-0",
          sidebar: "hidden",
        },
        sidebar: {
          base: "",
          sidebar: "lg:block",
        },
      },
      responsive: {
        false: {
          main: "pl-64",
          mobileMenu: "hidden",
          sidebar: "block",
        },
        true: "",
      },
      sidebar: {
        collapsed: {
          main: "lg:pl-16",
          sidebar: "lg:w-16",
        },
        expanded: "",
        hidden: {
          main: "lg:pl-0",
          sidebar: "hidden",
        },
      },
      theme: {
        auto: "",
        dark: {
          base: "dark",
          header: "dark:bg-background/95",
          sidebar: "dark:border-border",
        },
        light: "",
      },
    },
  },

  formComponents: {
    base: "space-y-6",
    compoundVariants: [
      {
        className: "bg-destructive/10",
        state: "error",
        variant: "filled",
      },
      {
        className: "border-green-500 bg-green-50",
        state: "success",
        variant: "outlined",
      },
      {
        className: "border-b-4",
        size: "lg",
        variant: "minimal",
      },
    ],
    defaultVariants: {
      required: false,
      size: "default",
      state: "default",
      variant: "default",
    },
    slots: {
      checkbox:
        "h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      error: "text-sm text-destructive",
      field: "space-y-2",
      help: "text-sm text-muted-foreground",
      input:
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      label:
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      radio:
        "h-4 w-4 border border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      select:
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      textarea:
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    },
    variants: {
      required: {
        false: "",
        true: {
          label: "after:content-['*'] after:ml-0.5 after:text-destructive",
        },
      },
      size: {
        default: "",
        lg: {
          input: "h-12 px-4 text-base",
          label: "text-base",
          select: "h-12 px-4 text-base",
          textarea: "min-h-[100px] px-4 text-base",
        },
        sm: {
          input: "h-8 px-2 text-xs",
          label: "text-xs",
          select: "h-8 px-2 text-xs",
          textarea: "min-h-[60px] px-2 text-xs",
        },
      },
      state: {
        default: "",
        error: {
          input: "border-destructive focus-visible:ring-destructive",
          label: "text-destructive",
          select: "border-destructive focus-visible:ring-destructive",
          textarea: "border-destructive focus-visible:ring-destructive",
        },
        success: {
          input: "border-green-500 focus-visible:ring-green-500",
          label: "text-green-600",
          select: "border-green-500 focus-visible:ring-green-500",
          textarea: "border-green-500 focus-visible:ring-green-500",
        },
        warning: {
          input: "border-yellow-500 focus-visible:ring-yellow-500",
          label: "text-yellow-600",
          select: "border-yellow-500 focus-visible:ring-yellow-500",
          textarea: "border-yellow-500 focus-visible:ring-yellow-500",
        },
      },
      variant: {
        default: "",
        filled: {
          input: "bg-muted/50",
          select: "bg-muted/50",
          textarea: "bg-muted/50",
        },
        minimal: {
          input: "border-0 border-b-2 rounded-none",
          select: "border-0 border-b-2 rounded-none",
          textarea: "border-0 border-b-2 rounded-none",
        },
        outlined: {
          input: "border-2",
          select: "border-2",
          textarea: "border-2",
        },
      },
    },
  },

  dataTable: {
    base: "w-full",
    compoundVariants: [
      {
        className: "even:bg-muted/50",
        striped: true,
        variant: "striped",
      },
      {
        className: "shadow-xl",
        size: "lg",
        variant: "elevated",
      },
      {
        className: "hover:bg-muted/70",
        hoverable: true,
        selectable: true,
      },
    ],
    defaultVariants: {
      hoverable: true,
      selectable: false,
      size: "default",
      sortable: false,
      striped: false,
      variant: "default",
    },
    slots: {
      container: "rounded-md border",
      filters: "flex items-center space-x-2",
      footer: "flex items-center justify-between space-x-2 py-4",
      header: "bg-muted/50",
      pagination: "flex items-center space-x-2",
      search: "flex items-center space-x-2",
      table: "w-full caption-bottom text-sm",
      tbody: "",
      td: "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      th: "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      thead: "",
      tr: "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
    },
    variants: {
      hoverable: {
        false: {
          tr: "hover:bg-transparent",
        },
        true: {
          tr: "hover:bg-muted/50",
        },
      },
      selectable: {
        false: "",
        true: {
          td: "[&:has([role=checkbox])]:pr-0",
          th: "[&:has([role=checkbox])]:pr-0",
          tr: "cursor-pointer",
        },
      },
      size: {
        default: "",
        lg: {
          td: "p-6 text-base",
          th: "h-16 px-6 text-base",
        },
        sm: {
          td: "p-2 text-xs",
          th: "h-8 px-2 text-xs",
        },
      },
      sortable: {
        false: "",
        true: {
          th: "cursor-pointer select-none",
        },
      },
      striped: {
        false: "",
        true: {
          tr: "even:bg-muted/30",
        },
      },
      variant: {
        bordered: {
          container: "border-2",
          tr: "border-b-2",
        },
        default: "",
        elevated: {
          container: "shadow-lg",
          header: "bg-gradient-to-r from-muted/50 to-muted/30",
        },
        minimal: {
          container: "border-0 shadow-none",
          header: "bg-transparent",
        },
        striped: {
          tr: "even:bg-muted/30",
        },
      },
    },
  },

  // Real-world component scenarios
  realWorldComponents: {
    base: "component-base",
    compoundVariants: [
      {
        className: "shadow-xl",
        size: "lg",
        variant: "elevated",
      },
      {
        className: "hover:bg-white/30",
        interactive: true,
        variant: "glass",
      },
      {
        className: "opacity-25",
        disabled: true,
        loading: true,
      },
      {
        className: "dark:border-gray-600",
        theme: "dark",
        variant: "outlined",
      },
      {
        className: "bg-red-50 border-red-200",
        color: "error",
        variant: "filled",
      },
      {
        className: "text-white font-bold",
        size: "xl",
        variant: "gradient",
      },
    ],
    defaultVariants: {
      color: "primary",
      disabled: false,
      interactive: false,
      loading: false,
      size: "default",
      theme: "light",
      variant: "default",
    },
    slots: {
      actions: "component-actions",
      avatar: "component-avatar",
      badge: "component-badge",
      container: "component-container",
      content: "component-content",
      description: "component-description",
      drawer: "component-drawer",
      dropdown: "component-dropdown",
      footer: "component-footer",
      header: "component-header",
      icon: "component-icon",
      label: "component-label",
      menu: "component-menu",
      modal: "component-modal",
      popover: "component-popover",
      tooltip: "component-tooltip",
    },
    variants: {
      color: {
        error: {
          base: "text-red-600",
          container: "border-red-200",
        },
        info: {
          base: "text-blue-600",
          container: "border-blue-200",
        },
        primary: {
          base: "text-primary",
          container: "border-primary/20",
        },
        secondary: {
          base: "text-secondary",
          container: "border-secondary/20",
        },
        success: {
          base: "text-green-600",
          container: "border-green-200",
        },
        warning: {
          base: "text-yellow-600",
          container: "border-yellow-200",
        },
      },
      disabled: {
        false: "",
        true: {
          base: "opacity-50 cursor-not-allowed",
          container: "pointer-events-none",
        },
      },
      interactive: {
        false: "",
        true: {
          base: "cursor-pointer transition-all duration-200",
          container: "hover:shadow-md",
        },
      },
      loading: {
        false: "",
        true: {
          base: "opacity-75 cursor-wait",
          container: "animate-pulse",
        },
      },
      size: {
        default: {
          base: "text-base",
          container: "p-4",
          content: "p-4",
          footer: "p-4",
          header: "p-4",
        },
        lg: {
          base: "text-lg",
          container: "p-6",
          content: "p-6",
          footer: "p-6",
          header: "p-6",
        },
        sm: {
          base: "text-sm",
          container: "p-2",
          content: "p-2",
          footer: "p-2",
          header: "p-2",
        },
        xl: {
          base: "text-xl",
          container: "p-8",
          content: "p-8",
          footer: "p-8",
          header: "p-8",
        },
        xs: {
          base: "text-xs",
          container: "p-1",
          content: "p-1",
          footer: "p-1",
          header: "p-1",
        },
      },
      theme: {
        auto: "",
        dark: {
          base: "dark",
          container: "dark:bg-gray-800",
        },
        light: "",
      },
      variant: {
        default: "",
        elevated: {
          base: "shadow-lg",
          container: "bg-white",
        },
        filled: {
          base: "bg-muted",
          container: "bg-muted/50",
        },
        ghost: {
          base: "bg-transparent",
          container: "hover:bg-muted/50",
        },
        glass: {
          base: "backdrop-blur-sm bg-white/20 border border-white/30",
          container: "bg-white/10",
        },
        gradient: {
          base: "bg-gradient-to-r from-blue-500 to-purple-600",
          container: "bg-white/10",
        },
        outlined: {
          base: "border-2",
          container: "bg-transparent",
        },
      },
    },
  },
} as const;

export const testCases = {
  advancedCard: [
    { interactive: false, size: "default", variant: "default" },
    { elevated: true, interactive: true, size: "lg", variant: "elevated" },
    { interactive: false, size: "sm", variant: "bordered" },
    { interactive: true, size: "default", variant: "minimal" },
    { interactive: true, size: "lg", variant: "glass" },
  ],
  basic: [
    { color: "primary", size: "md" },
    { color: "secondary", size: "lg", variant: "outline" },
    { color: "danger", size: "sm", variant: "solid" },
  ],
  // New comprehensive test cases
  complexButton: [
    { color: "primary", size: "default", variant: "default" },
    { color: "error", loading: true, size: "lg", variant: "destructive" },
    { color: "success", size: "sm", variant: "outline" },
    { color: "warning", size: "xl", variant: "ghost" },
    { loading: false, size: "lg", variant: "gradient" },
    { disabled: true, size: "default", variant: "glass" },
    { color: "info", size: "default", variant: "link" },
    { color: "primary", size: "icon", variant: "secondary" },
  ],
  compound: [
    { color: "primary", size: "lg" },
    { color: "danger", size: "sm" },
    { color: "secondary", size: "md" },
  ],
  dataTable: [
    { hoverable: true, size: "default", striped: false, variant: "default" },
    { selectable: true, size: "lg", striped: true, variant: "bordered" },
    { hoverable: false, size: "sm", sortable: true, variant: "striped" },
    { selectable: true, size: "default", sortable: true, variant: "elevated" },
  ],
  formComponents: [
    { required: false, size: "default", state: "default", variant: "default" },
    { required: true, size: "lg", state: "error", variant: "filled" },
    { required: false, size: "sm", state: "success", variant: "outlined" },
    { required: true, size: "default", state: "warning", variant: "minimal" },
  ],
  large: [
    { color: "primary", size: "default", variant: "default" },
    { color: "error", loading: true, size: "lg", variant: "destructive" },
    { color: "success", size: "sm", variant: "outline" },
    { color: "warning", size: "xl", variant: "ghost" },
    { loading: false, size: "lg", variant: "gradient" },
    { disabled: true, size: "default", variant: "glass" },
    { color: "info", size: "default", variant: "link" },
    { color: "primary", size: "icon", variant: "secondary" },
    { color: "error", size: "default", variant: "filled" },
    { color: "secondary", theme: "dark", variant: "outline" },
  ],
  responsiveLayout: [
    { layout: "default", responsive: true, sidebar: "expanded", theme: "light" },
    { layout: "centered", responsive: true, sidebar: "collapsed", theme: "dark" },
    { layout: "fullscreen", responsive: false, sidebar: "hidden", theme: "auto" },
    { layout: "sidebar", responsive: true, sidebar: "expanded", theme: "light" },
  ],
  slots: [
    { color: "primary", size: "sm" },
    { color: "secondary", size: "lg" },
  ],

  realWorldComponents: [
    { color: "primary", size: "default", theme: "light", variant: "default" },
    { color: "success", interactive: true, size: "lg", variant: "elevated" },
    { color: "error", loading: true, size: "xl", variant: "glass" },
    { color: "info", disabled: true, size: "default", variant: "gradient" },
    { color: "warning", size: "sm", theme: "dark", variant: "outlined" },
    { color: "secondary", interactive: true, size: "lg", variant: "filled" },
    { color: "primary", loading: false, size: "default", variant: "ghost" },
  ],
} as const;
