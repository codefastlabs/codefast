import sharedConfig from '@codefast/config-tailwind/tailwind.config';
import { type Config } from 'tailwindcss';

const tailwindcssConfig: Config = {
  content: [
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@codefast/ui/dist/**/*.js',
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
