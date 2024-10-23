import plugin from 'tailwindcss/plugin';

const base = plugin(({ addBase }) => {
  addBase({
    body: {
      '@apply bg-background text-foreground': '',
    },
    'input, textarea, select': {
      '&:-webkit-autofill': {
        '&, &:hover, &:focus': {
          'box-shadow': 'inset 0 0 0 1000px hsl(var(--background))',
          '-webkit-box-shadow': 'inset 0 0 0 1000px hsl(var(--background)) ',
        },
      },
    },
    "button, [role='button']": {
      '@apply outline-transparent': '',
    },
    input: {
      "&[type='button'], &[type='reset'], &[type='submit']": {
        '@apply outline-transparent': '',
      },
      '&::-webkit-search-cancel-button, &::-webkit-search-decoration': {
        '@apply appearance-none': '',
      },
    },
    ':focus-visible': {
      '@apply outline-ring': '',
    },
    '::selection': {
      '@apply bg-primary text-background': '',
    },
  });
});

export default base;
