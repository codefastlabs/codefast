const config = {
  "*.{js,mjs,jsx,ts,tsx}": ["biome check --write", "biome format --write"],
  "*.{json,css,scss,md}": ["biome format --write"],
};

export default config;
