import {
  BookOpenIcon,
  BotIcon,
  FrameIcon,
  LifeBuoyIcon,
  MapIcon,
  PieChartIcon,
  SendIcon,
  Settings2Icon,
  SquareTerminalIcon,
} from 'lucide-react';

export const data = {
  navMain: [
    {
      icon: SquareTerminalIcon,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
      title: 'Playground',
      url: '#',
    },
    {
      icon: BotIcon,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
      title: 'Models',
      url: '#',
    },
    {
      icon: BookOpenIcon,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
      title: 'Documentation',
      url: '#',
    },
    {
      icon: Settings2Icon,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
      title: 'Settings',
      url: '#',
    },
  ],
  navSecondary: [
    {
      icon: LifeBuoyIcon,
      title: 'Support',
      url: '#',
    },
    {
      icon: SendIcon,
      title: 'Feedback',
      url: '#',
    },
  ],
  projects: [
    {
      icon: FrameIcon,
      name: 'Design Engineering',
      url: '#',
    },
    {
      icon: PieChartIcon,
      name: 'Sales & Marketing',
      url: '#',
    },
    {
      icon: MapIcon,
      name: 'Travel',
      url: '#',
    },
  ],
  user: {
    avatar: '/avatars/01.png',
    email: 'm@example.com',
    name: 'codefast',
  },
};
