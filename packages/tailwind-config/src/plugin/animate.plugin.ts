import type { Config } from 'tailwindcss/types/config';

import plugin from 'tailwindcss/plugin';

type Theme = <TDefaultValue = Config['theme']>(
  path?: string,
  defaultValue?: TDefaultValue,
) => TDefaultValue;

const animate = plugin(
  ({ addUtilities, matchUtilities, theme }) => {
    // Keyframes
    addUtilities({
      '.animate-fade-in': {
        '--animate-in-opacity': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'fade-in',
      },

      '.animate-fade-out': {
        '--animate-out-opacity': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'fade-out',
      },

      '.animate-in': {
        '--animate-in-opacity': 'initial',
        '--animate-in-rotate': 'initial',
        '--animate-in-scale': 'initial',
        '--animate-in-translate-x': 'initial',
        '--animate-in-translate-y': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'in',
      },

      '.animate-out': {
        '--animate-out-opacity': 'initial',
        '--animate-out-rotate': 'initial',
        '--animate-out-scale': 'initial',
        '--animate-out-translate-x': 'initial',
        '--animate-out-translate-y': 'initial',
        animationDuration: theme('animationDuration.DEFAULT'),
        animationName: 'out',
      },

      '@keyframes fade-in': {
        from: {
          opacity: 'var(--animate-in-opacity, 0)',
        },
      },

      '@keyframes fade-out': {
        to: {
          opacity: 'var(--animate-out-opacity, 0)',
        },
      },

      '@keyframes in': {
        from: {
          opacity: 'var(--animate-in-opacity, 1)',
          transform: [
            'translate3d(var(--animate-in-translate-x, 0), var(--animate-in-translate-y, 0), 0)',
            'scale3d(var(--animate-in-scale, 1), var(--animate-in-scale, 1), var(--animate-in-scale, 1))',
            'rotate(var(--animate-in-rotate, 0))',
          ].join(' '),
        },
      },

      '@keyframes out': {
        to: {
          opacity: 'var(--animate-out-opacity, 1)',
          transform: [
            'translate3d(var(--animate-out-translate-x, 0), var(--animate-out-translate-y, 0), 0)',
            'scale3d(var(--animate-out-scale, 1), var(--animate-out-scale, 1), var(--animate-out-scale, 1))',
            'rotate(var(--animate-out-rotate, 0))',
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
        'animate-delay': (value: string) => ({
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
        'animate-direction': (value: string) => ({
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
        'animate-duration': (value: string) => ({
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
        'animate-fill-mode': (value: string) => ({
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
        'fade-in': (value: string) => ({
          '--animate-in-opacity': value,
        }),
        'fade-out': (value: string) => ({
          '--animate-out-opacity': value,
        }),
      },
      {
        values: theme('animationOpacity'),
      },
    );

    // Repeat
    matchUtilities(
      {
        'animate-repeat': (value: string) => ({
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
        'spin-in': (value: string) => ({
          '--animate-in-rotate': value,
        }),
        'spin-out': (value: string) => ({
          '--animate-out-rotate': value,
        }),
      },
      {
        values: theme('animationRotate'),
      },
    );

    // Scale – Zoom
    matchUtilities(
      {
        'zoom-in': (value: string) => ({
          '--animate-in-scale': value,
        }),
        'zoom-out': (value: string) => ({
          '--animate-out-scale': value,
        }),
      },
      {
        values: theme('animationScale'),
      },
    );

    // Timing function
    matchUtilities(
      {
        'animate-ease': (value: string) => ({
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
        'slide-in-from-bottom': (value: string) => ({
          '--animate-in-translate-y': value,
        }),

        'slide-in-from-left': (value: string) => ({
          '--animate-in-translate-x': `-${value}`,
        }),

        'slide-in-from-right': (value: string) => ({
          '--animate-in-translate-x': value,
        }),

        'slide-in-from-top': (value: string) => ({
          '--animate-in-translate-y': `-${value}`,
        }),

        'slide-out-to-bottom': (value: string) => ({
          '--animate-out-translate-y': value,
        }),

        'slide-out-to-left': (value: string) => ({
          '--animate-out-translate-x': `-${value}`,
        }),

        'slide-out-to-right': (value: string) => ({
          '--animate-out-translate-x': value,
        }),

        'slide-out-to-top': (value: string) => ({
          '--animate-out-translate-y': `-${value}`,
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
        animationDelay: ({ theme }: { theme: Theme }) => ({
          ...theme('transitionDelay'),
        }),

        animationDirection: {
          alternate: 'alternate',
          'alternate-reverse': 'alternate-reverse',
          normal: 'normal',
          reverse: 'reverse',
        },

        animationDuration: ({ theme }: { theme: Theme }) => ({
          ...theme('transitionDuration'),
        }),

        animationFillMode: {
          backwards: 'backwards',
          both: 'both',
          forwards: 'forwards',
          none: 'none',
        },

        animationOpacity: ({ theme }: { theme: Theme }) => ({
          DEFAULT: 0,
          ...theme('opacity'),
        }),

        animationRepeat: {
          0: '0',
          1: '1',
          infinite: 'infinite',
        },

        animationRotate: ({ theme }: { theme: Theme }) => ({
          DEFAULT: '30deg',
          ...theme('rotate'),
        }),

        animationScale: ({ theme }: { theme: Theme }) => ({
          DEFAULT: 0,
          ...theme('scale'),
        }),

        animationTimingFunction: ({ theme }: { theme: Theme }) => ({
          ...theme('transitionTimingFunction'),
        }),

        animationTranslate: ({ theme }: { theme: Theme }) => ({
          DEFAULT: '100%',
          ...theme('translate'),
        }),
      },
    },
  },
);

export default animate;
