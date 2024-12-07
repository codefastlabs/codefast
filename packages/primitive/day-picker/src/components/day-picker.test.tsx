import { fireEvent, render, screen } from '@testing-library/react';
import { startOfDay, startOfMonth } from 'date-fns';

import { DayPicker } from '@/components/day-picker';
import { type MonthsProps } from '@/components/ui';
import { defaultLocale } from '@/lib/classes/date-lib';
import { activeElement, dateButton, grid, nav, previousButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';
import { UI } from '@/lib/constants/ui';

const testId = 'test';
const dayPicker = (): HTMLElement => screen.getByTestId(testId);

test('should render a date picker component', () => {
  render(<DayPicker data-testid={testId} />);
  expect(dayPicker()).toBeInTheDocument();
});

test('render the navigation and month grids', () => {
  render(<DayPicker data-testid={testId} />);

  expect(nav()).toBeInTheDocument();
  expect(grid()).toBeInTheDocument();
});

test('apply classnames and style according to props', () => {
  render(
    <DayPicker
      showWeekNumber
      className="custom-class"
      data-testid={testId}
      numberOfMonths={2}
      style={{ color: 'red' }}
    />,
  );

  expect(dayPicker()).toHaveClass('rdp-root');
  expect(dayPicker()).toHaveClass('custom-class');
  expect(dayPicker()).toHaveStyle({ color: 'red' });
});

test('use custom components', () => {
  render(
    <DayPicker
      components={{
        Nav: () => <div>Custom Navigation</div>,
        Month: () => <div>Custom Month</div>,
        Months: (props: MonthsProps) => (
          <div {...props}>
            Custom Months<div>{props.children}</div>
          </div>
        ),
        Footer: () => <div>Custom Footer</div>,
      }}
      data-testid={testId}
      footer="Footer"
    />,
  );

  expect(dayPicker()).toHaveTextContent('Custom Navigation');
  expect(dayPicker()).toHaveTextContent('Custom Months');
  expect(dayPicker()).toHaveTextContent('Custom Month');
  expect(dayPicker()).toHaveTextContent('Custom Footer');
});

describe('when the date picker is focused', () => {
  test('focus the previous button', async () => {
    render(<DayPicker />);
    await user.tab();
    expect(activeElement()).toBe(previousButton());
  });

  test('on RTL, focus the previous button', async () => {
    render(<DayPicker dir="rtl" />);
    await user.tab();
    expect(activeElement()).toBe(previousButton());
  });
});

describe('when the grid is focused', () => {
  const today = new Date();

  beforeAll(() => vi.setSystemTime(today));
  afterAll(() => vi.useRealTimers());

  test("should focus the today's date", async () => {
    render(<DayPicker mode="single" today={today} />);
    await user.tab();
    await user.tab();
    await user.tab();
    expect(activeElement()).toBe(dateButton(today));
  });
  describe('when the today’s date is disabled', () => {
    test('should focus the first day of the month', async () => {
      render(<DayPicker disabled={today} mode="single" />);
      await user.tab();
      await user.tab();
      await user.tab();
      expect(activeElement()).toBe(dateButton(startOfMonth(today)));
    });
  });
});

describe('when a day is mouse entered', () => {
  const handleDayMouseEnter = vi.fn();
  const handleDayMouseLeave = vi.fn();
  const today = startOfDay(new Date());

  const setup = (): void => {
    render(
      <DayPicker
        defaultMonth={today}
        mode="single"
        today={today}
        onDayMouseEnter={handleDayMouseEnter}
        onDayMouseLeave={handleDayMouseLeave}
      />,
    );
  };

  beforeEach(() => {
    setup();

    fireEvent.mouseEnter(dateButton(today));
    fireEvent.mouseLeave(dateButton(today));
  });
  test('should call the event handler', () => {
    expect(handleDayMouseEnter).toHaveBeenCalled();
    expect(handleDayMouseLeave).toHaveBeenCalled();
  });
});

describe('when the `month` is changed programmatically', () => {
  test('should update the calendar to reflect the new month', () => {
    const initialMonth = new Date(2023, 0, 1); // January 2023
    const newMonth = new Date(2023, 1, 1); // February 2023
    const { rerender } = render(<DayPicker mode="single" month={initialMonth} />);

    expect(grid('January 2023')).toBeInTheDocument();
    rerender(<DayPicker mode="single" month={newMonth} />);
    expect(grid('February 2023')).toBeInTheDocument();
  });
});

test('extends the default locale', () => {
  render(
    <DayPicker
      locale={{
        localize: {
          ...defaultLocale.localize,
          month: () => 'bar',
        },
      }}
      month={new Date(2024, 0)}
    />,
  );
  // Check if the custom month name is rendered
  expect(grid('bar 2024')).toBeInTheDocument();
});

test('should render the custom components', () => {
  render(
    <DayPicker
      captionLayout="dropdown"
      components={{
        Nav: () => <div>Custom Nav</div>,
        YearsDropdown: () => <div>Custom YearsDropdown</div>,
        MonthsDropdown: () => <div>Custom MonthsDropdown</div>,
        Footer: () => <div>Custom Footer</div>,
      }}
      footer="test"
    />,
  );
  expect(screen.getByText('Custom Nav')).toBeInTheDocument();
  expect(screen.getByText('Custom Footer')).toBeInTheDocument();
  expect(screen.getByText('Custom YearsDropdown')).toBeInTheDocument();
  expect(screen.getByText('Custom MonthsDropdown')).toBeInTheDocument();
});

test('apply classNames prop correctly', () => {
  const classNames = {
    [UI.Day]: 'custom-day-class',
    [UI.Week]: 'custom-week-class',
    [UI.Month]: 'custom-month-class',
  };

  render(<DayPicker classNames={classNames} data-testid={testId} />);

  const container = dayPicker();

  // eslint-disable-next-line testing-library/no-node-access -- Testing the DOM
  const dayElement = container.querySelector('.custom-day-class');
  // eslint-disable-next-line testing-library/no-node-access -- Testing the DOM
  const weekElement = container.querySelector('.custom-week-class');
  // eslint-disable-next-line testing-library/no-node-access -- Testing the DOM
  const monthElement = container.querySelector('.custom-month-class');

  expect(dayElement).toBeInTheDocument();
  expect(weekElement).toBeInTheDocument();
  expect(monthElement).toBeInTheDocument();
});

describe('when interactive', () => {
  test('render a valid HTML', () => {
    render(<DayPicker mode="single" />);
    expect(document.body).toHTMLValidate({
      rules: { 'no-redundant-role': 'off' }, // Redundant role is allowed for VoiceOver
    });
  });
});

describe('when not interactive', () => {
  test('render a valid HTML', () => {
    render(<DayPicker />);
    expect(document.body).toHTMLValidate({
      rules: { 'no-redundant-role': 'off' }, // Redundant role is allowed for VoiceOver
    });
  });
});
