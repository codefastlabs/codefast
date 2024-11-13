import {
  cn,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@codefast/ui';
import { FileIcon } from 'lucide-react';
import { type ComponentProps, type JSX } from 'react';

import { Tree } from '@/app/blocks/sidebar-11/_components/tree';
import { data } from '@/app/blocks/sidebar-11/_lib/mocks/data';

type AppSidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebar({ className, ...props }: AppSidebarProps): JSX.Element {
  return (
    <Sidebar className={cn('', className)} {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.changes.map((item) => (
                <SidebarMenuItem key={item.file}>
                  <SidebarMenuButton>
                    <FileIcon />
                    {item.file}
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{item.state}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.tree.map((item, index) => (
                // eslint-disable-next-line react/no-array-index-key -- key is safe
                <Tree key={index} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
