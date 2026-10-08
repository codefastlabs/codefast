import { render } from "@testing-library/react";

import { Avatar, AvatarFallback, AvatarGroup } from "#components/avatar";
import { HoverCard, HoverCardTrigger } from "#components/hover-card";

describe("avatar", () => {
  test("keeps its own slot inside a group when a trigger composes onto it with asChild", () => {
    const { container } = render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Avatar>
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
        </HoverCard>
      </AvatarGroup>,
    );

    const slots = [...container.querySelectorAll<HTMLElement>("[data-slot]")].map((element) => element.dataset.slot);

    expect(slots).toStrictEqual(["avatar-group", "avatar", "avatar-fallback", "avatar", "avatar-fallback"]);
  });
});
