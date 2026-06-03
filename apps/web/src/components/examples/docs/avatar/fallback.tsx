import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";

export function AvatarFallbackExample() {
  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarImage src="https://i.pravatar.cc/120?img=12" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback className="bg-ui-brand text-white">JD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>VP</AvatarFallback>
        <AvatarBadge className="bg-emerald-500" />
      </Avatar>
    </div>
  );
}
