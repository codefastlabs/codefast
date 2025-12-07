import { Link } from '@tanstack/react-router';
import { cn } from '@codefast/tailwind-variants';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  HomeIcon,
  MenuIcon,
  NetworkIcon,
  PaletteIcon,
  SquareFunctionIcon,
  StickyNoteIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: ComponentProps<typeof Link>['to'];
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  to: ComponentProps<typeof Link>['to'];
  label: string;
  icon: LucideIcon;
  key: string;
  children: NavItem[];
}

const NAV_ITEMS: (NavItem | NavGroup)[] = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/demo/start/server-funcs', label: 'Start - Server Functions', icon: SquareFunctionIcon },
  { to: '/demo/start/api-request', label: 'Start - API Request', icon: NetworkIcon },
  {
    to: '/demo/start/ssr',
    label: 'Start - SSR Demos',
    icon: StickyNoteIcon,
    key: 'StartSSRDemo',
    children: [
      { to: '/demo/start/ssr/spa-mode', label: 'SPA Mode', icon: StickyNoteIcon },
      { to: '/demo/start/ssr/full-ssr', label: 'Full SSR', icon: StickyNoteIcon },
      { to: '/demo/start/ssr/data-only', label: 'Data Only', icon: StickyNoteIcon },
    ],
  },
  { to: '/demo/tanstack-query', label: 'TanStack Query', icon: NetworkIcon },
  { to: '/demo/tanstack-form', label: 'TanStack Form', icon: FileTextIcon },
  { to: '/demo/theme', label: 'Theme Demo', icon: PaletteIcon },
];

interface NavLinkProps {
  to: ComponentProps<typeof Link>['to'];
  label: string;
  icon: LucideIcon;
  onNavigate: ComponentProps<typeof Link>['onClick'];
}

function NavLink({ to, label, icon: Icon, onNavigate }: NavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800"
      activeProps={{
        className: "'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2'",
      }}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

interface NavGroupProps {
  group: NavGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

function NavGroupItem({ group, isExpanded, onToggle, onNavigate }: NavGroupProps) {
  const { to, label, icon: Icon, children } = group;

  return (
    <>
      <div className="flex flex-row justify-between">
        <Link
          to={to}
          onClick={onNavigate}
          className="mb-2 flex flex-1 items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800"
          activeProps={{
            className:
              "flex-1 'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2'",
          }}
        >
          <Icon size={20} />
          <span className="font-medium">{label}</span>
        </Link>
        <button
          onClick={onToggle}
          className="rounded-lg p-2 transition-colors hover:bg-gray-800"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronDownIcon size={20} /> : <ChevronRightIcon size={20} />}
        </button>
      </div>
      {isExpanded && (
        <div className="ml-4 flex flex-col">
          {children.map((child) => (
            <NavLink key={child.to} to={child.to} label={child.label} icon={child.icon} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [groupedExpanded, setGroupedExpanded] = useState<Record<string, boolean>>({});

  const handleClose = () => setIsOpen(false);
  const toggleGroup = (key: string) => {
    setGroupedExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <header className="flex items-center bg-gray-800 p-4 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-700"
          aria-label="Open menu"
        >
          <MenuIcon size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/">
            <img src="/tanstack-word-logo-white.svg" alt="TanStack Logo" className="h-10" />
          </Link>
        </h1>
      </header>

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-80 transform flex-col bg-gray-900 text-white shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-800"
            aria-label="Close menu"
          >
            <XIcon size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            if ('children' in item) {
              return (
                <NavGroupItem
                  key={item.key}
                  group={item}
                  isExpanded={groupedExpanded[item.key] ?? false}
                  onToggle={() => toggleGroup(item.key)}
                  onNavigate={handleClose}
                />
              );
            }
            return <NavLink key={item.to} to={item.to} label={item.label} icon={item.icon} onNavigate={handleClose} />;
          })}
        </nav>
      </aside>
    </>
  );
}
