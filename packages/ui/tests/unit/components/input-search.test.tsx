import { render, screen } from "@testing-library/react";

import { InputSearch } from "#components/input-search";

describe("input-search", () => {
  test("disables clearing a read-only field even when disabled is false", () => {
    render(<InputSearch aria-label="Search" defaultValue="radix" disabled={false} readOnly />);

    expect(screen.getByRole("button", { name: "Clear search" })).toBeDisabled();
  });
});
