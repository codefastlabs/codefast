import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Button } from "@codefast/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@codefast/ui/item";
import { ChevronDownIcon } from "lucide-react";

const people = [
  {
    username: "codefast",
    avatar: "https://github.com/codefastlabs.png",
    email: "hello@codefastlabs.com",
  },
  {
    username: "leo",
    avatar: "https://avatar.vercel.sh/leo",
    email: "leo@codefastlabs.com",
  },
  {
    username: "ava",
    avatar: "https://avatar.vercel.sh/ava",
    email: "ava@codefastlabs.com",
  },
];

export function ItemDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Select <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuGroup>
          {people.map((person) => (
            <DropdownMenuItem key={person.username}>
              <Item size="xs" className="w-full p-2">
                <ItemMedia>
                  <Avatar className="size-[--spacing(6.5)]">
                    <AvatarImage src={person.avatar} className="grayscale" />
                    <AvatarFallback>{person.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle>{person.username}</ItemTitle>
                  <ItemDescription className="leading-none">{person.email}</ItemDescription>
                </ItemContent>
              </Item>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
