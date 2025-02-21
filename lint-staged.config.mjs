const config = {
  '*.{js,mjs,jsx,ts,tsx}': ['prettier --list-different --write'],
  '*.{json,md}': ['prettier --list-different --write'],
};

export default config;
