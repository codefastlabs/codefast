import { Link } from '@tanstack/react-router';
import { cn } from '@codefast/tailwind-variants';
import { CodeIcon, HomeIcon, MenuIcon, PaletteIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Image } from '@unpic/react';
import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: ComponentProps<typeof Link>['to'];
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/theme', label: 'Theme', icon: PaletteIcon },
  { to: '/sink', label: 'Sink', icon: CodeIcon },
];

function NavLink({
  to,
  label,
  icon: Icon,
  onNavigate,
}: {
  to: ComponentProps<typeof Link>['to'];
  label: string;
  icon: LucideIcon;
  onNavigate: () => void;
}) {
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

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

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
            <Image
              src="/tanstack-word-logo-white.svg"
              alt="TanStack Logo"
              layout="constrained"
              aspectRatio={3178 / 660}
              className="h-10"
              height={40}
            />
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
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} label={item.label} icon={item.icon} onNavigate={handleClose} />
          ))}
        </nav>
      </aside>
    </>
  );
}
