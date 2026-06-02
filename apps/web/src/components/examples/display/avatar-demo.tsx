import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@codefast/ui/avatar";

export function AvatarDemo() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>VP</AvatarFallback>
          <AvatarBadge className="bg-emerald-500" />
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback className="bg-ui-brand text-white">JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback className="bg-violet-500 text-white">AS</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
      </div>
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>VP</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback className="bg-ui-brand text-white">JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback className="bg-violet-500 text-white">AS</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
    </div>
  );
}
