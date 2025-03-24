'use client';

import type { JSX } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@codefast/ui';
import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { RegistryGroup } from '@/types/registry';

export interface NavItemProps {
  groups: RegistryGroup[];
  path: string;
  title: string;
}

interface NavMainProps {
  items: NavItemProps[];
}

const createHref = (basePath: string, slug: string | undefined): string => {
  if (!slug) {
    return basePath;
  }

  return `${basePath}/${slug}`;
};

function ComponentList({
  components,
  basePath,
  currentPath,
}: {
  basePath: string;
  components: RegistryGroup['components'];
  currentPath: string;
}): JSX.Element {
  return (
    <SidebarMenuSub className="ml-2.5 mr-0">
      {components?.map((component) => {
        const href = createHref(basePath, component.slug);
        const isActive = currentPath === href;

        return (
          <SidebarMenuSubItem key={href}>
            <SidebarMenuSubButton asChild isActive={isActive}>
              <Link href={href}>{component.title}</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      })}
    </SidebarMenuSub>
  );
}

function NavGroup({
  group,
  itemPath,
  pathname,
}: {
  group: RegistryGroup;
  itemPath: string;
  pathname: string;
}): JSX.Element {
  const hasComponents = Boolean(group.components?.length);
  const groupHref = createHref(itemPath, group.slug);
  const isActive = pathname === groupHref;

  return (
    <SidebarMenuSubItem key={group.name}>
      {hasComponents ? (
        <>
          <SidebarGroupLabel className="font-mono text-xs font-semibold uppercase">{group.name}</SidebarGroupLabel>
          <ComponentList basePath={itemPath} components={group.components} currentPath={pathname} />
        </>
      ) : (
        <SidebarMenuSubButton asChild isActive={isActive}>
          <Link href={groupHref}>{group.name}</Link>
        </SidebarMenuSubButton>
      )}
    </SidebarMenuSubItem>
  );
}

export function NavMain({ items }: NavMainProps): JSX.Element {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <span>{item.title}</span>
                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent asChild>
                <SidebarMenuSub className="ml-2.5 mr-0">
                  {item.groups.map((group) => (
                    <NavGroup key={group.name} group={group} itemPath={item.path} pathname={pathname} />
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
