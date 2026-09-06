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
  it("runs the four beds on demand, reveals them one by one, and lists what the open test observed", async () => {
    const user = userEvent.setup();

    render(<TestBedRunner activeIndex={3} />);

    expect(screen.getByText("not run yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /run all four/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/running 0 of 4/);
    expect(screen.getByText("running…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run again/i })).toBeDisabled();

    expect(await screen.findByText(/4 of 4 passed · [\d.]+ ms$/)).toBeInTheDocument();
    expect(screen.getByText("passed")).toBeInTheDocument();
    expect(screen.getByRole("term")).toHaveTextContent("compile()");
    expect(screen.getByRole("definition")).toHaveTextContent("throws UNDECLARED_DEPENDENCY");
    expect(screen.getByRole("button", { name: /run again/i })).toBeEnabled();
    expect(track).toHaveBeenCalledWith("run_demo", { demo: "test-bed", action: "run", trigger: "click" });
  });

  it("shows every run as a new one, and follows the open test", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TestBedRunner activeIndex={0} />);

    await user.click(screen.getByRole("button", { name: /run all four/i }));

    expect(await screen.findByText(/4 of 4 passed/)).toBeInTheDocument();
    expect(screen.getByRole("term")).toHaveTextContent("reserve.mock.calls[0]");

    await user.click(screen.getByRole("button", { name: /run again/i }));

    expect(screen.getByText("running…")).toBeInTheDocument();
    expect(await screen.findByText(/4 of 4 passed · [\d.]+ ms · run 2/)).toBeInTheDocument();

    rerender(<TestBedRunner activeIndex={1} />);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual([
      'place("SKU-42")',
      "charge.mock.calls[0]",
    ]);
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent('"pay-1"');
  });
});
