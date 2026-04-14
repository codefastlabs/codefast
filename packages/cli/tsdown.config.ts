import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  entry: ["src/**/*.ts", "!src/**/*.(test|spec).ts"],
  unbundle: true,
});
