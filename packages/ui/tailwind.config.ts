import sharedConfig from '@codefast/tailwind-config';
import { type Config } from 'tailwindcss';

const tailwindcssConfig: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  presets: [sharedConfig],
};

export default tailwindcssConfig;
