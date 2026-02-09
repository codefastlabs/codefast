import { cn } from '@codefast/tailwind-variants';
import { Separator } from '@codefast/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@codefast/ui/sidebar';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ActiveThemeProvider } from '@/components/active-theme';
import { ModeSwitcher } from '@/components/mode-switcher';
import { AppBreadcrumbs } from '@/components/sink/app/app-breadcrumbs';
import { AppSidebar } from '@/components/sink/app/app-sidebar';
import { ThemeSelector } from '@/components/sink/app/theme-selector';

export const Route = createFileRoute('/sink')({
  component: SinkLayout,
});

function SinkLayout() {
  return (
    <ActiveThemeProvider>
      <SidebarProvider defaultOpen={true} className={cn('theme-container')}>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background sticky top-0 z-10 flex h-14 items-center border-b p-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-4 ml-2 h-4!" />
            <AppBreadcrumbs />
            <div className="ml-auto flex items-center gap-2">
              <ModeSwitcher />
              <ThemeSelector />
            </div>
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </ActiveThemeProvider>
  );
}
