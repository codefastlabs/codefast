import { axe } from "jest-axe";

import {
  ProgressCircle,
  ProgressCircleIndicator,
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleValue,
} from "@/progress-circle";
import { render, screen } from "@testing-library/react";

describe("ProgressCircle", () => {
  test("renders correctly with default props", () => {
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

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("passes accessibility tests", async () => {
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

  test("updates when value changes", () => {
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

    expect(screen.getByText("25%")).toBeInTheDocument();

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

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  test("calculates percentage correctly with custom max value", () => {
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

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("supports custom value formatting", () => {
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

    expect(screen.getByText("Hoàn thành: 42%")).toBeInTheDocument();
  });

  test("renders with custom size", () => {
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

    const progressCircle = screen.getByRole("progressbar");

    expect(progressCircle).toHaveAttribute("width", "200");
    expect(progressCircle).toHaveAttribute("height", "200");
  });

  test("handles indeterminate state", () => {
    render(
      <ProgressCircleProvider max={100} value={null}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator />
          </ProgressCircleSVG>
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    const progressbar = screen.getByRole("progressbar");

    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    expect(progressbar).not.toHaveAttribute("aria-valuenow");
  });

  test("renders correctly with zero value", () => {
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

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  test("renders correctly when value equals max", () => {
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

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  test("accepts custom styling", () => {
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

    expect(screen.getByText("50%")).toHaveClass("text-lg", "font-bold");
  });

  test("applies correct threshold styles", () => {
    const thresholds = [
      { background: "pink", color: "red", value: 30 },
      { background: "lightyellow", color: "yellow", value: 70 },
      { background: "lightgreen", color: "green", value: 100 },
    ];

    render(
      <ProgressCircleProvider max={100} thresholds={thresholds} value={75}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack />
            <ProgressCircleIndicator data-testid="progress-indicator" />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    const indicator = screen.getByTestId("progress-indicator");

    expect(indicator).toHaveAttribute("stroke", "green");
  });

  test("renders with custom stroke width", () => {
    render(
      <ProgressCircleProvider max={100} strokeWidth={8} value={50}>
        <ProgressCircle>
          <ProgressCircleSVG>
            <ProgressCircleTrack data-testid="progress-track" />
            <ProgressCircleIndicator data-testid="progress-indicator" />
          </ProgressCircleSVG>
          <ProgressCircleValue />
        </ProgressCircle>
      </ProgressCircleProvider>,
    );

    const track = screen.getByTestId("progress-track");
    const indicator = screen.getByTestId("progress-indicator");

    expect(track).toHaveAttribute("stroke-width", "8");
    expect(indicator).toHaveAttribute("stroke-width", "8");
  });

  test("handles value equal to max properly", () => {
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

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
