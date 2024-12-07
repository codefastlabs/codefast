import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@codefast/ui';
import { ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-react';
import { type JSX } from 'react';

import { type TreeNode } from '@/app/blocks/sidebar-11/_lib/mocks/data';

interface TreeProps {
  item: TreeNode;
}

export function Tree({ item }: TreeProps): JSX.Element {
  const [name, ...items] = Array.isArray(item) ? item : [item];

  if (items.length === 0) {
    return (
      <SidebarMenuButton className="data-[active=true]:bg-transparent" isActive={name === 'button.tsx'}>
        <FileIcon />
        {name}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === 'components' || name === 'ui'}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRightIcon className="transition-transform" />
            <FolderIcon />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem, index) => (
              // eslint-disable-next-line react/no-array-index-key -- key is safe
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
