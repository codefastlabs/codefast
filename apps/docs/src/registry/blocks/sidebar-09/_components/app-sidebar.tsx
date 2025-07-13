"use client";

import { ArchiveXIcon, CommandIcon, FileIcon, InboxIcon, SendIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ComponentProps, JSX } from "react";

import { NavUser } from "@/registry/blocks/sidebar-09/_components/nav-user";
import {
  Label,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Switch,
  useSidebar,
} from "@codefast/ui";

// This is sample data
const data = {
  mails: [
    {
      date: "09:34 AM",
      email: "williamsmith@example.com",
      name: "William Smith",
      subject: "Meeting Tomorrow",
      teaser:
        "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    },
    {
      date: "Yesterday",
      email: "alicesmith@example.com",
      name: "Alice Smith",
      subject: "Re: Project Update",
      teaser:
        "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
    {
      date: "2 days ago",
      email: "bobjohnson@example.com",
      name: "Bob Johnson",
      subject: "Weekend Plans",
      teaser:
        "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
    },
    {
      date: "2 days ago",
      email: "emilydavis@example.com",
      name: "Emily Davis",
      subject: "Re: Question about Budget",
      teaser:
        "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
    },
    {
      date: "1 week ago",
      email: "michaelwilson@example.com",
      name: "Michael Wilson",
      subject: "Important Announcement",
      teaser:
        "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
    },
    {
      date: "1 week ago",
      email: "sarahbrown@example.com",
      name: "Sarah Brown",
      subject: "Re: Feedback on Proposal",
      teaser:
        "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
    },
    {
      date: "1 week ago",
      email: "davidlee@example.com",
      name: "David Lee",
      subject: "New Project Idea",
      teaser:
        "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
    },
    {
      date: "1 week ago",
      email: "oliviawilson@example.com",
      name: "Olivia Wilson",
      subject: "Vacation Plans",
      teaser:
        "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
    },
    {
      date: "1 week ago",
      email: "jamesmartin@example.com",
      name: "James Martin",
      subject: "Re: Conference Registration",
      teaser:
        "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
    },
    {
      date: "1 week ago",
      email: "sophiawhite@example.com",
      name: "Sophia White",
      subject: "Team Dinner",
      teaser:
        "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
    },
  ],
  navMain: [
    { icon: InboxIcon, isActive: true, title: "Inbox", url: "#" },
    { icon: FileIcon, isActive: false, title: "Drafts", url: "#" },
    { icon: SendIcon, isActive: false, title: "Sent", url: "#" },
    { icon: ArchiveXIcon, isActive: false, title: "Junk", url: "#" },
    { icon: Trash2Icon, isActive: false, title: "Trash", url: "#" },
  ],
  user: { avatar: "/avatars/codefast-ui.webp", email: "m@example.com", name: "@codefast/ui" },
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  // Note: I'm using state to show an active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = useState(data.navMain[0]);
  const [mails, setMails] = useState(data.mails);
  const { setOpen } = useSidebar("AppSidebar");

  return (
    <Sidebar className="overflow-hidden *:data-[sidebar=sidebar]:flex-row" collapsible="icon" {...props}>
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar className="w-(--sidebar-width-icon) border-r" collapsible="none">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="md:h-8 md:p-0" size="lg">
                <Link href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <CommandIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className="px-2.5 md:px-2"
                      isActive={activeItem.title === item.title}
                      tooltip={{ children: item.title, hidden: false }}
                      onClick={() => {
                        setActiveItem(item);
                        const mail = data.mails.sort(() => Math.random() - 0.5);

                        setMails(mail.slice(0, Math.max(5, Math.floor(Math.random() * 10) + 1)));
                        setOpen(true);
                      }}
                    >
                      <item.icon />
                      <span className="sr-only">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill the remaining space */}
      <Sidebar className="hidden flex-1 md:flex" collapsible="none">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">{activeItem.title}</div>
            <Label className="flex items-center gap-2 text-sm">
              <span>Unreads</span>
              <Switch className="shadow-none" />
            </Label>
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {mails.map((mail) => (
                <Link
                  key={mail.email}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0"
                  href="/"
                >
                  <div className="flex w-full items-center gap-2">
                    <span>{mail.name}</span>
                    <span className="ml-auto text-xs">{mail.date}</span>
                  </div>
                  <span className="font-medium">{mail.subject}</span>
                  <span className="line-clamp-2 whitespace-break-spaces text-xs">{mail.teaser}</span>
                </Link>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
