import plugin from 'tailwindcss/plugin';

const perspective = plugin(({ matchUtilities }) => {
  matchUtilities({
    perspective: (value) => ({
      perspective: value,
    }),
  });
});

export default perspective;
