import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "#components/dialog";

function OpenDialog({ closeLabel }: { readonly closeLabel?: string }): ReactNode {
  return (
    <Dialog open>
      <DialogContent {...(closeLabel === undefined ? {} : { closeLabel })}>
        <DialogTitle>Delete project</DialogTitle>
        <DialogDescription>This cannot be undone.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

describe("dialog", () => {
  test("names the built-in close button in English by default", () => {
    render(<OpenDialog />);

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  test("takes the close button's name from closeLabel", () => {
    render(<OpenDialog closeLabel="Đóng" />);

    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  test("labels the footer's close button with closeLabel", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
          <DialogFooter closeLabel="Huỷ" showCloseButton />
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Huỷ" })).toBeInTheDocument();
  });
});
