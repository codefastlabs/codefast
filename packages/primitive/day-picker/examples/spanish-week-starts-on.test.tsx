import { render } from '@testing-library/react';

import { columnHeader } from './lib/elements';
import { SpanishWeekStartsOn } from './spanish-week-starts-on';

describe('spanish-week-starts-on component', () => {
  beforeEach(() => {
    render(<SpanishWeekStartsOn />);
  });

  test('should have "domingo" as first day of week', () => {
    expect(columnHeader('domingo')).toBeInTheDocument();
  });
});
