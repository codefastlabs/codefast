import { render, screen } from "@testing-library/react";

import { HoverCard, HoverCardTrigger } from "#components/hover-card";

describe("hover-card", () => {
  test("stamps the trigger's slot when the trigger renders its own element", () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Profile</HoverCardTrigger>
      </HoverCard>,
    );

    expect(screen.getByText("Profile")).toHaveAttribute("data-slot", "hover-card-trigger");
  });
});
