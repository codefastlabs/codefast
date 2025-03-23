import type { JSX } from 'react';

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
} from '@codefast/ui';
import { ChevronDown } from 'lucide-react';

interface Role {
  description: string;
  name: string;
}

interface TeamMember {
  avatar: string;
  email: string;
  initials: string;
  name: string;
  role: string;
}

const AVAILABLE_ROLES: Role[] = [
  { name: 'Viewer', description: 'Can view and comment.' },
  { name: 'Developer', description: 'Can view, comment and edit.' },
  { name: 'Billing', description: 'Can view, comment and manage billing.' },
  { name: 'Owner', description: 'Admin-level access to all resources.' },
];

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Sofia Davis',
    email: 'm@example.com',
    avatar: '/avatars/01.png',
    initials: 'OM',
    role: 'Owner',
  },
  {
    name: 'Jackson Lee',
    email: 'p@example.com',
    avatar: '/avatars/02.png',
    initials: 'JL',
    role: 'Member',
  },
  {
    name: 'Isabella Nguyen',
    email: 'i@example.com',
    avatar: '/avatars/03.png',
    initials: 'IN',
    role: 'Member',
  },
];

function RoleSelector({ currentRole }: { currentRole: string }): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="ml-auto" size="sm" variant="outline">
          {currentRole} <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0">
        <Command>
          <CommandInput placeholder="Select new role..." />
          <CommandList>
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup className="p-1.5">
              {AVAILABLE_ROLES.map((role) => (
                <CommandItem key={role.name} className="flex flex-col items-start space-y-1 px-4 py-2">
                  <p>{role.name}</p>
                  <p className="text-muted-foreground text-sm">{role.description}</p>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TeamMemberItem({ member }: { member: TeamMember }): JSX.Element {
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
      <RoleSelector currentRole={member.role} />
    </div>
  );
}

export function CardsTeamMembers(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Invite your team members to collaborate.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {TEAM_MEMBERS.map((member) => (
          <TeamMemberItem key={member.email} member={member} />
        ))}
      </CardContent>
    </Card>
  );
}
