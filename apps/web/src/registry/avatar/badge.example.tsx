import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";

export function AvatarWithBadge() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge className="bg-green-600 dark:bg-green-800" />
    </Avatar>
  );
}
