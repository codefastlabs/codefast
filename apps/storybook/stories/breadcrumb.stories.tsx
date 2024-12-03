import { useMediaQuery } from '@codefast/hooks';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codefast/ui';
import { ChevronDownIcon, SlashIcon } from '@radix-ui/react-icons';
import { type Meta, type StoryObj } from '@storybook/react';
import Link from 'next/link';
import { Fragment, useState } from 'react';

const meta = {
  component: Breadcrumb,
  tags: ['autodocs'],
  title: 'UI/Breadcrumb',
} satisfies Meta<typeof Breadcrumb>;

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              <BreadcrumbEllipsis />
              <span className="sr-only">Toggle menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Documentation</DropdownMenuItem>
              <DropdownMenuItem>Themes</DropdownMenuItem>
              <DropdownMenuItem>GitHub</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Custom Separator
 * -------------------------------------------------------------------------- */

export const CustomSeparator: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Dropdown
 * -------------------------------------------------------------------------- */

export const Dropdown: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              Components
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Documentation</DropdownMenuItem>
              <DropdownMenuItem>Themes</DropdownMenuItem>
              <DropdownMenuItem>GitHub</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Collapsed
 * -------------------------------------------------------------------------- */

export const Collapsed: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: AsLink
 * -------------------------------------------------------------------------- */

export const AsLink: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="#">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="#">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Responsive Breadcrumb
 * -------------------------------------------------------------------------- */

const items = [
  { href: '#', label: 'Home' },
  { href: '#', label: 'Documentation' },
  { href: '#', label: 'Building Your Application' },
  { href: '#', label: 'Data Fetching' },
  { label: 'Caching and Revalidating' },
];

const ITEMS_TO_DISPLAY = 3;

export const ResponsiveBreadcrumb: Story = {
  render: (args) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [open, setOpen] = useState(false);

    return (
      <Breadcrumb {...args}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={items[0].href}>{items[0].label}</BreadcrumbLink>
          </BreadcrumbItem>
          {items.length > ITEMS_TO_DISPLAY ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isDesktop ? (
                  <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger aria-label="Toggle menu" className="flex items-center gap-1">
                      <BreadcrumbEllipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {items.slice(1, -2).map((item, index) => (
                        <DropdownMenuItem key={index}>
                          <Link href={item.href ? item.href : '#'}>{item.label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerTrigger aria-label="Toggle Menu">
                      <BreadcrumbEllipsis />
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader className="text-left">
                        <DrawerTitle>Navigate to</DrawerTitle>
                        <DrawerDescription>Select a page to navigate to.</DrawerDescription>
                      </DrawerHeader>
                      <div className="grid gap-1 px-4">
                        {items.slice(1, -2).map((item, index) => (
                          <Link key={index} className="py-1 text-sm" href={item.href ? item.href : '#'}>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <DrawerFooter className="pt-4">
                        <DrawerClose>Close</DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                )}
              </BreadcrumbItem>
            </>
          ) : null}
          {items.slice(-ITEMS_TO_DISPLAY + 1).map((item, index) => (
            <Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild className="max-w-20 truncate md:max-w-none">
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="max-w-20 truncate md:max-w-none">{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
};
