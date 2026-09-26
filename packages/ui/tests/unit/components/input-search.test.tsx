import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InputSearch } from "#components/input-search";

describe("input-search", () => {
  test("names the clear button in English by default", () => {
    render(<InputSearch aria-label="Search" defaultValue="radix" />);

    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  test("takes the clear button's name from clearLabel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputSearch aria-label="Tìm kiếm" clearLabel="Xoá tìm kiếm" defaultValue="radix" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Xoá tìm kiếm" }));

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByLabelText("Tìm kiếm")).toHaveValue("");
  });

  test("disables clearing a read-only field even when disabled is false", () => {
    render(<InputSearch aria-label="Search" defaultValue="radix" disabled={false} readOnly />);

    expect(screen.getByRole("button", { name: "Clear search" })).toBeDisabled();
  });
});
