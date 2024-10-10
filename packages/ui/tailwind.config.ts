import sharedConfig from '@codefast/config-tailwind';
import { type Config } from 'tailwindcss';

const tailwindcssConfig: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  presets: [sharedConfig],
};

export default tailwindcssConfig;
