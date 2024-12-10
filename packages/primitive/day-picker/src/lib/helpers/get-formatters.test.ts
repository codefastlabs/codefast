import { defaultDateLib } from '@/lib/classes/date-lib';
import * as defaultFormatters from '@/lib/formatters';
import { getFormatters } from '@/lib/helpers/get-formatters';

const customFormattersMock = {
  formatCaption: jest.fn(),
  formatYearDropdown: jest.fn(),
};

describe('getFormatters helpers', () => {
  test('returns default formatters when custom formatters are not provided', () => {
    const formatters = getFormatters();

    expect(formatters).toEqual(defaultFormatters);
  });

  test('merges custom formatters with default formatters', () => {
    const formatters = getFormatters(customFormattersMock);

    expect(formatters).toEqual(expect.objectContaining(customFormattersMock));
  });

  test('uses custom `formatCaption` if provided', () => {
    const customFormatCaption = jest.fn(() => 'Custom Caption');
    const formatters = getFormatters({ formatCaption: customFormatCaption });

    expect(formatters.formatCaption(new Date(), {}, defaultDateLib)).toBe('Custom Caption');
    expect(customFormatCaption).toHaveBeenCalled();
  });

  test('uses default `formatCaption` if no custom `formatCaption` provided', () => {
    const formatters = getFormatters({});

    expect(formatters.formatCaption(new Date(), {}, defaultDateLib)).toBe(
      defaultFormatters.formatCaption(new Date(), {}, defaultDateLib),
    );
  });

  test('uses custom `formatYearDropdown` if provided', () => {
    const customFormatYearDropdown = jest.fn(() => 'Custom Year Dropdown');
    const formatters = getFormatters({ formatYearDropdown: customFormatYearDropdown });

    expect(formatters.formatYearDropdown(2024)).toBe('Custom Year Dropdown');
    expect(customFormatYearDropdown).toHaveBeenCalledWith(2024);
  });

  test('uses default `formatYearDropdown` if no custom `formatYearDropdown` provided', () => {
    const formatters = getFormatters({});

    expect(formatters.formatYearDropdown(2024)).toBe(defaultFormatters.formatYearDropdown(2024));
  });
});
