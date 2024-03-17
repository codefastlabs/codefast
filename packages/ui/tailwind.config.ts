import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class"],
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": {
          "--accent": "210 40% 96.1%", // slate.100
          "--accent-foreground": "222.2 47.4% 11.2%", // slate.900
          "--background": "0 0% 100%", // white
          "--border": "214.3 31.8% 91.4%", // slate.200
          "--card": "0 0% 100%", // white
          "--card-foreground": "222.2 84% 4.9%", // slate.950
          "--destructive": "0 84.2% 60.2%", // red.500
          "--destructive-foreground": "210 40% 98%", // slate.50
          "--foreground": "222.2 84% 4.9%", // slate.950
          "--info": "",
          "--info-foreground": "",
          "--input": "214.3 31.8% 91.4%", // slate.200
          "--muted": "210 40% 96.1%", // slate.100
          "--muted-foreground": "215.4 16.3% 46.9%", // slate.500
          "--popover": "0 0% 100%", // white
          "--popover-foreground": "222.2 84% 4.9%", // slate.950
          "--primary": "221.2 83.2% 53.3%", // blue.600
          "--primary-foreground": "210 40% 98%", // slate.50
          "--radius": "0.25rem",
          "--ring": "221.2 83.2% 53.3%", // blue.600
          "--secondary": "210 40% 96.1%", // slate.100
          "--secondary-foreground": "222.2 47.4% 11.2%", // slate.900
          "--success": "",
          "--success-foreground": "",
          "--warning": "",
          "--warning-foreground": "",
        },
      });
      addBase({
        ".dark": {
          "--accent": "217.2 32.6% 17.5%", // slate.800
          "--accent-foreground": "210 40% 98%", // slate.50
          "--background": "222.2 84% 4.9%", // slate.950
          "--border": "217.2 32.6% 17.5%", // slate.800
          "--card": "222.2 84% 4.9%", // slate.950
          "--card-foreground": "210 40% 98%", // slate.50
          "--destructive": "0 62.8% 30.6%", // red.900
          "--destructive-foreground": "210 40% 98%", // slate.50
          "--foreground": "210 40% 98%", // slate.50
          "--info": "",
          "--info-foreground": "",
          "--input": "217.2 32.6% 17.5%", // slate.800
          "--muted": "217.2 32.6% 17.5%", // slate.800
          "--muted-foreground": "215 20.2% 65.1%", // slate.400
          "--popover": "222.2 84% 4.9%", // slate.950
          "--popover-foreground": "210 40% 98%", // slate.50
          "--primary": "217.2 91.2% 59.8%", // blue.500
          "--primary-foreground": "222.2 47.4% 11.2%", // slate.900
          "--ring": "224.3 76.3% 48%", // blue.700
          "--secondary": "217.2 32.6% 17.5%", // slate.800
          "--secondary-foreground": "210 40% 98%", // slate.50
          "--success": "",
          "--success-foreground": "",
          "--warning": "",
          "--warning-foreground": "",
        },
      });
      addBase({
        ".dark": {
          "color-scheme": "dark",
        },
      });
      addBase({
        body: {
          "@apply bg-background text-foreground": {},
        },
      });
    }),
  ],
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
