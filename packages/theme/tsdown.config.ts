import { defineConfig } from "tsdown";

const isWatch =
  process.argv.includes("--watch") || process.argv.includes("-w");

export default defineConfig({
  entry: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/**/*.spec.ts",
    "!src/**/*.spec.tsx",
    "!src/**/*.e2e.ts",
    "!src/**/*.e2e.tsx",
    "!src/**/*.story.ts",
    "!src/**/*.story.tsx",
    "!src/**/*.stories.ts",
    "!src/**/*.stories.tsx",
  ],
  tsconfig: "tsconfig.build.json",
  unbundle: true,
  root: "src",
  platform: "browser",
  dts: true,
  clean: !isWatch,
  hash: false,
  format: "esm",
});
