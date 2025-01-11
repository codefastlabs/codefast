import type { Config } from 'tailwindcss';

import defaultTheme from 'tailwindcss/defaultTheme';

import animate from '@/plugin/animate.plugin';
import base from '@/plugin/base.plugin';

const tailwindcssConfig: Config = {
  darkMode: 'class',
  plugins: [base, animate],
  theme: {
    extend: {
      animation: {
        'caret-blink': 'caret-blink 1000ms ease infinite',
        'collapsible-closed': 'collapsible-closed 200ms ease',
        'collapsible-open': 'collapsible-open 200ms ease',
      },
      borderColor: {
        DEFAULT: 'hsl(var(--color-border) / <alpha-value>)',
      },
      borderRadius: {
        '2xl': 'calc(var(--radius, 0.25rem) + 0.75rem)', // 16px
        '3xl': 'calc(var(--radius, 0.25rem) + 1.25rem)', // 24px
        DEFAULT: 'var(--radius, 0.25rem)', // 4px
        lg: 'calc(var(--radius, 0.25rem) + 0.25rem)', // 8px
        md: 'calc(var(--radius, 0.25rem) + 0.125rem)', // 6px
        sm: 'calc(var(--radius, 0.25rem) - 0.125rem)', // 2px
        xl: 'calc(var(--radius, 0.25rem) + 0.5rem)', // 12px
      },
      colors: {
        accent: {
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          foreground: 'hsl(var(--color-accent-foreground) / <alpha-value>)',
        },
        background: 'hsl(var(--color-background) / <alpha-value>)',
        border: 'hsl(var(--color-border) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--color-card) / <alpha-value>)',
          foreground: 'hsl(var(--color-card-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-destructive) / <alpha-value>)',
          foreground: 'hsl(var(--color-destructive-foreground) / <alpha-value>)',
        },
        foreground: 'hsl(var(--color-foreground) / <alpha-value>)',
        info: {
          DEFAULT: 'hsl(var(--color-info) / <alpha-value>)',
          foreground: 'hsl(var(--color-info-foreground) / <alpha-value>)',
        },
        input: 'hsl(var(--color-input) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--color-muted) / <alpha-value>)',
          foreground: 'hsl(var(--color-muted-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--color-popover) / <alpha-value>)',
          foreground: 'hsl(var(--color-popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--color-primary) / <alpha-value>)',
          foreground: 'hsl(var(--color-primary-foreground) / <alpha-value>)',
        },
        ring: 'hsl(var(--color-ring) / <alpha-value>)',
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--color-secondary-foreground) / <alpha-value>)',
        },
        sidebar: {
          accent: 'hsl(var(--color-sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'hsl(var(--color-sidebar-accent-foreground) / <alpha-value>)',
          border: 'hsl(var(--color-sidebar-border) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-sidebar-background) / <alpha-value>)',
          foreground: 'hsl(var(--color-sidebar-foreground) / <alpha-value>)',
          primary: 'hsl(var(--color-sidebar-primary) / <alpha-value>)',
          'primary-foreground': 'hsl(var(--color-sidebar-primary-foreground) / <alpha-value>)',
          ring: 'hsl(var(--color-sidebar-ring) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--color-success) / <alpha-value>)',
          foreground: 'hsl(var(--color-success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--color-warning) / <alpha-value>)',
          foreground: 'hsl(var(--color-warning-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: `var(--font-sans, ${defaultTheme.fontFamily.sans.join(', ')})`,
      },
      keyframes: {
        'caret-blink': {
          '0%,70%,100%': {
            opacity: '1',
          },
          '20%,50%': {
            opacity: '0',
          },
        },
        'collapsible-closed': {
          from: {
            height: 'var(--radix-collapsible-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'collapsible-open': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-collapsible-content-height)',
          },
        },
      },
      spacing: {
        0.75: '0.1875rem', // 3px
        1.25: '0.3125rem', // 5px
        1.75: '0.4375rem', // 7px
        2.25: '0.5625rem', // 9px
        2.75: '0.6875rem', // 11px
        3.25: '0.8125rem', // 13px
        3.75: '0.9375rem', // 15px
        4.25: '1.0625rem', // 17px
        4.5: '1.125rem', // 18px
        4.75: '1.1875rem', // 19px
        5.25: '1.3125rem', // 21px
        5.5: '1.375rem', // 22px
        5.75: '1.4375rem', // 23px
        6.25: '1.5625rem', // 25px
        6.5: '1.625rem', // 26px
        6.75: '1.6875rem', // 27px
        7.25: '1.8125rem', // 29px
        7.5: '1.875rem', // 30px
        7.75: '1.9375rem', // 31px
        8.25: '2.0625rem', // 33px
        8.5: '2.125rem', // 34px
        8.75: '2.1875rem', // 35px
        9.25: '2.3125rem', // 37px
        9.5: '2.375rem', // 38px
        9.75: '2.4375rem', // 39px
        10.25: '2.5625rem', // 41px
        10.5: '2.625rem', // 42px
        10.75: '2.6875rem', // 43px
        11.25: '2.8125rem', // 45px
        11.5: '2.875rem', // 46px
        11.75: '2.9375rem', // 47px
        12.25: '3.0625rem', // 49px
        12.5: '3.125rem', // 50px
        12.75: '3.1875rem', // 51px
        18: '4.5rem', // 72px
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
};

export default tailwindcssConfig;
