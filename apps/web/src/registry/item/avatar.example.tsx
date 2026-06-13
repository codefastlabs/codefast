import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Button } from "@codefast/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@codefast/ui/item";
import { Plus } from "lucide-react";

export function ItemAvatar() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <Item variant="outline">
        <ItemMedia>
          <Avatar className="size-10">
            <AvatarImage src="https://avatar.vercel.sh/ava" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Ava Stone</ItemTitle>
          <ItemDescription>Last seen 5 months ago</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="icon-sm" variant="outline" className="rounded-full" aria-label="Invite">
            <Plus />
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline">
        <ItemMedia>
          <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale">
            <Avatar className="hidden sm:flex">
              <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
              <AvatarFallback>CF</AvatarFallback>
            </Avatar>
            <Avatar className="hidden sm:flex">
              <AvatarImage src="https://avatar.vercel.sh/leo" alt="@leo" />
              <AvatarFallback>LP</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://avatar.vercel.sh/ava" alt="@ava" />
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
          </div>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>No Team Members</ItemTitle>
          <ItemDescription>Invite your team to collaborate on this project.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            Invite
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
}
