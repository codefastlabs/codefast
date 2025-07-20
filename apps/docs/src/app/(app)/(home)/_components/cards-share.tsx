"use client";

import type { JSX } from "react";

import { useId } from "react";

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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  toast,
} from "@codefast/ui";

type UserPermission = "edit" | "view";

interface User {
  avatar: string;
  email: string;
  initials: string;
  name: string;
  permission: UserPermission;
}

function UserAccessRow({ user }: { user: User }): JSX.Element {
  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage alt={`${user.name}'s avatar`} src={user.avatar} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>
      <Select defaultValue={user.permission}>
        <SelectTrigger aria-label="Edit permission" className="ml-auto w-[110px]">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="edit">Can edit</SelectItem>
          <SelectItem value="view">Can view</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function CardsShare(): JSX.Element {
  const id = useId();
  const documentLink = "https://example.com/link/to/document";

  const usersWithAccess: User[] = [
    {
      avatar: "/avatars/03.png",
      email: "m@example.com",
      initials: "OM",
      name: "Olivia Martin",
      permission: "edit",
    },
    {
      avatar: "/avatars/05.png",
      email: "b@example.com",
      initials: "IN",
      name: "Isabella Nguyen",
      permission: "view",
    },
    {
      avatar: "/avatars/01.png",
      email: "p@example.com",
      initials: "SD",
      name: "Sofia Davis",
      permission: "view",
    },
  ];

  const handleCopyLink = (): void => {
    navigator.clipboard
      .writeText(documentLink)
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch((error: unknown) => {
        toast.error("Failed to copy link");

        console.error("Copy error:", error);
      });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Share this document</CardTitle>
        <CardDescription>Anyone with the link can view this document.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Label className="sr-only" htmlFor={`${id}-link`}>
            Link
          </Label>
          <Input readOnly id={`${id}-link`} value={documentLink} />
          <Button className="shrink-0" onClick={handleCopyLink}>
            Copy Link
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="text-sm font-medium">People with access</div>
          <div className="grid gap-6">
            {usersWithAccess.map((user) => (
              <UserAccessRow key={user.email} user={user} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
