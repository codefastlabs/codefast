import sharedConfig from '@codefast/ui/tailwind.config';
import plugin from 'tailwindcss/plugin';
import { colors } from '@codefast/ui/colors';
import type { Config } from 'tailwindcss';

const tailwindcssConfig: Config = {
  content: [
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@codefast/ui/dist/**/*.mjs',
  ],
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--accent': colors.slate[100].hslChannel,
          '--accent-foreground': colors.slate[900].hslChannel,
          '--background': colors.white.hslChannel,
          '--border': colors.slate[200].hslChannel,
          '--card': colors.white.hslChannel,
          '--card-foreground': colors.slate[950].hslChannel,
          '--destructive': colors.red[500].hslChannel,
          '--destructive-foreground': colors.red[50].hslChannel,
          '--foreground': colors.slate[950].hslChannel,
          '--info': colors.cyan[500].hslChannel,
          '--info-foreground': colors.cyan[50].hslChannel,
          '--input': colors.slate[200].hslChannel,
          '--muted': colors.slate[100].hslChannel,
          '--muted-foreground': colors.slate[500].hslChannel,
          '--popover': colors.white.hslChannel,
          '--popover-foreground': colors.slate[950].hslChannel,
          '--primary': colors.blue[500].hslChannel,
          '--primary-foreground': colors.slate[50].hslChannel,
          '--ring': colors.blue[500].hslChannel,
          '--secondary': colors.slate[100].hslChannel,
          '--secondary-foreground': colors.slate[900].hslChannel,
          '--success': colors.green[500].hslChannel,
          '--success-foreground': colors.green[50].hslChannel,
          '--warning': colors.yellow[500].hslChannel,
          '--warning-foreground': colors.yellow[50].hslChannel,
          '--radius': '0.25rem',
        },
        '.dark': {
          '--accent': colors.neutral[900].hslChannel,
          '--accent-foreground': colors.neutral[100].hslChannel,
          '--background': colors.neutral[950].hslChannel,
          '--border': colors.neutral[800].hslChannel,
          '--card': colors.neutral[950].hslChannel,
          '--card-foreground': colors.neutral[50].hslChannel,
          '--destructive': colors.red[500].hslChannel,
          '--destructive-foreground': colors.red[950].hslChannel,
          '--foreground': colors.neutral[50].hslChannel,
          '--info': colors.cyan[500].hslChannel,
          '--info-foreground': colors.cyan[950].hslChannel,
          '--input': colors.neutral[800].hslChannel,
          '--muted': colors.neutral[900].hslChannel,
          '--muted-foreground': colors.neutral[500].hslChannel,
          '--popover': colors.neutral[950].hslChannel,
          '--popover-foreground': colors.neutral[50].hslChannel,
          '--primary': colors.blue[500].hslChannel,
          '--primary-foreground': colors.neutral[950].hslChannel,
          '--ring': colors.blue[500].hslChannel,
          '--secondary': colors.neutral[900].hslChannel,
          '--secondary-foreground': colors.neutral[100].hslChannel,
          '--success': colors.green[500].hslChannel,
          '--success-foreground': colors.green[950].hslChannel,
          '--warning': colors.yellow[500].hslChannel,
          '--warning-foreground': colors.yellow[950].hslChannel,
        },
      });
    }),
  ],
  presets: [sharedConfig],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
};

export default tailwindcssConfig;
