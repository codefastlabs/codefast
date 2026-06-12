import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@codefast/ui/avatar";

const PEOPLE = [
  { initials: "VP", className: "" },
  { initials: "JD", className: "bg-ui-brand text-white" },
  { initials: "AS", className: "bg-violet-500 text-white" },
  { initials: "SM", className: "bg-amber-500 text-white" },
];

export function AvatarGroupExample() {
  return (
    <AvatarGroup>
      {PEOPLE.map((person) => (
        <Avatar key={person.initials}>
          <AvatarFallback className={person.className}>{person.initials}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  );
}
