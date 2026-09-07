import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";

export function AvatarBasic() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" className="grayscale" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}
