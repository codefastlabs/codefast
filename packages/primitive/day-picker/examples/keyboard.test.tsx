import { act, render } from '@testing-library/react';
import { addDays, addMonths, addWeeks, addYears, endOfWeek, lastDayOfMonth, setDate, startOfWeek } from 'date-fns';
import { type ComponentProps } from 'react';

import { activeElement, dateButton, grid, nextButton, previousButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { Keyboard } from './keyboard';

const today = new Date(2022, 5, 10);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(props: ComponentProps<typeof Keyboard>): void {
  render(<Keyboard {...props} />);
}

describe('keyboard component', () => {
  describe.each(['ltr', 'rtl'])('in %s text direction', (dir: string) => {
    beforeEach(() => {
      setup({ dir, mode: 'single' });
    });

    describe('clicking the previous month button', () => {
      beforeEach(async () => {
        await user.click(previousButton());
      });

      test('displays the previous month', () => {
        expect(grid('May 2022')).toBeInTheDocument();
      });
    });

    describe('clicking the next month button', () => {
      beforeEach(() => user.click(nextButton()));

      test('displays the next month', () => {
        expect(grid('July 2022')).toBeInTheDocument();
      });
    });

    describe('when the first day of the month is focused', () => {
      const day = setDate(today, 1);
      const nextDay = addDays(day, 1);
      const prevDay = addDays(day, -1);
      const nextMonth = addMonths(day, 1);
      const prevMonth = addMonths(day, -1);
      const nextYear = addYears(day, 1);
      const prevYear = addYears(day, -1);
      const prevWeekDay = addWeeks(day, -1);
      const nextWeekDay = addWeeks(day, 1);
      const startOfWeekDay = startOfWeek(day);
      const endOfWeekDay = endOfWeek(day);

      beforeEach(() => {
        act(() => {
          dateButton(day).focus();
        });
      });

      test('focuses on the selected day button', () => {
        expect(activeElement()).toBe(dateButton(day));
      });

      describe('pressing Arrow Left', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowLeft}'));

        if (dir === 'rtl') {
          test('focuses on the next day', () => {
            expect(dateButton(nextDay)).toHaveFocus();
          });
        } else {
          test('displays the previous month', () => {
            expect(grid('May 2022')).toBeInTheDocument();
          });

          test('focuses on the previous day', () => {
            expect(dateButton(prevDay)).toHaveFocus();
          });
        }
      });

      describe('pressing Arrow Right', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowRight}'));

        if (dir === 'rtl') {
          test('displays the previous month', () => {
            expect(grid('May 2022')).toBeInTheDocument();
          });

          test('focuses on the previous day', () => {
            expect(dateButton(prevDay)).toHaveFocus();
          });
        } else {
          test('focuses on the next day', () => {
            expect(dateButton(nextDay)).toHaveFocus();
          });
        }
      });

      describe('pressing Arrow Up', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowUp}'));

        test('displays the previous month', () => {
          expect(grid('May 2022')).toBeInTheDocument();
        });

        test('focuses on the day in the previous week', () => {
          expect(dateButton(prevWeekDay)).toHaveFocus();
        });
      });

      describe('pressing Arrow Down', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowDown}'));

        test('displays the current month', () => {
          expect(grid('June 2022')).toBeInTheDocument();
        });

        test('focuses on the day in the next week', () => {
          expect(dateButton(nextWeekDay)).toHaveFocus();
        });
      });

      describe('pressing Page Up', () => {
        beforeEach(() => user.type(activeElement(), '{PageUp}'));

        test('displays the previous month', () => {
          expect(grid('May 2022')).toBeInTheDocument();
        });

        test('focuses on the same day in the previous month', () => {
          expect(dateButton(prevMonth)).toHaveFocus();
        });
      });

      describe('pressing Page Down', () => {
        beforeEach(() => user.type(activeElement(), '{PageDown}'));

        test('displays the next month', () => {
          expect(grid('July 2022')).toBeInTheDocument();
        });

        test('focuses on the same day in the next month', () => {
          expect(dateButton(nextMonth)).toHaveFocus();
        });
      });

      describe('pressing Shift + Page Up', () => {
        beforeEach(() => user.type(activeElement(), '{Shift>}{PageUp}'));

        test('displays the previous year', () => {
          expect(grid('June 2021')).toBeInTheDocument();
        });

        test('focuses on the same day in the previous year', () => {
          expect(dateButton(prevYear)).toHaveFocus();
        });
      });

      describe('pressing Shift + Page Down', () => {
        beforeEach(() => user.type(activeElement(), '{Shift>}{PageDown}'));

        test('displays the next year', () => {
          expect(grid('June 2023')).toBeInTheDocument();
        });

        test('focuses on the same day in the next year', () => {
          expect(dateButton(nextYear)).toHaveFocus();
        });
      });

      describe('pressing Home', () => {
        beforeEach(() => user.type(activeElement(), '{Home}'));

        test('focuses on the start of the week', () => {
          expect(dateButton(startOfWeekDay)).toHaveFocus();
        });
      });

      describe('pressing End', () => {
        beforeEach(() => user.type(activeElement(), '{End}'));

        test('focuses on the end of the week', () => {
          expect(dateButton(endOfWeekDay)).toHaveFocus();
        });
      });
    });

    describe('when the last day of the month is focused', () => {
      const day = lastDayOfMonth(today);
      const nextDay = addDays(day, 1);
      const prevDay = addDays(day, -1);

      beforeEach(() => {
        act(() => {
          dateButton(day).focus();
        });
      });

      describe('pressing Arrow Right', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowRight}'));

        if (dir === 'rtl') {
          test('focuses on the previous day', () => {
            expect(dateButton(prevDay)).toHaveFocus();
          });
        } else {
          test('displays the next month', () => {
            expect(grid('July 2022')).toBeInTheDocument();
          });

          test('focuses on the first day of the next month', () => {
            expect(dateButton(nextDay)).toHaveFocus();
          });
        }
      });

      describe('pressing Arrow Left', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowLeft}'));

        if (dir === 'rtl') {
          test('displays the next month', () => {
            expect(grid('July 2022')).toBeInTheDocument();
          });

          test('focuses on the first day of the next month', () => {
            expect(dateButton(nextDay)).toHaveFocus();
          });
        } else {
          test('displays the current month', () => {
            expect(grid('June 2022')).toBeInTheDocument();
          });

          test('focuses on the previous day', () => {
            expect(dateButton(prevDay)).toHaveFocus();
          });
        }
      });

      describe('pressing Arrow Up', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowUp}'));

        test('displays the current month', () => {
          expect(grid('June 2022')).toBeInTheDocument();
        });

        test('focuses on the day in the previous week', () => {
          expect(dateButton(addWeeks(day, -1))).toHaveFocus();
        });
      });

      describe('pressing Arrow Down', () => {
        beforeEach(() => user.type(activeElement(), '{ArrowDown}'));

        test('displays the next month', () => {
          expect(grid('July 2022')).toBeInTheDocument();
        });

        test('focuses on the day in the next week', () => {
          expect(dateButton(addWeeks(day, 1))).toHaveFocus();
        });
      });
    });
  });

  describe('when the week starts on Monday', () => {
    const day = setDate(today, 10);
    const startOfWeekDay = startOfWeek(day, { weekStartsOn: 1 });
    const endOfWeekDay = endOfWeek(day, { weekStartsOn: 1 });

    beforeEach(() => {
      setup({ mode: 'single', weekStartsOn: 1 });
      act(() => {
        dateButton(day).focus();
      });
    });

    describe('pressing Home', () => {
      beforeEach(() => user.type(activeElement(), '{Home}'));

      test('focuses on the start of the week being Monday', () => {
        expect(dateButton(startOfWeekDay)).toHaveFocus();
      });
    });

    describe('pressing End', () => {
      beforeEach(() => user.type(activeElement(), '{End}'));

      test('focuses on the end of the week being Sunday', () => {
        expect(dateButton(endOfWeekDay)).toHaveFocus();
      });
    });
  });
});
