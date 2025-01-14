import plugin from 'tailwindcss/plugin';

const base = plugin(({ addBase }) => {
  addBase({
    '*': {
      scrollbarColor: 'var(--color-border) transparent',
      scrollbarWidth: 'thin',
    },

    '::-webkit-scrollbar': {
      '&-thumb': {
        background: 'var(--color-border)',
        borderRadius: '5px',
      },

      '&-track': {
        background: 'transparent',
      },

      width: '5px',
    },

    '::selection': {
      '@apply bg-primary text-background': '',
    },

    ':focus-visible': {
      '@apply outline-ring': '',
    },

    body: {
      '@apply bg-background text-foreground': '',
    },

    "button, [role='button']": {
      '@apply outline-transparent': '',
    },

    input: {
      '&::-webkit-search-cancel-button, &::-webkit-search-decoration': {
        '@apply appearance-none': '',
      },

      "&[type='button'], &[type='reset'], &[type='submit']": {
        '@apply outline-transparent': '',
      },
    },

    'input, textarea, select': {
      '&:-webkit-autofill': {
        '&, &:hover, &:focus': {
          '-webkit-box-shadow': 'inset 0 0 0 1000px var(--color-background)',
          'box-shadow': 'inset 0 0 0 1000px var(--color-background)',
        },
      },
    },
  });
});

export default base;
