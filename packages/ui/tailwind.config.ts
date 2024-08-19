import { type Config } from 'tailwindcss';
import sharedConfig from '@codefast/config-tailwind/tailwind.config';

const tailwindcssConfig: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  presets: [sharedConfig],
};

export default tailwindcssConfig;
