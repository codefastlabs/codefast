import { render } from '@testing-library/react';

import { StartEndMonthsShowOutsideDays } from '~/start-end-months-show-outside-days';

describe('StartEndMonthsShowOutsideDays component', () => {
  it('should render without crashing', () => {
    const { container } = render(<StartEndMonthsShowOutsideDays />);

    expect(container).toBeTruthy();
  });
});
