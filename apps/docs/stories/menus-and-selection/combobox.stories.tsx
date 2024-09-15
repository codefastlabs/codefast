import { Popover, PopoverContent, PopoverTrigger } from '@codefast/ui/popover';
import { type JSX, useState } from 'react';
import { Button } from '@codefast/ui/button';
import {
  ArrowUpCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Circle,
  HelpCircle,
  type LucideIcon,
  MoreHorizontal,
  Tags,
  Trash,
  User,
  XCircle,
} from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@codefast/ui/command';
import { cn } from '@codefast/ui/utils';
import {
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
} from '@codefast/ui/dropdown-menu';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from '@codefast/ui/sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { Drawer, DrawerContent, DrawerTrigger } from '@codefast/ui/drawer';
import { Badge } from '@codefast/ui/badge';
import { Pre } from '@codefast/ui/pre';
import { Text } from '@codefast/ui/text';
import { Code } from '@codefast/ui/code';
import { useMediaQuery } from '@codefast/hooks/use-media-query';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  tags: ['autodocs'],
  title: 'Components/Menus and Selection/Combobox',
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

interface Framework {
  label: string;
  value: string;
}

const frameworks: Framework[] = [
  {
    value: 'next.js',
    label: 'Next.js',
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit',
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js',
  },
  {
    value: 'remix',
    label: 'Remix',
  },
  {
    value: 'astro',
    label: 'Astro',
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
            className="w-[200px] justify-between"
            role="combobox"
            suffix={<ChevronsUpDown className="opacity-50" />}
            variant="outline"
          >
            {value ? frameworks.find((framework) => framework.value === value)?.label : 'Select framework...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
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
                    <Check className={cn('mr-2 size-4', value === framework.value ? 'opacity-100' : 'opacity-0')} />
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
    value: 'backlog',
    label: 'Backlog',
    icon: HelpCircle,
  },
  {
    value: 'todo',
    label: 'Todo',
    icon: Circle,
  },
  {
    value: 'in progress',
    label: 'In Progress',
    icon: ArrowUpCircle,
  },
  {
    value: 'done',
    label: 'Done',
    icon: CheckCircle2,
  },
  {
    value: 'canceled',
    label: 'Canceled',
    icon: XCircle,
  },
];

export const WithPopover: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

    return (
      <div className="flex items-center space-x-4">
        <Text className="text-muted-foreground text-sm">Status</Text>
        <Popover open={open} onOpenChange={setOpen} {...args}>
          <PopoverTrigger asChild>
            <Button className="w-[150px] justify-start" size="sm" variant="outline">
              {selectedStatus ? (
                <>
                  <selectedStatus.icon className="mr-2 size-4 shrink-0" />
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
                        className={cn(
                          'mr-2 size-4',
                          status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40',
                        )}
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
      <div className="flex w-full flex-col items-start justify-between rounded-md border px-4 py-3 sm:flex-row sm:items-center">
        <div className="text-sm font-medium leading-none">
          <Badge className="mr-2 rounded-full">{currentLabel}</Badge>
          <span className="text-muted-foreground">Create a new project</span>
        </div>
        <DropdownMenu open={open} onOpenChange={setOpen} {...args}>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Actions" prefix={<MoreHorizontal />} shape="square" size="sm" variant="ghost" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                Assign to...
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 size-4" />
                Set due date...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tags className="mr-2 size-4" />
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
                <Trash className="mr-2 size-4" />
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
  setSelectedStatus: (status: Status | null) => void;
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
    const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

    if (isDesktop) {
      return (
        <Popover open={open} onOpenChange={setOpen} {...args}>
          <PopoverTrigger asChild>
            <Button className="w-[150px] justify-start" variant="outline">
              {selectedStatus ? <>{selectedStatus.label}</> : <>+ Set status</>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[200px] p-0">
            <StatusList setOpen={setOpen} setSelectedStatus={setSelectedStatus} />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button className="w-[150px] justify-start" variant="outline">
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

const formValues = z.object({
  language: z.string({
    required_error: 'Please select a language.',
  }),
});

type FormValues = z.infer<typeof formValues>;

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
    const form = useForm<FormValues>({
      resolver: zodResolver(formValues),
    });

    const onSubmit: SubmitHandler<FormValues> = (values): void => {
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
                        className={cn('w-[200px] justify-between', !field.value && 'text-muted-foreground')}
                        role="combobox"
                        suffix={<ChevronsUpDown className="opacity-50" />}
                        variant="outline"
                      >
                        {field.value
                          ? languages.find((language) => language.value === field.value)?.label
                          : 'Select language'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
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
                              <Check
                                className={cn(
                                  'mr-2 size-4',
                                  language.value === field.value ? 'opacity-100' : 'opacity-0',
                                )}
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
