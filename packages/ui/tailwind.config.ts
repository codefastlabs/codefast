import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  plugins: [],
  theme: {
    extend: {
      fontFamily: {
        sans: `var(--font-sans, ${fontFamily.sans.join(", ")})`,
      },
    },
  },
};

export default config;
