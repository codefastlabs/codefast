import {
  AudioWaveformIcon,
  BookOpenIcon,
  BotIcon,
  CommandIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  PieChartIcon,
  Settings2Icon,
  SquareTerminalIcon,
  MapIcon,
  type LucideIcon,
} from 'lucide-react';

interface User {
  avatar: string;
  email: string;
  name: string;
}

interface Team {
  logo: LucideIcon;
  name: string;
  plan: string;
}

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavItem[];
}

interface Project {
  icon: LucideIcon;
  name: string;
  url: string;
}

interface Data {
  navMain: NavItem[];
  projects: Project[];
  teams: Team[];
  user: User;
}

export const data: Data = {
  user: {
    name: 'codefast',
    email: 'm@example.com',
    avatar: '/avatars/01.png',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEndIcon,
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
      title: 'Playground',
      url: '#',
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
    },
    {
      title: 'Models',
      url: '#',
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
    },
    {
      title: 'Documentation',
      url: '#',
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
    },
    {
      title: 'Settings',
      url: '#',
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
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: FrameIcon,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChartIcon,
    },
    {
      name: 'Travel',
      url: '#',
      icon: MapIcon,
    },
  ],
};
