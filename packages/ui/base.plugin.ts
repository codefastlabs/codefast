import plugin from "tailwindcss/plugin";

const base = plugin(({ addBase }) => {
  addBase({
    ".dark": {
      "color-scheme": "dark",
    },
    body: {
      "@apply bg-background text-foreground": "",
    },
  });
});

export default base;
