import { format } from 'date-fns';
import { type JSX } from 'react';

import { DayPicker } from '@/components';
import { type Formatters } from '@/lib';

const seasonEmoji: Record<string, string> = {
  winter: '⛄️',
  spring: '🌸',
  summer: '🌻',
  autumn: '🍂',
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
  return <DayPicker endMonth={new Date(2025, 0)} formatters={{ formatCaption }} startMonth={new Date(2020, 0)} />;
}
