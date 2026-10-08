import { render, screen } from "@testing-library/react";

import { Button } from "#components/button";
import { Tooltip, TooltipProvider, TooltipTrigger } from "#components/tooltip";

describe("tooltip", () => {
  test("leaves a button its own slot when the trigger composes onto it with asChild", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Save</Button>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-slot", "button");
  });
});
