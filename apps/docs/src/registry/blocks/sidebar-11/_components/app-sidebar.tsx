import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@codefast/ui";
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

export interface Change {
  file: string;
  state: "A" | "D" | "M" | "U"; // M for Modified, U for Untracked, A for Added, D for Deleted
}

export type TreeNode = [string, ...TreeNode[]] | string;

export interface Data {
  changes: Change[];
  tree: TreeNode[];
}

// This is sample data.
const data: Data = {
  changes: [
    {
      file: "README.md",
      state: "M",
    },
    {
      file: "api/hello/route.ts",
      state: "U",
    },
    {
      file: "app/layout.tsx",
      state: "M",
    },
  ],
  tree: [
    ["app", ["api", ["hello", ["route.ts"]], "page.tsx", "layout.tsx", ["blog", ["page.tsx"]]]],
    ["components", ["ui", "button.tsx", "card.tsx"], "header.tsx", "footer.tsx"],
    ["lib", ["util.ts"]],
    ["public", "favicon.ico", "vercel.svg"],
    ".eslintrc.json",
    ".gitignore",
    "next.config.js",
    "tailwind.config.js",
    "package.json",
    "README.md",
  ],
};

function Tree({ item }: { item: TreeNode }): JSX.Element {
  const [name, ...items] = Array.isArray(item) ? item : [item];

  if (items.length === 0) {
    return (
      <SidebarMenuButton className="data-[active=true]:bg-transparent" isActive={name === "button.tsx"}>
        <FileIcon />
        {name}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === "components" || name === "ui"}
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
              // biome-ignore lint/suspicious/noArrayIndexKey: need
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.changes.map((item, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: need
                <SidebarMenuItem key={index}>
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
                // biome-ignore lint/suspicious/noArrayIndexKey: need
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
