import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StartEndMonthsShowOutsideDays } from './start-end-months-show-outside-days';

describe('StartEndMonthsShowOutsideDays component', () => {
  it('should render without crashing', () => {
    const { container } = render(<StartEndMonthsShowOutsideDays />);

    expect(container).toBeTruthy();
  });
});
