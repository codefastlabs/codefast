import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestBedRunner } from "#/features/home/components/test-bed-runner";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

beforeEach(() => {
  track.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("TestBedRunner", () => {
  it("runs the four beds on demand, reveals them one by one, and shows the open test's evidence", async () => {
    const user = userEvent.setup();

    render(<TestBedRunner activeIndex={3} />);

    expect(screen.getByText(/refuses a token the unit never declared: not run yet/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /run all four/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/running 0 of 4/);
    expect(screen.getByRole("button", { name: /run again/i })).toBeDisabled();

    expect(await screen.findByText(/4 of 4 passed · [\d.]+ ms$/)).toBeInTheDocument();
    expect(screen.getByText(/UNDECLARED_DEPENDENCY/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run again/i })).toBeEnabled();
    expect(track).toHaveBeenCalledWith("run_demo", { demo: "test-bed", action: "run", trigger: "click" });
  });

  it("shows every run as a new one, and follows the open test", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TestBedRunner activeIndex={0} />);

    await user.click(screen.getByRole("button", { name: /run all four/i }));

    expect(await screen.findByText(/reserve\.mock\.calls\[0\]/)).toBeInTheDocument();
    expect(await screen.findByText(/4 of 4 passed/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /run again/i }));

    expect(screen.getByText(/reserves the stock before charging: running…/)).toBeInTheDocument();
    expect(await screen.findByText(/4 of 4 passed · [\d.]+ ms · run 2/)).toBeInTheDocument();

    rerender(<TestBedRunner activeIndex={1} />);

    expect(screen.getByText(/"pay-1"/)).toBeInTheDocument();
  });
});
