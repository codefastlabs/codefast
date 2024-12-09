import '@testing-library/jest-dom';
import 'html-validate/jest';

expect.extend({
  toBeFriday(received: Date) {
    const pass = received.getDay() === 5;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Friday`,
      pass,
    };
  },
  toBeMonday(received: Date) {
    const pass = received.getDay() === 1;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Monday`,
      pass,
    };
  },
  toBeSaturday(received: Date) {
    const pass = received.getDay() === 6;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Saturday`,
      pass,
    };
  },
  toBeSunday(received: Date) {
    const pass = received.getDay() === 0;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Sunday`,
      pass,
    };
  },
  toBeThursday(received: Date) {
    const pass = received.getDay() === 4;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Thursday`,
      pass,
    };
  },
  toBeTuesday(received: Date) {
    const pass = received.getDay() === 2;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Tuesday`,
      pass,
    };
  },
  toBeWednesday(received: Date) {
    const pass = received.getDay() === 3;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Wednesday`,
      pass,
    };
  },
  toHaveDate(received: Date, expected: number) {
    const pass = received.getDate() === expected;

    return {
      message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to have the date ${expected}`,
      pass,
    };
  },
});
