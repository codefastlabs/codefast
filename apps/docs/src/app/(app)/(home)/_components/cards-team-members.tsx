"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@codefast/ui";
import { ChevronDown } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";

interface Role {
  description: string;
  name: string;
  keywords?: string[];
}

interface TeamMember {
  avatar: string;
  email: string;
  initials: string;
  name: string;
  role: string;
}

const roleOptions: Role[] = [
  { name: "Viewer", description: "Can view and comment.", keywords: ["view", "comment"] },
  { name: "Developer", description: "Can view, comment and edit.", keywords: ["view", "comment", "edit"] },
  { name: "Billing", description: "Can view, comment and manage billing.", keywords: ["view", "comment", "billing"] },
  { name: "Owner", description: "Admin-level access to all resources.", keywords: ["admin"] },
];

function RoleSelector({
  currentRole: initialRole,
  onRoleChange,
}: {
  currentRole: string;
  onRoleChange?: (newRole: string) => void;
}): JSX.Element {
  const [role, setRole] = useState(initialRole);
  const [open, setOpen] = useState(false);

  const handleSelectRole = (roleName: string): void => {
    setRole(roleName);
    setOpen(false);

    if (onRoleChange) {
      onRoleChange(roleName);
    }
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button className="ml-auto" size="sm" variant="outline">
          {role} <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0">
        <Command value={role}>
          <CommandInput placeholder="Select new role..." />
          <CommandList>
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup className="p-1.5">
              {roleOptions.map((roleOption) => (
                <CommandItem
                  className="flex flex-col items-start gap-y-1 px-4 py-2"
                  key={roleOption.name}
                  keywords={roleOption.keywords}
                  onSelect={() => {
                    handleSelectRole(roleOption.name);
                  }}
                  value={roleOption.name}
                >
                  <p>{roleOption.name}</p>
                  <p className="text-muted-foreground text-sm">{roleOption.description}</p>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TeamMemberItem({
  member,
  onRoleChange,
}: {
  member: TeamMember;
  onRoleChange?: (memberId: string, newRole: string) => void;
}): JSX.Element {
  const handleRoleChange = (newRole: string): void => {
    if (onRoleChange) {
      onRoleChange(member.email, newRole);
    }
  };

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-8 w-8">
          <AvatarImage alt="Image" src={member.avatar} />
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">{member.name}</p>
          <p className="text-muted-foreground text-sm">{member.email}</p>
        </div>
      </div>
      <RoleSelector currentRole={member.role} onRoleChange={handleRoleChange} />
    </div>
  );
}

export function CardsTeamMembers(): JSX.Element {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      name: "Sofia Davis",
      email: "m@example.com",
      avatar: "/avatars/01.png",
      initials: "OM",
      role: "Owner",
    },
    {
      name: "Jackson Lee",
      email: "p@example.com",
      avatar: "/avatars/02.png",
      initials: "JL",
      role: "Viewer",
    },
    {
      name: "Isabella Nguyen",
      email: "i@example.com",
      avatar: "/avatars/03.png",
      initials: "IN",
      role: "Viewer",
    },
  ]);

  const handleRoleChange = (memberId: string, newRole: string): void => {
    setTeamMembers((prevMembers) =>
      prevMembers.map((member) => (member.email === memberId ? { ...member, role: newRole } : member)),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Invite your team members to collaborate.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {teamMembers.map((member) => (
          <TeamMemberItem key={member.email} member={member} onRoleChange={handleRoleChange} />
        ))}
      </CardContent>
    </Card>
  );
}
