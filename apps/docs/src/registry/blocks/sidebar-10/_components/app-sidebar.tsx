"use client";

import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@codefast/ui";
import {
  AudioWaveformIcon,
  BlocksIcon,
  CalendarIcon,
  CommandIcon,
  HomeIcon,
  InboxIcon,
  MessageCircleQuestionIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";

import { NavFavorites } from "@/registry/blocks/sidebar-10/_components/nav-favorites";
import { NavMain } from "@/registry/blocks/sidebar-10/_components/nav-main";
import { NavSecondary } from "@/registry/blocks/sidebar-10/_components/nav-secondary";
import { NavWorkspaces } from "@/registry/blocks/sidebar-10/_components/nav-workspaces";
import { TeamSwitcher } from "@/registry/blocks/sidebar-10/_components/team-switcher";

import type { ComponentProps, JSX } from "react";

// This is sample data.
const data = {
  teams: [
    { name: "Acme Inc", logo: CommandIcon, plan: "Enterprise" },
    { name: "Acme Corp.", logo: AudioWaveformIcon, plan: "Startup" },
    { name: "Evil Corp.", logo: CommandIcon, plan: "Free" },
  ],
  navMain: [
    { title: "Search", url: "#", icon: SearchIcon },
    { title: "Ask AI", url: "#", icon: SparklesIcon },
    { title: "Home", url: "#", icon: HomeIcon, isActive: true },
    { title: "Inbox", url: "#", icon: InboxIcon, badge: "10" },
  ],
  navSecondary: [
    { title: "Calendar", url: "#", icon: CalendarIcon },
    { title: "Settings", url: "#", icon: Settings2Icon },
    { title: "Templates", url: "#", icon: BlocksIcon },
    { title: "Trash", url: "#", icon: Trash2Icon },
    { title: "Help", url: "#", icon: MessageCircleQuestionIcon },
  ],
  favorites: [
    { name: "Project Management & Task Tracking", url: "#", emoji: "📊" },
    { name: "Family Recipe Collection & Meal Planning", url: "#", emoji: "🍳" },
    { name: "Fitness Tracker & Workout Routines", url: "#", emoji: "💪" },
    { name: "Book Notes & Reading List", url: "#", emoji: "📚" },
    { name: "Sustainable Gardening Tips & Plant Care", url: "#", emoji: "🌱" },
    { name: "Language Learning Progress & Resources", url: "#", emoji: "🗣️" },
    { name: "Home Renovation Ideas & Budget Tracker", url: "#", emoji: "🏠" },
    { name: "Personal Finance & Investment Portfolio", url: "#", emoji: "💰" },
    { name: "Movie & TV Show Watchlist with Reviews", url: "#", emoji: "🎬" },
    { name: "Daily Habit Tracker & Goal Setting", url: "#", emoji: "✅" },
  ],
  workspaces: [
    {
      name: "Personal Life Management",
      emoji: "🏠",
      pages: [
        { name: "Daily Journal & Reflection", url: "#", emoji: "📔" },
        { name: "Health & Wellness Tracker", url: "#", emoji: "🍏" },
        { name: "Personal Growth & Learning Goals", url: "#", emoji: "🌟" },
      ],
    },
    {
      name: "Professional Development",
      emoji: "💼",
      pages: [
        { name: "Career Objectives & Milestones", url: "#", emoji: "🎯" },
        { name: "Skill Acquisition & Training Log", url: "#", emoji: "🧠" },
        { name: "Networking Contacts & Events", url: "#", emoji: "🤝" },
      ],
    },
    {
      name: "Creative Projects",
      emoji: "🎨",
      pages: [
        { name: "Writing Ideas & Story Outlines", url: "#", emoji: "✍️" },
        { name: "Art & Design Portfolio", url: "#", emoji: "🖼️" },
        { name: "Music Composition & Practice Log", url: "#", emoji: "🎵" },
      ],
    },
    {
      name: "Home Management",
      emoji: "🏡",
      pages: [
        { name: "Household Budget & Expense Tracking", url: "#", emoji: "💰" },
        { name: "Home Maintenance Schedule & Tasks", url: "#", emoji: "🔧" },
        { name: "Family Calendar & Event Planning", url: "#", emoji: "📅" },
      ],
    },
    {
      name: "Travel & Adventure",
      emoji: "🧳",
      pages: [
        { name: "Trip Planning & Itineraries", url: "#", emoji: "🗺️" },
        { name: "Travel Bucket List & Inspiration", url: "#", emoji: "🌎" },
        { name: "Travel Journal & Photo Gallery", url: "#", emoji: "📸" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.workspaces} />
        <NavSecondary className="mt-auto" items={data.navSecondary} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
