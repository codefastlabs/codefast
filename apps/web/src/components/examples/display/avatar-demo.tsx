import { Avatar, AvatarFallback } from "@codefast/ui/avatar";

export function AvatarDemo() {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-10">
        <AvatarFallback>VP</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarFallback className="bg-ui-brand text-white">JD</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarFallback className="bg-violet-500 text-white">AS</AvatarFallback>
      </Avatar>
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">SM</AvatarFallback>
      </Avatar>
    </div>
  );
}
