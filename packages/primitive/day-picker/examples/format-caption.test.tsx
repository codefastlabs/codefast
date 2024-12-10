import { render, screen } from '@testing-library/react';

import { FormatCaption } from './format-caption';

const today = new Date(2021, 10, 25); // 25 November 2021

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('format-caption component', () => {
  test('renders without crashing', () => {
    const { container } = render(<FormatCaption />);

    expect(container).toBeInTheDocument();
  });

  test('displays the correct season emoji and month name for autumn', () => {
    render(<FormatCaption />);
    expect(screen.getByText('🍂 November')).toBeInTheDocument();
  });

  test('displays the correct season emoji and month name for winter', () => {
    const winterMonth = new Date(2022, 1, 1); // February 2022

    jest.setSystemTime(winterMonth);

    render(<FormatCaption />);

    expect(screen.getByText('⛄️ February')).toBeInTheDocument();
  });

  test('displays the correct season emoji and month name for spring', () => {
    const springMonth = new Date(2022, 4, 1); // May 2022

    jest.setSystemTime(springMonth);

    render(<FormatCaption />);

    expect(screen.getByText('🌸 May')).toBeInTheDocument();
  });

  test('displays the correct season emoji and month name for summer', () => {
    const summerMonth = new Date(2022, 7, 1); // August 2022

    jest.setSystemTime(summerMonth);

    render(<FormatCaption />);

    expect(screen.getByText('🌻 August')).toBeInTheDocument();
  });
});
