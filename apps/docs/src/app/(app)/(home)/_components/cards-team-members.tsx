"use client";

import type { JSX } from "react";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

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

interface Role {
  description: string;
  keywords?: string[];
  name: string;
}

interface TeamMember {
  avatar: string;
  email: string;
  initials: string;
  name: string;
  role: string;
}

const roleOptions: Role[] = [
  { description: "Can view and comment.", keywords: ["view", "comment"], name: "Viewer" },
  {
    description: "Can view, comment and edit.",
    keywords: ["view", "comment", "edit"],
    name: "Developer",
  },
  {
    description: "Can view, comment and manage billing.",
    keywords: ["view", "comment", "billing"],
    name: "Billing",
  },
  { description: "Admin-level access to all resources.", keywords: ["admin"], name: "Owner" },
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
    <Popover open={open} onOpenChange={setOpen}>
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
                  key={roleOption.name}
                  className="flex flex-col items-start gap-y-1 px-4 py-2"
                  keywords={roleOption.keywords}
                  value={roleOption.name}
                  onSelect={() => {
                    handleSelectRole(roleOption.name);
                  }}
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
      avatar: "/avatars/01.png",
      email: "m@example.com",
      initials: "OM",
      name: "Sofia Davis",
      role: "Owner",
    },
    {
      avatar: "/avatars/02.png",
      email: "p@example.com",
      initials: "JL",
      name: "Jackson Lee",
      role: "Viewer",
    },
    {
      avatar: "/avatars/03.png",
      email: "i@example.com",
      initials: "IN",
      name: "Isabella Nguyen",
      role: "Viewer",
    },
  ]);

  const handleRoleChange = (memberId: string, newRole: string): void => {
    setTeamMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.email === memberId ? { ...member, role: newRole } : member,
      ),
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
