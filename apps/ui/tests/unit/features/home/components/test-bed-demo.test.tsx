import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestBedDemo } from "#/features/home/components/test-bed-demo";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

beforeEach(() => {
  track.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("TestBedDemo", () => {
  it("runs the four beds on demand and reports every one passing", async () => {
    const user = userEvent.setup();

    render(<TestBedDemo />);

    expect(screen.queryByRole("list", { name: "Test results" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /run tests/i }));

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("4 of 4 passed");
    expect(screen.getByText("refuses a token the unit never declared")).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith("run_demo", { demo: "test-bed", action: "run", trigger: "click" });
  });
});
