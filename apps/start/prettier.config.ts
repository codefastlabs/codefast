import type { Config } from 'prettier';

const config: Config = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSpacing: true,
  jsxSingleQuote: false,
  bracketSameLine: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
  quoteProps: 'as-needed',
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
