import type { JSX } from 'react';

import { format } from 'date-fns';

import type { Formatters } from '@/lib';

import { DayPicker } from '@/components';

const seasonEmoji: Record<string, string> = {
  autumn: '🍂',
  spring: '🌸',
  summer: '🌻',
  winter: '⛄️',
};

const getSeason = (month: Date): string => {
  const monthNumber = month.getMonth();

  if (monthNumber >= 0 && monthNumber < 3) {
    return 'winter';
  }

  if (monthNumber >= 3 && monthNumber < 6) {
    return 'spring';
  }

  if (monthNumber >= 6 && monthNumber < 9) {
    return 'summer';
  }

  return 'autumn';
};

const formatCaption: Formatters['formatCaption'] = (month, options) => {
  const season = getSeason(month);

  return `${seasonEmoji[season]} ${format(month, 'LLLL', { locale: options?.locale })}`;
};

export function FormatCaption(): JSX.Element {
  return (
    <DayPicker
      endMonth={new Date(2025, 0)}
      formatters={{ formatCaption }}
      startMonth={new Date(2020, 0)}
    />
  );
}
