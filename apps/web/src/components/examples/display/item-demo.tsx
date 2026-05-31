import { Fragment } from "react";

import { Button } from "@codefast/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@codefast/ui/item";
import { BellIcon, MailIcon, UserIcon } from "lucide-react";

const ITEMS = [
  { id: 1, title: "Profile", description: "Update your personal information", Icon: UserIcon },
  { id: 2, title: "Notifications", description: "Manage notification preferences", Icon: BellIcon },
  { id: 3, title: "Messages", description: "View your inbox and sent items", Icon: MailIcon },
];

export function ItemDemo() {
  return (
    <ItemGroup className="w-full max-w-sm rounded-xl border">
      {ITEMS.map(({ id, title, description, Icon }, idx) => (
        <Fragment key={id}>
          {idx > 0 && <ItemSeparator />}
          <Item>
            <ItemMedia>
              <Icon className="size-5 text-ui-muted" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{title}</ItemTitle>
              <ItemDescription>{description}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="icon" variant="ghost">
                <Icon className="size-4" />
              </Button>
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  );
}
