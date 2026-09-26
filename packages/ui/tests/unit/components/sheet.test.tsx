import { render, screen } from "@testing-library/react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "#components/sheet";

describe("sheet", () => {
  test("names the built-in close button in English by default", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the list.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  test("takes the close button's name from closeLabel", () => {
    render(
      <Sheet open>
        <SheetContent closeLabel="Đóng">
          <SheetTitle>Bộ lọc</SheetTitle>
          <SheetDescription>Thu hẹp danh sách.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
  });
});
