import { defaultDateLib } from '@/lib/classes/date-lib';
import { getNavMonths } from '@/lib/helpers/get-nav-month';

describe('when "startMonth" is not passed in', () => {
  test('"startMonth" should be undefined', () => {
    const [navStartMonth] = getNavMonths({}, defaultDateLib);

    expect(navStartMonth).toBeUndefined();
  });
});

describe('when "startMonth" is passed in', () => {
  const [navStartMonth] = getNavMonths(
    {
      startMonth: new Date(2021, 4, 3),
    },
    defaultDateLib,
  );

  test('"startMonth" should be the start of that month', () => {
    expect(navStartMonth).toEqual(new Date(2021, 4, 1));
  });
});

describe('when "endMonth" is passed in', () => {
  const [, navEndMonth] = getNavMonths(
    {
      endMonth: new Date(2021, 4, 3),
    },
    defaultDateLib,
  );

  test('"endMonth" should be the end of that month', () => {
    expect(navEndMonth).toEqual(new Date(2021, 4, 31));
  });
});

describe('when "captionLayout" is dropdown', () => {
  describe('default behavior', () => {
    const today = new Date(2024, 4, 3);
    const [navStartMonth, navEndMonth] = getNavMonths(
      {
        captionLayout: 'dropdown',
        today,
      },
      defaultDateLib,
    );

    test('"startMonth" should be 100 years ago', () => {
      expect(navStartMonth).toEqual(new Date(1924, 0, 1));
    });

    test('"endMonth" should be the end of this year', () => {
      expect(navEndMonth).toEqual(new Date(2024, 11, 31));
    });
  });
});
