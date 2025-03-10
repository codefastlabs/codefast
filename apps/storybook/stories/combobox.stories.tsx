import type { Meta, StoryObj } from '@storybook/react';
import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import type { SubmitHandler } from 'react-hook-form';

import { useMediaQuery } from '@codefast/hooks';
import {
  Badge,
  Button,
  cn,
  Code,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Pre,
  Text,
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowUpCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  CircleIcon,
  HelpCircleIcon,
  MoreHorizontalIcon,
  TagsIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  tags: ['autodocs'],
  title: 'UI/Combobox',
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof Popover>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

interface Framework {
  label: string;
  value: string;
}

const frameworks: Framework[] = [
  {
    label: 'Next.js',
    value: 'next.js',
  },
  {
    label: 'SvelteKit',
    value: 'sveltekit',
  },
  {
    label: 'Nuxt.js',
    value: 'nuxt.js',
  },
  {
    label: 'Remix',
    value: 'remix',
  },
  {
    label: 'Astro',
    value: 'astro',
  },
];

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    return (
      <Popover open={open} onOpenChange={setOpen} {...args}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className="w-[12.5rem] justify-between px-3"
            role="combobox"
            suffix={<ChevronsUpDownIcon className="opacity-50" />}
            variant="outline"
          >
            {value ? frameworks.find((framework) => framework.value === value)?.label : 'Select framework...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[12.5rem] p-0">
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
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon className={cn('size-4', value === framework.value ? 'opacity-100' : 'opacity-0')} />
                    {framework.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Popover
 * -------------------------------------------------------------------------- */

interface Status {
  icon: LucideIcon;
  label: string;
  value: string;
}

const statuses: Status[] = [
  {
    icon: HelpCircleIcon,
    label: 'Backlog',
    value: 'backlog',
  },
  {
    icon: CircleIcon,
    label: 'Todo',
    value: 'todo',
  },
  {
    icon: ArrowUpCircleIcon,
    label: 'In Progress',
    value: 'in progress',
  },
  {
    icon: CheckCircle2Icon,
    label: 'Done',
    value: 'done',
  },
  {
    icon: XCircleIcon,
    label: 'Canceled',
    value: 'canceled',
  },
];

export const WithPopover: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<null | Status>(null);

    return (
      <div className="flex items-center space-x-4">
        <Text className="text-muted-foreground text-sm">Status</Text>
        <Popover open={open} onOpenChange={setOpen} {...args}>
          <PopoverTrigger asChild>
            <Button className="w-[9.375rem] justify-start px-3" size="sm" variant="outline">
              {selectedStatus ? (
                <>
                  <selectedStatus.icon className="size-4 shrink-0" />
                  {selectedStatus.label}
                </>
              ) : (
                <>+ Set status</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0" side="right">
            <Command>
              <CommandInput placeholder="Change status..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {statuses.map(({ icon: Icon, ...status }) => (
                    <CommandItem
                      key={status.value}
                      value={status.value}
                      onSelect={(value) => {
                        setSelectedStatus(statuses.find((priority) => priority.value === value) ?? null);
                        setOpen(false);
                      }}
                    >
                      <Icon
                        className={cn('size-4', status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40')}
                      />
                      <span>{status.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Dropdown Menu
 * -------------------------------------------------------------------------- */

const labels = ['feature', 'bug', 'enhancement', 'documentation', 'design', 'question', 'maintenance'];

export const WithDropdownMenu: Story = {
  render: (args) => {
    const [currentLabel, setCurrentLabel] = useState('feature');
    const [open, setOpen] = useState(false);

    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-md border px-4 py-3">
        <div className="space-x-2 text-sm font-medium leading-none">
          <Badge className="rounded-full">{currentLabel}</Badge>
          <span className="text-muted-foreground">Create a new project</span>
        </div>
        <DropdownMenu open={open} onOpenChange={setOpen} {...args}>
          <DropdownMenuTrigger asChild>
            <Button icon aria-label="Actions" prefix={<MoreHorizontalIcon />} size="sm" variant="ghost" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[12.5rem]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon className="size-4" />
                Assign to...
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarIcon className="size-4" />
                Set due date...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TagsIcon className="size-4" />
                  Apply label
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Filter label..." />
                    <CommandList>
                      <CommandEmpty>No label found.</CommandEmpty>
                      <CommandGroup>
                        {labels.map((label) => (
                          <CommandItem
                            key={label}
                            value={label}
                            onSelect={(value) => {
                              setCurrentLabel(value);
                              setOpen(false);
                            }}
                          >
                            {label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <TrashIcon className="size-4" />
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Responsive Combobox
 * -------------------------------------------------------------------------- */

function StatusList({
  setOpen,
  setSelectedStatus,
}: {
  setOpen: (open: boolean) => void;
  setSelectedStatus: (status: null | Status) => void;
}): JSX.Element {
  return (
    <Command>
      <CommandInput placeholder="Filter status..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {statuses.map((status) => (
            <CommandItem
              key={status.value}
              value={status.value}
              onSelect={(value) => {
                setSelectedStatus(statuses.find((priority) => priority.value === value) || null);
                setOpen(false);
              }}
            >
              {status.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export const ResponsiveCombobox: Story = {
  render: (args) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [open, setOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<null | Status>(null);

    if (isDesktop) {
      return (
        <Popover open={open} onOpenChange={setOpen} {...args}>
          <PopoverTrigger asChild>
            <Button className="w-[9.375rem] justify-start px-3" variant="outline">
              {selectedStatus ? <>{selectedStatus.label}</> : <>+ Set status</>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[12.5rem] p-0">
            <StatusList setOpen={setOpen} setSelectedStatus={setSelectedStatus} />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button className="w-[9.375rem] justify-start px-3" variant="outline">
            {selectedStatus ? <>{selectedStatus.label}</> : <>+ Set status</>}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mt-4 border-t">
            <StatusList setOpen={setOpen} setSelectedStatus={setSelectedStatus} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const;

export const WithReactHookForm: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  render: (args) => {
    const formValues = z.object({
      language: z.string({
        required_error: 'Please select a language.',
      }),
    });

    const form = useForm<z.infer<typeof formValues>>({
      resolver: zodResolver(formValues),
    });

    const onSubmit: SubmitHandler<z.infer<typeof formValues>> = (values): void => {
      toast.message('You submitted the following values:', {
        description: (
          <Pre className="w-full rounded-md bg-slate-950 p-4">
            <Code className="text-white">{JSON.stringify(values, null, 2)}</Code>
          </Pre>
        ),
      });
    };

    return (
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Language</FormLabel>
                <Popover {...args}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn('w-[12.5rem] justify-between px-3', !field.value && 'text-muted-foreground')}
                        role="combobox"
                        suffix={<ChevronsUpDownIcon className="opacity-50" />}
                        variant="outline"
                      >
                        {field.value
                          ? languages.find((language) => language.value === field.value)?.label
                          : 'Select language'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[12.5rem] p-0">
                    <Command>
                      <CommandInput placeholder="Search language..." />
                      <CommandList>
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                          {languages.map((language) => (
                            <CommandItem
                              key={language.value}
                              value={language.label}
                              onSelect={() => {
                                form.setValue('language', language.value);
                              }}
                            >
                              <CheckIcon
                                className={cn('size-4', language.value === field.value ? 'opacity-100' : 'opacity-0')}
                              />
                              {language.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>This is the language that will be used in the dashboard.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
};
