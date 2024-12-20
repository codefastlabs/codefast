import type { ComponentProps, JSX } from 'react';

import { Calendar, cn, SidebarGroup, SidebarGroupContent } from '@codefast/ui';

type DatePickerProps = ComponentProps<typeof SidebarGroup>;

export function DatePicker({ className, ...props }: DatePickerProps): JSX.Element {
  return (
    <SidebarGroup className={cn('px-0', className)} {...props}>
      <SidebarGroupContent>
        <Calendar
          classNames={{
            day: 'mx-0 min-h-8 min-w-8',
            root: 'w-full',
          }}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
