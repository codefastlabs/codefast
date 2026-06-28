import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Button } from "@codefast/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@codefast/ui/item";
import { PlusIcon } from "lucide-react";

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

export function ItemGroupExample() {
  return (
    <ItemGroup className="max-w-sm">
      {people.map((person) => (
        <Item key={person.username} variant="outline">
          <ItemMedia>
            <Avatar>
              <AvatarImage src={person.avatar} className="grayscale" />
              <AvatarFallback>{person.username.charAt(0)}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent className="gap-1">
            <ItemTitle>{person.username}</ItemTitle>
            <ItemDescription>{person.email}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon" className="rounded-full">
              <PlusIcon />
            </Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
