import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { PlusIcon } from "lucide-react";

export function AvatarBadgeIconExample() {
  return (
    <Avatar className="grayscale">
      <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
      <AvatarFallback>PP</AvatarFallback>
      <AvatarBadge>
        <PlusIcon />
      </AvatarBadge>
    </Avatar>
  );
}
