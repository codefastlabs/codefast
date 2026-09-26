import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Progress } from "#components/progress";

function indicatorOf(progressbar: HTMLElement): HTMLElement {
  const indicator = progressbar.querySelector<HTMLElement>('[data-slot="progress-indicator"]');
  if (indicator === null) {
    throw new Error("Progress rendered no indicator");
  }
  return indicator;
}

describe("progress", () => {
  test("exposes the value to assistive technology", () => {
    render(<Progress aria-label="Upload" value={40} />);

    const progressbar = screen.getByRole("progressbar");

    expect(progressbar).toHaveAttribute("aria-valuenow", "40");
    expect(progressbar).toHaveAttribute("aria-valuetext", "40%");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    expect(progressbar).toHaveAttribute("data-value", "40");
    expect(progressbar).toHaveAttribute("data-state", "loading");
    expect(indicatorOf(progressbar)).toHaveStyle({ transform: "translateX(-60%)" });
  });

  test("fills the bar against max rather than 100", () => {
    render(<Progress aria-label="Steps" max={5} value={3} />);

    const progressbar = screen.getByRole("progressbar");

    expect(progressbar).toHaveAttribute("aria-valuemax", "5");
    expect(progressbar).toHaveAttribute("aria-valuetext", "60%");
    expect(indicatorOf(progressbar)).toHaveStyle({ transform: "translateX(-40%)" });
  });

  test("reports complete at max", () => {
    render(<Progress aria-label="Upload" value={100} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "complete");
  });

  test("starts at zero when no value is given", () => {
    render(<Progress aria-label="Upload" />);

    const progressbar = screen.getByRole("progressbar");

    expect(progressbar).toHaveAttribute("aria-valuenow", "0");
    expect(indicatorOf(progressbar)).toHaveStyle({ transform: "translateX(-100%)" });
  });

  test("treats null as indeterminate", () => {
    render(<Progress aria-label="Upload" value={null} />);

    const progressbar = screen.getByRole("progressbar");

    expect(progressbar).not.toHaveAttribute("aria-valuenow");
    expect(progressbar).toHaveAttribute("data-state", "indeterminate");
  });

  test("clamps a value outside 0 to max, so the announced and drawn values agree", () => {
    const { rerender } = render(<Progress aria-label="Upload" value={120} />);

    const progressbar = screen.getByRole("progressbar");

    expect(progressbar).toHaveAttribute("aria-valuenow", "100");
    expect(indicatorOf(progressbar)).toHaveStyle({ transform: "translateX(-0%)" });

    rerender(<Progress aria-label="Upload" value={-5} />);

    expect(progressbar).toHaveAttribute("aria-valuenow", "0");
    expect(indicatorOf(progressbar)).toHaveStyle({ transform: "translateX(-100%)" });
  });

  test("announces the text getValueLabel returns", () => {
    render(
      <Progress
        aria-label="Steps"
        getValueLabel={(value, max) => `${value.toString()} of ${max.toString()}`}
        max={5}
        value={3}
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "3 of 5");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<Progress aria-label="Upload" value={40} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
