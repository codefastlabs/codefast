import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import {
  ProgressCircle,
  ProgressCircleIndicator,
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleValue,
} from '@/progress-circle';

describe('ProgressCircle', () => {
  // Test rendering with default props
  it('renders correctly with default props', () => {
    render(
      <ProgressCircleProvider max={100} value={50}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  // Test accessibility
  it('passes accessibility tests', async () => {
    const { container } = render(
      <ProgressCircleProvider max={100} value={50}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  // Test with different values
  it('updates when value changes', () => {
    const { rerender } = render(
      <ProgressCircleProvider max={100} value={25}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByText('25%')).toBeInTheDocument();

    rerender(
      <ProgressCircleProvider max={100} value={75}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  // Test with custom max value
  it('calculates percentage correctly with custom max value', () => {
    render(
      <ProgressCircleProvider max={10} value={5}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  // Test with custom formatting
  it('supports custom value formatting', () => {
    render(
      <ProgressCircleProvider max={100} value={42}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue>{({ valueText }) => <div>Hoàn thành: {valueText}</div>}</ProgressCircleValue>
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByText('Hoàn thành: 42%')).toBeInTheDocument();
  });

  // Test with custom size
  it('renders with custom size', () => {
    render(
      <ProgressCircleProvider max={100} size={200} value={50}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    const progressCircle = screen.getByRole('progressbar');

    expect(progressCircle).toHaveAttribute('width', '200');
    expect(progressCircle).toHaveAttribute('height', '200');
  });

  // Test with indeterminate state
  it('handles indeterminate state', () => {
    render(
      // @ts-ignore
      <ProgressCircleProvider max={100} value={null}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    const progressbar = screen.getByRole('progressbar');

    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).not.toHaveAttribute('aria-valuenow');
  });

  // Test with zero value
  it('renders correctly with zero value', () => {
    render(
      <ProgressCircleProvider max={100} value={0}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  // Test with max value reached
  it('renders correctly when value equals max', () => {
    render(
      <ProgressCircleProvider max={100} value={100}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  // Test with custom colors
  it('accepts custom styling', () => {
    render(
      <ProgressCircleProvider max={100} value={50}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack className="text-gray-200" />
            <ProgressCircleIndicator className="text-blue-600" />
          </ProgressCircleSVG>
          <ProgressCircleValue className="text-lg font-bold" />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    expect(screen.getByText('50%')).toHaveClass('text-lg', 'font-bold');
  });
});
