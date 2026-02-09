export const COMMON_UNITS = ['small', 'medium', 'large'];

export const twMergeConfig = {
  extend: {
    classGroups: {
      'bg-image': ['bg-stripe-gradient'],
      'font-size': [{ text: ['tiny', ...COMMON_UNITS] }],
      'min-w': [
        {
          'min-w': ['unit', 'unit-2', 'unit-4', 'unit-6'],
        },
      ],
      shadow: [{ shadow: COMMON_UNITS }],
    },
    theme: {
      borderRadius: COMMON_UNITS,
      borderWidth: COMMON_UNITS,
      opacity: ['disabled'],
      spacing: ['divider', 'unit', 'unit-2', 'unit-4', 'unit-6'],
    },
  },
};
