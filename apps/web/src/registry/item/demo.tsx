import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
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
import { cn } from "@codefast/ui/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";
import { Fragment } from "react";

const MEMBERS = [
  {
    id: 1,
    name: "Vuong Phan",
    email: "mr.thevuong@gmail.com",
    role: "Owner",
    initials: "VP",
    color: "bg-ui-brand",
    roleVariant: "default" as const,
  },
  {
    id: 2,
    name: "Sarah Müller",
    email: "sarah@acme.io",
    role: "Admin",
    initials: "SM",
    color: "bg-violet-500",
    roleVariant: "secondary" as const,
  },
  {
    id: 3,
    name: "James Doe",
    email: "james@acme.io",
    role: "Member",
    initials: "JD",
    color: "bg-emerald-500",
    roleVariant: "outline" as const,
  },
];

export function ItemDemo() {
  return (
    <ItemGroup className="w-full max-w-md gap-0 rounded-xl border">
      {MEMBERS.map(({ id, name, email, role, initials, color, roleVariant }, idx) => (
        <Fragment key={id}>
          {idx > 0 && <ItemSeparator className="my-0" />}
          <Item>
            <ItemMedia>
              <Avatar>
                <AvatarFallback className={cn("text-white", color)}>{initials}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{name}</ItemTitle>
              <ItemDescription>{email}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant={roleVariant}>{role}</Badge>
              <Button aria-label={`Options for ${name}`} size="icon-sm" variant="ghost">
                <MoreHorizontalIcon />
              </Button>
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  );
}
