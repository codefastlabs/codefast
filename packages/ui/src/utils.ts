import { twMerge } from "tailwind-merge";
import { defineConfig } from "cva";

export const {
  cva,
  cx: cn,
  compose,
} = defineConfig({
  hooks: {
    onComplete: (className) => twMerge(className),
  },
});
