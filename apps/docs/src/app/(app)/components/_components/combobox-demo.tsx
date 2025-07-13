"use client";

import { CheckIcon, ChevronDownIcon, ChevronsUpDownIcon, PlusCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@codefast/ui";

const frameworkOptions = [
  { label: "Next.js", value: "next.js" },
  { label: "SvelteKit", value: "sveltekit" },
  { label: "Nuxt.js", value: "nuxt.js" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
];

type Framework = (typeof frameworkOptions)[number];

const usersOptions = [
  { avatar: "/avatars/codefast-ui.webp", id: "1", username: "codefastlabs" },
  { avatar: "/avatars/leerob.png", id: "2", username: "leerob" },
  { avatar: "/avatars/evilrabbit.png", id: "3", username: "evilrabbit" },
] as const;

type User = (typeof usersOptions)[number];

const timezonesOptions = [
  {
    label: "Americas",
    timezones: [
      { label: "(GMT-5) New York", value: "America/New_York" },
      { label: "(GMT-8) Los Angeles", value: "America/Los_Angeles" },
      { label: "(GMT-6) Chicago", value: "America/Chicago" },
      { label: "(GMT-5) Toronto", value: "America/Toronto" },
      { label: "(GMT-8) Vancouver", value: "America/Vancouver" },
      { label: "(GMT-3) São Paulo", value: "America/Sao_Paulo" },
    ],
  },
  {
    label: "Europe",
    timezones: [
      { label: "(GMT+0) London", value: "Europe/London" },
      { label: "(GMT+1) Paris", value: "Europe/Paris" },
      { label: "(GMT+1) Berlin", value: "Europe/Berlin" },
      { label: "(GMT+1) Rome", value: "Europe/Rome" },
      { label: "(GMT+1) Madrid", value: "Europe/Madrid" },
      { label: "(GMT+1) Amsterdam", value: "Europe/Amsterdam" },
    ],
  },
  {
    label: "Asia/Pacific",
    timezones: [
      { label: "(GMT+9) Tokyo", value: "Asia/Tokyo" },
      { label: "(GMT+8) Shanghai", value: "Asia/Shanghai" },
      { label: "(GMT+8) Singapore", value: "Asia/Singapore" },
      { label: "(GMT+4) Dubai", value: "Asia/Dubai" },
      { label: "(GMT+11) Sydney", value: "Australia/Sydney" },
      { label: "(GMT+9) Seoul", value: "Asia/Seoul" },
    ],
  },
] as const;

type Timezone = (typeof timezonesOptions)[number];

export function ComboboxDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <FrameworkCombobox frameworks={[...frameworkOptions]} />
      </div>
      <div className="">
        <UserCombobox selectedUserId={usersOptions[0].id} users={[...usersOptions]} />
      </div>
      <div className="">
        <TimezoneCombobox selectedTimezone={timezonesOptions[0].timezones[0]} timezones={[...timezonesOptions]} />
      </div>
      <div className="">
        <ComboboxWithCheckbox frameworks={[...frameworkOptions]} />
      </div>
    </GridWrapper>
  );
}

function FrameworkCombobox({ frameworks }: { frameworks: Framework[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-full justify-between md:max-w-[200px]"
          suffix={<ChevronsUpDownIcon className="text-muted-foreground" />}
          variant="outline"
        >
          {value ? frameworks.find((framework) => framework.value === value)?.label : "Select framework..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {framework.label}

                  <CheckIcon className={cn("ml-auto", value === framework.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function UserCombobox({ selectedUserId, users }: { selectedUserId: string; users: User[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedUserId);

  const selectedUser = useMemo(() => users.find((user) => user.id === value), [value, users]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-full justify-between px-3 md:max-w-[200px]"
          suffix={<ChevronsUpDownIcon className="text-muted-foreground" />}
          variant="outline"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
              </Avatar>
              {selectedUser.username}
            </div>
          ) : (
            "Select user..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search user..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Avatar className="size-5">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                  {user.username}

                  <CheckIcon className={cn("ml-auto", value === user.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem>
                <PlusCircleIcon />
                Create user
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TimezoneCombobox({
  selectedTimezone,
  timezones,
}: {
  timezones: Timezone[];
  selectedTimezone?: Timezone["timezones"][number];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedTimezone?.value);

  const selectedGroup = useMemo(
    () => timezones.find((group) => group.timezones.find((tz) => tz.value === value)),
    [value, timezones],
  );

  const selectedTimezoneLabel = useMemo(
    () => selectedGroup?.timezones.find((tz) => tz.value === value)?.label,
    [value, selectedGroup],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="h-12 w-full justify-between px-3 md:max-w-[200px]"
          suffix={<ChevronDownIcon className="text-muted-foreground" />}
          variant="outline"
        >
          {selectedTimezone ? (
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-muted-foreground text-xs font-normal">{selectedGroup?.label}</span>
              <span>{selectedTimezoneLabel}</span>
            </div>
          ) : (
            "Select timezone"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList className="scroll-pb-12">
            <CommandEmpty>No timezone found.</CommandEmpty>
            {timezones.map((region) => (
              <CommandGroup key={region.label} heading={region.label}>
                {region.timezones.map((timezone) => (
                  <CommandItem
                    key={timezone.value}
                    value={timezone.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue as Timezone["timezones"][number]["value"]);
                      setOpen(false);
                    }}
                  >
                    {timezone.label}

                    <CheckIcon
                      className="ml-auto opacity-0 data-[selected=true]:opacity-100"
                      data-selected={value === timezone.value}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            <CommandSeparator className="sticky bottom-10" />
            <CommandGroup className="bg-popover sticky bottom-0">
              <CommandItem>
                <PlusCircleIcon />
                Create timezone
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ComboboxWithCheckbox({ frameworks }: { frameworks: Framework[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedFrameworks, setSelectedFrameworks] = useState<Framework[]>([]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-fit max-w-full justify-between"
          suffix={<ChevronsUpDownIcon className="text-muted-foreground" />}
          variant="outline"
        >
          <span className="truncate">
            {selectedFrameworks.length > 0
              ? selectedFrameworks.map((framework) => framework.label).join(", ")
              : "Select frameworks (multi-select)..."}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setSelectedFrameworks(
                      selectedFrameworks.some((f) => f.value === currentValue)
                        ? selectedFrameworks.filter((f) => f.value !== currentValue)
                        : [...selectedFrameworks, framework],
                    );
                  }}
                >
                  <div
                    className="border-input data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground *:[svg]:opacity-0 data-[selected=true]:*:[svg]:opacity-100 pointer-events-none size-4 shrink-0 select-none rounded-[4px] border transition-all"
                    data-selected={selectedFrameworks.some((f) => f.value === framework.value)}
                  >
                    <CheckIcon className="size-3.5 text-current" />
                  </div>
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
