import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InputPassword } from "#components/input-password";

describe("input-password", () => {
  test("names the toggle for what it does next, in English by default", async () => {
    const user = userEvent.setup();
    render(<InputPassword aria-label="Password" />);

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  test("takes the toggle's labels from revealLabel and concealLabel", async () => {
    const user = userEvent.setup();
    render(<InputPassword aria-label="Mật khẩu" concealLabel="Ẩn mật khẩu" revealLabel="Hiện mật khẩu" />);

    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));

    expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide password" })).not.toBeInTheDocument();
  });

  test("keeps the labels off the input, which still takes its own props", () => {
    render(<InputPassword aria-label="Mật khẩu" revealLabel="Hiện mật khẩu" />);

    const input = screen.getByLabelText("Mật khẩu");

    expect(input).not.toHaveAttribute("revealLabel");
    expect(input).toHaveAttribute("type", "password");
  });
});
