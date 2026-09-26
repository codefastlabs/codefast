import { render, screen } from "@testing-library/react";

import { CommandDialog } from "#components/command";

describe("command", () => {
  test("passes closeLabel to the dialog's close button", () => {
    render(
      <CommandDialog closeLabel="Đóng" description="Tìm một lệnh" open showCloseButton title="Bảng lệnh">
        <p>Bảng lệnh</p>
      </CommandDialog>,
    );

    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
  });
});
