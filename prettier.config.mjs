/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import('prettier').Config}
 */
const config = {
  plugins: ['prettier-plugin-packagejson', 'prettier-plugin-tailwindcss'],
  printWidth: 120,
  singleQuote: true,
  tailwindAttributes: ['classNames'],
  tailwindFunctions: ['tv'],
};

export default config;
