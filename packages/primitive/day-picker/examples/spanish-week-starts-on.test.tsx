import { render } from '@testing-library/react';

import { columnHeader } from '~/lib/elements';
import { SpanishWeekStartsOn } from '~/spanish-week-starts-on';

function setup(): void {
  render(<SpanishWeekStartsOn />);
}

describe('spanish-week-starts-on component', () => {
  beforeEach(() => {
    setup();
  });

  test('should have "domingo" as first day of week', () => {
    expect(columnHeader('domingo')).toBeInTheDocument();
  });
});
