/**
 * Complex Benchmark Data
 *
 * Data specific to complex variant benchmarks
 */

export const complexVariants = {
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background select-none cursor-pointer antialiased transform-gpu',
  compoundVariants: [
    {
      class: 'text-lg font-bold shadow-lg transform scale-105',
      size: 'lg',
      variant: 'destructive',
    },
    {
      class: 'cursor-not-allowed grayscale',
      disabled: true,
      loading: true,
    },
    {
      class: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl',
      size: 'xl',
      variant: 'gradient',
    },
    {
      class: 'border-2 border-dashed animate-pulse',
      loading: true,
      variant: 'outline',
    },
    {
      class: 'rounded-full px-6',
      rounded: 'full',
      size: ['sm', 'default', 'lg'],
    },
    {
      class: 'backdrop-blur-sm bg-white/10',
      glass: true,
      variant: ['ghost', 'secondary'],
    },
  ],
  defaultVariants: {
    disabled: false,
    glass: false,
    loading: false,
    rounded: 'md',
    shadow: 'none',
    size: 'default',
    variant: 'default',
  },
  variants: {
    disabled: {
      false: '',
      true: 'opacity-50 pointer-events-none cursor-not-allowed',
    },
    glass: {
      false: '',
      true: 'backdrop-blur-md bg-white/20 border border-white/30',
    },
    loading: {
      false: '',
      true: 'animate-spin cursor-wait',
    },
    rounded: {
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      full: 'rounded-full',
      lg: 'rounded-lg',
      md: 'rounded-md',
      none: 'rounded-none',
      sm: 'rounded-sm',
      xl: 'rounded-xl',
    },
    shadow: {
      '2xl': 'shadow-2xl',
      colored: 'shadow-lg shadow-primary/25',
      inner: 'shadow-inner',
      lg: 'shadow-lg',
      md: 'shadow-md',
      none: '',
      sm: 'shadow-sm',
      xl: 'shadow-xl',
    },
    size: {
      '2xl': 'h-14 px-12 py-5 text-xl min-w-14 gap-3',
      default: 'h-10 px-4 py-2 text-sm min-w-10 gap-2',
      icon: 'h-10 w-10 p-0',
      'icon-lg': 'h-12 w-12 p-0',
      'icon-sm': 'h-8 w-8 p-0',
      'icon-xl': 'h-14 w-14 p-0',
      'icon-xs': 'h-6 w-6 p-0',
      lg: 'h-11 px-8 py-3 text-base min-w-11 gap-2',
      sm: 'h-9 px-3 py-2 text-sm min-w-9 gap-1.5',
      xl: 'h-12 px-10 py-4 text-lg min-w-12 gap-2.5',
      xs: 'h-8 px-2 py-1 text-xs min-w-8 gap-1',
    },
    variant: {
      dark: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 focus:bg-gray-800 focus:ring-gray-500/20',
      default:
        'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 focus:bg-primary/90 focus:ring-primary/20',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus:bg-destructive/90 focus:ring-destructive/20',
      ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent focus:ring-accent/20',
      gradient:
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 focus:ring-purple-500/20',
      'gradient-blue':
        'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 focus:ring-blue-500/20',
      'gradient-green':
        'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 focus:ring-green-500/20',
      info: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:bg-blue-700 focus:ring-blue-500/20',
      light:
        'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 focus:bg-gray-50 focus:ring-gray-500/20',
      link: 'text-primary underline-offset-4 hover:underline active:text-primary/80 focus:text-primary/90 focus:ring-primary/20',
      outline:
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent focus:ring-accent/20',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 focus:bg-secondary/80 focus:ring-secondary/20',
      success:
        'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:bg-green-700 focus:ring-green-500/20',
      warning:
        'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 focus:bg-yellow-700 focus:ring-yellow-500/20',
    },
  },
};

export const complexTestProps = [
  {},
  { size: 'lg', variant: 'destructive' },
  { disabled: true, loading: true },
  { disabled: false, size: 'sm', variant: 'outline' },
  { loading: true, size: 'icon', variant: 'ghost' },
  { className: 'custom-class', disabled: true, variant: 'link' },
  { rounded: '2xl', shadow: 'xl', size: 'xl', variant: 'gradient' },
  { glass: true, size: 'xs', variant: 'success' },
  { loading: true, shadow: 'colored', variant: 'outline' },
  { rounded: 'full', size: '2xl', variant: 'gradient-blue' },
  { glass: true, shadow: 'lg', variant: 'warning' },
  { rounded: '3xl', size: 'icon-xl', variant: 'dark' },
  { disabled: false, shadow: '2xl', variant: 'gradient-green' },
  { loading: false, size: 'icon-xs', variant: 'light' },
];
