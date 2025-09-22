"use client";

import type { ComponentProps, JSX } from "react";

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

import { NavFavorites } from "@/registry/blocks/sidebar-15/_components/nav-favorites";
import { NavMain } from "@/registry/blocks/sidebar-15/_components/nav-main";
import { NavSecondary } from "@/registry/blocks/sidebar-15/_components/nav-secondary";
import { NavWorkspaces } from "@/registry/blocks/sidebar-15/_components/nav-workspaces";
import { TeamSwitcher } from "@/registry/blocks/sidebar-15/_components/team-switcher";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@codefast/ui";

// This is sample data.
const data = {
  favorites: [
    { emoji: "📊", name: "Project Management & Task Tracking", url: "#" },
    { emoji: "🍳", name: "Family Recipe Collection & Meal Planning", url: "#" },
    { emoji: "💪", name: "Fitness Tracker & Workout Routines", url: "#" },
    { emoji: "📚", name: "Book Notes & Reading List", url: "#" },
    { emoji: "🌱", name: "Sustainable Gardening Tips & Plant Care", url: "#" },
    { emoji: "🗣️", name: "Language Learning Progress & Resources", url: "#" },
    { emoji: "🏠", name: "Home Renovation Ideas & Budget Tracker", url: "#" },
    { emoji: "💰", name: "Personal Finance & Investment Portfolio", url: "#" },
    { emoji: "🎬", name: "Movie & TV Show Watchlist with Reviews", url: "#" },
    { emoji: "✓", name: "Daily Habit Tracker & Goal Setting", url: "#" },
  ],
  navMain: [
    { icon: SearchIcon, title: "Search", url: "#" },
    { icon: SparklesIcon, title: "Ask AI", url: "#" },
    { icon: HomeIcon, isActive: true, title: "Home", url: "#" },
    { badge: "10", icon: InboxIcon, title: "Inbox", url: "#" },
  ],
  navSecondary: [
    { icon: CalendarIcon, title: "Calendar", url: "#" },
    { icon: Settings2Icon, title: "Settings", url: "#" },
    { icon: BlocksIcon, title: "Templates", url: "#" },
    { icon: Trash2Icon, title: "Trash", url: "#" },
    { icon: MessageCircleQuestionIcon, title: "Help", url: "#" },
  ],
  teams: [
    { logo: CommandIcon, name: "Acme Inc", plan: "Enterprise" },
    { logo: AudioWaveformIcon, name: "Acme Corp.", plan: "Startup" },
    { logo: CommandIcon, name: "Evil Corp.", plan: "Free" },
  ],
  workspaces: [
    {
      emoji: "🏠",
      name: "Personal Life Management",
      pages: [
        { emoji: "📔", name: "Daily Journal & Reflection", url: "#" },
        { emoji: "🍏", name: "Health & Wellness Tracker", url: "#" },
        { emoji: "🌟", name: "Personal Growth & Learning Goals", url: "#" },
      ],
    },
    {
      emoji: "💼",
      name: "Professional Development",
      pages: [
        { emoji: "🎯", name: "Career Objectives & Milestones", url: "#" },
        { emoji: "🧠", name: "Skill Acquisition & Training Log", url: "#" },
        { emoji: "🤝", name: "Networking Contacts & Events", url: "#" },
      ],
    },
    {
      emoji: "🎨",
      name: "Creative Projects",
      pages: [
        { emoji: "✍️", name: "Writing Ideas & Story Outlines", url: "#" },
        { emoji: "🖼️", name: "Art & Design Portfolio", url: "#" },
        { emoji: "🎵", name: "Music Composition & Practice Log", url: "#" },
      ],
    },
    {
      emoji: "🏡",
      name: "Home Management",
      pages: [
        { emoji: "💰", name: "Household Budget & Expense Tracking", url: "#" },
        { emoji: "🔧", name: "Home Maintenance Schedule & Tasks", url: "#" },
        { emoji: "📅", name: "Family Calendar & Event Planning", url: "#" },
      ],
    },
    {
      emoji: "🧳",
      name: "Travel & Adventure",
      pages: [
        { emoji: "🗺️", name: "Trip Planning & Itineraries", url: "#" },
        { emoji: "🌎", name: "Travel Bucket List & Inspiration", url: "#" },
        { emoji: "📸", name: "Travel Journal & Photo Gallery", url: "#" },
      ],
    },
  ],
};

export function SidebarLeft({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
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
