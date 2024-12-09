import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  BellIcon,
  BlocksIcon,
  CalendarIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  HomeIcon,
  InboxIcon,
  LineChartIcon,
  LinkIcon,
  MessageCircleQuestionIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  Trash2Icon,
  TrashIcon,
  CommandIcon,
  AudioWaveformIcon,
} from 'lucide-react';

export const data = {
  actions: [
    [
      {
        icon: Settings2Icon,
        label: 'Customize Page',
      },
      {
        icon: FileTextIcon,
        label: 'Turn into wiki',
      },
    ],
    [
      {
        icon: LinkIcon,
        label: 'Copy Link',
      },
      {
        icon: CopyIcon,
        label: 'Duplicate',
      },
      {
        icon: CornerUpRightIcon,
        label: 'Move to',
      },
      {
        icon: Trash2Icon,
        label: 'Move to Trash',
      },
    ],
    [
      {
        icon: CornerUpLeftIcon,
        label: 'Undo',
      },
      {
        icon: LineChartIcon,
        label: 'View analytics',
      },
      {
        icon: GalleryVerticalEndIcon,
        label: 'Version History',
      },
      {
        icon: TrashIcon,
        label: 'Show delete pages',
      },
      {
        icon: BellIcon,
        label: 'Notifications',
      },
    ],
    [
      {
        icon: ArrowUpIcon,
        label: 'Import',
      },
      {
        icon: ArrowDownIcon,
        label: 'Export',
      },
    ],
  ],
  favorites: [
    {
      emoji: '📊',
      name: 'Project Management & Task Tracking',
      url: '#',
    },
    {
      emoji: '🍳',
      name: 'Family Recipe Collection & Meal Planning',
      url: '#',
    },
    {
      emoji: '💪',
      name: 'Fitness Tracker & Workout Routines',
      url: '#',
    },
    {
      emoji: '📚',
      name: 'Book Notes & Reading List',
      url: '#',
    },
    {
      emoji: '🌱',
      name: 'Sustainable Gardening Tips & Plant Care',
      url: '#',
    },
    {
      emoji: '🗣️',
      name: 'Language Learning Progress & Resources',
      url: '#',
    },
    {
      emoji: '🏠',
      name: 'Home Renovation Ideas & Budget Tracker',
      url: '#',
    },
    {
      emoji: '💰',
      name: 'Personal Finance & Investment Portfolio',
      url: '#',
    },
    {
      emoji: '🎬',
      name: 'Movie & TV Show Watchlist with Reviews',
      url: '#',
    },
    {
      emoji: '✅',
      name: 'Daily Habit Tracker & Goal Setting',
      url: '#',
    },
  ],
  navMain: [
    {
      icon: SearchIcon,
      title: 'Search',
      url: '#',
    },
    {
      icon: SparklesIcon,
      title: 'Ask AI',
      url: '#',
    },
    {
      icon: HomeIcon,
      isActive: true,
      title: 'Home',
      url: '#',
    },
    {
      badge: '10',
      icon: InboxIcon,
      title: 'Inbox',
      url: '#',
    },
  ],
  navSecondary: [
    {
      icon: CalendarIcon,
      title: 'Calendar',
      url: '#',
    },
    {
      icon: Settings2Icon,
      title: 'Settings',
      url: '#',
    },
    {
      icon: BlocksIcon,
      title: 'Templates',
      url: '#',
    },
    {
      icon: Trash2Icon,
      title: 'Trash',
      url: '#',
    },
    {
      icon: MessageCircleQuestionIcon,
      title: 'Help',
      url: '#',
    },
  ],
  teams: [
    {
      logo: CommandIcon,
      name: 'Acme Inc',
      plan: 'Enterprise',
    },
    {
      logo: AudioWaveformIcon,
      name: 'Acme Corp.',
      plan: 'Startup',
    },
    {
      logo: CommandIcon,
      name: 'Evil Corp.',
      plan: 'Free',
    },
  ],
  workspaces: [
    {
      emoji: '🏠',
      name: 'Personal Life Management',
      pages: [
        {
          emoji: '📔',
          name: 'Daily Journal & Reflection',
          url: '#',
        },
        {
          emoji: '🍏',
          name: 'Health & Wellness Tracker',
          url: '#',
        },
        {
          emoji: '🌟',
          name: 'Personal Growth & Learning Goals',
          url: '#',
        },
      ],
    },
    {
      emoji: '💼',
      name: 'Professional Development',
      pages: [
        {
          emoji: '🎯',
          name: 'Career Objectives & Milestones',
          url: '#',
        },
        {
          emoji: '🧠',
          name: 'Skill Acquisition & Training Log',
          url: '#',
        },
        {
          emoji: '🤝',
          name: 'Networking Contacts & Events',
          url: '#',
        },
      ],
    },
    {
      emoji: '🎨',
      name: 'Creative Projects',
      pages: [
        {
          emoji: '✍️',
          name: 'Writing Ideas & Story Outlines',
          url: '#',
        },
        {
          emoji: '🖼️',
          name: 'Art & Design Portfolio',
          url: '#',
        },
        {
          emoji: '🎵',
          name: 'Music Composition & Practice Log',
          url: '#',
        },
      ],
    },
    {
      emoji: '🏡',
      name: 'Home Management',
      pages: [
        {
          emoji: '💰',
          name: 'Household Budget & Expense Tracking',
          url: '#',
        },
        {
          emoji: '🔧',
          name: 'Home Maintenance Schedule & Tasks',
          url: '#',
        },
        {
          emoji: '📅',
          name: 'Family Calendar & Event Planning',
          url: '#',
        },
      ],
    },
    {
      emoji: '🧳',
      name: 'Travel & Adventure',
      pages: [
        {
          emoji: '🗺️',
          name: 'Trip Planning & Itineraries',
          url: '#',
        },
        {
          emoji: '🌎',
          name: 'Travel Bucket List & Inspiration',
          url: '#',
        },
        {
          emoji: '📸',
          name: 'Travel Journal & Photo Gallery',
          url: '#',
        },
      ],
    },
  ],
};
