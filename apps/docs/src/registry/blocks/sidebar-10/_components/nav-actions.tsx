"use client";

import type { JSX } from "react";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@codefast/ui";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  CopyIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  LineChartIcon,
  LinkIcon,
  MoreHorizontalIcon,
  Settings2Icon,
  StarIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const data = [
  [
    { label: "Customize Page", icon: Settings2Icon },
    { label: "Turn into wiki", icon: FileTextIcon },
  ],
  [
    { label: "Copy Link", icon: LinkIcon },
    { label: "Duplicate", icon: CopyIcon },
    { label: "Move to", icon: CornerUpRightIcon },
    { label: "Move to Trash", icon: Trash2Icon },
  ],
  [
    { label: "Undo", icon: CornerUpLeftIcon },
    { label: "View analytics", icon: LineChartIcon },
    { label: "Version History", icon: GalleryVerticalEndIcon },
    { label: "Show delete pages", icon: TrashIcon },
    { label: "Notifications", icon: BellIcon },
  ],
  [
    { label: "Import", icon: ArrowUpIcon },
    { label: "Export", icon: ArrowDownIcon },
  ],
];

export function NavActions(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-muted-foreground hidden font-medium md:inline-block">Edit Oct 08</div>
      <Button className="size-7" size="icon" variant="ghost">
        <StarIcon />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button className="data-[state=open]:bg-accent size-7" size="icon" variant="ghost">
            <MoreHorizontalIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 overflow-hidden rounded-lg p-0">
          <Sidebar className="bg-transparent" collapsible="none">
            <SidebarContent>
              {data.map((group, index) => (
                // eslint-disable-next-line react/no-array-index-key -- we need index
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, menuIndex) => (
                        // eslint-disable-next-line react/no-array-index-key -- we need index
                        <SidebarMenuItem key={menuIndex}>
                          <SidebarMenuButton>
                            <item.icon /> <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  );
}
