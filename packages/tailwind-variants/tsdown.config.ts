import { defineConfig } from "tsdown";

const isWatch =
  process.argv.includes("--watch") || process.argv.includes("-w");

export default defineConfig({
  entry: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.e2e.ts",
    "!src/**/*.story.ts",
    "!src/**/*.stories.ts",
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
