import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@codefast/ui/avatar";

export function AvatarDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ui-fg">Collaborators</span>
        <AvatarGroup>
          <Avatar>
            <AvatarImage
              alt="@vuong"
              src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=128&h=128&fit=crop&q=80"
            />
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

      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage
            alt="@vuong"
            src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=128&h=128&fit=crop&q=80"
          />
          <AvatarFallback>VP</AvatarFallback>
          <AvatarBadge className="bg-emerald-500" />
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-ui-fg">Vuong Phan</span>
          <span className="text-xs text-ui-muted">Online now</span>
        </div>
      </div>
    </div>
  );
}
