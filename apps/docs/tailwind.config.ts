import type { Config } from "tailwindcss";
import sharedConfig from "@codefast/ui/tailwind.config";

const config: Config = {
  content: [
    "./stories/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@codefast/ui/src/react/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
  presets: [sharedConfig],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
};

export default config;
