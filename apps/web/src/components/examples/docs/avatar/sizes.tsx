import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";

const SIZES = ["sm", "default", "lg"] as const;

export function AvatarSizes() {
  return (
    <div className="flex items-center gap-4">
      {SIZES.map((size) => (
        <Avatar key={size} size={size}>
          <AvatarImage src="https://i.pravatar.cc/120?img=5" alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
