import plugin from 'tailwindcss/plugin';

const animate = plugin(
  ({ addUtilities, matchUtilities, theme }) => {
    // Keyframes
    addUtilities({
      '.animate-fade-in': {
        '--animation-in-opacity': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'animate-fade-in',
      },

      '.animate-fade-out': {
        '--animation-out-opacity': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'animate-fade-out',
      },

      '.animate-in': {
        '--animation-in-opacity': 'initial',
        '--animation-in-rotate': 'initial',
        '--animation-in-scale': 'initial',
        '--animation-in-translate-x': 'initial',
        '--animation-in-translate-y': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'animate-in',
      },

      '.animate-out': {
        '--animation-out-opacity': 'initial',
        '--animation-out-rotate': 'initial',
        '--animation-out-scale': 'initial',
        '--animation-out-translate-x': 'initial',
        '--animation-out-translate-y': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'animate-out',
      },

      '@keyframes animate-fade-in': {
        from: {
          opacity: 'var(--animation-in-opacity, 0)',
        },
      },

      '@keyframes animate-fade-out': {
        to: {
          opacity: 'var(--animation-out-opacity, 0)',
        },
      },

      '@keyframes animate-in': {
        from: {
          opacity: 'var(--animation-in-opacity, 1)',
          transform: [
            'translate3d(var(--animation-in-translate-x, 0), var(--animation-in-translate-y, 0), 0)',
            'scale3d(var(--animation-in-scale, 1), var(--animation-in-scale, 1), var(--animation-in-scale, 1))',
            'rotate(var(--animation-in-rotate, 0))',
          ].join(' '),
        },
      },

      '@keyframes animate-out': {
        to: {
          opacity: 'var(--animation-out-opacity, 1)',
          transform: [
            'translate3d(var(--animation-out-translate-x, 0), var(--animation-out-translate-y, 0), 0)',
            'scale3d(var(--animation-out-scale, 1), var(--animation-out-scale, 1), var(--animation-out-scale, 1))',
            'rotate(var(--animation-out-rotate, 0))',
          ].join(' '),
        },
      },
    });

    // Play state
    addUtilities({
      '.animation-paused': {
        animationPlayState: 'paused',
      },
      '.animation-running': {
        animationPlayState: 'running',
      },
    });

    // Delay
    matchUtilities(
      {
        'animation-delay': (value) => ({
          animationDelay: value,
        }),
      },
      {
        values: theme('animationDelay'),
      },
    );

    // Direction
    matchUtilities(
      {
        'animation-direction': (value) => ({
          animationDirection: value,
        }),
      },
      {
        values: theme('animationDirection'),
      },
    );

    // Duration
    matchUtilities(
      {
        'animation-duration': (value) => ({
          animationDuration: value,
        }),
      },
      {
        values: theme('animationDuration'),
      },
    );

    // Fill mode
    matchUtilities(
      {
        'animation-fill-mode': (value) => ({
          animationFillMode: value,
        }),
      },
      {
        values: theme('animationFillMode'),
      },
    );

    // Opacity
    matchUtilities(
      {
        'fade-in': (value) => ({
          '--animation-in-opacity': value,
        }),
        'fade-out': (value) => ({
          '--animation-out-opacity': value,
        }),
      },
      {
        values: theme('animationOpacity'),
      },
    );

    // Repeat
    matchUtilities(
      {
        'animation-repeat': (value) => ({
          animationIterationCount: value,
        }),
      },
      {
        values: theme('animationRepeat'),
      },
    );

    // Rotate
    matchUtilities(
      {
        'spin-in': (value) => ({
          '--animation-in-rotate': value,
        }),
        'spin-out': (value) => ({
          '--animation-out-rotate': value,
        }),
      },
      {
        values: theme('animationRotate'),
      },
    );

    // Scale – Zoom
    matchUtilities(
      {
        'zoom-in': (value) => ({
          '--animation-in-scale': value,
        }),
        'zoom-out': (value) => ({
          '--animation-out-scale': value,
        }),
      },
      {
        values: theme('animationScale'),
      },
    );

    // Timing function
    matchUtilities(
      {
        'animation-ease': (value) => ({
          animationTimingFunction: value,
        }),
      },
      {
        values: theme('animationTimingFunction'),
      },
    );

    // Translate - Slide
    matchUtilities(
      {
        'slide-in-from-bottom': (value) => ({
          '--animation-in-translate-y': value,
        }),

        'slide-in-from-left': (value) => ({
          '--animation-in-translate-x': `-${value}`,
        }),

        'slide-in-from-right': (value) => ({
          '--animation-in-translate-x': value,
        }),

        'slide-in-from-top': (value) => ({
          '--animation-in-translate-y': `-${value}`,
        }),

        'slide-out-to-bottom': (value) => ({
          '--animation-out-translate-y': value,
        }),

        'slide-out-to-left': (value) => ({
          '--animation-out-translate-x': `-${value}`,
        }),

        'slide-out-to-right': (value) => ({
          '--animation-out-translate-x': value,
        }),

        'slide-out-to-top': (value) => ({
          '--animation-out-translate-y': `-${value}`,
        }),
      },
      {
        values: theme('animationTranslate'),
      },
    );
  },
  {
    theme: {
      extend: {
        animationDelay: ({ theme }) => ({
          ...theme('transitionDelay'),
        }),

        animationDirection: {
          alternate: 'alternate',
          'alternate-reverse': 'alternate-reverse',
          normal: 'normal',
          reverse: 'reverse',
        },

        animationDuration: ({ theme }) => ({
          ...theme('transitionDuration'),
        }),

        animationFillMode: {
          backwards: 'backwards',
          both: 'both',
          forwards: 'forwards',
          none: 'none',
        },

        animationOpacity: ({ theme }) => ({
          DEFAULT: 0,
          ...theme('opacity'),
        }),

        animationRepeat: {
          0: '0',
          1: '1',
          infinite: 'infinite',
        },

        animationRotate: ({ theme }) => ({
          DEFAULT: '30deg',
          ...theme('rotate'),
        }),

        animationScale: ({ theme }) => ({
          DEFAULT: 0,
          ...theme('scale'),
        }),

        animationTimingFunction: ({ theme }) => ({
          ...theme('transitionTimingFunction'),
        }),

        animationTranslate: ({ theme }) => ({
          DEFAULT: '100%',
          ...theme('translate'),
        }),
      },
    },
  },
);

// eslint-disable-next-line import/no-default-export -- exporting the animation utilities and theme extension as the default export
export default animate;
