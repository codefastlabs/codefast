import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class"],
  plugins: [],
  theme: {
    extend: {
      borderRadius: {
        inherit: "inherit",
        sm: "calc(var(--radius, 0.25rem) - 0.125px)", // 2px
        DEFAULT: "var(--radius, 0.25rem)", // 4px
        md: "calc(var(--radius, 0.25rem) + 0.125rem)", // 6px
        lg: "calc(var(--radius, 0.25rem) + 0.25rem)", // 8px
        xl: "calc(var(--radius, 0.25rem) + 0.5rem)", // 12px
        "2xl": "calc(var(--radius, 0.25rem) + 0.75rem)", // 16px
        "3xl": "calc(var(--radius, 0.25rem) + 1.25rem)", // 24px
      },
      colors: {
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        background: "hsl(var(--background))",
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        foreground: "hsl(var(--foreground))",
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        input: "hsl(var(--input))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        ring: "hsl(var(--ring))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      fontFamily: {
        sans: `var(--font-sans, ${fontFamily.sans.join(", ")})`,
      },
    },
  },
};

export default config;
