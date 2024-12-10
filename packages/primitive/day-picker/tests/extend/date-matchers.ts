import CustomMatcher = jest.CustomMatcher;

const toBeFriday: CustomMatcher = (received: Date) => {
  const pass = received.getDay() === 5;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Friday`,
    pass,
  };
};

const toBeMonday: CustomMatcher = (received: Date) => {
  const pass = received.getDay() === 1;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Monday`,
    pass,
  };
};

const toBeSaturday: CustomMatcher = (received: Date) => {
  const pass = received.getDay() === 6;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Saturday`,
    pass,
  };
};

const toBeSunday: CustomMatcher = (received: Date) => {
  const pass = received.getDay() === 0;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Sunday`,
    pass,
  };
};

const toBeThursday: CustomMatcher = (received: Date) => {
  const pass = received.getDay() === 4;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Thursday`,
    pass,
  };
};

const toBeTuesday: CustomMatcher = (received: Date) => {
  const pass = received.getDay() === 2;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Tuesday`,
    pass,
  };
};

const toBeWednesday: CustomMatcher = (received: Date) => {
  const pass = received.getDay() === 3;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to be a Wednesday`,
    pass,
  };
};

const toHaveDate: CustomMatcher = (received: Date, expected: number) => {
  const pass = received.getDate() === expected;

  return {
    message: () => `expected ${received.toString()} ${pass ? 'not ' : ''}to have the date ${expected}`,
    pass,
  };
};

expect.extend({
  toBeFriday,
  toBeMonday,
  toBeSaturday,
  toBeSunday,
  toBeThursday,
  toBeTuesday,
  toBeWednesday,
  toHaveDate,
});
