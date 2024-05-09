import plugin from 'tailwindcss/plugin';

const base = plugin(({ addBase }) => {
  addBase({
    '.dark': {
      'color-scheme': 'dark',
    },
    body: {
      '@apply bg-background text-foreground': '',
    },
    ':focus-visible': {
      '@apply outline-ring': '',
    },
    "button, [role='button'], input:where([type='button']), input:where([type='reset']), input:where([type='submit'])":
      {
        '@apply outline-transparent': '',
      },
    a: {
      '@apply text-primary': '',
    },
  });
});

export default base;
