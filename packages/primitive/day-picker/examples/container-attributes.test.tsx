import { render } from '@testing-library/react';

import { ContainerAttributes } from './container-attributes';

describe('container-attributes component', () => {
  test('renders DayPicker with expected data attributes', () => {
    const { container } = render(<ContainerAttributes id="test-div" />);

    const dayPicker = container.querySelector('.testClass');

    expect(dayPicker).toHaveAttribute('data-test', 'testData');
    expect(dayPicker).toHaveAttribute('id', 'testId');
    expect(dayPicker).toHaveAttribute('lang', 'vi');
    expect(dayPicker).toHaveAttribute('nonce', 'foo_nonce');
    expect(dayPicker).toHaveAttribute('title', 'foo_title');
  });
});
