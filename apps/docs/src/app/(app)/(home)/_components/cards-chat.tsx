"use client";

import type { JSX } from "react";

import { Check, Plus, Send } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@codefast/tailwind-variants";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@codefast/ui";

interface User {
  avatar: string;
  email: string;
  name: string;
}

const users: User[] = [
  {
    avatar: "/avatars/01.png",
    email: "m@example.com",
    name: "Olivia Martin",
  },
  {
    avatar: "/avatars/03.png",
    email: "isabella.nguyen@email.com",
    name: "Isabella Nguyen",
  },
  {
    avatar: "/avatars/05.png",
    email: "emma@example.com",
    name: "Emma Wilson",
  },
  {
    avatar: "/avatars/02.png",
    email: "lee@example.com",
    name: "Jackson Lee",
  },
  {
    avatar: "/avatars/04.png",
    email: "will@email.com",
    name: "William Kim",
  },
] as const;

export function CardsChat(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const [messages, setMessages] = useState([
    {
      content: "Hi, how can I help you today?",
      role: "agent",
    },
    {
      content: "Hey, I'm having trouble with my account.",
      role: "user",
    },
    {
      content: "What seems to be the problem?",
      role: "agent",
    },
    {
      content: "I can't log in.",
      role: "user",
    },
  ]);
  const [input, setInput] = useState("");
  const inputLength = input.trim().length;
  const inputId = useId();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage alt="Image" src="/avatars/01.png" />
              <AvatarFallback>OM</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">Sofia Davis</p>
              <p className="text-muted-foreground text-sm">m@example.com</p>
            </div>
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="ml-auto rounded-full"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  <Plus />
                  <span className="sr-only">New message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>New message</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted",
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <form
            className="flex w-full items-center space-x-2"
            onSubmit={(event) => {
              event.preventDefault();

              if (inputLength === 0) {
                return;
              }

              setMessages([
                ...messages,
                {
                  content: input,
                  role: "user",
                },
              ]);
              setInput("");
            }}
          >
            <Input
              autoComplete="off"
              className="flex-1"
              id={inputId}
              placeholder="Type your message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
            />
            <Button disabled={inputLength === 0} size="icon" type="submit">
              <Send />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 outline-none">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>
              Invite a user to this thread. This will create a new group message.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="border-y px-0 py-0">
            <Command className="overflow-hidden rounded-t-none bg-transparent">
              <CommandInput placeholder="Search user..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup className="p-2">
                  {users.map((user) => (
                    <CommandItem
                      key={user.email}
                      className="flex items-center px-2"
                      onSelect={() => {
                        if (selectedUsers.includes(user)) {
                          setSelectedUsers(
                            selectedUsers.filter((selectedUser) => selectedUser !== user),
                          );

                          return;
                        }

                        setSelectedUsers(
                          [...users].filter((u) => [...selectedUsers, user].includes(u)),
                        );
                      }}
                    >
                      <Avatar>
                        <AvatarImage alt="Image" src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-muted-foreground text-sm">{user.email}</p>
                      </div>
                      {selectedUsers.includes(user) ? (
                        <Check className="text-primary ml-auto flex h-5 w-5" />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogBody>
          <DialogFooter className="flex items-center pt-4 sm:justify-between">
            {selectedUsers.length > 0 ? (
              <div className="flex -space-x-2 overflow-hidden">
                {selectedUsers.map((user) => (
                  <Avatar key={user.email} className="border-background inline-block border-2">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Select users to add to this thread.</p>
            )}
            <Button
              disabled={selectedUsers.length < 2}
              onClick={() => {
                setOpen(false);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
