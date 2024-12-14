import {
  type LucideIcon,
  AudioWaveformIcon,
  BookOpenIcon,
  BotIcon,
  CommandIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  MapIcon,
  PieChartIcon,
  Settings2Icon,
  SquareTerminalIcon,
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
  teams: [
    {
      logo: GalleryVerticalEndIcon,
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
  user: {
    avatar: '/avatars/01.png',
    email: 'm@example.com',
    name: 'codefast',
  },
};
