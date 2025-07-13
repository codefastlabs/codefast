"use client";

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

const data = [
  [
    { icon: Settings2Icon, label: "Customize Page" },
    { icon: FileTextIcon, label: "Turn into wiki" },
  ],
  [
    { icon: LinkIcon, label: "Copy Link" },
    { icon: CopyIcon, label: "Duplicate" },
    { icon: CornerUpRightIcon, label: "Move to" },
    { icon: Trash2Icon, label: "Move to Trash" },
  ],
  [
    { icon: CornerUpLeftIcon, label: "Undo" },
    { icon: LineChartIcon, label: "View analytics" },
    { icon: GalleryVerticalEndIcon, label: "Version History" },
    { icon: TrashIcon, label: "Show delete pages" },
    { icon: BellIcon, label: "Notifications" },
  ],
  [
    { icon: ArrowUpIcon, label: "Import" },
    { icon: ArrowDownIcon, label: "Export" },
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
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, menuIndex) => (
                        <SidebarMenuItem key={menuIndex}>
                          <SidebarMenuButton>
                            <item.icon />
                            <span>{item.label}</span>
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
