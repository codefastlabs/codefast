import { cn, SidebarGroup, SidebarGroupContent, Calendar } from '@codefast/ui';
import { type ComponentProps, type JSX } from 'react';

type DatePickerProps = ComponentProps<typeof SidebarGroup>;

export function DatePicker({ className, ...props }: DatePickerProps): JSX.Element {
  return (
    <SidebarGroup className={cn('px-0', className)} {...props}>
      <SidebarGroupContent>
        <Calendar className="[&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:w-[33px]" />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
