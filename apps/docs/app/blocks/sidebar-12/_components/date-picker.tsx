import { Calendar, cn, SidebarGroup, SidebarGroupContent } from '@codefast/ui';
import { type ComponentProps, type JSX } from 'react';

type DatePickerProps = ComponentProps<typeof SidebarGroup>;

export function DatePicker({ className, ...props }: DatePickerProps): JSX.Element {
  return (
    <SidebarGroup className={cn('px-0', className)} {...props}>
      <SidebarGroupContent>
        <Calendar
          classNames={{
            root: 'w-full',
            day: 'mx-0 min-h-8 min-w-8',
          }}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
