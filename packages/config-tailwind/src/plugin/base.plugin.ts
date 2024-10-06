import plugin from 'tailwindcss/plugin';

const base = plugin(({ addBase }) => {
  addBase({
    body: {
      '@apply bg-background text-foreground': '',
    },
    ':focus-visible': {
      '@apply outline-ring': '',
    },
    '::selection': {
      '@apply bg-primary text-background': '',
    },
    'input:-webkit-autofill, textarea:-webkit-autofill, select:-webkit-autofill':
      {
        '-webkit-box-shadow':
          '0 0 0 1000px hsl(var(--background)) inset !important',
        '-webkit-text-fill-color': 'hsl(var(--foreground)) !important',
        'box-shadow': '0 0 0 1000px hsl(var(--background)) inset !important',
      },
    "button, [role='button'], input:where([type='button']), input:where([type='reset']), input:where([type='submit'])":
      {
        '@apply outline-transparent': '',
      },
  });
});

export default base;
