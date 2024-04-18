import plugin from "tailwindcss/plugin";
import { type Config } from "tailwindcss/types/config";

type Theme = <TDefaultValue = Config["theme"]>(path?: string, defaultValue?: TDefaultValue) => TDefaultValue;

const animate = plugin(
  ({ addUtilities, matchUtilities, theme }) => {
    addUtilities({
      "@keyframes enter": {
        from: {
          opacity: "var(--animate-enter-opacity, 1)",
          transform: [
            "translate3d(var(--animate-enter-translate-x, 0), var(--animate-enter-translate-y, 0), 0)",
            "scale3d(var(--animate-enter-scale, 1), var(--animate-enter-scale, 1), var(--animate-enter-scale, 1))",
            "rotate(var(--animate-enter-rotate, 0))",
          ].join(" "),
        },
      },

      "@keyframes exit": {
        to: {
          opacity: "var(--animate-exit-opacity, 1)",
          transform: [
            "translate3d(var(--animate-exit-translate-x, 0), var(--animate-exit-translate-y, 0), 0)",
            "scale3d(var(--animate-exit-scale, 1), var(--animate-exit-scale, 1), var(--animate-exit-scale, 1))",
            "rotate(var(--animate-exit-rotate, 0))",
          ].join(" "),
        },
      },

      ".animate-in": {
        animationName: "enter",
        animationDuration: theme("animationDuration.DEFAULT"),
        "--animate-enter-opacity": "initial",
        "--animate-enter-scale": "initial",
        "--animate-enter-rotate": "initial",
        "--animate-enter-translate-x": "initial",
        "--animate-enter-translate-y": "initial",
      },

      ".animate-out": {
        animationName: "exit",
        animationDuration: theme("animationDuration.DEFAULT"),
        "--animate-exit-opacity": "initial",
        "--animate-exit-scale": "initial",
        "--animate-exit-rotate": "initial",
        "--animate-exit-translate-x": "initial",
        "--animate-exit-translate-y": "initial",
      },
    });

    addUtilities({
      ".animation-running": {
        animationPlayState: "running",
      },
      ".animation-paused": {
        animationPlayState: "paused",
      },
    });

    // Delay
    matchUtilities(
      {
        "animation-delay": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          animationDelay: value,
        }),
      },
      {
        values: theme("animationDelay"),
      },
    );

    // Direction
    matchUtilities(
      {
        "animation-direction": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          animationDirection: value,
        }),
      },
      {
        values: theme("animationDirection"),
      },
    );

    // Duration
    matchUtilities(
      {
        "animation-duration": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          animationDuration: value,
        }),
      },
      {
        values: theme("animationDuration"),
      },
    );

    // Fill mode
    matchUtilities(
      {
        "animation-fill-mode": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          animationFillMode: value,
        }),
      },
      {
        values: theme("animationFillMode"),
      },
    );

    // Opacity
    matchUtilities(
      {
        "fade-in": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-enter-opacity": value,
        }),
        "fade-out": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-exit-opacity": value,
        }),
      },
      {
        values: theme("animationOpacity"),
      },
    );

    // Repeat
    matchUtilities(
      {
        "animation-repeat": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          animationIterationCount: value,
        }),
      },
      {
        values: theme("animationRepeat"),
      },
    );

    // Rotate
    matchUtilities(
      {
        "spin-in": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-enter-rotate": value,
        }),
        "spin-out": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-exit-rotate": value,
        }),
      },
      {
        values: theme("animationRotate"),
      },
    );

    // Scale - Zoom
    matchUtilities(
      {
        "zoom-in": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-enter-scale": value,
        }),
        "zoom-out": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-exit-scale": value,
        }),
      },
      {
        values: theme("animationScale"),
      },
    );

    // Timing function
    matchUtilities(
      {
        "animation-ease": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          animationTimingFunction: value,
        }),
      },
      {
        values: theme("animationTimingFunction"),
      },
    );

    // Translate - Slide
    matchUtilities(
      {
        "slide-in-from-top": (value) => ({
          "--animate-enter-translate-y": `-${value}`,
        }),

        "slide-in-from-bottom": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-enter-translate-y": value,
        }),

        "slide-in-from-left": (value) => ({
          "--animate-enter-translate-x": `-${value}`,
        }),

        "slide-in-from-right": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-enter-translate-x": value,
        }),

        "slide-out-to-top": (value) => ({
          "--animate-exit-translate-y": `-${value}`,
        }),

        "slide-out-to-bottom": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-exit-translate-y": value,
        }),

        "slide-out-to-left": (value) => ({
          "--animate-exit-translate-x": `-${value}`,
        }),

        "slide-out-to-right": (value) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe
          "--animate-exit-translate-x": value,
        }),
      },
      {
        values: theme("animationTranslate"),
      },
    );
  },
  {
    theme: {
      extend: {
        animationDelay: ({ theme }: { theme: Theme }) => ({
          ...theme("transitionDelay"),
        }),

        animationDirection: {
          normal: "normal",
          reverse: "reverse",
          alternate: "alternate",
          "alternate-reverse": "alternate-reverse",
        },

        animationDuration: ({ theme }: { theme: Theme }) => ({
          ...theme("transitionDuration"),
        }),

        animationFillMode: {
          none: "none",
          forwards: "forwards",
          backwards: "backwards",
          both: "both",
        },

        animationOpacity: ({ theme }: { theme: Theme }) => ({
          DEFAULT: 0,
          ...theme("opacity"),
        }),

        animationRepeat: {
          0: "0",
          1: "1",
          infinite: "infinite",
        },

        animationRotate: ({ theme }: { theme: Theme }) => ({
          DEFAULT: "30deg",
          ...theme("rotate"),
        }),

        animationScale: ({ theme }: { theme: Theme }) => ({
          DEFAULT: 0,
          ...theme("scale"),
        }),

        animationTimingFunction: ({ theme }: { theme: Theme }) => ({
          ...theme("transitionTimingFunction"),
        }),

        animationTranslate: ({ theme }: { theme: Theme }) => ({
          DEFAULT: "100%",
          ...theme("translate"),
        }),
      },
    },
  },
);

export default animate;
