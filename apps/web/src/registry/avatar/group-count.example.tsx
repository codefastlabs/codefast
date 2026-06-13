import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@codefast/ui/avatar";

export function AvatarGroupCountExample() {
  return (
    <AvatarGroup className="grayscale">
      <Avatar>
        <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://avatar.vercel.sh/leo" alt="@leo" />
        <AvatarFallback>LR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://avatar.vercel.sh/ava" alt="@ava" />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  );
}
