const config = {
  "*.{js,mjs,jsx,ts,tsx}": ["prettier --list-different --write"],
  "*.{json,css,scss,md}": ["prettier --list-different --write"],
};

export default config;
