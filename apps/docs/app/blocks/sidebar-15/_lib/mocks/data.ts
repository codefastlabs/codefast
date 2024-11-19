import {
  AudioWaveformIcon,
  BlocksIcon,
  CalendarIcon,
  CommandIcon,
  HomeIcon,
  InboxIcon,
  type LucideIcon,
  MessageCircleQuestionIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react';

// Định nghĩa interface cho một mục Navigation
export interface NavItem {
  icon: LucideIcon;
  title: string;
  url: string;
  badge?: string;
  // Chỉ định icon là một React component type
  isActive?: boolean;
}

// Định nghĩa interface cho một mục yêu thích
export interface FavoriteItem {
  emoji: string;
  name: string;
  url: string;
}

// Định nghĩa interface cho một trang trong workspace
interface WorkspacePage {
  emoji: string;
  name: string;
  url: string;
}

// Định nghĩa interface cho một workspace
export interface Workspace {
  emoji: string;
  name: string;
  pages: WorkspacePage[];
}

// Định nghĩa interface cho dữ liệu bên trái của sidebar
export interface SidebarLeftData {
  favorites: FavoriteItem[];
  navMain: NavItem[];
  navSecondary: NavItem[];
  teams: {
    logo: LucideIcon;
    name: string; // Chỉ định logo là một React component type
    plan: string;
  }[];
  workspaces: Workspace[];
}

// Định nghĩa interface cho dữ liệu user
export interface User {
  avatar: string;
  email: string;
  name: string;
}

// Định nghĩa interface cho mục Calendar
export interface Calendar {
  items: string[];
  name: string;
}

// Định nghĩa interface cho dữ liệu bên phải của sidebar
interface SidebarRightData {
  calendars: Calendar[];
  user: User;
}

export const sidebarLeftData: SidebarLeftData = {
  teams: [
    {
      name: 'Acme Inc',
      logo: CommandIcon,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveformIcon,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: CommandIcon,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Search',
      url: '#',
      icon: SearchIcon,
    },
    {
      title: 'Ask AI',
      url: '#',
      icon: SparklesIcon,
    },
    {
      title: 'Home',
      url: '#',
      icon: HomeIcon,
      isActive: true,
    },
    {
      title: 'Inbox',
      url: '#',
      icon: InboxIcon,
      badge: '10',
    },
  ],
  navSecondary: [
    {
      title: 'Calendar',
      url: '#',
      icon: CalendarIcon,
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2Icon,
    },
    {
      title: 'Templates',
      url: '#',
      icon: BlocksIcon,
    },
    {
      title: 'Trash',
      url: '#',
      icon: Trash2Icon,
    },
    {
      title: 'Help',
      url: '#',
      icon: MessageCircleQuestionIcon,
    },
  ],
  favorites: [
    {
      name: 'Project Management & Task Tracking',
      url: '#',
      emoji: '📊',
    },
    {
      name: 'Family Recipe Collection & Meal Planning',
      url: '#',
      emoji: '🍳',
    },
    {
      name: 'Fitness Tracker & Workout Routines',
      url: '#',
      emoji: '💪',
    },
    {
      name: 'Book Notes & Reading List',
      url: '#',
      emoji: '📚',
    },
    {
      name: 'Sustainable Gardening Tips & Plant Care',
      url: '#',
      emoji: '🌱',
    },
    {
      name: 'Language Learning Progress & Resources',
      url: '#',
      emoji: '🗣️',
    },
    {
      name: 'Home Renovation Ideas & Budget Tracker',
      url: '#',
      emoji: '🏠',
    },
    {
      name: 'Personal Finance & Investment Portfolio',
      url: '#',
      emoji: '💰',
    },
    {
      name: 'Movie & TV Show Watchlist with Reviews',
      url: '#',
      emoji: '🎬',
    },
    {
      name: 'Daily Habit Tracker & Goal Setting',
      url: '#',
      emoji: '✅',
    },
  ],
  workspaces: [
    {
      name: 'Personal Life Management',
      emoji: '🏠',
      pages: [
        {
          name: 'Daily Journal & Reflection',
          url: '#',
          emoji: '📔',
        },
        {
          name: 'Health & Wellness Tracker',
          url: '#',
          emoji: '🍏',
        },
        {
          name: 'Personal Growth & Learning Goals',
          url: '#',
          emoji: '🌟',
        },
      ],
    },
    {
      name: 'Professional Development',
      emoji: '💼',
      pages: [
        {
          name: 'Career Objectives & Milestones',
          url: '#',
          emoji: '🎯',
        },
        {
          name: 'Skill Acquisition & Training Log',
          url: '#',
          emoji: '🧠',
        },
        {
          name: 'Networking Contacts & Events',
          url: '#',
          emoji: '🤝',
        },
      ],
    },
    {
      name: 'Creative Projects',
      emoji: '🎨',
      pages: [
        {
          name: 'Writing Ideas & Story Outlines',
          url: '#',
          emoji: '✍️',
        },
        {
          name: 'Art & Design Portfolio',
          url: '#',
          emoji: '🖼️',
        },
        {
          name: 'Music Composition & Practice Log',
          url: '#',
          emoji: '🎵',
        },
      ],
    },
    {
      name: 'Home Management',
      emoji: '🏡',
      pages: [
        {
          name: 'Household Budget & Expense Tracking',
          url: '#',
          emoji: '💰',
        },
        {
          name: 'Home Maintenance Schedule & Tasks',
          url: '#',
          emoji: '🔧',
        },
        {
          name: 'Family Calendar & Event Planning',
          url: '#',
          emoji: '📅',
        },
      ],
    },
    {
      name: 'Travel & Adventure',
      emoji: '🧳',
      pages: [
        {
          name: 'Trip Planning & Itineraries',
          url: '#',
          emoji: '🗺️',
        },
        {
          name: 'Travel Bucket List & Inspiration',
          url: '#',
          emoji: '🌎',
        },
        {
          name: 'Travel Journal & Photo Gallery',
          url: '#',
          emoji: '📸',
        },
      ],
    },
  ],
};

export const sidebarRightData: SidebarRightData = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  calendars: [
    {
      name: 'My Calendars',
      items: ['Personal', 'Work', 'Family'],
    },
    {
      name: 'Favorites',
      items: ['Holidays', 'Birthdays'],
    },
    {
      name: 'Other',
      items: ['Travel', 'Reminders', 'Deadlines'],
    },
  ],
};
